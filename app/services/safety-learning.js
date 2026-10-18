import { createSafetyLearningStore } from '@/game/safety-learning.mjs'
export const safetyLearningStore=createSafetyLearningStore({get:key=>uni.getStorageSync(key),set:(key,value)=>uni.setStorageSync(key,value)})
