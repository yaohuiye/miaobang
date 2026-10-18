<template>
  <view class="family-page mines-page">
    <text class="eyebrow">小妙的益智游乐场 · 数字推理</text><text class="title">扫雷</text>
    <text class="intro">点开安全的格子，旁边的数字告诉你周围有几颗雷。<br />首次点开和周围一圈安全；先观察数字，再用旗子标记判断。</text>
    <view class="difficulty-row"><button v-for="level in levels" :key="level.id" :class="['difficulty-chip',{selected:difficulty===level.id}]" :disabled="!!pending" @click="selectLevel(level.id)">{{ level.label }}<text>{{ level.rows }}×{{ level.cols }} · {{ level.mines }} 雷 {{ progress.best.mines[level.id] ? '★' : '☆' }}</text></button></view>
    <text class="muted difficulty-hint">{{ levelConfig.hint }}切换难度会重新开局。</text>
    <text v-if="error" class="error">{{ error }}</text>
    <view class="row board-head">
      <text class="muted">🚩 剩余 {{ minesLeft }}</text>
      <text class="muted">⏱ {{ seconds }} 秒</text>
      <button :class="['link', { active: flagMode }]" :disabled="!board || finished" @click="flagMode = !flagMode">{{ flagMode ? '🚩 插旗模式(关闭)' : '🚩 插旗模式' }}</button>
    </view>
    <view class="card board-card">
      <view class="mines-grid" :style="{gridTemplateColumns:'repeat('+boardCols+', minmax(0, 1fr))'}">
        <button v-for="(cell, index) in displayCells" :key="index"
          :class="['cell', cell.state, 'n' + cell.count]"
          :disabled="finished"
          @click="tap(Math.floor(index / boardCols), index % boardCols)">{{ cell.text }}</button>
      </view>
      <text v-if="result === 'win'" class="result win">排雷成功！{{ seconds }} 秒完成。{{ pending ? '本轮通关记录待保存。' : '这档挑战已记录 ★' }}</text>
      <text v-else-if="result === 'lose'" class="result lose">碰到雷了。看一看数字：每个数字都数着自己的 8 个邻居，<br />再开一局，先从 0 旁边的格子点起。</text>
      <view v-if="pending" class="actions"><button class="primary" @click="saveWin">重试保存通关</button></view>
      <text v-if="!board" class="muted board-start-note">点任意格子开始，首次点击和周围一圈安全</text>
      <view v-if="!pending && board" class="actions"><button v-if="result==='win' && nextDifficulty" class="primary" @click="selectLevel(nextDifficulty)">挑战下一档 →</button><button class="secondary" @click="start">{{ finished || board ? '再来一局' : '开始扫雷' }}</button></view>
    </view>
    <view class="card tips"><text class="heading">小窍门</text><text class="muted">1 是旁边的 8 个格里只有 1 颗雷；0 的四周全安全。<br />如果一个数字周围已插对足够的旗，其余邻格就安全。随机棋盘不保证每一步都能确定；没有把握时先找其他线索，也可以重新开局。</text><text v-if="currentBest" class="muted">{{ levelConfig.label }}最快：{{ currentBest.seconds }} 秒 · ★</text><text v-if="best" class="muted">旧版 8×8 / 8 雷纪录：{{ best }}（与新档分别保留）</text><text class="muted">每档第一次通过获得一颗挑战星；重复游玩可以改进纪录，不会重复增加星数。</text></view>
    <button class="link" @click="home">今天先到这里</button>
  </view>
