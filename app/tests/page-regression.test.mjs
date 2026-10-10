import test from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { runInNewContext } from 'node:vm'
import * as mines from '../game/minesweeper.mjs'
import * as snake from '../game/snake.mjs'
import * as tetris from '../game/tetris.mjs'
import * as oral from '../math/oral.mjs'

// Execute actual page methods with fake storage and time; no real intervals or phone are needed.
function loadPage(name, bindings) {
  const source = readFileSync(new URL(`../pages/${name}.vue`, import.meta.url), 'utf8')
  const script = source.match(/<script>([\s\S]*?)<\/script>/)[1]
    .replace(/^import .*$/gm, '').replace('export default', 'const page =')
  let now = 100000
  let nextId = 0
  const timers = new Map()
  const page = runInNewContext(`${script}\npage`, {
    ...bindings,
    Math: Object.assign(Object.create(Math), { random: () => .314 }),
    arcadeStore: { read: () => ({ version: 1, best: {} }), save: () => {} },
    bestText: () => '',
    oralStore: { read: oral.emptyState },
    Date: class extends Date { static now() { return now } },
    setInterval: callback => { timers.set(++nextId, callback); return nextId },
    clearInterval: id => timers.delete(id)
  })
  const state = page.data()
  for (const [name, method] of Object.entries(page.methods)) state[name] = method.bind(state)
  return { source, state, timers, hide: () => page.onHide?.call(state), show: () => page.onShow?.call(state),
    advance(seconds) { now += seconds * 1000; for (const callback of [...timers.values()]) callback.call(state) } }
}

test('flag mode marks and unmarks a real mine without revealing or losing', () => {
  const { state } = loadPage('games/minesweeper', mines)
  state.board = mines.createBoard(() => .314, 0, 0)
  const index = state.board.cells.findIndex(cell => cell.mine)
  const row = Math.floor(index / state.boardCols)
  const col = index % state.boardCols
  state.flagMode = true
  state.tap(row, col)
  assert.equal(state.board.cells[index].state, 'flagged')
  assert.equal(state.finished, false)
  state.tap(row, col)
  assert.equal(state.board.cells[index].state, 'hidden')
  state.flagMode = false
  state.tap(row, col)
  assert.equal(state.result, 'lose')
})

for (const [name, engine] of [['snake', snake], ['tetris', tetris]]) {
  test(`${name} pauses on hide, preserves the board and continues with one tap`, () => {
    const page = loadPage(`games/${name}`, engine)
    page.state.start()
    const before = JSON.stringify(name === 'snake' ? page.state.snake : page.state.piece)
    assert.equal(page.timers.size, 1)
    page.hide()
    assert.equal(page.state.running, false)
    assert.equal(page.timers.size, 0)
    page.advance(5)
    assert.equal(JSON.stringify(name === 'snake' ? page.state.snake : page.state.piece), before)
    page.show()
    assert.equal(page.timers.size, 0)
    page.state.start()
    assert.equal(page.state.running, true)
    assert.equal(page.timers.size, 1)
    page.advance(1)
    assert.notEqual(JSON.stringify(name === 'snake' ? page.state.snake : page.state.piece), before)
    page.hide()
    assert.equal(page.timers.size, 0)
  })
}

test('minesweeper resumes its elapsed-time display after returning without duplicate timers', () => {
  const page = loadPage('games/minesweeper', mines)
  page.state.tap(0, 0)
  page.advance(3)
  assert.equal(page.state.seconds, 3)
  page.hide()
  page.advance(7)
  page.show()
  assert.equal(page.state.seconds, 10)
  assert.equal(page.timers.size, 1)
  page.show()
  assert.equal(page.timers.size, 1)
  page.advance(2)
  assert.equal(page.state.seconds, 12)
  page.state.finished = true
  page.hide()
  page.show()
  assert.equal(page.timers.size, 0)
})

test('oral quiz renders elapsed time and resumes display updates after returning', () => {
  const page = loadPage('learning/oral-daily', oral)
  page.state.beginQuestions([{ id: 'test', text: '2×3', answer: 6 }], 'daily')
  page.advance(65)
  const field = page.source.match(/用时 \{\{ (\w+) \}\}/)[1]
  assert.equal(page.state[field], '1 分 5 秒')
  page.hide()
  assert.equal(page.timers.size, 0)
  page.advance(5)
  page.show()
  assert.equal(page.state[field], '1 分 10 秒')
  assert.equal(page.timers.size, 1)
  page.show()
  assert.equal(page.timers.size, 1)
  page.advance(1)
  assert.equal(page.state[field], '1 分 11 秒')
  page.state.finished = true
  page.hide()
  page.show()
  assert.equal(page.timers.size, 0)
})
