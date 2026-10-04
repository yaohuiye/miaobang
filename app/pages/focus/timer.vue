<template>
  <view class="family-page">
    <text class="eyebrow">妙帮 · 开始一小项</text>
    <text v-if="error" class="error">{{ error }}</text>
    <button v-if="error" class="link" @click="refresh(true)">重新读取已保存的状态</button>
    <view v-if="loaded && !active">
      <view v-if="justFinished" class="saved"><text>这一轮，已经记下来了</text><text class="muted">可以休息一下。下一轮由你们自己决定。</text></view>
      <text class="title">先约定一件小事</text>
      <text class="intro">和孩子一起选一个做得到的小任务，<br />准备好纸和笔，就可以开始。</text>
      <view class="card">
        <text class="heading">这次准备做什么？</text>
        <input v-model="task" maxlength="80" class="input" placeholder="例如：完成两道数学题" />
        <view class="suggestions"><button v-for="example in examples" :key="example" @click="task = example">{{ example }}</button></view>
        <text class="heading duration-title">先试多长时间？</text>
        <view class="durations"><button v-for="minutes in [5, 10, 15]" :key="minutes" :class="{ selected: selected === minutes }" @click="selected = minutes">{{ minutes }} 分钟</button><button :class="{ selected: selected === 'custom' }" @click="selected = 'custom'">自定义</button></view>
        <input v-if="selected === 'custom'" v-model="customMinutes" class="input custom" type="number" maxlength="3" placeholder="1–120 的整数分钟" />
        <text class="muted small-note">不用一次做很多，先开始这一小项。</text>
      </view>
    </view>

    <view v-if="active">
      <view class="row"><text class="pill">{{ phaseLabels[active.phase] }}</text><text class="muted">约定 {{ active.plannedMs / 60000 }} 分钟</text></view>
      <text class="title task-title">{{ active.task }}</text>
      <view v-if="active.phase !== 'review'" class="clock-card">
        <text class="clock-caption">{{ active.phase === 'paused' ? '已暂停，不计入这段时间' : '剩余时间' }}</text>
        <text class="clock">{{ remaining }}</text>
        <text class="muted">{{ active.phase === 'paused' ? '准备好了，再继续就好。' : '慢慢来，一次只做这一件事。' }}</text>
      </view>
      <view v-else class="card review-card">
        <text class="review-symbol">{{ active.reason === 'due' ? '✓' : '☕' }}</text>
        <text class="heading">{{ active.reason === 'due' ? '到时间了，一起看看结果' : active.reason === 'interrupted' ? '这一轮计时中断了' : '一起给这一轮收个尾' }}</text>
        <text class="muted">{{ active.reason === 'interrupted' ? '设备或计时环境发生变化，只保留中断前已保存的时长。' : '到时间不代表任务已经完成，由你和孩子一起确认。' }}</text>
        <text class="elapsed">本轮计时 {{ elapsed(active.elapsedMs) }}</text>
        <button class="primary" :disabled="busy" @click="complete('completed')">完成了</button>
        <button class="secondary" :disabled="busy" @click="complete('needs_more')">还需要一点时间</button>
        <button class="link" :disabled="busy" @click="complete('interrupted')">这次先停下，记录为中断</button>
      </view>
    </view>

    <view v-if="loaded && (!active || active.phase !== 'review')" class="reminder-box">
      <view class="row"><text class="reminder-title">{{ reminderTitle }}</text><text v-if="nativeReady" class="pill">安卓本地提醒</text></view>
      <text class="muted">{{ reminderCopy }}</text>
      <view v-if="reminder.supported" class="permission-actions">
        <button v-if="!reminder.notificationAllowed" @click="permission('notification')">允许通知</button>
        <button v-if="!reminder.exactAllowed" @click="permission('exact')">允许闹钟和提醒</button>
        <button v-if="active?.phase === 'running' && nativeReady && !alarmScheduled" :disabled="busy" @click="perform(() => service.enableReminder(active.id))">开启本轮提醒</button>
      </view>
      <text v-if="warning" class="muted">{{ warning }}</text>
    </view>
    <button v-if="loaded && !active" class="primary" :disabled="busy" @click="start">{{ nativeReady ? '约定好了，开始这一小项' : '开始这一小项（仅页面计时）' }}</button>
    <view v-if="active && active.phase !== 'review'">
      <view class="actions"><button class="primary" :disabled="busy" @click="perform(() => service.transition(active.id, active.phase === 'running' ? 'pause' : 'resume'))">{{ active.phase === 'running' ? '暂停一下' : '继续这一轮' }}</button><button class="secondary" :disabled="busy" @click="endEarly">提前结束</button></view>
      <button v-if="active.phase === 'paused'" class="link" :disabled="busy" @click="reset">重新约定一轮</button>
      <text class="muted privacy-note">计时只记录运行时长，不评价孩子的注意力。</text>
    </view>
    <view class="bottom-links"><button class="link" @click="home">回到首页</button><button class="link" @click="history">看看本机记录</button></view>
  </view>
