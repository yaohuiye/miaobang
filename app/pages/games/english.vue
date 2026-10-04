<template>
  <view class="family-page english-game">
    <text class="eyebrow">小妙的英语游乐场 · 基础词汇</text>
    <text class="title">{{ mode === 'spell' ? '拼词小工坊' : '听音找词' }}</text>
    <text v-if="error" class="error">{{ error }}</text>
    <template v-if="!started">
      <view class="welcome"><image src="/static/puzzle/robot-miao.png" mode="aspectFit" /><text class="intro">{{ mode === 'spell' ? '把字母拼成一个词。可以听读音、撤回字母，慢慢想。' : '先听一听，再找到声音对应的英文词。可以反复听，和家长一起读。' }}</text></view>
      <view class="card start-card"><text class="heading">{{ topic || '所有主题，一起探索' }}</text><text class="muted">每轮最多 5 个词，不计时，随时停。</text><button class="primary" :disabled="!pool.length" @click="start">开始一起玩 →</button><button class="topic-toggle" :aria-expanded="showTopics" @click="showTopics = !showTopics">{{ showTopics ? '收起主题 −' : '换个主题 ＋' }}</button>
        <view v-if="showTopics" class="topics"><button :class="{ chosen: !topic }" @click="topic = ''">全部主题</button><button v-for="item in topics" :key="item" :class="{ chosen: topic === item }" @click="topic = item">{{ item }}</button></view>
        <button class="review-switch" :class="{ chosen: onlyReview }" @click="onlyReview = !onlyReview">{{ onlyReview ? '✓ ' : '' }}只玩“再看看”里的词</button><text class="muted pool-count">当前可选 {{ pool.length }} 个词</text><text v-if="!pool.length" class="empty-note">这里暂时没有词，可以换一个主题或取消“只玩再看看”。</text>
      </view>
      <button class="link" @click="leave">回知识口袋</button>
      <text class="muted note">读音为内置英式合成朗读，支持跟读，不录音、不评口音。<br />音量跟随手机设置。</text>
    </template>
    <view v-else-if="finished" class="card finish"><image src="/static/puzzle/robot-miao.png" mode="aspectFit" /><text class="heading">又认识了 {{ ids.length }} 个词</text><text class="intro">和家长选一个词，说说今天在哪里能用到它。</text><view class="round-words"><text v-for="id in ids" :key="id">{{ titleFor(id) }}</text></view><text v-if="reviewed.length" class="muted">值得再看看：{{ reviewTitles }}。可以回知识口袋继续查阅。</text><text v-if="unsaved.length" class="error">这些词还没保存成功：{{ unsavedTitles }}。</text><button v-if="unsaved.length" class="secondary" @click="retrySave">重试保存</button><button class="primary" @click="restart">再选一个主题</button><button class="link" @click="leave">今天先到这里</button></view>
    <template v-else-if="entry">
      <view class="row round-heading"><text class="pill">{{ entry.topic }}</text><text class="muted">{{ cursor + 1 }} / {{ ids.length }}</text></view>
      <view class="card play-card">
        <template v-if="mode === 'listen'"><text class="heading">声音里说的是哪个词？</text><button class="sound" @click="listen('word')"><image class="sound-symbol" src="/static/ui/sound.png" mode="aspectFit" />{{ audioState.phase === 'loading' ? '准备声音…' : '点我听一听' }}</button><text class="muted">{{ hasPlayed ? '可以再听一遍，再选英文词。' : '点上面的按钮播放后，就可以选词。' }}</text><view class="choices"><button v-for="id in round.choices" :key="id" :class="['choice', { correct: outcome && id === entry.id, picked: picked === id }]" :disabled="!hasPlayed || !!outcome" @click="choose(id)">{{ titleFor(id) }}<text v-if="outcome && id === entry.id"> ✓</text></button></view></template>
        <template v-else><text class="muted">试着拼出</text><text class="meaning">{{ entry.summary }}</text><button class="link" @click="listen('word')">♪ 听读音</button><view class="slots" aria-label="已拼字母"><view v-for="(slot, index) in slots" :key="index" :class="['slot', { space: slot === ' ' }]">{{ slot || '·' }}</view></view><view class="tiles"><button v-for="tile in round.tiles" :key="tile.id" :disabled="selected.includes(tile.id) || !!outcome" @click="addTile(tile.id)">{{ tile.letter }}</button></view><view class="actions"><button class="secondary" :disabled="!selected.length || !!outcome" @click="undo">退回一格</button><button class="primary" :disabled="!!outcome" @click="check">拼好了</button></view><text v-if="feedback" class="feedback-text">{{ feedback }}</text></template>
        <text v-if="audioState.error" class="error">{{ audioState.error }}</text>
        <button v-if="audioState.phase === 'playing'" class="link" @click="stopAudio">停止播放</button>
        <button v-if="!outcome" class="link reveal" @click="reveal">先看看答案，一起学</button>
      </view>
      <view v-if="outcome" class="card answer-card"><text class="heading">{{ outcome === 'correct' ? '拼读一下，再用一用' : '一起认识这个词' }}</text><text class="answer-word">{{ entry.title }}</text><text class="meaning-small">{{ entry.summary }}</text><text class="example">{{ entry.example }}</text><button class="secondary" @click="listen('example')">♪ 听例句，跟着读</button><text class="muted talk">和家长换掉句子中的一个词，试着说一个新句子。</text><text v-if="reviewed.includes(entry.id) && !unsaved.includes(entry.id)" class="muted">已加入“再看看”，之后可以回来练。</text></view>
      <button v-if="outcome" class="primary next" @click="next">{{ cursor === ids.length - 1 ? '完成这一轮' : '下一个词 →' }}</button>
      <button class="link" @click="leave">先到这里，回知识口袋</button>
    </template>
  </view>
