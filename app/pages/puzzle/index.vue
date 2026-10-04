<template>
  <view class="puzzle-page">
    <view v-if="storageError" class="storage-error"><text>{{ storageError }}</text><button v-if="storageReadable && level" @click="save()">重试保存</button></view>
    <view v-if="!level" class="catalog">
      <view class="brand-line"><text class="brand-mark">妙</text><text>妙帮 · 一起解谜</text><text class="family-tag">亲子时间</text></view>
      <view class="adventure-hero">
        <view class="hero-orbit orbit-one"></view><view class="hero-orbit orbit-two"></view>
        <text class="hero-kicker">小小路线实验室</text>
        <text class="hero-title">和小妙一起<br />把路走出来</text>
        <text class="hero-copy">先想一想，再试一试。</text>
        <button class="hero-start" @click="choose(nextLevel)">{{ completedCount ? '继续探索' : '开始第一关' }} <text>→</text></button>
        <image class="hero-robot" src="/static/puzzle/robot-miao.png" mode="aspectFit" />
        <text class="hero-spark spark-one">✦</text><text class="hero-spark spark-two">＋</text>
        <view class="robot-label">小妙已就位！</view>
      </view>
      <view class="journey"><view class="journey-symbol">⚑</view><view class="journey-copy"><text class="journey-title">我们找到的路</text><text class="muted">所有关卡都能选，按自己的节奏来</text></view><view class="progress-count"><text>{{ completedCount }}</text><text class="progress-total"> / {{ levels.length }}</text></view></view>
      <view v-for="(group, groupIndex) in groups" :key="group" class="group" :class="'chapter-' + groupIndex">
        <view class="group-heading"><text class="group-number">0{{ groupIndex + 1 }}</text><view><text class="group-title">{{ group }}</text><text class="group-description">{{ ['认识方向，迈出第一步', '遇到石头？换个方向试试', '同一个终点，不止一种答案'][groupIndex] }}</text></view></view>
        <view class="level-grid">
          <button v-for="item in levels.filter(entry => entry.group === group)" :key="item.id" class="level-card" :class="{ completed: progress[item.id]?.completed }" @click="choose(item)">
            <view class="card-top"><text class="level-number">{{ String(levels.indexOf(item) + 1).padStart(2, '0') }}</text><text class="card-state">{{ progress[item.id]?.completed ? '✓ 走通啦' : '试试看' }}</text></view>
            <view class="mini-map" aria-hidden="true"><view v-for="(cell, index) in item.rows.join('')" :key="index" class="mini-cell" :class="{ 'mini-wall': cell === '#', 'mini-start': cell === 'S', 'mini-goal': cell === 'G' }"><text v-if="cell === 'S'">●</text><text v-else-if="cell === 'G'">★</text></view></view>
            <view class="card-bottom"><text class="level-name">{{ item.name }}</text><text class="card-arrow">↗</text></view>
          </button>
        </view>
      </view>
      <text class="footer-note">不用赶时间，也不用和谁比较。玩累了，随时休息。</text>
    </view>

    <view v-else>
      <view class="topline"><button class="back" @click="backToLevels">‹ 选关</button><text class="eyebrow">第 {{ levels.indexOf(level) + 1 }} 关 / {{ levels.length }}</text><text class="badge">{{ progress[level.id]?.completed ? '已走通' : level.group }}</text></view>
      <text class="title play-title">{{ level.name }}</text>
      <view class="mission"><image src="/static/puzzle/robot-miao.png" mode="aspectFit" /><text>{{ level.prompt }}</text></view>
      <view class="board-label"><text>小妙的路线地图</text><text :class="{ arrived: outcome === 'success' }">{{ outcome === 'success' ? '★ 到达星星！' : running ? '已走 ' + (activeIndex + 1) + ' 步' : '从蓝色起点出发' }}</text></view>
      <view class="board" aria-label="六行六列路线棋盘">
        <view v-for="(cell, index) in map.cells" :key="index" class="cell" :class="{ wall: cell === '#', start: cell === 'S', goal: cell === 'G', visited: visited.includes(index) && cell === '.', robot: position === index }">
          <image v-if="position === index" class="robot-face" src="/static/puzzle/robot-miao.png" mode="aspectFit" />
          <text v-else-if="cell === 'G'" class="star">★</text>
          <text v-else-if="cell === 'S'" class="start-label">起点</text>
          <view v-else-if="cell === '#'" class="rock"><view></view></view>
          <text v-else-if="visited.includes(index)" class="trail">·</text>
        </view>
      </view>
      <view class="legend"><text><text class="legend-start">●</text> 起点</text><text><text class="legend-goal">★</text> 终点</text><text><text class="legend-wall">■</text> 石头</text></view>
      <view v-if="message" class="feedback" :class="{ success: outcome === 'success' }"><text>{{ message }}</text><text v-if="outcome === 'success'" class="parent-prompt">和家长聊聊：为什么这样走？还可以换一条路吗？</text></view>
      <view class="route-card">
        <view class="route-heading"><text><text class="route-icon">↳</text> 我的路线</text><text class="muted">{{ commands.length }} / {{ maxCommands }} 步</text></view>
        <text v-if="!commands.length" class="empty-route">点下面的方向，给机器人安排每一步。</text>
        <scroll-view v-else scroll-y class="command-scroll">
          <view class="commands"><button v-for="(command, index) in commands" :key="index" class="command" :class="{ current: activeIndex === index, failed: failureIndex === index }" :disabled="running" @click="remove(index)"><text class="command-index">{{ index + 1 }}</text><text>{{ directions[command].arrow }}</text></button></view>
        </scroll-view>
        <view class="route-actions"><text class="muted">点某一步可以删除</text><button :disabled="running || !commands.length" @click="clear">清空路线</button></view>
        <view class="direction-pad"><button v-for="command in ['U', 'D', 'L', 'R']" :key="command" :disabled="running || commands.length >= maxCommands" @click="append(command)"><text class="direction-arrow">{{ directions[command].arrow }}</text><text>{{ directions[command].label }}</text></button></view>
        <button class="run" :disabled="!commands.length || running" @click="run">{{ running ? '小机器人正在试跑…' : '▶ 从起点试跑' }}</button>
        <button v-if="running" class="stop" @click="stop">停一下，改改路线</button>
      </view>
      <view class="hint-card">
        <button :disabled="running" @click="hintLevel = Math.min(hintLevel + 1, 3)">{{ ['想一想，给我一点提示', '再提示一步', '看看一条参考路线', '参考路线已展开'][hintLevel] }}</button>
        <text v-if="hintLevel > 0" class="hint-text">{{ level.observation }}</text>
        <text v-if="hintLevel > 1" class="hint-text">从起点出发，可以先向{{ directions[reference[0]].label }}走一格。</text>
        <text v-if="hintLevel > 2" class="hint-route">{{ reference.map(command => directions[command].arrow).join(' ') }}</text>
        <text v-if="hintLevel > 2" class="muted">这是一条从起点出发的路线，你也可以找到自己的走法。</text>
      </view>
    </view>
  </view>
