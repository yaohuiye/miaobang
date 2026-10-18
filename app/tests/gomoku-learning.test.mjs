import test from 'node:test'
import assert from 'node:assert/strict'
import { lessons, puzzles, puzzleById, GOMOKU_RULES } from '../data/gomoku-lessons.mjs'
import { placeStone, winningLine, winningMoves, analyzeStraightLines } from '../game/gomoku.mjs'
import {
  GOMOKU_LEARNING_KEY, makePuzzleBoard, judgePuzzle, readGomokuLearning,
  summarizeGomokuLearning, recordGomokuPuzzle, createGomokuLearningStore, createGomokuAttempt
} from '../game/gomoku-learning.mjs'

const answers = puzzle => {
  const board = makePuzzleBoard(puzzle), moves = []
  for (let row = 0; row < puzzle.size; row++) for (let col = 0; col < puzzle.size; col++) {
    if (board[row][col] === 0 && judgePuzzle(puzzle, row, col).correct) moves.push({ row, col })
  }
  return moves
}
const testPuzzle = (objective, black, white, toPlay = 1) => ({
  id: 'custom-check', size: 9, toPlay, objective, explanation: '检查真实局面。',
  stones: [...black.map(([row, col]) => ({ row, col, player: 1 })), ...white.map(([row, col]) => ({ row, col, player: 2 }))]
})

test('eight short lessons use family freestyle terms and stable distinct puzzle IDs', () => {
  assert.equal(lessons.length, 8)
  assert.equal(puzzles.length, 16)
  assert.equal(new Set(lessons.map(lesson => lesson.id)).size, lessons.length)
  assert.equal(new Set(puzzles.map(puzzle => puzzle.id)).size, puzzles.length)
  assert.match(GOMOKU_RULES.description, /五颗及以上/)
  assert.match(GOMOKU_RULES.description, /不设禁手/)
  for (const lesson of lessons) {
    for (const field of ['title', 'subtitle', 'observe', 'formula', 'mistake', 'explanation']) assert.ok(lesson[field])
    assert.equal(lesson.puzzleIds.length, 2)
    for (const id of lesson.puzzleIds) assert.equal(puzzleById[id].lessonId, lesson.id)
  }
  assert.match(lessons.find(lesson => lesson.id === 'straight-three').mistake, /跳三/)
  assert.match(lessons.find(lesson => lesson.id === 'open-four').explanation, /没有更快获胜威胁/)
})

test('every puzzle is a legal nonterminal turn with at least one engine-verified answer', () => {
  for (const puzzle of puzzles) {
    const board = makePuzzleBoard(puzzle)
    assert.equal(board.length, 9, puzzle.id)
    assert.equal(new Set(puzzle.stones.map(stone => `${stone.row},${stone.col}`)).size, puzzle.stones.length, puzzle.id)
    const black = puzzle.stones.filter(stone => stone.player === 1).length
    const white = puzzle.stones.filter(stone => stone.player === 2).length
    assert.equal(black - white, puzzle.toPlay === 1 ? 0 : 1, puzzle.id)
    assert.ok(puzzle.stones.every(stone => !winningLine(board, stone.row, stone.col).length), puzzle.id)
    const own = winningMoves(board, puzzle.toPlay), enemy = winningMoves(board, 3 - puzzle.toPlay)
    assert.ok(!(own.length && enemy.length), puzzle.id + ' must not ask two players to ignore an immediate win')
    if (['block', 'attack-defense'].includes(puzzle.objective)) assert.equal(enemy.length, 1, puzzle.id)
    else assert.equal(enemy.length, 0, puzzle.id)
    const moves = answers(puzzle)
    assert.ok(moves.length > 0, puzzle.id)
    assert.ok(moves.length < 81 - puzzle.stones.length, puzzle.id)
    for (const move of moves) {
      const next = placeStone(board, move.row, move.col, puzzle.toPlay)
      const win = winningLine(next, move.row, move.col)
      assert.ok(win.length || !winningMoves(next, 3 - puzzle.toPlay).length, puzzle.id)
      if (puzzle.objective === 'win') assert.ok(win.length >= 5, puzzle.id)
      if (puzzle.objective === 'open-four') {
        assert.ok(analyzeStraightLines(next, move.row, move.col).some(line => line.kind === 'open-four'), puzzle.id)
        assert.ok(winningMoves(next, puzzle.toPlay).length >= 2, puzzle.id)
      }
      if (puzzle.objective === 'straight-three') assert.ok(analyzeStraightLines(next, move.row, move.col).some(line => line.kind === 'straight-open-three'), puzzle.id)
      if (puzzle.objective === 'rush-four') assert.equal(winningMoves(next, puzzle.toPlay).length, 1, puzzle.id)
      if (puzzle.objective === 'fork') assert.ok(winningMoves(next, puzzle.toPlay).length >= 2, puzzle.id)
      if (puzzle.objective === 'attack-defense') assert.ok(winningMoves(next, puzzle.toPlay).length > 0, puzzle.id)
    }
  }
})

