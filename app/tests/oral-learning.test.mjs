import test from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { runInNewContext } from 'node:vm'
import * as oral from '../math/oral.mjs'
import * as learning from '../math/oral-learning.mjs'

const example = (kind = 'm1') => oral.buildRound(() => .314, { [kind]: 1 })[0]
const result = (question, correct, sourceKey) => ({ question, correct, ...(sourceKey ? { sourceKey } : {}) })
const session = (id, date, mode, results) => ({ id, date, mode, results })
const first = (correct = false) => session('first', '2026-10-18', 'daily', [result(example(), correct)])
const review = (state, id, date, correct = true) => {
  const q = learning.buildReviewRound(state, date, () => .314)[0]
  return session(id, date, 'review', [result(q, correct, q.sourceKey)])
}

for (const kind of oral.KIND_ORDER) {
  test(`${kind} produces a distinct same-kind variant even with a repeating random source`, () => {
    const q = example(kind)
    const changed = oral.buildVariant(q, () => .314)
    const changedAgain = oral.buildVariant(q, () => .314, [changed.text])
    assert.equal(changed.kind, kind)
    assert.notEqual(changed.text, q.text)
    assert.notEqual(changedAgain.text, changed.text)
    assert.equal(oral.judgeAnswer(changed, changed.answer).correct, true)
    const explanation = oral.explainQuestion(changed)
    assert.equal(explanation.title, oral.KIND_LABELS[kind])
    assert.equal(explanation.steps.length, 3)
    assert.ok(explanation.steps.join('').includes(String(changed.answer)))
  })
}

test('explanations show exact decompositions and label estimation instead of claiming equality', () => {
  const q = (kind, text, answer, unit = '') => ({ kind, text, answer, unit, accept: [answer] })
  assert.deepEqual(oral.explainQuestion(q('m1', '27×4', 108)).steps,
    ['把 27 拆成 20 和 7。', '20×4＝80，7×4＝28。', '两部分相加：80＋28＝108。'])
  assert.match(oral.explainQuestion(q('sw-add', '25万＋17万', 42, '万')).steps[2], /42万/)
  assert.match(oral.explainQuestion(q('sw-sub', '25万－17万', 8, '万')).steps[2], /8万/)
  assert.match(oral.explainQuestion(q('m2', '240×3', 720)).steps[2], /72 个十.*720/)
  assert.match(oral.explainQuestion(q('m3', '24×30', 720)).steps[1], /24×3＝72/)
  assert.match(oral.explainQuestion(q('d1', '360÷60', 6)).steps[1], /36÷6＝6/)
  assert.match(oral.explainQuestion(q('est-m', '39×21≈', 800)).steps[2], /39×21≈800/)
  assert.match(oral.explainQuestion(q('est-d', '357÷60≈', 6)).steps[0], /357≈360/)
  assert.match(oral.explainQuestion(q('est-d', '357÷60≈', 6)).steps[2], /这是估算/)
  assert.match(oral.explainQuestion(q('m1', '27×4', 99)).steps[0], /不一致/)
  assert.match(oral.explainQuestion(q('m1', '旧格式', 108)).steps[0], /无法解析/)
  assert.match(oral.explainQuestion({ kind: 'm1' }).steps[0], /无法解析/)
})

test('legacy history and duplicate wrong entries are preserved while review tasks are deduplicated', () => {
  const question = example()
  const legacy = oral.recordAttempt(oral.emptyState(), { id: 'old', date: '2026-10-17', correct: 18, seconds: 40, endedAt: 1 },
    [1, 2].map(at => ({ ...question, wrongAnswer: '0', at })))
  const before = JSON.stringify(legacy)
  const storage = { [oral.ORAL_KEY]: before }
  const store = learning.createOralLearningStore({ get: key => storage[key], set: (key, value) => { storage[key] = value } })
  const imported = store.read()
  assert.equal(imported.cards.length, 1)
  assert.equal(store.summary('2026-10-18').due, 1)
  assert.equal(store.summary('2026-10-18').firstTotal, 0)
  assert.equal(storage[oral.ORAL_KEY], before)
  const saved = store.save(review(imported, 'review-old', '2026-10-18'))
  assert.equal(saved.cards[0].stage, 'verify')
  assert.equal(storage[oral.ORAL_KEY], before)
  assert.equal(oral.readState(storage[oral.ORAL_KEY]).wrongBook.length, 2)
})

