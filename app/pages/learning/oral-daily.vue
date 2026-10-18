<template>
  <view class="family-page oral-page">
    <view class="card hero"><view><text class="heading">每日口算打卡</text><text class="muted">人教版四年级上册 · 每组 20 题，先独立作答，再看方法、练同类新题。</text></view><text class="streak">{{ summary.streak }} 天连续</text></view>
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
      <button v-if="learningSummary.due" class="secondary" @click="startWrongRound">同类复习 {{ learningSummary.due }}</button>
    </view>

    <view v-if="!questions.length" class="card learning-overview">
      <text class="subheading">口算学习地图</text>
      <text class="muted">已隔日验证 {{ learningSummary.mastered }} 道 · 待练 {{ learningSummary.due }} 道 · 待隔日验证 {{ learningSummary.waiting }} 道</text>
      <text class="muted learning-rule">同一道错题先做对一道变式，隔日至少再做对一道新变式，才记为已掌握；旧错题仍保留。</text>
      <view class="kind-grid"><view v-for="kind in learningSummary.kinds" :key="kind.kind" class="kind-card"><text>{{ kind.label }}</text><text class="muted">{{ kind.firstTotal ? '首次作答 ' + kind.firstCorrect + '/' + kind.firstTotal : '还没开始' }} · 待练 {{ kind.due }}</text></view></view>
    </view>

    <view v-if="questions.length && !finished" class="card quiz">
      <view class="row quiz-head"><text class="muted">{{ practice === 'wrong' ? '同类变式复习' : '每日一组' }} · 已答 {{ answered }}/{{ questions.length }} · 用时 {{ elapsed }}</text><button class="link" @click="giveUp">先不做了</button></view>
      <text class="muted first-answer-note">每题先答一次，离开输入框后确认。交卷后一起看分步说明；复习不写入每日打卡。</text>
      <view v-for="(item, index) in questions" :key="item.id" class="question">
        <text class="question-text">{{ item.text }}</text>
        <view class="answer-box">
          <input class="answer-input" type="number" v-model="item.userAnswer" :disabled="item.isAnswered" @blur="checkQuestion(index)" />
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
        <view v-for="item in lastResult.wrong" :key="item.id" class="wrong-item">
          <text class="explanation-question">{{ item.text }} 你答 {{ item.userAnswer }}，参考答案 {{ item.expected }}</text>
          <text v-for="(step, index) in item.explanation.steps" :key="index" class="explanation-step">{{ index + 1 }}. {{ step }}</text>
        </view>
      </view>
      <view v-else class="wrong-list"><text class="muted">这组全部答对了！隔日验证的新题也答对，才能确认方法记住了。</text></view>
      <view v-if="!lastResult.saved" class="actions"><button class="primary" @click="saveResult">重试保存本轮</button></view>
      <view v-if="lastResult.saved" class="actions">
        <button class="primary" @click="startRound">{{ lastResult.drill ? '回每日一组' : '再来一组' }}</button>
        <button v-if="lastResult.drill" class="secondary" @click="backHome">回首页</button>
        <button v-else-if="learningSummary.due" class="secondary" @click="startWrongRound">练同类新题 {{ learningSummary.due }}</button>
      </view>
    </view>

    <button class="game-toggle" :aria-expanded="showHistory" @click="showHistory = !showHistory">打卡记录 <text>{{ showHistory ? '收起 −' : '展开 ＋' }}</text></button>
    <view v-if="showHistory" class="card history">
      <view v-for="record in recent" :key="record.id" class="history-row"><text class="history-date">{{ record.date }}</text><text>{{ record.correct }}/20 · {{ record.seconds >= 60 ? Math.floor(record.seconds / 60) + ' 分 ' + (record.seconds % 60) + ' 秒' : record.seconds + ' 秒' }}</text></view>
      <text v-if="!recent.length" class="muted">还没有记录，完成第一组就会出现在这里。</text>
      <text class="muted footer-note">记录只保存在这部手机上；每天完成任意一组都算打卡。</text>
    </view>
    <text class="muted footer">口算题每次随机生成，范围对应人教版四年级上册：整万数加减、口算乘法、口算除法和估算。错题按题型生成不同的新题，隔日再验证；每日成绩与学习进度都只保存在本机。</text>
  </view>
