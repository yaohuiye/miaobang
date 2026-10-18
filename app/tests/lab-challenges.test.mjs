import test from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { runInNewContext } from 'node:vm'
import * as lab from '../lab/experiments.mjs'
import * as tasks from '../lab/challenges.mjs'
const samples = {
  'shadow-1':[{distance:25}], 'shadow-2':[{distance:40},{distance:80}], 'shadow-3':[{distance:40}],
  'float-1':[{volume:160,mass:120}], 'float-2':[{volume:160,mass:80},{volume:160,mass:120}], 'float-3':[{volume:200,mass:140}],
  'circuit-1':[{a:1,b:1,c:1}], 'circuit-2':[{a:1,b:1,c:1},{a:0,b:1,c:1}], 'circuit-3':[{a:1,b:0,c:1}]
}
const records = id => samples[id].map(params=>tasks.captureLabObservation(id,params))
test('all nine science tasks require actual observations and have numeric, attainable targets',()=>{
  let progress=tasks.emptyLabChallenges()
  assert.equal(tasks.LAB_TASKS.length,9)
  for(const task of tasks.LAB_TASKS){
    assert.equal(tasks.evaluateLabTask(task.id,[],{prediction:0,conclusion:0}).passed,false)
    assert.equal(tasks.evaluateLabTask(task.id,[tasks.captureLabObservation(task.id,task.initial)],{prediction:0,conclusion:0}).passed,false,task.id)
    const result=tasks.evaluateLabTask(task.id,records(task.id),{prediction:0,conclusion:0})
    assert.equal(result.passed,true,task.id)
    assert.equal(result.independent,true,task.id)
    progress=tasks.recordLabTask(progress,task.id,records(task.id),{prediction:0,conclusion:0},100)
  }
  assert.deepEqual(tasks.summarizeLabChallenges(progress),{completed:9,total:9,byExperiment:{shadow:3,float:3,circuit:3}})
  for(let i=0;i<50;i++)progress=tasks.recordLabTask(progress,'shadow-1',records('shadow-1'),{},999)
  assert.equal(tasks.summarizeLabChallenges(progress).completed,9)
  assert.equal(progress.completed['shadow-1'].at,100)
})
test('two separate control records must change exactly the task variable',()=>{
  const capture=(id,params)=>tasks.captureLabObservation(id,params)
  assert.equal(tasks.evaluateLabTask('shadow-2',[capture('shadow-2',{distance:40})]).passed,false)
  assert.equal(tasks.evaluateLabTask('shadow-2',[capture('shadow-2',{distance:40}),capture('shadow-2',{distance:40})]).passed,false)
  assert.equal(tasks.evaluateLabTask('float-2',[capture('float-2',{volume:100,mass:80}),capture('float-2',{volume:160,mass:120})]).passed,false)
  assert.equal(tasks.evaluateLabTask('circuit-2',[capture('circuit-2',{a:1,b:1,c:1}),capture('circuit-2',{a:0,b:0,c:1})]).passed,false)
  assert.equal(tasks.evaluateLabTask('circuit-2',[capture('circuit-2',{a:1,b:1,c:1}),capture('circuit-2',{a:1,b:0,c:1})]).passed,false)
  assert.equal(tasks.evaluateLabTask('shadow-2',records('shadow-2').reverse()).passed,true)
})
test('predictions and assistance affect evidence, without preventing children from learning',()=>{
  for(const id of ['shadow-3','float-3','circuit-3']){
    assert.equal(tasks.evaluateLabTask(id,records(id)).passed,false)
    const corrected=tasks.evaluateLabTask(id,records(id),{prediction:1,conclusion:0})
    assert.equal(corrected.passed,true)
    assert.equal(corrected.independent,true)
    assert.ok(tasks.recordLabTask(tasks.emptyLabChallenges(),id,records(id),{prediction:1,conclusion:0}).completed[id])
    assert.equal(tasks.evaluateLabTask(id,records(id),{prediction:0,conclusion:1}).passed,false)
    assert.equal(tasks.evaluateLabTask(id,records(id),{prediction:0}).passed,false)
    assert.throws(()=>tasks.recordLabTask(tasks.emptyLabChallenges(),id,records(id),{prediction:0,conclusion:1}))
  }
  const learned=tasks.evaluateLabTask('shadow-1',records('shadow-1'),{assisted:true})
  assert.equal(learned.passed,true)
  assert.equal(learned.independent,false)
  assert.throws(()=>tasks.recordLabTask(tasks.emptyLabChallenges(),'shadow-1',records('shadow-1'),{assisted:true}))
})
test('numeric observations are recomputed; fake text and unsafe values cannot pass',()=>{
  const fake={params:{distance:50},result:{value:4,text:'影子约是物体的 4 倍'}}
  assert.equal(tasks.evaluateLabTask('shadow-1',[fake]).passed,false)
  assert.throws(()=>tasks.captureLabObservation('shadow-1',{distance:0}))
  assert.throws(()=>tasks.captureLabObservation('shadow-1',{distance:25.5}))
  assert.throws(()=>tasks.captureLabObservation('float-1',{mass:120,volume:Infinity}))
  const params={distance:25},snapshot=tasks.captureLabObservation('shadow-1',params)
  params.distance=50
  assert.equal(snapshot.params.distance,25)
  assert.equal(tasks.evaluateLabTask('shadow-1',[snapshot]).passed,true)
})
test('bad science records are retained and failed writes cannot award stars',()=>{
  let stored='{broken',writes=0,fail=false
  const store=tasks.createLabChallengeStore({get:()=>stored,set:(_,value)=>{if(fail)throw Error('full');stored=JSON.stringify(value);writes++}})
  assert.throws(()=>store.read(),/原数据已保留/)
  assert.throws(()=>store.complete('shadow-1',records('shadow-1')),/原数据已保留/)
  assert.equal(stored,'{broken')
  assert.equal(writes,0)
  for(const value of [{version:2,completed:{}},{version:1,completed:[]},{version:1,completed:{'unknown':{at:1}}},{version:1,completed:{'shadow-1':{at:NaN}}}])assert.throws(()=>tasks.readLabChallenges(value))
  stored='';fail=true
  assert.throws(()=>store.complete('shadow-1',records('shadow-1')),/full/)
  assert.equal(tasks.summarizeLabChallenges(store.read()).completed,0)
  fail=false
  assert.equal(tasks.summarizeLabChallenges(store.complete('shadow-1',records('shadow-1'),{},1)).completed,1)
  store.complete('shadow-1',records('shadow-1'),{},2)
  assert.equal(writes,1)
})
function pageFixture(){
 const source=readFileSync(new URL('../pages/lab/index.vue',import.meta.url),'utf8')
 const script=source.match(/<script>([\s\S]*?)<\/script>/)[1].replace(/^import .*$/gm,'').replace('export default','const page =')
 const saved=new Map();let fail=false
 const page=runInNewContext(`${script}\npage`,{...lab,...tasks,drawExperiment(){},clearTimeout,clearInterval,uni:{getStorageSync:key=>saved.get(key),setStorageSync:(key,value)=>{if(fail)throw Error('full');saved.set(key,JSON.stringify(value))},pageScrollTo(){}}})
 const state=page.data()
 for(const [name,method]of Object.entries(page.methods))state[name]=method.bind(state)
 for(const [name,get]of Object.entries(page.computed))Object.defineProperty(state,name,{get:get.bind(state)})
 state.$nextTick=()=>{};state.draw=()=>{}
 const open=id=>{state.open(lab.EXPERIMENTS.find(e=>e.id===id));state.guess=0;state.begin()}
 return{state,source,saved,open,failWrites:value=>{fail=value}}
}
test('page knob motion alone and notebook text never complete a science task',()=>{
 const{state,open,saved}=pageFixture();open('shadow')
 state.change(state.selected.knobs[0],{detail:{value:25}})
 state.checkTask()
 assert.equal(state.taskPassed,false)
 assert.equal(state.observations.length,0)
 state.note='我发现影子变大了';state.save()
 assert.equal(state.saved,true)
 assert.equal(saved.has(tasks.LAB_CHALLENGES_KEY),false)
 assert.equal(state.challengeSummary.completed,0)
 state.captureCurrent();state.checkTask()
 assert.equal(state.taskPassed,true)
 assert.equal(state.earnedStar,true)
 assert.equal(state.challengeSummary.completed,1)
})
test('page comparison requires two button records, and hidden help disables independent reward',()=>{
 const{state,open}=pageFixture();open('float');state.selectTask('float-2');state.guess=0;state.begin()
 state.captureCurrent()
 state.change(state.selected.knobs[1],{detail:{value:120}})
 state.checkTask()
 assert.equal(state.taskPassed,false)
 assert.equal(state.observations.length,1)
 assert.equal(state.observations[0].params.mass,80)
 state.captureCurrent();state.learnExplanation();state.checkTask()
 assert.equal(state.taskPassed,true)
 assert.equal(state.earnedStar,false)
 assert.equal(state.challengeSummary.completed,0)
 state.selectTask('float-2');state.guess=0;state.begin();state.captureCurrent();state.params.mass=120;state.captureCurrent();state.checkTask()
 assert.equal(state.earnedStar,true)
 assert.equal(state.challengeSummary.completed,1)
})
test('page keeps observations on failed save, retries, and preserves free exploration',()=>{
 const{state,open,failWrites}=pageFixture();open('circuit')
 state.params={a:1,b:1,c:1};state.captureCurrent();failWrites(true);state.checkTask()
 assert.equal(state.taskPassed,false)
 assert.equal(state.earnedStar,false)
 assert.equal(state.challengeSummary.completed,0)
 assert.equal(state.observations.length,1)
 assert.match(state.error,/重试保存/)
 failWrites(false);state.checkTask()
 assert.equal(state.taskPassed,true)
 assert.equal(state.earnedStar,true)
 state.setMode('free')
 assert.equal(state.task,null)
 state.params={a:1,b:1,c:1};state.captureCurrent()
 assert.equal(state.observations.length,0)
 assert.equal(state.challengeSummary.completed,1)
 state.open(lab.EXPERIMENTS.find(e=>e.id==='moon'))
 assert.equal(state.experimentMode,'free')
 assert.equal(state.task,null)
})

test('page rewards a revised conclusion after an initially incorrect scientific guess',()=>{
 const{state,open}=pageFixture();open('shadow');state.selectTask('shadow-3');state.guess=1;state.begin()
 state.params.distance=40;state.conclusion=0;state.checkTask()
 assert.equal(state.taskPassed,false)
 state.captureCurrent();state.conclusion=1;state.checkTask()
 assert.equal(state.taskPassed,false)
 assert.equal(state.challengeSummary.completed,0)
 state.conclusion=0;state.checkTask()
 assert.equal(state.taskPassed,true)
 assert.equal(state.earnedStar,true)
 assert.equal(state.challengeSummary.completed,1)
})
