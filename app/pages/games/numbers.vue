<template>
  <view class="family-page number-game">
    <text class="eyebrow">小妙的益智游乐场 · 不计时</text><text class="title">数字搭桥</text>
    <text v-if="error" class="error">{{ error }}</text><button v-if="pending.length" class="secondary" @click="retryPending">重试保存完成标记</button>
    <template v-if="!level"><text class="intro">选两张牌，做一次运算，变成一张新牌。<br />把所有牌用完，搭到目标数。随时能撤回。</text>
      <view class="welcome-card"><image src="/static/puzzle/robot-miao.png" mode="aspectFit" /><view><text class="heading">一座桥，可以有不同走法</text><text class="muted">前 6 关只用加减，后 6 关加入乘除。<br />已完成 {{ completed.length }} / {{ levels.length }} 关</text></view></view>
      <view v-for="group in groups" :key="group" class="group"><text class="heading">{{ group }}</text><view class="level-grid"><button v-for="item in levels.filter(item=>item.group===group)" :key="item.id" class="level-button" @click="start(item)"><text class="level-target">{{ item.target }}</text><text>{{ item.title }}</text><text class="muted">{{ completed.includes(item.id) ? '✓ 已搭好' : item.numbers.join(' · ') }}</text></button></view></view>
      <text class="muted footer">所有关卡都能直接玩。完成标记保存在本机，<br />每次进入关卡从头开始，可以换一种解法。</text>
    </template>
    <template v-else>
      <view class="row level-heading"><text class="pill">{{ level.group }}</text><button class="link" @click="backToLevels">← 选关</button></view><text class="heading">{{ level.title }}</text>
      <view class="bridge" :class="{ built:won }"><view class="bridge-start"><image src="/static/puzzle/robot-miao.png" mode="aspectFit" /><text>小妙</text></view><view v-for="i in level.numbers.length-1" :key="i" class="bridge-step" :class="{ placed:history.length>=i }">{{ history.length>=i ? '✓' : '·' }}</view><view class="destination"><text>目标</text><text class="target">{{ level.target }}</text></view></view>
      <text class="muted rule">每张牌都要用一次，只保留 0～999 的整数结果。<br />减法、除法的先后顺序很重要；除法只做整除。</text>
      <view class="card board"><text class="heading">{{ won ? '桥搭好了！' : '依次点两张牌' }}</text><view class="number-tiles"><button v-for="tile in tiles" :key="tile.id" :class="['number-tile',{selected:chosen.includes(tile.id)}]" :disabled="won" @click="pick(tile.id)"><text class="selection-order">{{ chosen.includes(tile.id) ? `第 ${chosen.indexOf(tile.id)+1} 张` : '数字牌' }}</text><text class="tile-value">{{ tile.value }}</text></button></view>
        <template v-if="!won"><view class="operators"><button v-for="op in level.operators" :key="op" :class="{chosen:operator===op}" @click="operator=op; hint=''; feedback=''">{{ op }}</button></view><text class="equation">{{ selectedValue(0) }} {{ operator }} {{ selectedValue(1) }} = ?</text><button class="primary combine" :disabled="chosen.length!==2" @click="merge">合成一张牌</button></template>
        <text v-if="feedback" class="feedback">{{ feedback }}</text><view class="actions"><button class="secondary" :disabled="!history.length" @click="undo">撤回一步</button><button class="secondary" @click="reset">重新搭</button></view><button v-if="!won" class="link hint-button" @click="showHint">给我一点提示</button><text v-if="hint" class="hint">{{ hint }}</text>
      </view>
      <view v-if="history.length" class="card steps"><text class="heading">我搭过的步骤</text><text v-for="(step,index) in history" :key="index" class="step">{{ index+1 }}. {{ step.text }}</text></view>
      <view v-if="won" class="card success"><text class="heading">{{ tiles[0].expression }} = {{ level.target }}</text><text class="muted">和家长说说：为什么先算这一步？<br />还可以用别的顺序搭出同一个目标吗？</text><text class="muted">{{ saveFailed ? '这次完成标记尚未保存，请重试。' : '完成标记已保存在本机。' }}</text><button class="primary" @click="backToLevels">回到选关，自己决定下一步</button></view>
      <button class="link" @click="home">今天先到这里</button>
    </template>
  </view>
