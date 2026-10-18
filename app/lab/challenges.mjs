import { EXPERIMENTS, observe } from './experiments.mjs'
export const LAB_CHALLENGES_KEY = 'miaobang.lab-challenges.v1'
export const LAB_TASKS = [
  { id:'shadow-1', experiment:'shadow', level:1, title:'影子放大挑战', instruction:'灯到屏幕固定 100 厘米。请把影子调到物体的 4 倍，再记录条件。', initial:{distance:50}, target:'影子放大倍数达到 4', type:'goal' },
  { id:'shadow-2', experiment:'shadow', level:2, title:'一远一近做对照', instruction:'分别记录物体离灯 40 厘米、80 厘米时的影子。只改变物体离灯的距离，比较放大倍数。', initial:{distance:50}, target:'保存 40 厘米和 80 厘米的两次观察', type:'compare' },
  { id:'shadow-3', experiment:'shadow', level:3, title:'新布景，先猜再调', instruction:'现在物体离灯 80 厘米，要把影子变成物体的 2.5 倍。先判断移动方向，再调整到目标并记录。', initial:{distance:80}, target:'先判断方向，再让影子达到 2.5 倍', type:'transfer', predictions:['靠近灯','远离灯'], conclusionPrompt:'观察记录表明，从 80 厘米开始要让影子达到 2.5 倍，应怎样移动？', conclusions:['靠近灯','远离灯'], answer:0 },
  { id:'float-1', experiment:'float', level:1, title:'救起小货船', instruction:'总质量 120 克的小船，最大排水体积只有 80 毫升，正在下沉。保持总质量 120 克，改变船的体积，让它浮起并留出余量。', initial:{volume:80,mass:120}, target:'总质量固定 120 克，小船浮起且未浸到边缘', type:'goal' },
  { id:'float-2', experiment:'float', level:2, title:'同一艘船，加重看看', instruction:'选定最大排水体积 160 毫升的小船。分别记录总质量 80 克、120 克的两次观察；船的体积保持不变。', initial:{volume:160,mass:80}, target:'同一艘 160 毫升船，两次总质量分别为 80、120 克', type:'compare' },
  { id:'float-3', experiment:'float', level:3, title:'安全运输新任务', instruction:'这次总质量是 140 克，还要保留至少 30% 的排水能力。先判断应换什么船，再调整并记录安全的条件。', initial:{volume:100,mass:140}, target:'总质量 140 克，浸水比例不超过 70%，不能下沉', type:'transfer', predictions:['换最大排水体积更大的船','换最大排水体积更小的船'], conclusionPrompt:'根据记录，运送 140 克并保留至少 30% 排水余量，应选哪艘船？', conclusions:['最大排水体积 200 毫升','最大排水体积 140 毫升'], answer:0 },
  { id:'circuit-1', experiment:'circuit', level:1, title:'接通最后一段', instruction:'电池和灯泡之间还差一段导线。请让灯泡亮起来，记录完整的回路。', initial:{a:1,b:1,c:0}, target:'三段导线组成完整回路，灯泡亮起', type:'goal' },
  { id:'circuit-2', experiment:'circuit', level:2, title:'断开一段做对照', instruction:'先记录完整回路，再只断开第一段导线并记录。第二、第三段始终接通，比较灯泡的变化。', initial:{a:1,b:1,c:1}, target:'完整回路与只断第一段的两次观察', type:'compare' },
  { id:'circuit-3', experiment:'circuit', level:3, title:'换个断点，还会怎样', instruction:'回到完整回路。这次只断开第二段，其他两段保持接通。先预测灯泡的状态，再动手记录。', initial:{a:1,b:1,c:1}, target:'预测后，只断开第二段，记录灯泡的状态', type:'transfer', predictions:['灯泡熄灭','灯泡继续亮'], conclusionPrompt:'记录表明，其他两段接通、只断开第二段时，灯泡怎样？', conclusions:['灯泡熄灭','灯泡继续亮'], answer:0 }
]
const byId = new Map(LAB_TASKS.map(task=>[task.id,task]))
export const emptyLabChallenges = () => ({version:1,completed:{}})
const unreadable = () => new Error('实验挑战记录暂时无法读取，原数据已保留，修复前不会覆盖。')
export function readLabChallenges(raw) {
  if (raw === '' || raw == null) return emptyLabChallenges()
  let value
  try { value = typeof raw === 'string' ? JSON.parse(raw) : raw } catch { throw unreadable() }
  if (!value || value.version !== 1 || !value.completed || Array.isArray(value.completed) || typeof value.completed !== 'object') throw unreadable()
  const next = emptyLabChallenges()
  for (const [id,record] of Object.entries(value.completed)) {
    if (!byId.has(id) || !record || !Number.isFinite(record.at) || record.at < 0) throw unreadable()
    next.completed[id] = {at:record.at}
  }
  return next
}
export function summarizeLabChallenges(progress) {
  const value = readLabChallenges(progress)
  const byExperiment = {shadow:0,float:0,circuit:0}
  for (const id of Object.keys(value.completed)) byExperiment[byId.get(id).experiment]++
  return {completed:Object.keys(value.completed).length,total:LAB_TASKS.length,byExperiment}
}
export function captureLabObservation(taskId, params) {
  const task = byId.get(taskId)
  if (!task) throw new Error('找不到这个实验挑战。')
  const experiment = EXPERIMENTS.find(item=>item.id===task.experiment)
  const clean = {}
  for (const knob of experiment.knobs) {
    const value = params?.[knob.key]
    if (!Number.isFinite(value) || value < knob.min || value > knob.max || (value-knob.min)%knob.step !== 0) throw new Error('实验条件无效，请使用页面上的旋钮。')
    clean[knob.key] = value
  }
  const observed = observe(task.experiment,clean)
  return {params:clean,result:{value:observed.value,...(typeof observed.sunk==='boolean'?{sunk:observed.sunk}:{})}}
}
const near = (a,b) => Math.abs(a-b) < 0.000001
export function evaluateLabTask(taskId, observations, {prediction=null,conclusion=null,assisted=false} = {}) {
  const task = byId.get(taskId)
  if (!task || !Array.isArray(observations)) throw new Error('实验任务记录不完整。')
  if (task.type === 'transfer' && !task.predictions[prediction]) return {passed:false,independent:false,feedback:'先留下你的预测，再开始观察。'}
  const needed = task.type === 'compare' ? 2 : 1
  if (observations.length !== needed) return {passed:false,independent:false,feedback:`请实际按“记录当前条件”保存${needed===2?'两次':'一次'}观察；旋钮变化本身不算记录。`}
  // Recompute numeric observations instead of trusting rounded display text or supplied results.
  const records = observations.map(record=>captureLabObservation(taskId,record.params))
  const p = records[0].params, r = records[0].result
  let passed = false
  if (taskId === 'shadow-1') passed = near(r.value,4)
  if (taskId === 'shadow-3') passed = near(r.value,2.5)
  if (taskId === 'float-1') passed = p.mass===120 && !r.sunk && r.value<1
  if (taskId === 'float-3') passed = p.mass===140 && !r.sunk && r.value<=.7
  if (taskId === 'circuit-1') passed = r.value===1
  if (taskId === 'circuit-3') passed = p.a===1 && p.b===0 && p.c===1 && r.value===0
  if (task.type === 'compare') {
    const q = records[1].params, s = records[1].result
    const changes = Object.keys(p).filter(key=>p[key]!==q[key])
    const pair = (key,a,b) => (p[key]===a && q[key]===b) || (p[key]===b && q[key]===a)
    if (taskId === 'shadow-2') passed = changes.length===1 && pair('distance',40,80) && !near(r.value,s.value)
    if (taskId === 'float-2') passed = changes.length===1 && p.volume===160 && q.volume===160 && pair('mass',80,120) && !r.sunk && !s.sunk && !near(r.value,s.value)
    if (taskId === 'circuit-2') passed = changes.length===1 && p.b===1 && q.b===1 && p.c===1 && q.c===1 && pair('a',1,0) && r.value!==s.value
  }
  if (!passed) return {passed:false,independent:false,feedback:'记录已留下，但还没有达成上面的任务。比较目标和条件，调整后重新记录。'}
  if (task.type==='transfer' && conclusion!==task.answer) return {passed:false,independent:false,feedback:'请根据观察记录选择或修正“我的结论”，再检查任务。猜想可以改变，让证据帮助你判断。'}
  if (assisted) return {passed:true,independent:false,feedback:'借助学习说明完成了任务。这次留下练习经历，重新独立挑战时再收集星星。'}
  return {passed:true,independent:true,feedback:'达成任务！你留下了可检验的观察证据。'}
}
export function recordLabTask(progress,taskId,observations,options={},at=Date.now()) {
  const next = readLabChallenges(progress)
  const result = evaluateLabTask(taskId,observations,options)
  if (!result.passed || !result.independent) throw new Error(result.feedback)
  if (!Number.isFinite(at) || at<0) throw new Error('实验记录时间无效。')
  if (!next.completed[taskId]) next.completed[taskId] = {at}
  return next
}
export function createLabChallengeStore(storage) {
  return {
    read:()=>readLabChallenges(storage.get(LAB_CHALLENGES_KEY)),
    complete(taskId,observations,options={},at=Date.now()) {
      const before = this.read()
      const next = recordLabTask(before,taskId,observations,options,at)
      if (!before.completed[taskId]) storage.set(LAB_CHALLENGES_KEY,next)
      return next
    }
  }
}
