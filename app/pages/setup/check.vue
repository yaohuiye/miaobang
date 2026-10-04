<template>
  <view class="page">
    <text class="eyebrow">妙帮 · 家庭自用版</text>
    <text class="title">先让小帮手准备好</text>
    <text class="intro">这是安装验证页。先检查本地保存与到点提醒，再开始正式使用。</text>

    <view class="card">
      <text class="heading">① 本地保存</text>
      <text class="hint">写一句话，保存后关闭应用再打开，检查它是否还在。</text>
      <input v-model="note" maxlength="100" class="input" placeholder="例如：今天一起试试妙帮" />
      <button class="primary" @click="saveNote">保存到这部手机</button>
      <text class="result">{{ savedAt ? '上次保存：' + savedAt : '还没有保存记录' }}</text>
    </view>

    <view class="card">
      <text class="heading">② 到点提醒</text>
      <text v-if="!status.supported" class="hint">当前只能预览页面和验证本地保存。锁屏提醒必须在安卓安装包中实测。</text>
      <view v-else>
        <text class="hint">{{ status.device }} · Android {{ status.androidVersion }}</text>
        <view class="permission"><text>通知：{{ status.notificationAllowed ? '已允许' : '未允许' }}</text><button size="mini" @click="permission('notification')">通知设置</button></view>
        <view class="permission"><text>闹钟和提醒：{{ status.exactAllowed ? '已允许' : '未允许' }}</text><button v-if="!status.exactAllowed" size="mini" @click="permission('exact')">去允许</button></view>
        <text class="hint">声音还会受手机静音、勿扰和通知设置影响。开始后锁屏放置，到点检查是否收到提示。</text>
        <text v-if="focusReminder" class="hint">提醒正在用于一轮专注任务。请先回到专注页面完成收尾，再做提醒测试。</text>
        <view v-else class="choices"><button v-for="choice in choices" :key="choice.seconds" size="mini" @click="start(choice.seconds)">{{ choice.label }}</button></view>
        <text class="clock">{{ clock }}</text>
        <text class="result">{{ phaseText }}</text>
        <button v-if="!focusReminder && (status.active.phase === 'scheduled' || status.active.phase === 'elapsed')" @click="cancel">取消本次提醒</button>
        <text v-if="status.active.notificationPosted" class="hint">系统已提交通知；请实际确认是否看见、听见提醒。</text>
        <text v-if="status.active.notificationError" class="error">{{ status.active.notificationError }}</text>
        <button class="secondary" @click="refresh">重新检查状态</button>
      </view>
    </view>
    <text v-if="statusError" class="error">{{ statusError }}</text>
    <text v-if="error" class="error">{{ error }}</text>
    <button class="primary" @click="openPuzzle">一起解谜 · 小机器人出发</button>
    <button class="secondary" @click="openTools">打开原有学习工具</button>
  </view>
</template>

<script>
import { reminderStatus, startReminder, stopReminder, requestPermission } from '@/services/reminder.js'
const STORAGE_KEY = 'miaobang.m0.local-note.v1'

