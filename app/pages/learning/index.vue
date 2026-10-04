<template>
  <view class="family-page library">
    <view class="library-hero"><view><text class="title">把好奇，装进口袋</text><text class="muted">{{ total }} 条本地知识 · 和家长一起发现</text></view></view>
    <view class="search-row"><input class="input" v-model="query" placeholder="搜单词、成语、拼音或知识点" aria-label="搜索知识" :maxlength="80" @input="limit = 20" /><button v-if="query" class="clear" @click="query = ''; limit = 20">清空</button></view>
    <view class="subjects"><button v-for="item in subjects" :key="item.id" :class="['subject', { selected: subject === item.id }]" @click="chooseSubject(item.id)"><text class="subject-icon">{{ item.icon }}</text><text>{{ item.name }}</text><text class="count">{{ counts[item.id] }} 条</text></button></view>
    <view class="old-tools quick-tools"><view class="chips"><button @click="navigate('/pages/learning/arithmetic')">口算练习 ↗</button><button @click="navigate('/pages/learning/chinese')">汉字查询 ↗</button><button @click="navigate('/pages/learning/poetry')">古诗助手 ↗</button></view></view>
    <view class="chips"><button :class="{ chosen: subject === 'all' }" @click="chooseSubject('all')">全部学科</button><button :class="{ chosen: shelf === 'favorites' }" @click="chooseShelf('favorites')">收藏 {{ progress.favorites.length }}</button><button :class="{ chosen: shelf === 'review' }" @click="chooseShelf('review')">再看看 {{ progress.review.length }}</button></view>
    <scroll-view v-if="topics.length" scroll-x class="topic-scroll"><view class="topic-options"><button :class="{ chosen: !topic }" @click="chooseTopic('')">全部主题</button><button v-for="item in topics" :key="item" :class="{ chosen: topic === item }" @click="chooseTopic(item)">{{ item }}</button></view></scroll-view>
    <view class="practice-banner"><view><text class="heading">一起练 5 题</text><text class="muted">从当前列表抽题，不计时，随时停。</text></view><button class="primary" :disabled="!results.length" @click="practice">试试看 →</button></view>
    <text v-if="error" class="error">{{ error }}</text>
    <view class="row result-heading"><text>{{ shelfLabel }} · {{ results.length }} 条</text><button class="link" @click="showScope = !showScope">{{ showScope ? '收起说明' : '学什么 · 内容说明' }}</button></view>
    <view v-if="showScope" class="card scope"><text class="heading">四年级知识口袋 · 第一版</text><text class="body">已按家长确认记录：语文、数学人教版；英语外研版。当前按主题查阅，含基础复习、常见重点和拓展，不是课本全文或完整必考清单。</text><view v-for="item in subjects" :key="item.id"><text class="subheading">{{ item.name }}</text><text class="body">{{ item.scope }}</text></view><text class="muted">解释、例句和练习为重新编写；来源用于学段参考或科学核对。每条详情可查看。整理日期 {{ sourceDate }}。</text></view>
    <view v-if="!results.length" class="card empty"><text class="heading">这里还没有找到</text><text class="muted">试试更短的关键词，或取消学科、主题和收藏筛选。想留待复习的内容，可以在详情里加入“再看看”。</text><button class="secondary" @click="reset">查看全部知识</button></view>
    <button v-for="entry in results.slice(0, limit)" :key="entry.id" class="knowledge-row" @click="open(entry.id)"><view class="row"><text class="entry-title">{{ entry.title }}</text><text class="entry-arrow">→</text></view><text class="entry-summary">{{ entry.summary }}</text><view class="entry-meta"><text>{{ names[entry.subject] }} · {{ entry.topic }} · {{ entry.level }}</text><text v-if="progress.favorites.includes(entry.id)">★ 收藏</text><text v-if="progress.review.includes(entry.id)">再看看</text></view></button>
    <button v-if="results.length > limit" class="secondary more" @click="limit += 20">再看 20 条（还有 {{ results.length - limit }} 条）</button>
    <button class="game-toggle" :aria-expanded="showGames" @click="showGames = !showGames">益智小游戏 <text>{{ showGames ? '收起 −' : '展开 ＋' }}</text></button>
    <view v-if="showGames" class="game-links"><button class="light-link" @click="navigate('/pages/games/light')">✦ 光线救援站 · 点亮 6 座灯塔</button><button @click="navigate('/pages/games/numbers')">＋ 数字搭桥</button><button @click="navigate('/pages/games/safety')">☀ 安全小侦探</button><button @click="navigate('/pages/games/english?mode=listen')">♪ 听音找词</button><button @click="navigate('/pages/games/english?mode=spell')">abc 拼词小工坊</button></view>
    <text class="muted footer">内容随应用保存在本机，查询和练习不需要联网。<br />收藏与“再看看”留在这部手机，卸载或清除数据会丢失。</text>
  </view>