</template>

<script>
import { focusService } from '@/services/focus.js'
import { requestPermission } from '@/services/reminder.js'
import { PHASE_LABELS, clockText, elapsedText } from '@/focus/model.mjs'
export default {
  data() {
    return { state: null, reminder: { supported: false, active: {} }, task: '', selected: 10, customMinutes: '',
      examples: ['完成两道数学题', '读两页课外书', '订正一道错题'], phaseLabels: PHASE_LABELS,
      error: '', warning: '', loaded: false, busy: false, ticker: null, ticks: 0, justFinished: false, service: focusService }
  },
  computed: {
    active() { return this.state?.active },
    remaining() { return this.active ? clockText(this.active.plannedMs - this.active.elapsedMs) : '' },
    nativeReady() { return this.reminder.supported && this.reminder.notificationAllowed && this.reminder.exactAllowed },
    alarmScheduled() { return this.active && this.reminder.active?.ownerId === this.active.id && this.reminder.active.phase === 'scheduled' },
    reminderTitle() {
      if (!this.reminder.supported) return '网页试玩 · 仅页面计时'
      if (!this.nativeReady) return '锁屏提醒暂不可用'
      if (this.active?.phase === 'paused') return '已暂停，提醒已撤销'
      return this.alarmScheduled ? '本轮到点提醒已安排' : this.active ? '本轮尚未安排锁屏提醒' : '可以安排到点提醒'
    },
    reminderCopy() {
      if (!this.reminder.supported) return '网页刷新会将本轮转为中断待确认；请保持页面打开。锁屏提醒需要在安卓安装包中验证。'
      if (!this.nativeReady) return '允许下面的权限后可安排提醒；也可以明确选择仅在页面中计时。'
      return '到点发出一次提示，声音受手机静音和勿扰设置影响。小米 14 的实际提醒效果仍待验证。'
    }
  },
  onShow() {
    this.refresh(true)
    clearInterval(this.ticker)
    this.ticker = setInterval(() => { this.refresh(false, ++this.ticks % 5 === 0) }, 1000)
  },
  onHide() { clearInterval(this.ticker); this.refresh(false, true) },
  onUnload() { clearInterval(this.ticker) },
  methods: {
    elapsed: elapsedText,
    apply(result) { this.state = result.state; this.reminder = result.reminder; if (result.warning) this.warning = result.warning; this.loaded = true },
    refresh(clearError = false, checkpoint = false) {
      try {
        const first = !this.loaded
        this.apply(focusService.snapshot(checkpoint))
        if (first) {
          const minutes = this.state.defaultMinutes
          this.selected = [5, 10, 15].includes(minutes) ? minutes : 'custom'
          this.customMinutes = String(minutes)
        }
        if (clearError) this.error = ''
      } catch (error) { this.error = error.message }
    },
    perform(action) {
      if (this.busy) return false
      this.busy = true
      try { this.warning = ''; this.apply(action()); this.error = ''; return true }
      catch (error) { this.error = error.message + '；请以重新读取的状态为准。'; this.refresh(); return false }
      finally { this.busy = false }
    },
    start() {
      const minutes = this.selected === 'custom' ? (/^\d+$/.test(this.customMinutes) ? Number(this.customMinutes) : NaN) : this.selected
      this.perform(() => focusService.start(this.task, minutes))
    },
    endEarly() {
      const id = this.active.id
      uni.showModal({ title: '现在结束这一轮？', content: '保留已经计时的部分，接着由你们确认任务结果。', success: res => { if (res.confirm) this.perform(() => focusService.transition(id, 'end')) } })
    },
    complete(result) {
      const id = this.active?.id
      if (!id) return
      if (this.perform(() => focusService.complete(id, result))) this.justFinished = true
    },
    reset() {
      const id = this.active.id
      uni.showModal({ title: '重新约定一轮？', content: '本轮会保存为中断记录，不会删除已计时的部分。新的任务需要再次点击开始。', success: res => { if (res.confirm) this.perform(() => focusService.complete(id, 'interrupted', true)) } })
    },
    permission(kind) { try { requestPermission(kind) } catch (error) { this.error = error.message } },
    home() { uni.switchTab({ url: '/pages/home/index' }) },
    history() { uni.switchTab({ url: '/pages/history/index' }) }
  }
}
</script>
<style src="@/styles/family.css"></style>
<style scoped>
.suggestions { display: flex; flex-wrap: wrap; gap: 7px; margin-top: 12px; }
.suggestions button { margin: 0; padding: 8px 10px; line-height: 1.8; min-height:44px; background: #edf4ff; color:#546c8a; font-size:12px; }
.duration-title { margin-top: 25px; }.durations { display: grid; grid-template-columns: repeat(4, 1fr); gap: 7px; }
.durations button { margin: 0; width: 100%; padding: 0; font-size: 12px; line-height: 44px; background: #edf3fc; color:#546780; border: 1px solid transparent; }
.durations .selected { background: #dcecff; border-color: #71a7ea; color:#2969b8; }
.custom { margin-top: 13px; }.small-note { margin-top: 16px; }.task-title { margin-top: 20px; overflow-wrap: anywhere; }
.clock-card { text-align: center; background: #e5effc; border: 1px solid #d5e4f7; border-radius: 24px; padding: 32px 12px; margin: 24px 0; }
.clock-caption { display: block; font-size: 12px; color:#536a82; }.clock { display: block; color: #326fc0; font-size: 70px; letter-spacing: -3px; font-variant-numeric: tabular-nums; font-weight: 600; line-height: 1.4; margin: 10px 0; }
.reminder-box { background: #edf3fc; border-radius: 15px; padding: 14px; margin-bottom: 20px; }.reminder-title { font-size: 12px; font-weight: 600; margin-bottom: 8px; }.permission-actions { display: flex; flex-wrap: wrap; gap: 8px; }.permission-actions button { background: #dceafb; color:#39699c; font-size:12px; margin: 10px 0 0; }
.privacy-note { text-align: center; margin-top: 18px; }.bottom-links { display: flex; justify-content: center; margin-top: 20px; }.bottom-links button { margin: 0; }
.review-card { margin-top: 25px; text-align: center; }.review-symbol { display: block; width: 48px; height: 48px; line-height: 48px; margin: 0 auto 18px; background: #e7f5ee; border-radius: 17px; color:#337058; font-size: 25px; }.elapsed { display: block; font-size: 13px; color:#4a698d; margin: 20px 0; }.review-card .secondary { margin-top: 12px; }
.saved { padding: 15px; background: #e4f5ed; border-radius: 15px; color:#2e725a; font-size: 15px; margin-bottom: 23px; }.saved .muted { color:#4c6e61; margin-top: 6px; }
</style>
