// 贪吃蛇：14×14 慢速起步，吃一个苹果长一节、加 10 分；撞墙或咬到自己就结束。
export const SNAKE_ROWS = 14
export const SNAKE_COLS = 14
export const DIRECTIONS = { up: { x: 0, y: -1 }, down: { x: 0, y: 1 }, left: { x: -1, y: 0 }, right: { x: 1, y: 0 } }

export function placeFood(cells, random = Math.random, rows = SNAKE_ROWS, cols = SNAKE_COLS) {
  const taken = new Set(cells.map(cell => cell.y * cols + cell.x))
  const free = []
  for (let index = 0; index < rows * cols; index += 1) if (!taken.has(index)) free.push(index)
  if (!free.length) return null
  const index = free[Math.floor(random() * free.length)]
  return { x: index % cols, y: Math.floor(index / cols) }
}

export function createSnake(random = Math.random, rows = SNAKE_ROWS, cols = SNAKE_COLS) {
  const midY = Math.floor(rows / 2)
  const cells = [{ x: 2, y: midY }, { x: 1, y: midY }, { x: 0, y: midY }]
  return { cells, direction: 'right', food: placeFood(cells, random, rows, cols), score: 0, rows, cols }
}

// 不能原地掉头：与当前方向相反的转向会被忽略。
export function turn(snake, direction) {
  if (!DIRECTIONS[direction]) throw new Error('这个方向我还不认识。')
  const current = DIRECTIONS[snake.direction]
  const next = DIRECTIONS[direction]
  if (current.x + next.x === 0 && current.y + next.y === 0) return snake
  return { ...snake, direction }
}

export function step(snake, random = Math.random) {
  const { rows, cols } = snake
  const delta = DIRECTIONS[snake.direction]
  const head = { x: snake.cells[0].x + delta.x, y: snake.cells[0].y + delta.y }
  if (head.x < 0 || head.y < 0 || head.x >= cols || head.y >= rows) return { snake, ate: false, dead: true }
  const ate = head.x === snake.food.x && head.y === snake.food.y
  const body = ate ? snake.cells : snake.cells.slice(0, -1)
  if (body.some(cell => cell.x === head.x && cell.y === head.y)) return { snake, ate, dead: true }
  const cells = [head, ...body]
  const score = snake.score + (ate ? 10 : 0)
  const food = ate ? placeFood(cells, random, rows, cols) : snake.food
  if (ate && !food) return { snake: { ...snake, cells, score }, ate, dead: false }
  return { snake: { ...snake, cells, food, score }, ate, dead: false }
}
