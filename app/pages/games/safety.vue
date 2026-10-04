<template>
  <view class="family-page safety-game">
    <text class="eyebrow">亲子情境小游戏 · 在家练一练</text><text class="title">安全小侦探</text><text class="intro">帮小妙停一停、看一看，再作决定。<br />真实出行时收起手机，由家长陪同观察。</text>
    <text v-if="error" class="error">{{ error }}</text><button v-if="pending.length && !finished" class="secondary" @click="retryPending">重试保存看过标记</button>
    <template v-if="!scene && !finished"><view class="card welcome"><image src="/static/puzzle/robot-miao.png" mode="aspectFit" /><text class="heading">今天一起发现什么？</text><text class="muted">8 个小故事，想从哪个开始都可以。<br />每次只聊一个，也是一点新发现。</text><button class="primary" @click="startRound">随机玩 3 个故事</button></view><view class="scene-grid"><button v-for="item in scenes" :key="item.id" @click="startOne(item.id)"><image class="scene-art" :src="'/static/ui/scene-'+item.id+'.png'" mode="aspectFit" /><text>{{ item.title }}</text><text class="muted">{{ seen.includes(item.id) ? '看过 · 可以再聊' : item.place }}</text></button></view></template>
    <template v-else-if="scene && !finished"><view class="row"><text class="pill">{{ scene.place }}</text><text class="muted">{{ cursor+1 }} / {{ ids.length }}</text></view><view class="card story"><image class="story-art" :src="'/static/ui/scene-'+scene.id+'.png'" mode="aspectFit" /><text class="heading">{{ scene.title }}</text><text class="scene-text">{{ scene.scene }}</text></view><text class="heading">你会帮小妙怎样做？</text><button v-for="option in options" :key="option.id" :class="['option',{selected:picked===option.id,safe:picked&&option.id===scene.answer}]" :disabled="!!picked" @click="choose(option.id)">{{ option.text }}<text v-if="picked && option.id===scene.answer"> ✓</text></button>
      <view v-if="picked" class="card explanation"><text class="heading">{{ picked===scene.answer ? '这个选择照顾到了安全' : '先停住，一起换个办法' }}</text><text class="scene-text">{{ scene.why }}</text><view class="reminder">记住这句：{{ scene.reminder }}</view><text class="heading talk-heading">和家长说一说</text><text class="scene-text">{{ scene.talk }}</text><text class="muted">选对不等于已经养成习惯，实际出行还要一起练。</text><button class="primary next" @click="next">{{ cursor===ids.length-1 ? '聊完这一轮' : '下一个故事' }}</button><button class="link" @click="showSources=!showSources">{{ showSources ? '收起依据' : '看看安全依据' }}</button><template v-if="showSources"><button v-for="source in currentSources" :key="source.url" class="source-link" @click="copySource(source)">{{ source.title }} · 复制链接</button><text class="muted">情境和问答为原创；链接仅供家长查阅。</text></template></view><button class="link" @click="returnToList">先到这里，回故事列表</button></template>
    <view v-else class="card finish"><text class="finish-icon">✦</text><text class="heading">一起聊过 {{ ids.length }} 个故事</text><view v-for="id in ids" :key="id" class="takeaway"><text class="scene-text">{{ byId[id].reminder }}</text><text v-if="discuss.includes(id)" class="muted">值得下次再聊一聊</text></view><text v-if="pending.length" class="error">还有 {{ pending.length }} 个“看过”标记未保存。</text><button v-if="pending.length" class="secondary" @click="retryPending">重试保存</button><text class="muted">出门前选一句约定，回家再聊一次具体经历。</text><button class="primary" @click="garden">去成长小花园记一件小事</button><button class="link" @click="returnToList">回到故事列表</button></view>
  </view>
