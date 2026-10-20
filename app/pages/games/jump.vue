<template>
  <view class="family-page jump-page">
    <view class="jump-heading"><view><text class="eyebrow">小妙的益智游乐场 · 距离与节奏</text><text class="title">跳一跳</text></view><family-portrait class="heading-portrait" pose="ready" fallback="/static/ui/activities/jump.png" mode="aspectFit" /></view>
    <text class="intro">按住场地蓄力，松手跳跃。按得越久，跳得越远。先选距离挑战，再观察每次偏短、偏长的反馈。</text>
    <view class="difficulty-row"><button v-for="level in levels" :key="level.id" :class="['difficulty-chip',{selected:difficulty===level.id}]" :disabled="!!pending" @click="selectLevel(level.id)">{{ level.label }}<text>{{ progress.best.jump[level.id] ? '★ 已通过' : '☆ 待挑战' }}</text></button></view>
    <text class="muted difficulty-hint">{{ levelConfig.hint }}切换难度会重新开局。</text>
    <view class="jump-stats"><text>小岛 {{ game.landings }} / 10</text><text>{{ game.score }} 分</text><text>中心 {{ game.centers }} / {{ levelConfig.centers || '不限' }}</text></view>
    <view class="jump-stage" @touchstart.stop.prevent="hold" @touchend.stop.prevent="release" @touchcancel="cancel" @touchmove.stop.prevent="noop" @mousedown.prevent="hold" @mouseup="release" @mouseleave="cancel">
      <view class="cloud cloud-a"></view><view class="cloud cloud-b"></view><view class="sea"></view>
      <view v-for="(p,i) in [game.current,game.next]" :key="i" class="island" :class="{destination:i===1}" :style="{left:(p.x-game.camera)/320*100+'%',width:p.width/320*100+'%'}"><view class="island-top"><view class="island-center" :style="{width:(levelConfig.centerRadius*2/p.width*100)+'%'}"></view><text>{{ i===1 ? game.landings+1 : '起点' }}</text></view></view>
      <view class="jumper" :class="{charging:holding}" :style="{left:(game.player.x-game.camera)/320*100+'%',top:(game.player.y+24)/400*100+'%'}"><family-portrait pose="jump" mode="aspectFit"><view class="robot-fallback"><view class="antenna"></view><view class="robot-head"><view></view><view></view></view><view class="robot-body"></view></view></family-portrait></view>
      <view v-if="game.status!=='running'" class="jump-overlay" @touchstart.stop @touchend.stop @mousedown.stop @mouseup.stop>
        <family-portrait class="result-portrait" :pose="game.status==='complete' && game.passed ? 'celebrate' : 'ready'" fallback="/static/ui/activities/jump.png" mode="aspectFit" /><text>{{ resultTitle }}</text>
        <text class="muted overlay-description">{{ game.status==='over'||game.status==='complete' ? game.feedback : '先观察距离，再掌握蓄力节奏' }}</text>
        <text v-if="game.status==='complete' && game.passed" class="muted">{{ pending ? '本轮挑战星与纪录待保存。' : '本档挑战已记录 ★，重复游玩不会重复加星。' }}</text>
        <button class="primary" @click="pending ? saveRound() : start()">{{ pending?'重试保存本轮':game.status==='paused'?'继续挑战':game.status==='ready'?'开始挑战':'再挑战一次' }}</button>
        <button v-if="game.status==='complete' && game.passed && !pending && nextDifficulty" class="secondary" @click="selectLevel(nextDifficulty)">试试下一档 →</button>
      </view>
    </view>
    <view class="charge-track"><view :style="{width:charge/1.2*100+'%'}"></view></view><text class="charge-label">{{ holding?'正在蓄力，松手起跳':game.flight?'正在飞跃':'按住场地任意位置，松手起跳' }}</text>
    <text v-if="game.status==='running' && game.feedback" class="landing-feedback">{{ game.feedback }}</text>
    <button v-if="game.status==='running'" class="secondary" @click="pause">暂停</button><text class="muted tip">小岛上浅色圆点是中心区域，落在中心得 20 分，其他位置得 10 分。中、高档需要累计中心落点；目标是比较距离和调整方法，不用追求越快越好。</text><text v-if="currentBest" class="muted best-note">本档最高 {{ currentBest.score }} 分 · 中心 {{ currentBest.centers }}/10 次 ★</text><text v-if="best" class="muted best-note">旧版自由跳纪录：{{ best }}（分别保留）</text><text v-if="error" class="error">{{ error }}</text>
  </view>
