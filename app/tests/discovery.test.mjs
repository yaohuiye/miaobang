import test from 'node:test'
import assert from 'node:assert/strict'
import {EXPERIMENTS,defaults,observe,readNotebook,saveNote,LAB_KEY} from '../lab/experiments.mjs'
import {createPlane,stepPlane,movePlane,touchPosition,FIELD} from '../game/plane.mjs'
import {drawExperiment} from '../lab/draw.mjs'
import {drawPlane} from '../game/plane-draw.mjs'
import {emptyArcade,recordBest,readArcade} from '../game/arcade-progress.mjs'
const close=(a,b)=>assert.ok(Math.abs(a-b)<.00001,`${a} != ${b}`)
test('13 experiments produce valid results across each control range and can all render',()=>{
  assert.equal(EXPERIMENTS.length,13);assert.equal(new Set(EXPERIMENTS.map(e=>e.id)).size,13)
  const ctx=new Proxy({}, {get:()=>()=>{}})
  for(const e of EXPERIMENTS){const p=defaults(e);assert.ok(observe(e.id,p).text);for(const k of e.knobs){for(const v of [k.min,k.max]){const q={...p,[k.key]:v},r=observe(e.id,q);if(typeof r.value==='number')assert.ok(Number.isFinite(r.value));drawExperiment(ctx,e,q,r,.5)}}}
})
test('shadow and buoyancy respond to physical changes, including neutral buoyancy',()=>{
  assert.equal(observe('shadow',{distance:50}).value,2);assert.ok(observe('shadow',{distance:20}).value>observe('shadow',{distance:80}).value)
  assert.equal(observe('float',{mass:100,volume:80}).sunk,true);assert.equal(observe('float',{mass:100,volume:200}).value,.5);assert.equal(observe('float',{mass:100,volume:100}).sunk,false)
})
test('every broken circuit stays off, only complete circuit lights the lamp',()=>{for(let a=0;a<2;a++)for(let b=0;b<2;b++)for(let c=0;c<2;c++)assert.equal(observe('circuit',{a,b,c}).value,a&&b&&c?1:0)})
test('magnetic material and pole changes do not claim all metals are magnetic',()=>{
  for(let material=0;material<5;material++)assert.equal(observe('materials',{material}).value,material===0?1:0)
  assert.equal(observe('poles',{flip:0}).value,0);assert.equal(observe('poles',{flip:1}).value,1)
})
test('sound pitch stays constant when only volume changes',()=>{for(let tone=0;tone<3;tone++)assert.equal(observe('sound',{tone,volume:1}).value,observe('sound',{tone,volume:3}).value)})
test('motion follows square-root ramp and parachute scaling, friction shortens distance',()=>{
  close(observe('ramp',{height:40}).value/observe('ramp',{height:10}).value,2)
  close(observe('parachute',{area:40}).value/observe('parachute',{area:10}).value,.5)
  assert.ok(observe('friction',{rough:1}).value>observe('friction',{rough:5}).value)
})
test('lever balances torque and pressure distance responds to head',()=>{
  assert.equal(observe('lever',{left:2,right:4}).value,0);assert.ok(observe('lever',{left:3,right:4}).value>0)
  close(observe('pressure',{height:40}).value/observe('pressure',{height:10}).value,2)
})
test('RGB is additive light and lunar phases go new-quarter-full-quarter-new',()=>{
  assert.equal(observe('color',{red:255,green:255,blue:0}).value,'rgb(255,255,0)')
  for(const [angle,f] of [[0,0],[90,.5],[180,1],[270,.5],[360,0]])close(observe('moon',{angle}).value,f)
})
test('notebook persists one bounded note per experiment without replacing unreadable or failed saves',()=>{
  let stored='';const storage={get:k=>{assert.equal(k,LAB_KEY);return stored},set:(k,v)=>stored=v}
  saveNote(storage,'shadow','  更大了  ',10);saveNote(storage,'shadow','新发现',20);assert.equal(Object.keys(readNotebook(stored).notes).length,1);assert.equal(stored.notes.shadow.text,'新发现')
  assert.throws(()=>saveNote(storage,'float',' ',21));assert.throws(()=>saveNote({...storage,set:()=>{throw Error('full')}},'float','浮了',22),/full/);assert.equal(stored.notes.float,undefined)
  stored={version:2,notes:{}};assert.throws(()=>saveNote(storage,'float','浮了',23));assert.equal(stored.version,2)
})
test('plane stays bounded and touch coordinates work at different canvas sizes',()=>{
  const s=createPlane();movePlane(s,-100,999);assert.deepEqual(s.player,{x:18,y:450});movePlane(s,NaN,0);assert.equal(s.player.x,18)
  assert.deepEqual(touchPosition({clientX:170,clientY:260},{left:10,top:20,width:320,height:480}),{x:160,y:240})
  assert.deepEqual(touchPosition({x:320,y:480},{left:10,top:20,width:640,height:960}),{x:160,y:240})
})
test('plane does not advance when ready, paused or finished and clamps frame delays',()=>{
  const s=createPlane();stepPlane(s,1);assert.equal(s.time,0);s.status='running';stepPlane(s,20,()=>.9);close(s.time,.05);assert.equal(s.bullets.length,1)
  s.status='paused';const before=JSON.stringify(s);stepPlane(s,.05);assert.equal(JSON.stringify(s),before)
})
test('one bullet hits only one enemy and enemy health determines score',()=>{
  const s=createPlane();s.status='running';s.spawn=100;s.fire=100;s.bullets=[{x:100,y:100,vx:0}];s.enemies=[{x:100,y:100,r:14,hp:1,maxHp:1,speed:0,fire:100},{x:100,y:100,r:14,hp:1,maxHp:1,speed:0,fire:100}];stepPlane(s,0,()=>.9);assert.equal(s.score,10);assert.equal(s.enemies.length,1)
  s.bullets=[{x:100,y:100,vx:0}];s.enemies=[{x:100,y:100,r:22,hp:2,maxHp:4,speed:0,fire:100}];stepPlane(s,0,()=>.9);assert.equal(s.score,10);assert.equal(s.enemies[0].hp,1)
})
test('shield absorbs collision, invulnerability prevents repeat damage, final hit ends game',()=>{
  const s=createPlane();s.status='running';s.fire=s.spawn=100;s.shield=1;s.shots=[{...s.player}];stepPlane(s,0);assert.equal(s.lives,3);assert.equal(s.shield,0)
  s.shots=[{...s.player}];stepPlane(s,0);assert.equal(s.lives,3);s.invincible=0;s.lives=1;stepPlane(s,0);assert.equal(s.status,'over');assert.equal(s.lives,0)
})
test('supplies grant powers and spread fires three lanes',()=>{
  const s=createPlane();s.status='running';s.spawn=s.fire=100;s.gifts=[{...s.player,type:'spread'},{...s.player,type:'shield'}];stepPlane(s,0);assert.equal(s.spread,8);assert.equal(s.shield,1);assert.equal(s.gifts.length,0);s.fire=0;stepPlane(s,0);assert.equal(s.bullets.length,3)
})
test('90 second mission completes and existing arcade data accepts a plane best',()=>{
  const s=createPlane();s.status='running';s.time=89.99;s.spawn=s.fire=100;stepPlane(s,.03);assert.equal(s.time,FIELD.duration);assert.equal(s.status,'complete');drawPlane(new Proxy({},{get:()=>()=>{}}),s)
  const old=recordBest(emptyArcade(),'snake',50,10),next=recordBest(old,'plane',120,20);assert.equal(readArcade(next).best.snake.value,50);assert.equal(readArcade(next).best.plane.value,120)
})