</template>
<script>
import { numberLevels } from '@/data/number-levels.mjs'
import { initialTiles, mergeTiles, reachedTarget, solveNumbers } from '@/game/numbers.mjs'
import { familyGameStore } from '@/services/family.js'
export default {
  data() { return { levels:numberLevels, groups:[...new Set(numberLevels.map(item=>item.group))], level:null, tiles:[], history:[], chosen:[], operator:'+', hint:'', feedback:'', completed:[], error:'', pending:[] } },
  computed: { saveFailed() { return this.pending.includes(this.level?.id) }, won() { return !!this.level && reachedTarget(this.tiles,this.level.target) } },
  onLoad() { try { this.completed=familyGameStore.read().bridges } catch(error) { this.error=error.message } },
  methods: {
    start(level) { this.level=level; this.reset() },
    reset() { this.tiles=initialTiles(this.level.numbers); this.history=[]; this.chosen=[]; this.operator='+'; this.hint=''; this.feedback=''; uni.pageScrollTo({scrollTop:0,duration:0}) },
    pick(id) { if(this.won) return; this.feedback=''; this.hint=''; if(this.chosen.includes(id)) this.chosen=this.chosen.filter(value=>value!==id); else if(this.chosen.length<2) this.chosen.push(id); else this.feedback='已经选好两张。点已选的牌可取消，再换一张。' },
    selectedValue(index) { return this.tiles.find(tile=>tile.id===this.chosen[index])?.value ?? '□' },
    merge() {
      if(this.chosen.length!==2 || this.won) return
      try {
        const next=mergeTiles(this.tiles,this.chosen[0],this.chosen[1],this.operator,this.level.operators)
        this.history.push({tiles:this.tiles,text:`${this.selectedValue(0)} ${this.operator} ${this.selectedValue(1)} = ${next[next.length-1].value}`})
        this.tiles=next; this.chosen=[]; this.hint=''; this.feedback=this.tiles.length===1&&!this.won ? `现在得到 ${this.tiles[0].value}，目标是 ${this.level.target}。撤回一步，换个办法吧。` : ''
        if(this.won) this.saveWin()
      } catch(error) { this.feedback=error.message }
    },
    undo() { if(!this.history.length) return; this.tiles=this.history.pop().tiles; this.chosen=[]; this.hint=''; this.feedback='' },
    showHint() { const solution=solveNumbers(this.tiles,this.level.target,this.level.operators); this.hint=solution===null ? '从现在的数字暂时搭不到目标，试着撤回一步。' : solution.length ? `可以先试：${solution[0].text}。这只是一条可行路线。` : '已经到达目标了。' },
    saveWin() { if(this.won) this.persist(this.level.id) },
    persist(id) { try { this.completed=familyGameStore.mark('bridges',id).bridges; this.pending=this.pending.filter(value=>value!==id); this.error=this.pending.length ? '还有完成标记未保存，请重试。' : '' } catch(error) { if(!this.pending.includes(id)) this.pending.push(id); this.error='这次完成标记没能保存，请重试。' } },
    retryPending() { for(const id of [...this.pending]) this.persist(id) },
    backToLevels() { this.level=null; uni.pageScrollTo({scrollTop:0,duration:0}) },
    home() { uni.switchTab({url:'/pages/home/index'}) }
  }
}
</script>
<style src="@/styles/family.css"></style>
<style scoped>
.welcome-card { display:flex; align-items:center; gap:12px; margin-bottom:24px; background:#e8f4ee; padding:12px; border-radius:18px; }.welcome-card image { flex-shrink:0; width:70px; height:90px; }.welcome-card .heading { font-size:14px; margin-bottom:5px; }.group { margin:24px 0; }.level-grid { display:grid; grid-template-columns:repeat(2,1fr); gap:12px; }.level-button { width:100%; margin:0; padding:14px 8px; background:#fff; color:#3d648e; font-size:12px; line-height:1.8; border:1px solid #dce8f4; border-bottom:3px solid #dce8f4; }.level-target { display:block; color:#2c7062; font-size:30px; font-weight:700; }.level-heading { margin-top:15px; }.bridge { display:flex; align-items:center; justify-content:center; gap:10px; padding:22px 12px; margin:12px 0; background:linear-gradient(#e7f2ff 0%,#e7f2ff 62%,#cae5f2 62%,#dceef8 100%); border-radius:22px; }.bridge-start image { display:block; width:45px; height:55px; margin:0 auto; }.bridge-start { font-size:13px; color:#446c98; }.bridge-step { position:relative; flex:1; max-width:60px; height:28px; text-align:center; background:#d6e2f0; border-bottom:5px solid #becfe3; border-radius:8px; color:#5a697a; }.bridge-step::after { content:""; position:absolute; left:18%; right:18%; top:100%; height:18px; border-left:3px solid #9bb4ca; border-right:3px solid #9bb4ca; }.bridge-step.placed { background:#bce3d3; border-color:#76b9a0; color:#32755f; }.destination { text-align:center; font-size:12px; color:#446f8b; }.target { display:block; font-size:32px; font-weight:700; }.rule { font-size:12px; text-align:center; margin:17px 0; }.board { text-align:center; }.number-tiles { display:flex; gap:10px; justify-content:center; }.number-tile { flex:1; max-width:95px; padding:9px 4px; margin:0; color:#3b6da7; background:#edf4ff; border:2px solid transparent; line-height:1.6; }.number-tile.selected { border-color:#4488dd; background:#dceaff; }.selection-order { display:block; font-size:12px; }.tile-value { display:block; font-size:30px; font-weight:700; }.operators { display:flex; justify-content:center; gap:10px; margin-top:20px; }.operators button { flex:1; max-width:60px; margin:0; font-size:25px; background:#f1f5fb; color:#4d6888; line-height:45px; }.operators .chosen { background:#4287e4; color:#fff; }.equation { display:block; margin:20px 0; font-size:22px; color:#3f698b; }.feedback,.hint { display:block; font-size:13px; line-height:1.8; padding:12px; margin-top:14px; border-radius:12px; background:#fff4de; color:#846332; }.step { display:block; font-size:16px; margin:10px 0; }.success { background:#ecf7f0; }.success .heading { overflow-wrap:anywhere; line-height:1.8; }.success button { margin-top:20px; font-size:12px; }.footer { text-align:center; font-size:12px; }
</style>
