<template>
 <view class="family-page learning-growth">
  <text class="eyebrow">我的探索足迹 · 只存在这台设备</text><text class="title">每一步，都看得见</text>
  <view class="level-card"><image src="/static/puzzle/robot-miao.png" mode="aspectFit"/><view><text class="level-kicker">{{ errors.length ? '部分进度待核对' : '探索等级 Lv.'+progress.level }}</text><text class="level-title">{{ errors.length?'先保留记录，再重试读取':progress.title }}</text><template v-if="!errors.length"><text class="level-copy">{{ progress.points }} 成长点 · {{ progress.badges.filter(b=>b.earned).length }} 枚徽章</text><view class="level-track"><view :style="{width:progress.percent+'%'}"></view></view><text class="level-copy">{{ progress.next?'再获得 '+(progress.next.points-progress.points)+' 点，到达「'+progress.next.title+'」':'已到达发现家，继续探索喜欢的内容' }}</text></template></view></view>
  <text class="intro">每枚徽章记下一项具体的尝试与收获。同一枚只获得一次，每枚 20 成长点。选择你感兴趣的挑战就好。</text>
  <view v-if="errors.length" class="card"><text v-for="error in errors" :key="error" class="error">{{ error }}</text><button class="secondary" @click="load">重新读取</button></view>
  <view class="domain-grid"><view v-for="domain in progress.domains" :key="domain.id" class="card domain-card"><view class="domain-heading"><image :src="'/static/ui/activities/'+domain.icon+'.png'" mode="aspectFit"/><view><text class="heading">{{ domain.title }}</text><text class="muted">{{ detail[domain.id] || domain.copy }}</text></view></view><text class="next-objective">{{ nextGoal(domain) }}</text><button class="link milestones-toggle" @click="opened[domain.id]=!opened[domain.id]">{{ opened[domain.id]?'收起里程碑 −':'查看里程碑 · '+domain.badges.filter(b=>b.earned).length+'/3 ＋' }}</button><view v-if="opened[domain.id]" class="badges"><view v-for="badge in domain.badges" :key="badge.id" :class="['badge',{earned:badge.earned}]"><text class="badge-symbol">{{ badge.earned?'✓':'◇' }}</text><view><text>{{ badge.label }}</text><text>{{ badge.detail }}</text><text>{{ badge.earned?'已获得 · 20 点':Math.min(badge.count,badge.target)+' / '+badge.target }}</text></view></view></view><button class="secondary" @click="go(domain.url)">去探索 →</button></view></view>
  <view class="card family-note"><text class="heading">把收获带给家长</text><text class="muted">一起选一项发现，说说用了什么办法。家长可以为一次具体尝试留一朵鼓励花。</text><button class="primary" @click="go('/pages/growth/index')">去成长小花园</button></view>
 </view>
