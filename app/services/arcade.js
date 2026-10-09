import { createArcadeStore } from '@/game/arcade-progress.mjs'
export const arcadeStore = createArcadeStore({
  get: key => uni.getStorageSync(key),
  set: (key, value) => uni.setStorageSync(key, value)
})
