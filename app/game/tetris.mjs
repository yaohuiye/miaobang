// 俄罗斯方块：标准 7 种方块、10×18 棋盘；重力由页面控制，起步放慢，适合小学生反应速度。
export const TETRIS_ROWS = 18
export const TETRIS_COLS = 10
export const PIECE_KINDS = ['I', 'O', 'T', 'S', 'Z', 'J', 'L']
const SHAPES = {
  I: [[1, 1, 1, 1]],
  O: [[1, 1], [1, 1]],
  T: [[1, 1, 1], [0, 1, 0]],
  S: [[0, 1, 1], [1, 1, 0]],
  Z: [[1, 1, 0], [0, 1, 1]],
  J: [[1, 0, 0], [1, 1, 1]],
  L: [[0, 0, 1], [1, 1, 1]]
}
export const LINE_SCORES = { 0: 0, 1: 100, 2: 300, 3: 500, 4: 800 }

export const emptyBoard = () => Array.from({ length: TETRIS_ROWS }, () => Array(TETRIS_COLS).fill(0))

// 7-bag：每 7 个方块恰好每种一次，避免孩子等不到需要的方块。
export function bagPiece(queue, random = Math.random) {
  const kinds = queue.length ? [...queue] : [...PIECE_KINDS]
  if (!queue.length) for (let i = kinds.length - 1; i > 0; i -= 1) {
    const j = Math.floor(random() * (i + 1))
    ;[kinds[i], kinds[j]] = [kinds[j], kinds[i]]
  }
  const [kind, ...rest] = kinds
  const shape = SHAPES[kind].map(row => [...row])
  return {
    piece: { kind, color: PIECE_KINDS.indexOf(kind) + 1, shape, x: Math.floor((TETRIS_COLS - shape[0].length) / 2), y: 0 },
    queue: rest
  }
}

export const rotated = piece => ({ ...piece, shape: piece.shape[0].map((_, index) => piece.shape.map(row => row[index]).reverse()) })

export function collides(board, piece, dx = 0, dy = 0) {
  for (let r = 0; r < piece.shape.length; r += 1) for (let c = 0; c < piece.shape[r].length; c += 1) {
    if (!piece.shape[r][c]) continue
    const y = piece.y + dy + r
    const x = piece.x + dx + c
    if (x < 0 || x >= TETRIS_COLS || y < 0 || y >= TETRIS_ROWS) return true
    if (board[y][x]) return true
  }
  return false
}

// 尝试旋转，两侧各留一格的简易踢墙，让孩子在贴边时也能转过弯来。
export function rotatePiece(board, piece) {
  const turned = rotated(piece)
  for (const kick of [0, -1, 1, -2, 2]) {
    if (!collides(board, turned, kick, 0)) return { ...turned, x: turned.x + kick }
  }
  return piece
}

export function merge(board, piece) {
  const next = board.map(row => [...row])
  for (let r = 0; r < piece.shape.length; r += 1) for (let c = 0; c < piece.shape[r].length; c += 1) {
    if (piece.shape[r][c]) next[piece.y + r][piece.x + c] = piece.color
  }
  return next
}

export function clearLines(board) {
  const kept = board.filter(row => row.some(cell => !cell))
  const lines = TETRIS_ROWS - kept.length
  const next = Array.from({ length: lines }, () => Array(TETRIS_COLS).fill(0)).concat(kept)
  return { board: next, lines }
}

export const lineScore = lines => LINE_SCORES[lines] ?? 0
