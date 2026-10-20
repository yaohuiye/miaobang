import test from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { runInNewContext } from 'node:vm'
import * as inquiries from '../lab/inquiries.mjs'
import * as lab from '../lab/experiments.mjs'
import * as challenges from '../lab/challenges.mjs'

const plans={
  'shadow-distance':[
    {records:[{distance:20},{distance:40},{distance:60}],evidence:[0,1],next:{distance:30},revision:2},
    {records:[{distance:25},{distance:50},{distance:75}],evidence:[0,1],next:{distance:60},revision:2}
  ],
  'float-capacity':[
    {records:[{volume:60,mass:80},{volume:80,mass:80},{volume:120,mass:80}],evidence:[0,2],next:{volume:100,mass:80},revision:2},
    {records:[{volume:80,mass:120},{volume:120,mass:120},{volume:160,mass:120}],evidence:[0,2],next:{volume:140,mass:120},revision:2}
  ],
  'lever-balance':[
    {records:[{left:1,right:1},{left:1,right:2},{left:1,right:4}],evidence:[1,0],next:{left:1,right:3},revision:2},
    {records:[{left:2,right:2},{left:2,right:4},{left:2,right:5}],evidence:[1,2],next:{left:2,right:3},revision:0}
  ],
  'pressure-range':[
    {records:[{height:5},{height:20},{height:40}],evidence:[0,1],next:{height:10},revision:0},
    {records:[{height:10},{height:40},{height:60}],evidence:[0,1],next:{height:20},revision:0}
  ]
}
function evidenceSession(id,plan=plans[id][0]){
  let session=inquiries.startInquiry(inquiries.createInquirySession(id),0)
  for(const params of plan.records)session=inquiries.addInquiryObservation(session,params)
  return {...session,conclusion:inquiries.LAB_INQUIRIES.find(task=>task.id===id).answer,evidence:plan.evidence}
}
function finishedSession(id,plan=plans[id][0]){
  let session=evidenceSession(id,plan)
  session=inquiries.lockInquiryTransfer(session,plan.next,1)
  session=inquiries.verifyInquiryTransfer(session)
  return {...session,revision:plan.revision}
}
test('all four inquiries accept two different child-designed plans and an initially wrong prediction',()=>{
  assert.equal(inquiries.LAB_INQUIRIES.length,4)
  for(const task of inquiries.LAB_INQUIRIES){
    for(const plan of plans[task.id]){
      const session=finishedSession(task.id,plan)
      assert.notEqual(session.prediction,task.answer)
      assert.equal(inquiries.evaluateInquiry(session).passed,true,task.id)
      assert.equal(session.records.length,3)
      assert.equal(session.transfer.record.params[task.variable],plan.next[task.variable])
    }
  }
})
test('three distinct comparable observations are mandatory; duplicate or mixed-variable records are rejected',()=>{
  let session=inquiries.startInquiry(inquiries.createInquirySession('float-capacity'),0)
  session=inquiries.addInquiryObservation(session,{mass:80,volume:60})
  assert.throws(()=>inquiries.addInquiryObservation(session,{mass:80,volume:60}),/相同条件/)
  assert.throws(()=>inquiries.addInquiryObservation(session,{mass:90,volume:100}),/不止一个/)
  const short={...evidenceSession('shadow-distance'),records:evidenceSession('shadow-distance').records.slice(0,2)}
  assert.equal(inquiries.evaluateInquiryEvidence(short).passed,false)
  assert.throws(()=>inquiries.lockInquiryTransfer(short,{distance:30},0),/3 组/)
  assert.throws(()=>inquiries.addInquiryObservation(inquiries.createInquirySession('shadow-distance'),{distance:30}),/先留下预测/)
})
test('evidence must test the claim, not just contain three arbitrary knob settings',()=>{
  let shadow=inquiries.startInquiry(inquiries.createInquirySession('shadow-distance'),0)
  for(const distance of [21,35,79])shadow=inquiries.addInquiryObservation(shadow,{distance})
  shadow={...shadow,conclusion:1,evidence:[0,1]}
  assert.match(inquiries.evaluateInquiryEvidence(shadow).feedback,/2 倍关系/)
  const pressure={...evidenceSession('pressure-range'),evidence:[1,2]}
  assert.match(inquiries.evaluateInquiryEvidence(pressure).feedback,/4 倍关系/)
  let boat=inquiries.startInquiry(inquiries.createInquirySession('float-capacity'),0)
  for(const volume of [120,140,160])boat=inquiries.addInquiryObservation(boat,{mass:80,volume})
  assert.match(inquiries.evaluateInquiryEvidence({...boat,conclusion:2,evidence:[0,1]}).feedback,/分界两侧/)
  const lever={...evidenceSession('lever-balance'),evidence:[0,2]}
  assert.match(inquiries.evaluateInquiryEvidence(lever).feedback,/平衡点/)
  assert.equal(inquiries.evaluateInquiryEvidence({...evidenceSession('shadow-distance'),conclusion:0}).passed,false)
})
test('unattainable setup and forged observations do not pass, and record snapshots do not change with knobs',()=>{
  assert.throws(()=>inquiries.captureInquiryObservation('float-capacity',{mass:40,volume:80}),/40 克/)
  assert.throws(()=>inquiries.captureInquiryObservation('lever-balance',{left:3,right:5}),/1 或 2/)
  assert.throws(()=>inquiries.captureInquiryObservation('shadow-distance',{distance:20.5}),/无效/)
  const session=evidenceSession('pressure-range')
  session.records[0].result.value=999
  assert.equal(inquiries.evaluateInquiryEvidence(session).passed,false)
  const params={distance:20},record=inquiries.captureInquiryObservation('shadow-distance',params)
  params.distance=80
  assert.equal(record.params.distance,20)
})
test('new conditions stay unobserved until prediction is locked and actual verification is performed',()=>{
  const session=evidenceSession('shadow-distance')
  assert.equal(inquiries.evaluateInquiry(session).passed,false)
  assert.throws(()=>inquiries.verifyInquiryTransfer(session),/先锁定/)
  assert.throws(()=>inquiries.lockInquiryTransfer(session,{distance:20},0),/相同条件/)
  const locked=inquiries.lockInquiryTransfer(session,{distance:30},1)
  assert.equal(locked.transfer.record,null)
  assert.equal(locked.transfer.verified,false)
  assert.equal(inquiries.evaluateInquiry({...locked,revision:2}).passed,false)
  assert.throws(()=>inquiries.lockInquiryTransfer(locked,{distance:35},0),/已经锁定/)
  const verified=inquiries.verifyInquiryTransfer(locked)
  assert.equal(inquiries.evaluateInquiry({...verified,revision:1}).passed,false)
  assert.equal(inquiries.evaluateInquiry({...verified,revision:2}).passed,true)
  verified.transfer.params.distance=35
  assert.equal(inquiries.evaluateInquiry({...verified,revision:2}).passed,false)
})
test('four saved reports are finite, write failures retry safely, and corrupt records are never overwritten',()=>{
  let stored='',writes=0,fail=false
  const storage={get:()=>stored,set:(_,value)=>{if(fail)throw Error('full');stored=JSON.stringify(value);writes++}}
  const store=inquiries.createLabInquiryStore(storage)
  fail=true
  assert.throws(()=>store.complete(finishedSession('shadow-distance'),100),/full/)
  assert.equal(Object.keys(store.read().completed).length,0)
  fail=false
  for(const task of inquiries.LAB_INQUIRIES)store.complete(finishedSession(task.id),100)
  for(let i=0;i<10;i++)store.complete(finishedSession('shadow-distance'),200)
  assert.equal(Object.keys(store.read().completed).length,4)
  assert.equal(writes,4)
  assert.equal(store.read().completed['shadow-distance'].at,100)
  store.complete(finishedSession('shadow-distance',plans['shadow-distance'][1]),300)
  assert.equal(Object.keys(store.read().completed).length,4)
  assert.equal(store.read().completed['shadow-distance'].report.records[0].params.distance,25)
  assert.equal(store.read().completed['shadow-distance'].at,100)
  assert.equal(writes,5)
  stored='{broken'
  assert.throws(()=>store.complete(finishedSession('shadow-distance')),/原数据已保留/)
  assert.equal(stored,'{broken')
  assert.equal(writes,5)
  for(const value of [{version:2,completed:{}},{version:1,completed:[]},{version:1,completed:{unknown:{at:1}}},{version:1,completed:{'shadow-distance':{at:1,report:evidenceSession('shadow-distance')}}}])assert.throws(()=>inquiries.readLabInquiries(value),/原数据已保留/)
})
function fixture(){
  const source=readFileSync(new URL('../pages/lab/index.vue',import.meta.url),'utf8')
  const script=source.match(/<script>([\s\S]*?)<\/script>/)[1].replace(/^import .*$/gm,'').replace('export default','const page =')
  const saved=new Map();let fail=false
  const page=runInNewContext(`${script}\npage`,{...lab,...challenges,...inquiries,drawExperiment(){},clearTimeout,clearInterval,uni:{getStorageSync:key=>saved.get(key),setStorageSync:(key,value)=>{if(fail)throw Error('full');saved.set(key,JSON.stringify(value))},pageScrollTo(){}}})
  const state=page.data()
  for(const [name,method]of Object.entries(page.methods))state[name]=method.bind(state)
  for(const [name,get]of Object.entries(page.computed))Object.defineProperty(state,name,{get:get.bind(state)})
  state.$nextTick=()=>{};state.draw=()=>{}
  return {state,saved,failWrites:value=>{fail=value}}
}
test('page hides new numeric result and canvas until verification, and saves only a finished report',()=>{
  const{state,saved,failWrites}=fixture()
  state.openInquiry('shadow-distance');state.inquiryForecast=0;state.beginInquiry()
  assert.equal(state.inquiryCanObserve,false)
  assert.equal(state.result.value,undefined)
  state.params.distance=20;state.recordInquiry()
  assert.equal(state.inquiryCanObserve,true)
  assert.equal(state.result.value,5)
  state.params.distance=40
  assert.equal(state.inquiryCanObserve,false)
  assert.equal(state.result.value,undefined)
  for(const distance of [40,60]){state.params.distance=distance;state.recordInquiry()}
  state.params.distance=50;state.inquiryPhase='evidence'
  assert.equal(state.inquiryCanObserve,false)
  assert.equal(state.result.value,undefined)
  state.selectedEvidence=[0,1];state.inquiryConclusion=1;state.acceptInquiryEvidence()
  assert.equal(state.inquiryPhase,'transfer')
  assert.equal(state.inquiryCanObserve,false)
  state.params.distance=30
  assert.equal(state.result.value,undefined)
  assert.match(state.result.text,/验证后/)
  state.transferForecast=1;state.lockTransfer()
  assert.equal(state.inquiryPhase,'locked')
  assert.equal(state.result.value,undefined)
  assert.equal(state.inquirySession.transfer.record,null)
  state.verifyTransfer()
  assert.equal(state.inquiryPhase,'verified')
  assert.equal(state.inquiryCanObserve,true)
  assert.equal(state.result.value,100/30)
  state.inquiryRevision=2;failWrites(true);state.finishInquiry()
  assert.equal(state.inquiryPhase,'verified')
  assert.equal(saved.has(inquiries.LAB_INQUIRIES_KEY),false)
  assert.equal(state.inquirySession.records.length,3)
  failWrites(false);state.finishInquiry()
  assert.equal(state.inquiryPhase,'complete')
  assert.equal(Object.keys(state.inquiryProgress.completed).length,1)
  assert.equal(saved.has(lab.LAB_KEY),false)
  assert.equal(saved.has(challenges.LAB_CHALLENGES_KEY),false)
})
test('page locks control variables after the first record and old experiments remain separate',()=>{
  const{state}=fixture()
  state.openInquiry('float-capacity');state.inquiryForecast=0;state.beginInquiry()
  state.params={mass:80,volume:60};state.recordInquiry()
  const mass=state.inquiryKnobs.find(k=>k.key==='mass')
  assert.equal(mass.min,41)
  state.changeInquiry(mass,{detail:{value:100}})
  assert.equal(state.params.mass,80)
  state.close();state.open(lab.EXPERIMENTS.find(e=>e.id==='shadow'))
  assert.equal(state.activeInquiry,null)
  assert.equal(state.experimentMode,'challenge')
  assert.equal(state.inquiryProgress.completed['float-capacity'],undefined)
})
