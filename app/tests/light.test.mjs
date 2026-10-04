import test from 'node:test'
import assert from 'node:assert/strict'
import { lightLevels } from '../data/light-levels.mjs'
import { traceLight, lightHint } from '../game/light.mjs'
import { LIGHT_KEY, createLightStore, readLightProgress } from '../game/light-progress.mjs'

test('six light levels have distinct in-bounds objects, begin unsolved and can be solved using current-state hints',()=>{
  assert.equal(lightLevels.length,6)
  assert.equal(new Set(lightLevels.map(level=>level.id)).size,6)
  for(const level of lightLevels) {
    const points=[level.source,level.target,...level.mirrors,...level.rocks]
    assert.equal(new Set(points.map(p=>`${p.x},${p.y}`)).size,points.length)
    assert.ok(points.every(p=>Number.isInteger(p.x)&&Number.isInteger(p.y)&&p.x>=0&&p.y>=0&&p.x<6&&p.y<6))
    const faces=level.mirrors.map(m=>m.face)
    assert.notEqual(traceLight(level,faces).status,'lit')
    for(let i=0;i<level.mirrors.length;i++) {
      const hint=lightHint(level,faces)
      assert.ok(hint,level.id)
      if(hint.ready) break
      faces[hint.index]=hint.face
    }
    const trace=traceLight(level,faces)
    assert.equal(trace.status,'lit',level.id)
    assert.deepEqual(trace.segments.at(-1).to,level.target)
    assert.deepEqual(lightHint(level,faces),{ready:true})
  }
})

test('both mirror orientations reflect correctly from all four directions',()=>{
  const starts={E:{x:0,y:1},W:{x:2,y:1},N:{x:1,y:2},S:{x:1,y:0}}
  const ends={E:{x:2,y:1},W:{x:0,y:1},N:{x:1,y:0},S:{x:1,y:2}}
  const expected={'/':{E:'N',W:'S',N:'E',S:'W'},'\\':{E:'S',W:'N',N:'W',S:'E'}}
  for(const face of ['/', '\\']) for(const direction of Object.keys(starts)) {
    const level={size:3,source:{...starts[direction],direction},target:ends[expected[face][direction]],mirrors:[{x:1,y:1}],rocks:[]}
    assert.equal(traceLight(level,[face]).status,'lit',`${face} ${direction}`)
  }
})

test('rocks stop light before the target; an edge ends precisely at the board boundary',()=>{
  const level={size:3,source:{x:0,y:1,direction:'E'},target:{x:2,y:1},mirrors:[],rocks:[{x:1,y:1}]}
  assert.equal(traceLight(level,[]).status,'rock')
  assert.deepEqual(traceLight(level,[]).segments.at(-1).to,{x:1,y:1})
  assert.equal(traceLight({...level,rocks:[]},[]).status,'lit')
  const edge=traceLight({...level,rocks:[],target:{x:2,y:2}},[])
  assert.equal(edge.status,'edge')
  assert.deepEqual(edge.segments.at(-1).to,{x:2.5,y:1})
  assert.equal(lightHint(level,[]),null)
})

test('a repeated directed position terminates a cycle without an unbounded animation',()=>{
  const level={size:3,source:{x:0,y:0,direction:'E'},target:{x:1,y:1},rocks:[],mirrors:[{x:2,y:0},{x:2,y:2},{x:0,y:2},{x:0,y:0}]}
  const trace=traceLight(level,['\\','/','\\','/'])
  assert.equal(trace.status,'loop')
  assert.equal(trace.segments.length,8)
})

test('all mirror configurations terminate; hints converge and do not mutate the puzzle',()=>{
  const before=JSON.stringify(lightLevels)
  for(const level of lightLevels) for(let mask=0;mask<2**level.mirrors.length;mask++) {
    const faces=level.mirrors.map((_,i)=>mask&(1<<i)?'/':'\\'), original=[...faces]
    const trace=traceLight(level,faces)
    assert.ok(trace.segments.length<=level.size**2*4+1)
    const hint=lightHint(level,faces)
    assert.ok(hint)
    assert.deepEqual(faces,original)
    if(hint.ready) assert.equal(trace.status,'lit')
    else assert.notEqual(hint.face,faces[hint.index])
  }
  assert.equal(JSON.stringify(lightLevels),before)
  assert.throws(()=>traceLight(lightLevels[0],[]))
  assert.throws(()=>traceLight(lightLevels[0],['wrong']))
})

test('unused mirror orientations both count as a solution',()=>{
  const level=lightLevels[3]
  for(const extra of ['/','\\']) assert.equal(traceLight(level,['/','/','/',extra]).status,'lit')
})

test('light progress survives rereads and deduplicates repeated completion',()=>{
  let saved=''; let writes=0
  const store=createLightStore({get:key=>{assert.equal(key,LIGHT_KEY);return saved},set:(key,value)=>{assert.equal(key,LIGHT_KEY);saved=JSON.stringify(value);writes++}})
  assert.deepEqual(store.read(),{version:1,completed:[]})
  store.mark('light-1'); store.mark('light-1'); store.mark('light-6')
  assert.equal(writes,2)
  assert.deepEqual(store.read().completed,['light-1','light-6'])
  assert.throws(()=>store.mark('unknown'))
  assert.deepEqual(readLightProgress({version:1,completed:['light-1','light-1','unknown']}).completed,['light-1'])
})

test('failed writes and malformed or future progress do not overwrite previous data',()=>{
  let saved={version:1,completed:['light-1']}, writes=0
  const store=createLightStore({get:()=>saved,set:()=>{writes++;throw Error('full')}})
  assert.throws(()=>store.mark('light-2'))
  assert.deepEqual(saved,{version:1,completed:['light-1']})
  for(const invalid of ['broken',{version:2,completed:[]},{version:1,completed:[2]}]) {
    saved=invalid
    assert.throws(()=>store.mark('light-2'))
    assert.equal(saved,invalid)
  }
  assert.equal(writes,1)
})
