export const ORAL_KEY = 'miaobang.oral.v1'
export const DAILY_COUNT = 20
// 人教版四年级上册口算范围：大数的认识（整万加减）、第四单元口算乘法、
// 第六单元口算除法（整十数除整十、几百几十）与四舍五入估算。
export const KIND_LABELS = {
  'sw-add': '整万数加法',
  'sw-sub': '整万数减法',
  m1: '两位数×一位数',
  m2: '几百几十×一位数',
  m3: '两位数×整十数',
  d1: '除数是整十数的除法',
  'est-m': '乘法估算',
  'est-d': '除法估算'
}
export const KIND_ORDER = ['sw-add', 'sw-sub', 'm1', 'm2', 'm3', 'd1', 'est-m', 'est-d']
export const DAILY_QUOTAS = { 'sw-add': 2, 'sw-sub': 2, m1: 4, m2: 3, m3: 3, d1: 4, 'est-m': 1, 'est-d': 1 }
const QUOTA_TOTAL = Object.values(DAILY_QUOTAS).reduce((sum, count) => sum + count, 0)
if (QUOTA_TOTAL !== DAILY_COUNT) throw new Error(`每日题型数量配置需要合计 ${DAILY_COUNT} 题`)

// 练习模式：全部题型，或只练乘除（整万加减先不出）。每轮仍为 20 题，打卡记录不变。
export const ROUND_MODE_LABELS = { all: '全部题型', md: '只练乘除' }
const MD_ONLY_QUOTAS = { m1: 5, m2: 4, m3: 4, d1: 5, 'est-m': 1, 'est-d': 1 }
const ROUND_MODE_QUOTAS = { all: DAILY_QUOTAS, md: MD_ONLY_QUOTAS }
const MD_TOTAL = Object.values(MD_ONLY_QUOTAS).reduce((sum, count) => sum + count, 0)
if (MD_TOTAL !== DAILY_COUNT) throw new Error(`乘除练习的题型数量需要合计 ${DAILY_COUNT} 题`)
export function quotasForMode(mode) {
  if (!Object.prototype.hasOwnProperty.call(ROUND_MODE_QUOTAS, mode)) throw new Error('没有这个练习模式，请重新选择。')
  return ROUND_MODE_QUOTAS[mode]
}

const pick = (random, values) => values[Math.floor(random() * values.length)]
const round10 = value => Math.round(value / 10) * 10

function makeQuestion(kind, random) {
  if (kind === 'sw-add') {
    const a = 10 + Math.floor(random() * 80)
    const b = 10 + Math.floor(random() * 80)
    return { kind, text: `${a}万＋${b}万`, answer: a + b, unit: '万', accept: [a + b] }
  }
  if (kind === 'sw-sub') {
    let a = 10 + Math.floor(random() * 80)
    let b = 10 + Math.floor(random() * 80)
    if (a < b) [a, b] = [b, a]
    if (a === b) { if (b > 10) b -= 1; else a += 1 }
    return { kind, text: `${a}万－${b}万`, answer: a - b, unit: '万', accept: [a - b] }
  }
  if (kind === 'm1') {
    let a = 0
    let b = 0
    do { a = 12 + Math.floor(random() * 78); b = 3 + Math.floor(random() * 7) } while (a * b > 999)
    return { kind, text: `${a}×${b}`, answer: a * b, accept: [a * b] }
  }
  if (kind === 'm2') {
    const a = (11 + Math.floor(random() * 39)) * 10
    const b = 2 + Math.floor(random() * 3)
    return { kind, text: `${a}×${b}`, answer: a * b, accept: [a * b] }
  }
  if (kind === 'm3') {
    const a = 11 + Math.floor(random() * 39)
    const b = pick(random, [20, 30, 40, 50])
    return { kind, text: `${a}×${b}`, answer: a * b, accept: [a * b] }
  }
  if (kind === 'd1') {
    const b = pick(random, [20, 30, 40, 50, 60, 70, 80])
    const quotient = 2 + Math.floor(random() * 11)
    const a = b * quotient
    if (a > 1000) return makeQuestion(kind, random)
    return { kind, text: `${a}÷${b}`, answer: quotient, accept: [quotient] }
  }
  if (kind === 'est-m') {
    let a = 0
    let b = 0
    do { a = 19 + Math.floor(random() * 70); b = 19 + Math.floor(random() * 70) } while (a % 10 === 0 && b % 10 === 0)
    const estimate = round10(a) * round10(b)
    return { kind, text: `${a}×${b}≈`, answer: estimate, accept: [estimate, a * b] }
  }
  // est-d：被除数接近整十数的整倍数，四舍五入后恰好整除。
  let b = pick(random, [20, 30, 40, 50, 60, 70, 80])
  let quotient = 2 + Math.floor(random() * 8)
  let estimateBase = b * quotient
  if (estimateBase > 700) return makeQuestion(kind, random)
  const spread = Math.floor(b / 2) - 1
  const offset = spread <= 0 ? 0 : Math.floor(random() * (spread * 2 + 1)) - spread
  const a = estimateBase + offset
  if (a <= b || round10(a) !== estimateBase) return makeQuestion(kind, random)
  const accept = [quotient]
  if (a % b === 0) accept.push(a / b)
  return { kind, text: `${a}÷${b}≈`, answer: quotient, accept, note: '把被除数看作整十数再口算' }
}

