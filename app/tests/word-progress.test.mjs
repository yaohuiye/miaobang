import test from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { runInNewContext } from 'node:vm'
import * as english from '../game/english.mjs'
import * as progress from '../knowledge/word-progress.mjs'
import { makePractice, emptyProgress, createKnowledgeStore } from '../knowledge/model.mjs'
import { ENGLISH_AUDIO } from '../data/knowledge/english-audio.mjs'
const at = '2026-10-18T09:00:00.000Z'
const attempt = (patch = {}) => ({ id: 'en-apple', stage: 'recognize', correct: true, independent: true, at, ...patch })

test('word evidence is bounded per stage and review is scheduled from independent work', () => {
  let value = progress.emptyWordProgress()
  value = progress.recordWordAttempt(value,attempt())
  assert.deepEqual(progress.summarizeWordProgress(value,at),{practiced:1,recognized:1,assembled:0,written:0,mastered:0,reviewCount:0,dueCount:0,evidence:1,points:10})
  assert.equal(value.words['en-apple'].dueAt,'2026-10-19T09:00:00.000Z')
  for (let index=0;index<100;index++) value = progress.recordWordAttempt(value,attempt())
  assert.equal(progress.summarizeWordProgress(value,at).points,10)
  value = progress.recordWordAttempt(value,attempt({stage:'assemble'}))
  assert.equal(value.words['en-apple'].dueAt,'2026-10-21T09:00:00.000Z')
  value = progress.recordWordAttempt(value,attempt({stage:'write'}))
  assert.equal(value.words['en-apple'].dueAt,'2026-10-25T09:00:00.000Z')
  const summary = progress.summarizeWordProgress(value,'2026-10-26T09:00:00.000Z')
  assert.equal(summary.points,30)
  assert.equal(summary.mastered,1)
  assert.equal(summary.dueCount,1)
})
test('wrong, revealed and corrected attempts do not create independent evidence', () => {
  let value = progress.emptyWordProgress()
  value = progress.recordWordAttempt(value,attempt({correct:false,independent:false}))
  value = progress.recordWordAttempt(value,attempt({correct:true,independent:false,stage:'write'}))
  assert.equal(progress.summarizeWordProgress(value,at).evidence,0)
  assert.equal(progress.summarizeWordProgress(value,at).reviewCount,1)
  assert.deepEqual(progress.reviewWordIds(value,at),['en-apple'])
  value = progress.recordWordAttempt(value,attempt({stage:'write',at:'2026-10-19T09:00:00.000Z'}))
  assert.equal(progress.summarizeWordProgress(value,at).written,1)
  assert.equal(progress.summarizeWordProgress(value,at).reviewCount,0)
})
test('bad stored word records are preserved and failed writes never return success', () => {
  const broken = '{bad json'
  let saved = broken, writes=0
  const store = progress.createWordProgressStore({get:key=>{assert.equal(key,progress.WORD_PROGRESS_KEY);return saved},set:()=>{writes++}})
  assert.throws(()=>store.read(),/保留原数据/)
  assert.throws(()=>store.record(attempt()),/保留原数据/)
  assert.equal(saved,broken)
  assert.equal(writes,0)
  for (const record of [null,{stages:['write','write'],review:false,lastAt:at,dueAt:at},{stages:['unknown'],review:false,lastAt:at,dueAt:at},{stages:[],review:false,lastAt:'yesterday',dueAt:at}]) {
    assert.throws(()=>progress.readWordProgress({version:1,words:{'en-apple':record}}))
  }
  const initial = progress.emptyWordProgress()
  const failed = progress.createWordProgressStore({get:()=>initial,set:()=>{throw Error('full')}})
  assert.throws(()=>failed.record(attempt()),/full/)
  assert.deepEqual(initial,progress.emptyWordProgress())
  const working = progress.createWordProgressStore({get:()=>saved,set:(_,value)=>{saved=JSON.stringify(value)}})
  saved=''
  assert.equal(working.record(attempt()).words['en-apple'].stages.length,1)
  assert.equal(working.read().words['en-apple'].stages.length,1)
})

