// 消消乐：8×8 水果盘，五种水果；点两张相邻的交换，凑三个以上消除，连消有加成。
export const MATCH_ROWS = 8
export const MATCH_COLS = 8
export const MATCH_KINDS = 5
export const TILES = ['🍎', '🍊', '🍇', '🍓', '🌻']

const clone = grid => grid.map(row => [...row])
const at = (grid, row, col) => grid[row][col]

export function createGrid(random = Math.random, rows = MATCH_ROWS, cols = MATCH_COLS, kinds = MATCH_KINDS) {
  const grid = []
  for (let row = 0; row < rows; row += 1) {
    const line = []
    for (let col = 0; col < cols; col += 1) {
      let kind = 0
      do { kind = Math.floor(random() * kinds) }
      while ((col >= 2 && line[col - 1] === kind && line[col - 2] === kind) ||
        (row >= 2 && grid[row - 1][col] === kind && grid[row - 2][col] === kind))
      line.push(kind)
    }
    grid.push(line)
  }
  return grid
}

// 返回 '行-列' 字符串集合，方便页面高亮和测试断言。
export function findMatches(grid) {
  const hits = new Set()
  for (let row = 0; row < grid.length; row += 1) {
    let run = 1
    for (let col = 1; col <= grid[row].length; col += 1) {
      if (col < grid[row].length && at(grid, row, col) === at(grid, row, col - 1) && at(grid, row, col) >= 0) run += 1
      else {
        if (run >= 3) for (let back = 1; back <= run; back += 1) hits.add(`${row}-${col - back}`)
        run = 1
      }
    }
  }
  for (let col = 0; col < grid[0].length; col += 1) {
    let run = 1
    for (let row = 1; row <= grid.length; row += 1) {
      if (row < grid.length && at(grid, row, col) === at(grid, row - 1, col) && at(grid, row, col) >= 0) run += 1
      else {
        if (run >= 3) for (let back = 1; back <= run; back += 1) hits.add(`${row - back}-${col}`)
        run = 1
      }
    }
  }
  return hits
}

export function adjacent(r1, c1, r2, c2) {
  return Math.abs(r1 - r2) + Math.abs(c1 - c2) === 1
}

export function swapped(grid, r1, c1, r2, c2) {
  if (r1 < 0 || c1 < 0 || r2 < 0 || c2 < 0 || r1 >= grid.length || r2 >= grid.length || c1 >= grid[0].length || c2 >= grid[0].length) throw new Error('这两个位置不在水果盘上。')
  if (!adjacent(r1, c1, r2, c2)) throw new Error('只能交换上下左右相邻的两个水果。')
  const next = clone(grid)
  ;[next[r1][c1], next[r2][c2]] = [next[r2][c2], next[r1][c1]]
  return next
}

export const isValidSwap = (grid, r1, c1, r2, c2) => adjacent(r1, c1, r2, c2) && findMatches(swapped(grid, r1, c1, r2, c2)).size > 0

// 下落补新：每列从底往上压实，空位在顶部补随机水果。
export function applyGravity(grid, random = Math.random, kinds = MATCH_KINDS) {
  const rows = grid.length
  const cols = grid[0].length
  const next = clone(grid)
  let refilled = 0
  for (let col = 0; col < cols; col += 1) {
    const kept = []
    for (let row = rows - 1; row >= 0; row -= 1) if (next[row][col] >= 0) kept.push(next[row][col])
    for (let row = rows - 1, index = 0; row >= 0; row -= 1, index += 1) {
      if (index < kept.length) next[row][col] = kept[index]
      else { next[row][col] = Math.floor(random() * kinds); refilled += 1 }
    }
  }
  return { grid: next, refilled }
}

// 一路消到没有可消的为止；cleared 是总消除数，cascades 是连消次数。
export function resolveBoard(grid, random = Math.random, kinds = MATCH_KINDS) {
  let current = clone(grid)
  let cleared = 0
  let cascades = 0
  for (;;) {
    const hits = findMatches(current)
    if (!hits.size) return { grid: current, cleared, cascades }
    for (const hit of hits) {
      const [row, col] = hit.split('-').map(Number)
      current[row][col] = -1
    }
    current = applyGravity(current, random, kinds).grid
    cleared += hits.size
    cascades += 1
  }
}

export function hasMoves(grid) {
  for (let row = 0; row < grid.length; row += 1) for (let col = 0; col < grid[row].length; col += 1) {
    for (const [dr, dc] of [[0, 1], [1, 0]]) {
      const r2 = row + dr
      const c2 = col + dc
      if (r2 < grid.length && c2 < grid[row].length && isValidSwap(grid, row, col, r2, c2)) return true
    }
  }
  return false
}

// 死局重排：打乱现有水果直到至少有一步行棋（不改变水果种类数量）。
export function reshuffle(grid, random = Math.random) {
  const values = grid.flat()
  for (let tries = 0; tries < 200; tries += 1) {
    for (let i = values.length - 1; i > 0; i -= 1) {
      const j = Math.floor(random() * (i + 1))
      ;[values[i], values[j]] = [values[j], values[i]]
    }
    const candidate = []
    for (let row = 0; row < grid.length; row += 1) candidate.push(values.slice(row * grid[row].length, (row + 1) * grid[row].length))
    if (!findMatches(candidate).size && hasMoves(candidate)) return candidate
  }
  return createGrid(random, grid.length, grid[0].length)
}
