import { lightLevels } from '../data/light-levels.mjs'
export const LIGHT_KEY='miaobang.light.v1'
const ids=lightLevels.map(level=>level.id)
export function readLightProgress(raw) {
  if(raw==null || raw==='') return {version:1,completed:[]}
  const value=typeof raw==='string' ? JSON.parse(raw) : raw
  if(!value || value.version!==1 || !Array.isArray(value.completed) || value.completed.some(id=>typeof id!=='string')) throw new Error('灯塔记录暂时无法读取，请保留原数据后重试。')
  return {version:1,completed:[...new Set(value.completed.filter(id=>ids.includes(id)))]}
}
export function createLightStore(storage) {
  return {
    read() { return readLightProgress(storage.get(LIGHT_KEY)) },
    mark(id) {
      if(!ids.includes(id)) throw new Error('找不到这座灯塔。')
      const previous=this.read()
      if(previous.completed.includes(id)) return previous
      const next={version:1,completed:[...previous.completed,id]}
      storage.set(LIGHT_KEY,next)
      return next
    }
  }
}
