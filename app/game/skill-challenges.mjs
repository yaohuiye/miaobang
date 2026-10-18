export const SKILL_CHALLENGES_KEY = 'miaobang.skill-challenges.v1'
export const MINES_LEVELS = [
  { id: 'easy', label: '观察起步', rows: 6, cols: 6, mines: 5, hint: '6×6 · 5 颗雷：先找出数字周围唯一可能的雷。' },
  { id: 'normal', label: '数字推理', rows: 8, cols: 8, mines: 10, hint: '8×8 · 10 颗雷：比较相邻数字，寻找共同的邻居。' },
  { id: 'hard', label: '组合挑战', rows: 10, cols: 10, mines: 18, hint: '10×10 · 18 颗雷：先处理确定的格子，再回头检查旗子。' }
]
export const JUMP_LEVELS = [
  { id: 'easy', label: '距离观察', minGap: 105, maxGap: 145, startWidth: 80, minWidth: 68, centerRadius: 10, centers: 0, hint: '宽岛、较短距离，连续到达 10 座岛。' },
  { id: 'normal', label: '节奏变化', minGap: 125, maxGap: 200, startWidth: 64, minWidth: 48, centerRadius: 9, centers: 2, hint: '距离变化更大，到达 10 座岛，累计 2 次中心落点。' },
  { id: 'hard', label: '精准落点', minGap: 145, maxGap: 225, startWidth: 46, minWidth: 32, centerRadius: 8, centers: 4, hint: '更窄的小岛，到达 10 座岛，累计 4 次中心落点。' }
]
const ids = ['easy', 'normal', 'hard']
export const emptySkillChallenges = () => ({ version: 1, best: { mines: {}, jump: {} } })
const clone = value => JSON.parse(JSON.stringify(value))
function validResult(game, level, value) {
  if (!value || !Number.isFinite(value.at) || value.at < 0) return false
  if (game === 'mines') return Number.isInteger(value.seconds) && value.seconds >= 0 && value.seconds < 86400
  const config = JUMP_LEVELS.find(item => item.id === level)
  return value.landings === 10 && Number.isInteger(value.centers) && value.centers >= config.centers && value.centers <= 10 && value.score === 100 + 10 * value.centers
}
export function readSkillChallenges(value) {
  if (value === '' || value === undefined || value === null) return emptySkillChallenges()
  let state
  try { state = typeof value === 'string' ? JSON.parse(value) : value } catch { throw new Error('本机挑战记录无法识别，原记录未改动。') }
  if (!state || state.version !== 1 || !state.best || typeof state.best !== 'object' || Array.isArray(state.best) || Object.keys(state.best).some(game => !['mines', 'jump'].includes(game)) ||
    !['mines', 'jump'].every(game => state.best[game] && typeof state.best[game] === 'object' && !Array.isArray(state.best[game]) &&
      Object.keys(state.best[game]).every(level => ids.includes(level) && validResult(game, level, state.best[game][level])))) {
    throw new Error('本机挑战记录无法识别，原记录未改动。')
  }
  return clone(state)
}
export function recordSkillChallenge(state, game, level, result) {
  const current = readSkillChallenges(state)
  if (!['mines', 'jump'].includes(game) || !ids.includes(level) || !validResult(game, level, result)) throw new Error('挑战尚未达成，暂不记录通关。')
  const before = current.best[game][level]
  if (before && (game === 'mines' ? before.seconds <= result.seconds : before.centers >= result.centers)) return current
  current.best[game][level] = game === 'mines' ? { seconds: result.seconds, at: result.at }
    : { score: result.score, centers: result.centers, landings: 10, at: result.at }
  return current
}
export function summarizeSkillChallenges(state) {
  const current = readSkillChallenges(state)
  return { mines: Object.keys(current.best.mines).length, jump: Object.keys(current.best.jump).length, total: 6, best: current.best }
}
export function createSkillChallengesStore(storage) {
  return {
    read: () => readSkillChallenges(storage.get(SKILL_CHALLENGES_KEY)),
    save(game, level, result) {
      const current = this.read()
      const next = recordSkillChallenge(current, game, level, result)
      if (JSON.stringify(current) !== JSON.stringify(next)) storage.set(SKILL_CHALLENGES_KEY, next)
      return next
    }
  }
}
