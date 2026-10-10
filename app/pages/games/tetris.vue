<template>
  <view class="family-page tetris-page">
    <text class="eyebrow">小妙的益智游乐场 · 手眼协调</text><text class="title">俄罗斯方块</text>
    <text class="intro">移动和旋转下落的方块，把整行填满就能消掉得分。<br />方块是七种一轮慢慢来，不着急，先想好放在哪里。</text>
    <text v-if="error" class="error">{{ error }}</text>
    <view class="row board-head">
      <text class="muted">得分 {{ score }}</text>
      <text class="muted">消了 {{ lines }} 行</text>
      <text v-if="best" class="muted">{{ best }}</text>
    </view>
    <view class="card board-card">
      <view class="play-area">
        <view class="tetris-grid">
          <view v-for="(row, r) in displayBoard" :key="r" class="tetris-row">
            <view v-for="(cell, c) in row" :key="c" :class="['tcell', 't' + cell]"></view>
          </view>
        </view>
        <view class="side">
          <text class="muted">下一个</text>
          <view class="preview">
            <view v-for="(row, r) in previewRows" :key="r" class="tetris-row">
              <view v-for="(cell, c) in row" :key="c" :class="['tcell', 't' + cell, 'small']"></view>
            </view>
          </view>
          <text class="muted side-note">先想好再放，<br />洞越少越好。</text>
        </view>
      </view>
      <text v-if="over" class="result">这一局到 {{ score }} 分，消了 {{ lines }} 行。看看哪里堆出了洞，再来一局会更顺。</text>
      <view class="actions"><button class="primary" @click="start">{{ over || !started ? '开始新的一局' : (running ? '暂停' : '继续') }}</button></view>
      <template v-if="started && !over">
        <view class="pad">
          <button @click="move(-1)">← 左移</button>
          <button @click="rotate">⟳ 旋转</button>
          <button @click="move(1)">右移 →</button>
        </view>
        <view class="pad"><button class="drop" @click="drop">↓ 落到底</button></view>
      </template>
    </view>
    <button class="link" @click="home">今天先到这里</button>
  </view>
</template>
<script>
import { emptyBoard, bagPiece, collides, rotatePiece, merge, clearLines, lineScore, TETRIS_COLS, TETRIS_ROWS } from '@/game/tetris.mjs'
import { arcadeStore } from '@/services/arcade.js'
import { bestText } from '@/game/arcade-progress.mjs'
export default {
  data() { return { board: emptyBoard(), piece: null, nextPiece: null, queue: [], score: 0, lines: 0, started: false, running: false, over: false, best: '', error: '', ticker: null } },
  computed: {
    displayBoard() {
      const view = this.board.map(row => [...row])
      if (this.piece) for (let r = 0; r < this.piece.shape.length; r += 1) for (let c = 0; c < this.piece.shape[r].length; c += 1) {
        if (this.piece.shape[r][c] && this.piece.y + r < TETRIS_ROWS) view[this.piece.y + r][this.piece.x + c] = this.piece.color
      }
      return view
    },
    previewRows() { return this.nextPiece ? this.nextPiece.shape : [[0, 0, 0, 0]] }
  },
  onLoad() { this.readBest() },
  onHide() { this.running = false; clearInterval(this.ticker) },
  onUnload() { clearInterval(this.ticker) },
  methods: {
    readBest() { try { this.best = bestText(arcadeStore.read(), 'tetris'); this.error = '' } catch (error) { this.error = error.message } },
    start() {
      if (this.started && !this.over) {
        this.running = !this.running
        if (!this.running) clearInterval(this.ticker)
        else this.setTicker()
        return
      }
      this.board = emptyBoard()
      this.score = 0
      this.lines = 0
      this.over = false
      this.error = ''
      const first = bagPiece([], Math.random)
      const second = bagPiece(first.queue, Math.random)
      this.piece = first.piece
      this.queue = second.queue
      this.nextPiece = second.piece
      this.started = true
      this.running = true
      this.setTicker()
    },
    setTicker() { clearInterval(this.ticker); this.ticker = setInterval(this.tick, 700) },
    tick() {
      if (!this.running || this.over) return
      if (!collides(this.board, this.piece, 0, 1)) this.piece = { ...this.piece, y: this.piece.y + 1 }
      else this.settle()
    },
    move(dx) {
      if (!this.running || this.over) return
      if (!collides(this.board, this.piece, dx, 0)) this.piece = { ...this.piece, x: this.piece.x + dx }
    },
    rotate() {
      if (!this.running || this.over) return
      this.piece = rotatePiece(this.board, this.piece)
    },
    drop() {
      if (!this.running || this.over) return
      while (!collides(this.board, this.piece, 0, 1)) this.piece = { ...this.piece, y: this.piece.y + 1 }
      this.settle()
    },
    settle() {
      const merged = merge(this.board, this.piece)
      const result = clearLines(merged)
      this.board = result.board
      this.score += lineScore(result.lines)
      this.lines += result.lines
      const spawned = bagPiece(this.queue, Math.random)
      this.piece = this.nextPiece
      this.nextPiece = spawned.piece
      this.queue = spawned.queue
      if (collides(this.board, this.piece, 0, 0)) {
        this.over = true
        this.running = false
        clearInterval(this.ticker)
        try { arcadeStore.save('tetris', this.score, Date.now()); this.readBest(); this.error = '' }
        catch (error) { this.error = '这次成绩没能保存：' + error.message }
      }
    },
    home() { uni.switchTab({ url: '/pages/home/index' }) }
  }
}
</script>
<style src="@/styles/family.css"></style>
<style scoped>
.tetris-page .intro { display:block; margin:8px 0 14px; color:#526b86; font-size:14px; line-height:1.8; }
.board-head { margin-bottom:10px; font-size:14px; }
.board-card { padding:12px; }
.play-area { display:flex; gap:12px; align-items:flex-start; }
.tetris-grid { display:grid; grid-template-rows:repeat(18, 1fr); gap:2px; background:#22364a; padding:4px; border-radius:12px; }
.tetris-row { display:grid; grid-template-columns:repeat(10, 1fr); gap:2px; }
.tcell { width:16px; height:16px; border-radius:3px; background:#33475c; }
.tcell.small { width:12px; height:12px; }
.t1 { background:#5bd0d8; }.t2 { background:#e8c84f; }.t3 { background:#b48ae0; }.t4 { background:#71c878; }.t5 { background:#e07a6a; }.t6 { background:#6a94e0; }.t7 { background:#e0a35a; }
.side { display:flex; flex-direction:column; gap:8px; }.side-note { font-size:12px; line-height:1.8; }
.preview { display:inline-grid; gap:2px; background:#eef4fc; padding:6px; border-radius:10px; }
.result { display:block; margin-top:12px; font-size:14px; line-height:1.8; color:#526b86; }
.actions { margin-top:12px; }
.pad { display:flex; gap:8px; margin-top:10px; }.pad button { flex:1; margin:0; background:#e8f0fa; color:#355f88; font-size:15px; }.pad .drop { background:#e4eefc; }
</style>
