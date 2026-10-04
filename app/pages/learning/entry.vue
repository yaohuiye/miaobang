<template>
  <view class="family-page entry-page">
    <button class="link back" @click="leave">← 返回知识口袋</button>
    <text v-if="error" class="error">{{ error }}</text>
    <view v-if="finished" class="card finish"><image src="/static/puzzle/robot-miao.png" mode="aspectFit" /><text class="title">今天又多懂了一点</text><text class="intro">一起看过了 {{ ids.length }} 道题，其中 {{ correctCount }} 道答对了。<br />挑一条最有意思的，说给家长听吧。</text><text v-if="missed.length" class="muted">这轮值得再聊聊：{{ missed.join('、') }}。可以再次查阅这些条目。</text><text v-if="unsavedReview.length" class="error">有 {{ unsavedReview.length }} 条未保存成功，请稍后回到这些词条手动加入“再看看”：{{ unsavedTitles }}</text><button class="primary" @click="leave">回知识口袋</button></view>
    <template v-else-if="entry">
      <view class="row"><text class="eyebrow">{{ subjectName }} · {{ entry.topic }}</text><text v-if="isPractice" class="pill">{{ cursor + 1 }} / {{ ids.length }}</text></view>
      <text class="title entry-name">{{ isPractice ? '先想一想' : entry.title }}</text>
      <text v-if="!isPractice && entry.pronunciation" class="pronunciation">{{ entry.pronunciation }}</text>
      <text class="muted level">{{ entry.level }} · {{ isPractice ? '不计时，可以一起讨论' : '本地知识卡' }}</text>
      <view v-if="entryAudio && (!isPractice || selected)" class="audio-panel"><view class="shelf-actions"><button class="secondary" @click="playAudio(entryAudio.word)">♪ {{ entry.id.startsWith('en-pattern-') ? '听句型' : '听单词' }}</button><button class="secondary" @click="playAudio(entryAudio.example)">♪ 听例句</button></view><text class="muted">内置英式合成朗读，和家长一起跟读。</text><text v-if="audioState.phase === 'loading'" class="muted">正在准备声音…</text><button v-if="audioState.phase === 'playing'" class="link" @click="stopAudio">停止播放</button><text v-if="audioState.error" class="error">{{ audioState.error }}</text></view>
      <template v-if="!isPractice">
        <view class="shelf-actions"><button class="secondary" @click="toggle('favorites')">{{ progress.favorites.includes(entry.id) ? '★ 已收藏' : '☆ 收藏' }}</button><button class="secondary" @click="toggle('review')">{{ progress.review.includes(entry.id) ? '✓ 从再看看移出' : '加入再看看' }}</button></view>
        <view class="card explanation"><text class="section-label">读懂它</text><text class="body">{{ entry.explanation }}</text><text class="section-label">看个例子</text><text class="body example">{{ entry.example }}</text><text class="section-label">容易忽略的小地方</text><text class="body">{{ entry.tip }}</text></view>
      </template>
      <view class="card quiz"><text class="section-label">{{ isPractice ? '和家长一起选一选' : '试一道小题' }}</text><text class="question">{{ entry.quiz.prompt }}</text><button v-for="(option, index) in options" :key="option" :class="['option', { picked: selected === option, correct: selected && option === entry.quiz.answer }]" :disabled="!!selected" @click="answer(option)"><text class="letter">{{ letters[index] }}</text><text>{{ option }}</text><text v-if="selected && option === entry.quiz.answer" class="answer-mark">✓</text></button>
        <view v-if="selected" class="feedback" :class="{ retry: !result.correct }"><text class="heading">{{ result.correct ? '对啦，说说你是怎么想的' : '没关系，一起弄明白' }}</text><text class="body">正确答案：{{ entry.quiz.answer }}</text><text class="body">{{ result.explanation }}</text><text v-if="!result.correct" class="muted">{{ progress.review.includes(entry.id) ? '已放进“再看看”，以后可以回来聊聊。' : unsavedReview.includes(entry.id) ? '这条还没保存，请看上方提示；也可以稍后在词条里加入“再看看”。' : '已从“再看看”移出，需要时可以再加入。' }}</text></view>
      </view>
      <template v-if="!isPractice || selected">
        <view v-if="isPractice" class="card"><text class="heading">{{ entry.title }}</text><text class="body">{{ entry.explanation }}</text><text class="body example">{{ entry.example }}</text><text class="muted">{{ entry.tip }}</text><view class="shelf-actions"><button class="secondary" @click="toggle('favorites')">{{ progress.favorites.includes(entry.id) ? '★ 已收藏' : '☆ 收藏这条' }}</button><button class="secondary" @click="toggle('review')">{{ progress.review.includes(entry.id) ? '✓ 从再看看移出' : '加入再看看' }}</button></view></view>
        <view class="talk"><text class="section-label">轮到你们聊一聊</text><text class="body">{{ entry.talk }}</text></view>
        <button class="link source-toggle" @click="showSources = !showSources">{{ showSources ? '收起内容依据' : '查看内容依据与适用范围' }}</button>
        <view v-if="showSources" class="card sources"><text class="body">{{ scope }}</text><text class="muted">整理日期：{{ sourceDate }}。解释、例子和练习为原创整理；参考资料不代表出版社审核。复制来源地址后可自行联网查阅，本页无需联网。</text><view v-for="id in entry.sources" :key="id" class="source-item"><text class="body">{{ sources[id].title }}</text><text class="muted">{{ sources[id].role }}</text><button class="link" @click="copySource(id)">复制来源地址</button></view></view>
      </template>
      <button v-if="isPractice && selected" class="primary next" @click="next">{{ cursor === ids.length - 1 ? '完成这一轮' : '下一题 →' }}</button>
      <button v-if="isPractice && !selected" class="link" @click="leave">先到这里，随时可以再来</button>
    </template>
    <view v-else class="card"><text class="heading">没有找到这条知识</text><button class="secondary" @click="leave">回知识口袋</button></view>
  </view>