test('first-response statistics are per kind and reviews do not inflate first-response accuracy', () => {
  const initial = learning.emptyLearningState()
  const daily = session('mixed', '2026-10-18', 'daily', [result(example(), false), result(example('d1'), true)])
  const next = learning.recordLearningSession(initial, daily)
  const summary = learning.summarizeLearning(next, '2026-10-18')
  assert.equal(summary.firstTotal, 2)
  assert.equal(summary.firstCorrect, 1)
  assert.equal(summary.kinds.find(k => k.kind === 'm1').accuracy, 0)
  assert.equal(summary.kinds.find(k => k.kind === 'd1').accuracy, 100)
  assert.equal(summary.kinds.find(k => k.kind === 'm3').accuracy, null)
  const practiced = learning.recordLearningSession(next, review(next, 'r1', '2026-10-18'))
  const counts = learning.summarizeLearning(practiced, '2026-10-18')
  assert.equal(counts.firstTotal, 2)
  assert.equal(counts.kinds.find(k => k.kind === 'm1').reviewTotal, 1)
  assert.equal(initial.cards.length, 0)
})

test('one correct variant schedules tomorrow; only a different correct variant on a later day masters the task', () => {
  const initial = learning.recordLearningSession(learning.emptyLearningState(), first())
  const firstReview = review(initial, 'r1', '2026-10-18')
  const verified = learning.recordLearningSession(initial, firstReview)
  assert.equal(verified.cards[0].stage, 'verify')
  assert.equal(verified.cards[0].due, '2026-10-19')
  assert.equal(learning.summarizeLearning(verified, '2026-10-18').waiting, 1)
  assert.equal(learning.buildReviewRound(verified, '2026-10-18').length, 0)
  assert.equal(learning.summarizeLearning(verified, '2026-10-19').due, 1)
  assert.throws(() => learning.recordLearningSession(verified, { ...firstReview, id: 'r-same-day' }), /尚未到期|任务已变更/)
  const secondReview = review(verified, 'r2', '2026-10-19')
  assert.notEqual(firstReview.results[0].question.text, secondReview.results[0].question.text)
  const mastered = learning.recordLearningSession(verified, secondReview)
  assert.equal(mastered.cards[0].stage, 'mastered')
  assert.equal(learning.summarizeLearning(mastered, '2026-10-19').mastered, 1)
  assert.equal(learning.buildReviewRound(mastered, '2026-10-19').length, 0)
  const wrongAgain = learning.recordLearningSession(mastered, { ...first(), id: 'wrong-again', date: '2026-10-20' })
  assert.equal(wrongAgain.cards[0].stage, 'new')
})

test('wrong review resets verification and original questions cannot count as variants', () => {
  const initial = learning.recordLearningSession(learning.emptyLearningState(), first())
  const verified = learning.recordLearningSession(initial, review(initial, 'r1', '2026-10-18'))
  const failed = learning.recordLearningSession(verified, review(verified, 'r2', '2026-10-19', false))
  assert.equal(failed.cards[0].stage, 'new')
  assert.equal(learning.summarizeLearning(failed, '2026-10-19').mastered, 0)
  assert.throws(() => learning.recordLearningSession(initial, session('cheat', '2026-10-18', 'review', [result(example(), true, initial.cards[0].key)])), /任务已变更/)
  const unknown = oral.buildVariant(example())
  assert.throws(() => learning.recordLearningSession(initial, session('unknown', '2026-10-18', 'review', [result(unknown, true, 'absent')])), /任务已变更/)
})