</template>
<script>
import { explorerProgress,EXPLORER_BADGES_KEY,readExplorerBadges,awardExplorerBadges } from '@/growth/learning.mjs'
import { wordProgressStore } from '@/services/word-progress.js'
import { summarizeWordProgress } from '@/knowledge/word-progress.mjs'
import { oralLearningStore } from '@/services/oral-learning.js'
import { safetyLearningStore } from '@/services/safety-learning.js'
import { LAB_CHALLENGES_KEY, readLabChallenges, summarizeLabChallenges } from '@/lab/challenges.mjs'
import { SKILL_CHALLENGES_KEY, readSkillChallenges, summarizeSkillChallenges } from '@/game/skill-challenges.mjs'
import { GOMOKU_LEARNING_KEY,readGomokuLearning,summarizeGomokuLearning } from '@/game/gomoku-learning.mjs'
import { GOMOKU_TACTICS_KEY } from '@/game/gomoku-tactics-progress.mjs'
import { tacticalPuzzles } from '@/game/gomoku-tactics.mjs'
import { LAB_INQUIRIES,LAB_INQUIRIES_KEY,readLabInquiries } from '@/lab/inquiries.mjs'
import { summarizeSafetyLearning } from '@/game/safety-learning.mjs'
export default {
 data(){return {metrics:{},detail:{},errors:[],earned:[],opened:{}}},computed:{progress(){return explorerProgress(this.metrics,this.earned)}},onShow(){this.load()},
 methods:{
 load(){const metrics={},detail={},errors=[];const read=(name,fn)=>{try{fn()}catch(e){errors.push(name+'：'+e.message)}};
 read('英语',()=>{const s=summarizeWordProgress(wordProgressStore.read());metrics.english=s;detail.english='辨认 '+s.recognized+' · 拼装 '+s.assembled+' · 独立拼写 '+s.written+' · 待复习 '+s.dueCount});
 read('口算',()=>{const s=oralLearningStore.summary();metrics.math={...s,steadyKinds:s.kinds.filter(k=>k.firstTotal>=5&&k.accuracy>=80).length};detail.math='已练 '+s.firstTotal+' 题 · 变式验证通过 '+s.mastered+' 项 · 待练 '+s.due+' 项'});
 read('安全',()=>{const s=summarizeSafetyLearning(safetyLearningStore.read());metrics.safety=s;detail.safety='独立完成过 '+s.steps+' 步 · 待复习 '+s.review.length+' 个故事'});
 read('五子棋',()=>{const s=summarizeGomokuLearning(readGomokuLearning(uni.getStorageSync(GOMOKU_LEARNING_KEY)));const t=readGomokuLearning(uni.getStorageSync(GOMOKU_TACTICS_KEY));const completed=tacticalPuzzles.filter(p=>t.practiced.includes(p.id)).length;metrics.gomoku=s;detail.gomoku='连续攻防 '+completed+' / '+tacticalPuzzles.length+' 段 · 单步巩固独立完成 '+s.independent+' / '+s.total+' 题'});
 read('实验',()=>{const s=summarizeLabChallenges(readLabChallenges(uni.getStorageSync(LAB_CHALLENGES_KEY)));const reports=readLabInquiries(uni.getStorageSync(LAB_INQUIRIES_KEY));metrics.lab=s;detail.lab='完整探究 '+Object.keys(reports.completed).length+' / '+LAB_INQUIRIES.length+' 份 · 入门任务 '+s.completed+' / '+s.total+' 项'});
 read('游戏挑战',()=>{const s=summarizeSkillChallenges(readSkillChallenges(uni.getStorageSync(SKILL_CHALLENGES_KEY)));metrics.mines={completed:s.mines};metrics.jump={completed:s.jump};detail.mines='已通过 '+s.mines+' / 3 档难度';detail.jump='已通过 '+s.jump+' / 3 档难度'});
 if(!errors.length){try{const raw=uni.getStorageSync(EXPLORER_BADGES_KEY),old=readExplorerBadges(raw),next=awardExplorerBadges(old,metrics,Date.now());if(Object.keys(next.earned).length!==Object.keys(old.earned).length)uni.setStorageSync(EXPLORER_BADGES_KEY,next);this.earned=Object.keys(next.earned)}catch(e){errors.push('徽章尚未保存：'+e.message)}}
 this.metrics=metrics;this.detail=detail;this.errors=errors},nextGoal(domain){const b=domain.badges.find(b=>!b.earned);return b?'下一步：'+b.detail+'（'+Math.min(b.count,b.target)+'/'+b.target+'）':'三枚徽章都已获得，继续挑战喜欢的内容吧'},go(url){uni.navigateTo({url})}
 }
}
</script>
<style src="@/styles/family.css"></style>
<style scoped>
.learning-growth{max-width:1000px}.level-card{display:flex;align-items:center;gap:15px;background:linear-gradient(125deg,#234e78,#347e91);border-radius:24px;padding:24px;color:#fff;margin:20px 0}.level-card>image{width:76px;height:100px;flex-shrink:0}.level-card>view{flex:1;min-width:0}.level-kicker,.level-title,.level-copy{display:block}.level-kicker{font-size:12px;color:#c8e2eb}.level-title{font-size:25px;font-weight:650;margin:8px 0}.level-copy{font-size:12px;color:#d2e7ec;line-height:1.7}.level-track{height:7px;background:#ffffff2a;border-radius:5px;overflow:hidden;margin:12px 0}.level-track view{height:100%;background:#f1ce7a;border-radius:5px}.domain-heading{display:flex;align-items:center;gap:12px}.domain-heading>image{width:50px;height:50px;flex-shrink:0}.domain-heading .muted{font-size:12px;line-height:1.8}.domain-card .secondary{margin-top:18px;width:100%;font-size:13px}.next-objective{display:block;margin-top:17px;padding:12px;background:#fff5df;color:#836637;border-radius:12px;font-size:12px;line-height:1.8}.milestones-toggle{font-size:12px;margin:8px 0 0;padding:0;text-align:left}.badges{margin-top:18px}.badge{display:flex;gap:12px;align-items:flex-start;background:#f3f6fa;padding:12px;border-radius:13px;margin-top:8px;color:#718196}.badge.earned{background:#eaf5ef;color:#31735c}.badge-symbol{width:26px;height:26px;border-radius:9px;background:#e2e9f2;line-height:26px;text-align:center;flex-shrink:0}.earned .badge-symbol{background:#b8dfcd}.badge view text{display:block;font-size:13px}.badge view text:nth-child(2){font-size:11px;line-height:1.7;margin:4px 0}.badge view text:last-child{font-size:11px}.family-note .muted{margin:12px 0;line-height:1.8}@media(min-width:768px){.domain-grid{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:18px}.domain-card{margin:0}.family-note{margin-top:20px}}
</style>
