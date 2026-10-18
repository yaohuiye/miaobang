import {readFileSync} from 'node:fs'
import {runInNewContext} from 'node:vm'
import * as safetyLearning from '../game/safety-learning.mjs'
import {SAFETY_SOURCES} from '../data/safety-scenes.mjs'
import test from 'node:test'
import assert from 'node:assert/strict'
import {safetyScenes} from '../data/safety-scenes.mjs'
import {SAFETY_LEARNING_KEY,SAFETY_STEPS,readSafetyLearning,recordSafetyStep,summarizeSafetyLearning,safetyPracticeIds,createSafetyLearningStore} from '../game/safety-learning.mjs'
test('all eight stories have observation, action and transfer with distinct choices',()=>{for(const s of safetyScenes){assert.deepEqual(s.steps.map(v=>v.id),SAFETY_STEPS);for(const step of s.steps){assert.equal(step.options.length,3);assert.equal(new Set(step.options.map(o=>o.text)).size,3);assert.equal(step.options.filter(o=>o.id===step.answer).length,1);assert.ok(step.prompt&&step.why&&step.options.every(o=>o.consequence))}}})
test('seen legacy scenes never imply independent steps; mistakes persist for next round',()=>{let s=readSafetyLearning('');assert.equal(summarizeSafetyLearning(s).steps,0);s=recordSafetyStep(s,'on-bus','action',false);assert.deepEqual(summarizeSafetyLearning(s).review,['on-bus']);assert.equal(safetyPracticeIds(s,()=>.5)[0],'on-bus');s=recordSafetyStep(s,'on-bus','action',true);assert.equal(summarizeSafetyLearning(s).steps,1);assert.deepEqual(summarizeSafetyLearning(s).review,[]);s=recordSafetyStep(s,'on-bus','action',true);assert.equal(summarizeSafetyLearning(s).steps,1);for(const id of ['notice','transfer'])s=recordSafetyStep(s,'on-bus',id,true);assert.equal(summarizeSafetyLearning(s).completed,1)})
test('safety saves are idempotent and corrupt or failed storage is never replaced',()=>{let raw='',fail=false;const store=createSafetyLearningStore({get:()=>raw,set:(k,v)=>{assert.equal(k,SAFETY_LEARNING_KEY);if(fail)throw new Error('full');raw=v}});store.save('red-light','notice',true);fail=true;assert.throws(()=>store.save('red-light','action',true));assert.deepEqual(store.read().scenes['red-light'].passed,['notice']);fail=false;store.save('red-light','action',true);store.save('red-light','action',true);assert.equal(summarizeSafetyLearning(store.read()).steps,2);raw={version:2,scenes:{}};assert.throws(()=>store.save('red-light','transfer',true));assert.equal(raw.version,2);assert.throws(()=>readSafetyLearning({version:1,scenes:{fake:{passed:[],review:[]}}}))})

test('actual safety page keeps FIFO evidence across rounds and retries old seen markers',()=>{
 const source=readFileSync(new URL('../pages/games/safety.vue',import.meta.url),'utf8').match(/<script>([\s\S]*?)<\/script>/)[1].replace(/^import .*$/gm,'').replace('export default','const page =')
 let raw='',fail=true,seen=[];const store=createSafetyLearningStore({get:()=>raw,set:(key,value)=>{if(fail)throw Error('full');raw=value}})
 const page=runInNewContext(source+';page',{...safetyLearning,safetyScenes,SAFETY_SOURCES,shuffle:a=>a,safetyLearningStore:store,familyGameStore:{mark:(type,id)=>{if(fail)throw Error('full');seen=[...new Set([...seen,id])];return {scenes:seen}}},uni:{pageScrollTo(){}}})
 const state=page.data();for(const [k,f]of Object.entries(page.methods))state[k]=f.bind(state);for(const [k,f]of Object.entries(page.computed))Object.defineProperty(state,k,{get:f.bind(state)})
 state.startOne('on-bus');state.choose('safe');assert.equal(state.pending.length,1);state.returnToList();state.startOne('on-bus');state.choose('other-0');assert.equal(state.pending.length,2);fail=false;state.retryPending();assert.equal(state.pending.length,0);assert.deepEqual(store.read().scenes['on-bus'],{passed:['notice'],review:['notice']});
 state.next();state.choose('safe');state.next();fail=true;state.choose('safe');assert.equal(state.pending.length,2);fail=false;state.retryPending();assert.equal(state.pending.length,0);assert.deepEqual(seen,['on-bus']);assert.equal(store.read().scenes['on-bus'].passed.length,3)
})
