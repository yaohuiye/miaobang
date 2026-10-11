<template>
  <view class="family-page tetris-page">
    <text class="eyebrow">小妙的益智游乐场 · 手眼协调</text><text class="title">俄罗斯方块</text>
    <text class="intro">左右滑动移动 · 轻点旋转 · 向下滑后松手落到底</text>
    <text v-if="error" class="error">{{ error }}</text>
    <view class="row board-head">
      <text class="muted">得分 {{ score }}</text>
      <text class="muted">消了 {{ lines }} 行</text>
      <text v-if="best" class="muted">{{ best }}</text>
    </view>
    <view class="card board-card">
      <view class="play-area">
        <view class="tetris-grid" :style="{width:boardWidth+'px'}" @touchstart.stop="gestureStart" @touchmove.stop.prevent="gestureMove" @touchend="gestureEnd" @touchcancel="gestureCancel">
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

        </view>
      </view>
      <text v-if="over" class="result">这一局到 {{ score }} 分，消了 {{ lines }} 行。看看哪里堆出了洞，再来一局会更顺。</text>
      <view class="actions"><button class="primary" @click="start">{{ over || !started ? '开始新的一局' : (running ? '暂停' : '继续') }}</button></view>
      <button v-if="started && !over" class="link" @click="buttons=!buttons">{{ buttons ? '收起方向按钮' : '显示备用方向按钮' }}</button>
      <template v-if="started && !over && buttons">
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
  data() { return { board: emptyBoard(), piece: null, nextPiece: null, queue: [], score: 0, lines: 0, started: false, running: false, over: false, best: '', error: '', ticker: null, buttons:false, gesture:null, boardWidth:280 } },
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
  onLoad() { this.readBest();this.measureBoard() },
  onResize(){this.measureBoard()},
  onReady(){this.measureBoard()},
  onHide() { this.gesture=null; this.running = false; clearInterval(this.ticker) },
  onUnload() { clearInterval(this.ticker) },
  methods: {
    measureBoard(){const info=uni.getSystemInfoSync();this.boardWidth=Math.floor(Math.min(350,info.windowWidth-62,Math.max(180,(info.windowHeight-300)/1.8)))},
    gestureCancel(){this.gesture=null},
    gestureStart(e){if(!this.running||this.over)return;const t=e.touches[0];this.gesture={x:t.clientX,y:t.clientY,lastX:t.clientX,moved:false,down:false}},
    gestureMove(e){if(!this.gesture||!this.running)return;const t=e.touches[0],g=this.gesture;const dx=t.clientX-g.lastX,dy=t.clientY-g.y;if(Math.abs(t.clientX-g.x)>10||Math.abs(dy)>10)g.moved=true;if(dy>40&&Math.abs(dy)>Math.abs(t.clientX-g.x))g.down=true;else if(!g.down){const steps=Math.trunc(dx/24);for(let n=0;n<Math.abs(steps);n++)this.move(Math.sign(steps));g.lastX+=steps*24}},
    gestureEnd(){const g=this.gesture;this.gesture=null;if(!g||!this.running)return;if(g.down)this.drop();else if(!g.moved)this.rotate()},
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
.tetris-page .eyebrow{display:none}.tetris-page .title{font-size:23px;margin:0}.tetris-page .intro { display:block; margin:8px 0 14px; color:#526b86; font-size:12px; line-height:1.6; }
.board-head { margin-bottom:10px; font-size:14px; }
.board-card { padding:12px; }
.play-area { display:flex; flex-direction:column-reverse; gap:10px; align-items:center; }
.tetris-grid { width:min(100%, 350px); box-sizing:border-box; aspect-ratio:10 / 18; touch-action:none; display:grid; grid-template-rows:repeat(18, 1fr); gap:2px; background:#22364a; padding:4px; border-radius:12px; }
.tetris-row { display:grid; grid-template-columns:repeat(10, 1fr); gap:2px; }
.tcell { min-width:0; min-height:0; border-radius:3px; background:#33475c; }
.tcell.small { width:12px; height:12px; }
.t1 { background:#5bd0d8; }.t2 { background:#e8c84f; }.t3 { background:#b48ae0; }.t4 { background:#71c878; }.t5 { background:#e07a6a; }.t6 { background:#6a94e0; }.t7 { background:#e0a35a; }
.side { display:flex; align-items:center; gap:10px; }.side-note { font-size:12px; line-height:1.8; }
.preview .tetris-row { grid-template-columns:repeat(4, 1fr); }.preview { display:inline-grid; gap:2px; background:#eef4fc; padding:6px; border-radius:10px; }
.result { display:block; margin-top:12px; font-size:14px; line-height:1.8; color:#526b86; }
.actions { margin-top:12px; }
.pad { display:flex; gap:8px; margin-top:10px; }.pad button { flex:1; margin:0; background:#e8f0fa; color:#355f88; font-size:15px; }.pad .drop { background:#e4eefc; }
</style>
