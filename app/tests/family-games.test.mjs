import test from 'node:test'
import assert from 'node:assert/strict'
import { numberLevels } from '../data/number-levels.mjs'
import { safetyScenes, SAFETY_SOURCES } from '../data/safety-scenes.mjs'
import { combine, initialTiles, mergeTiles, reachedTarget, solveNumbers } from '../game/numbers.mjs'
import { createFamilyProgressStore, readFamilyProgress, FAMILY_GAME_KEY } from '../game/family-progress.mjs'
import { createGardenStore, readGarden, emptyDay, dayKey, GROWTH_KEY } from '../growth/model.mjs'
function memory() {
  const data = new Map()
  let fail = false
  return { data, setFailure(value) { fail=value }, get:key=>data.get(key), set(key,value) { if(fail) throw new Error('storage full'); data.set(key,structuredClone(value)) } }
}
test('12 distinct levels can all be solved with legal whole-number steps and every card once',()=>{
  assert.equal(numberLevels.length,12)
  assert.equal(new Set(numberLevels.map(l=>l.id)).size,12)
  for(const level of numberLevels) {
    let tiles=initialTiles(level.numbers)
    const steps=solveNumbers(tiles,level.target,level.operators)
    assert.ok(steps,level.id)
    assert.equal(steps.length,level.numbers.length-1)
    for(const step of steps) tiles=mergeTiles(tiles,step.first,step.second,step.operator,level.operators)
    assert.equal(reachedTarget(tiles,level.target),true,level.id)
  }
})
test('duplicate numbers remain separate tiles, consumed cards cannot be reused, and inputs are immutable',()=>{
  const tiles=initialTiles([6,6,4]), before=structuredClone(tiles)
  const next=mergeTiles(tiles,'n0','n1','+',['+'])
  assert.deepEqual(next.map(t=>t.value),[4,12])
  assert.deepEqual(tiles,before)
  assert.throws(()=>mergeTiles(tiles,'n0','n0','+',['+']))
  assert.throws(()=>mergeTiles(next,'n0','n2','+',['+']))
  assert.throws(()=>mergeTiles(tiles,'n0','n1','×',['+']))
})
test('arithmetic rejects zero division, fractional or negative results; order and all-card completion matter',()=>{
  assert.equal(combine(12,3,'÷'),4)
  assert.equal(combine(6,6,'−'),0)
  assert.throws(()=>combine(3,12,'÷'))
  assert.throws(()=>combine(0,0,'÷'))
  assert.throws(()=>combine(3,6,'−'))
  assert.throws(()=>combine(100,100,'×'))
  assert.equal(reachedTarget(initialTiles([9,2]),9),false)
  assert.equal(reachedTarget(initialTiles([9]),9),true)
})
test('hints solve the current remaining cards, report dead ends, and accept another valid route',()=>{
  const level=numberLevels[6], tiles=initialTiles(level.numbers)
  const good=mergeTiles(tiles,'n0','n1','+',level.operators)
  assert.equal(solveNumbers(good,20,level.operators)[0].text,'4 × 5 = 20')
  const dead=mergeTiles(tiles,'n0','n1','×',level.operators)
  assert.equal(solveNumbers(dead,20,level.operators),null)
  const alternative=mergeTiles(initialTiles([2,3,4]),'n1','n2','+',['+'])
  assert.equal(reachedTarget(mergeTiles(alternative,'n0',alternative[1].id,'+',['+']),9),true)
})
test('8 safety scenarios have one safe action, explanations, discussion and actual reference links',()=>{
  assert.equal(safetyScenes.length,8)
  assert.equal(new Set(safetyScenes.map(s=>s.id)).size,8)
  for(const scene of safetyScenes) {
    assert.equal(scene.options.length,3)
    assert.equal(new Set(scene.options.map(o=>o.id)).size,3)
    assert.equal(new Set(scene.options.map(o=>o.text)).size,3)
    assert.equal(scene.options.filter(o=>o.id===scene.answer).length,1)
    for(const key of ['scene','why','talk','reminder']) assert.ok(scene[key].trim())
    assert.ok(scene.sources.length && scene.sources.every(index=>SAFETY_SOURCES[index]?.url.startsWith('https://')))
  }
})
test('game completion deduplicates, keeps both games and survives reload; failed writes never claim saved',()=>{
  const storage=memory(), store=createFamilyProgressStore(storage)
  store.mark('bridges','bridge-1'); store.mark('bridges','bridge-1'); store.mark('scenes','on-bus')
  assert.deepEqual(createFamilyProgressStore(storage).read(),{version:1,bridges:['bridge-1'],scenes:['on-bus']})
  storage.setFailure(true)
  assert.throws(()=>store.mark('bridges','bridge-2'))
  assert.deepEqual(store.read().bridges,['bridge-1'])
  assert.throws(()=>store.mark('scenes','bridge-1'))
  storage.setFailure(false)
  storage.data.set(FAMILY_GAME_KEY,{version:2,bridges:[],scenes:[]})
  assert.throws(()=>store.mark('bridges','bridge-2'))
  assert.equal(storage.data.get(FAMILY_GAME_KEY).version,2)
  assert.throws(()=>readFamilyProgress({version:1,bridges:[],scenes:[1]}))
})
test('review fields are optional, whitespace-only empty days do not clutter history, local dates keep the calendar day',()=>{
  const storage=memory(), store=createGardenStore(storage), draft=emptyDay()
  assert.equal(dayKey(new Date(2026,9,4,0,5)),'2026-10-04')
  assert.deepEqual(store.save('2026-10-04',draft).days,{})
  draft.next='上车先扶好'
  store.save('2026-10-04',draft)
  assert.equal(store.read().days['2026-10-04'].next,'上车先扶好')
  assert.equal(store.read().days['2026-10-04'].retry,'')
  assert.equal(store.read().days['2026-10-04'].flowerReason,'')
  assert.throws(()=>store.save('2026-02-30',draft))
})
test('a flower needs a specific positive event, awards once per day, keeps its original reason and allows different days',()=>{
  const store=createGardenStore(memory()), draft=emptyDay()
  draft.retry='今天车上打闹了'
  assert.throws(()=>store.save('2026-10-04',draft,true),/具体尝试/)
  draft.good='提醒后，我扶好了扶手'
  store.save('2026-10-04',draft,true); store.save('2026-10-04',draft,true)
  draft.good='修改后的回顾'
  store.save('2026-10-04',draft)
  assert.equal(store.read().days['2026-10-04'].flowerReason,'提醒后，我扶好了扶手')
  store.save('2026-10-05',draft,true)
  assert.equal(Object.values(store.read().days).filter(day=>day.flowerReason).length,2)
})
test('review and flower writes fail atomically; corrupt and newer data remain untouched; text length is bounded',()=>{
  const storage=memory(), store=createGardenStore(storage), draft={...emptyDay(),good:'主动看路'}
  store.save('2026-10-04',draft)
  storage.setFailure(true)
  assert.throws(()=>store.save('2026-10-04',{...draft,next:'先看车'},true))
  assert.equal(store.read().days['2026-10-04'].flowerReason,'')
  assert.equal(store.read().days['2026-10-04'].next,'')
  storage.setFailure(false)
  assert.throws(()=>store.save('2026-10-04',{...draft,good:'好'.repeat(161)}))
  for(const raw of ['{bad',{version:2,days:{}},{version:1,days:{'2026-10-04':{good:'missing'}}}]) {
    storage.data.set(GROWTH_KEY,raw)
    assert.throws(()=>store.save('2026-10-04',draft,true))
    assert.deepEqual(storage.data.get(GROWTH_KEY),raw)
    assert.throws(()=>readGarden(raw))
  }
})