</template>

<script>
import { LEVELS } from '@/data/puzzle-levels.mjs'
import { parseMap, runRoute, findRoute, DIRECTIONS, MAX_COMMANDS } from '@/game/route.mjs'
import { PROGRESS_KEY, readProgress, updateProgress } from '@/game/progress.mjs'

export default {
  data() {
    return {
      levels: LEVELS, groups: ['认识指令', '观察障碍', '换种走法'], directions: DIRECTIONS,
      maxCommands: MAX_COMMANDS, level: null, map: null, reference: [], commands: [],
      position: 0, visited: [], activeIndex: -1, failureIndex: -1, running: false,
      ticker: null, message: '', outcome: '', hintLevel: 0, progress: {},
      storageError: '', storageReadable: true
    }
  },
  computed: {
    completedCount() { return Object.values(this.progress).filter(record => record.completed).length },
    nextLevel() { return LEVELS.find(level => !this.progress[level.id]?.completed) || LEVELS[0] }
  },
  onLoad() {
    try { this.progress = readProgress(uni.getStorageSync(PROGRESS_KEY), LEVELS.map(level => level.id)) }
    catch (error) {
      this.storageReadable = false
      this.storageError = '已有记录暂时无法读取，本次可以试玩，但不会覆盖原记录。'
    }
  },
  onHide() { this.stopOnLeave() },
  onUnload() { this.stopOnLeave() },
  methods: {
    choose(level) {
      this.level = level
      this.map = parseMap(level.rows)
      this.reference = findRoute(this.map)
      this.commands = [...(this.progress[level.id]?.commands || [])]
      this.hintLevel = 0
      this.resetRun()
      uni.pageScrollTo({ scrollTop: 0, duration: 0 })
    },
    resetRun() {
      clearInterval(this.ticker)
      this.running = false
      this.position = this.map.start
      this.visited = [this.map.start]
      this.activeIndex = -1
      this.failureIndex = -1
      this.outcome = ''
      this.message = ''
    },
    save(completed = false) {
      this.progress = updateProgress(this.progress, this.level.id, this.commands, completed)
      if (!this.storageReadable) return
      try {
        uni.setStorageSync(PROGRESS_KEY, { version: 1, levels: this.progress })
        this.storageError = ''
      } catch (error) { this.storageError = '这次修改还没保存成功，请留在页面稍后重试。'; }
    },
    append(command) {
      if (this.running || this.commands.length >= MAX_COMMANDS) return
      this.commands.push(command)
      this.resetRun()
      this.save()
    },
    remove(index) {
      if (this.running) return
      this.commands.splice(index, 1)
      this.resetRun()
      this.save()
    },
    clear() {
      if (this.running) return
      this.commands = []
      this.resetRun()
      this.save()
    },
    run() {
      if (this.running || !this.commands.length) return
      this.resetRun()
      this.save()
      const result = runRoute(this.map, this.commands)
      let cursor = 0
      this.running = true
      this.ticker = setInterval(() => {
        const step = result.steps[cursor++]
        this.position = step.position
        this.activeIndex = step.index
        if (!step.error) this.visited.push(step.position)
        if (cursor !== result.steps.length) return
        clearInterval(this.ticker)
        this.running = false
        this.outcome = result.outcome
        if (result.outcome === 'success') {
          this.message = '走通啦！这是你找到的一条路。'
          this.save(true)
        } else if (result.outcome === 'unfinished') {
          this.message = '路线走完了，还没到星星。可以再添几步，然后从起点试跑。'
        } else {
          this.failureIndex = result.failedStep - 1
          this.message = `第 ${result.failedStep} 步${result.outcome === 'wall' ? '碰到石头了' : '走出棋盘了'}。机器人停在前一格，改改这一步再试试。`
        }
      }, 380)
    },
    stop() {
      this.resetRun()
      this.message = '已回到起点，路线还在，可以慢慢修改。'
    },
    stopOnLeave() {
      if (this.running) this.stop()
      if (this.level) this.save()
    },
    backToLevels() {
      this.stopOnLeave()
      this.level = null
      uni.pageScrollTo({ scrollTop: 0, duration: 0 })
    }
  }
}
</script>