</template>
<script>
import { createBoard, reveal, toggleFlag, flagsUsed, isWon, isLost } from '@/game/minesweeper.mjs'
import { MINES_LEVELS } from '@/game/skill-challenges.mjs'
import { skillChallengesStore } from '@/services/skill-challenges.js'
import { arcadeStore } from '@/services/arcade.js'
import { bestText } from '@/game/arcade-progress.mjs'
export default {
  data() { return { board: null, boardRows: 6, boardCols: 6, difficulty: 'easy', progress: { version: 1, best: { mines: {}, jump: {} } }, pending: null, flagMode: false, seconds: 0, finished: false, result: '', best: '', error: '', ticker: null, startedAt: 0 } },
  computed: {
    levels() { return MINES_LEVELS },
    levelConfig() { return MINES_LEVELS.find(level => level.id === this.difficulty) },
    currentBest() { return this.progress.best.mines[this.difficulty] },
    nextDifficulty() { return MINES_LEVELS[MINES_LEVELS.findIndex(level => level.id === this.difficulty) + 1]?.id || '' },
    minesLeft() { return this.board ? this.board.mines - flagsUsed(this.board) : this.levelConfig.mines },
    displayCells() {
      if (!this.board) return Array.from({ length: this.boardRows * this.boardCols }, () => ({ state: 'hidden', count: 0, text: '' }))
      return this.board.cells.map(cell => ({ state: cell.state === 'hidden' && cell.mine && this.result === 'lose' ? 'boom' : cell.state, count: cell.count,
        text: cell.state === 'flagged' ? '🚩' : cell.state === 'revealed' ? (cell.mine ? '💥' : (cell.count || '')) : '' }))
    }
  },
  onLoad() { this.readBest() },
  onShow() { if (this.board && !this.finished) this.setTicker() },
  onUnload() { clearInterval(this.ticker) },
  onHide() { clearInterval(this.ticker) },
  methods: {
    readBest() {
      this.error = ''
      try { this.best = bestText(arcadeStore.read(), 'mines') } catch (error) { this.error = error.message }
      try { this.progress = skillChallengesStore.read() } catch (error) { this.error = error.message }
    },
    selectLevel(id) {
      if (this.pending) return
      const level = MINES_LEVELS.find(item => item.id === id)
      if (!level) return
      this.difficulty = id; this.boardRows = level.rows; this.boardCols = level.cols
      this.start()
    },
    start() {
      if (this.pending) return
      this.board = null; this.finished = false; this.result = ''; this.seconds = 0; this.error = ''; this.flagMode = false
      clearInterval(this.ticker)
    },
    tap(row, col) {
      if (this.finished) return
      try {
        if (!this.board) {
          if (this.flagMode) return
          const level = MINES_LEVELS.find(item => item.id === this.difficulty)
          this.board = createBoard(Math.random, row, col, level.rows, level.cols, level.mines)
          this.startedAt = Date.now(); this.setTicker()
        }
        this.board = this.flagMode ? toggleFlag(this.board, row, col) : reveal(this.board, row, col).board
        if (isLost(this.board)) { this.finish('lose'); return }
        if (isWon(this.board)) this.finish('win')
      } catch (error) { this.error = error.message }
    },
    tick() { if (!this.finished) this.seconds = Math.floor((Date.now() - this.startedAt) / 1000) },
    setTicker() { clearInterval(this.ticker); this.tick(); this.ticker = setInterval(this.tick, 1000) },
    finish(result) {
      this.tick(); this.finished = true; this.result = result; clearInterval(this.ticker)
      if (result === 'win') { this.pending = { level: this.difficulty, seconds: this.seconds, at: Date.now() }; this.saveWin() }
    },
    saveWin() {
      if (!this.pending) return
      try {
        this.progress = skillChallengesStore.save('mines', this.pending.level, { seconds: this.pending.seconds, at: this.pending.at })
        this.pending = null; this.error = ''
      } catch (error) { this.error = '本轮通关记录没能保存，请保留页面后重试：' + error.message }
    },
    home() { uni.switchTab({ url: '/pages/home/index' }) }
  }
}
</script>
<style src="@/styles/family.css"></style>
<style scoped>
.mines-page .intro { display:block; margin:8px 0 14px; color:#526b86; font-size:14px; line-height:1.8; }
.board-head { margin-bottom:10px; font-size:14px; }.board-head .link { padding:0 10px; margin:0; font-size:12px; background:#eef4fc; color:#557399; }.board-head .link.active { background:#2467b5; color:#fff; }
.board-card { padding:12px; }
.mines-grid { display:grid; gap:3px; }
.cell { margin:0; padding:0; height:auto; min-height:0; line-height:1; aspect-ratio:1; display:flex; align-items:center; justify-content:center; min-width:0; font-size:15px; font-weight:700; border-radius:8px; background:#dbe7f6; color:#4a6785; text-align:center; }
.cell.revealed { background:#f2f7fd; border:1px solid #e2ecf7; }
.cell.flagged { background:#fff2cf; }
.cell.boom { background:#fde3de; }
.cell.n1 { color:#3f7fd4; }.cell.n2 { color:#2f8f5b; }.cell.n3 { color:#d2604c; }.cell.n4 { color:#7a5bc4; }.cell.n5,.cell.n6,.cell.n7,.cell.n8 { color:#8a5a2b; }
.result { display:block; margin:14px 0 0; font-size:15px; line-height:1.9; text-align:center; }.result.win { color:#286857; }.result.lose { color:#a5433c; }
.actions { margin-top:14px; }
.tips .heading { display:block; margin-bottom:6px; }.tips .muted { display:block; font-size:13px; line-height:1.9; }
.board-start-note{display:block;text-align:center;font-size:12px;line-height:1.7;margin-top:14px}.difficulty-row{display:flex;gap:6px;margin:16px 0 10px}.difficulty-chip{flex:1;min-width:0;margin:0;padding:10px 3px;line-height:1.5;font-size:13px;color:#476b88;background:#eaf0f8;border:1px solid #d6e3f1;border-radius:12px}.difficulty-chip text{display:block;font-size:10px;margin-top:4px}.difficulty-chip.selected{background:#e0f0ec;border-color:#80b6a5;color:#285f50}.difficulty-hint{display:block;font-size:12px;line-height:1.8;margin-bottom:14px}
</style>
