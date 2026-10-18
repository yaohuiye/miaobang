import { lessons, puzzles, puzzleById } from '../data/gomoku-lessons.mjs'
import { emptyBoard, placeStone, winningLine, winningMoves, analyzeStraightLines } from './gomoku.mjs'

export const GOMOKU_LEARNING_KEY = 'miaobang.gomoku-learning.v1'

export function makePuzzleBoard(puzzle) {
  return puzzle.stones.reduce((board, stone) => placeStone(board, stone.row, stone.col, stone.player), emptyBoard(puzzle.size))
}

const onBoard = (board, row, col) => row >= 0 && row < board.length && col >= 0 && col < board.length
function lineCells(board, row, col, dr, dc) {
  const player = board[row][col]
  const points = [{ row, col }]
  for (const sign of [-1, 1]) {
    let r = row + dr * sign, c = col + dc * sign
    while (onBoard(board, r, c) && board[r][c] === player) {
      points.push({ row: r, col: c })
      r += dr * sign
      c += dc * sign
    }
  }
  return points
}

// A threat must actually win under the engine and use the newly placed stone.
function threatsThrough(board, row, col, player) {
  return winningMoves(board, player).map(move => {
    const next = placeStone(board, move.row, move.col, player)
    const directions = analyzeStraightLines(next, move.row, move.col)
      .filter(line => line.kind === 'five' && lineCells(next, move.row, move.col, line.dr, line.dc).some(point => point.row === row && point.col === col))
      .map(line => `${line.dr},${line.dc}`)
    return { ...move, directions }
  }).filter(move => move.directions.length)
}

export function judgePuzzle(puzzle, row, col) {
  const board = makePuzzleBoard(puzzle)
  if (!Number.isInteger(row) || !Number.isInteger(col) || !onBoard(board, row, col)) {
    return { correct: false, feedback: '请点棋盘里的一个交叉点。', highlights: [] }
  }
  if (board[row][col] !== 0) return { correct: false, feedback: '这里已经有棋子了，换一个空位再观察。', highlights: [] }
  const next = placeStone(board, row, col, puzzle.toPlay)
  const won = winningLine(next, row, col)
  if (won.length) return { correct: true, feedback: '这一手已经连成五颗及以上，赢啦！' + puzzle.explanation, highlights: won }
  const danger = winningMoves(next, 3 - puzzle.toPlay)
  if (danger.length) return { correct: false, feedback: '对手下一手仍能成五。先把最紧急的威胁看清楚，再试一次。', highlights: danger }

  let correct = false, highlights = [{ row, col }]
  const lines = analyzeStraightLines(next, row, col)
  if (puzzle.objective === 'block') correct = winningMoves(board, 3 - puzzle.toPlay).length > 0
  if (puzzle.objective === 'open-four' || puzzle.objective === 'straight-three') {
    const kind = puzzle.objective === 'open-four' ? 'open-four' : 'straight-open-three'
    const line = lines.find(value => value.kind === kind)
    correct = Boolean(line)
    if (line) highlights = lineCells(next, row, col, line.dr, line.dc)
  }
  if (['rush-four', 'fork', 'attack-defense'].includes(puzzle.objective)) {
    const threats = threatsThrough(next, row, col, puzzle.toPlay)
    if (puzzle.objective === 'rush-four') correct = threats.length === 1
    if (puzzle.objective === 'fork') correct = threats.length >= 2 && new Set(threats.flatMap(move => move.directions)).size >= 2
    if (puzzle.objective === 'attack-defense') correct = winningMoves(board, 3 - puzzle.toPlay).length > 0 && threats.length > 0
    if (correct) highlights = [{ row, col }, ...threats.map(({ row: r, col: c }) => ({ row: r, col: c }))]
  }
  const reminders = {
    win: '这一步还没有成五。沿四个方向数一数，找只差一颗的直线。',
    block: '本课要真正消掉对手的一步成五点，或自己这一手直接成五。',
    'rush-four': '还没有造出本课要找的冲四：需要有且只有一个下一手成五点。',
    'open-four': '再检查连续四颗和两个空端；一端被挡住或顶到边线，都不是活四。',
    'straight-three': '找连续三颗、两头空，并且能再走成活四的直活三；隔空的跳三不算本课目标。',
    'attack-defense': '挡住对手之后，还要给自己留下下一手成五点。',
    fork: '要在两个不同方向，都实际造出成五点。只看起来像交叉还不够。'
  }
  return { correct, feedback: correct ? '找到了！' + puzzle.explanation : reminders[puzzle.objective] || '再观察本课的目标，换个空位试一试。', highlights: correct ? highlights : [] }
}