// random 由调用方注入（页面用 Math.random，测试用固定种子），同一序列生成同一轮题目。
export function buildRound(random = Math.random, quotas = DAILY_QUOTAS) {
  const plan = Object.entries(quotas).flatMap(([kind, count]) => Array.from({ length: count }, () => kind))
  const texts = new Set()
  const questions = plan.map(kind => {
    let question = makeQuestion(kind, random)
    for (let tries = 0; texts.has(question.text) && tries < 50; tries += 1) question = makeQuestion(kind, random)
    texts.add(question.text)
    return { id: `${kind}-${question.text.replace(/[万＋－≈÷×]/g, '')}`, kind, text: question.text, answer: question.answer, unit: question.unit || '', accept: question.accept, note: question.note || '' }
  })
  // 洗牌后同一轮里题型交错，更像一张口算卡。
  for (let i = questions.length - 1; i > 0; i -= 1) {
    const j = Math.floor(random() * (i + 1))
    ;[questions[i], questions[j]] = [questions[j], questions[i]]
  }
  return questions
}

export function judgeAnswer(question, input) {
  if (!question || !Array.isArray(question.accept) || !question.accept.length) throw new Error('这道题暂时无法判分，请重新出题。')
  const value = Number(String(input ?? '').replace(/[万,，\s]/g, ''))
  if (!Number.isFinite(value)) return { correct: false, expected: `${question.answer}${question.unit || ''}` }
  return { correct: question.accept.includes(value), expected: `${question.accept[0]}${question.unit || ''}` }
}

export function emptyState() {
  return { version: 1, history: [], wrongBook: [] }
}