test('multiple correct endpoints, rotations and gap fours are judged by board geometry', () => {
  for (const id of ['five-line-row', 'one-move-win-antidiagonal', 'open-four-row', 'straight-three-column', 'rush-four-row']) assert.equal(answers(puzzleById[id]).length, 2, id)
  const rotated = { ...puzzleById['open-four-row'], id: 'unlisted-position', stones: puzzleById['open-four-row'].stones.map(stone => ({ ...stone, row: stone.col, col: 8 - stone.row })) }
  assert.deepEqual(answers(rotated), [{ row: 2, col: 4 }, { row: 6, col: 4 }])
  assert.equal(judgePuzzle(puzzleById['rush-four-row'], 4, 7).correct, true)
  assert.equal(judgePuzzle(puzzleById['open-four-row'], 4, 7).correct, false)
  const longLine = testPuzzle('win', [[4, 1], [4, 2], [4, 3], [4, 5], [4, 6]], [[0, 0], [0, 2], [2, 0], [8, 8], [8, 6]])
  assert.equal(judgePuzzle(longLine, 4, 4).correct, true)
  assert.equal(judgePuzzle(longLine, 4, 4).highlights.length, 6)
  const before = JSON.stringify(puzzleById['five-line-row'])
  assert.equal(judgePuzzle(puzzleById['five-line-row'], -1, 0).correct, false)
  assert.equal(judgePuzzle(puzzleById['five-line-row'], 4, 2).correct, false)
  assert.equal(JSON.stringify(puzzleById['five-line-row']), before)
})

test('urgent threats outrank creating shapes; defense accepts a direct win and rejects partial blocking', () => {
  const directWin = testPuzzle('block', [[2, 1], [2, 2], [2, 3], [2, 4]], [[6, 1], [6, 2], [6, 3], [6, 4]])
  assert.equal(judgePuzzle(directWin, 2, 5).correct, true)
  const partialBlock = testPuzzle('block', [[0, 0], [0, 2], [2, 0], [8, 8]], [[4, 2], [4, 3], [4, 4], [4, 5]])
  assert.equal(judgePuzzle(partialBlock, 4, 1).correct, false)
  const urgent = testPuzzle('open-four', [[2, 3], [2, 4], [2, 5], [6, 0]], [[6, 1], [6, 2], [6, 3], [6, 4]])
  assert.equal(judgePuzzle(urgent, 2, 2).correct, false)
})

test('straight-three excludes jump threes and squeezed three patterns with no open-four continuation', () => {
  assert.equal(judgePuzzle(puzzleById['straight-three-row'], 4, 6).correct, false)
  const cramped = testPuzzle('straight-three', [[4, 3], [4, 4]], [[4, 1], [4, 7]])
  assert.equal(judgePuzzle(cramped, 4, 5).correct, false)
  const border = testPuzzle('straight-three', [[4, 1], [4, 2]], [[4, 5]])
  assert.equal(judgePuzzle(border, 4, 3).correct, false)
  assert.equal(judgePuzzle(puzzleById['open-four-row'], 4, 2).correct, true)
  assert.equal(judgePuzzle({ ...puzzleById['open-four-row'], objective: 'fork' }, 4, 2).correct, false)
})