</template>
<script>
import { wordById, wordTopics, wordPool, buildWordRound, spellResult } from '@/game/english.mjs'
import { makePractice } from '@/knowledge/model.mjs'
import { ENGLISH_AUDIO } from '@/data/knowledge/english-audio.mjs'
import { knowledgeStore } from '@/services/knowledge.js'
import { lessonAudioMixin } from '@/services/lesson-audio.js'
export default {
  mixins: [lessonAudioMixin],
  data() { return { mode: 'listen', topics: wordTopics, topic: '', showTopics:false, onlyReview: false, review: [], ids: [], cursor: 0, started: false, finished: false, round: null, selected: [], picked: '', outcome: '', feedback: '', hasPlayed: false, reviewed: [], unsaved: [], error: '' } },
  computed: {
    reviewTitles() { return this.reviewed.map(this.titleFor).join('、') },
    unsavedTitles() { return this.unsaved.map(this.titleFor).join('、') },
    pool() { return wordPool(this.topic, this.onlyReview ? this.review : null) },
    entry() { return wordById.get(this.ids[this.cursor]) },
    slots() {
      if (!this.round?.tiles) return []
      const letters = this.selected.map(id => this.round.tiles.find(tile => tile.id === id).letter)
      let index = 0
      return [...this.entry.title].map(letter => letter === ' ' ? ' ' : letters[index++] || '')
    }
  },
  watch: { 'audioState.phase'(phase) { if (phase === 'playing' && this.audioState.key === ENGLISH_AUDIO[this.entry?.id]?.word.src) this.hasPlayed = true } },
  onLoad(query) { this.mode = query.mode === 'spell' ? 'spell' : 'listen'; this.readReview() },
  methods: {
    titleFor(id) { return wordById.get(id)?.title || id },
    readReview() { try { this.review = knowledgeStore.read().review; this.error = '' } catch (error) { this.error = error.message || '暂时读不到复习记录，仍可以玩全部主题。' } },
    start() { if (!this.pool.length) return; this.ids = makePractice(this.pool); this.cursor = 0; this.reviewed = []; this.unsaved = []; this.started = true; this.finished = false; this.prepare() },
    prepare() { this.stopAudio(); this.round = buildWordRound(this.entry.id, this.mode); this.selected = []; this.picked = ''; this.outcome = ''; this.feedback = ''; this.hasPlayed = false; uni.pageScrollTo({ scrollTop: 0, duration: 0 }) },
    listen(kind) { this.playAudio(ENGLISH_AUDIO[this.entry.id][kind]) },
    addTile(id) { if (this.outcome || this.selected.includes(id)) return; this.selected.push(id); this.feedback = '' },
    undo() { if (!this.outcome) { this.selected.pop(); this.feedback = '' } },
    markReview(id) {
      if (!this.reviewed.includes(id)) this.reviewed.push(id)
      try { this.review = knowledgeStore.set('review', id, true).review; this.unsaved = this.unsaved.filter(item => item !== id); this.error = this.unsaved.length ? '还有词未保存，请在本轮结束时重试。' : '' }
      catch (error) { if (!this.unsaved.includes(id)) this.unsaved.push(id); this.error = '未能保存到“再看看”，可以继续玩，本轮结束后可重试保存。' }
    },
    retrySave() { for (const id of [...this.unsaved]) this.markReview(id) },
    choose(id) { if (!this.hasPlayed || this.outcome || !this.round.choices.includes(id)) return; this.picked = id; this.outcome = id === this.entry.id ? 'correct' : 'wrong'; if (this.outcome === 'wrong') this.markReview(this.entry.id) },
    check() {
      if (this.outcome) return
      const result = spellResult(this.round, this.selected)
      if (result.remaining) { this.feedback = `还差 ${result.remaining} 个字母，继续试试。`; return }
      if (result.correct) { this.outcome = 'correct'; this.feedback = '' }
      else { this.feedback = `第 ${result.firstMismatch + 1} 个字母再想一想，可以退回调整。`; this.markReview(this.entry.id) }
    },
    reveal() { if (this.outcome) return; this.outcome = 'revealed'; this.markReview(this.entry.id) },
    next() { if (!this.outcome || this.finished) return; this.stopAudio(); if (this.cursor === this.ids.length - 1) this.finished = true; else { this.cursor++; this.prepare() }; uni.pageScrollTo({ scrollTop: 0, duration: 0 }) },
    restart() { this.stopAudio(); this.started = false; this.finished = false; this.readReview() },
    leave() { this.stopAudio(); uni.switchTab({ url: '/pages/learning/index' }) }
  }
}
</script>
<style src="@/styles/family.css"></style>
<style scoped>
.start-card .primary { margin:18px 0 12px; }.topic-toggle { width:100%; margin:0 0 12px; color:#365f88; background:#edf4ff; font-size:14px; }.pool-count { font-size:12px; }.topics { padding-top:8px; }
.welcome { display:flex; align-items:center; gap:12px; margin:16px 0; }.welcome image { width:85px; height:105px; flex-shrink:0; }.welcome .intro { margin:0; }.topics { display:flex; flex-wrap:wrap; gap:8px; margin-bottom:18px; }.topics button { margin:0; padding:6px 11px; font-size:12px; line-height:28px; color:#496889; background:#eef4fc; }.topics .chosen,.review-switch.chosen { color:#fff; background:#2467b5; }.review-switch { background:#eef4fc; color:#496889; font-size:12px; margin-bottom:14px; }.empty-note { display:block; margin-top:10px; color:#89652e; font-size:13px; line-height:1.8; }.note { margin-top:24px; text-align:center; font-size:12px; }.round-heading { margin:20px 0; }.play-card { text-align:center; }.sound { background:#e5efff; color:#326ebb; padding:12px; margin:18px 0; line-height:1.8; }.sound-symbol { display:block; width:56px; height:56px; margin:0 auto 8px; }.choices { display:grid; gap:12px; margin-top:20px; }.choice { width:100%; margin:0; background:#f4f8ff; border:1px solid #cddded; color:#32557e; padding:10px; font-size:22px; line-height:1.6; }.choice[disabled] { opacity:1; color:#5e6b7a; }.choice.picked { border-color:#4f8bd7; }.choice.correct { border-color:#6cb48b; background:#e9f6ed; color:#367a50; }.meaning { display:block; font-size:24px; font-weight:600; margin:10px 0; }.slots { display:flex; flex-wrap:wrap; justify-content:center; gap:5px; margin:18px 0 24px; }.slot { min-width:23px; font-size:23px; font-weight:600; border-bottom:2px solid #8db0db; line-height:38px; }.slot.space { border:0; min-width:8px; }.tiles { display:grid; grid-template-columns:repeat(6,1fr); gap:7px; }.tiles button { margin:0; padding:0; font-size:23px; font-weight:600; color:#3465a0; background:#e8f1fe; line-height:44px; border-bottom:3px solid #aac8ee; }.tiles button[disabled] { color:#5f6873; background:#f1f4f8; border-color:#e4eaf2; opacity:.6; }.feedback-text { display:block; font-size:13px; line-height:1.8; color:#956129; margin-top:14px; }.reveal { margin-top:16px; }.answer-word { display:block; font-size:28px; font-weight:700; color:#356caf; overflow-wrap:anywhere; }.meaning-small { display:block; margin:8px 0; color:#546b85; font-size:15px; }.example { display:block; white-space:pre-line; font-size:16px; line-height:1.9; padding:15px; margin:18px 0; border-radius:12px; background:#eef4fd; }.talk { margin-top:17px; }.next { margin:20px 0 10px; }.finish { margin-top:24px; text-align:center; }.finish image { width:100px; height:120px; }.finish button { margin-top:16px; }.round-words { display:flex; gap:8px; flex-wrap:wrap; justify-content:center; margin:20px 0; }.round-words text { padding:7px 12px; background:#eaf2ff; color:#396aa7; border-radius:10px; font-size:16px; }
</style>
