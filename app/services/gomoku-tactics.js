import { createTacticalProgressStore } from '@/game/gomoku-tactics-progress.mjs'
export const tacticalProgressStore = createTacticalProgressStore({
  get: key => uni.getStorageSync(key),
  set: (key, value) => uni.setStorageSync(key, value)
})
