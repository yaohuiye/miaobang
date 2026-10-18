<template>
  <view class="family-page english-game">
    <text class="eyebrow">小妙的英语游乐场 · 认词到独立拼写</text>
    <text class="title">{{ modeTitle }}</text>
    <text v-if="error" class="error">{{ error }}</text>
    <view v-if="pendingAttempts.length" class="save-note"><text class="error">还有 {{ unsavedTitles }} 的练习未保存。</text><button class="secondary" @click="retrySave">重试保存</button></view>
    <template v-if="!started">
      <view class="welcome"><image src="/static/puzzle/robot-miao.png" mode="aspectFit" /><text class="intro">先看懂词义，再拼装字母，最后不看字母自己写。每轮最多 5 个词，不计时，随时停。</text></view>
      <view class="card start-card">
        <text class="heading">选一层挑战</text>
        <view class="stage-options"><button v-for="item in stages" :key="item.id" :class="{ chosen: stage === item.id }" @click="setStage(item.id)">{{ item.label }}</button></view>
        <view v-if="stage === 'recognize'" class="topics"><button :class="{ chosen: prompt === 'meaning' }" @click="prompt = 'meaning'">看中文选英文</button><button :class="{ chosen: prompt === 'listen' }" @click="prompt = 'listen'">听内置读音选词</button></view>
        <text class="muted">{{ stageHint }}</text>
        <text class="section-label">选择词库</text><view class="topics books"><button v-for="item in books" :key="item.id" :class="{ chosen: book === item.id }" @click="setBook(item.id)">{{ item.label }}</button></view>
        <button class="topic-toggle" :aria-expanded="showTopics" @click="showTopics = !showTopics">{{ topic || '全部主题 / Module' }} {{ showTopics ? '−' : '＋' }}</button>
        <view v-if="showTopics" class="topics"><button :class="{ chosen: !topic }" @click="topic = ''">全部</button><button v-for="item in topics" :key="item" :class="{ chosen: topic === item }" @click="topic = item">{{ item }}</button></view>
        <button class="review-switch" :class="{ chosen: onlyReview }" @click="onlyReview = !onlyReview">{{ onlyReview ? '✓ ' : '' }}只练待复习的词</button>
        <text class="muted pool-count">当前可选 {{ pool.length }} 个词 · 待复习 {{ reviewIds.length }} 个</text>
        <text v-if="mode === 'listen'" class="muted audio-note">听音只显示已有内置音频的基础词。课本新增词请选“看中文选英文”或拼写层。</text>
        <text v-if="!pool.length" class="empty-note">这一组合暂时没有词。可换词库、Module、练习层，或取消“只练待复习”。</text>
        <button class="primary" :disabled="!pool.length || !!pendingAttempts.length" @click="start">开始这一轮 →</button>
      </view>
      <view class="card progress-card"><text class="heading">已留下的学习证据</text><text class="muted">认词 {{ summary.recognized }} · 拼装 {{ summary.assembled }} · 独立拼写 {{ summary.written }} 个词</text><text class="muted">同一个词每层只记一次新证据。独立拼写通过只说明本次会写，隔几天还要再用一用。</text></view>
      <button class="link" @click="leave">回知识口袋</button>
      <text class="muted note">部分基础词带内置美式合成读音；课本新增词暂无音频。<br />不录音、不评口音，音量跟随手机设置。</text>
    </template>
    <view v-else-if="finished" class="card finish"><image src="/static/puzzle/robot-miao.png" mode="aspectFit" /><text class="heading">完成了 {{ ids.length }} 个词的练习</text><text class="intro">本轮 {{ independentIds.length }} 个词独立答对。一起选一个词，用在今天的生活里。</text><view class="round-words"><text v-for="id in ids" :key="id">{{ titleFor(id) }}</text></view><text v-if="reviewed.length" class="muted">值得再练：{{ reviewTitles }}。改对和看过答案的词也会留在复习里。</text><text class="muted talk">{{ nextStageHint }}</text><button v-if="stage !== 'write'" class="secondary" :disabled="!!pendingAttempts.length" @click="advanceStage">挑战下一层 →</button><button class="primary" :disabled="!!pendingAttempts.length" @click="restart">再选一组词</button><button class="link" @click="leave">今天先到这里</button></view>
    <template v-else-if="entry">
      <view class="row round-heading"><text class="pill">{{ entry.topic }}</text><text class="muted">{{ cursor + 1 }} / {{ ids.length }}</text></view>
      <view class="card play-card">
        <template v-if="mode === 'listen' || mode === 'meaning'">
          <text class="heading">{{ mode === 'listen' ? '声音里说的是哪个词？' : '哪一个英文词符合这个意思？' }}</text>
          <template v-if="mode === 'listen'"><button class="sound" @click="listen('word')"><image class="sound-symbol" src="/static/ui/sound.png" mode="aspectFit" />{{ audioState.phase === 'loading' ? '准备声音…' : '点我听一听' }}</button><text class="muted">{{ hasPlayed ? '可以再听一遍，再选英文词。' : '播放声音后，就可以选词。' }}</text></template>
          <text v-else class="meaning">{{ entry.summary }}</text>
          <view class="choices"><button v-for="id in round.choices" :key="id" :class="['choice', { correct: outcome && id === entry.id, picked: picked === id }]" :disabled="(mode === 'listen' && !hasPlayed) || !!outcome" @click="choose(id)">{{ titleFor(id) }}<text v-if="outcome && id === entry.id"> ✓</text></button></view>
        </template>
        <template v-else>
          <text class="muted">{{ mode === 'write' ? '不看字母，自己写出英文' : '用下面的字母拼出英文' }}</text><text class="meaning">{{ entry.summary }}</text>
          <button v-if="hasAudio && mode === 'spell'" class="link" @click="listen('word')">♪ 听读音</button><text v-if="!hasAudio" class="muted audio-note">这个课本词暂无内置读音，本轮练习词义和拼写。</text>
          <template v-if="mode === 'spell'"><view class="slots" aria-label="已拼字母"><view v-for="(slot, index) in slots" :key="index" :class="['slot', { space: slot === ' ' }]">{{ slot || '·' }}</view></view><view class="tiles"><button v-for="tile in round.tiles" :key="tile.id" :disabled="selected.includes(tile.id) || !!outcome" @click="addTile(tile.id)">{{ tile.letter }}</button></view><view class="actions"><button class="secondary" :disabled="!selected.length || !!outcome" @click="undo">退回一格</button><button class="primary" :disabled="!!outcome" @click="check">拼好了</button></view></template>
          <template v-else><input v-model="typed" class="spelling-input" type="text" :disabled="!!outcome" :maxlength="100" :adjust-position="true" placeholder="输入英文单词或短语" confirm-type="done" @confirm="check" /><text class="muted input-tip">短语中记得空格；本轮忽略大小写和句末标点。</text><button class="primary" :disabled="!!outcome" @click="check">检查我的拼写</button></template>
          <text v-if="feedback" class="feedback-text">{{ feedback }}</text>
        </template>
        <text v-if="audioState.error" class="error">{{ audioState.error }}</text><button v-if="audioState.phase === 'playing'" class="link" @click="stopAudio">停止播放</button><button v-if="!outcome" class="link reveal" @click="reveal">先看看答案，一起学</button>
      </view>
      <view v-if="outcome" class="card answer-card"><text class="heading">{{ outcome === 'correct' ? (hadWrong || hadHelp ? '调整后做对了，过几天再独立试试' : '这次独立做到了') : '一起认识这个词' }}</text><text class="answer-word">{{ entry.title }}</text><text class="meaning-small">{{ entry.summary }}</text><text class="example">{{ entry.example }}</text><button v-if="hasAudio" class="secondary" @click="listen('example')">♪ 听例句，跟着读</button><text v-else class="muted">暂无内置例句音频，可以和家长一起读。</text><text v-if="rewardFeedback" class="evidence">{{ rewardFeedback }}</text><text class="muted talk">和家长换掉句子中的一个词，试着说一个新句子。</text><text v-if="reviewed.includes(entry.id) && !pendingAttempts.length" class="muted">已加入待复习和知识口袋“再看看”。</text></view>
      <button v-if="outcome" class="primary next" @click="next">{{ cursor === ids.length - 1 ? '完成这一轮' : '下一个词 →' }}</button><button class="link" @click="leave">先到这里，回知识口袋</button>
    </template>
  </view>