</template>
<script>
import { createJump, launchJump, stepJump, JUMP_LEVELS } from '@/game/jump.mjs'
import { skillChallengesStore } from '@/services/skill-challenges.js'
import { arcadeStore } from '@/services/arcade.js'
import { bestText } from '@/game/arcade-progress.mjs'
export default {
 data(){return {game:createJump(),difficulty:'easy',progress:{version:1,best:{mines:{},jump:{}}},pending:null,holding:false,heldAt:0,charge:0,timer:null,last:0,best:'',error:''}},
 computed:{
  levels(){return JUMP_LEVELS},levelConfig(){return JUMP_LEVELS.find(level=>level.id===this.difficulty)},
  currentBest(){return this.progress.best.jump[this.difficulty]},nextDifficulty(){return JUMP_LEVELS[JUMP_LEVELS.findIndex(level=>level.id===this.difficulty)+1]?.id||''},
  resultTitle(){return this.game.status==='ready'?'准备好观察距离了吗？':this.game.status==='paused'?'休息一下':this.game.status==='complete'?(this.game.passed?'10 座岛，挑战通过！':'10 座岛已到，再练中心落点'):this.game.miss==='short'?'这次偏短了':'这次偏长了'}
 },
 onLoad(){try{this.best=bestText(arcadeStore.read(),'jump')}catch(e){this.error=e.message}try{this.progress=skillChallengesStore.read()}catch(e){this.error=e.message}},onHide(){this.pause()},onUnload(){this.stop()},
 methods:{
 noop(){},cancel(){this.holding=false;this.charge=0},stop(){clearInterval(this.timer);this.timer=null;this.cancel()},
 pause(){this.stop();if(this.game.status==='running')this.game.status='paused'},
 selectLevel(id){if(this.pending||!JUMP_LEVELS.some(level=>level.id===id))return;this.stop();this.difficulty=id;this.game=createJump(Math.random,id);this.error=''},
 start(){if(this.pending)return;this.stop();if(this.game.status!=='paused')this.game=createJump(Math.random,this.difficulty);this.game.status='running';this.error='';this.last=Date.now();this.timer=setInterval(this.frame,25)},
 hold(){if(this.game.status!=='running'||this.game.flight||this.holding)return;this.holding=true;this.heldAt=Date.now();this.charge=0},
 release(){if(!this.holding)return;const duration=Math.min(1.2,Math.max(0,(Date.now()-this.heldAt)/1000));this.cancel();launchJump(this.game,duration)},
 frame(){const now=Date.now();if(this.holding)this.charge=Math.min(1.2,(now-this.heldAt)/1000);stepJump(this.game,(now-this.last)/1000);this.last=now;if(['over','complete'].includes(this.game.status)){this.stop();if(this.game.status==='complete'&&this.game.passed){this.pending={level:this.difficulty,score:this.game.score,centers:this.game.centers,landings:10,at:now};this.saveRound()}}},
 saveRound(){if(!this.pending)return;try{this.progress=skillChallengesStore.save('jump',this.pending.level,this.pending);this.pending=null;this.error=''}catch(e){this.error='本轮通关记录没能保存，请保留页面后重试：'+e.message}}
 }
}
</script>
<style src="@/styles/family.css"></style>
<style scoped>
.jump-page{max-width:600px}.jump-heading{display:flex;justify-content:space-between;align-items:center}.jump-heading .heading-portrait{width:64px;height:64px;flex-shrink:0}.jump-stats{display:flex;justify-content:space-between;color:#476b7f;font-size:14px;margin:15px 0}.jump-stage{position:relative;height:clamp(300px,48vh,560px);overflow:hidden;background:linear-gradient(#d9eff6,#eff9f3);border-radius:24px;touch-action:none;user-select:none}.sea{position:absolute;top:83%;width:100%;height:17%;background:#b3dbdf;border-top:5px solid #e6f7f3}.cloud{position:absolute;width:90px;height:22px;background:#fff9;border-radius:50px}.cloud-a{left:8%;top:18%}.cloud-b{right:7%;top:30%;width:60px}.island{position:absolute;top:76%;height:20%;transform:translateX(-50%);background:linear-gradient(#a3c5bd,#759998);border-radius:12px 12px 22px 22px;box-shadow:0 8px 10px #45626b16}.island-top{position:absolute;top:-12px;width:100%;height:25px;border-radius:50%;background:#7fb7a1;border:2px solid #538b80;box-sizing:border-box;text-align:center;color:#fff;font-size:12px;line-height:21px}.destination .island-top{background:#f0c76d;border-color:#cca64e}.jumper{position:absolute;width:64px;height:64px;transform:translate(-50%,-100%);transform-origin:50% 100%;z-index:2;pointer-events:none}.jumper.charging{transform:translate(-50%,-100%) scale(1.08,.8)}.robot-fallback{position:absolute;left:50%;bottom:0;width:30px;height:43px;transform:translateX(-50%)}.robot-head{height:21px;border:2px solid #355f7c;background:#b5dcf1;border-radius:7px;display:flex;justify-content:center;align-items:center;gap:6px}.robot-head view{width:4px;height:5px;background:#355f7c;border-radius:2px}.robot-body{width:19px;height:15px;background:#f1cf7b;border:2px solid #355f7c;border-radius:4px;margin:-1px auto}.antenna{position:absolute;width:3px;height:7px;left:14px;top:-6px;background:#355f7c}.jump-overlay{position:absolute;inset:0;z-index:3;display:flex;flex-direction:column;justify-content:center;align-items:center;gap:18px;padding:20px;background:#eef8f3ee;text-align:center;font-size:22px;color:#345a70}.jump-overlay .result-portrait{width:84px;height:84px;flex-shrink:0}.jump-overlay .primary{width:80%}.charge-track{height:10px;background:#dce9ef;border-radius:10px;margin-top:16px;overflow:hidden}.charge-track view{height:100%;background:linear-gradient(90deg,#79bba9,#e8ba60)}.charge-label{display:block;text-align:center;font-size:13px;color:#557789;margin:10px 0 16px}.tip{margin-top:20px;font-size:13px;line-height:1.8}
.jumper :deep(.portrait-private){transform:translateY(2.472%)}
.difficulty-row{display:flex;gap:6px;margin:16px 0 10px}.difficulty-chip{flex:1;min-width:0;margin:0;padding:10px 3px;line-height:1.5;font-size:13px;color:#476b88;background:#eaf0f8;border:1px solid #d6e3f1;border-radius:12px}.difficulty-chip text{display:block;font-size:11px;margin-top:4px}.difficulty-chip.selected{background:#e0f0ec;border-color:#80b6a5;color:#285f50}.difficulty-hint{display:block;font-size:12px;line-height:1.8}.island-center{position:absolute;left:50%;top:4px;height:12px;transform:translateX(-50%);border-radius:50%;background:#fff7;border:1px solid #fff9}.island-top text{position:relative;z-index:1}.overlay-description{font-size:14px;line-height:1.8}.jump-overlay .secondary{width:80%;font-size:14px}.landing-feedback{display:block;margin:10px 0;font-size:14px;line-height:1.8;color:#2c7964}.best-note{display:block;margin-top:12px;font-size:12px}
</style>
