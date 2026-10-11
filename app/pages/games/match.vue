<template>
  <view class="family-page match-page">
    <text class="eyebrow">小妙的益智游乐场 · 找规律</text><text class="title">消消乐</text>
    <text class="intro">点两个上下左右相邻的水果交换位置，凑成三个一样就消掉。<br />连着消有加成分；没有能消的时候，水果盘会自己重新排一排。</text>
    <view class="level-strip"><button v-for="(item,i) in levels" :key="i" :disabled="i+1>progress.unlocked" :class="{active:level===i+1}" @click="chooseLevel(i+1)">{{ i+1>progress.unlocked ? '锁' : i+1 }}</button></view>
    <text class="level-title">第 {{ level }} / 12 关 · {{ levels[level-1].name }} · 目标 {{ levels[level-1].target }} 分</text>
    <text v-if="error" class="error">{{ error }}</text>
    <view class="row board-head">
      <text class="muted">得分 {{ score }}</text>
      <text class="muted">还剩 {{ movesLeft }} 步</text>
      <text v-if="best" class="muted">{{ best }}</text>
    </view>
    <view class="card board-card">
      <view class="match-grid">
        <button v-for="(cell, index) in flatCells" :key="index"
          :class="['fruit', { chosen: isSelected(Math.floor(index / matchCols), index % matchCols) }]"
          :disabled="finished"
          @click="tap(Math.floor(index / matchCols), index % matchCols)">{{ cell }}</button>
      </view>
      <text v-if="feedback" class="feedback">{{ feedback }}</text>
      <view class="actions">
        <button class="primary" @click="start">{{ finished ? '重试本关' : (grid ? '重新开始' : '开始游戏') }}</button>
        <button v-if="grid && !finished" class="secondary" @click="showHint">找一找</button>
      </view>
      <text v-if="hint" class="hint">{{ hint }}</text>
      <view v-if="finished" class="result-card">
        <text class="result-title">{{ passed ? '过关啦！' : '步数用完了，再试一次' }} 得到 {{ score }} 分</text>
        <button v-if="passed && level<12" class="primary" @click="nextLevel">下一关</button><text v-if="passed && level===12" class="muted">12 关全部完成，果园探险成功！</text>
        <text class="muted">和家长说说：哪一次连消最痛快？是怎么找到的？</text>
      </view>
    </view>
    <button class="link" @click="home">今天先到这里</button>
  </view>
