// 街机小游戏共用的本机最佳成绩：扫雷记最快用时（越低越好），其余记最高分。
export const ARCADE_KEY = 'miaobang.arcade.v1'
export const ARCADE_GAMES = {
  mines: { label: '扫雷', unit: '秒', better: 'low' },
  tetris: { label: '俄罗斯方块', unit: '分', better: 'high' },
  match: { label: '消消乐', unit: '分', better: 'high' },
  snake: { label: '贪吃蛇', unit: '分', better: 'high' },
  plane: { label: '纸翼飞行队', unit: '分', better: 'high' }
}

export function emptyArcade() {
  return { version: 1, best: {} }
}

const validEntry = entry => entry && Number.isFinite(entry.value) && Number.isFinite(entry.playedAt) && entry.playedAt > 0

export function readArcade(value) {
  if (value === '' || value === null || value === undefined) return emptyArcade()
  const state = typeof value === 'string' ? JSON.parse(value) : value
  const valid = state && state.version === 1 && state.best && typeof state.best === 'object' && !Array.isArray(state.best) &&
    Object.entries(state.best).every(([id, entry]) => Object.prototype.hasOwnProperty.call(ARCADE_GAMES, id) && validEntry(entry))
  if (!valid) throw new Error('小游戏成绩记录无法识别，原记录未改动。请先保留数据，不要清空应用。')
  return { version: 1, best: JSON.parse(JSON.stringify(state.best)) }
}

export function recordBest(arcade, gameId, value, playedAt) {
  const game = ARCADE_GAMES[gameId]
  if (!game) throw new Error('这个游戏暂时没有成绩记录。')
  if (!Number.isFinite(value) || value < 0 || !Number.isFinite(playedAt) || playedAt <= 0) throw new Error('这一局的成绩还没算清楚，再玩一局试试。')
  const current = readArcade(arcade).best[gameId]
  const better = !current || (game.better === 'low' ? value < current.value : value > current.value)
  if (!better) return readArcade(arcade)
  return { version: 1, best: { ...readArcade(arcade).best, [gameId]: { value, playedAt } } }
}

export function bestText(arcade, gameId) {
  const entry = arcade.best[gameId]
  if (!entry) return ''
  return `${ARCADE_GAMES[gameId].better === 'low' ? '最快' : '最高'} ${entry.value} ${ARCADE_GAMES[gameId].unit}`
}

export function createArcadeStore(storage) {
  return {
    read: () => readArcade(storage.get(ARCADE_KEY)),
    save(gameId, value, playedAt) {
      // 先写入再返回：写入失败绝不能被当成保存成功。
      const next = recordBest(this.read(), gameId, value, playedAt)
      storage.set(ARCADE_KEY, next)
      return next
    }
  }
}