</template>
<script>
import { entryById, SUBJECTS, SOURCES, sourceDate } from '@/data/knowledge/index.mjs'
import { emptyProgress, shuffle, judgeAnswer } from '@/knowledge/model.mjs'
import { ENGLISH_AUDIO } from '@/data/knowledge/english-audio.mjs'
import { lessonAudioMixin } from '@/services/lesson-audio.js'
import { knowledgeStore } from '@/services/knowledge.js'
export default {
  mixins: [lessonAudioMixin],
  data() { return { ids: [], cursor: 0, isPractice: false, finished: false, selected: '', result: null, options: [], progress: emptyProgress(), error: '', correctCount: 0, missed: [], unsavedReview: [], showSources: false, sources: SOURCES, sourceDate, letters: ['A', 'B', 'C'] } },
  computed: {
    entryAudio() { return ENGLISH_AUDIO[this.entry?.id] },
    entry() { return entryById.get(this.ids[this.cursor]) },
    subject() { return SUBJECTS.find(s => s.id === this.entry?.subject) },
    subjectName() { return this.subject?.name || '' },
    unsavedTitles() { return this.unsavedReview.map(id => entryById.get(id)?.title || id).join('、') },
    scope() { return this.subject?.scope || '' }
  },
  onLoad(query) {
    this.isPractice = !!query.practice
    this.ids = [...new Set((query.practice || query.id || '').split(','))].filter(id => entryById.has(id)).slice(0, this.isPractice ? 5 : 1)
    try { this.progress = knowledgeStore.read() } catch (error) { this.error = error.message || '本机学习记录读取失败，仍可查阅内容。' }
    this.prepare()
  },
  methods: {
    prepare() { this.stopAudio(); this.selected = ''; this.result = null; this.showSources = false; this.options = this.entry ? shuffle(this.entry.quiz.options) : [] },
    save(shelf, enabled) {
      try { this.progress = knowledgeStore.set(shelf, this.entry.id, enabled); this.error = ''; if (shelf === 'review') this.unsavedReview = this.unsavedReview.filter(id => id !== this.entry.id); return true }
      catch (error) { this.error = `未能保存本机记录：${error.message || '请检查手机存储空间后重试。'}`; return false }
    },
    toggle(shelf) { this.save(shelf, !this.progress[shelf].includes(this.entry.id)) },
    answer(option) {
      if (this.selected) return
      this.result = judgeAnswer(this.entry.id, option); this.selected = option
      if (this.result.correct) this.correctCount++
      else { this.missed.push(this.entry.title); if (!this.save('review', true)) this.unsavedReview.push(this.entry.id) }
    },
    next() {
      if (!this.selected || this.finished) return
      if (this.cursor === this.ids.length - 1) this.finished = true
      else { this.cursor++; this.prepare() }
      uni.pageScrollTo({ scrollTop: 0, duration: 0 })
    },
    leave() { uni.switchTab({ url: '/pages/learning/index' }) },
    copySource(id) { uni.setClipboardData({ data: SOURCES[id].url }) }
  }
}
</script>
<style src="@/styles/family.css"></style>
<style scoped>
.audio-panel { margin:0 0 22px; padding:16px; background:#eaf2fe; border-radius:16px; }.audio-panel .shelf-actions { margin-bottom:10px; }
.back { text-align:left; padding:0; margin:0 0 14px; }.entry-name { overflow-wrap:anywhere; font-size:27px; }.pronunciation { display:block; color:#4c6b8f; font-size:16px; margin-top:10px; }.level { margin:10px 0 20px; }.shelf-actions { display:flex; flex-wrap:wrap; gap:10px; margin:0 0 18px; }.shelf-actions button { flex:1; min-width:110px; margin:0; font-size:12px; }.body { display:block; font-size:15px; line-height:1.9; color:#3f5c7e; white-space:pre-line; overflow-wrap:anywhere; }.section-label { display:block; font-size:12px; font-weight:600; color:#456992; margin:0 0 9px; }.explanation .section-label:not(:first-child) { margin-top:24px; }.example { padding:14px; background:#f0f5fc; border-radius:12px; margin:12px 0; }.question { display:block; font-size:18px; font-weight:600; line-height:1.7; color:#284c77; margin:0 0 20px; }.option { display:flex; align-items:center; gap:11px; margin:10px 0 0; padding:14px 12px; text-align:left; background:#f5f8fc; border:1px solid #d9e4f2; color:#375b87; line-height:1.7; word-break:normal; overflow-wrap:anywhere; }.option > text:nth-child(2) { flex:1; }.letter { flex-shrink:0; color:#506c8d; font-size:12px; }.option[disabled] { opacity:1; color:#506d8c; background:#f5f8fc; }.option.picked { border-color:#4a84cb; background:#eaf2ff; }.option.correct { background:#e9f6ee; border-color:#92c5a6; }.answer-mark { color:#367456; }.feedback { margin-top:20px; padding:15px; border-radius:12px; background:#eaf6ef; }.feedback.retry { background:#fff4df; }.feedback .heading { font-size:15px; margin-bottom:8px; }.feedback .body { font-size:14px; }.feedback .muted { margin-top:12px; }.talk { background:#e4edfc; padding:20px; border-radius:18px; margin:20px 0 10px; }.sources .body { font-size:13px; }.sources .muted { margin-top:10px; }.source-item { border-top:1px solid #e2eaf5; padding-top:14px; margin-top:16px; }.source-item button { padding:0; text-align:left; }.source-toggle { margin:5px auto 15px; }.next { margin:18px 0 25px; }.finish { text-align:center; }.finish image { width:125px; height:140px; }.finish .title { font-size:24px; }.finish button { margin-top:25px; }
</style>
