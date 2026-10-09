// 扫雷：8×8、8 颗雷，首次点开的 3×3 范围保证安全，让孩子用数字逻辑推理而不是碰运气。
export const MINES_ROWS = 8
export const MINES_COLS = 8
export const MINES_COUNT = 8

export function neighborCells(rows, cols, row, col) {
  const result = []
  for (let dr = -1; dr <= 1; dr += 1) for (let dc = -1; dc <= 1; dc += 1) {
    if (dr === 0 && dc === 0) continue
    const r = row + dr
    const c = col + dc
    if (r >= 0 && r < rows && c >= 0 && c < cols) result.push([r, c])
  }
  return result
}

// random 由调用方注入；safeRow/safeCol 是第一次点开的格子，其周围一圈不会出现地雷。
export function createBoard(random = Math.random, safeRow = -1, safeCol = -1, rows = MINES_ROWS, cols = MINES_COLS, mines = MINES_COUNT) {
  const total = rows * cols
  if (!Number.isInteger(mines) || mines < 1 || mines > total - 9) throw new Error('这个雷数放不下安全的开局，换一个小一点的数字。')
  const safe = new Set()
  if (safeRow >= 0 && safeCol >= 0) for (const [r, c] of [[safeRow, safeCol], ...neighborCells(rows, cols, safeRow, safeCol)]) safe.add(r * cols + c)
  const candidates = []
  for (let index = 0; index < total; index += 1) if (!safe.has(index)) candidates.push(index)
  for (let i = candidates.length - 1; i > 0; i -= 1) {
    const j = Math.floor(random() * (i + 1))
    ;[candidates[i], candidates[j]] = [candidates[j], candidates[i]]
  }
  const mineSet = new Set(candidates.slice(0, mines))
  const cells = Array.from({ length: total }, (_, index) => ({
    mine: mineSet.has(index), count: 0, state: 'hidden'
  }))
  for (let row = 0; row < rows; row += 1) for (let col = 0; col < cols; col += 1) {
    const cell = cells[row * cols + col]
    if (cell.mine) continue
    cell.count = neighborCells(rows, cols, row, col).filter(([r, c]) => cells[r * cols + c].mine).length
  }
  return { rows, cols, mines, cells }
}

const copy = board => ({ ...board, cells: board.cells.map(cell => ({ ...cell })) })

export function reveal(board, row, col) {
  if (row < 0 || col < 0 || row >= board.rows || col >= board.cols) throw new Error('这一格不在棋盘上。')
  const next = copy(board)
  const start = row * board.cols + col
  const cell = next.cells[start]
  if (cell.state !== 'hidden') return { board: next, hit: false, revealed: 0 }
  if (cell.mine) {
    cell.state = 'revealed'
    return { board: next, hit: true, revealed: 1 }
  }
  let revealed = 0
  const stack = [[row, col]]
  while (stack.length) {
    const [r, c] = stack.pop()
    const current = next.cells[r * board.cols + c]
    if (current.state !== 'hidden' || current.mine) continue
    current.state = 'revealed'
    revealed += 1
    if (current.count === 0) for (const [nr, nc] of neighborCells(next.rows, next.cols, r, c)) {
      if (next.cells[nr * next.cols + nc].state === 'hidden') stack.push([nr, nc])
    }
  }
  return { board: next, hit: false, revealed }
}

export function toggleFlag(board, row, col) {
  if (row < 0 || col < 0 || row >= board.rows || col >= board.cols) throw new Error('这一格不在棋盘上。')
  const cell = board.cells[row * board.cols + col]
  if (cell.state === 'revealed') return board
  const next = copy(board)
  const target = next.cells[row * board.cols + col]
  target.state = target.state === 'flagged' ? 'hidden' : 'flagged'
  return next
}

export const flagsUsed = board => board.cells.filter(cell => cell.state === 'flagged').length
export const isLost = board => board.cells.some(cell => cell.mine && cell.state === 'revealed')
export const isWon = board => board.cells.every(cell => cell.mine || cell.state === 'revealed')