</template>
<script>
import { safetyScenes, SAFETY_SOURCES } from '@/data/safety-scenes.mjs'
import { shuffle } from '@/knowledge/model.mjs'
import { familyGameStore } from '@/services/family.js'
export default {
  data() { return { scenes:safetyScenes, byId:Object.fromEntries(safetyScenes.map(scene=>[scene.id,scene])), ids:[], cursor:0, options:[], picked:'', finished:false, seen:[], discuss:[], pending:[], error:'', showSources:false } },
  computed: { scene() { return this.byId[this.ids[this.cursor]] }, currentSources() { return this.scene?.sources.map(index=>SAFETY_SOURCES[index]) || [] } },
  onLoad() { try { this.seen=familyGameStore.read().scenes } catch(error) { this.error=error.message } },
  methods: {
    begin(ids) { this.ids=ids; this.cursor=0; this.finished=false; this.discuss=[]; this.prepare() },
    startRound() { this.begin(shuffle(this.scenes.map(scene=>scene.id)).slice(0,3)) },
    startOne(id) { this.begin([id]) },
    prepare() { this.options=shuffle(this.scene.options); this.picked=''; this.showSources=false; uni.pageScrollTo({scrollTop:0,duration:0}) },
    choose(id) { if(this.picked || !this.scene.options.some(option=>option.id===id)) return; this.picked=id; if(id!==this.scene.answer) this.discuss.push(this.scene.id); this.saveSeen() },
    persist(id) { try { this.seen=familyGameStore.mark('scenes',id).scenes; this.pending=this.pending.filter(value=>value!==id); this.error=this.pending.length ? '还有故事标记未保存，本轮结束后可重试。' : ''; return true } catch(error) { if(!this.pending.includes(id)) this.pending.push(id); this.error='看过标记暂时没能保存，可以继续聊，本轮结束时可重试。'; return false } },
    saveSeen() { if(this.picked) this.persist(this.scene.id) },
    retryPending() { for(const id of [...this.pending]) this.persist(id) },
    next() { if(!this.picked || this.finished) return; if(this.cursor===this.ids.length-1) { this.finished=true } else { this.cursor++; this.prepare() }; uni.pageScrollTo({scrollTop:0,duration:0}) },
    returnToList() { this.ids=[]; this.finished=false; uni.pageScrollTo({scrollTop:0,duration:0}) },
    garden() { uni.navigateTo({url:'/pages/growth/index'}) },
    copySource(source) { uni.setClipboardData({data:source.url}) }
  }
}
</script>
<style src="@/styles/family.css"></style>
<style scoped>
.welcome { text-align:center; }.welcome image { width:75px; height:90px; }.welcome .primary { margin-top:20px; }.scene-grid { display:grid; grid-template-columns:repeat(2,1fr); gap:12px; }.scene-grid button { width:100%; padding:15px 9px; margin:0; font-size:13px; color:#436889; background:#fff; line-height:1.8; border:1px solid #dce8f4; border-bottom-width:3px; }.scene-art { display:block; width:100%; height:74px; margin-bottom:12px; border-radius:10px; }.story-art { display:block; width:100%; height:125px; margin:0 0 16px; border-radius:12px; }
.scene-icon { display:block; font-size:38px; margin-bottom:10px; }.scene-grid .muted { font-size:12px; margin-top:8px; }.story { margin:18px 0; background:#fff8e8; text-align:center; }.scene-text { display:block; font-size:15px; line-height:1.9; white-space:pre-wrap; }.option { width:100%; white-space:normal; text-align:left; padding:15px; margin:12px 0; background:#fff; color:#486b94; border:2px solid #e0eaf5; font-size:14px; line-height:1.8; }.option[disabled] { opacity:1; color:#5b6877; }.option.selected { border-color:#94b3d7; }.option.safe { background:#eaf6ee; border-color:#77b59a; color:#377b64; }.explanation { margin-top:23px; }.reminder { background:#e8f1ff; color:#3f6da3; font-weight:600; font-size:15px; line-height:1.8; border-radius:12px; padding:12px; margin:18px 0; }.talk-heading { margin-top:20px; }.explanation .muted { margin-top:15px; font-size:12px; }.next { margin-top:20px; }.source-link { display:block; width:100%; padding:7px; background:#f0f5fb; color:#4f6781; font-size:12px; line-height:1.8; margin:8px 0; text-align:left; }.finish { text-align:center; }.finish-icon { display:block; color:#816533; font-size:55px; margin-bottom:12px; }.takeaway { margin:18px 0; padding:10px; border-radius:12px; background:#edf4fd; }.finish .primary { margin-top:20px; font-size:12px; }
</style>
