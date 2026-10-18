import { createSkillChallengesStore } from '@/game/skill-challenges.mjs'
export const skillChallengesStore = createSkillChallengesStore({
  get: key => uni.getStorageSync(key),
  set: (key, value) => uni.setStorageSync(key, value)
})