</template>
<script>
import { buildRound, judgeAnswer, explainQuestion, dayKey, quotasForMode, ROUND_MODE_LABELS, summarize } from '@/math/oral.mjs'
import { buildReviewRound, summarizeLearning } from '@/math/oral-learning.mjs'
import { oralStore } from '@/services/oral.js'
import { oralLearningStore } from '@/services/oral-learning.js'
export default {
  data() { return { state: { version: 1, history: [], wrongBook: [] }, learningState: null, questions: [], finished: false, lastResult: null, pending: null, sessionId: '', showHistory: false, error: '', startedAt: 0, elapsed: '', ticker: null, practiceMode: 'all', practice: 'daily' } },
  computed: {
    summary() { return summarize(this.state) },
    learningSummary() { return summarizeLearning(this.learningState || { version: 1, stats: {}, cards: [], sessions: [] }) },
    modeLabels() { return ROUND_MODE_LABELS },
    answered() { return this.questions.filter(item => item.isAnswered).length },
    recent() { return this.state.history.slice(0, 14) }
  },
  onShow() {
    try { this.state = oralStore.read(); this.learningState = oralLearningStore.read(); this.error = '' } catch (error) { this.error = error.message || '本机记录读取失败，原记录未改动。' }
    if (this.questions.length && !this.finished) this.setTicker()
  },
  onHide() { clearInterval(this.ticker) },
  onUnload() { clearInterval(this.ticker) },
  methods: {
    beginQuestions(questions, practice) {
      this.practice = practice
      this.questions = questions.map(question => ({ ...question, userAnswer: '', firstAnswer: '', isAnswered: false, isCorrect: false }))
      this.sessionId = `${Date.now().toString(36)}-${Math.floor(Math.random() * 100000000).toString(36)}`
      this.startedAt = Date.now()
      this.setTicker()
    },
    startRound() {
      if (this.lastResult && !this.lastResult.saved) return
      this.error = ''; this.finished = false; this.lastResult = null; this.pending = null
      this.beginQuestions(buildRound(Math.random, quotasForMode(this.practiceMode)), 'daily')
    },
    startWrongRound() {
      if (this.lastResult && !this.lastResult.saved) return
      try {
        this.learningState = oralLearningStore.read()
        const questions = buildReviewRound(this.learningState)
        if (!questions.length) { this.error = '今天的同类复习已做完，待隔日验证的题明天会再次出现。'; return }
        this.error = ''; this.finished = false; this.lastResult = null; this.pending = null
        this.beginQuestions(questions, 'wrong')
      } catch (error) { this.error = error.message || '同类复习暂时无法读取。' }
    },
    setTicker() { clearInterval(this.ticker); this.tick(); this.ticker = setInterval(this.tick, 1000) },
    tick() { this.elapsed = this.secondsText(Math.round((Date.now() - this.startedAt) / 1000)) },
    secondsText(seconds) { return seconds >= 60 ? `${Math.floor(seconds / 60)} 分 ${seconds % 60} 秒` : `${seconds} 秒` },
    checkQuestion(index) {
      const item = this.questions[index]
      if (!item || item.isAnswered || item.userAnswer === '' || item.userAnswer === null) return
      item.firstAnswer = String(item.userAnswer)
      item.isAnswered = true
      item.isCorrect = judgeAnswer(item, item.userAnswer).correct
      if (this.questions.every(question => question.isAnswered)) this.finishRound()
    },
    finishRound() {
      if (this.finished) return
      clearInterval(this.ticker)
      const endedAt = Date.now()
      const seconds = Math.round((endedAt - this.startedAt) / 1000)
      const correct = this.questions.filter(item => item.isCorrect).length
      const drill = this.practice === 'wrong'
      const wrong = this.questions.filter(item => !item.isCorrect).map(item => ({ id: item.id, text: item.text, userAnswer: item.firstAnswer, expected: judgeAnswer(item, item.firstAnswer).expected, explanation: explainQuestion(item) }))
      const results = this.questions.map(item => ({ question: { id: item.id, kind: item.kind, text: item.text, answer: item.answer, unit: item.unit, note: item.note, accept: item.accept.slice() }, correct: item.isCorrect, ...(drill ? { sourceKey: item.sourceKey } : {}) }))
      this.pending = { session: { id: this.sessionId, date: dayKey(), mode: drill ? 'review' : 'daily', results },
        attempt: { id: this.sessionId, date: dayKey(), correct, seconds, endedAt },
        wrongEntries: this.questions.filter(item => !item.isCorrect).map(item => ({ ...item, wrongAnswer: item.firstAnswer, at: endedAt })) }
      this.lastResult = { drill, correct, total: this.questions.length, secondsText: this.secondsText(seconds), wrong, saved: false, heading: '本轮已作答 · 等待保存', streakText: '', warnText: '' }
      this.finished = true
      this.saveResult()
    },
    saveResult() {
      if (!this.pending || this.lastResult.saved) return
      const result = this.lastResult
      try {
        if (!result.drill) this.state = oralStore.saveOnce(this.pending.attempt, this.pending.wrongEntries)
        this.learningState = oralLearningStore.save(this.pending.session)
        result.saved = true
        result.heading = `${result.drill ? '同类复习完成' : '这一组完成'}：${result.correct}/${result.total}`
        const learning = summarizeLearning(this.learningState)
        result.streakText = result.drill
          ? `已保存，复习不增加打卡。已隔日验证 ${learning.mastered} 道，待隔日验证 ${learning.waiting} 道；答错的任务继续保留。`
          : `打卡与首次作答统计已保存，已连续 ${summarize(this.state).streak} 天。错题先练变式，再隔日验证。`
        result.warnText = ''; this.error = ''
      } catch (error) {
        result.warnText = '本轮记录尚未全部保存，请点“重试保存本轮”；重试不会重复打卡或计数。'
        this.error = error.message || '本机保存失败，请保留当前页面后重试。'
      }
    },
    giveUp() { clearInterval(this.ticker); this.questions = []; this.finished = false; this.pending = null },
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

.learning-overview .subheading { margin-top: 0; }.learning-rule,.first-answer-note { display: block; font-size: 12px; line-height: 1.7; margin: 10px 0; }.kind-grid { display: grid; grid-template-columns: repeat(2,minmax(0,1fr)); gap: 8px; margin-top: 14px; }.kind-card { padding: 10px; background: #f4f8fd; border-radius: 12px; }.kind-card text { display: block; font-size: 13px; line-height: 1.7; }.kind-card .muted { font-size: 11px; }.explanation-question { display: block; font-weight: 600; }.explanation-step { display: block; padding: 4px 0; }.wrong-item { margin: 12px 0; }
</style>
