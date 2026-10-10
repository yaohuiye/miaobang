<template>
  <view class="family-page laboratory">
    <view v-if="!selected">
      <view class="lab-hero"><view><text class="eyebrow">MIAO · DISCOVERY CLUB</text><text class="title">好奇心，开机！</text><text class="intro">13 个小实验。先猜一猜，再让现象告诉你。</text><text class="hero-badge">离线可玩 · 和家长一起发现</text></view><text class="hero-symbol">⚗</text></view>
      <view class="row section-heading"><text>今天想研究什么？</text><text class="muted">{{ Object.keys(notes).length }} / 13 篇发现</text></view>
      <view class="lab-grid"><button v-for="(e,i) in experiments" :key="e.id" class="experiment-card" @click="open(e)"><view class="row"><text class="experiment-icon">{{ e.icon }}</text><text class="experiment-number">{{ String(i+1).padStart(2,'0') }}</text></view><text class="experiment-area">{{ e.area }}</text><text class="experiment-title">{{ e.title }}</text><text class="experiment-question">{{ e.question }}</text><text class="experiment-link">{{ notes[e.id] ? '已有我的发现' : '去试一试' }} →</text></button></view>
    </view>
    <view v-else>
      <button class="back link" @click="close">← 全部实验</button>
      <text class="eyebrow">{{ selected.area }} · 小小研究员</text><text class="title">{{ selected.title }}</text><text class="intro">{{ selected.question }}</text>
      <view v-if="!revealed" class="card prediction"><text class="heading">① 先留下你的猜想</text><text class="muted">猜错也没关系，发现的乐趣就在这里。</text><view class="guess-options"><button v-for="(g,i) in selected.guesses" :key="g" :class="['guess',{chosen:guess===i}]" @click="guess=i">{{ g }}</button></view><button class="primary" :disabled="guess===null" @click="begin">带着猜想去试试 →</button></view>
      <view v-else class="experiment-layout">
        <view class="scene-panel"><view class="scene-caption"><text>② 动手改变，仔细观察</text><text>SIMULATION</text></view><canvas canvas-id="lab-stage" id="lab-stage" :width="canvasWidth" :height="canvasHeight" :style="{width:canvasWidth+'px',height:canvasHeight+'px'}" class="lab-canvas"/><view class="result-strip"><text class="result-dot">●</text><text>{{ result.text }}</text></view><button v-if="animated" class="secondary run" @click="run">{{ timer ? '正在观察…' : '试验一次 ▶' }}</button><button v-if="selected.id==='sound'" class="secondary run" @click="listen">听一秒 ♪</button><text class="model-caption">屏幕上的简化模型 · 一次只改变一个条件更容易看清</text></view>
        <view class="experiment-tools"><view class="card controls"><text class="heading">实验旋钮</text><view v-for="k in selected.knobs" :key="k.key" class="knob"><view class="row"><text>{{ k.label }}</text><text class="knob-value">{{ knobText(k) }}</text></view><slider :min="k.min" :max="k.max" :step="k.step" :value="params[k.key]" activeColor="#278b7a" backgroundColor="#dfede9" :block-size="24" @changing="change(k,$event)" @change="change(k,$event)" :aria-label="k.label"/></view><button class="link" @click="reset">恢复初始条件</button></view>
        <view class="card discovery"><text class="heading">③ 和家长说说你的发现</text><text class="guess-review">我的猜想：{{ selected.guesses[guess] }}</text><text class="muted">{{ selected.explain }}</text><view class="challenge"><text>再试一步</text><text>{{ selected.challenge }}</text></view><textarea v-model="note" @input="saved=false" maxlength="280" class="note" placeholder="我发现……（可以请家长帮忙记）" :auto-height="true"/><button class="primary" @click="save">保存我的发现</button><text v-if="saved" class="saved">已保存在这台设备</text><text class="source">知识依据：{{ selected.id==='moon'?'NASA · 月相':'OpenStax · College Physics 2e' }}</text></view></view>
      </view>
    </view>
    <text v-if="error" class="error">{{ error }}</text>
  </view>
