<template>
  <view class="family-page laboratory">
    <view v-if="!selected">
      <view class="lab-hero"><view><text class="eyebrow">MIAO · DISCOVERY CLUB</text><text class="title">好奇心，开机！</text><text class="intro">13 个小实验。影子、小船、电路各有 3 级任务，先猜、做对照，再解决新问题。</text><text class="hero-badge">离线可玩 · 和家长一起发现</text></view><image class="hero-symbol" src="/static/ui/activities/lab.png" mode="aspectFit" /></view>
      <view class="card research-progress"><text class="heading">小研究员任务 {{ challengeSummary.completed }} / {{ challengeSummary.total }} 星</text><text class="muted">每个任务首次独立完成记一颗星；写笔记和反复调旋钮不会直接通关。其他实验仍可自由探索。</text></view><view class="row section-heading"><text>今天想研究什么？</text><text class="muted">{{ Object.keys(notes).length }} / 13 篇发现</text></view>
      <view class="lab-grid"><button v-for="(e,i) in experiments" :key="e.id" class="experiment-card" @click="open(e)"><view class="row"><image class="experiment-icon" :src="'/static/ui/activities/'+e.icon+'.png'" mode="aspectFit" /><text class="experiment-number">{{ String(i+1).padStart(2,'0') }}</text></view><text class="experiment-area">{{ e.area }}</text><text class="experiment-title">{{ e.title }}</text><text class="experiment-question">{{ e.question }}</text><text v-if="challengeSummary.byExperiment[e.id] !== undefined" class="task-badge">研究任务 {{ challengeSummary.byExperiment[e.id] }} / 3 ★</text><text class="experiment-link">{{ notes[e.id] ? '已有我的发现' : '去试一试' }} →</text></button></view>
    </view>
    <view v-else>
      <button class="back link" @click="close">← 全部实验</button>
      <text class="eyebrow">{{ selected.area }} · 小小研究员</text><text class="title">{{ selected.title }}</text><text class="intro">{{ selected.question }}</text>
      <view v-if="tasksForSelected.length" class="mode-switch"><button :class="{chosen:experimentMode==='challenge'}" @click="setMode('challenge')">研究任务 · 3 级</button><button :class="{chosen:experimentMode==='free'}" @click="setMode('free')">自由探索</button></view>
      <view v-if="task" class="card mission"><text class="eyebrow">第 {{ task.level }} 级 · {{ task.type==='compare'?'对照实验':task.type==='transfer'?'迁移挑战':'达成目标' }}</text><text class="heading">{{ task.title }}</text><text class="mission-instruction">{{ task.instruction }}</text><view class="task-tabs"><button v-for="item in tasksForSelected" :key="item.id" :class="{chosen:taskId===item.id}" @click="selectTask(item.id)">{{ item.level }} {{ labProgress.completed[item.id] ? '★' : '☆' }}</button></view><text class="muted">目标：{{ task.target }}</text><text v-if="labProgress.completed[task.id]" class="saved">这颗星已收藏，重玩不会重复增加。</text></view>
      <view v-if="!revealed" class="card prediction"><text class="heading">① {{ task && task.type==='transfer' ? '先预测，再动手检验' : '先留下你的猜想' }}</text><text class="muted">猜错也没关系，发现的乐趣就在这里。</text><view class="guess-options"><button v-for="(g,i) in predictionChoices" :key="g" :class="['guess',{chosen:guess===i}]" @click="guess=i">{{ g }}</button></view><button class="primary" :disabled="guess===null" @click="begin">带着猜想去试试 →</button></view>
      <view v-else class="experiment-layout">
        <view class="scene-panel"><view class="scene-caption"><text>② 动手改变，仔细观察</text><text>SIMULATION</text></view><canvas canvas-id="lab-stage" id="lab-stage" :width="canvasWidth" :height="canvasHeight" :style="{width:canvasWidth+'px',height:canvasHeight+'px'}" class="lab-canvas"/><view class="result-strip"><text class="result-dot">●</text><text>{{ result.text }}</text></view><button v-if="animated" class="secondary run" @click="run">{{ timer ? '正在观察…' : '试验一次 ▶' }}</button><button v-if="selected.id==='sound'" class="secondary run" @click="listen">听一秒 ♪</button><text class="model-caption">屏幕上的简化模型 · 一次只改变一个条件更容易看清</text></view>
        <view class="experiment-tools"><view class="card controls"><text class="heading">实验旋钮</text><view v-for="k in selected.knobs" :key="k.key" class="knob"><view class="row"><text>{{ k.label }}</text><text class="knob-value">{{ knobText(k) }}</text></view><slider :min="k.min" :max="k.max" :step="k.step" :value="params[k.key]" activeColor="#278b7a" backgroundColor="#dfede9" :block-size="24" @changing="change(k,$event)" @change="change(k,$event)" :aria-label="k.label"/></view><button class="link" @click="reset">恢复初始条件</button></view>
        <view v-if="task" class="card task-records"><text class="heading">③ 留下实验记录</text><text class="muted">{{ task.type==='compare' ? '对照任务需要两次实际记录，并且只改变一个条件。' : '调整后按下面的按钮，保存这一次的条件和观察结果。' }}</text><view v-for="(record,i) in observations" :key="i" class="observation"><text class="record-title">记录 {{ i+1 }} · {{ parameterText(record.params) }}</text><text>{{ observationText(record) }}</text></view><view v-if="task.type==='transfer' && observations.length" class="conclusion"><text class="heading">我的结论</text><text class="muted">{{ task.conclusionPrompt }}</text><text class="muted">先前猜错也没关系，可以根据证据修正想法。</text><view class="guess-options"><button v-for="(item,i) in task.conclusions" :key="item" :class="['guess',{chosen:conclusion===i}]" :disabled="taskPassed" @click="conclusion=i">{{ item }}</button></view></view><view v-if="!taskPassed" class="record-actions"><button class="secondary" @click="captureCurrent">记录当前条件（{{ observations.length }} / {{ task.type==='compare'?2:1 }}）</button><button v-if="observations.length" class="link" @click="clearObservations">清空记录，重新比较</button><button class="primary" :disabled="observations.length < (task.type==='compare'?2:1)" @click="checkTask">检查任务</button></view><text v-if="taskFeedback" class="task-feedback">{{ taskFeedback }}</text><text v-if="taskPassed" class="saved">{{ earnedStar ? '★ 首次独立完成，星星已保存在本机' : usedHelp ? '已借助说明完成，本次不增加独立星星' : '本次任务练习已完成' }}</text><button v-if="taskPassed" class="secondary" @click="nextTask">{{ task.level < 3 ? '下一项研究 →' : '继续自由探索 →' }}</button><button v-if="taskPassed && !earnedStar && !labProgress.completed[task.id]" class="link" @click="selectTask(task.id)">重新独立挑战</button></view>
        <view class="card discovery"><text class="heading">{{ task ? '④' : '③' }} 和家长说说你的发现</text><text class="guess-review">我的猜想：{{ predictionChoices[guess] }}</text><button v-if="task && !taskPassed && !showExplanation" class="link" @click="learnExplanation">先看学习说明（本次不计独立星）</button><text v-if="!task || taskPassed || showExplanation" class="muted">{{ selected.explain }}</text><text v-else class="muted">先用记录检验猜想，完成本任务后再一起读规律。也可以主动打开学习说明。</text><view v-if="!task || taskPassed || showExplanation" class="challenge"><text>再试一步</text><text>{{ selected.challenge }}</text></view><textarea v-model="note" @input="saved=false" maxlength="280" class="note" placeholder="我发现……（可以请家长帮忙记）" :auto-height="true"/><button class="primary" @click="save">保存我的发现</button><text v-if="saved" class="saved">已保存在这台设备</text><text class="source">知识依据：{{ selected.id==='moon'?'NASA · 月相':'OpenStax · College Physics 2e' }}</text></view></view>
      </view>
    </view>
    <text v-if="error" class="error">{{ error }}</text>
  </view>
