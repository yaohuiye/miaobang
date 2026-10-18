export const MATCH_LEVEL_KEY='miaobang.match-levels.v1'
export const MATCH_LEVELS=Array.from({length:12},(_,i)=>({name:['水果初遇','苹果小径','橘子花园','葡萄藤下','莓莓午后','花田寻宝','连消练习','彩虹果园','巧手排列','丰收挑战','果园高手','水果庆典'][i],target:180+i*70,moves:18-Math.floor(i/4),goals:i%3===0?[]:i%3===1?[{kind:i%5,count:8+Math.floor(i/3)*2}]:[{kind:i%5,count:5+Math.floor(i/3)},{kind:(i+1)%5,count:5+Math.floor(i/3)}]}))
export function readMatchLevels(value){if(value===''||value==null)return {version:1,unlocked:1};const s=typeof value==='string'?JSON.parse(value):value;if(!s||s.version!==1||!Number.isInteger(s.unlocked)||s.unlocked<1||s.unlocked>12)throw new Error('关卡记录无法识别，原记录未改动。');return {version:1,unlocked:s.unlocked}}
export function unlockMatchLevel(state,level){if(!Number.isInteger(level)||level<1||level>state.unlocked)throw new Error('请先完成前面的关卡。');return {version:1,unlocked:Math.min(12,Math.max(state.unlocked,level+1))}}

export function matchGoalReached(level,score,collected){return level.goals.length?level.goals.every(g=>(collected[g.kind]||0)>=g.count):score>=level.target}
export function matchGoalText(level,collected=[]){const names=['苹果','橘子','葡萄','草莓','向日葵'];return level.goals.length?level.goals.map(g=>names[g.kind]+' '+Math.min(g.count,collected[g.kind]||0)+' / '+g.count).join(' · '):'目标 '+level.target+' 分'}
