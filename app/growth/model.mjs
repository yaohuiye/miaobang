export const GROWTH_KEY = 'miaobang.growth.v1'
export const REVIEW_FIELDS = ['good', 'retry', 'next', 'parent']
export const emptyDay = () => ({ good: '', retry: '', next: '', parent: '', flowerReason: '' })
export const dayKey = (date = new Date()) => `${date.getFullYear()}-${String(date.getMonth()+1).padStart(2,'0')}-${String(date.getDate()).padStart(2,'0')}`
function validDate(key) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(key)) return false
  const date = new Date(`${key}T12:00:00`)
  return !Number.isNaN(date.getTime()) && dayKey(date) === key
}
function validDay(value) {
  return value && [...REVIEW_FIELDS,'flowerReason'].every(key => typeof value[key] === 'string' && value[key].length <= 160)
}
export function readGarden(raw) {
  if (raw === '' || raw == null) return { version:1, days:{} }
  const value = typeof raw === 'string' ? JSON.parse(raw) : raw
  if (!value || value.version !== 1 || !value.days || typeof value.days !== 'object' || Array.isArray(value.days) || Object.entries(value.days).some(([date,day]) => !validDate(date) || !validDay(day))) throw new Error('成长记录暂时无法读取，请保留原数据后重试。')
  return { version:1, days:Object.fromEntries(Object.entries(value.days).map(([date,day]) => [date,{...day}])) }
}
export function createGardenStore(storage) {
  return {
    read() { return readGarden(storage.get(GROWTH_KEY)) },
    save(date, draft, flower = false) {
      if (!validDate(date) || !REVIEW_FIELDS.every(key => typeof draft[key] === 'string' && draft[key].length <= 160)) throw new Error('每项最多写 160 个字，请检查记录。')
      const garden = this.read(), previous = garden.days[date] || emptyDay()
      if (flower && !previous.flowerReason && !draft.good.trim()) throw new Error('先记下一件值得鼓励的具体尝试，再留一朵花。')
      const record = { ...Object.fromEntries(REVIEW_FIELDS.map(key => [key,draft[key]])), flowerReason:previous.flowerReason || (flower ? draft.good.trim() : '') }
      const days = {...garden.days}
      if (Object.values(record).some(text=>text.trim())) days[date] = record
      else delete days[date]
      const next = { version:1, days }
      storage.set(GROWTH_KEY,next)
      return next
    }
  }
}