</template>
<script>
import { EXPERIMENTS, defaults, observe, readNotebook, saveNote, LAB_KEY } from '@/lab/experiments.mjs'
import { LAB_TASKS, readLabChallenges, summarizeLabChallenges, captureLabObservation, evaluateLabTask, createLabChallengeStore } from '@/lab/challenges.mjs'
import { drawExperiment } from '@/lab/draw.mjs'
export default {
  data(){return {experiments:EXPERIMENTS,selected:null,params:{},guess:null,revealed:false,note:'',notes:{},saved:false,error:'',canvasWidth:300,canvasHeight:180,progress:0,timer:null,resizeTimer:null,audio:null,experimentMode:'free',taskId:'',labProgress:{version:1,completed:{}},observations:[],taskPassed:false,taskFeedback:'',usedHelp:false,showExplanation:false,earnedStar:false,conclusion:null}},
  computed:{challengeSummary(){return summarizeLabChallenges(this.labProgress)},tasksForSelected(){return LAB_TASKS.filter(task=>task.experiment===this.selected?.id)},task(){return this.experimentMode==='challenge'?LAB_TASKS.find(task=>task.id===this.taskId):null},predictionChoices(){return this.task?.predictions||this.selected.guesses},result(){return this.selected?observe(this.selected.id,this.params):{text:''}},animated(){return this.selected&&['ramp','friction','parachute'].includes(this.selected.id)}},
  onLoad(){const errors=[];try{this.notes=readNotebook(uni.getStorageSync(LAB_KEY)).notes}catch(e){errors.push(e.message)}try{this.labProgress=this.challengeStore().read()}catch(e){errors.push(e.message)}this.error=errors.join(' ')} ,
  onShow(){if(this.revealed)this.$nextTick(this.measure)},
  onResize(){if(this.revealed)this.$nextTick(this.measure)},
  onHide(){this.stop();clearTimeout(this.resizeTimer);this.stopAudio()},onUnload(){this.stop();clearTimeout(this.resizeTimer);if(this.audio)this.audio.destroy()},
  methods:{
    challengeStore(){return createLabChallengeStore({get:key=>uni.getStorageSync(key),set:(key,value)=>uni.setStorageSync(key,value)})},
    setMode(mode){
      this.stop();clearTimeout(this.resizeTimer);this.stopAudio();this.experimentMode=mode;this.guess=null;this.revealed=false;this.progress=0
      this.observations=[];this.taskPassed=false;this.taskFeedback='';this.usedHelp=false;this.showExplanation=false;this.earnedStar=false;this.conclusion=null
      if(mode==='challenge'){
        const available=LAB_TASKS.filter(task=>task.experiment===this.selected.id)
        const next=available.find(task=>!this.labProgress.completed[task.id])||available[0]
        if(next)this.selectTask(next.id)
      }else{this.taskId='';this.params=defaults(this.selected)}
    },
    selectTask(id){
      const task=LAB_TASKS.find(item=>item.id===id&&item.experiment===this.selected.id)
      if(!task)return
      this.stop();clearTimeout(this.resizeTimer);this.stopAudio();this.experimentMode='challenge';this.taskId=id;this.params={...task.initial};this.progress=0;this.guess=null;this.revealed=false;this.observations=[];this.taskPassed=false;this.taskFeedback='';this.usedHelp=false;this.showExplanation=false;this.earnedStar=false;this.conclusion=null
    },
    captureCurrent(){
      if(!this.task||!this.revealed||this.taskPassed)return
      try{const record=captureLabObservation(this.task.id,this.params);const needed=this.task.type==='compare'?2:1;this.observations=[...this.observations,record].slice(-needed);this.taskFeedback=needed===2&&this.observations.length===1?'第一条记录已留下，只改变任务指定的一个条件，再按一次记录。':'观察已记录，可以检查任务。'}catch(error){this.error=error.message}
    },
    clearObservations(){this.observations=[];this.taskFeedback='记录已清空，可以重新做一次对照。'},
    parameterText(params){return this.selected.knobs.map(knob=>knob.label+' '+params[knob.key]+knob.unit).join(' / ')},
    observationText(record){return observe(this.selected.id,record.params).text},
    checkTask(){
      if(!this.task||!this.revealed)return
      try{
        const options={prediction:this.guess,conclusion:this.conclusion,assisted:this.usedHelp}
        const result=evaluateLabTask(this.task.id,this.observations,options)
        this.taskFeedback=result.feedback
        if(!result.passed)return
        if(!result.independent){this.taskPassed=true;return}
        const already=!!this.challengeStore().read().completed[this.task.id]
        this.labProgress=this.challengeStore().complete(this.task.id,this.observations,options)
        this.earnedStar=!already;this.taskPassed=true;this.error=''
        if(already)this.taskFeedback='再次独立完成了！这颗星已经收藏，重玩不重复增加。'
      }catch(error){this.taskPassed=false;this.earnedStar=false;this.error=error.message+' 条件和观察仍留在这里，可以再次点“检查任务”重试保存。'}
    },
    learnExplanation(){this.usedHelp=true;this.showExplanation=true;this.taskFeedback='这次借助说明学习，完成后不增加独立星。理解后可重新发起独立挑战。'},
    nextTask(){const next=this.tasksForSelected.find(item=>item.level>this.task.level);if(next)this.selectTask(next.id);else this.setMode('free')},
    open(e){this.stop();this.stopAudio();this.selected=e;this.params=defaults(e);this.guess=null;this.revealed=false;this.note=this.notes[e.id]?this.notes[e.id].text:'';this.saved=false;this.progress=0;this.setMode(LAB_TASKS.some(task=>task.experiment===e.id)?'challenge':'free');uni.pageScrollTo({scrollTop:0,duration:0})},
    close(){this.stop();clearTimeout(this.resizeTimer);this.stopAudio();this.selected=null;this.revealed=false},
    begin(){if(this.guess===null)return;this.revealed=true;this.$nextTick(this.measure)},
    measure(){uni.createSelectorQuery().in(this).select('.scene-panel').boundingClientRect(r=>{if(!r||!this.revealed)return;this.canvasWidth=Math.max(180,Math.floor(r.width));this.canvasHeight=Math.round(this.canvasWidth*.6);this.$nextTick(()=>{clearTimeout(this.resizeTimer);this.resizeTimer=setTimeout(this.draw,100)})}).exec()},
    draw(){if(!this.selected||!this.revealed)return;const c=uni.createCanvasContext('lab-stage',this);c.scale(this.canvasWidth/600,this.canvasHeight/360);drawExperiment(c,this.selected,this.params,this.result,this.progress);c.draw()},
    change(k,event){this.stop();this.progress=0;this.params[k.key]=Number(event.detail.value);this.draw()},
    knobText(k){if(this.selected.id==='materials')return this.selected.labels[this.params[k.key]];if(this.selected.id==='sound'&&k.key==='tone')return ['低','中','高'][this.params[k.key]];if(k.max===1)return this.selected.id==='poles'?(this.params[k.key]?'已翻转':'未翻转'):(this.params[k.key]?'已接通':'未接通');return this.params[k.key]+k.unit},
    reset(){this.stop();this.params=this.task?{...this.task.initial}:defaults(this.selected);this.progress=0;this.draw()},
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
.laboratory{background:#f1f7f5}.lab-hero{display:flex;align-items:center;gap:15px;background:#dcefe8;border:1px solid #c3ddd3;padding:24px;border-radius:26px;margin-bottom:28px}.lab-hero>view{flex:1;min-width:0}.lab-hero .eyebrow{color:#49776c}.lab-hero .title{color:#245b51}.hero-symbol{flex-shrink:0;width:75px;height:75px}.hero-badge{display:inline-block;background:#fff9e8;color:#7c6c3f;padding:7px 12px;border-radius:10px;font-size:12px}.lab-grid{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:14px}.experiment-card{margin:0;width:100%;background:#fff;border:1px solid #d7e7e1;border-bottom:3px solid #c8dfd5;padding:17px;text-align:left;line-height:1.65}.experiment-icon{width:44px;height:44px}.experiment-number{font-size:12px;color:#7b9b90}.experiment-area{display:block;color:#598b7c;font-size:11px;margin-top:14px}.experiment-title{display:block;font-weight:650;font-size:17px;color:#285749;margin:4px 0 8px}.experiment-question{display:block;font-size:12px;color:#607d74;min-height:40px}.experiment-link{display:block;color:#348873;font-size:12px;margin-top:15px}.section-heading{margin-bottom:16px;font-weight:600}.back{margin:0 0 12px;padding:0;text-align:left}.guess-options{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:12px;margin:20px 0}.guess{margin:0;padding:12px;background:#f0f7f4;border:2px solid #e1ebe6;color:#446d60;line-height:1.8}.guess.chosen{border-color:#35967e;background:#dff2e9}.prediction{max-width:650px}.laboratory .primary{background:#278b7a;border-color:#207b6b}.scene-panel{border:1px solid #c9dfd6;border-radius:22px;overflow:hidden;background:#edf6f4;margin-bottom:18px;align-self:start;min-width:0}.scene-caption{display:flex;justify-content:space-between;gap:8px;padding:18px 16px 0;color:#346a5c;font-size:13px}.scene-caption text:last-child{font-size:10px;letter-spacing:1px;color:#6c9489}.lab-canvas{display:block}.result-strip{display:flex;align-items:center;gap:8px;background:#fff9e8;padding:15px;color:#5c6746;font-size:14px;line-height:1.7}.result-dot{color:#d6a949}.run{margin:14px 16px 0;background:#dbede6;color:#2c7967}.model-caption{display:block;text-align:center;font-size:11px;color:#678c7e;line-height:1.8;padding:15px}.knob{font-size:13px;margin:20px 0}.knob-value{color:#278b7a;font-weight:600}.guess-review{display:block;color:#648c7e;font-size:12px;margin-bottom:14px}.challenge{padding:14px;background:#edf5f1;border-radius:13px;margin:16px 0}.challenge text{display:block;color:#4e7569;font-size:13px;line-height:1.8}.challenge text:first-child{font-weight:600;margin-bottom:4px}.note{width:100%;min-height:85px;box-sizing:border-box;padding:14px;border:1px solid #d9e7e0;border-radius:12px;background:#fbfdfc;font-size:14px;margin:14px 0}.saved{display:block;color:#2d8873;font-size:12px;margin-top:10px}.source{display:block;font-size:10px;color:#718b80;margin-top:16px}.experiment-layout{display:block}.experiment-tools{min-width:0}
.research-progress .muted{display:block;margin-top:12px;font-size:13px;line-height:1.8}.task-badge{display:inline-block;margin-top:12px;padding:3px 7px;border-radius:8px;background:#fff7de;color:#8b6b27;font-size:11px}.mode-switch{display:flex;gap:10px;margin:18px 0}.mode-switch button{flex:1;margin:0;background:#e3efe9;color:#387361;font-size:13px}.mode-switch .chosen,.task-tabs .chosen{background:#278b7a;color:#fff}.mission{border:1px solid #bad8ca;background:#fafffc}.mission-instruction{display:block;color:#3d6b59;line-height:1.9;margin-top:14px;font-size:15px}.task-tabs{display:flex;gap:8px;margin:16px 0}.task-tabs button{flex:1;margin:0;padding:4px 8px;font-size:13px;background:#e8f3ee;color:#4a7c67;line-height:36px}.mission .muted,.task-records>.muted{display:block;line-height:1.8;font-size:13px}.observation{display:flex;flex-direction:column;gap:6px;margin-top:14px;padding:12px;background:#f1f8f4;border:1px solid #d2e5d9;border-radius:12px;font-size:13px;line-height:1.8;color:#436e58}.record-title{font-weight:600}.record-actions{margin-top:16px}.record-actions .secondary,.task-records>.secondary{margin-top:12px}.task-feedback{display:block;color:#765f28;font-size:13px;line-height:1.9;margin-top:16px}.task-records .saved{font-size:13px;line-height:1.8;margin:14px 0}
@media(min-width:768px){.lab-grid{grid-template-columns:repeat(3,minmax(0,1fr))}.lab-hero{padding:32px}.hero-symbol{width:100px;height:100px}.experiment-card{padding:23px}.experiment-question{font-size:14px}.experiment-title{font-size:20px}}
@media(min-width:1000px){.experiment-layout{display:grid;grid-template-columns:minmax(0,1.4fr) minmax(300px,1fr);gap:24px}.scene-panel{position:sticky;top:20px}.lab-grid{grid-template-columns:repeat(4,minmax(0,1fr))}}
@media(max-width:360px){.lab-hero{padding:18px}.hero-symbol{width:48px;height:48px}.experiment-card{padding:12px}.experiment-title{font-size:15px}}
</style>
