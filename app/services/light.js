import { createLightStore } from '@/game/light-progress.mjs'
export const lightStore=createLightStore({get:key=>uni.getStorageSync(key),set:(key,value)=>uni.setStorageSync(key,value)})
