import { KIND_LABELS, KIND_ORDER, ORAL_KEY, readState as readOralState, dayKey, buildVariant } from './oral.mjs'

export const ORAL_LEARNING_KEY = 'miaobang.oral-learning.v1'
const blankStats = () => ({ firstTotal: 0, firstCorrect: 0, reviewTotal: 0, reviewCorrect: 0 })
export const emptyLearningState = () => ({ version: 1, stats: {}, cards: [], sessions: [] })
const clone = value => JSON.parse(JSON.stringify(value))
const dateValid = value => typeof value === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(value) && dayKey(new Date(`${value}T12:00:00`)) === value
const nextDay = value => { const date = new Date(`${value}T12:00:00`); date.setDate(date.getDate() + 1); return dayKey(date) }
export const questionKey = question => `${question.kind}:${question.text.replace(/\s/g, '')}`
function validQuestion(q) {
  return q && KIND_ORDER.includes(q.kind) && typeof q.id === 'string' && q.id.length > 0 &&
    typeof q.text === 'string' && q.text.length > 0 && Number.isInteger(q.answer) &&
    typeof q.unit === 'string' && typeof q.note === 'string' && Array.isArray(q.accept) &&
    q.accept.length > 0 && q.accept.every(Number.isInteger) && q.accept.includes(q.answer)
}
function questionOnly(q) {
  return { id: q.id, kind: q.kind, text: q.text, answer: q.answer, unit: q.unit || '', note: q.note || '', accept: q.accept?.slice() }
}
function validStats(stats) {
  return stats && ['firstTotal', 'firstCorrect', 'reviewTotal', 'reviewCorrect'].every(key => Number.isSafeInteger(stats[key]) && stats[key] >= 0) &&
    stats.firstCorrect <= stats.firstTotal && stats.reviewCorrect <= stats.reviewTotal
}
const unreadable = () => new Error('本机口算学习进度无法识别，原记录未改动，请不要清空应用。')
export function readLearningState(value) {
  if (value === '' || value === null || value === undefined) return emptyLearningState()
  let state
  try { state = typeof value === 'string' ? JSON.parse(value) : value } catch { throw unreadable() }
  if (!state || state.version !== 1 || !state.stats || typeof state.stats !== 'object' || Array.isArray(state.stats) ||
    !Object.keys(state.stats).every(kind => KIND_ORDER.includes(kind) && validStats(state.stats[kind])) ||
    !Array.isArray(state.cards) || state.cards.length > 10000 ||
    !state.cards.every(card => validQuestion(card.question) && card.key === questionKey(card.question) && ['new', 'verify', 'mastered'].includes(card.stage) && typeof card.lastVariant === 'string' &&
      (card.stage === 'new' ? card.verifiedOn === '' && card.due === '' : dateValid(card.verifiedOn) && dateValid(card.due) && card.due > card.verifiedOn)) ||
    new Set(state.cards.map(card => card.key)).size !== state.cards.length ||
    !Array.isArray(state.sessions) || state.sessions.length > 10000 ||
    !state.sessions.every(session => session && typeof session.id === 'string' && session.id.length > 0 && typeof session.signature === 'string' && session.signature.length > 0) ||
    new Set(state.sessions.map(session => session.id)).size !== state.sessions.length) throw unreadable()
  return clone(state)
}

// 旧错题本只读取，不移动或删除旧题；重复旧记录仅展示一个学习任务。
export function withLegacyWrongBook(state, wrongBook = []) {
  const next = readLearningState(state)
  const keys = new Set(next.cards.map(card => card.key))
  for (const entry of wrongBook) {
    const question = questionOnly(entry)
    if (!validQuestion(question)) throw unreadable()
    const key = questionKey(question)
    if (keys.has(key)) continue
    next.cards.push({ key, question, stage: 'new', verifiedOn: '', due: '', lastVariant: '' })
    keys.add(key)
  }
  return next
}

export function buildReviewRound(state, today = dayKey(), random = Math.random) {
  if (!dateValid(today)) throw new Error('复习日期无效。')
  // 先复习已经到期的任务；当天通过的任务隔日再验证，不靠当天反复刷题升级。
  return readLearningState(state).cards.filter(card => card.stage === 'new' || (card.stage === 'verify' && card.due <= today))
    .sort((a, b) => (a.stage === 'verify' ? 0 : 1) - (b.stage === 'verify' ? 0 : 1))
    .slice(0, 20).map((card, index) => ({ ...buildVariant(card.question, random, [card.lastVariant]), id: `review-${index}-${card.key}`, sourceKey: card.key }))
}

