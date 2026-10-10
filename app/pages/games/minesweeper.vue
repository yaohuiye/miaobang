<template>
  <view class="family-page mines-page">
    <text class="eyebrow">小妙的益智游乐场 · 数字推理</text><text class="title">扫雷</text>
    <text class="intro">点开安全的格子，旁边的数字告诉你周围有几颗雷。<br />第一次点开永远安全；觉得有雷就切到插旗模式做个记号。</text>
    <text v-if="error" class="error">{{ error }}</text>
    <view class="row board-head">
      <text class="muted">🚩 剩余 {{ minesLeft }}</text>
      <text class="muted">⏱ {{ seconds }} 秒</text>
      <button :class="['link', { active: flagMode }]" @click="flagMode = !flagMode">{{ flagMode ? '🚩 插旗模式(关闭)' : '🚩 插旗模式' }}</button>
    </view>
    <view class="card board-card">
      <view class="mines-grid">
        <button v-for="(cell, index) in displayCells" :key="index"
          :class="['cell', cell.state, 'n' + cell.count]"
          :disabled="finished"
          @click="tap(Math.floor(index / boardCols), index % boardCols)">{{ cell.text }}</button>
      </view>
      <text v-if="result === 'win'" class="result win">🎉 排雷成功！{{ seconds }} 秒完成，数字都帮了大忙。</text>
      <text v-else-if="result === 'lose'" class="result lose">碰到雷了。看一看数字：每个数字都数着自己的 8 个邻居，<br />再开一局，先从 0 旁边的格子点起。</text>
      <view class="actions"><button class="primary" @click="start">{{ finished || board ? '再来一局' : '开始扫雷' }}</button></view>
    </view>
    <view class="card tips"><text class="heading">小窍门</text><text class="muted">1 是旁边的 8 个格里只有 1 颗雷；0 的四周全安全。<br />先把所有 0 和它们旁边的格子点开，剩下的慢慢推。</text><text v-if="best" class="muted">本机纪录：{{ best }}</text></view>
    <button class="link" @click="home">今天先到这里</button>
  </view>
</template>
<script>
import { createBoard, reveal, toggleFlag, flagsUsed, isWon, isLost, MINES_COLS } from '@/game/minesweeper.mjs'
import { arcadeStore } from '@/services/arcade.js'
import { bestText } from '@/game/arcade-progress.mjs'
export default {
  data() { return { board: null, boardCols: MINES_COLS, flagMode: false, seconds: 0, finished: false, result: '', best: '', error: '', ticker: null, startedAt: 0 } },
  computed: {
    minesLeft() { return this.board ? this.board.mines - flagsUsed(this.board) : 8 },
    displayCells() {
      if (!this.board) return Array.from({ length: 64 }, () => ({ state: 'hidden', count: 0, text: '' }))
      return this.board.cells.map(cell => ({
        state: cell.state === 'hidden' && cell.mine && this.result === 'lose' ? 'boom' : cell.state,
        count: cell.count,
        text: cell.state === 'flagged' ? '🚩' : cell.state === 'revealed' ? (cell.mine ? '💥' : (cell.count || '')) : ''
      }))
    }
  },
  onLoad() { this.readBest() },
  onShow() { if (this.board && !this.finished) this.setTicker() },
  onUnload() { clearInterval(this.ticker) },
  onHide() { clearInterval(this.ticker) },
  methods: {
    readBest() { try { this.best = bestText(arcadeStore.read(), 'mines'); this.error = '' } catch (error) { this.error = error.message } },
    start() {
      this.board = null
      this.finished = false
      this.result = ''
      this.seconds = 0
      this.error = ''
      clearInterval(this.ticker)
    },
    tap(row, col) {
      if (this.finished) return
      try {
        if (!this.board) {
          this.board = createBoard(Math.random, row, col)
          this.startedAt = Date.now()
          this.setTicker()
        }
        const board = this.flagMode ? toggleFlag(this.board, row, col) : reveal(this.board, row, col).board
        this.board = board
        if (isLost(board)) { this.finish('lose'); return }
        if (isWon(board)) this.finish('win')
      } catch (error) { this.error = error.message }
    },
    tick() { if (!this.finished) this.seconds = Math.floor((Date.now() - this.startedAt) / 1000) },
    setTicker() { clearInterval(this.ticker); this.tick(); this.ticker = setInterval(this.tick, 1000) },
    finish(result) {
      this.finished = true
      this.result = result
      clearInterval(this.ticker)
      if (result === 'win') {
        try { arcadeStore.save('mines', this.seconds, Date.now()); this.readBest(); this.error = '' }
        catch (error) { this.error = '这次成绩没能保存：' + error.message }
      }
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
.mines-grid { display:grid; grid-template-columns:repeat(8, 1fr); gap:3px; }
.cell { margin:0; padding:0; height:38px; line-height:38px; font-size:15px; font-weight:700; border-radius:8px; background:#dbe7f6; color:#4a6785; text-align:center; }
.cell.revealed { background:#f2f7fd; border:1px solid #e2ecf7; }
.cell.flagged { background:#fff2cf; }
.cell.boom { background:#fde3de; }
.cell.n1 { color:#3f7fd4; }.cell.n2 { color:#2f8f5b; }.cell.n3 { color:#d2604c; }.cell.n4 { color:#7a5bc4; }.cell.n5,.cell.n6,.cell.n7,.cell.n8 { color:#8a5a2b; }
.result { display:block; margin:14px 0 0; font-size:15px; line-height:1.9; text-align:center; }.result.win { color:#286857; }.result.lose { color:#a5433c; }
.actions { margin-top:14px; }
.tips .heading { display:block; margin-bottom:6px; }.tips .muted { display:block; font-size:13px; line-height:1.9; }
</style>