</template>
<script>
import { entries, SUBJECTS, sourceDate } from '@/data/knowledge/index.mjs'
import { emptyProgress, searchEntries, makePractice } from '@/knowledge/model.mjs'
import { knowledgeStore } from '@/services/knowledge.js'
export default {
  data() { return { subjects: SUBJECTS, sourceDate, total: entries.length, query: '', subject: 'all', topic: '', shelf: 'all', limit: 20, progress: emptyProgress(), error: '', showScope: false, showGames: false, counts: Object.fromEntries(SUBJECTS.map(s => [s.id, entries.filter(e => e.subject === s.id).length])), names: Object.fromEntries(SUBJECTS.map(s => [s.id, s.name])) } },
  computed: {
    topics() { return this.subject === 'all' ? [] : [...new Set(entries.filter(e => e.subject === this.subject).map(e => e.topic))] },
    results() { return searchEntries(this) },
    shelfLabel() { return this.shelf === 'favorites' ? '我的收藏' : this.shelf === 'review' ? '留着再看看' : '探索知识' }
  },
  onShow() { try { this.progress = knowledgeStore.read(); this.error = '' } catch (error) { this.error = error.message || '本机记录读取失败，仍可查阅知识。' } },
  methods: {
    chooseSubject(id) { this.subject = id; this.topic = ''; this.limit = 20 },
    chooseShelf(shelf) { this.shelf = this.shelf === shelf ? 'all' : shelf; this.limit = 20 },
    chooseTopic(value) { this.topic = value; this.limit = 20 },
    reset() { this.query = ''; this.subject = 'all'; this.topic = ''; this.shelf = 'all'; this.limit = 20 },
    navigate(url) { uni.navigateTo({ url }) },
    open(id) { this.navigate(`/pages/learning/entry?id=${encodeURIComponent(id)}`) },
    practice() { const ids = makePractice(this.results); if (ids.length) this.navigate(`/pages/learning/entry?practice=${encodeURIComponent(ids.join(','))}`) }
  }
}
</script>
<style src="@/styles/family.css"></style>
<style scoped>
.library-hero { display:flex; align-items:center; position:relative; margin:0 0 18px; padding:6px 0; }.library-hero > view { position:relative; z-index:1; }.library-hero .title { font-size:24px; margin-bottom:10px; }
.game-links { display:grid; grid-template-columns:repeat(2,1fr); gap:10px; margin:0 0 18px; }.game-links button { flex:1; margin:0; background:#e5efff; color:#396ead; padding:5px; font-size:13px; }
.game-links .light-link { grid-column:1 / -1; background:#234d69; color:#f4e5bc; }
.search-row { display:flex; gap:8px; }.search-row .input { flex:1; min-width:0; background:#fff; }.clear { margin:0; font-size:12px; padding:0 10px; background:#e7f0fc; color:#3567a3; }
.subjects { display:grid; grid-template-columns:repeat(3,1fr); gap:10px; margin:18px 0; }.subject { background:#fff; border:1px solid #dbe7f6; padding:8px 5px; margin:0; line-height:1.5; font-size:13px; color:#3d5d85; }.subject.selected { border-color:#4087e4; background:#e5efff; }.subject-icon { display:block; color:#3166ae; font-size:20px; line-height:1.2; font-weight:700; }.count { display:block; font-size:12px; color:#506781; }.chips { display:flex; flex-wrap:wrap; gap:8px; }.chips button { margin:0; padding:5px 10px; line-height:28px; color:#4b6887; background:#e8f0fa; font-size:12px; }.chips .chosen { background:#2467b5; color:#fff; }
.topic-scroll { white-space:nowrap; margin-top:14px; }.topic-options { display:inline-flex; gap:8px; padding-bottom:5px; }.topic-options button { margin:0; padding:4px 12px; background:#fff; border:1px solid #dce7f5; color:#49688a; font-size:12px; line-height:30px; }.topic-options .chosen { color:#2769bb; background:#e5efff; border-color:#7da7dc; }.practice-banner { background:#e4eefc; border-radius:16px; padding:16px; display:flex; align-items:center; gap:12px; margin:18px 0 10px; }.practice-banner > view { flex:1; }.practice-banner .heading { margin:0 0 4px; }.practice-banner .muted { font-size:12px; }.practice-banner button { padding:0 12px; margin:0; font-size:12px; flex-shrink:0; }.result-heading { font-size:12px; color:#4b6887; margin:6px 0; }.result-heading button { padding:0; margin:0; }.knowledge-row { display:block; background:#fff; width:100%; margin:0 0 12px; text-align:left; padding:16px; border:1px solid #dce7f5; line-height:1.6; }.entry-title { font-size:16px; color:#244a76; font-weight:600; overflow-wrap:anywhere; }.entry-arrow { color:#486b98; }.entry-summary { font-size:14px; display:-webkit-box; -webkit-line-clamp:2; -webkit-box-orient:vertical; overflow:hidden;  color:#526b86; margin:7px 0 11px; }.entry-meta { display:flex; gap:10px; flex-wrap:wrap; font-size:12px; color:#426889; }.more { margin:18px 0; }.old-tools { margin:16px 0; }.quick-tools .chips { display:grid; grid-template-columns:repeat(3,minmax(0,1fr)); gap:6px; }.quick-tools .chips button { padding:6px 2px; background:#fff; border:1px solid #d5e2f2; font-size:12px; }.game-toggle { display:flex; align-items:center; justify-content:space-between; width:100%; margin:12px 0; padding:8px 12px; color:#355f88; background:#e8f0fa; font-size:13px; }.game-toggle text { font-size:12px; }.footer { margin:24px 0 0; font-size:12px; text-align:center; }.empty button { margin-top:15px; }.scope .body { display:block; font-size:13px; line-height:1.9; color:#4f6a88; }.subheading { display:block; margin:15px 0 5px; font-size:14px; font-weight:600; }.scope .muted { margin-top:18px; }
@media(max-width:360px) { .library-hero .title { font-size:22px; }.practice-banner { padding:12px; }.subjects { gap:6px; }.subject { font-size:12px; } }
</style>
