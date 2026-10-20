import { tacticalPuzzles } from './gomoku-tactics.mjs'
import { readGomokuLearning } from './gomoku-learning.mjs'

export const GOMOKU_TACTICS_KEY = 'miaobang.gomoku-tactics.v1'
export function recordTacticalProgress(raw, attempt, { independent = false } = {}) {
  if (!tacticalPuzzles.some(p => p.id === attempt?.puzzleId) || !['won', 'defended'].includes(attempt.status) || attempt.childTurns < 2) throw new Error('请先完成整段攻防，再记录这题。')
  const next = readGomokuLearning(raw)
  if (!next.practiced.includes(attempt.puzzleId)) next.practiced.push(attempt.puzzleId)
  if (independent && !attempt.assisted && !attempt.mistakes && !next.independent.includes(attempt.puzzleId)) next.independent.push(attempt.puzzleId)
  return next
}
export function createTacticalProgressStore(storage) {
  return {
    read() { return readGomokuLearning(storage.get(GOMOKU_TACTICS_KEY)) },
    save(attempt, options) {
      const previous = this.read()
      const next = recordTacticalProgress(previous, attempt, options)
      if (JSON.stringify(previous) !== JSON.stringify(next)) storage.set(GOMOKU_TACTICS_KEY, next)
      return next
    }
  }
}
