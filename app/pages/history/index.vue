<template>
  <view class="family-page">
    <text class="eyebrow">妙帮 · 留在这部手机里的记录</text>
    <text class="title">一起做过的小事</text>
    <text class="intro">记录尝试，也记录需要休息的时候。<br />计时只是运行时长，不代表注意力水平。</text>
    <button class="secondary garden-link" @click="garden">看看成长小花园与亲子回顾</button>
    <text v-if="error" class="error">{{ error }}</text>
    <button v-if="error" class="secondary" @click="refresh">重新读取</button>
    <view v-if="active" class="card current"><text class="heading">还有一轮等着你们</text><text class="muted">{{ active.task }} · {{ phaseLabels[active.phase] }}</text><button class="secondary" @click="focus">回到当前任务</button></view>
    <view v-if="loaded && !records.length" class="card empty"><text class="empty-icon">◷</text><text class="heading">第一条记录，从一小项开始</text><text class="muted">计时结束并确认结果后，就会出现在这里。</text><button class="primary" @click="focus">{{ active ? '回到这一小项' : '约定一项小任务' }}</button></view>
    <view v-for="record in records" :key="record.id" class="card record"><view class="row"><text class="muted">{{ date(record.startedAt) }}</text><text class="pill" :class="record.result">{{ labels[record.result] }}</text></view><text class="record-task">{{ record.task }}</text><text class="muted">计时 {{ elapsed(record.elapsedMs) }} · 约定 {{ record.plannedMs / 60000 }} 分钟</text><text v-if="record.reason === 'interrupted'" class="muted">中断后的未知时长未补算</text></view>
  </view>
</template>
<script>
import { focusService } from '@/services/focus.js'
import { RESULT_LABELS, PHASE_LABELS, elapsedText } from '@/focus/model.mjs'
export default {
  data() { return { active: null, records: [], labels: RESULT_LABELS, phaseLabels: PHASE_LABELS, error: '', loaded: false } },
  onShow() { this.refresh() },
  methods: {
    refresh() { try { const { state } = focusService.snapshot(); this.active = state.active; this.records = state.history; this.loaded = true; this.error = '' } catch (error) { this.error = error.message } },
    date(value) { const date = new Date(value); return `${date.getFullYear()}年${date.getMonth() + 1}月${date.getDate()}日 ${String(date.getHours()).padStart(2, '0')}:${String(date.getMinutes()).padStart(2, '0')}` },
    elapsed: elapsedText,
    garden() { uni.navigateTo({url:'/pages/growth/index'}) },
    focus() { uni.navigateTo({ url: '/pages/focus/timer' }) }
  }
}
</script>
<style src="@/styles/family.css"></style>
<style scoped>
.garden-link { margin:0 0 22px; font-size:12px!important; }
.current .secondary { margin-top: 15px; }.empty { text-align: center; padding: 30px 15px; }.empty-icon { display: block; font-size: 45px; color:#566b86; margin-bottom: 20px; }.empty .primary { margin-top: 22px; }.record-task { display: block; font-size: 17px; font-weight: 600; margin: 18px 0 12px; overflow-wrap: anywhere; }.record .completed { background: #e3f5eb; color:#30735c; }.record .needs_more { background: #fff3db; color:#826428; }.record .interrupted { background: #edf1f6; color:#5d6977; }.record .row .muted { font-size:12px; }
</style>