export default {
  data() {
    return {
      note: '', savedAt: '', error: '', statusError: '', ticker: null,
      status: { supported: false, active: {}, remainingSeconds: 0 },
      choices: [{ label: '1 分钟检查', seconds: 60 }, { label: '10 分钟', seconds: 600 }, { label: '15 分钟', seconds: 900 }]
    }
  },
  computed: {
    focusReminder() { return this.status.active.ownerId?.startsWith('focus-') && ['scheduled', 'elapsed'].includes(this.status.active.phase) },
    clock() {
      const seconds = this.status.remainingSeconds
      return String(Math.floor(seconds / 60)).padStart(2, '0') + ':' + String(seconds % 60).padStart(2, '0')
    },
    phaseText() {
      return { scheduled: '提醒已安排，现在可以锁屏', elapsed: '已到时间，请检查提醒是否送达', cancelled: '本次提醒已取消', interrupted: '手机已重启，本次验证中断', failed: '提醒安排失败，请重新检查权限' }[this.status.active.phase] || '还没有开始验证'
    }
  },
  onLoad() {
    try {
      const saved = uni.getStorageSync(STORAGE_KEY)
      if (saved) { this.note = saved.note; this.savedAt = saved.savedAt }
    } catch (e) { this.error = '无法读取本地记录：' + e.message }
  },
  onShow() {
    this.refresh()
    clearInterval(this.ticker)
    this.ticker = setInterval(() => this.refresh(), 1000)
  },
  onHide() { clearInterval(this.ticker) },
  onUnload() { clearInterval(this.ticker) },
  methods: {
    refresh() {
      try { this.status = reminderStatus(); this.statusError = '' }
      catch (e) { this.statusError = '暂时无法读取提醒状态：' + e.message }
    },
    saveNote() {
      try {
        const savedAt = new Date().toLocaleString()
        uni.setStorageSync(STORAGE_KEY, { note: this.note, savedAt })
        this.savedAt = savedAt
        this.error = ''
        uni.showToast({ title: '已保存在本机', icon: 'success' })
      } catch (e) { this.error = '保存失败，请重试：' + e.message }
    },
    permission(kind) { try { requestPermission(kind) } catch (e) { this.error = e.message } },
    start(seconds) {
      if (this.status.active.phase === 'scheduled') {
        uni.showModal({ title: '替换当前提醒？', content: '当前提醒会取消，重新开始这次验证。', success: res => { if (res.confirm) this.schedule(seconds) } })
      } else this.schedule(seconds)
    },
    schedule(seconds) { try { this.status = startReminder(seconds); this.error = '' } catch (e) { this.error = e.message } },
    cancel() { try { this.status = stopReminder(); this.error = '' } catch (e) { this.error = e.message } },
    openTools() { uni.switchTab({ url: '/pages/learning/index' }) },
    openPuzzle() { uni.navigateTo({ url: '/pages/puzzle/index' }) }
  }
}
</script>

<style>
.page { padding: 36rpx; background: #f5f6ef; min-height: 100vh; box-sizing: border-box; color: #253d37; }
.eyebrow, .title, .intro, .heading, .hint, .result, .clock, .error { display: block; }
.eyebrow { font-size: 24rpx; color: #587b6d; margin: 10rpx 0 18rpx; }
.title { font-size: 44rpx; font-weight: 700; }
.intro { font-size: 28rpx; line-height: 1.7; margin: 20rpx 0 36rpx; color: #64706a; }
.card { background: #fff; padding: 32rpx; border-radius: 28rpx; margin-bottom: 28rpx; }
.heading { font-size: 34rpx; font-weight: 600; margin-bottom: 18rpx; }
.hint, .result { font-size: 25rpx; line-height: 1.6; color: #66766e; margin: 16rpx 0; }
.input { border: 1px solid #dbe3d9; border-radius: 14rpx; padding: 22rpx; font-size: 28rpx; margin: 22rpx 0; }
button { font-size: 27rpx; border-radius: 16rpx; }
button::after { border: 0; }
.primary { background: #316a55; color: #fff; }
.secondary { background: #e7ece3; color: #31604d; margin-top: 20rpx; }
.permission { display: flex; align-items: center; justify-content: space-between; margin: 22rpx 0; font-size: 26rpx; }
.permission button { margin: 0; }
.choices { display: flex; flex-wrap: wrap; gap: 12rpx; margin-top: 24rpx; }
.choices button { margin: 0; background: #e7ece3; color: #31604d; }
.clock { text-align: center; font-size: 66rpx; font-weight: 600; margin-top: 30rpx; }
.error { color: #ad4935; font-size: 25rpx; line-height: 1.6; margin: 18rpx 0; }
</style>
