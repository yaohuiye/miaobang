import { numberLevels } from '../data/number-levels.mjs'
import { safetyScenes } from '../data/safety-scenes.mjs'
export const FAMILY_GAME_KEY = 'miaobang.family-games.v1'
const validIds = { bridges:numberLevels.map(level=>level.id), scenes:safetyScenes.map(scene=>scene.id) }
export function readFamilyProgress(raw) {
  if (raw === '' || raw == null) return {version:1,bridges:[],scenes:[]}
  const value = typeof raw === 'string' ? JSON.parse(raw) : raw
  if (!value || value.version !== 1 || !['bridges','scenes'].every(key=>Array.isArray(value[key]) && value[key].every(id=>typeof id==='string'))) throw new Error('游戏记录暂时无法读取，请保留原数据后重试。')
  return {version:1,...Object.fromEntries(Object.entries(validIds).map(([key,ids])=>[key,[...new Set(value[key].filter(id=>ids.includes(id)))]]))}
}
export function createFamilyProgressStore(storage) {
  return {
    read() { return readFamilyProgress(storage.get(FAMILY_GAME_KEY)) },
    mark(kind,id) {
      if (!validIds[kind]?.includes(id)) throw new Error('找不到这条游戏记录。')
      const previous = this.read()
      if (previous[kind].includes(id)) return previous
      const next = {...previous,[kind]:[...previous[kind],id]}
      storage.set(FAMILY_GAME_KEY,next)
      return next
    }
  }
}