</template>
<script>
import { EXPERIMENTS, defaults, observe, readNotebook, saveNote, LAB_KEY } from '@/lab/experiments.mjs'
import { drawExperiment } from '@/lab/draw.mjs'
export default {
  data(){return {experiments:EXPERIMENTS,selected:null,params:{},guess:null,revealed:false,note:'',notes:{},saved:false,error:'',canvasWidth:300,canvasHeight:180,progress:0,timer:null,resizeTimer:null,audio:null}},
  computed:{result(){return this.selected?observe(this.selected.id,this.params):{text:''}},animated(){return this.selected&&['ramp','friction','parachute'].includes(this.selected.id)}},
  onLoad(){try{this.notes=readNotebook(uni.getStorageSync(LAB_KEY)).notes}catch(e){this.error=e.message}},
  onShow(){if(this.revealed)this.$nextTick(this.measure)},
  onResize(){if(this.revealed)this.$nextTick(this.measure)},
  onHide(){this.stop();clearTimeout(this.resizeTimer);this.stopAudio()},onUnload(){this.stop();clearTimeout(this.resizeTimer);if(this.audio)this.audio.destroy()},
  methods:{
    open(e){this.stop();this.selected=e;this.params=defaults(e);this.guess=null;this.revealed=false;this.note=this.notes[e.id]?this.notes[e.id].text:'';this.saved=false;this.progress=0;uni.pageScrollTo({scrollTop:0,duration:0})},
    close(){this.stop();this.stopAudio();this.selected=null;this.revealed=false},
    begin(){if(this.guess===null)return;this.revealed=true;this.$nextTick(this.measure)},
    measure(){uni.createSelectorQuery().in(this).select('.scene-panel').boundingClientRect(r=>{if(!r||!this.revealed)return;this.canvasWidth=Math.max(180,Math.floor(r.width));this.canvasHeight=Math.round(this.canvasWidth*.6);this.$nextTick(()=>{clearTimeout(this.resizeTimer);this.resizeTimer=setTimeout(this.draw,100)})}).exec()},
    draw(){if(!this.selected||!this.revealed)return;const c=uni.createCanvasContext('lab-stage',this);c.scale(this.canvasWidth/600,this.canvasHeight/360);drawExperiment(c,this.selected,this.params,this.result,this.progress);c.draw()},
    change(k,event){this.stop();this.progress=0;this.params[k.key]=Number(event.detail.value);this.draw()},
    knobText(k){if(this.selected.id==='materials')return this.selected.labels[this.params[k.key]];if(this.selected.id==='sound'&&k.key==='tone')return ['低','中','高'][this.params[k.key]];if(k.max===1)return this.selected.id==='poles'?(this.params[k.key]?'已翻转':'未翻转'):(this.params[k.key]?'已接通':'未接通');return this.params[k.key]+k.unit},
    reset(){this.stop();this.params=defaults(this.selected);this.progress=0;this.draw()},
    run(){this.stop();this.progress=0;const speed=this.result.value;const duration=this.selected.id==='ramp'?2.8/speed:this.selected.id==='friction'?speed:14/speed;const start=Date.now();this.timer=setInterval(()=>{this.progress=Math.min(1,(Date.now()-start)/(Math.max(.6,duration)*1000));this.draw();if(this.progress===1)this.stop()},40)},
    stop(){clearInterval(this.timer);this.timer=null},
    stopAudio(){if(this.audio)this.audio.stop()},
    listen(){this.stopAudio();if(!this.audio){this.audio=uni.createInnerAudioContext();this.audio.onError(()=>{this.error='声音暂时没有播放出来，可以先观察波浪。'})}this.audio.src='/static/lab/tone-'+this.result.value+'.m4a';this.audio.volume=this.params.volume/3;this.audio.play()},
    save(){try{const next=saveNote({get:k=>uni.getStorageSync(k),set:(k,v)=>uni.setStorageSync(k,v)},this.selected.id,this.note,Date.now());this.notes=next.notes;this.saved=true;this.error=''}catch(e){this.error=e.message;this.saved=false}}
  }
}
</script>
<style src="@/styles/family.css"></style>
<style scoped>
.laboratory{background:#f1f7f5}.lab-hero{display:flex;align-items:center;gap:15px;background:#dcefe8;border:1px solid #c3ddd3;padding:24px;border-radius:26px;margin-bottom:28px}.lab-hero>view{flex:1;min-width:0}.lab-hero .eyebrow{color:#49776c}.lab-hero .title{color:#245b51}.hero-symbol{font-size:75px;color:#348b79}.hero-badge{display:inline-block;background:#fff9e8;color:#7c6c3f;padding:7px 12px;border-radius:10px;font-size:12px}.lab-grid{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:14px}.experiment-card{margin:0;width:100%;background:#fff;border:1px solid #d7e7e1;border-bottom:3px solid #c8dfd5;padding:17px;text-align:left;line-height:1.65}.experiment-icon{font-size:30px;color:#328877}.experiment-number{font-size:12px;color:#7b9b90}.experiment-area{display:block;color:#598b7c;font-size:11px;margin-top:14px}.experiment-title{display:block;font-weight:650;font-size:17px;color:#285749;margin:4px 0 8px}.experiment-question{display:block;font-size:12px;color:#607d74;min-height:40px}.experiment-link{display:block;color:#348873;font-size:12px;margin-top:15px}.section-heading{margin-bottom:16px;font-weight:600}.back{margin:0 0 12px;padding:0;text-align:left}.guess-options{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:12px;margin:20px 0}.guess{margin:0;padding:12px;background:#f0f7f4;border:2px solid #e1ebe6;color:#446d60;line-height:1.8}.guess.chosen{border-color:#35967e;background:#dff2e9}.prediction{max-width:650px}.laboratory .primary{background:#278b7a;border-color:#207b6b}.scene-panel{border:1px solid #c9dfd6;border-radius:22px;overflow:hidden;background:#edf6f4;margin-bottom:18px;align-self:start;min-width:0}.scene-caption{display:flex;justify-content:space-between;gap:8px;padding:18px 16px 0;color:#346a5c;font-size:13px}.scene-caption text:last-child{font-size:10px;letter-spacing:1px;color:#6c9489}.lab-canvas{display:block}.result-strip{display:flex;align-items:center;gap:8px;background:#fff9e8;padding:15px;color:#5c6746;font-size:14px;line-height:1.7}.result-dot{color:#d6a949}.run{margin:14px 16px 0;background:#dbede6;color:#2c7967}.model-caption{display:block;text-align:center;font-size:11px;color:#678c7e;line-height:1.8;padding:15px}.knob{font-size:13px;margin:20px 0}.knob-value{color:#278b7a;font-weight:600}.guess-review{display:block;color:#648c7e;font-size:12px;margin-bottom:14px}.challenge{padding:14px;background:#edf5f1;border-radius:13px;margin:16px 0}.challenge text{display:block;color:#4e7569;font-size:13px;line-height:1.8}.challenge text:first-child{font-weight:600;margin-bottom:4px}.note{width:100%;min-height:85px;box-sizing:border-box;padding:14px;border:1px solid #d9e7e0;border-radius:12px;background:#fbfdfc;font-size:14px;margin:14px 0}.saved{display:block;color:#2d8873;font-size:12px;margin-top:10px}.source{display:block;font-size:10px;color:#718b80;margin-top:16px}.experiment-layout{display:block}.experiment-tools{min-width:0}
@media(min-width:768px){.lab-grid{grid-template-columns:repeat(3,minmax(0,1fr))}.lab-hero{padding:32px}.hero-symbol{font-size:100px}.experiment-card{padding:23px}.experiment-question{font-size:14px}.experiment-title{font-size:20px}}
@media(min-width:1000px){.experiment-layout{display:grid;grid-template-columns:minmax(0,1.4fr) minmax(300px,1fr);gap:24px}.scene-panel{position:sticky;top:20px}.lab-grid{grid-template-columns:repeat(4,minmax(0,1fr))}}
@media(max-width:360px){.lab-hero{padding:18px}.hero-symbol{font-size:48px}.experiment-card{padding:12px}.experiment-title{font-size:15px}}
</style>
