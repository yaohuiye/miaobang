<template>
  <view class="family-page jump-page">
    <view class="jump-heading"><view><text class="eyebrow">小妙的益智游乐场 · 距离与节奏</text><text class="title">跳一跳</text></view><image src="/static/ui/activities/jump.png" mode="aspectFit" /></view>
    <text class="intro">按住场地蓄力，松手跳跃。按得越久，跳得越远。连续到达 10 座小岛就完成挑战。</text>
    <view class="jump-stats"><text>小岛 {{ game.landings }} / 10</text><text>{{ game.score }} 分</text><text>{{ best }}</text></view>
    <view class="jump-stage" @touchstart.stop.prevent="hold" @touchend.stop.prevent="release" @touchcancel="cancel" @touchmove.stop.prevent="noop" @mousedown.prevent="hold" @mouseup="release" @mouseleave="cancel">
      <view class="cloud cloud-a"></view><view class="cloud cloud-b"></view><view class="sea"></view>
      <view v-for="(p,i) in [game.current,game.next]" :key="i" class="island" :class="{destination:i===1}" :style="{left:(p.x-game.camera)/320*100+'%',width:p.width/320*100+'%'}"><view class="island-top"><text>{{ i===1 ? game.landings+1 : '起点' }}</text></view></view>
      <view class="jumper" :class="{charging:holding}" :style="{left:(game.player.x-game.camera)/320*100+'%',top:game.player.y/400*100+'%'}"><view class="antenna"></view><view class="robot-head"><view></view><view></view></view><view class="robot-body"></view></view>
      <view v-if="game.status!=='running'" class="jump-overlay" @touchstart.stop @touchend.stop @mousedown.stop @mouseup.stop><image src="/static/ui/activities/jump.png" mode="aspectFit" /><text>{{ game.status==='ready'?'准备好跳一跳了吗？':game.status==='paused'?'休息一下':'complete'===game.status?'10 座小岛，挑战成功！':'差一点，再试试！' }}</text><text class="muted">{{ game.status==='over'||game.status==='complete' ? '本次获得 '+game.score+' 分' : '先观察距离，再掌握蓄力节奏' }}</text><button class="primary" @click="start">{{ game.status==='paused'?'继续挑战':'开始挑战' }}</button></view>
    </view>
    <view class="charge-track"><view :style="{width:charge/1.2*100+'%'}"></view></view><text class="charge-label">{{ holding?'正在蓄力，松手起跳':game.flight?'正在飞跃':'按住场地任意位置，松手起跳' }}</text>
    <button v-if="game.status==='running'" class="secondary" @click="pause">暂停</button><text class="muted tip">落在小岛中心得 20 分，其他位置得 10 分。和家长轮流尝试，猜猜这次需要按多久。</text><text v-if="error" class="error">{{ error }}</text>
  </view>
</template>
<script>
import { createJump, launchJump, stepJump } from '@/game/jump.mjs'
import { arcadeStore } from '@/services/arcade.js'
import { bestText } from '@/game/arcade-progress.mjs'
export default {
 data(){return {game:createJump(),holding:false,heldAt:0,charge:0,timer:null,last:0,best:'',error:''}},
 onLoad(){try{this.best=bestText(arcadeStore.read(),'jump')}catch(e){this.error=e.message}},onHide(){this.pause()},onUnload(){this.stop()},
 methods:{
 noop(){},cancel(){this.holding=false;this.charge=0},stop(){clearInterval(this.timer);this.timer=null;this.cancel()},
 pause(){this.stop();if(this.game.status==='running')this.game.status='paused'},
 start(){this.stop();if(this.game.status!=='paused')this.game=createJump();this.game.status='running';this.last=Date.now();this.timer=setInterval(this.frame,25)},
 hold(){if(this.game.status!=='running'||this.game.flight||this.holding)return;this.holding=true;this.heldAt=Date.now();this.charge=0},
 release(){if(!this.holding)return;const duration=Math.min(1.2,Math.max(0,(Date.now()-this.heldAt)/1000));this.cancel();launchJump(this.game,duration)},
 frame(){const now=Date.now();if(this.holding)this.charge=Math.min(1.2,(now-this.heldAt)/1000);stepJump(this.game,(now-this.last)/1000);this.last=now;if(['over','complete'].includes(this.game.status)){this.stop();try{this.best=bestText(arcadeStore.save('jump',this.game.score,Date.now()),'jump')}catch(e){this.error='成绩没能保存：'+e.message}}}
 }
}
</script>
<style src="@/styles/family.css"></style>
<style scoped>
.jump-page{max-width:600px}.jump-heading{display:flex;justify-content:space-between;align-items:center}.jump-heading image{width:64px;height:64px}.jump-stats{display:flex;justify-content:space-between;color:#476b7f;font-size:14px;margin:15px 0}.jump-stage{position:relative;aspect-ratio:4/5;max-height:560px;overflow:hidden;background:linear-gradient(#d9eff6,#eff9f3);border-radius:24px;touch-action:none;user-select:none}.sea{position:absolute;top:83%;width:100%;height:17%;background:#b3dbdf;border-top:5px solid #e6f7f3}.cloud{position:absolute;width:90px;height:22px;background:#fff9;border-radius:50px}.cloud-a{left:8%;top:18%}.cloud-b{right:7%;top:30%;width:60px}.island{position:absolute;top:76%;height:20%;transform:translateX(-50%);background:linear-gradient(#a3c5bd,#759998);border-radius:12px 12px 22px 22px;box-shadow:0 8px 10px #45626b16}.island-top{position:absolute;top:-12px;width:100%;height:25px;border-radius:50%;background:#7fb7a1;border:2px solid #538b80;box-sizing:border-box;text-align:center;color:#fff;font-size:12px;line-height:21px}.destination .island-top{background:#f0c76d;border-color:#cca64e}.jumper{position:absolute;width:30px;height:40px;transform:translate(-50%,-50%);z-index:2}.jumper.charging{transform:translate(-50%,-35%) scaleY(.8)}.robot-head{height:21px;border:2px solid #355f7c;background:#b5dcf1;border-radius:7px;display:flex;justify-content:center;align-items:center;gap:6px}.robot-head view{width:4px;height:5px;background:#355f7c;border-radius:2px}.robot-body{width:19px;height:15px;background:#f1cf7b;border:2px solid #355f7c;border-radius:4px;margin:-1px auto}.antenna{position:absolute;width:3px;height:7px;left:14px;top:-6px;background:#355f7c}.jump-overlay{position:absolute;inset:0;z-index:3;display:flex;flex-direction:column;justify-content:center;align-items:center;gap:18px;padding:20px;background:#eef8f3ee;text-align:center;font-size:22px;color:#345a70}.jump-overlay image{width:84px;height:84px}.jump-overlay .primary{width:80%}.charge-track{height:10px;background:#dce9ef;border-radius:10px;margin-top:16px;overflow:hidden}.charge-track view{height:100%;background:linear-gradient(90deg,#79bba9,#e8ba60)}.charge-label{display:block;text-align:center;font-size:13px;color:#557789;margin:10px 0 16px}.tip{margin-top:20px;font-size:13px;line-height:1.8}
</style>
