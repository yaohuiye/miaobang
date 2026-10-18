import { createOralLearningStore } from '@/math/oral-learning.mjs'
export const oralLearningStore = createOralLearningStore({
  get: key => uni.getStorageSync(key),
  set: (key, value) => uni.setStorageSync(key, value)
})
