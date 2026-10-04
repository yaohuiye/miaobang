import { createKnowledgeStore } from '@/knowledge/model.mjs'
export const knowledgeStore = createKnowledgeStore({
  get: key => uni.getStorageSync(key),
  set: (key, value) => uni.setStorageSync(key, value)
})
