import { JUMP_LEVELS } from './skill-challenges.mjs'
export { JUMP_LEVELS } from './skill-challenges.mjs'
const clamp = (n, a, b) => Math.max(a, Math.min(b, n))
export function jumpDistance(seconds) { return 45 + clamp(seconds, 0, 1.2) * 180 }
export function createJump(random = Math.random, level = 'easy') {
  const config = JUMP_LEVELS.find(item => item.id === level)
  if (!config) throw new Error('没有这个跳跃难度，请重新选择。')
  const state = { level, status: 'ready', score: 0, landings: 0, centers: 0, passed: false, feedback: '', miss: '',
    player: { x: 70, y: 280 }, camera: 0, current: { x: 70, width: config.startWidth }, next: null, flight: null }
  nextPlatform(state, random)
  frameIslands(state)
  return state
}
function nextPlatform(state, random) {
  const config = JUMP_LEVELS.find(item => item.id === state.level)
  state.next = { x: state.current.x + config.minGap + random() * (config.maxGap - config.minGap),
    width: Math.max(config.minWidth, config.startWidth - 2 - state.landings * 2) }
}
// 为最远、最窄的下一座岛留出可见边缘，落点偏左时也不把目标挤出屏幕。
function frameIslands(state) {
  state.camera = Math.max(0, state.player.x - 70, state.next.x + state.next.width / 2 + 8 - 320)
}
export function launchJump(state, seconds) {
  if (state.status !== 'running' || state.flight || !Number.isFinite(seconds)) return false
  state.feedback = ''; state.miss = ''
  state.flight = { from: state.player.x, to: state.player.x + jumpDistance(seconds), elapsed: 0 }
  return true
}
export function stepJump(state, dt, random = Math.random) {
  if (state.status !== 'running' || !state.flight || !Number.isFinite(dt)) return state
  const flight = state.flight
  flight.elapsed += clamp(dt, 0, .05)
  const progress = Math.min(1, flight.elapsed / .75)
  state.player.x = flight.from + (flight.to - flight.from) * progress
  state.player.y = 280 - Math.sin(Math.PI * progress) * 130
  frameIslands(state)
  if (progress < 1) return state
  const config = JUMP_LEVELS.find(item => item.id === state.level)
  const signedOffset = state.player.x - state.next.x
  const offset = Math.abs(signedOffset)
  state.flight = null
  if (offset > state.next.width / 2) {
    state.status = 'over'; state.miss = signedOffset < 0 ? 'short' : 'long'
    state.feedback = state.miss === 'short' ? '这次偏短了，下次稍微多蓄力，再观察小岛的距离。' : '这次偏长了，下次少蓄力一点，再观察小岛的距离。'
    return state
  }
  const centered = offset <= config.centerRadius
  state.centers += centered ? 1 : 0
  state.score += centered ? 20 : 10
  state.landings += 1
  state.current = state.next
  state.feedback = centered ? '中心落点！这次距离和蓄力配合得很好。' : signedOffset < 0 ? '成功落地，稍微偏短；下次可以多蓄一点力。' : '成功落地，稍微偏长；下次可以少蓄一点力。'
  if (state.landings === 10) {
    state.status = 'complete'; state.passed = state.centers >= config.centers
    if (!state.passed) state.feedback = `已到达 10 座岛，中心落点 ${state.centers}/${config.centers} 次。观察每次偏短、偏长的反馈，再试一次。`
  } else nextPlatform(state, random)
  frameIslands(state)
  return state
}
