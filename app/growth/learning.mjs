export const EXPLORER_LEVELS=[{points:0,title:'观察员'},{points:40,title:'探索者'},{points:100,title:'小侦探'},{points:200,title:'小研究员'},{points:360,title:'发现家'}]
export const LEARNING_MILESTONES=[
 {id:'words-recognize',domain:'english',label:'认识新伙伴',detail:'独立辨认 5 个词',metric:'recognized',target:5},
 {id:'words-assemble',domain:'english',label:'字母巧手',detail:'独立拼装 10 个词',metric:'assembled',target:10},
 {id:'words-write',domain:'english',label:'独立拼写',detail:'独立输入拼写 10 个词',metric:'written',target:10},
 {id:'math-start',domain:'math',label:'认真算一轮',detail:'完成 20 道首次作答',metric:'firstTotal',target:20},
 {id:'math-kinds',domain:'math',label:'多种办法',detail:'4 类题各练 5 题，首次正确率达到 80%',metric:'steadyKinds',target:4},
 {id:'math-transfer',domain:'math',label:'换题也会',detail:'3 道错题通过不同日期的变式验证',metric:'mastered',target:3},
 {id:'safety-start',domain:'safety',label:'停下想一想',detail:'独立完成 3 个情境判断',metric:'steps',target:3},
 {id:'safety-three',domain:'safety',label:'出行小侦探',detail:'3 个故事的三步判断都独立完成过',metric:'completed',target:3},
 {id:'safety-all',domain:'safety',label:'安全同行',detail:'8 个故事的三步判断都独立完成过',metric:'completed',target:8},
 {id:'lab-one',domain:'lab',label:'带着问题动手',detail:'独立完成 1 项实验任务',metric:'completed',target:1},
 {id:'lab-four',domain:'lab',label:'证据收集员',detail:'独立完成 4 项实验任务',metric:'completed',target:4},
 {id:'lab-nine',domain:'lab',label:'发现新规律',detail:'独立完成 9 项实验任务',metric:'completed',target:9},
 ...[2,8,16].map((target,i)=>({id:'gomoku-'+target,domain:'gomoku',label:['落子有想法','攻防小能手','棋形小侦探'][i],detail:'独立完成 '+target+' 道五子棋训练',metric:'independent',target})),
 ...['mines','jump'].flatMap(domain=>[1,2,3].map(target=>({id:domain+'-'+target,domain,label:domain==='mines'?['数字初探','排雷进阶','推理挑战'][target-1]:['小岛初探','距离巧手','精准飞跃'][target-1],detail:'通过 '+target+' 个不同难度',metric:'completed',target})))
]
export const LEARNING_DOMAINS=[
 {id:'english',title:'英语成长',icon:'spell',url:'/pages/games/english?mode=recognize',copy:'辨认、拼装、独立拼写，逐步减少提示'},
 {id:'math',title:'口算办法',icon:'numbers',url:'/pages/learning/oral-daily',copy:'看解法，换一道同类题，隔日再验证'},
 {id:'safety',title:'安全判断',icon:'safety',url:'/pages/games/safety',copy:'发现危险、选择行动、再想一步'},
 {id:'lab',title:'科学发现',icon:'lab',url:'/pages/lab/index',copy:'先猜、留下对照证据，再解决新问题'},
 {id:'mines',title:'扫雷推理',icon:'mines',url:'/pages/games/minesweeper',copy:'不同棋盘与雷密度，慢慢看懂数字'},
 {id:'gomoku',title:'五子棋思考',icon:'gomoku',url:'/pages/games/gomoku',copy:'看懂棋形，先找自己的赢点，再看对方威胁'},
 {id:'jump',title:'跳跃节奏',icon:'jump',url:'/pages/games/jump',copy:'观察距离，再调整蓄力和落点'}
]
export const EXPLORER_BADGES_KEY='miaobang.learning-badges.v1'
export function readExplorerBadges(raw){if(raw===''||raw==null)return {version:1,earned:{}};const s=typeof raw==='string'?JSON.parse(raw):raw;if(!s||s.version!==1||!s.earned||typeof s.earned!=='object'||Array.isArray(s.earned)||Object.entries(s.earned).some(([id,at])=>!LEARNING_MILESTONES.some(m=>m.id===id)||!Number.isFinite(at)||at<0))throw new Error('成长徽章记录无法识别，原记录未改动。');return {version:1,earned:{...s.earned}}}
export function awardExplorerBadges(raw,metrics,at){const next=readExplorerBadges(raw);if(!Number.isFinite(at)||at<0)throw new Error('徽章记录时间无效。');for(const m of LEARNING_MILESTONES)if((metrics[m.domain]?.[m.metric]||0)>=m.target&&!Object.prototype.hasOwnProperty.call(next.earned,m.id))next.earned[m.id]=at;return next}
export function explorerProgress(metrics={},earnedIds=null){
 const badges=LEARNING_MILESTONES.map(m=>{const count=metrics[m.domain]?.[m.metric]||0;return {...m,count,earned:earnedIds===null?count>=m.target:earnedIds.includes(m.id)}})
 const points=badges.filter(b=>b.earned).length*20
 const index=EXPLORER_LEVELS.reduce((n,l,i)=>points>=l.points?i:n,0),level=EXPLORER_LEVELS[index],next=EXPLORER_LEVELS[index+1]||null
 return {points,badges,level:index+1,title:level.title,next,percent:next?Math.round((points-level.points)/(next.points-level.points)*100):100,domains:LEARNING_DOMAINS.map(d=>({...d,badges:badges.filter(b=>b.domain===d.id)}))}
}
