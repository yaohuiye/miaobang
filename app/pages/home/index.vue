<template>
  <view class="family-page home">
    <view class="brand"><text>属于你们的亲子时间</text><button aria-label="提醒设置" class="settings" @click="setup"><image src="/static/ui/settings.png" /></button></view>
    <view class="welcome"><view class="welcome-copy"><text class="title">一起开始，<br />一起发现。</text><text class="muted">一件小事，也能成为<br />今天的新收获。</text></view><image src="/static/puzzle/robot-miao.png" mode="aspectFit" /></view>
    <text v-if="error" class="error">{{ error }}</text>
    <button class="focus-entry" @click="focus"><image src="/static/ui/clock.png" /><view><text class="entry-title">{{ active ? '回到这一小项' : '开始一小项' }}</text><text class="entry-description">{{ active ? active.task : '和孩子约定一个做得到的小任务' }}</text><text v-if="active" class="active-status">{{ phaseLabels[active.phase] }}</text></view><text class="arrow">→</text></button>
    <button class="growth-entry" @click="navigate('/pages/growth/index')"><image src="/static/ui/flower.png" mode="aspectFit" /><view><text class="entry-title">成长小花园</text><text class="entry-description">记一件小事，留一朵鼓励花</text></view><text class="arrow">→</text></button>
    <button class="oral-entry" @click="navigate('/pages/learning/oral-daily')"><image src="/static/ui/numbers.png" mode="aspectFit" /><view><text class="entry-title">每日口算打卡</text><text class="entry-description">20 道四年级口算题，今天的一组做完了吗</text></view><text class="arrow">→</text></button>
    <view class="section-heading"><text>选一个游戏</text><text class="muted">一起玩，慢慢想</text></view>
    <view class="game-grid"><button v-for="game in games" :key="game.url" :class="['game-card',{night:game.icon==='light'}]" @click="navigate(game.url)"><image v-if="game.icon" :src="'/static/ui/'+game.icon+'.png'" mode="aspectFit" /><text v-else class="game-emoji">{{ game.emoji }}</text><text class="game-name">{{ game.name }}</text><text class="game-copy">{{ game.copy }}</text><text class="game-arrow">↗</text></button></view>
    <text class="muted footer">游戏随时可以玩。<br />查知识、看记录，都在下方导航里。</text>
  </view>
