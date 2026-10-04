import { readState, reconcile, begin, changePhase, finish } from './model.mjs'

// 存储与系统提醒由边界注入，规则和保存失败场景可在无手机时验证。
export function createFocusService(io) {
  function save(state) { io.write(state); return state }
  function cancel(id, env) {
    if (env.reminder.supported) env.reminder = io.cancel(id)
  }
  function schedule(state, env) {
    const active = state.active
    if (!active || active.phase !== 'running' || !env.reminder.supported || !env.reminder.notificationAllowed || !env.reminder.exactAllowed) return ''
    try {
      env.reminder = io.schedule(Math.max(1, Math.ceil((active.plannedMs - active.elapsedMs) / 1000)), active.id)
      return ''
    } catch (error) { return '计时已保存，但到点提醒未安排成功：' + error.message }
  }
  function snapshot(checkpoint = false) {
    const stored = readState(io.read())
    const env = io.environment()
    const state = reconcile(stored, env.clock)
    if (stored.active && state.active.phase !== stored.active.phase) {
      if (state.active.reason === 'interrupted') cancel(state.active.id, env)
      save(state)
    } else if (checkpoint && state.active?.phase === 'running') save(state)
    if (!state.active && env.reminder.active?.ownerId?.startsWith('focus-') && ['scheduled', 'elapsed'].includes(env.reminder.active.phase)) cancel(env.reminder.active.ownerId, env)
    return { state, reminder: env.reminder, warning: '' }
  }
  function start(task, minutes) {
    const env = io.environment()
    const state = begin(readState(io.read()), task, minutes, env.clock, io.id())
    save(state) // 本地写入成功后才安排系统提醒。
    const warning = schedule(state, env)
    return { state, reminder: env.reminder, warning }
  }
  function transition(id, action) {
    const env = io.environment()
    const stored = readState(io.read())
    const state = changePhase(stored, id, action, env.clock)
    if (action !== 'resume' || state.active.phase !== 'running') cancel(id, env)
    // 撤销先于保存：保存失败时仍保持旧状态，并明确暴露提醒未安排的状态。
    save(state)
    const warning = action === 'resume' && stored.active.phase === 'paused' ? schedule(state, env) : ''
    return { state, reminder: env.reminder, warning }
  }
  function complete(id, result, reset = false) {
    const env = io.environment()
    const stored = readState(io.read())
    const state = finish(stored, id, result, env.clock, reset)
    if (state === stored) return { state, reminder: env.reminder, warning: '' }
    cancel(id, env)
    save(state) // 活动与历史放在同一个存储值中，避免生成重复历史。
    return { state, reminder: env.reminder, warning: '' }
  }
  function enableReminder(id) {
    const env = io.environment()
    const state = reconcile(readState(io.read()), env.clock)
    if (state.active?.id !== id || state.active.phase !== 'running') throw new Error('请回到进行中的任务再开启提醒。')
    save(state)
    const warning = schedule(state, env)
    return { state, reminder: env.reminder, warning }
  }
  return { snapshot, start, transition, complete, enableReminder }
}
