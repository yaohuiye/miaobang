import { createGardenStore } from '@/growth/model.mjs'
import { createFamilyProgressStore } from '@/game/family-progress.mjs'
const local = { get:key=>uni.getStorageSync(key), set:(key,value)=>uni.setStorageSync(key,value) }
export const gardenStore = createGardenStore(local)
export const familyGameStore = createFamilyProgressStore(local)