</template>
<script>
import { focusService } from '@/services/focus.js'
import { PHASE_LABELS } from '@/focus/model.mjs'
export default {
  data() { return { games: [
      {name:'一起解谜',copy:'给小妙找一条新路',icon:'puzzle',url:'/pages/puzzle/index'},
      {name:'光线救援站',copy:'转动镜子，点亮灯塔',icon:'light',url:'/pages/games/light'},
      {name:'数字搭桥',copy:'把数字变成一座桥',icon:'numbers',url:'/pages/games/numbers'},
      {name:'安全小侦探',copy:'一起发现安全的办法',icon:'safety',url:'/pages/games/safety'},
      {name:'听音找词',copy:'听一听，找英文词',icon:'sound',url:'/pages/games/english?mode=listen'},
      {name:'拼词小工坊',copy:'把字母拼成一个词',icon:'spell',url:'/pages/games/english?mode=spell'},
      {name:'扫雷',copy:'看数字，安全排雷',emoji:'🚩',url:'/pages/games/minesweeper'},
      {name:'俄罗斯方块',copy:'转一转，填满一行',emoji:'🧱',url:'/pages/games/tetris'},
      {name:'消消乐',copy:'三个一样就消掉',emoji:'🍓',url:'/pages/games/match'},
      {name:'贪吃蛇',copy:'带小蛇去吃苹果',emoji:'🐍',url:'/pages/games/snake'}
    ], active: null, phaseLabels: PHASE_LABELS, error: '', ticker: null } },
  onShow() { this.refresh(); clearInterval(this.ticker); this.ticker = setInterval(this.refresh, 5000) },
  onHide() { clearInterval(this.ticker) },
  onUnload() { clearInterval(this.ticker) },
  methods: {
    refresh() { try { this.active = focusService.snapshot(true).state.active; this.error = '' } catch (error) { this.error = error.message } },
    navigate(url) { uni.navigateTo({ url }) },
    focus() { uni.navigateTo({ url: '/pages/focus/timer' }) },
    setup() { uni.navigateTo({ url: '/pages/setup/check' }) }
  }
}
</script>
<style src="@/styles/family.css"></style>
<style scoped>
.brand { display:flex; align-items:center; justify-content:space-between; color:#526b86; font-size:12px; margin-bottom:12px; }.settings { width:44px; height:44px; padding:10px; margin:0; background:#e8f0fa; border-radius:14px; }.settings image { width:24px; height:24px; }
.welcome { display:grid; grid-template-columns:minmax(0,1fr) 112px; align-items:center; gap:8px; background:linear-gradient(125deg,#e0edff,#e8f2fb); border:1px solid #d7e6f7; border-radius:24px; padding:18px; margin-bottom:20px; }.welcome .title { font-size:27px; }.welcome .muted { margin-top:10px; font-size:14px; }.welcome image { width:100%; height:143px; }.welcome-copy { min-width:0; }
.focus-entry,.growth-entry,.oral-entry { display:flex; align-items:center; gap:12px; width:100%; margin:0 0 12px; padding:16px; text-align:left; background:#fff; border:1px solid #d6e4f2; border-bottom-width:3px; border-radius:18px; line-height:1.6; }.focus-entry > view,.growth-entry > view,.oral-entry > view { flex:1; min-width:0; }.focus-entry image,.growth-entry image,.oral-entry image { flex-shrink:0; width:40px; height:44px; }.entry-title { display:block; color:#23476e; font-size:18px; font-weight:650; }.entry-description { display:block; color:#526b86; font-size:13px; margin-top:4px; overflow-wrap:anywhere; }.arrow { color:#326da7; font-size:22px; }.growth-entry { background:#fff4f6; border-color:#ecd8e0; }.growth-entry .entry-title { font-size:16px; color:#8a405d; }.growth-entry .entry-description { color:#7f5263; }.oral-entry { background:#eef7f1; border-color:#d2e6d9; }.oral-entry .entry-title { font-size:16px; color:#2c6a4d; }.oral-entry .entry-description { color:#587a68; }.active-status { display:block; color:#286857; font-size:12px; margin-top:5px; }
.section-heading { display:flex; align-items:center; justify-content:space-between; gap:8px; margin:26px 0 14px; font-size:18px; font-weight:650; }.section-heading .muted { font-size:12px; font-weight:400; }.game-grid { display:grid; grid-template-columns:repeat(2,minmax(0,1fr)); gap:12px; }.game-card { position:relative; width:100%; margin:0; padding:17px 12px; text-align:left; line-height:1.7; background:#fff; border:1px solid #d6e4f2; border-bottom-width:3px; border-radius:18px; }.game-card image { display:block; width:44px; height:44px; margin-bottom:10px; }.game-emoji { display:block; width:44px; height:44px; margin-bottom:10px; font-size:34px; line-height:44px; text-align:left; }.game-name { display:block; color:#23476e; font-size:16px; font-weight:650; }.game-copy { display:block; color:#526b86; font-size:12px; margin-top:5px; }.game-arrow { position:absolute; top:17px; right:14px; color:#5b7c9b; font-size:18px; }.game-card.night { background:#e8f2f6; border-color:#cadde8; }.footer { text-align:center; font-size:12px; margin-top:24px; }
@media(max-width:360px) { .welcome { grid-template-columns:minmax(0,1fr) 76px; padding:16px; }.welcome .title { font-size:24px; }.welcome image { height:116px; }.welcome .muted { font-size:13px; }.focus-entry,.growth-entry,.oral-entry { padding:13px; gap:8px; }.entry-title { font-size:17px; }.game-card { padding:15px 10px; }.game-name { font-size:15px; } }
</style>
