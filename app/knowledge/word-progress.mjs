import { wordById } from '../game/english.mjs'
export const WORD_PROGRESS_KEY = 'miaobang.word-progress.v1'
export const WORD_STAGES = ['recognize', 'assemble', 'write']
export const emptyWordProgress = () => ({ version: 1, words: {} })
const DAY = 86400000
const validTime = value => typeof value === 'string' && Number.isFinite(Date.parse(value)) && new Date(value).toISOString() === value
const unreadable = () => new Error('本机英语进度暂时无法读取，已保留原数据。仍可练习，修复前不会覆盖记录。')
export function readWordProgress(raw) {
  if (raw === '' || raw == null) return emptyWordProgress()
  let value
  try { value = typeof raw === 'string' ? JSON.parse(raw) : raw } catch { throw unreadable() }
  if (!value || value.version !== 1 || !value.words || typeof value.words !== 'object' || Array.isArray(value.words)) throw unreadable()
  const clean = emptyWordProgress()
  for (const [id, record] of Object.entries(value.words)) {
    if (!wordById.has(id) || !record || !Array.isArray(record.stages) || new Set(record.stages).size !== record.stages.length ||
      record.stages.some(stage => !WORD_STAGES.includes(stage)) || typeof record.review !== 'boolean' || !validTime(record.lastAt) || !validTime(record.dueAt)) throw unreadable()
    clean.words[id] = { stages: [...record.stages], review: record.review, lastAt: record.lastAt, dueAt: record.dueAt }
  }
  return clean
}
export function recordWordAttempt(progress, { id, stage, correct, independent, at = new Date().toISOString() }) {
  if (!wordById.has(id) || !WORD_STAGES.includes(stage) || typeof correct !== 'boolean' || typeof independent !== 'boolean' || !validTime(at)) throw new Error('这次英语练习记录不完整，请再试一次。')
  const next = readWordProgress(progress)
  const previous = next.words[id]
  const stages = [...(previous?.stages || [])]
  const success = correct && independent
  if (success && !stages.includes(stage)) stages.push(stage)
  const days = success ? ({ recognize: 1, assemble: 3, write: 7 })[stage] : 0
  next.words[id] = { stages, review: !success, lastAt: at, dueAt: new Date(Date.parse(at) + days * DAY).toISOString() }
  return next
}
export function reviewWordIds(progress, now = new Date().toISOString()) {
  const time = Date.parse(now)
  if (!Number.isFinite(time)) throw new Error('复习时间无效。')
  return Object.entries(progress.words).filter(([, record]) => record.review || Date.parse(record.dueAt) <= time).map(([id]) => id)
}
// Evidence is capped at three stages per word. Mastered means an independent spelling pass,
// not complete knowledge of the word in every context.
export function summarizeWordProgress(progress, now = new Date().toISOString()) {
  const records = Object.values(progress.words)
  const count = stage => records.filter(record => record.stages.includes(stage)).length
  const recognized = count('recognize'), assembled = count('assemble'), written = count('write')
  const evidence = recognized + assembled + written
  return { practiced: records.length, recognized, assembled, written, mastered: written,
    reviewCount: records.filter(record => record.review).length, dueCount: reviewWordIds(progress, now).length, evidence, points: evidence * 10 }
}
export function createWordProgressStore(storage) {
  return {
    read: () => readWordProgress(storage.get(WORD_PROGRESS_KEY)),
    record(attempt) {
      const next = recordWordAttempt(this.read(), attempt)
      storage.set(WORD_PROGRESS_KEY, next)
      return next
    }
  }
}
