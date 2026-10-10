export const FIELD = {width:320,height:480,duration:90}
const clamp=(v,min,max)=>Math.max(min,Math.min(max,v))
const near=(a,b,r)=>Math.hypot(a.x-b.x,a.y-b.y)<r
export function createPlane(){return {time:0,status:'ready',score:0,lives:3,player:{x:160,y:414},invincible:0,shield:0,spread:0,fire:0,spawn:0,bullets:[],enemies:[],shots:[],gifts:[],sparks:[],nextId:1}}
export function movePlane(state,x,y){if(!Number.isFinite(x)||!Number.isFinite(y))return;state.player={x:clamp(x,18,302),y:clamp(y,50,450)}}
// 每步最多 50 毫秒；隐藏页面由页面停止推进，不追赶离线时间。
export function stepPlane(s,dt,random=Math.random){
  if(s.status!=='running')return s
  dt=clamp(Number.isFinite(dt)?dt:0,0,.05);s.time+=dt
  s.invincible=Math.max(0,s.invincible-dt);s.spread=Math.max(0,s.spread-dt)
  s.fire-=dt;s.spawn-=dt
  if(s.fire<=0){s.fire=.2;const angles=s.spread>0?[-70,0,70]:[0];angles.forEach(vx=>s.bullets.push({id:s.nextId++,x:s.player.x,y:s.player.y-24,vx}))}
  if(s.spawn<=0){s.spawn=Math.max(.38,.9-s.time*.004);const heavy=random()<.22;s.enemies.push({id:s.nextId++,x:24+random()*272,y:-30,r:heavy?22:14,hp:heavy?4:1,maxHp:heavy?4:1,speed:heavy?40:65+random()*30,fire:heavy?1.4:Infinity})}
  s.bullets.forEach(b=>{b.y-=330*dt;b.x+=b.vx*dt})
  s.enemies.forEach(e=>{e.y+=e.speed*dt;e.fire-=dt;if(e.fire<=0){e.fire=1.6;s.shots.push({id:s.nextId++,x:e.x,y:e.y+e.r})}})
  s.shots.forEach(b=>b.y+=145*dt);s.gifts.forEach(g=>g.y+=70*dt);s.sparks.forEach(e=>e.age+=dt)
  for(const b of s.bullets){if(b.dead)continue;const e=s.enemies.find(e=>!e.dead&&near(b,e,e.r+3));if(!e)continue;b.dead=true;e.hp-=1;if(e.hp<=0){e.dead=true;s.score+=e.maxHp===1?10:40;s.sparks.push({x:e.x,y:e.y,age:0});if(random()<.18)s.gifts.push({id:s.nextId++,x:e.x,y:e.y,type:random()<.5?'shield':'spread'})}}
  for(const g of s.gifts){if(near(g,s.player,22)){g.dead=true;if(g.type==='shield')s.shield=1;else s.spread=8}}
  const hit=(s.shots.find(b=>!b.dead&&near(b,s.player,11))||s.enemies.find(e=>!e.dead&&near(e,s.player,e.r+8)))
  if(hit&&s.invincible===0){hit.dead=true;if(s.shield)s.shield=0;else s.lives-=1;s.invincible=1.5;s.sparks.push({x:s.player.x,y:s.player.y,age:0});if(s.lives===0)s.status='over'}
  s.bullets=s.bullets.filter(b=>!b.dead&&b.y>-10&&b.x>-10&&b.x<330)
  s.enemies=s.enemies.filter(e=>!e.dead&&e.y<520);s.shots=s.shots.filter(b=>!b.dead&&b.y<500);s.gifts=s.gifts.filter(g=>!g.dead&&g.y<510);s.sparks=s.sparks.filter(e=>e.age<.4)
  if(s.time>=FIELD.duration&&s.status==='running'){s.time=FIELD.duration;s.status='complete'}
  return s
}
export function touchPosition(touch,rect){
  // uni-app 的 x/y 为画布内坐标；浏览器的 clientX/clientY 为视口坐标。
  const x=Number.isFinite(touch.x)?touch.x:touch.clientX-rect.left
  const y=Number.isFinite(touch.y)?touch.y:touch.clientY-rect.top
  return {x:x/rect.width*FIELD.width,y:y/rect.height*FIELD.height}
}