export function recordLearningSession(state, session) {
  const current = readLearningState(state)
  if (!session || typeof session.id !== 'string' || !session.id || !dateValid(session.date) ||
    !['daily', 'review'].includes(session.mode) || !Array.isArray(session.results) || session.results.length < 1 || session.results.length > 20 ||
    !session.results.every(result => result && validQuestion(result.question) && typeof result.correct === 'boolean' &&
      (session.mode === 'daily' ? !result.sourceKey : typeof result.sourceKey === 'string')) ||
    new Set(session.results.map(result => session.mode === 'review' ? result.sourceKey : questionKey(result.question))).size !== session.results.length) {
    throw new Error('本轮口算学习记录不完整，请保留页面后重试。')
  }
  const signature = JSON.stringify({ date: session.date, mode: session.mode, results: session.results.map(result => ({ question: questionOnly(result.question), correct: result.correct, sourceKey: result.sourceKey || '' })) })
  const saved = current.sessions.find(item => item.id === session.id)
  if (saved) {
    if (saved.signature !== signature) throw new Error('这轮学习编号已有其他结果，请保留当前页面。')
    return current
  }
  const next = clone(current)
  for (const result of session.results) {
    const q = result.question
    const stats = next.stats[q.kind] || (next.stats[q.kind] = blankStats())
    const review = session.mode === 'review'
    stats[review ? 'reviewTotal' : 'firstTotal'] += 1
    if (result.correct) stats[review ? 'reviewCorrect' : 'firstCorrect'] += 1
    if (review) {
      const card = next.cards.find(item => item.key === result.sourceKey)
      if (!card || card.question.kind !== q.kind || card.question.text === q.text || card.lastVariant === q.text || card.stage === 'mastered' ||
        (card.stage === 'verify' && card.due > session.date)) throw new Error('本轮复习任务已变更或尚未到期，请返回后重新出题。')
      card.lastVariant = q.text
      if (!result.correct) {
        card.stage = 'new'; card.verifiedOn = ''; card.due = ''
      } else if (card.stage === 'verify') {
        card.stage = 'mastered'
      } else {
        card.stage = 'verify'; card.verifiedOn = session.date; card.due = nextDay(session.date)
      }
    } else if (!result.correct) {
      const key = questionKey(q)
      const card = next.cards.find(item => item.key === key)
      if (card) { card.stage = 'new'; card.verifiedOn = ''; card.due = '' }
      else next.cards.push({ key, question: questionOnly(q), stage: 'new', verifiedOn: '', due: '', lastVariant: '' })
    }
  }
  next.sessions.push({ id: session.id, signature })
  return readLearningState(next)
}

export function summarizeLearning(state, today = dayKey()) {
  const current = readLearningState(state)
  const kinds = KIND_ORDER.map(kind => {
    const stats = current.stats[kind] || blankStats()
    const cards = current.cards.filter(card => card.question.kind === kind)
    return { kind, label: KIND_LABELS[kind], ...stats, accuracy: stats.firstTotal ? Math.round(stats.firstCorrect / stats.firstTotal * 100) : null,
      mastered: cards.filter(card => card.stage === 'mastered').length,
      pending: cards.filter(card => card.stage !== 'mastered').length,
      due: cards.filter(card => card.stage === 'new' || (card.stage === 'verify' && card.due <= today)).length }
  })
  return { kinds, firstTotal: kinds.reduce((sum, kind) => sum + kind.firstTotal, 0), firstCorrect: kinds.reduce((sum, kind) => sum + kind.firstCorrect, 0),
    mastered: kinds.reduce((sum, kind) => sum + kind.mastered, 0), pending: kinds.reduce((sum, kind) => sum + kind.pending, 0),
    due: kinds.reduce((sum, kind) => sum + kind.due, 0), waiting: current.cards.filter(card => card.stage === 'verify' && card.due > today).length,
    sessions: current.sessions.length }
}

export function createOralLearningStore(storage) {
  return {
    read() { return withLegacyWrongBook(readLearningState(storage.get(ORAL_LEARNING_KEY)), readOralState(storage.get(ORAL_KEY)).wrongBook) },
    summary(today = dayKey()) { return summarizeLearning(this.read(), today) },
    save(session) {
      const current = this.read()
      const next = recordLearningSession(current, session)
      if (!current.sessions.some(item => item.id === session.id)) storage.set(ORAL_LEARNING_KEY, next)
      return next
    }
  }
}