function pageFixture() {
  const source = readFileSync(new URL('../pages/games/english.vue',import.meta.url),'utf8')
  const script = source.match(/<script>([\s\S]*?)<\/script>/)[1].replace(/^import .*$/gm,'').replace('export default','const page =')
  const saved = new Map()
  let fail = false
  const storage = {get:key=>saved.get(key),set:(key,value)=>{if(fail)throw Error('空间不足');saved.set(key,JSON.stringify(value))}}
  const knowledgeStore = createKnowledgeStore(storage)
  const wordProgressStore = progress.createWordProgressStore(storage)
  const page = runInNewContext(`${script}\npage`,{...english,...progress,ENGLISH_AUDIO,makePractice,knowledgeStore,wordProgressStore,lessonAudioMixin:{},uni:{pageScrollTo(){},switchTab(){}}})
  const state = page.data()
  for (const [name,method] of Object.entries(page.methods)) state[name]=method.bind(state)
  for (const [name,get] of Object.entries(page.computed)) Object.defineProperty(state,name,{get:get.bind(state)})
  state.stopAudio=()=>{}
  state.playAudio=()=>{}
  state.audioState={phase:'idle',key:'',error:''}
  const begin = (stage='assemble')=>{state.stage=stage;state.ids=['en-apple'];state.cursor=0;state.started=true;state.prepare()}
  return {state,begin,source,saved,knowledgeStore,wordProgressStore,failWrites:value=>{fail=value}}
}
test('the actual spelling page remembers a failed first attempt after correction', () => {
  const {state,begin,wordProgressStore,knowledgeStore}=pageFixture()
  begin()
  state.selected=[1,0,2,3,4]
  state.check()
  assert.equal(state.hadWrong,true)
  assert.equal(state.outcome,'')
  state.selected=[0,1,2,3,4]
  state.check()
  assert.equal(state.outcome,'correct')
  const summary=progress.summarizeWordProgress(wordProgressStore.read())
  assert.equal(summary.assembled,0)
  assert.equal(summary.reviewCount,1)
  assert.equal(state.independentIds.length,0)
  assert.ok(knowledgeStore.read().review.includes('en-apple'))
})
test('the actual input page retries storage in order without false independent rewards', () => {
  const {state,begin,wordProgressStore,failWrites}=pageFixture()
  begin('write')
  failWrites(true)
  state.typed='aple';state.check()
  state.typed='apple';state.check()
  assert.equal(state.outcome,'correct')
  assert.equal(state.pendingAttempts.length,2)
  assert.equal(Object.keys(wordProgressStore.read().words).length,0)
  assert.match(state.error,/重试保存/)
  failWrites(false);state.retrySave()
  assert.equal(state.pendingAttempts.length,0)
  assert.equal(progress.summarizeWordProgress(wordProgressStore.read()).written,0)
  assert.equal(progress.summarizeWordProgress(wordProgressStore.read()).reviewCount,1)
  assert.equal(state.error,'')
})
test('later independent spelling removes old review, saves one stage and skips unavailable audio', () => {
  const {state,begin,knowledgeStore,wordProgressStore,source}=pageFixture()
  knowledgeStore.set('review','en-apple',true)
  state.readProgress()
  begin('write');state.typed='Apple';state.check()
  assert.equal(progress.summarizeWordProgress(wordProgressStore.read()).written,1)
  assert.equal(knowledgeStore.read().review.includes('en-apple'),false)
  assert.equal(state.independentIds.length,1)
  assert.match(state.rewardFeedback,/新的独立/)
  begin('write');state.typed='apple';state.check()
  assert.equal(progress.summarizeWordProgress(wordProgressStore.read()).points,10)
  assert.equal(state.rewardFeedback,'')
  state.ids=['enb-straight'];state.prepare()
  state.listen('word')
  assert.equal(state.hasAudio,false)
  assert.doesNotMatch(source,/内置英式|又认识了/)
})
test('revealing an answer leaves review evidence without passing a stage', () => {
  const {state,begin,wordProgressStore}=pageFixture()
  begin('recognize');state.reveal()
  assert.equal(state.outcome,'revealed')
  assert.equal(progress.summarizeWordProgress(wordProgressStore.read()).evidence,0)
  assert.equal(progress.summarizeWordProgress(wordProgressStore.read()).reviewCount,1)
})

test('English review counts only playable words and preserves other subject shelves', () => {
  const {state,knowledgeStore}=pageFixture()
  knowledgeStore.set('review','math-1',true)
  knowledgeStore.set('review','en-pattern-1',true)
  knowledgeStore.set('review','en-apple',true)
  state.readProgress()
  assert.deepEqual(Array.from(state.reviewIds),['en-apple'])
  state.stage='write';state.ids=['en-apple'];state.cursor=0;state.prepare();state.typed='apple';state.check()
  assert.ok(knowledgeStore.read().review.includes('math-1'))
  assert.ok(knowledgeStore.read().review.includes('en-pattern-1'))
  assert.equal(knowledgeStore.read().review.includes('en-apple'),false)
})