test('failed writes never report saved progress and retries are idempotent even after partial daily saves', () => {
  const values = {}; let fail = true; let writes = 0
  const storage = { get: key => values[key], set(key, value) { if (key === learning.ORAL_LEARNING_KEY && fail) throw new Error('full'); writes++; values[key] = value } }
  const checkin = oral.createOralStore(storage)
  const progress = learning.createOralLearningStore(storage)
  const attempt = { id: 'daily-1', date: '2026-10-18', correct: 19, seconds: 60, endedAt: 100 }
  checkin.saveOnce(attempt)
  assert.throws(() => progress.save(first()), /full/)
  assert.equal(progress.read().sessions.length, 0)
  assert.equal(checkin.read().history.length, 1)
  fail = false
  checkin.saveOnce(attempt)
  progress.save(first())
  checkin.saveOnce(attempt)
  progress.save(first())
  assert.equal(checkin.read().history.length, 1)
  assert.equal(progress.summary('2026-10-18').firstTotal, 1)
  assert.equal(writes, 2)
  assert.throws(() => progress.save(first(true)), /已有其他结果/)
  assert.throws(() => checkin.saveOnce({ ...attempt, correct: 20 }), /另一份成绩/)
})

test('corrupt or impossible learning saves cannot be overwritten by a new session', () => {
  for (const bad of ['{broken', { version: 2 }, { version: 1, stats: { m1: { firstTotal: 1, firstCorrect: 2, reviewTotal: 0, reviewCorrect: 0 } }, cards: [], sessions: [] }]) {
    let writes = 0
    const store = learning.createOralLearningStore({ get: key => key === learning.ORAL_LEARNING_KEY ? bad : '', set: () => { writes++ } })
    assert.throws(() => store.save(first()), /无法识别/)
    assert.equal(writes, 0)
  }
  const good = learning.recordLearningSession(learning.emptyLearningState(), first())
  assert.throws(() => learning.readLearningState({ ...good, cards: [good.cards[0], good.cards[0]] }), /无法识别/)
  assert.throws(() => learning.recordLearningSession(good, { ...first(), id: 'bad-date', date: '2026-02-30' }), /不完整/)
  assert.throws(() => learning.recordLearningSession(good, { ...first(), id: 'duplicate', results: [first().results[0], first().results[0]] }), /不完整/)
  assert.deepEqual(learning.readLearningState(JSON.stringify(good)), good)
})

test('actual page keeps the first answer, offers explanations and does not claim completion until both saves succeed', () => {
  const source = readFileSync(new URL('../pages/learning/oral-daily.vue', import.meta.url), 'utf8')
  const script = source.match(/<script>([\s\S]*?)<\/script>/)[1].replace(/^import .*$/gm, '').replace('export default', 'const page =')
  const values = {}; let fail = true
  const storage = { get: key => values[key], set(key, value) { if (key === learning.ORAL_LEARNING_KEY && fail) throw new Error('full'); values[key] = JSON.parse(JSON.stringify(value)) } }
  const oralStore = oral.createOralStore(storage); const oralLearningStore = learning.createOralLearningStore(storage)
  const definition = runInNewContext(`${script}\npage`, { ...oral, ...learning, oralStore, oralLearningStore, Date, Math, setInterval: () => 1, clearInterval: () => {} })
  const page = definition.data()
  for (const [name, method] of Object.entries(definition.methods)) page[name] = method.bind(page)
  page.beginQuestions(oral.buildRound(), 'daily')
  page.questions[0].userAnswer = '-999'; page.checkQuestion(0)
  assert.equal(page.questions[0].isCorrect, false)
  page.questions[0].userAnswer = String(page.questions[0].answer); page.checkQuestion(0)
  assert.equal(page.questions[0].isCorrect, false)
  for (let index = 1; index < page.questions.length; index++) { page.questions[index].userAnswer = String(page.questions[index].answer); page.checkQuestion(index) }
  assert.equal(page.lastResult.saved, false)
  assert.match(page.lastResult.heading, /等待保存/)
  assert.equal(page.lastResult.wrong.length, 1)
  assert.equal(page.lastResult.wrong[0].userAnswer, '-999')
  assert.equal(page.lastResult.wrong[0].explanation.steps.length, 3)
  assert.equal(oralStore.read().history.length, 1)
  fail = false; page.saveResult(); page.saveResult()
  assert.equal(page.lastResult.saved, true)
  assert.equal(oralStore.read().history.length, 1)
  assert.equal(oralLearningStore.summary().firstTotal, 20)
  assert.equal(oralLearningStore.summary().firstCorrect, 19)
})
