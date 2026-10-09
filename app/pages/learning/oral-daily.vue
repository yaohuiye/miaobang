<template>
  <view class="family-page oral-page">
    <view class="card hero"><view><text class="heading">每日口算打卡</text><text class="muted">人教版四年级上册 · 每组 20 题，完成一轮就算今天打卡。</text></view><text class="streak">{{ summary.streak }} 天连续</text></view>
    <text v-if="error" class="error">{{ error }}</text>
    <view class="card status">
      <view class="status-item"><text class="status-num">{{ summary.todayDone ? summary.todayBest : '—' }}{{ summary.todayDone ? '/20' : '' }}</text><text class="muted">今日最好成绩</text></view>
      <view class="status-item"><text class="status-num">{{ summary.days }}</text><text class="muted">累计打卡天数</text></view>
      <view class="status-item"><text class="status-num">{{ summary.rounds }}</text><text class="muted">累计完成组数</text></view>
    </view>
    <view v-if="!questions.length" class="card mode">
      <view class="mode-row">
        <button v-for="(label, mode) in modeLabels" :key="mode" :class="['mode-chip', practiceMode === mode ? 'active' : '']" @click="practiceMode = mode">{{ label }}</button>
      </view>
      <text class="muted mode-hint">{{ practiceMode === 'md' ? '这一组只出乘除法，整万加减先休息，一样算打卡。' : '加减乘除估算都练，范围对应课本每单元口算。' }}</text>
    </view>
    <view v-if="!questions.length" class="actions">
      <button class="primary" @click="startRound">{{ summary.todayDone ? '再来一组' : '开始今天的一组 →' }}</button>
      <button v-if="wrongCount" class="secondary" @click="startWrongRound">错题重练 {{ wrongCount }}</button>
    </view>

    <view v-if="questions.length && !finished" class="card quiz">
      <view class="row quiz-head"><text class="muted">{{ practice === 'wrong' ? '错题重练' : '每日一组' }} · 已答 {{ answered }}/{{ questions.length }} · 用时 {{ elapsedText }}</text><button class="link" @click="giveUp">先不做了</button></view>
      <view v-for="(item, index) in questions" :key="item.id" class="question">
        <text class="question-text">{{ item.text }}</text>
        <view class="answer-box">
          <input class="answer-input" type="number" v-model="item.userAnswer" :disabled="item.isAnswered && item.isCorrect" @blur="checkQuestion(index)" />
          <text v-if="item.unit" class="unit">{{ item.unit }}</text>
          <text v-if="item.isAnswered" :class="['mark', item.isCorrect ? 'ok' : 'no']">{{ item.isCorrect ? '✓' : '✗' }}</text>
        </view>
      </view>
    </view>

    <view v-if="finished && lastResult" class="card result">
      <text class="heading">{{ lastResult.heading }} · 用时 {{ lastResult.secondsText }}</text>
      <text v-if="lastResult.saved" class="muted">{{ lastResult.streakText }}</text>
      <text v-else class="warn">{{ lastResult.warnText }}</text>
      <view v-if="lastResult.wrong.length" class="wrong-list">
        <text class="subheading">需要再看一眼的题：</text>
        <text v-for="item in lastResult.wrong" :key="item.id" class="wrong-item">{{ item.text }} 你答 {{ item.userAnswer }}，正确是 {{ item.expected }}</text>
      </view>
      <view v-else class="wrong-list"><text class="muted">全对，一朵具体的小红花送给认真检查的你。</text></view>
      <view class="actions">
        <button class="primary" @click="startRound">{{ lastResult.drill ? '回每日一组' : '再来一组' }}</button>
        <button v-if="lastResult.drill" class="secondary" @click="backHome">回首页</button>
        <button v-else-if="wrongCount" class="secondary" @click="startWrongRound">错题重练 {{ wrongCount }}</button>
      </view>
    </view>

    <button class="game-toggle" :aria-expanded="showHistory" @click="showHistory = !showHistory">打卡记录 <text>{{ showHistory ? '收起 −' : '展开 ＋' }}</text></button>
    <view v-if="showHistory" class="card history">
      <view v-for="record in recent" :key="record.id" class="history-row"><text class="history-date">{{ record.date }}</text><text>{{ record.correct }}/20 · {{ record.seconds >= 60 ? Math.floor(record.seconds / 60) + ' 分 ' + (record.seconds % 60) + ' 秒' : record.seconds + ' 秒' }}</text></view>
      <text v-if="!recent.length" class="muted">还没有记录，完成第一组就会出现在这里。</text>
      <text class="muted footer-note">记录只保存在这部手机上；每天完成任意一组都算打卡。</text>
    </view>
    <text class="muted footer">口算题每次随机生成，范围对应人教版四年级上册：整万数加减、口算乘法、口算除法和估算。做错的题会收进本机错题本，随时可以重练。</text>
  </view>
