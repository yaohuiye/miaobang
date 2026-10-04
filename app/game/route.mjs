export const SIZE = 6
export const MAX_COMMANDS = 64
export const DIRECTIONS = {
  U: { row: -1, col: 0, label: '上', arrow: '↑' },
  D: { row: 1, col: 0, label: '下', arrow: '↓' },
  L: { row: 0, col: -1, label: '左', arrow: '←' },
  R: { row: 0, col: 1, label: '右', arrow: '→' }
}

export function parseMap(rows) {
  if (!Array.isArray(rows) || rows.length !== SIZE || rows.some(row => typeof row !== 'string' || row.length !== SIZE || /[^.SG#]/.test(row))) {
    throw new Error('地图需要是 6 × 6 的方格')
  }
  const cells = rows.join('').split('')
  if (cells.filter(cell => cell === 'S').length !== 1 || cells.filter(cell => cell === 'G').length !== 1) {
    throw new Error('地图需要各有一个起点和终点')
  }
  return { cells, start: cells.indexOf('S'), goal: cells.indexOf('G') }
}

export function validCommands(commands) {
  return Array.isArray(commands) && commands.length <= MAX_COMMANDS && commands.every(command => Object.prototype.hasOwnProperty.call(DIRECTIONS, command))
}

export function move(map, position, command) {
  if (!Object.prototype.hasOwnProperty.call(DIRECTIONS, command)) throw new Error('指令只能是上、下、左、右')
  const direction = DIRECTIONS[command]
  const row = Math.floor(position / SIZE) + direction.row
  const col = position % SIZE + direction.col
  if (row < 0 || row >= SIZE || col < 0 || col >= SIZE) return { position, error: 'edge' }
  const next = row * SIZE + col
  if (map.cells[next] === '#') return { position, error: 'wall' }
  return { position: next, error: null }
}

export function runRoute(map, commands) {
  if (!validCommands(commands)) throw new Error('路线最多包含 64 条方向指令')
  let position = map.start
  const steps = []
  for (let index = 0; index < commands.length; index++) {
    const step = move(map, position, commands[index])
    steps.push({ ...step, index })
    position = step.position
    if (step.error) return { steps, position, outcome: step.error, failedStep: index + 1 }
    if (position === map.goal) return { steps, position, outcome: 'success' }
  }
  return { steps, position, outcome: 'unfinished' }
}

// 提示只提供一条可行路线；过关判断不与这条路线比较。
export function findRoute(map, start = map.start) {
  const queue = [{ position: start, commands: [] }]
  const seen = new Set([start])
  for (let head = 0; head < queue.length; head++) {
    const current = queue[head]
    if (current.position === map.goal) return current.commands
    for (const command of Object.keys(DIRECTIONS)) {
      const step = move(map, current.position, command)
      if (step.error || seen.has(step.position)) continue
      seen.add(step.position)
      queue.push({ position: step.position, commands: [...current.commands, command] })
    }
  }
  return null
}
