import test from 'node:test'
import assert from 'node:assert/strict'
import { MINES_ROWS, MINES_COLS, MINES_COUNT, neighborCells, createBoard, reveal, toggleFlag, flagsUsed, isLost, isWon } from '../game/minesweeper.mjs'
import { emptyBoard, bagPiece, collides, rotatePiece, merge, clearLines, lineScore, LINE_SCORES, PIECE_KINDS, TETRIS_ROWS, TETRIS_COLS } from '../game/tetris.mjs'
import { TILES, MATCH_KINDS, createGrid, findMatches, adjacent, swapped, isValidSwap, applyGravity, resolveBoard, hasMoves, reshuffle } from '../game/match.mjs'
import { createSnake, placeFood, turn, step, DIRECTIONS } from '../game/snake.mjs'
import { ARCADE_KEY, ARCADE_GAMES, emptyArcade, readArcade, recordBest, bestText, createArcadeStore } from '../game/arcade-progress.mjs'

function mulberry32(seed) {
  let a = seed >>> 0
  return () => {
    a |= 0; a = (a + 0x6D2B79F5) | 0
    let t = Math.imul(a ^ (a >>> 15), 1 | a)
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

test('minesweeper boards place every mine outside the safe opening with honest counts', () => {
  assert.equal(MINES_ROWS * MINES_COLS, 64)
  for (let seed = 1; seed <= 20; seed += 1) {
    const random = mulberry32(seed)
    const board = createBoard(random, 4, 4)
    const mines = board.cells.filter(cell => cell.mine)
    assert.equal(mines.length, MINES_COUNT)
    const safe = new Set([[4, 4], ...neighborCells(board.rows, board.cols, 4, 4)].map(([r, c]) => r * board.cols + c))
    board.cells.forEach((cell, index) => { if (cell.mine) assert.equal(safe.has(index), false, `mine at ${Math.floor(index / board.cols)}-${index % board.cols}`) })
    for (let row = 0; row < board.rows; row += 1) for (let col = 0; col < board.cols; col += 1) {
      const cell = board.cells[row * board.cols + col]
      if (cell.mine) { assert.equal(cell.count, 0); continue }
      const expected = neighborCells(board.rows, board.cols, row, col).filter(([r, c]) => board.cells[r * board.cols + c].mine).length
      assert.equal(cell.count, expected, `${row}-${col}`)
    }
  }
  assert.throws(() => createBoard(mulberry32(1), 0, 0, 3, 3, 1))
})
test('minesweeper reveal floods zeros, flags toggle, and win needs every safe cell', () => {
  const board = createBoard(mulberry32(5), 1, 1, 4, 4, 2)
  const result = reveal(board, 1, 1)
  assert.equal(result.hit, false)
  const revealed = result.board.cells.filter(cell => cell.state === 'revealed')
  assert.ok(revealed.length >= 9 && revealed.length <= 14, `flood opened ${revealed.length}`)
  assert.equal(revealed.some(cell => cell.mine), false)
  const mineIndex = result.board.cells.findIndex(cell => cell.mine)
  const flagged = toggleFlag(result.board, Math.floor(mineIndex / 4), mineIndex % 4)
  assert.equal(flagged.cells[mineIndex].state, 'flagged')
  assert.equal(flagsUsed(flagged), 1)
  assert.equal(toggleFlag(flagged, Math.floor(mineIndex / 4), mineIndex % 4).cells[mineIndex].state, 'hidden')
  assert.equal(toggleFlag(result.board, 1, 1), result.board)
  assert.equal(isWon(result.board), false)
  let swept = result.board
  swept.cells.forEach((cell, index) => { if (!cell.mine) swept = reveal(swept, Math.floor(index / 4), index % 4).board })
  assert.equal(isWon(swept), true)
  assert.equal(isLost(swept), false)
  const mine = createBoard(mulberry32(9), 1, 1, 4, 4, 2)
  const hiddenMine = mine.cells.findIndex(cell => cell.mine)
  const hit = reveal(mine, Math.floor(hiddenMine / 4), hiddenMine % 4)
  assert.equal(hit.hit, true)
  assert.equal(isLost(hit.board), true)
})
test('tetris bag deals all seven kinds before repeating and moves obey walls', () => {
  assert.deepEqual(Object.keys(LINE_SCORES).map(Number).sort((a, b) => a - b), [0, 1, 2, 3, 4])
  const random = mulberry32(3)
  const seen = []
  let queue = []
  for (let i = 0; i < 14; i += 1) {
    const dealt = bagPiece(queue, random)
    seen.push(dealt.piece.kind)
    queue = dealt.queue
  }
  assert.deepEqual([...seen].slice(0, 7).sort(), [...PIECE_KINDS].sort())
  assert.deepEqual(seen.slice(0, 7).sort(), seen.slice(7).sort())
  const board = emptyBoard()
  assert.equal(board.length, TETRIS_ROWS)
  assert.equal(board[0].length, TETRIS_COLS)
  const piece = bagPiece([], mulberry32(1)).piece
  assert.equal(collides(board, piece, -5, 0), true)
  assert.equal(collides(board, piece, 5, 0), true)
  assert.equal(collides(board, piece, 0, TETRIS_ROWS), true)
  assert.equal(collides(board, piece, 0, 0), false)
  const wall = { kind: 'O', color: 2, shape: [[1, 1], [1, 1]], x: 0, y: 0 }
  const turned = rotatePiece(board, wall)
  assert.equal(turned.kind, 'O')
  assert.equal(collides(board, turned, 0, 0), false)
})
test('tetris merge, clearLines and scores follow classic rules', () => {
  const board = emptyBoard()
  board[17] = Array(TETRIS_COLS).fill(0)
  const piece = { kind: 'I', color: 1, shape: [[1, 1, 1, 1]], x: 3, y: 17 }
  const merged = merge(board, piece)
  assert.equal(merged[17].filter(Boolean).length, 4)
  const result = clearLines(merged)
  assert.equal(result.lines, 0)
  for (let col = 0; col < TETRIS_COLS; col += 1) merged[17][col] = col === 0 ? 0 : 3
  const one = clearLines(merged)
  assert.equal(one.lines, 0)
  const full = merge(merged, { kind: 'I', color: 1, shape: [[1]], x: 0, y: 17 })
  const cleared = clearLines(full)
  assert.equal(cleared.lines, 1)
  assert.equal(cleared.board[17].every(cell => !cell), true)
  assert.equal(lineScore(1), 100)
  assert.equal(lineScore(4), 800)
  assert.equal(lineScore(5), 0)
  const spawn = bagPiece([], mulberry32(2)).piece
  const tall = emptyBoard()
  tall[0][4] = 1
  tall[0][5] = 1
  assert.equal(collides(tall, { ...spawn, shape: [[1, 1]], x: 4, y: 0 }, 0, 0), true)
})
test('match grids start clean, swap rules and gravity behave, cascades settle', () => {
  assert.equal(TILES.length, MATCH_KINDS)
  for (let seed = 1; seed <= 15; seed += 1) {
    const grid = createGrid(mulberry32(seed))
    assert.equal(findMatches(grid).size, 0)
    assert.equal(grid.length, 8)
  }
  const crafted = [
    [1, 1, 1, 2],
    [2, 3, 2, 3],
    [3, 2, 3, 1],
    [2, 3, 1, 2]
  ]
  const horizontal = findMatches(crafted)
  assert.equal(horizontal.size, 3)
  assert.ok(['0-0', '0-1', '0-2'].every(hit => horizontal.has(hit)))
  const columnCraft = [
    [4, 0],
    [4, 1],
    [4, 0],
    [1, 0]
  ]
  assert.equal(findMatches(columnCraft).size, 3)
  assert.equal(adjacent(1, 1, 1, 2), true)
  assert.equal(adjacent(1, 1, 2, 2), false)
  const base = [
    [3, 1, 1],
    [1, 2, 3],
    [2, 3, 2]
  ]
  assert.equal(findMatches(base).size, 0)
  const afterSwap = swapped(base, 0, 0, 1, 0)
  assert.equal(afterSwap[0][0], 1)
  assert.equal(afterSwap[1][0], 3)
  assert.equal(findMatches(afterSwap).size, 3)
  assert.equal(isValidSwap(base, 0, 0, 1, 0), true)
  assert.equal(isValidSwap(base, 2, 0, 2, 1), false)
  assert.equal(isValidSwap(base, 0, 0, 1, 1), false)
  assert.throws(() => swapped(base, 0, 0, 1, 1))
  assert.throws(() => swapped(base, -1, 0, 0, 0))
  const gapped = [
    [1, -1, -1],
    [2, 3, 1],
    [3, 1, 2]
  ]
  const dropped = applyGravity(gapped, mulberry32(4), 3)
  assert.equal(dropped.refilled, 2)
  assert.equal(dropped.grid[2][0], 3)
  assert.equal(dropped.grid[2][1], 1)
  assert.equal(dropped.grid[1][1], 3)
  assert.ok(dropped.grid[0][1] >= 0 && dropped.grid[0][1] < 3)
  for (let seed = 20; seed <= 34; seed += 1) {
    const grid = createGrid(mulberry32(seed))
    grid[0][0] = grid[0][1]
    const seeded = createGrid(mulberry32(seed))
    seeded[1][0] = seeded[1][1]
    seeded[1][2] = seeded[1][1]
    const resolved = resolveBoard(seeded, mulberry32(seed + 100))
    assert.equal(findMatches(resolved.grid).size, 0)
    assert.ok(resolved.cleared >= 3)
    assert.ok(resolved.cascades >= 1)
  }
  assert.equal(hasMoves(crafted), true)
  const shuffled = reshuffle(crafted, mulberry32(7))
  assert.equal(findMatches(shuffled).size, 0)
  assert.equal(hasMoves(shuffled), true)
})
test('snake turns ignore reversals, eats apples, and dies on walls or itself', () => {
  assert.deepEqual(Object.keys(DIRECTIONS), ['up', 'down', 'left', 'right'])
  const snake = createSnake(mulberry32(1))
  assert.equal(snake.cells.length, 3)
  assert.equal(snake.direction, 'right')
  assert.equal(snake.score, 0)
  assert.notEqual(turn(snake, 'left'), null)
  assert.equal(turn(snake, 'left').direction, 'right')
  assert.equal(turn(snake, 'up').direction, 'up')
  assert.throws(() => turn(snake, 'diag'))
  const atFood = { ...snake, food: { x: 3, y: snake.cells[0].y } }
  const ate = step(atFood, mulberry32(2))
  assert.equal(ate.ate, true)
  assert.equal(ate.dead, false)
  assert.equal(ate.snake.cells.length, 4)
  assert.equal(ate.snake.score, 10)
  assert.equal(placeFood(ate.snake.cells, mulberry32(3), 14, 14) === null, false)
  const wall = turn(snake, 'up')
  let current = wall
  for (let i = 0; i < 10; i += 1) current = step(current, mulberry32(i + 10)).snake
  const dying = step({ ...current, direction: 'up' }, mulberry32(99))
  assert.equal(dying.dead, true)
  const ring = {
    cells: [{ x: 0, y: 0 }, { x: 0, y: 1 }, { x: 1, y: 1 }, { x: 1, y: 0 }],
    direction: 'right',
    food: { x: 1, y: 0 },
    score: 0,
    rows: 14,
    cols: 14
  }
  assert.equal(step(ring, mulberry32(5)).dead, true)
  const free = { cells: [{ x: 0, y: 0 }, { x: 1, y: 0 }], direction: 'right', food: null, score: 0, rows: 1, cols: 2 }
  assert.equal(placeFood(free.cells, mulberry32(6), 1, 2), null)
  const empty = createSnake(mulberry32(7), 1, 1)
  assert.equal(empty.food === null, true)
})
test('arcade records keep the better score per game and refuse broken saves', () => {
  assert.deepEqual(emptyArcade(), { version: 1, best: {} })
  assert.deepEqual(readArcade(''), emptyArcade())
  assert.throws(() => readArcade('{broken'))
  assert.throws(() => readArcade({ version: 2, best: {} }))
  assert.throws(() => readArcade({ version: 1, best: { mines: { value: 1, playedAt: 1 }, gone: { value: 1, playedAt: 1 } } }))
  assert.throws(() => readArcade({ version: 1, best: { mines: { value: 'x', playedAt: 1 } } }))
  const high = emptyArcade()
  const first = recordBest(high, 'tetris', 100, 1)
  assert.equal(first.best.tetris.value, 100)
  assert.equal(recordBest(first, 'tetris', 80, 2).best.tetris.value, 100)
  const better = recordBest(first, 'tetris', 300, 3)
  assert.equal(better.best.tetris.value, 300)
  assert.equal(bestText(better, 'tetris'), '最高 300 分')
  const low = recordBest(emptyArcade(), 'mines', 90, 1)
  assert.equal(recordBest(low, 'mines', 120, 2).best.mines.value, 90)
  assert.equal(recordBest(low, 'mines', 45, 3).best.mines.value, 45)
  assert.throws(() => recordBest(high, 'gone', 1, 1))
  assert.throws(() => recordBest(high, 'snake', -1, 1))
  assert.throws(() => recordBest(high, 'snake', 1, 0))
  assert.equal(bestText(first, 'tetris'), '最高 100 分')
  assert.equal(bestText(recordBest(emptyArcade(), 'mines', 45, 3), 'mines'), '最快 45 秒')
  assert.equal(bestText(emptyArcade(), 'snake'), '')
  let stored = JSON.stringify(emptyArcade())
  const broken = createArcadeStore({ get: key => { assert.equal(key, ARCADE_KEY); return stored }, set: () => { throw new Error('full') } })
  assert.throws(() => broken.save('snake', 50, Date.now()), /full/)
  assert.deepEqual(broken.read(), emptyArcade())
  const working = createArcadeStore({ get: () => stored, set: (key, value) => { stored = JSON.stringify(value) } })
  working.save('snake', 50, Date.now())
  working.save('match', 200, Date.now())
  assert.equal(Object.keys(working.read().best).length, 2)
  assert.equal(Object.keys(ARCADE_GAMES).length, 4)
})
