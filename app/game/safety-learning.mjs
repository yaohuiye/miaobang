import { safetyScenes } from '../data/safety-scenes.mjs'
export const SAFETY_LEARNING_KEY='miaobang.safety-learning.v1'
export const SAFETY_STEPS=['notice','action','transfer']
const ids=safetyScenes.map(s=>s.id)
export function readSafetyLearning(raw){
 if(raw===''||raw==null)return {version:1,scenes:{}}
 const s=typeof raw==='string'?JSON.parse(raw):raw
 if(!s||s.version!==1||!s.scenes||typeof s.scenes!=='object'||Array.isArray(s.scenes)||Object.entries(s.scenes).some(([id,p])=>!ids.includes(id)||!p||!['passed','review'].every(k=>Array.isArray(p[k])&&new Set(p[k]).size===p[k].length&&p[k].every(v=>SAFETY_STEPS.includes(v)))))throw new Error('安全练习记录无法识别，原记录未改动。')
 return JSON.parse(JSON.stringify(s))
}
export function recordSafetyStep(state,sceneId,stepId,correct){
 const s=readSafetyLearning(state)
 if(!ids.includes(sceneId)||!SAFETY_STEPS.includes(stepId)||typeof correct!=='boolean')throw new Error('这一项安全练习信息不完整。')
 const p=s.scenes[sceneId]||{passed:[],review:[]}
 if(correct){if(!p.passed.includes(stepId))p.passed.push(stepId);p.review=p.review.filter(v=>v!==stepId)}else if(!p.review.includes(stepId))p.review.push(stepId)
 s.scenes[sceneId]=p;return s
}
export function summarizeSafetyLearning(state){const s=readSafetyLearning(state);const values=Object.values(s.scenes);return {steps:values.reduce((n,p)=>n+p.passed.length,0),completed:values.filter(p=>p.passed.length===3).length,review:ids.filter(id=>s.scenes[id]?.review.length),total:ids.length}}
export function safetyPracticeIds(state,random=Math.random){const s=readSafetyLearning(state);const ranked=ids.map(id=>({id,priority:s.scenes[id]?.review.length?0:!s.scenes[id]?1:2,tie:random()}));return ranked.sort((a,b)=>a.priority-b.priority||a.tie-b.tie).slice(0,3).map(v=>v.id)}
export function createSafetyLearningStore(storage){return {read(){return readSafetyLearning(storage.get(SAFETY_LEARNING_KEY))},save(scene,step,correct){const next=recordSafetyStep(this.read(),scene,step,correct);storage.set(SAFETY_LEARNING_KEY,next);return next}}}