</template>
<script>
import { createGrid, findMatches, swapped, resolveBoard, hasMoves, reshuffle, TILES, MATCH_COLS } from '@/game/match.mjs'
import { arcadeStore } from '@/services/arcade.js'
import { bestText } from '@/game/arcade-progress.mjs'
import { MATCH_LEVELS, MATCH_LEVEL_KEY, readMatchLevels, unlockMatchLevel } from '@/game/match-levels.mjs'
const TOTAL_MOVES = 18
export default {
  data() { return { levels:MATCH_LEVELS,progress:{version:1,unlocked:1},level:1,passed:false,grid: null, matchCols: MATCH_COLS, selected: null, score: 0, movesLeft: TOTAL_MOVES, finished: false, feedback: '', hint: '', best: '', error: '' } },
  computed: {
    flatCells() { return this.grid ? this.grid.flat().map(kind => TILES[kind]) : Array.from({ length: 64 }, () => '❔') }
  },
  onLoad() { this.readBest();try{this.progress=readMatchLevels(uni.getStorageSync(MATCH_LEVEL_KEY));this.level=this.progress.unlocked}catch(e){this.error=e.message} },
  methods: {
    chooseLevel(level){if(level>this.progress.unlocked)return;this.level=level;this.start()},
    saveProgress(){const current=readMatchLevels(uni.getStorageSync(MATCH_LEVEL_KEY));const next=unlockMatchLevel(current,this.level);uni.setStorageSync(MATCH_LEVEL_KEY,next);this.progress=next},
    nextLevel(){try{this.saveProgress();this.level+=1;this.start()}catch(e){this.error='关卡进度没能保存：'+e.message}},
    readBest() { try { this.best = bestText(arcadeStore.read(), 'match'); this.error = '' } catch (error) { this.error = error.message } },
    isSelected(row, col) { return !!this.selected && this.selected.row === row && this.selected.col === col },
    start() {
      this.grid = createGrid(Math.random)
      if(!hasMoves(this.grid))this.grid=reshuffle(this.grid,Math.random)
      this.selected = null
      this.score = 0
      this.movesLeft = this.levels[this.level-1].moves
      this.passed=false
      this.finished = false
      this.feedback = ''
      this.hint = ''
      this.error = ''
    },
    tap(row, col) {
      if (!this.grid || this.finished) return
      this.feedback = ''
      this.hint = ''
      if (!this.selected) { this.selected = { row, col }; return }
      if (this.isSelected(row, col)) { this.selected = null; return }
      try {
        const after = swapped(this.grid, this.selected.row, this.selected.col, row, col)
        if (!findMatches(after).size) {
          this.feedback = '这两个换过去凑不成三个，先找找一样的水果排在哪里。'
          this.selected = { row, col }
          return
        }
        const resolved = resolveBoard(after, Math.random)
        this.grid = resolved.grid
        this.score += resolved.cleared * 10 + (resolved.cascades - 1) * 20
        this.movesLeft -= 1
        this.selected = null
        if (!hasMoves(this.grid)) {
          this.grid = reshuffle(this.grid, Math.random)
          this.feedback = '没有能消的排列了，水果盘重新排了排，继续！'
        }
        if (this.score>=this.levels[this.level-1].target||!this.movesLeft) this.finish()
      } catch (error) { this.feedback = error.message }
    },
    showHint() {
      if (!this.grid || this.finished) return
      this.hint = ''
      for (let row = 0; row < this.grid.length; row += 1) for (let col = 0; col < this.grid[row].length; col += 1) {
        for (const [dr, dc] of [[0, 1], [1, 0]]) {
          const r2 = row + dr
          const c2 = col + dc
          if (r2 < this.grid.length && c2 < this.grid[row].length) {
            const after = swapped(this.grid, row, col, r2, c2)
            if (findMatches(after).size) {
              this.hint = `试试第 ${row + 1} 行第 ${col + 1} 个，和它${dc ? '右边' : '下面'}的那个换一换。`
              return
            }
          }
        }
      }
      this.hint = '这一盘暂时找不到，点“重新开始”换一盘吧。'
    },
    finish() {
      this.finished = true
      this.passed=this.score>=this.levels[this.level-1].target
      try { arcadeStore.save('match', this.score, Date.now()); this.readBest(); this.error = '' }
      catch (error) { this.error = '这次成绩没能保存：' + error.message }
      if(this.passed){try{this.saveProgress()}catch(e){this.error='关卡进度没能保存：'+e.message}}
    },
    home() { uni.switchTab({ url: '/pages/home/index' }) }
  }
}
</script>
<style src="@/styles/family.css"></style>
<style scoped>
.level-strip{display:grid;grid-template-columns:repeat(6,1fr);gap:6px;margin:12px 0}.level-strip button{margin:0;padding:0;font-size:14px;background:#e8f0fa;color:#355f88}.level-strip .active{background:#2467b5;color:white}.level-title{display:block;font-size:15px;color:#286857;margin-bottom:12px}
.match-page .intro { display:block; margin:8px 0 14px; color:#526b86; font-size:14px; line-height:1.8; }
.board-head { margin-bottom:10px; font-size:14px; }
.board-card { padding:12px; }
.match-grid { display:grid; grid-template-columns:repeat(8, 1fr); gap:4px; }
.fruit { margin:0; padding:0; height:38px; line-height:38px; font-size:20px; border-radius:9px; background:#f2f7fd; text-align:center; }
.fruit.chosen { background:#ffe9b8; border:2px solid #e8b84f; }
.feedback, .hint { display:block; margin-top:12px; font-size:13px; line-height:1.8; padding:10px 12px; border-radius:12px; background:#fff4de; color:#846332; }
.hint { background:#eaf3ff; color:#3f6a9e; }
.actions { display:flex; gap:10px; margin-top:14px; }.actions button { flex:1; margin:0; }
.result-card { margin-top:14px; padding:14px; background:#ecf7f0; border-radius:14px; }.result-title { display:block; font-size:16px; font-weight:650; color:#286857; margin-bottom:6px; }
</style>
