import { createOralStore } from '@/math/oral.mjs'
export const oralStore = createOralStore({
  get: key => uni.getStorageSync(key),
  set: (key, value) => uni.setStorageSync(key, value)
})
