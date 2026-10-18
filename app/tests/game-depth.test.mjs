import test from 'node:test'
import assert from 'node:assert/strict'
import {MATCH_LEVELS,matchGoalReached,matchGoalText} from '../game/match-levels.mjs'
import {resolveBoard,createGrid} from '../game/match.mjs'
import {step} from '../game/snake.mjs'
function rng(){let n=12345;return ()=>{n=(n*16807)%2147483647;return (n-1)/2147483646}}
test('match levels use score, single-fruit and mixed-fruit goals rather than only scores',()=>{assert.equal(MATCH_LEVELS.filter(l=>!l.goals.length).length,4);assert.equal(MATCH_LEVELS.filter(l=>l.goals.length===1).length,4);assert.equal(MATCH_LEVELS.filter(l=>l.goals.length===2).length,4);const l=MATCH_LEVELS[1],c=[0,0,0,0,0];assert.equal(matchGoalReached(l,9999,c),false);c[l.goals[0].kind]=l.goals[0].count;assert.equal(matchGoalReached(l,0,c),true);assert.ok(matchGoalText(l,c).includes('/'))})
test('cascade fruit counts include every cleared cell exactly once',()=>{const random=rng(),grid=createGrid(random);grid[0][0]=grid[0][1]=grid[0][2]=2;const r=resolveBoard(grid,random);assert.ok(r.collected[2]>=3);assert.equal(r.collected.reduce((a,b)=>a+b,0),r.cleared)})
test('snake explains wall and self collisions separately',()=>{const base={rows:5,cols:5,food:{x:4,y:4},score:0};assert.equal(step({...base,cells:[{x:0,y:0}],direction:'left'}).reason,'wall');assert.equal(step({...base,cells:[{x:2,y:2},{x:3,y:2},{x:3,y:3},{x:2,y:3},{x:1,y:3}],direction:'right'}).reason,'self')})
