import test from 'node:test'
import assert from 'node:assert/strict'
import { ORAL_KEY, DAILY_COUNT, KIND_LABELS, KIND_ORDER, DAILY_QUOTAS, ROUND_MODE_LABELS, quotasForMode, buildRound, buildWrongRound, judgeAnswer, emptyState, dayKey, readState, recordAttempt, pruneWrong, hasCheckIn, streak, summarize, createOralStore, WRONG_BOOK_LIMIT } from '../math/oral.mjs'

// 固定种子 PRNG，保证同一序列可复现，用于逐题验证生成器语义。
function mulberry32(seed) {
  let a = seed >>> 0
  return () => {
    a |= 0; a = (a + 0x6D2B79F5) | 0
    let t = Math.imul(a ^ (a >>> 15), 1 | a)
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}
const parse = {
  'sw-add': text => text.match(/^(\d+)万＋(\d+)万$/).slice(1).map(Number),
  'sw-sub': text => text.match(/^(\d+)万－(\d+)万$/).slice(1).map(Number),
  'm1': text => text.match(/^(\d+)×(\d+)$/).slice(1).map(Number),
  'm2': text => text.match(/^(\d+)×(\d+)$/).slice(1).map(Number),
  'm3': text => text.match(/^(\d+)×(\d+)$/).slice(1).map(Number),
  'd1': text => text.match(/^(\d+)÷(\d+)$/).slice(1).map(Number),
  'est-m': text => text.match(/^(\d+)×(\d+)≈$/).slice(1).map(Number),
  'est-d': text => text.match(/^(\d+)÷(\d+)≈$/).slice(1).map(Number)
}
const expected = {
  'sw-add': ([a, b], q) => { assert.equal(q.answer, a + b); assert.deepEqual(q.accept, [a + b]); assert.equal(q.unit, '万') },
  'sw-sub': ([a, b], q) => { assert.ok(a > b); assert.equal(q.answer, a - b); assert.deepEqual(q.accept, [a - b]); assert.equal(q.unit, '万') },
  'm1': ([a, b], q) => { assert.ok(a >= 12 && a <= 89 && b >= 3 && b <= 9 && a * b <= 999); assert.equal(q.answer, a * b) },
  'm2': ([a, b], q) => { assert.ok(a >= 110 && a <= 490 && a % 10 === 0 && b >= 2 && b <= 4); assert.equal(q.answer, a * b) },
  'm3': ([a, b], q) => { assert.ok(a >= 11 && a <= 49 && [20, 30, 40, 50].includes(b)); assert.equal(q.answer, a * b) },
  'd1': ([a, b], q) => { assert.ok([20, 30, 40, 50, 60, 70, 80].includes(b) && a % b === 0 && a <= 1000); assert.equal(q.answer, a / b) },
  'est-m': ([a, b], q) => { assert.equal(q.answer, Math.round(a / 10) * 10 * (Math.round(b / 10) * 10)); assert.ok(q.accept.includes(a * b)) },
  'est-d': ([a, b], q) => { assert.equal(Math.round(a / 10) * 10, b * q.answer); assert.ok(q.accept.includes(q.answer)) }
}

test('daily quota builds exactly 20 questions with stable kind labels', () => {
  assert.equal(DAILY_COUNT, 20)
  assert.equal(Object.values(DAILY_QUOTAS).reduce((sum, n) => sum + n, 0), 20)
  assert.deepEqual(Object.keys(KIND_LABELS), KIND_ORDER)
  const round = buildRound(mulberry32(7))
  const counts = Object.fromEntries(KIND_ORDER.map(kind => [kind, round.filter(q => q.kind === kind).length]))
  assert.deepEqual(counts, DAILY_QUOTAS)
  for (const question of round) {
    assert.ok(question.id && question.text && question.accept.length, JSON.stringify(question))
    assert.equal(typeof question.unit, 'string')
  }
})
test('seeded rounds reproduce the same questions and keep every text unique', () => {
  const first = buildRound(mulberry32(42)).map(q => q.text)
  const second = buildRound(mulberry32(42)).map(q => q.text)
  assert.deepEqual(first, second)
  for (const seed of [1, 2, 3, 5, 8, 13, 21, 34, 55, 89]) {
    const round = buildRound(mulberry32(seed))
    assert.equal(round.length, 20)
    assert.equal(new Set(round.map(q => q.text)).size, 20)
  }
})
test('every generated answer agrees with the textbook semantics of its kind', () => {
  for (let seed = 1; seed <= 30; seed += 1) {
    for (const question of buildRound(mulberry32(seed))) {
      const numbers = parse[question.kind](question.text)
      expected[question.kind](numbers, question)
    }
  }
})
test('default buildRound works without an injected random source', () => {
  const round = buildRound()
  assert.equal(round.length, 20)
  assert.equal(new Set(round.map(q => q.id)).size, 20)
})
test('judging accepts exact answers, estimates and 万-suffixed input, rejects the rest', () => {
  const exact = { accept: [42], answer: 42, unit: '', text: '25万＋17万' }
  assert.equal(judgeAnswer(exact, 42).correct, true)
  assert.equal(judgeAnswer(exact, '42').correct, true)
  assert.equal(judgeAnswer(exact, '42万').correct, true)
  assert.equal(judgeAnswer(exact, ' 42 ').correct, true)
  assert.equal(judgeAnswer(exact, 43).correct, false)
  assert.equal(judgeAnswer(exact, '').correct, false)
  assert.equal(judgeAnswer(exact, 'abc').correct, false)
  const estimate = { accept: [800, 819], answer: 800, unit: '', text: '39×21≈' }
  assert.equal(judgeAnswer(estimate, '800').correct, true)
  assert.equal(judgeAnswer(estimate, '819').correct, true)
  assert.equal(judgeAnswer(estimate, '801').correct, false)
  assert.throws(() => judgeAnswer({ answer: 1 }, 1))
  assert.equal(judgeAnswer(exact, '').expected, '42')
})
test('readState accepts empty, strings and objects; rejects broken or duplicate records', () => {
  assert.deepEqual(readState(''), emptyState())
  assert.deepEqual(readState(null), emptyState())
  const attempt = { id: 'abc', date: '2026-10-06', correct: 18, seconds: 95, endedAt: 1e12 }
  const state = recordAttempt(emptyState(), attempt)
  assert.deepEqual(readState(JSON.stringify(state)), state)
  assert.deepEqual(readState(state), state)
  assert.throws(() => readState('{broken'))
  assert.throws(() => readState({ version: 2, history: [] }))
  assert.throws(() => readState({ version: 1, history: {} }))
  assert.throws(() => readState({ version: 1, history: [{ ...state.history[0], id: 'nope' }] }))
  assert.throws(() => readState({ version: 1, history: [state.history[0], state.history[0]] }))
  assert.throws(() => readState({ version: 1, history: [{ ...state.history[0], date: '2026-13-01' }] }))
  assert.throws(() => readState({ version: 1, history: [{ ...state.history[0], correct: 21 }] }))
  assert.throws(() => readState({ version: 1, history: [{ ...state.history[0], correct: -1 }] }))
  assert.throws(() => readState({ version: 1, history: [{ ...state.history[0], total: 10 }] }))
  assert.throws(() => readState({ version: 1, history: [{ ...state.history[0], seconds: 86400 }] }))
})
test('recordAttempt prepends a validated record and refuses repeats or invalid data', () => {
  const state = emptyState()
  const first = recordAttempt(state, { id: 'a', date: '2026-10-05', correct: 20, seconds: 60, endedAt: 1 })
  assert.equal(first.history[0].id, 'oral-a')
  assert.equal(first.history[0].total, DAILY_COUNT)
  const second = recordAttempt(first, { id: 'b', date: '2026-10-06', correct: 19, seconds: 70, endedAt: 2 })
  assert.deepEqual(second.history.map(record => record.id), ['oral-b', 'oral-a'])
  assert.deepEqual(first.history.map(record => record.id), ['oral-a'])
  assert.throws(() => recordAttempt(second, { id: 'b', date: '2026-10-06', correct: 18, seconds: 70, endedAt: 3 }))
  assert.throws(() => recordAttempt(state, { id: 'c', date: '2026-10-06', correct: 25, seconds: 70, endedAt: 4 }))
  assert.throws(() => recordAttempt(state, { id: 'd', date: '2026-10-06', correct: 18, seconds: -1, endedAt: 5 }))
})
test('streak counts consecutive days back from today or yesterday', () => {
  const day = (offset, id) => ({ id: `oral-${id}`, date: dayKey(new Date(Date.now() - offset * 86400000)), correct: 20, total: 20, seconds: 60, endedAt: 1 })
  const today = dayKey()
  assert.equal(streak({ version: 1, history: [day(0, 't')] }), 1)
  assert.equal(streak({ version: 1, history: [day(1, 'y'), day(2, 'd2'), day(3, 'd3')] }, today), 3)
  assert.equal(streak({ version: 1, history: [day(0, 't'), day(1, 'y'), day(3, 'd3')] }, today), 2)
  assert.equal(streak({ version: 1, history: [day(4, 'old')] }, today), 0)
  assert.equal(streak(emptyState()), 0)
  assert.equal(hasCheckIn({ version: 1, history: [day(0, 't')] }), true)
  assert.equal(hasCheckIn({ version: 1, history: [day(1, 'y')] }), false)
})
test('summarize reports streaks, distinct days and today best', () => {
  const day = (offset, correct, id) => ({ id: `oral-${id}`, date: dayKey(new Date(Date.now() - offset * 86400000)), correct, total: 20, seconds: 60, endedAt: 1 })
  const state = { version: 1, history: [day(0, 18, 'a'), day(0, 20, 'b'), day(1, 12, 'c'), day(2, 15, 'd')] }
  const summary = summarize(state)
  assert.equal(summary.days, 3)
  assert.equal(summary.rounds, 4)
  assert.equal(summary.streak, 3)
  assert.equal(summary.todayDone, true)
  assert.equal(summary.todayBest, 20)
  const idle = summarize(emptyState())
  assert.deepEqual({ days: idle.days, rounds: idle.rounds, todayDone: idle.todayDone, todayBest: idle.todayBest }, { days: 0, rounds: 0, todayDone: false, todayBest: 0 })
})
test('failed storage writes throw instead of reporting a saved round', () => {
  let stored = JSON.stringify(emptyState())
  const broken = createOralStore({ get: key => { assert.equal(key, ORAL_KEY); return stored }, set: () => { throw new Error('full') } })
  assert.throws(() => broken.save({ id: 'x', date: '2026-10-06', correct: 20, seconds: 60, endedAt: 1 }), /full/)
  assert.deepEqual(broken.read(), emptyState())
  const working = createOralStore({ get: () => stored, set: (key, value) => { stored = JSON.stringify(value) } })
  const next = working.save({ id: 'x', date: '2026-10-06', correct: 20, seconds: 60, endedAt: 1 })
  assert.equal(next.history[0].correct, 20)
  assert.equal(working.read().history.length, 1)
})
test('dayKey formats local dates as YYYY-MM-DD', () => {
  assert.equal(dayKey(new Date(2026, 9, 6)), '2026-10-06')
  assert.equal(dayKey(new Date(2026, 0, 1)), '2026-01-01')
})

// —— 练习模式：全部 / 只练乘除 ——

test('quotasForMode serves all and multiply-divide-only modes and rejects unknown ones', () => {
  assert.deepEqual(Object.keys(ROUND_MODE_LABELS), ['all', 'md'])
  assert.deepEqual(quotasForMode('all'), DAILY_QUOTAS)
  const md = quotasForMode('md')
  assert.equal(Object.values(md).reduce((sum, n) => sum + n, 0), DAILY_COUNT)
  assert.ok(Object.keys(md).every(kind => !kind.startsWith('sw-')))
  const round = buildRound(mulberry32(3), md)
  assert.equal(round.length, DAILY_COUNT)
  assert.ok(round.every(question => !question.kind.startsWith('sw-')))
  assert.equal(new Set(round.map(q => q.text)).size, DAILY_COUNT)
  assert.throws(() => quotasForMode('sw-only'))
  assert.throws(() => quotasForMode('toString'))
})

// —— 错题本：打卡时写入、读取迁移、重练与移除 ——

const wrongItem = (id, kind, over = {}) => ({ id, kind, text: '25×4', answer: 100, unit: '', accept: [100], note: '', wrongAnswer: '80', at: 1, ...over })

test('empty state and legacy v1 records gain an empty wrong book without losing data', () => {
  assert.deepEqual(emptyState(), { version: 1, history: [], wrongBook: [] })
  const legacy = { version: 1, history: [{ id: 'oral-legacy', date: '2026-10-01', correct: 18, total: DAILY_COUNT, seconds: 60, endedAt: 1 }] }
  const migrated = readState(JSON.stringify(legacy))
  assert.deepEqual(migrated.wrongBook, [])
  assert.deepEqual(migrated.history, legacy.history)
})

test('readState validates the wrong book shape instead of silently repairing it', () => {
  const good = { version: 1, history: [], wrongBook: [wrongItem('m1-25x4', 'm1')] }
  assert.deepEqual(readState(good), good)
  assert.throws(() => readState({ version: 1, history: [], wrongBook: {} }))
  assert.throws(() => readState({ version: 1, history: [], wrongBook: [wrongItem('x', 'm1', { answer: 1.5 })] }))
  assert.throws(() => readState({ version: 1, history: [], wrongBook: [wrongItem('x', 'nope')] }))
  assert.throws(() => readState({ version: 1, history: [], wrongBook: [wrongItem('x', 'm1', { accept: [] })] }))
  assert.throws(() => readState({ version: 1, history: [], wrongBook: [wrongItem('x', 'm1', { wrongAnswer: 80 })] }))
  assert.throws(() => readState({ version: 1, history: [], wrongBook: [wrongItem('x', 'm1', { at: '昨天' })] }))
  const full = Array.from({ length: WRONG_BOOK_LIMIT + 1 }, (_, i) => wrongItem(`m1-x${i}`))
  assert.throws(() => readState({ version: 1, history: [], wrongBook: full }))
})

test('recordAttempt appends wrong questions newest-first and caps the book at 50', () => {
  const attempt = { id: 'a', date: '2026-10-05', correct: 17, seconds: 60, endedAt: 1 }
  // 新一轮的错题排在旧错题前面，轮内保持做题顺序。
  const state = recordAttempt(emptyState(), attempt, [wrongItem('q1', 'm1'), wrongItem('q2', 'd1')])
  assert.deepEqual(state.wrongBook.map(entry => entry.id), ['q1', 'q2'])
  const kept = recordAttempt(state, { id: 'b', date: '2026-10-06', correct: 20, seconds: 60, endedAt: 2 })
  assert.deepEqual(kept.wrongBook, state.wrongBook)
  const burst = Array.from({ length: 60 }, (_, i) => wrongItem(`q-${i}`, 'm1'))
  const capped = recordAttempt(emptyState(), attempt, burst)
  assert.equal(capped.wrongBook.length, WRONG_BOOK_LIMIT)
  assert.deepEqual(capped.wrongBook.map(entry => entry.id), burst.slice(0, 50).map(item => item.id))
  assert.throws(() => recordAttempt(state, { id: 'c', date: '2026-10-07', correct: 18, seconds: 60, endedAt: 3 }, [wrongItem('q3', 'm1', { text: '' })]))
  assert.deepEqual(state.wrongBook.map(entry => entry.id), ['q1', 'q2'])
})

test('buildWrongRound rebuilds the newest wrong questions and stops at twenty', () => {
  assert.deepEqual(buildWrongRound(emptyState()), [])
  const state = recordAttempt(emptyState(), { id: 'a', date: '2026-10-05', correct: 18, seconds: 60, endedAt: 1 }, [
    wrongItem('q1', 'est-m', { text: '39×21≈', answer: 800, accept: [800, 819] }),
    wrongItem('q2', 'd1', { text: '360÷60', answer: 6, accept: [6] })
  ])
  const round = buildWrongRound(state)
  assert.deepEqual(round.map(question => question.id), ['q1', 'q2'])
  assert.deepEqual(round.map(question => question.text), ['39×21≈', '360÷60'])
  assert.deepEqual(round[0].accept, [800, 819])
  const big = recordAttempt(emptyState(), { id: 'b', date: '2026-10-06', correct: 0, seconds: 60, endedAt: 2 },
    Array.from({ length: 30 }, (_, i) => wrongItem(`q-${i}`, 'm1')))
  assert.equal(buildWrongRound(big).length, DAILY_COUNT)
})

test('pruneWrong drops answered questions and keeps the rest of the state', () => {
  const state = recordAttempt(emptyState(), { id: 'a', date: '2026-10-05', correct: 18, seconds: 60, endedAt: 1 },
    [wrongItem('q1', 'm1'), wrongItem('q1', 'm1', { wrongAnswer: '90' }), wrongItem('q2', 'd1')])
  const pruned = pruneWrong(state, ['q1'])
  assert.deepEqual(pruned.wrongBook.map(entry => entry.id), ['q2'])
  assert.deepEqual(pruned.history, state.history)
  assert.deepEqual(state.wrongBook.map(entry => entry.id), ['q1', 'q1', 'q2'])
  assert.equal(readState(pruned).wrongBook.length, 1)
})

test('store persists wrong book with the round and never overwrites unreadable data', () => {
  let stored = JSON.stringify(emptyState())
  const store = createOralStore({ get: () => stored, set: (key, value) => { stored = JSON.stringify(value) } })
  const saved = store.save({ id: 'x', date: '2026-10-06', correct: 17, seconds: 60, endedAt: 1 }, [wrongItem('q1', 'm1')])
  assert.deepEqual(saved.wrongBook.map(entry => entry.id), ['q1'])
  const pruned = store.pruneWrong(['q1'])
  assert.deepEqual(pruned.wrongBook, [])
  assert.deepEqual(JSON.parse(stored).wrongBook, [])
  // 读取失败：不改写旧值，也不显示保存成功。
  stored = '{broken'
  const brokenStore = createOralStore({ get: () => stored, set: () => { throw new Error('should not write') } })
  assert.throws(() => brokenStore.save({ id: 'y', date: '2026-10-07', correct: 20, seconds: 60, endedAt: 2 }), /无法识别/)
  assert.throws(() => brokenStore.pruneWrong(['q1']), /无法识别/)
  assert.equal(stored, '{broken')
  // 写入失败：抛错而不是谎报成功。
  const failing = createOralStore({ get: () => JSON.stringify(emptyState()), set: () => { throw new Error('full') } })
  assert.throws(() => failing.save({ id: 'z', date: '2026-10-06', correct: 20, seconds: 60, endedAt: 3 }, [wrongItem('q1', 'm1')]), /full/)
  assert.throws(() => failing.pruneWrong(['q1']), /full/)
})