test('hint, revealed answer or a wrong move grants practice but a fresh independent round can earn its badge', () => {
  const id = 'five-line-row'
  const hinted = createGomokuAttempt(id)
  hinted.help()
  const helpedResult = hinted.tryMove(4, 1)
  assert.equal(helpedResult.correct, true)
  assert.equal(helpedResult.independent, false)
  let state = recordGomokuPuzzle('', id, { independent: helpedResult.independent })
  assert.deepEqual(summarizeGomokuLearning(state), {
    practiced: 1, independent: 0, total: 16,
    byLesson: Object.fromEntries(lessons.map(lesson => [lesson.id, { practiced: lesson.id === 'five-line' ? 1 : 0, independent: 0, total: 2 }]))
  })
  const wrong = createGomokuAttempt(id)
  assert.equal(wrong.tryMove(1, 1).correct, false)
  assert.equal(wrong.tryMove(4, 6).independent, false)
  const retry = createGomokuAttempt(id)
  assert.equal(retry.tryMove(4, 6).independent, true)
  retry.help()
  assert.deepEqual(retry.progress(), { passed: true, independent: true })
  state = recordGomokuPuzzle(state, id, { independent: true })
  state = recordGomokuPuzzle(state, id, { independent: false })
  assert.equal(summarizeGomokuLearning(state).independent, 1)
  assert.throws(() => createGomokuAttempt('toString'))
})

test('old partial progress remains valid as the current catalog grows and unknown stable IDs are retained', () => {
  const old = { version: 1, practiced: ['five-line-row', 'retired-puzzle'], independent: ['retired-puzzle'] }
  const read = readGomokuLearning(JSON.stringify(old))
  assert.deepEqual(read, old)
  assert.equal(summarizeGomokuLearning(read).practiced, 1)
  assert.equal(summarizeGomokuLearning(read).independent, 0)
  assert.equal(summarizeGomokuLearning(read).total, puzzles.length)
  read.practiced.push('open-four-row')
  assert.equal(old.practiced.length, 2)
  assert.throws(() => recordGomokuPuzzle('', 'toString'))
})

test('bad records are never replaced; failed writes retry safely and repeated passes are idempotent', () => {
  let raw = '', fail = false, writes = 0
  const store = createGomokuLearningStore({
    get(key) { assert.equal(key, GOMOKU_LEARNING_KEY); return raw },
    set(key, value) { assert.equal(key, GOMOKU_LEARNING_KEY); writes++; if (fail) throw new Error('storage full'); raw = value }
  })
  store.save('five-line-row', { independent: false })
  assert.equal(writes, 1)
  store.save('five-line-row', { independent: false })
  assert.equal(writes, 1)
  fail = true
  assert.throws(() => store.save('five-line-row', { independent: true }), /storage full/)
  assert.equal(store.read().independent.length, 0)
  fail = false
  store.save('five-line-row', { independent: true })
  store.mark('five-line-row', { independent: true })
  assert.equal(writes, 3)
  assert.equal(store.read().independent.length, 1)
  for (const broken of ['{oops', { version: 2, practiced: [], independent: [] }, { version: 1, practiced: ['five-line-row', 'five-line-row'], independent: [] }, { version: 1, practiced: [], independent: ['five-line-row'] }, { version: 1, practiced: {}, independent: [] }, { version: 1, practiced: Array(1), independent: [] }, Object.assign([], { version: 1, practiced: [], independent: [] })]) {
    raw = broken
    const before = writes
    assert.throws(() => store.save('open-four-row', { independent: true }))
    assert.equal(raw, broken)
    assert.equal(writes, before)
  }
})

test('a write that persisted before reporting failure can be retried without duplicate credit', () => {
  let raw = '', writes = 0
  const store = createGomokuLearningStore({ get: () => raw, set(key, value) { raw = value; writes++; throw new Error('interrupted after write') } })
  assert.throws(() => store.save('five-line-row', { independent: true }), /interrupted/)
  assert.equal(store.save('five-line-row', { independent: true }).independent.length, 1)
  assert.equal(writes, 1)
})