</template>
<script>
import { buildRound, buildWrongRound, judgeAnswer, dayKey, quotasForMode, ROUND_MODE_LABELS, summarize } from '@/math/oral.mjs'
import { oralStore } from '@/services/oral.js'
export default {
  data() { return { state: { version: 1, history: [], wrongBook: [] }, questions: [], finished: false, lastResult: null, showHistory: false, error: '', startedAt: 0, elapsed: '', ticker: null, practiceMode: 'all', practice: 'daily' } },
  computed: {
    summary() { return summarize(this.state) },
    modeLabels() { return ROUND_MODE_LABELS },
    wrongCount() { return (this.state.wrongBook || []).length },
    answered() { return this.questions.filter(item => item.isAnswered).length },
    recent() { return this.state.history.slice(0, 14) }
  },
  onShow() { try { this.state = oralStore.read(); this.error = '' } catch (error) { this.error = error.message || '本机记录读取失败，仍可继续做题。' } },
  onHide() { clearInterval(this.ticker) },
  onUnload() { clearInterval(this.ticker) },
  methods: {
    beginQuestions(questions, practice) {
      this.practice = practice
      this.questions = questions.map(question => ({ ...question, userAnswer: '', isAnswered: false, isCorrect: false }))
      this.startedAt = Date.now()
      this.tick()
      clearInterval(this.ticker)
      this.ticker = setInterval(this.tick, 1000)
    },
    startRound() {
      this.error = ''
      this.finished = false
      this.lastResult = null
      const questions = buildRound(Math.random, quotasForMode(this.practiceMode))
      this.beginQuestions(questions, 'daily')
    },
    startWrongRound() {
      const questions = buildWrongRound(this.state)
      if (!questions.length) return
      this.error = ''
      this.finished = false
      this.lastResult = null
      this.beginQuestions(questions, 'wrong')
    },
    tick() { this.elapsed = this.secondsText(Math.round((Date.now() - this.startedAt) / 1000)) },
    secondsText(seconds) { return seconds >= 60 ? `${Math.floor(seconds / 60)} 分 ${seconds % 60} 秒` : `${seconds} 秒` },
    checkQuestion(index) {
      const item = this.questions[index]
      if (!item || (item.isAnswered && item.isCorrect)) return
      if (item.userAnswer === '' || item.userAnswer === null) return
      const judged = judgeAnswer(item, item.userAnswer)
      item.isAnswered = true
      item.isCorrect = judged.correct
      if (this.questions.every(q => q.isAnswered)) this.finishRound()
    },
    finishRound() {
      clearInterval(this.ticker)
      const seconds = Math.round((Date.now() - this.startedAt) / 1000)
      const correct = this.questions.filter(item => item.isCorrect).length
      const wrong = this.questions.filter(item => !item.isCorrect).map(item => {
        const judged = judgeAnswer(item, item.userAnswer)
        return { id: item.id, text: item.text.replace('≈', ''), userAnswer: item.userAnswer, expected: judged.expected }
      })
      const drill = this.practice === 'wrong'
      const result = { drill, correct, total: this.questions.length, secondsText: this.secondsText(seconds), wrong, saved: false, streakText: '', warnText: '' }
      try {
        if (drill) {
          // 重练不打卡：答对的移出错题本，答错的留在本里。
          const mastered = this.questions.filter(item => item.isCorrect).map(item => item.id)
          this.state = oralStore.pruneWrong(mastered)
          result.saved = true
          result.streakText = mastered.length
            ? `答对的 ${mastered.length} 题已移出错题本，还剩 ${this.state.wrongBook.length} 题。`
            : '这次都没答对也没关系，错题都还留在本子里。'
        } else {
          const wrongEntries = this.questions.filter(item => !item.isCorrect).map(item => ({
            id: item.id, kind: item.kind, text: item.text, answer: item.answer, unit: item.unit,
            accept: item.accept.slice(), note: item.note, wrongAnswer: String(item.userAnswer), at: Date.now()
          }))
          this.state = oralStore.save({ id: `${Date.now().toString(36)}${Math.floor(Math.random() * 1000)}`, date: dayKey(), correct, seconds, endedAt: Date.now() }, wrongEntries)
          result.saved = true
          result.streakText = `已连续 ${summarize(this.state).streak} 天。${this.state.wrongBook.length ? '做错的题已收进错题本。' : ''}`
        }
        this.error = ''
      } catch (error) {
        result.warnText = drill ? '错题本没能更新，稍后再练一次。' : '这次成绩没能保存到本机记录，可以再做一组试试。'
        this.error = error.message || (drill ? '错题本更新失败。' : '这次打卡没能保存。')
      }
      result.heading = `${drill ? '错题重练完成' : '这一组完成'}：${correct}/${result.total}`
      this.lastResult = result
      this.finished = true
    },
    giveUp() { clearInterval(this.ticker); this.questions = []; this.finished = false },
    backHome() { uni.switchTab({ url: '/pages/home/index' }) }
  }
}
</script>
<style src="@/styles/family.css"></style>
<style scoped>
.hero { display: flex; align-items: center; justify-content: space-between; gap: 12px; }.hero .heading { display: block; font-size: 20px; margin-bottom: 6px; }.hero .muted { display: block; font-size: 13px; }.streak { flex-shrink: 0; background: #e5f3ec; color: #286857; border-radius: 12px; padding: 8px 12px; font-size: 13px; font-weight: 600; }
.status { display: grid; grid-template-columns: repeat(3, 1fr); gap: 8px; }.status-item { text-align: center; }.status-num { display: block; font-size: 22px; color: #23476e; font-weight: 650; margin-bottom: 4px; }
.mode-row { display: flex; gap: 10px; }.mode-chip { flex: 1; margin: 0; background: #f6f9fd; color: #557399; line-height: 42px; border: 1px solid #d7e3f2; }.mode-chip.active { background: #e8f0fa; color: #23476e; border-color: #b9d2ef; font-weight: 600; }.mode-hint { display: block; margin-top: 10px; font-size: 12px; }
.actions { display: flex; gap: 10px; margin-top: 14px; }.actions button { flex: 1; margin: 0; }
.quiz-head button { padding: 0 10px; margin: 0; font-size: 12px; background: #eef4fc; color: #557399; }
.question { display: flex; align-items: center; gap: 10px; padding: 9px 0; border-bottom: 1px solid #eef3fa; }.question:last-child { border-bottom: none; }.question-text { flex: 1; font-size: 18px; color: #22384f; font-weight: 600; }
.answer-box { display: flex; align-items: center; gap: 6px; }.answer-input { width: 92px; height: 42px; background: #f6f9fd; border: 1px solid #d7e3f2; border-radius: 10px; text-align: center; font-size: 17px; }.unit { color: #4a6785; font-size: 15px; }.mark { width: 26px; height: 26px; line-height: 24px; text-align: center; border-radius: 50%; font-size: 15px; }.mark.ok { color: #286857; background: #e5f3ec; }.mark.no { color: #a5433c; background: #fbe9e6; }
.result .heading { display: block; font-size: 18px; margin-bottom: 8px; }.result .muted { display: block; font-size: 13px; }.warn { display: block; color: #975f32; font-size: 13px; margin-top: 4px; }.subheading { display: block; font-weight: 600; color: #23476e; margin: 14px 0 6px; }.wrong-item { display: block; font-size: 14px; color: #526b86; line-height: 1.8; padding-left: 10px; border-left: 2px solid #e3cbab; margin-bottom: 4px; }.wrong-list { margin-top: 6px; }
.game-toggle { display: flex; align-items: center; justify-content: space-between; width: 100%; margin: 12px 0; padding: 8px 12px; color: #355f88; background: #e8f0fa; font-size: 13px; }.game-toggle text { font-size: 12px; }
.history-row { display: flex; justify-content: space-between; gap: 10px; font-size: 14px; color: #3d5d85; padding: 7px 0; border-bottom: 1px solid #eef3fa; }.history-row:last-of-type { border-bottom: none; }.history-date { color: #23476e; font-weight: 600; }.footer-note { display: block; margin-top: 10px; font-size: 12px; }
.footer { display: block; margin-top: 14px; text-align: center; font-size: 12px; }
</style>