</template>
<script>
import { wordById, wordBooks, hasWordAudio, wordPool, buildWordRound, spellResult, inputResult } from '@/game/english.mjs'
import { makePractice } from '@/knowledge/model.mjs'
import { emptyWordProgress, reviewWordIds, summarizeWordProgress } from '@/knowledge/word-progress.mjs'
import { ENGLISH_AUDIO } from '@/data/knowledge/english-audio.mjs'
import { knowledgeStore } from '@/services/knowledge.js'
import { wordProgressStore } from '@/services/word-progress.js'
import { lessonAudioMixin } from '@/services/lesson-audio.js'
export default {
  mixins: [lessonAudioMixin],
  data() { return { stage: 'recognize', prompt: 'meaning', stages: [{ id: 'recognize', label: '1 词义识别' }, { id: 'assemble', label: '2 字母拼装' }, { id: 'write', label: '3 独立拼写' }], books: wordBooks, book: 'all', topic: '', showTopics: false, onlyReview: false, review: [], progress: emptyWordProgress(), ids: [], cursor: 0, started: false, finished: false, round: null, selected: [], typed: '', picked: '', outcome: '', feedback: '', rewardFeedback: '', hasPlayed: false, hadWrong: false, hadHelp: false, reviewed: [], independentIds: [], pendingAttempts: [], error: '' } },
  computed: {
    mode() { return this.stage === 'recognize' ? this.prompt : this.stage === 'assemble' ? 'spell' : 'write' },
    modeTitle() { return ({ listen: '听音找词', meaning: '词义小侦探', spell: '拼词小工坊', write: '独立拼写挑战' })[this.mode] },
    stageHint() { return ({ recognize: '看懂意思或听懂声音，找到对应的词。', assemble: '给你字母积木，试着放到正确的位置。', write: '只给中文线索，自己输入英文；改对也值得肯定，会另留一次复习。' })[this.stage] },
    nextStageHint() { return this.stage === 'recognize' ? '认出了词，下一层试试自己安排字母。' : this.stage === 'assemble' ? '拼装过了，下一层不看字母也能写出来吗？' : '写对过的词会在 7 天后出现在待复习里；这只是本次独立拼写的证据。' },
    reviewTitles() { return this.reviewed.map(this.titleFor).join('、') },
    unsavedTitles() { return [...new Set(this.pendingAttempts.map(item => item.id))].map(this.titleFor).join('、') },
    reviewIds() { return [...new Set([...this.review, ...reviewWordIds(this.progress)])].filter(id => wordById.has(id)) },
    summary() { return summarizeWordProgress(this.progress) },
    topics() { return [...new Set(wordPool('', null, { book: this.book }).map(entry => entry.topic))] },
    pool() { return wordPool(this.topic, this.onlyReview ? this.reviewIds : null, { book: this.book, mode: this.mode }) },
    entry() { return wordById.get(this.ids[this.cursor]) },
    hasAudio() { return hasWordAudio(this.entry?.id) },
    slots() {
      if (!this.round?.tiles) return []
      const letters = this.selected.map(id => this.round.tiles.find(tile => tile.id === id).letter)
      let index = 0
      return [...this.entry.title].map(letter => letter === ' ' ? ' ' : letters[index++] || '')
    }
  },
  watch: { 'audioState.phase'(phase) { if (phase === 'playing' && this.audioState.key === ENGLISH_AUDIO[this.entry?.id]?.word.src) this.hasPlayed = true } },
  onLoad(query) { if (query.mode === 'spell') this.stage = 'assemble'; else if (query.mode === 'listen') this.prompt = 'listen'; this.readProgress() },
  methods: {
    titleFor(id) { return wordById.get(id)?.title || id },
    setBook(book) { this.book = book; this.topic = ''; if (book === 'upper' || book === 'lower') this.prompt = 'meaning' },
    setStage(stage) { this.stage = stage },
    readProgress() {
      const errors = []
      try { this.review = knowledgeStore.read().review } catch (error) { errors.push(error.message || '暂时读不到“再看看”记录。') }
      try { this.progress = wordProgressStore.read() } catch (error) { errors.push(error.message || '暂时读不到英语进度，原记录不会被覆盖。') }
      this.error = errors.join(' ')
    },
    start() { if (!this.pool.length || this.pendingAttempts.length) return; this.ids = makePractice(this.pool); this.cursor = 0; this.reviewed = []; this.independentIds = []; this.started = true; this.finished = false; this.prepare() },
    prepare() { this.stopAudio(); this.round = buildWordRound(this.entry.id, this.mode); this.selected = []; this.typed = ''; this.picked = ''; this.outcome = ''; this.feedback = ''; this.rewardFeedback = ''; this.hasPlayed = false; this.hadWrong = false; this.hadHelp = false; uni.pageScrollTo({ scrollTop: 0, duration: 0 }) },
    listen(kind) { const clip = ENGLISH_AUDIO[this.entry?.id]?.[kind]; if (clip) this.playAudio(clip) },
    addTile(id) { if (this.outcome || this.selected.includes(id)) return; this.selected.push(id); this.feedback = '' },
    undo() { if (!this.outcome) { this.selected.pop(); this.feedback = '' } },
    recordAttempt(correct, independent) {
      const id = this.entry.id
      if (!correct || !independent) { if (!this.reviewed.includes(id)) this.reviewed.push(id) }
      else if (!this.independentIds.includes(id)) this.independentIds.push(id)
      this.pendingAttempts.push({ id, stage: this.stage, correct, independent, at: new Date().toISOString() })
      this.retrySave()
    },
    retrySave() {
      while (this.pendingAttempts.length) {
        const attempt = this.pendingAttempts[0]
        try {
          const before = wordProgressStore.read()
          this.progress = wordProgressStore.record(attempt)
          if (attempt.correct && attempt.independent && !before.words[attempt.id]?.stages.includes(attempt.stage) && this.entry?.id === attempt.id) this.rewardFeedback = '留下了一份新的独立完成证据。每个词每层只计一次。'
          const needsReview = !attempt.correct || !attempt.independent
          if (needsReview || this.review.includes(attempt.id)) this.review = knowledgeStore.set('review', attempt.id, needsReview).review
          this.pendingAttempts.shift()
        } catch (error) { this.error = `${error.message || '本机存储暂时不可用。'} 这次练习还没有全部保存，请点“重试保存”。`; return }
      }
      this.error = ''
    },
    choose(id) {
      if ((this.mode === 'listen' && !this.hasPlayed) || this.outcome || !this.round.choices.includes(id)) return
      this.picked = id; const correct = id === this.entry.id
      this.outcome = correct ? 'correct' : 'wrong'; this.hadWrong = !correct
      this.recordAttempt(correct, correct)
    },
    check() {
      if (this.outcome) return
      let correct
      if (this.mode === 'write') {
        if (!this.typed.trim()) { this.feedback = '先输入你想到的英文写法。'; return }
        correct = inputResult(this.entry.id, this.typed).correct
      } else {
        const result = spellResult(this.round, this.selected)
        if (result.remaining) { this.feedback = `还差 ${result.remaining} 个字母，继续试试。`; return }
        correct = result.correct
      }
      if (correct) { this.outcome = 'correct'; this.feedback = ''; this.recordAttempt(true, !this.hadWrong && !this.hadHelp) }
      else { if (!this.hadWrong) this.recordAttempt(false, false); this.hadWrong = true; this.feedback = this.mode === 'write' ? '还没有对上。想想字母的顺序和短语的空格，调整后再试；这次会留作复习。' : '字母顺序再想一想，可以退回调整；这次会留作复习。' }
    },
    reveal() { if (this.outcome) return; this.hadHelp = true; this.outcome = 'revealed'; this.recordAttempt(false, false) },
    next() { if (!this.outcome || this.finished) return; this.stopAudio(); if (this.cursor === this.ids.length - 1) this.finished = true; else { this.cursor++; this.prepare() }; uni.pageScrollTo({ scrollTop: 0, duration: 0 }) },
    advanceStage() { if (this.pendingAttempts.length) return; this.stage = this.stage === 'recognize' ? 'assemble' : 'write'; this.restart() },
    restart() { if (this.pendingAttempts.length) return; this.stopAudio(); this.started = false; this.finished = false; this.readProgress() },
    leave() { this.stopAudio(); uni.switchTab({ url: '/pages/learning/index' }) }
  }
}
</script>
<style src="@/styles/family.css">.stage-options { display:grid; grid-template-columns:repeat(3,minmax(0,1fr)); gap:6px; margin:16px 0 12px; }.stage-options button { margin:0; padding:4px; font-size:12px; line-height:36px; background:#edf4ff; color:#365f88; }.stage-options button.chosen { background:#2467b5; color:white; }.section-label { display:block; font-size:14px; font-weight:600; margin:20px 0 10px; color:#365f88; }.audio-note { display:block; font-size:12px; margin-top:12px; line-height:1.7; }.spelling-input { box-sizing:border-box; width:100%; height:58px; border:2px solid #b9d1ed; border-radius:12px; margin:20px 0 10px; padding:10px; background:#f7faff; font-size:22px; color:#32557e; }.input-tip { display:block; font-size:12px; margin-bottom:20px; }.progress-card .muted { display:block; margin-top:12px; line-height:1.8; }.evidence { display:block; margin:16px 0; color:#257153; line-height:1.8; }.save-note { padding:12px; margin:12px 0; background:#fff7e8; border-radius:12px; }.save-note .secondary { margin-top:10px; }
@media(min-width:768px) { .english-game { max-width:780px; }.english-game .choices { grid-template-columns:repeat(3,minmax(0,1fr)); }.english-game .tiles { grid-template-columns:repeat(8,minmax(0,1fr)); } }
</style>
<style scoped>
.start-card .primary { margin:18px 0 12px; }.topic-toggle { width:100%; margin:0 0 12px; color:#365f88; background:#edf4ff; font-size:14px; }.pool-count { font-size:12px; }.topics { padding-top:8px; }
.welcome { display:flex; align-items:center; gap:12px; margin:16px 0; }.welcome image { width:85px; height:105px; flex-shrink:0; }.welcome .intro { margin:0; }.topics { display:flex; flex-wrap:wrap; gap:8px; margin-bottom:18px; }.topics button { margin:0; padding:6px 11px; font-size:12px; line-height:28px; color:#496889; background:#eef4fc; }.topics .chosen,.review-switch.chosen { color:#fff; background:#2467b5; }.review-switch { background:#eef4fc; color:#496889; font-size:12px; margin-bottom:14px; }.empty-note { display:block; margin-top:10px; color:#89652e; font-size:13px; line-height:1.8; }.note { margin-top:24px; text-align:center; font-size:12px; }.round-heading { margin:20px 0; }.play-card { text-align:center; }.sound { background:#e5efff; color:#326ebb; padding:12px; margin:18px 0; line-height:1.8; }.sound-symbol { display:block; width:56px; height:56px; margin:0 auto 8px; }.choices { display:grid; gap:12px; margin-top:20px; }.choice { width:100%; margin:0; background:#f4f8ff; border:1px solid #cddded; color:#32557e; padding:10px; font-size:22px; line-height:1.6; }.choice[disabled] { opacity:1; color:#5e6b7a; }.choice.picked { border-color:#4f8bd7; }.choice.correct { border-color:#6cb48b; background:#e9f6ed; color:#367a50; }.meaning { display:block; font-size:24px; font-weight:600; margin:10px 0; }.slots { display:flex; flex-wrap:wrap; justify-content:center; gap:5px; margin:18px 0 24px; }.slot { min-width:23px; font-size:23px; font-weight:600; border-bottom:2px solid #8db0db; line-height:38px; }.slot.space { border:0; min-width:8px; }.tiles { display:grid; grid-template-columns:repeat(6,1fr); gap:7px; }.tiles button { margin:0; padding:0; font-size:23px; font-weight:600; color:#3465a0; background:#e8f1fe; line-height:44px; border-bottom:3px solid #aac8ee; }.tiles button[disabled] { color:#5f6873; background:#f1f4f8; border-color:#e4eaf2; opacity:.6; }.feedback-text { display:block; font-size:13px; line-height:1.8; color:#956129; margin-top:14px; }.reveal { margin-top:16px; }.answer-word { display:block; font-size:28px; font-weight:700; color:#356caf; overflow-wrap:anywhere; }.meaning-small { display:block; margin:8px 0; color:#546b85; font-size:15px; }.example { display:block; white-space:pre-line; font-size:16px; line-height:1.9; padding:15px; margin:18px 0; border-radius:12px; background:#eef4fd; }.talk { margin-top:17px; }.next { margin:20px 0 10px; }.finish { margin-top:24px; text-align:center; }.finish image { width:100px; height:120px; }.finish button { margin-top:16px; }.round-words { display:flex; gap:8px; flex-wrap:wrap; justify-content:center; margin:20px 0; }.round-words text { padding:7px 12px; background:#eaf2ff; color:#396aa7; border-radius:10px; font-size:16px; }
.stage-options { display:grid; grid-template-columns:repeat(3,minmax(0,1fr)); gap:6px; margin:16px 0 12px; }.stage-options button { margin:0; padding:4px; font-size:12px; line-height:36px; background:#edf4ff; color:#365f88; }.stage-options button.chosen { background:#2467b5; color:white; }.section-label { display:block; font-size:14px; font-weight:600; margin:20px 0 10px; color:#365f88; }.audio-note { display:block; font-size:12px; margin-top:12px; line-height:1.7; }.spelling-input { box-sizing:border-box; width:100%; height:58px; border:2px solid #b9d1ed; border-radius:12px; margin:20px 0 10px; padding:10px; background:#f7faff; font-size:22px; color:#32557e; }.input-tip { display:block; font-size:12px; margin-bottom:20px; }.progress-card .muted { display:block; margin-top:12px; line-height:1.8; }.evidence { display:block; margin:16px 0; color:#257153; line-height:1.8; }.save-note { padding:12px; margin:12px 0; background:#fff7e8; border-radius:12px; }.save-note .secondary { margin-top:10px; }
@media(min-width:768px) { .english-game { max-width:780px; }.english-game .choices { grid-template-columns:repeat(3,minmax(0,1fr)); }.english-game .tiles { grid-template-columns:repeat(8,minmax(0,1fr)); } }
</style>
