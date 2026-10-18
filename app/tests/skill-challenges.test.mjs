import test from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { runInNewContext } from 'node:vm'
import * as mines from '../game/minesweeper.mjs'
import * as jump from '../game/jump.mjs'
import * as skill from '../game/skill-challenges.mjs'

function seedRandom(seed) { let value = seed; return () => { value = (value * 1664525 + 1013904223) >>> 0; return value / 4294967296 } }
function land(state, offset = 0, random = () => .5) {
  const charge = (state.next.x + offset - state.player.x - 45) / 180
  assert.ok(charge >= 0 && charge <= 1.2)
  assert.equal(jump.launchJump(state, charge), true)
  for (let i = 0; i < 16; i++) jump.stepJump(state, .05, random)
}

test('three mines difficulties keep their declared density and the opening neighborhood safe', () => {
  assert.deepEqual(skill.MINES_LEVELS.map(level => [level.rows, level.cols, level.mines]), [[6, 6, 5], [8, 8, 10], [10, 10, 18]])
  for (const level of skill.MINES_LEVELS) for (let seed = 1; seed <= 15; seed++) {
    const row = seed % level.rows; const col = (seed * 3) % level.cols
    const board = mines.createBoard(seedRandom(seed), row, col, level.rows, level.cols, level.mines)
    assert.equal(board.cells.length, level.rows * level.cols)
    assert.equal(board.cells.filter(cell => cell.mine).length, level.mines)
    for (const [r, c] of [[row, col], ...mines.neighborCells(level.rows, level.cols, row, col)]) assert.equal(board.cells[r * board.cols + c].mine, false)
    const opened = mines.reveal(board, row, col)
    assert.equal(opened.hit, false)
    assert.ok(opened.revealed >= 4)
  }
})

test('all jump difficulties are finite and every center is reachable within the hold limit', () => {
  for (const level of skill.JUMP_LEVELS) {
    assert.ok(level.minGap - level.startWidth / 2 >= jump.jumpDistance(0))
    assert.ok(level.maxGap + level.startWidth / 2 <= jump.jumpDistance(1.2))
    for (const seed of [1, 7, 99]) {
      const random = seedRandom(seed)
      const state = jump.createJump(random, level.id)
      state.status = 'running'
      for (let i = 0; i < 10; i++) land(state, 0, random)
      assert.equal(state.status, 'complete')
      assert.equal(state.landings, 10)
      assert.equal(state.centers, 10)
      assert.equal(state.passed, true)
      assert.equal(state.score, 200)
      assert.equal(jump.launchJump(state, 1), false)
    }
  }
  for (const level of skill.JUMP_LEVELS) {
    const state = jump.createJump(() => .999, level.id); state.status = 'running'
    for (let i = 0; i < 9; i++) {
      assert.ok(state.next.x + state.next.width / 2 - state.camera <= 312.001)
      assert.ok(state.player.x - state.camera > 25)
      land(state, -state.next.width / 2 + .1, () => .999)
    }
  }
  assert.throws(() => jump.createJump(Math.random, 'unknown'), /难度/)
})

test('center goals require actual precision and ten safe non-center landings are not enough for advanced tiers', () => {
  for (const level of skill.JUMP_LEVELS) {
    const state = jump.createJump(() => .5, level.id)
    state.status = 'running'
    for (let i = 0; i < 10; i++) land(state, level.centerRadius + 1)
    assert.equal(state.landings, 10)
    assert.equal(state.centers, 0)
    assert.equal(state.passed, level.centers === 0)
    if (level.centers) assert.match(state.feedback, /中心落点/)
  }
})

test('miss feedback distinguishes too short and too long; paused or invalid time cannot move a flight', () => {
  const short = jump.createJump(() => .5, 'hard'); short.status = 'running'
  jump.launchJump(short, 0); const before = JSON.stringify(short.player)
  short.status = 'paused'; jump.stepJump(short, 100)
  assert.equal(JSON.stringify(short.player), before)
  short.status = 'running'; jump.stepJump(short, NaN)
  assert.equal(JSON.stringify(short.player), before)
  for (let i = 0; i < 16; i++) jump.stepJump(short, .05)
  assert.equal(short.miss, 'short'); assert.match(short.feedback, /多蓄力/)
  const long = jump.createJump(() => 0, 'easy'); long.status = 'running'
  jump.launchJump(long, 1.2); for (let i = 0; i < 16; i++) jump.stepJump(long, .05)
  assert.equal(long.miss, 'long'); assert.match(long.feedback, /少蓄力/)
  assert.equal(long.passed, false)
})

