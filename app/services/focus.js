import { FOCUS_KEY } from '@/focus/model.mjs'
import { createFocusService } from '@/focus/service.mjs'
import { reminderStatus, startReminder, stopReminder } from '@/services/reminder.js'

export const focusService = createFocusService({
  read: () => uni.getStorageSync(FOCUS_KEY),
  write: state => uni.setStorageSync(FOCUS_KEY, state),
  environment: () => {
    const reminder = reminderStatus()
    if (reminder.supported) return { clock: reminder.clock, reminder }
    // 网页没有可靠的跨刷新开机时钟：刷新后保守转为中断，不补算未知时长。
    return { reminder, clock: { boot: 'web-' + performance.timeOrigin, monoMs: performance.now(), wallMs: Date.now() } }
  },
  schedule: startReminder,
  cancel: stopReminder,
  id: () => 'focus-' + Date.now().toString(36) + '-' + Math.random().toString(36).slice(2)
})
