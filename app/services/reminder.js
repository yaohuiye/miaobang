// #ifdef APP-PLUS
import { getReminderStatus, scheduleReminder, cancelReminder, requestReminderPermission } from '@/uni_modules/miaobang-reminder'
// #endif

export function reminderStatus() {
  // #ifdef APP-PLUS
  return JSON.parse(getReminderStatus())
  // #endif
  // #ifndef APP-PLUS
  return { supported: false, active: {}, remainingSeconds: 0 }
  // #endif
}

export function startReminder(seconds, ownerId = 'probe') {
  // #ifdef APP-PLUS
  return JSON.parse(scheduleReminder(seconds, ownerId))
  // #endif
  // #ifndef APP-PLUS
  throw new Error('请在安卓安装包中验证锁屏提醒')
  // #endif
}

export function stopReminder(ownerId = 'probe') {
  // #ifdef APP-PLUS
  return JSON.parse(cancelReminder(ownerId))
  // #endif
  // #ifndef APP-PLUS
  return reminderStatus()
  // #endif
}

export function requestPermission(kind) {
  // #ifdef APP-PLUS
  requestReminderPermission(kind)
  // #endif
}
