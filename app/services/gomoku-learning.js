import { createGomokuLearningStore } from '@/game/gomoku-learning.mjs'
export const gomokuLearningStore = createGomokuLearningStore({
  get: key => uni.getStorageSync(key),
  set: (key, value) => uni.setStorageSync(key, value)
})
