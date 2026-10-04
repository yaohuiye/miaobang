import { validCommands } from './route.mjs'

export const PROGRESS_KEY = 'miaobang.puzzle-progress.v1'

export function readProgress(value, levelIds) {
  if (value === '' || value === null || value === undefined) return {}
  if (value.version !== 1 || !value.levels || typeof value.levels !== 'object' || Array.isArray(value.levels)) {
    throw new Error('解谜记录格式无法识别，原记录未改动')
  }
  const levels = {}
  for (const id of levelIds) {
    if (!Object.prototype.hasOwnProperty.call(value.levels, id)) continue
    const record = value.levels[id]
    if (!record || typeof record.completed !== 'boolean' || !validCommands(record.commands)) {
      throw new Error('解谜记录不完整，原记录未改动')
    }
    levels[id] = { completed: record.completed, commands: [...record.commands] }
  }
  return levels
}

export function updateProgress(progress, id, commands, completed) {
  if (!validCommands(commands)) throw new Error('无法保存这条路线')
  return { ...progress, [id]: { commands: [...commands], completed: !!(completed || progress[id]?.completed) } }
}