const invalidRecord = () => new Error('五子棋学习记录暂时无法读取，原记录未改动，请保留后重试。')
const validIds = values => Array.isArray(values) && new Set(values).size === values.length && [...values].every(id => typeof id === 'string' && /^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(id))
export function readGomokuLearning(raw) {
  if (raw == null || raw === '') return { version: 1, practiced: [], independent: [] }
  let state
  try { state = typeof raw === 'string' ? JSON.parse(raw) : raw } catch { throw invalidRecord() }
  if (!state || typeof state !== 'object' || Array.isArray(state) || state.version !== 1 || !validIds(state.practiced) || !validIds(state.independent) || state.independent.some(id => !state.practiced.includes(id))) throw invalidRecord()
  // Keep retired or future puzzle IDs; only current puzzles contribute to the totals.
  return { version: 1, practiced: [...state.practiced], independent: [...state.independent] }
}

export function summarizeGomokuLearning(state) {
  const value = readGomokuLearning(state)
  const count = (ids, completed) => ids.filter(id => completed.includes(id)).length
  const currentIds = puzzles.map(item => item.id)
  return {
    practiced: count(currentIds, value.practiced), independent: count(currentIds, value.independent), total: puzzles.length,
    byLesson: Object.fromEntries(lessons.map(lesson => [lesson.id, {
      practiced: count(lesson.puzzleIds, value.practiced), independent: count(lesson.puzzleIds, value.independent), total: lesson.puzzleIds.length
    }]))
  }
}

export function recordGomokuPuzzle(state, puzzleId, { independent = false } = {}) {
  if (!puzzles.some(item => item.id === puzzleId) || typeof independent !== 'boolean') throw new Error('找不到这道五子棋练习，或通过信息不完整。')
  const next = readGomokuLearning(state)
  if (!next.practiced.includes(puzzleId)) next.practiced.push(puzzleId)
  if (independent && !next.independent.includes(puzzleId)) next.independent.push(puzzleId)
  return next
}

export function createGomokuLearningStore(storage) {
  return {
    read() { return readGomokuLearning(storage.get(GOMOKU_LEARNING_KEY)) },
    save(puzzleId, options) {
      const previous = this.read()
      const next = recordGomokuPuzzle(previous, puzzleId, options)
      if (JSON.stringify(next) !== JSON.stringify(previous)) storage.set(GOMOKU_LEARNING_KEY, next)
      return next
    },
    mark(puzzleId, options) { return this.save(puzzleId, options) }
  }
}

// A new entry starts a fresh attempt; help or any wrong move affects only this round.
export function createGomokuAttempt(puzzleId) {
  if (!puzzles.some(item => item.id === puzzleId)) throw new Error('找不到这道五子棋练习。')
  let assisted = false, mistaken = false, passed = false, independentPass = false
  return {
    puzzleId,
    help() { assisted = true },
    tryMove(row, col) {
      const result = judgePuzzle(puzzleById[puzzleId], row, col)
      if (!result.correct && !passed) mistaken = true
      if (result.correct && !passed) {
        passed = true
        independentPass = !assisted && !mistaken
      }
      return { ...result, independent: result.correct && independentPass }
    },
    progress() { return { passed, independent: independentPass } }
  }
}