test('skill evidence separates each difficulty, caps rewards at six and improves performance without repeat stars', () => {
  let state = skill.emptySkillChallenges()
  for (const level of skill.MINES_LEVELS) state = skill.recordSkillChallenge(state, 'mines', level.id, { seconds: 100, at: 1 })
  for (const level of skill.JUMP_LEVELS) state = skill.recordSkillChallenge(state, 'jump', level.id, { score: 140, centers: 4, landings: 10, at: 2 })
  assert.deepEqual({ ...skill.summarizeSkillChallenges(state), best: undefined }, { mines: 3, jump: 3, total: 6, best: undefined })
  const improved = skill.recordSkillChallenge(state, 'mines', 'hard', { seconds: 70, at: 3 })
  assert.equal(improved.best.mines.hard.seconds, 70)
  assert.equal(state.best.mines.hard.seconds, 100)
  assert.equal(skill.recordSkillChallenge(improved, 'mines', 'hard', { seconds: 90, at: 4 }).best.mines.hard.seconds, 70)
  assert.equal(skill.summarizeSkillChallenges(improved).mines, 3)
  assert.throws(() => skill.recordSkillChallenge(state, 'jump', 'hard', { score: 130, centers: 3, landings: 10, at: 4 }), /尚未达成/)
  assert.throws(() => skill.recordSkillChallenge(state, 'jump', 'hard', { score: 200, centers: 10, landings: 9, at: 4 }), /尚未达成/)
  assert.throws(() => skill.recordSkillChallenge(state, 'jump', 'normal', { score: 999, centers: 4, landings: 10, at: 4 }), /尚未达成/)
})

test('failed or corrupt skill writes do not award stars; repeating a saved result is idempotent', () => {
  let value = ''; let fail = true; let writes = 0
  const store = skill.createSkillChallengesStore({ get: () => value, set: (key, next) => { assert.equal(key, skill.SKILL_CHALLENGES_KEY); if (fail) throw new Error('full'); value = JSON.stringify(next); writes++ } })
  const result = { seconds: 40, at: 1 }
  assert.throws(() => store.save('mines', 'easy', result), /full/)
  assert.equal(skill.summarizeSkillChallenges(store.read()).mines, 0)
  fail = false; store.save('mines', 'easy', result); store.save('mines', 'easy', result)
  assert.equal(writes, 1)
  assert.equal(skill.summarizeSkillChallenges(store.read()).mines, 1)
  for (const broken of ['{broken', { version: 2 }, { version: 1, best: { mines: 3, jump: {} } }, { version: 1, best: { mines: { old: result }, jump: {} } }]) {
    value = broken
    assert.throws(() => store.save('mines', 'normal', result), /无法识别/)
    assert.equal(writes, 1)
  }
})

function actualPage(name, bindings, storage) {
  const source = readFileSync(new URL(`../pages/games/${name}.vue`, import.meta.url), 'utf8')
  const script = source.match(/<script>([\s\S]*?)<\/script>/)[1].replace(/^import .*$/gm, '').replace('export default', 'const page =')
  let now = 100000; let nextId = 0; const timers = new Map(); let legacyWrites = 0
  const definition = runInNewContext(`${script}\npage`, { ...skill, ...bindings, Math, skillChallengesStore: skill.createSkillChallengesStore(storage),
    arcadeStore: { read: () => ({ version: 1, best: {} }), save: () => { legacyWrites++ } }, bestText: () => '', Date: class extends Date { static now() { return now } },
    setInterval: callback => { timers.set(++nextId, callback); return nextId }, clearInterval: id => timers.delete(id) })
  const page = definition.data()
  for (const [name, method] of Object.entries(definition.methods)) page[name] = method.bind(page)
  return { page, timers, legacyWrites: () => legacyWrites, advance(seconds) { now += seconds * 1000; for (const callback of [...timers.values()]) callback.call(page) } }
}

test('actual mines page selects different grids, protects flag-first opening and retries without mixing legacy best', () => {
  let value = ''; let fail = true
  const test = actualPage('minesweeper', mines, { get: () => value, set: (key, next) => { if (fail) throw new Error('full'); value = next } })
  const page = test.page
  page.flagMode = true; page.tap(0, 0); assert.equal(page.board, null)
  page.selectLevel('hard'); page.tap(4, 4)
  assert.equal(page.board.cols, 10); assert.equal(page.board.mines, 18)
  assert.equal(page.board.cells[44].mine, false)
  for (let index = 0; index < page.board.cells.length && !page.finished; index++) if (!page.board.cells[index].mine) page.tap(Math.floor(index / 10), index % 10)
  assert.equal(page.result, 'win'); assert.ok(page.pending)
  assert.equal(Object.keys(page.progress.best.mines).length, 0)
  assert.equal(test.timers.size, 0)
  fail = false; page.saveWin(); page.saveWin()
  assert.equal(page.pending, null); assert.equal(Object.keys(page.progress.best.mines).length, 1)
  assert.equal(test.legacyWrites(), 0)
})

test('actual jump page preserves selected difficulty and retries finite win evidence without duplicate timers', () => {
  let value = ''; let fail = true
  const test = actualPage('jump', jump, { get: () => value, set: (key, next) => { if (fail) throw new Error('full'); value = next } })
  const page = test.page
  page.selectLevel('hard'); page.start(); page.start(); assert.equal(test.timers.size, 1)
  assert.equal(page.game.level, 'hard')
  for (let i = 0; i < 10; i++) land(page.game)
  page.frame(); assert.equal(test.timers.size, 0)
  assert.ok(page.pending); assert.equal(Object.keys(page.progress.best.jump).length, 0)
  fail = false; page.saveRound(); page.saveRound()
  assert.equal(page.pending, null); assert.equal(Object.keys(page.progress.best.jump).length, 1)
  assert.equal(test.legacyWrites(), 0)
  page.start(); assert.equal(page.game.level, 'hard'); assert.equal(test.timers.size, 1)
  page.pause(); assert.equal(test.timers.size, 0)
})