<style scoped>
.puzzle-page { min-height: 100vh; max-width: 520px; margin: 0 auto; box-sizing: border-box; padding: 20px 18px 36px; background: #f4f8ff; color: #19365c; }
button { border-radius: 14px; font-size: 14px; }
button::after { border: none; }
button[disabled] { opacity: .45; }
.brand-line { display: flex; align-items: center; gap: 8px; font-size: 14px; font-weight: 600; margin-bottom: 18px; }
.brand-mark { display: flex; align-items: center; justify-content: center; width: 28px; height: 28px; color: #fff; background: #4488e4; border-radius: 9px; font-size: 16px; }
.family-tag { margin-left: auto; font-size:12px; font-weight: 400; color:#536b88; }
.adventure-hero { position: relative; isolation: isolate; overflow: hidden; background: #deedff; border-radius: 24px; padding: 24px 20px; height: 228px; box-sizing: border-box; }
.hero-kicker { position: relative; z-index: 2; display: block; color:#4d6c91; font-size:12px; letter-spacing: 2px; margin-bottom: 10px; }
.hero-title { position: relative; z-index: 2; display: block; font-size: 29px; line-height: 1.3; font-weight: 800; letter-spacing: -.8px; }
.hero-copy { position: relative; z-index: 2; display: block; font-size: 12px; color:#536a86; margin-top: 12px; }
.hero-start { position: relative; z-index: 2; margin: 18px 0 0; display: flex; gap: 20px; align-items: center; justify-content: center; background: #2467b5; color: #fff; width: 139px; height: 48px; padding: 0; line-height: 1; box-shadow: 0 4px 0 #2464bc; font-weight: 600; }
.hero-robot { position: absolute; z-index: 1; width: 172px; height: 172px; right: -2px; bottom: 23px; transform: rotate(7deg); }
.hero-orbit { position: absolute; border-radius: 50%; pointer-events: none; }
.orbit-one { width: 225px; height: 225px; right: -86px; top: -40px; border: 1px solid #bed9f7; }
.orbit-two { width: 200px; height: 120px; right: -43px; bottom: -36px; background: #c5ddfa; transform: rotate(-15deg); }
.hero-spark { position: absolute; color:#815f20; font-size: 30px; z-index: 2; }
.spark-one { top: 23px; right: 24px; }
.spark-two { bottom: 64px; right: 142px; font-size: 23px; }
.robot-label { position: absolute; z-index: 2; bottom: 12px; right: 24px; background: #fffaf0; color:#895f22; border: 1px solid #f1dab1; border-radius: 9px; font-size:12px; padding: 5px 9px; transform: rotate(-5deg); }
.journey { display: flex; align-items: center; gap: 11px; padding: 16px 2px; margin: 10px 0 2px; }
.journey-symbol { width: 36px; height: 36px; display: flex; align-items: center; justify-content: center; background: #e4eefc; border-radius: 12px; color:#346ab2; font-size: 25px; }
.journey-copy { flex: 1; }
.journey-title { display: block; font-size: 13px; font-weight: 600; margin-bottom: 2px; }
.muted { color:#56677a; font-size:12px; line-height: 1.7; }
.progress-count { white-space: nowrap; font-size: 25px; font-weight: 700; color:#2c6abc; }
.progress-total { font-size: 12px; font-weight: 400; color:#586777; }
.group { --chapter-color: #2467b5; --chapter-pale: #e9f2ff; margin-top: 22px; }
.chapter-1 { --chapter-color: #267568; --chapter-pale: #e8f7f3; }
.chapter-2 { --chapter-color: #936023; --chapter-pale: #fff5e3; }
.group-heading { display: flex; gap: 11px; align-items: center; margin-bottom: 15px; }
.group-number { display: flex; align-items: center; justify-content: center; width: 34px; height: 38px; border-radius: 10px; background: var(--chapter-color); color: #fff; font-size: 15px; font-weight: 700; transform: rotate(-5deg); box-shadow: 0 3px 0 #19365c12; }
.group-title { display: block; font-size: 18px; font-weight: 700; }
.group-description { display: block; margin-top: 3px; font-size:12px; color:#5c6979; }
.level-grid { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 13px; }
.level-card { margin: 0; width: 100%; padding: 12px; text-align: left; background: #fff; border: 1px solid #dce7f5; border-bottom-width: 4px; border-radius: 17px; line-height: 1.4; }
.level-card:active { transform: translateY(2px); border-bottom-width: 2px; }
.card-top { display: flex; justify-content: space-between; align-items: center; }
.level-number { font-size: 14px; font-weight: 800; color: var(--chapter-color); }
.card-state { color:#5e6a78; font-size:12px; }
.completed .card-state { color:#247163; }
.mini-map { display: grid; grid-template-columns: repeat(6, 1fr); gap: 3px; width: 82px; padding: 8px; background: var(--chapter-pale); border-radius: 10px; margin: 9px auto 13px; transform: rotate(-4deg); }
.mini-cell { aspect-ratio: 1; background: #fff; border-radius: 2px; display: flex; align-items: center; justify-content: center; font-size:12px; line-height: 1; }
.mini-cell.mini-wall { background: #90a6be; box-shadow: 0 1px 0 #69839e; }
.mini-cell.mini-start { background: #74abed; color: #fff; }
.mini-cell.mini-goal { background: #ffcf65; color: #94611c; }
.card-bottom { display: flex; align-items: center; justify-content: space-between; gap: 3px; }
.level-name { font-size: 13px; font-weight: 600; color: #254363; }
.card-arrow { display: flex; align-items: center; justify-content: center; flex-shrink: 0; width: 23px; height: 23px; background: var(--chapter-pale); color: var(--chapter-color); border-radius: 8px; font-size: 16px; }
.footer-note { display: block; text-align: center; margin-top: 28px; font-size:12px; line-height: 1.9; color:#5c6b7d; }
.topline { display: flex; align-items: center; justify-content: space-between; gap: 8px; }
.back { background: #e5effd; margin: 0; padding: 0 12px; color:#3c699e; line-height: 44px; border-radius: 12px; font-size: 12px; }
.eyebrow { color:#53677e; font-size:12px; }
.badge { font-size:12px; padding: 6px 9px; border-radius: 9px; background: #fff0cf; color:#85652a; }
.play-title { display: block; font-size: 27px; font-weight: 800; letter-spacing: -.5px; margin: 14px 0 6px; }
.mission { display: flex; align-items: center; gap: 8px; margin-bottom: 12px; font-size: 12px; line-height: 1.7; color:#566b81; }
.mission image { width: 34px; height: 34px; flex-shrink: 0; background: #e1edfc; border-radius: 12px; }
.board-label { max-width: 310px; margin-left: auto; margin-right: auto; display: flex; justify-content: space-between; padding: 0 3px; font-size:12px; color:#586b7e; margin-bottom: 9px; }
.board-label .arrived { color:#1c7766; font-weight: 600; }
.board { max-width: 310px; box-sizing: border-box; margin: 0 auto; display: grid; grid-template-columns: repeat(6, minmax(0, 1fr)); gap: 5px; padding: 10px; background: #d6e6f9; border: 1px solid #c9dcf4; border-bottom: 6px solid #b5ceee; border-radius: 19px; }
.cell { position: relative; aspect-ratio: 1; display: flex; align-items: center; justify-content: center; border-radius: 8px; background: #f9fcff; border-bottom: 3px solid #c3d8ef; box-sizing: border-box; }
.cell.start { background: #b4d5ff; border-color: #8db8ee; }
.cell.goal { background: #ffdb7b; border-color: #e9b94e; }
.cell.visited { background: #d7eaff; }
.cell.wall { background: #b0c1d5; border-color: #839dbb; }
.rock { width: 70%; height: 65%; background: #809bb8; border-radius: 6px 9px 5px 5px; box-shadow: inset -4px -4px 0 #6f8ca8; transform: rotate(-4deg); }
.rock view { width: 30%; height: 4px; border-radius: 4px; background: #a6bed5; margin: 6px; transform: rotate(-10deg); }
.robot-face { width: 110%; height: 110%; position: absolute; bottom: 1px; z-index: 1; animation: landing .22s ease-out; }
@keyframes landing { from { transform: translateY(-5px) scale(.95); } to { transform: translateY(0) scale(1); } }
.star { color:#906013; font-size: 28px; text-shadow: 0 2px 0 #fff0bd; }
.start-label { color:#39689b; font-size:12px; }
.trail { color:#486789; font-size: 33px; font-weight: 700; }
.legend { display: flex; justify-content: center; gap: 25px; font-size:12px; color:#5a6b7c; margin: 8px 0 12px; }
.legend-start { color:#456b98; }.legend-goal { color:#816121; }.legend-wall { color:#5a6b7b; }
.route-card { background: #fff; border: 1px solid #e0e9f6; border-bottom-width: 3px; border-radius: 19px; padding: 16px; }
.route-heading { display: flex; justify-content: space-between; align-items: center; font-size: 15px; font-weight: 700; }
.route-icon { color:#3469ae; font-size: 21px; margin-right: 4px; }
.empty-route { display: block; color:#5b6673; font-size: 12px; padding: 14px 0; }
.command-scroll { max-height: 146px; margin: 13px 0; }
.commands { display: flex; flex-wrap: wrap; gap: 6px; }
.command { display: flex; flex-direction: column; align-items: center; justify-content: center; width: 44px; height: 46px; margin: 0; padding: 3px; background: #edf4ff; color:#3368ac; font-size: 21px; line-height: 1; border: 1px solid #dce9fb; border-bottom-width: 3px; border-radius: 10px; }
.command-index { font-size:12px; color:#5a6b81; margin-bottom: 2px; }
.command.current { border-color: #3c82de; background: #dcecff; }
.command.failed { border-color: #d69242; background: #fff0d8; color:#895c24; }
.route-actions { display: flex; justify-content: space-between; align-items: center; margin: 4px 0 11px; }
.route-actions button { min-height:44px; font-size:12px; line-height: 2; margin: 0; padding: 2px 6px; background: transparent; color:#5c6b7e; }
.direction-pad { display: grid; grid-template-columns: repeat(4, 1fr); gap: 8px; }
.direction-pad button { display: flex; align-items: center; justify-content: center; gap: 6px; width: 100%; min-height: 48px; background: #e8f1ff; color:#3166ab; padding: 8px 2px; line-height: 1.5; border-bottom: 3px solid #c2d9f8; border-radius: 12px; }
.direction-pad button:active { border-bottom-width: 1px; transform: translateY(2px); }
.direction-arrow { font-size: 23px; }
.run { background: #2467b5; color: #fff; margin-top: 14px; line-height: 46px; font-weight: 600; border-bottom: 4px solid #2c6cbe; }
.run[disabled] { background: #e4edf9; color:#586676; border-color: #d9e6f7; opacity: 1; }
.stop { background: #edf3fc; color:#456c9a; margin-top: 9px; }
.feedback { margin: 0 0 15px; background: #fff0d8; border: 1px solid #f0dcbb; color:#815f29; border-radius: 16px; padding: 14px; font-size: 13px; line-height: 1.8; }
.feedback.success { background: #e5f6ef; color:#26775f; border-color: #c8eadc; }
.parent-prompt { display: block; font-size:12px; margin-top: 5px; }
.hint-card { margin-top: 16px; padding: 12px 16px; border: 1px dashed #c7d9ee; background: #f0f6ff; border-radius: 15px; }
.hint-card button { min-height:44px; margin: 0; background: transparent; color:#506884; font-size: 12px; line-height: 2.3; }
.hint-text { display: block; color:#516b86; font-size: 12px; line-height: 1.9; margin-top: 10px; }
.hint-route { display: block; font-size: 21px; color:#2e66ab; line-height: 1.7; margin: 10px 0; word-break: break-all; }
.storage-error { display: block; color: #994d34; background: #ffeddf; padding: 12px; border-radius: 12px; font-size: 12px; margin-bottom: 16px; line-height: 1.7; }
@media (max-width: 360px) { .puzzle-page { padding-left: 13px; padding-right: 13px; }.hero-title { font-size: 26px; }.hero-robot { width: 145px; right: -8px; }.hero-start { width: 130px; }.hero-copy { font-size:12px; }.journey .muted { font-size:12px; }.level-name { font-size: 12px; } }
@media (prefers-reduced-motion: reduce) { .robot-face { animation: none; } }
</style>
