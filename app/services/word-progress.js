import { createWordProgressStore } from '@/knowledge/word-progress.mjs'
export const wordProgressStore = createWordProgressStore({
  get: key => uni.getStorageSync(key),
  set: (key, value) => uni.setStorageSync(key, value)
})
