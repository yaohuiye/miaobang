import test from 'node:test'
import assert from 'node:assert/strict'
import { tacticalPuzzles,createTacticalAttempt,playTacticalMove,tacticalHint,markTacticalHelp } from '../game/gomoku-tactics.mjs'
import { readGomokuLearning } from '../game/gomoku-learning.mjs'
import { GOMOKU_TACTICS_KEY,recordTacticalProgress,createTacticalProgressStore } from '../game/gomoku-tactics-progress.mjs'
function complete(id) {
 let state=createTacticalAttempt(id)
 for(let i=0;state.status==='playing'&&i<10;i++) {const p=tacticalHint(state);assert.ok(p,id+' needs a verified continuation');state=playTacticalMove(state,p.row,p.col)}
 assert.ok(['won','defended'].includes(state.status),id)
 return state
}
test('only full multi-turn results count; each task can record practice and a later independent pass once',()=>{
 let progress=readGomokuLearning('')
 for(const puzzle of tacticalPuzzles) {
  const initial=createTacticalAttempt(puzzle.id)
  assert.throws(()=>recordTacticalProgress(progress,initial,{independent:true}))
  const first=tacticalHint(initial),one=playTacticalMove(initial,first.row,first.col)
  assert.throws(()=>recordTacticalProgress(progress,one,{independent:true}))
  const result=complete(puzzle.id)
  progress=recordTacticalProgress(progress,markTacticalHelp(result),{independent:true})
  assert.equal(progress.independent.includes(puzzle.id),false)
  progress=recordTacticalProgress(progress,{...result,mistakes:1},{independent:true})
  assert.equal(progress.independent.includes(puzzle.id),false)
  progress=recordTacticalProgress(progress,result,{independent:true})
  progress=recordTacticalProgress(progress,result,{independent:true})
 }
 assert.equal(progress.practiced.length,tacticalPuzzles.length)
 assert.equal(progress.independent.length,tacticalPuzzles.length)
})
test('new training never writes old lesson progress; corrupt records and failed writes remain untouched',()=>{
 const old={version:1,practiced:['five-line-row'],independent:['five-line-row']}
 const data=new Map([['miaobang.gomoku-learning.v1',JSON.stringify(old)]])
 let writes=0,fail=true
 const store=createTacticalProgressStore({get:k=>data.get(k),set:(k,v)=>{if(fail)throw Error('full');writes++;data.set(k,v)}})
 const completed=complete(tacticalPuzzles[0].id)
 assert.throws(()=>store.save(completed,{independent:true}),/full/)
 assert.equal(store.read().practiced.length,0)
 fail=false;store.save(completed,{independent:true});store.save(completed,{independent:true})
 assert.equal(writes,1)
 assert.equal(data.get('miaobang.gomoku-learning.v1'),JSON.stringify(old))
 data.set(GOMOKU_TACTICS_KEY,'{broken')
 assert.throws(()=>store.save(completed,{independent:true}),/原记录未改动/)
 assert.equal(data.get(GOMOKU_TACTICS_KEY),'{broken')
 assert.equal(writes,1)
})
