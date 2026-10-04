import { entries, entryById } from '../data/knowledge/index.mjs'
export const KNOWLEDGE_KEY = 'miaobang.knowledge.v1'
export const emptyProgress = () => ({ version: 1, favorites: [], review: [] })
const normalize = value => String(value ?? '').normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().replace(/\s+/g, '')
const index = new Map(entries.map(entry => [entry.id, normalize([entry.title, entry.pronunciation, entry.topic, entry.summary, entry.example].join(' '))]))
export function searchEntries({ query = '', subject = 'all', topic = '', shelf = 'all', progress = emptyProgress() } = {}) {
  const terms = query.trim().split(/\s+/).filter(Boolean).map(normalize)
  return entries.filter(entry => (subject === 'all' || entry.subject === subject) && (!topic || entry.topic === topic) &&
    (shelf === 'all' || progress[shelf]?.includes(entry.id)) && terms.every(term => index.get(entry.id).includes(term)))
}
export function readProgress(raw) {
  if (raw === '' || raw == null) return emptyProgress()
  const value = typeof raw === 'string' ? JSON.parse(raw) : raw
  if (!value || value.version !== 1 || !Array.isArray(value.favorites) || !Array.isArray(value.review)) throw new Error('本机学习记录暂时无法读取。仍可查词；请先保留应用数据，不要清除。')
  const clean = ids => [...new Set(ids.filter(id => entryById.has(id)))]
  return { version: 1, favorites: clean(value.favorites), review: clean(value.review) }
}
export function setOnShelf(progress, shelf, id, enabled) {
  if (!['favorites', 'review'].includes(shelf) || !entryById.has(id)) throw new Error('这条知识暂时不可用。')
  const ids = progress[shelf].filter(value => value !== id)
  if (enabled) ids.push(id)
  return { ...progress, [shelf]: ids }
}
export function shuffle(values, random = Math.random) {
  const result = [...values]
  for (let i = result.length - 1; i > 0; i--) {
    const j = Math.floor(random() * (i + 1))
    ;[result[i], result[j]] = [result[j], result[i]]
  }
  return result
}
export const makePractice = (pool, random = Math.random) => shuffle(pool, random).slice(0, 5).map(entry => entry.id)
export function judgeAnswer(id, answer) {
  const entry = entryById.get(id)
  if (!entry || !entry.quiz.options.includes(answer)) throw new Error('请选择题目中的一个答案。')
  return { correct: answer === entry.quiz.answer, explanation: entry.quiz.explanation }
}
export function createKnowledgeStore(storage) {
  return {
    read: () => readProgress(storage.get(KNOWLEDGE_KEY)),
    set(shelf, id, enabled) {
      // Write before returning: a failed write must never look like a successful save.
      const next = setOnShelf(this.read(), shelf, id, enabled)
      storage.set(KNOWLEDGE_KEY, next)
      return next
    }
  }
}
