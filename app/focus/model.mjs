export const FOCUS_KEY = 'miaobang.focus.v1'
const phases = ['running', 'paused', 'review']
export const RESULT_LABELS = { completed: '完成了', needs_more: '还需要一点时间', interrupted: '这次先停下' }
export const PHASE_LABELS = { running: '正在进行', paused: '已暂停', review: '一起收尾' }

export function emptyState() {
  return { version: 1, defaultMinutes: 10, active: null, history: [] }
}

function finite(value) { return typeof value === 'number' && Number.isFinite(value) }
function validTask(task) { return typeof task === 'string' && task.trim().length > 0 && task.length <= 80 }
function validTiming(record) {
  return record && typeof record.id === 'string' && record.id.startsWith('focus-') && validTask(record.task) &&
    Number.isInteger(record.plannedMs) && record.plannedMs >= 60000 && record.plannedMs <= 7200000 &&
    finite(record.elapsedMs) && record.elapsedMs >= 0 && record.elapsedMs <= record.plannedMs && finite(record.startedAt)
}

export function readState(value) {
  if (value === '' || value === null || value === undefined) return emptyState()
  const valid = value.version === 1 && Number.isInteger(value.defaultMinutes) && value.defaultMinutes >= 1 && value.defaultMinutes <= 120 &&
    Array.isArray(value.history) && value.history.every(record => validTiming(record) && finite(record.endedAt) && Object.prototype.hasOwnProperty.call(RESULT_LABELS, record.result)) &&
    new Set(value.history.map(record => record.id)).size === value.history.length &&
    (value.active === null || (validTiming(value.active) && phases.includes(value.active.phase) &&
      typeof value.active.boot === 'string' && finite(value.active.anchorMs) && !value.history.some(record => record.id === value.active.id)))
  if (!valid) throw new Error('本地专注记录无法识别，原记录未改动。请先保留数据，不要清空应用。')
  return JSON.parse(JSON.stringify(value))
}

export function reconcile(state, clock) {
  const active = state.active
  if (!active || active.phase === 'review') return state
  if (active.boot !== clock.boot || clock.monoMs < active.anchorMs) {
    return { ...state, active: { ...active, phase: 'review', reason: 'interrupted' } }
  }
  if (active.phase === 'paused') return state
  const elapsedMs = Math.min(active.plannedMs, active.elapsedMs + clock.monoMs - active.anchorMs)
  return { ...state, active: { ...active, elapsedMs, anchorMs: clock.monoMs,
    phase: elapsedMs === active.plannedMs ? 'review' : 'running', reason: elapsedMs === active.plannedMs ? 'due' : '' } }
}

export function begin(state, task, minutes, clock, id) {
  if (state.active) throw new Error('还有一轮没有结束，请先回到当前任务。')
  if (!validTask(task)) throw new Error('请写下 1–80 个字的小任务。')
  if (!Number.isInteger(minutes) || minutes < 1 || minutes > 120) throw new Error('时长需要是 1–120 的整数分钟。')
  if (state.history.some(record => record.id === id)) throw new Error('本轮编号重复，请重试。')
  return { ...state, defaultMinutes: minutes, active: { id, task: task.trim(), plannedMs: minutes * 60000,
    elapsedMs: 0, startedAt: clock.wallMs, boot: clock.boot, anchorMs: clock.monoMs, phase: 'running', reason: '' } }
}

export function changePhase(state, id, action, clock) {
  const next = reconcile(state, clock)
  const active = next.active
  if (!active || active.id !== id) throw new Error('当前任务已经变化，请重新查看。')
  if (active.phase === 'review') return next
  if (action === 'pause' && active.phase === 'running') return { ...next, active: { ...active, phase: 'paused' } }
  if (action === 'resume' && active.phase === 'paused') return { ...next, active: { ...active, phase: 'running', anchorMs: clock.monoMs } }
  if (action === 'end') return { ...next, active: { ...active, phase: 'review', reason: 'early' } }
  return next
}

export function finish(state, id, result, clock, reset = false) {
  if (state.history.some(record => record.id === id)) return state
  const next = reconcile(state, clock)
  const active = next.active
  if (!active || active.id !== id) throw new Error('当前任务已经变化，请重新查看。')
  if (!Object.prototype.hasOwnProperty.call(RESULT_LABELS, result) || (reset && result !== 'interrupted')) throw new Error('请选择本轮结果。')
  if (active.phase !== 'review' && !reset) throw new Error('请先结束计时，再一起确认结果。')
  const record = { id, task: active.task, plannedMs: active.plannedMs, elapsedMs: active.elapsedMs,
    startedAt: active.startedAt, endedAt: clock.wallMs, result, reason: reset ? 'reset' : active.reason }
  return { ...next, active: null, history: [record, ...next.history] }
}

export function clockText(milliseconds) {
  const seconds = Math.ceil(Math.max(0, milliseconds) / 1000)
  return `${String(Math.floor(seconds / 60)).padStart(2, '0')}:${String(seconds % 60).padStart(2, '0')}`
}

export function elapsedText(milliseconds) {
  const seconds = Math.floor(milliseconds / 1000)
  return seconds >= 60 ? `${Math.floor(seconds / 60)} 分 ${seconds % 60} 秒` : `${seconds} 秒`
}