export function dayKey(date = new Date()) {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`
}

function validDate(key) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(key)) return false
  const date = new Date(`${key}T12:00:00`)
  return !Number.isNaN(date.getTime()) && dayKey(date) === key
}

function validRecord(record) {
  return record && typeof record.id === 'string' && record.id.startsWith('oral-') && validDate(record.date) &&
    Number.isInteger(record.correct) && record.correct >= 0 && record.correct <= DAILY_COUNT &&
    Number.isInteger(record.total) && record.total === DAILY_COUNT &&
    typeof record.seconds === 'number' && Number.isFinite(record.seconds) && record.seconds >= 0 && record.seconds < 86400 &&
    Number.isFinite(record.endedAt)
}

// 错题本上限：只留最近的错题，防止本地记录无限膨胀。
export const WRONG_BOOK_LIMIT = 50

function validWrongEntry(entry) {
  return entry && typeof entry.id === 'string' && entry.id && KIND_ORDER.includes(entry.kind) &&
    typeof entry.text === 'string' && entry.text &&
    Number.isInteger(entry.answer) &&
    Array.isArray(entry.accept) && entry.accept.length > 0 && entry.accept.every(Number.isInteger) &&
    typeof entry.unit === 'string' && typeof entry.note === 'string' &&
    typeof entry.wrongAnswer === 'string' && Number.isFinite(entry.at)
}

function normalizeWrongItem(item, index) {
  const entry = {
    id: typeof item?.id === 'string' ? item.id : '', kind: item?.kind,
    text: item?.text, answer: item?.answer, unit: item?.unit || '', accept: item?.accept,
    note: item?.note || '', wrongAnswer: String(item?.wrongAnswer ?? ''), at: item?.at
  }
  if (!validWrongEntry(entry)) throw new Error(`第 ${index + 1} 道错题的信息不完整，这次先不保存，请重新完成一轮。`)
  return entry
}

export function readState(value) {
  if (value === '' || value === null || value === undefined) return emptyState()
  let state
  try {
    state = typeof value === 'string' ? JSON.parse(value) : value
  } catch (error) {
    throw new Error('本地口算记录无法识别，原记录未改动。请先保留数据，不要清空应用。')
  }
  // 旧版本记录没有错题本字段：按空错题本补齐，旧数据原样保留、不要求重写。
  const wrongBook = state ? (state.wrongBook === undefined ? [] : state.wrongBook) : null
  const valid = state && state.version === 1 && Array.isArray(state.history) &&
    state.history.length <= 1000 && state.history.every(validRecord) &&
    new Set(state.history.map(record => record.id)).size === state.history.length &&
    Array.isArray(wrongBook) && wrongBook.length <= WRONG_BOOK_LIMIT && wrongBook.every(validWrongEntry)
  if (!valid) throw new Error('本地口算记录无法识别，原记录未改动。请先保留数据，不要清空应用。')
  return JSON.parse(JSON.stringify({ version: 1, history: state.history, wrongBook }))
}

export function recordAttempt(state, attempt, wrongQuestions = []) {
  const record = {
    id: `oral-${attempt.id}`, date: attempt.date, correct: attempt.correct, total: DAILY_COUNT,
    seconds: attempt.seconds, endedAt: attempt.endedAt
  }
  if (!validRecord(record)) throw new Error('这次口算记录不完整，请重新完成一轮再保存。')
  const current = readState(state)
  if (current.history.some(item => item.id === record.id)) throw new Error('这一轮已经保存过了，再来一组新的吧。')
  // 打卡与错题本一次写入：避免只存一半。错题排在最前，超出上限淘汰最旧的。
  const wrongBook = wrongQuestions.map(normalizeWrongItem).concat(current.wrongBook).slice(0, WRONG_BOOK_LIMIT)
  return { version: 1, history: [record, ...current.history], wrongBook }
}

// 错题重练：取最近记录的错题原样重做，题目不变，轮数按错题数量而定，不写入打卡。
export function buildWrongRound(state) {
  return readState(state).wrongBook.slice(0, DAILY_COUNT).map(entry => ({
    id: entry.id, kind: entry.kind, text: entry.text, answer: entry.answer,
    unit: entry.unit, accept: entry.accept.slice(), note: entry.note
  }))
}

// 重练答对的题移出错题本；同一道题的多条记录一并移除。
export function pruneWrong(state, ids) {
  const current = readState(state)
  const mastered = new Set(ids)
  return { version: 1, history: current.history, wrongBook: current.wrongBook.filter(entry => !mastered.has(entry.id)) }
}

export function hasCheckIn(state, date = dayKey()) {
  return state.history.some(record => record.date === date)
}

function shiftDate(key, days) {
  const date = new Date(`${key}T12:00:00`)
  date.setDate(date.getDate() + days)
  return dayKey(date)
}

// 连续打卡天数：从今天（或昨天）往回数，每天至少完成一轮。
export function streak(state, today = dayKey()) {
  let cursor = hasCheckIn(state, today) ? today : shiftDate(today, -1)
  let count = 0
  while (hasCheckIn(state, cursor) && count < 3650) {
    count += 1
    cursor = shiftDate(cursor, -1)
  }
  return count
}

export function summarize(state, today = dayKey()) {
  const todayRecords = state.history.filter(record => record.date === today)
  return {
    days: new Set(state.history.map(record => record.date)).size,
    rounds: state.history.length,
    streak: streak(state, today),
    todayDone: todayRecords.length > 0,
    todayBest: todayRecords.reduce((best, record) => Math.max(best, record.correct), 0)
  }
}

export function createOralStore(storage) {
  return {
    read: () => readState(storage.get(ORAL_KEY)),
    save(attempt, wrongQuestions = []) {
      // 先写入再返回：写入失败绝不能被当成保存成功。
      const next = recordAttempt(this.read(), attempt, wrongQuestions)
      storage.set(ORAL_KEY, next)
      return next
    },
    pruneWrong(ids) {
      const next = pruneWrong(this.read(), ids)
      storage.set(ORAL_KEY, next)
      return next
    }
  }
}
