<template>
  <view class="family-page snake-page">
    <text class="eyebrow">小妙的益智游乐场 · 反应小挑战</text><text class="title">贪吃蛇</text>
    <text class="intro">在棋盘上滑动改变方向，也可以用方向按钮。每吃 3 个苹果提速一级，先想好下一次转弯。</text>
    <text v-if="error" class="error">{{ error }}</text>
    <view class="row board-head">
      <text class="muted">Lv.{{ snake ? Math.floor(snake.score/30)+1 : 1 }} · 长度 {{ snake ? snake.cells.length : 3 }}</text>
      <text class="muted">得分 {{ snake ? snake.score : 0 }}</text>
      <text v-if="best" class="muted">{{ best }}</text>
    </view>
    <view class="card board-card">
      <view class="snake-grid" @touchstart.stop="swipeStart" @touchmove.stop.prevent="noop" @touchend="swipeEnd" @touchcancel="swipe=null">
        <view v-for="(cell, index) in flatCells" :key="index" :class="['scell', cell]"></view>
      </view>
      <text v-if="over" class="result">小蛇到了 {{ snake.score }} 分、{{ snake.cells.length }} 节。{{ deathReason==='wall'?'这次撞到了边界，下次提前一个格子转弯试试。':'这次碰到了自己的身体，试着留出回转空间。' }}</text>
      <view class="actions"><button class="primary" @click="start">{{ over || !snake ? '开始新的一局' : (running ? '暂停' : '继续') }}</button></view>
      <template v-if="snake && running">
        <view class="pad"><text></text><button @click="go('up')">↑ 上</button><text></text></view>
        <view class="pad"><button @click="go('left')">← 左</button><button @click="go('down')">↓ 下</button><button @click="go('right')">右 →</button></view>
      </template>
    </view>
    <button class="link" @click="home">今天先到这里</button>
  </view>
</template>
<script>
import { createSnake, turn, step, SNAKE_COLS, SNAKE_ROWS } from '@/game/snake.mjs'
import { arcadeStore } from '@/services/arcade.js'
import { bestText } from '@/game/arcade-progress.mjs'
export default {
  data() { return { snake: null, cols: SNAKE_COLS, running: false, over: false, best: '', error: '', ticker: null,swipe:null,deathReason:'' } },
  computed: {
    flatCells() {
      if (!this.snake) return Array.from({ length: SNAKE_ROWS * SNAKE_COLS }, () => '')
      const view = Array.from({ length: SNAKE_ROWS * SNAKE_COLS }, () => '')
      for (const cell of this.snake.cells) view[cell.y * SNAKE_COLS + cell.x] = 'body'
      const head = this.snake.cells[0]
      view[head.y * SNAKE_COLS + head.x] = 'head'
      if (this.snake.food) view[this.snake.food.y * SNAKE_COLS + this.snake.food.x] = 'food'
      return view
    }
  },
  onLoad() { this.readBest() },
  onHide() { this.running = false; clearInterval(this.ticker) },
  onUnload() { clearInterval(this.ticker) },
  methods: {
    noop(){},swipeStart(e){if(!this.running)return;const t=e.touches[0];this.swipe={x:t.clientX,y:t.clientY}},swipeEnd(e){const a=this.swipe;this.swipe=null;if(!a||!this.running)return;const t=e.changedTouches[0],dx=t.clientX-a.x,dy=t.clientY-a.y;if(Math.max(Math.abs(dx),Math.abs(dy))<15)return;this.go(Math.abs(dx)>Math.abs(dy)?(dx>0?'right':'left'):(dy>0?'down':'up'))},
    readBest() { try { this.best = bestText(arcadeStore.read(), 'snake'); this.error = '' } catch (error) { this.error = error.message } },
    start() {
      if (this.snake && !this.over) {
        this.running = !this.running
        if (!this.running) clearInterval(this.ticker)
        else this.setTicker()
        return
      }
      this.snake = createSnake(Math.random)
      this.over = false
      this.running = true
      this.error = ''
      this.setTicker()
    },
    setTicker() { clearInterval(this.ticker); this.ticker = setInterval(this.tick, Math.max(160,600-Math.floor(this.snake.score/30)*40)) },
    go(direction) {
      if (!this.snake || this.over) return
      this.snake = turn(this.snake, direction)
    },
    tick() {
      if (!this.running || this.over) return
      try {
        const result = step(this.snake, Math.random)
        this.snake = result.snake
        if(result.ate)this.setTicker()
        if (result.dead) {
          this.deathReason=result.reason
          this.over = true
          this.running = false
          clearInterval(this.ticker)
          try { arcadeStore.save('snake', this.snake.score, Date.now()); this.readBest(); this.error = '' }
          catch (error) { this.error = '这次成绩没能保存：' + error.message }
        }
      } catch (error) { this.error = error.message; clearInterval(this.ticker) }
    },
    home() { uni.switchTab({ url: '/pages/home/index' }) }
  }
}
</script>
<style src="@/styles/family.css"></style>
<style scoped>
.snake-page .intro { display:block; margin:8px 0 14px; color:#526b86; font-size:14px; line-height:1.8; }
.board-head { margin-bottom:10px; font-size:14px; }
.board-card { padding:12px; }
.snake-grid { touch-action:none; display:grid; grid-template-columns:repeat(14, 1fr); gap:2px; background:#eef4fa; padding:6px; border-radius:12px; }
.scell { width:100%; aspect-ratio:1; border-radius:3px; background:#fff; }
.scell.head { background:#2f8f5b; }
.scell.body { background:#8fd0ae; }
.scell.food { background:#e07a6a; border-radius:50%; }
.result { display:block; margin-top:12px; font-size:14px; line-height:1.8; color:#526b86; }
.actions { margin-top:12px; }
.pad { display:flex; gap:8px; margin-top:10px; }.pad button { flex:1; margin:0; background:#e8f0fa; color:#355f88; font-size:15px; }.pad text { flex:1; }
</style>
