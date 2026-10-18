import test from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { runInNewContext } from 'node:vm'
import * as mines from '../game/minesweeper.mjs'
import * as snake from '../game/snake.mjs'
import * as tetris from '../game/tetris.mjs'
import * as oral from '../math/oral.mjs'
import * as plane from '../game/plane.mjs'
import * as jump from '../game/jump.mjs'
import * as match from '../game/match.mjs'
import * as matchLevels from '../game/match-levels.mjs'
import * as lab from '../lab/experiments.mjs'
import * as skillChallenges from '../game/skill-challenges.mjs'

// Execute actual page methods with fake storage and time; no real intervals or phone are needed.
function loadPage(name, bindings) {
  const source = readFileSync(new URL(`../pages/${name}.vue`, import.meta.url), 'utf8')
  const script = source.match(/<script>([\s\S]*?)<\/script>/)[1]
    .replace(/^import .*$/gm, '').replace('export default', 'const page =')
  let now = 100000
  let nextId = 0
  const timers = new Map()
  const page = runInNewContext(`${script}\npage`, {
    ...skillChallenges,
    ...bindings,
    Math: Object.assign(Object.create(Math), { random: () => .314 }),
    arcadeStore: { read: () => ({ version: 1, best: {} }), save: () => {} },
    bestText: () => '',
    oralStore: { read: oral.emptyState },
    Date: class extends Date { static now() { return now } },
    setInterval: callback => { timers.set(++nextId, callback); return nextId },
    clearInterval: id => timers.delete(id),
    setTimeout: callback => { timers.set(++nextId, callback); return nextId },
    clearTimeout: id => timers.delete(id)
  })
  const state = page.data()
  for (const [name, method] of Object.entries(page.methods)) state[name] = method.bind(state)
  return { source, state, timers, hide: () => page.onHide?.call(state), show: () => page.onShow?.call(state),
    advance(seconds) { now += seconds * 1000; for (const callback of [...timers.values()]) callback.call(state) } }
}

test('flag mode marks and unmarks a real mine without revealing or losing', () => {
  const { state } = loadPage('games/minesweeper', mines)
  state.board = mines.createBoard(() => .314, 0, 0)
  state.boardCols = state.board.cols
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

test('plane page pauses on hide and resumes without resetting the mission or accumulating intervals', () => {
  const page = loadPage('games/plane', plane)
  page.state.draw = () => {}
  page.state.start()
  page.advance(1)
  const before = JSON.stringify(page.state.game)
  page.hide()
  assert.equal(page.state.game.status, 'paused')
  assert.equal(page.timers.size, 0)
  page.advance(100)
  assert.equal(page.state.game.time, JSON.parse(before).time)
  page.state.start()
  page.state.start()
  assert.equal(page.timers.size, 1)
  assert.equal(page.state.game.score, JSON.parse(before).score)
  page.hide()
})
test('lab page stops its experiment animation and sound when hidden', () => {
  const page = loadPage('lab/index', lab)
  page.state.selected = lab.EXPERIMENTS.find(e => e.id === 'ramp')
  page.state.params = lab.defaults(page.state.selected)
  page.state.result = lab.observe('ramp', page.state.params)
  page.state.draw = () => {}
  let stopped = 0
  page.state.audio = { stop: () => stopped++ }
  page.state.run()
  assert.equal(page.timers.size, 1)
  page.hide()
  assert.equal(page.timers.size, 0)
  assert.equal(stopped, 1)
})

test('tetris touch tap rotates, horizontal drag moves and downward release drops once',()=>{
 const {state}=loadPage('games/tetris',tetris);state.start();let rotations=0,drops=0;const shifts=[];state.rotate=()=>rotations++;state.move=dx=>shifts.push(dx);state.drop=()=>drops++;
 const e=(x,y)=>({touches:[{clientX:x,clientY:y}]});state.gestureStart(e(100,100));state.gestureEnd();assert.equal(rotations,1);
 state.gestureStart(e(100,100));state.gestureMove(e(151,100));state.gestureEnd();assert.deepEqual(shifts,[1,1]);assert.equal(rotations,1);
 state.gestureStart(e(100,100));state.gestureMove(e(100,160));state.gestureEnd();state.gestureEnd();assert.equal(drops,1);
 state.gestureStart(e(100,100));state.gestureMove(e(100,160));state.gestureCancel();state.gestureEnd();assert.equal(drops,1);
})

test('plane releases the drag anchor on cancel and pause',()=>{const {state}=loadPage('games/plane',plane);state.game.status='running';state.rect={left:0,top:0,width:320,height:480};state.touchStart({touches:[{x:20,y:20}]});assert.equal(state.game.player.x,160);state.touch({touches:[{x:50,y:20}]});assert.equal(state.game.player.x,190);state.endDrag();state.touch({touches:[{x:100,y:20}]});assert.equal(state.game.player.x,190);state.touchStart({touches:[{x:50,y:20}]});state.pause();assert.equal(state.dragAnchor,null)})
test('match passes early, failed writes do not unlock levels or replace corrupt saves',()=>{let stored='',fail=false,writes=0;const uni={getStorageSync:()=>stored,setStorageSync:(key,value)=>{if(fail)throw new Error('full');writes++;stored=value}};const {state}=loadPage('games/match',{...match,...matchLevels,uni});state.score=180;state.movesLeft=15;fail=true;state.finish();assert.equal(state.passed,true);assert.equal(state.progress.unlocked,1);assert.match(state.error,/进度没能保存/);fail=false;state.saveProgress();assert.equal(state.progress.unlocked,2);assert.equal(writes,1);stored={version:99,unlocked:1};assert.throws(()=>state.saveProgress(),/无法识别/);assert.equal(writes,1)})
test('jump cancels held touch on hide and resumes flight with only one interval',()=>{const page=loadPage('games/jump',jump);page.state.start();page.state.hold();page.advance(.5);assert.ok(page.state.charge>0);page.hide();assert.equal(page.state.holding,false);assert.equal(page.state.game.flight,null);assert.equal(page.timers.size,0);page.state.start();page.state.hold();page.advance(.6);page.state.release();assert.ok(page.state.game.flight);page.hide();const before=page.state.game.player.x;page.state.start();page.advance(.025);assert.ok(page.state.game.player.x>before);assert.equal(page.timers.size,1)})
