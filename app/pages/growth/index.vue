<template>
  <view class="family-page garden">
    <text class="eyebrow">亲子一起 · 留下尝试的痕迹</text><text class="title">成长小花园</text>
    <view class="garden-top"><image src="/static/ui/flower.png" mode="aspectFit" /><view><text class="heading">{{ flowers }} 朵小红花</text><text class="muted">每一朵，都记着一件具体的小事。</text></view></view>
    <text class="intro">孩子说，家长代写。只记一件也很好。</text>
    <text v-if="error" class="error">{{ error }}</text><button v-if="error" class="secondary" @click="retrySave">{{ loaded ? '重试保存这次回顾' : '重新读取记录' }}</button>
    <view v-if="loaded" class="card review-form"><view class="row"><text class="heading">{{ date }}</text><text class="save-state">{{ dirty ? '还未保存' : days[date] ? '已保存在本机' : '填写后自动保存' }}</text></view>
      <view v-for="field in fields.slice(0,1)" :key="field.key" class="field"><text class="field-label">{{ field.label }}</text><textarea :value="draft[field.key]" :maxlength="160" :placeholder="field.placeholder" :aria-label="field.label" @input="change(field.key, $event.detail.value)" /><text class="count">{{ draft[field.key].length }}/160 · 可留空</text></view>
      <view class="flower-box"><template v-if="record.flowerReason"><image src="/static/ui/flower.png" mode="aspectFit" /><text class="heading">这朵花，送给这次尝试</text><text class="flower-reason">{{ record.flowerReason }}</text><text class="muted">今天已经留过一朵，不会重复累计。</text></template><template v-else><text class="heading">家长留一朵鼓励花</text><text class="muted">为今天的具体尝试留一朵花，每天一朵。</text><button class="primary award" @click="award">留一朵鼓励花</button></template></view>
      <button class="reflection-toggle" :aria-expanded="showReflection" @click="showReflection = !showReflection">{{ showReflection ? '收起其他回顾 −' : '还想聊聊下次的办法？ ＋' }}</button>
      <text v-if="!showReflection" class="muted optional-note">{{ hasReflection ? '其他回顾已保存，展开可以查看和修改。' : '想重新试试的事、下次办法、家长回应，都可以展开再写。' }}</text>
      <view v-if="showReflection" class="optional-fields">
      <view v-for="field in fields.slice(1)" :key="field.key" class="field"><text class="field-label">{{ field.label }}</text><textarea :value="draft[field.key]" :maxlength="160" :placeholder="field.placeholder" :aria-label="field.label" @input="change(field.key, $event.detail.value)" /><text class="count">{{ draft[field.key].length }}/160 · 可留空</text></view>
      </view>
    </view>
    <text class="heading history-heading">看看以前的小事</text><text v-if="!past.length" class="muted">过去的回顾会出现在这里。不连续记录也没关系。</text>
    <button v-for="item in past.slice(0,limit)" :key="item.date" class="memory" @click="opened = opened === item.date ? '' : item.date"><view class="row"><text>{{ item.date }}</text><text>{{ item.flowerReason ? '一朵鼓励花' : '小回顾' }} {{ opened === item.date ? '−' : '＋' }}</text></view><template v-if="opened === item.date"><text v-for="field in fields.filter(field => item[field.key])" :key="field.key" class="memory-text">{{ field.label }}：{{ item[field.key] }}</text><text v-if="item.flowerReason" class="memory-text">小红花记着：{{ item.flowerReason }}</text></template></button>
    <button v-if="past.length > limit" class="secondary" @click="limit += 20">再看 20 条</button>
    <text class="muted footer">没有扣花，也没有连续打卡要求。游戏随时可以玩。<br />文字仅保存在本机，卸载或清除数据会丢失。</text>
  </view>
</template>
<script>
import { dayKey, emptyDay } from '@/growth/model.mjs'
import { gardenStore } from '@/services/family.js'
export default {
  data() { return { date:dayKey(), draft:emptyDay(), days:{}, loaded:false, dirty:false, pendingFlower:false, showReflection:false, error:'', opened:'', limit:20, fields:[
    {key:'good',label:'今天的一件好事',placeholder:'例如：提醒后，我停下来看路了。'},
    {key:'retry',label:'有件事想重新试试',placeholder:'例如：公交车开动时，我还在和朋友打闹。'},
    {key:'next',label:'下次的小办法',placeholder:'例如：上车后，先坐稳或握好扶手。'},
    {key:'parent',label:'家长也说一句',placeholder:'例如：下次我会提前提醒，不等着急了才喊。'}
  ] } },
  computed: {
    hasReflection() { return ['retry','next','parent'].some(key=>this.draft[key].trim()) },
    record() { return this.days[this.date] || emptyDay() },
    flowers() { return Object.values(this.days).filter(day=>day.flowerReason).length },
    past() { return Object.entries(this.days).filter(([date])=>date!==this.date).sort(([a],[b])=>b.localeCompare(a)).map(([date,day])=>({date,...day})) }
  },
  onLoad() { this.load() },
  onShow() { if (this.loaded && !this.dirty && dayKey() !== this.date) { this.date=dayKey(); this.load() } },
  onBackPress() { if (!this.dirty) return false; uni.showModal({ title:'还有回顾没保存', content:'可以留在这里重试保存，或放弃本次未保存的修改。', confirmText:'留下重试', cancelText:'放弃离开', success:result=>{ if(result.cancel) { this.dirty=false; uni.navigateBack({fail:()=>uni.switchTab({url:'/pages/home/index'})}) } } }); return true },
  methods: {
    load() { try { this.days=gardenStore.read().days; this.draft={...(this.days[this.date] || emptyDay())}; this.loaded=true; this.dirty=false; this.pendingFlower=false; this.showReflection=this.hasReflection; this.error='' } catch(error) { this.error='暂时无法读取成长记录，请保留原数据后重试。' } },
    change(key,value) { this.draft[key]=value; this.dirty=true; this.save() },
    save(flower=false) { this.pendingFlower=this.pendingFlower || flower; try { this.days=gardenStore.save(this.date,this.draft,this.pendingFlower).days; this.dirty=false; this.pendingFlower=false; this.error='' } catch(error) { this.dirty=true; this.error='这次回顾或小红花还没保存，文字仍在本页，请先重试再离开。' } },
    award() { if (this.record.flowerReason) return; if(!this.draft.good.trim()) { this.error='先在第一项记下一件值得鼓励的具体尝试，再留一朵花。'; return }; this.save(true) },
    retrySave() { if(this.loaded) this.save(); else this.load() }
  }
}
</script>
<style src="@/styles/family.css"></style>
<style scoped>
.garden-top { display:flex; align-items:center; gap:12px; margin:16px 0; padding:12px; background:#ffedf0; border-radius:20px; }.garden-top image { width:44px; height:52px; flex-shrink:0; }.garden-top .muted { font-size:13px; }.garden > .intro { font-size:14px; line-height:1.7; margin:12px 0 16px; }.garden-top .heading { margin-bottom:5px; color:#945165; }.review-form .row { align-items:flex-start; flex-wrap:wrap; gap:4px; }.review-form .heading { font-size:14px; }.save-state { flex-shrink:0; font-size:12px; color:#566d61; }.field { margin:16px 0; }.field-label { display:block; font-size:14px; font-weight:600; margin-bottom:10px; }.field textarea { box-sizing:border-box; width:100%; height:92px; border:1px solid #dbe6f5; border-radius:12px; background:#f7faff; padding:12px; color:#29496e; font-size:15px; line-height:1.7; }.count { display:block; text-align:right; margin:5px 0; color:#5a6777; font-size:12px; }.flower-box { background:#fff4f6; border-radius:14px; padding:14px; text-align:left; }.flower-box image { width:50px; height:60px; }.flower-reason { display:block; white-space:pre-wrap; overflow-wrap:anywhere; font-size:15px; line-height:1.8; margin:10px 0; color:#905469; }.flower-box .award { margin-top:18px; background:#ac476d; border-color:#8b3153; font-size:13px; }.reflection-toggle { width:100%; margin:18px 0 6px; padding:6px 10px; text-align:left; color:#365f88; background:#edf4ff; font-size:14px; }.optional-note { font-size:12px; }.optional-fields { border-top:1px solid #e0e9f3; margin-top:15px; }.history-heading { margin-top:25px; }.memory { width:100%; background:#fff; padding:15px; margin:12px 0; color:#4d6a8a; text-align:left; font-size:13px; line-height:1.8; border:1px solid #dee8f6; }.memory-text { display:block; white-space:pre-wrap; overflow-wrap:anywhere; margin-top:12px; }.footer { font-size:12px; text-align:center; margin-top:30px; }
</style>
