import { EXPERIMENTS, defaults, observe } from './experiments.mjs'

export const LAB_INQUIRIES_KEY = 'miaobang.lab-inquiries.v1'
export const LAB_INQUIRIES = [
  { id:'shadow-distance', experiment:'shadow', title:'影子：距离加倍，会怎样？', question:'给皮影戏找规律：物体离灯的距离加倍，影子的放大倍数怎样变化？', variable:'distance', fixed:'灯到屏幕固定 100 厘米，物体大小不变。', design:'自选至少 3 个距离，其中两次距离相差一倍；还要留下一个没测过的距离做最后验证。', choices:['放大倍数也加倍','放大倍数减半','放大倍数不变'], answer:1, conclusion:'物体离灯的距离加倍时，屏幕上的放大倍数减半；只适用于这里灯、屏幕和物体大小不变的模型。', transferChoices:['比参照记录的影子更大','与参照记录一样大','比参照记录的影子更小'], extension:'如果移动的是屏幕，原来的结论还能直接用吗？先说清楚哪些条件变了。' },
  { id:'float-capacity', experiment:'float', title:'货船：找到沉与浮的分界', question:'同一份货物，换多大的船才浮得住？怎样区分刚好浮住和留有余量？', variable:'volume', fixed:'先选 41–160 克的总质量，之后不改变；使用同样的淡水。', design:'自选至少 3 种最大排水体积，记录中要同时出现下沉和浮起且留有余量。用两条对照记录作为证据。', choices:['最大排水体积比同质量水小，就有余量','最大排水体积和同质量水相同，就有余量','最大排水体积比同质量水大，才有余量'], answer:2, conclusion:'在这个淡水模型里，每毫升水约重 1 克。最大排水体积小于总质量的数值时下沉，等于时没有余量，大于时浮起并有余量。船和货物的总质量要保持相同。', transferChoices:['下沉','刚好全浸没，没有余量','浮起，并留有余量'], extension:'真实小船还会受进水、重心和风浪影响。模型里浮起，是否就能保证真实船安全？' },
  { id:'lever-balance', experiment:'lever', title:'跷跷板：轻的一边怎样赢回来？', question:'左边重 2 份、右边重 1 份。固定左边，移动右边，找出平衡点和两侧倾斜的分界。', variable:'right', fixed:'先把左边放在 1 或 2 格，此后固定；两边重量不变。', design:'右边位置自己选，至少记录 3 组，证据中要包含左边占上风、平衡、右边占上风。再验证一个未测的位置。', choices:['右边距离与左边相同时平衡','右边距离是左边两倍时平衡','右边距离是左边一半时平衡'], answer:1, conclusion:'重量与离支点的距离相乘，决定转动效果。这里左边重 2 份，所以右边要离支点两倍远才平衡。重量固定时，右边再移远会占上风。', transferChoices:['左边转动效果更大','两边平衡','右边转动效果更大'], extension:'如果左边放到 3 格，右边最远只有 5 格，还能平衡吗？“没调出来”和“范围内不可能”有什么不同？' },
  { id:'pressure-range', experiment:'pressure', title:'水柱：水位四倍，射程也四倍吗？', question:'同一个小孔，水面高度变为原来的 4 倍，水平射程会怎样？用测量检验直觉。', variable:'height', fixed:'孔离地面固定 20 厘米，孔的位置不变；模型中水位保持不变。', design:'自选至少 3 个水面高度，其中两次高度为 4 倍关系。比较射程，再用未测高度检验规律。', choices:['水平射程约变为 4 倍','水平射程不变','水平射程约变为 2 倍'], answer:2, conclusion:'在这个模型里，水面高出孔的高度变为 4 倍，水平射程约为 2 倍。“更高喷得更远”不代表高度和射程按相同比例增加。', transferChoices:['比参照记录喷得更远','与参照记录一样远','比参照记录喷得更近'], extension:'真实瓶子放水时水位会下降。为什么一次放水从头到尾量出的射程不能当成固定水位的数据？' }
]
const byId = new Map(LAB_INQUIRIES.map(item=>[item.id,item]))
const copy = value => JSON.parse(JSON.stringify(value))
const near = (a,b) => typeof a==='number' && typeof b==='number' && Math.abs(a-b)<1e-8
const taskFor = id => { const task=byId.get(id); if(!task)throw Error('找不到这个探究任务。'); return task }
const experimentFor = task => EXPERIMENTS.find(item=>item.id===task.experiment)
const validChoice = (value,choices) => Number.isInteger(value) && value>=0 && value<choices.length
export function captureInquiryObservation(id,params) {
  const task=taskFor(id), clean={}
  for(const knob of experimentFor(task).knobs){
    const value=params?.[knob.key]
    if(!Number.isFinite(value)||value<knob.min||value>knob.max||(value-knob.min)%knob.step!==0)throw Error('条件无效，请使用实验旋钮。')
    clean[knob.key]=value
  }
  if(task.experiment==='float' && clean.mass<=40)throw Error('本任务请先选 41–160 克的总质量；40 克在现有船体积范围内测不到下沉。')
  if(task.experiment==='lever' && ![1,2].includes(clean.left))throw Error('本次先选择左边 1 或 2 格，确保右边的范围内有平衡点。')
  const result=observe(task.experiment,clean)
  return {params:clean,result:{value:result.value,...(typeof result.sunk==='boolean'?{sunk:result.sunk}:{})}}
}
function checkedRecords(id,records){
  if(!Array.isArray(records))throw Error('实验记录不完整。')
  return records.map(record=>{
    const clean=captureInquiryObservation(id,record?.params)
    if(!near(clean.result.value,record?.result?.value)||clean.result.sunk!==record?.result?.sunk)throw Error('观察结果与条件不一致，请重新实际记录。')
    return clean
  })
}
function comparable(task,records){
  if(!records.length)return
  const first=records[0].params
  if(records.some(record=>Object.keys(first).some(key=>key!==task.variable&&record.params[key]!==first[key])))throw Error('这组记录改变了不止一个条件。请固定其他条件，再重新做对照。')
  if(new Set(records.map(record=>record.params[task.variable])).size!==records.length)throw Error('相同条件不能充当新的证据，请换一个没记录过的条件。')
}
export function createInquirySession(id){taskFor(id);return {id,prediction:null,records:[],conclusion:null,evidence:[],transfer:null,revision:null}}
export function startInquiry(session,prediction){
  const task=taskFor(session.id)
  if(!validChoice(prediction,task.choices))throw Error('先留下预测，猜错也可以根据证据修正。')
  if(session.records.length||session.transfer)throw Error('实验已经开始；要换设计，请重新发起探究。')
  return {...session,prediction}
}
export function addInquiryObservation(session,params){
  const task=taskFor(session.id)
  if(!validChoice(session.prediction,task.choices))throw Error('先留下预测，再记录实验。')
  if(session.transfer)throw Error('已进入验证阶段，若要重新设计，请重新发起探究。')
  const records=[...checkedRecords(session.id,session.records),captureInquiryObservation(session.id,params)]
  comparable(task,records)
  return {...session,records,conclusion:null,evidence:[]}
}
export function evaluateInquiryEvidence(session){
  const task=taskFor(session.id)
  let records
  try{records=checkedRecords(session.id,session.records);comparable(task,records)}catch(error){return {passed:false,feedback:error.message}}
  if(!validChoice(session.prediction,task.choices))return {passed:false,feedback:'先留下开始时的预测。'}
  if(records.length<3)return {passed:false,feedback:'至少需要 3 组不同条件的实际记录，才能检验规律。'}
  if(task.experiment==='float' && !(records.some(r=>r.result.sunk)&&records.some(r=>!r.result.sunk&&r.result.value<1)))return {passed:false,feedback:'目前还没找到分界两侧。保持质量不变，补上“下沉”和“浮起有余量”的证据。'}
  if(task.experiment==='lever' && ![-1,0,1].every(sign=>records.some(r=>Math.sign(r.result.value)===sign)))return {passed:false,feedback:'还缺少一种状态。请收集左边占上风、平衡、右边占上风这三类证据。'}
  const indices=session.evidence
  if(!Array.isArray(indices)||indices.length!==2||indices[0]===indices[1]||indices.some(i=>!Number.isInteger(i)||!records[i]))return {passed:false,feedback:'请从自己的记录里选两组作为关键证据。'}
  const [a,b]=indices.map(i=>records[i]), low=Math.min(a.params[task.variable],b.params[task.variable]),high=Math.max(a.params[task.variable],b.params[task.variable])
  if(task.experiment==='shadow' && high!==low*2)return {passed:false,feedback:'要检验“距离加倍”，请选择距离为 2 倍关系的两组证据；缺少时可以自己补测。'}
  if(task.experiment==='pressure' && high!==low*4)return {passed:false,feedback:'要检验“水位四倍”，请选择高度为 4 倍关系的两组证据；缺少时可以自己补测。'}
  if(task.experiment==='float' && a.result.sunk===b.result.sunk)return {passed:false,feedback:'请选择分界两侧：一组下沉，一组浮起并留有余量。'}
  if(task.experiment==='float' && [a,b].some(r=>!r.result.sunk&&r.result.value===1))return {passed:false,feedback:'全浸没还没有余量，请选一组浮起并留有余量的记录。'}
  if(task.experiment==='lever' && a.result.value!==0&&b.result.value!==0)return {passed:false,feedback:'关键证据中需要包含平衡点，再与一侧倾斜作比较。'}
  if(session.conclusion!==task.answer)return {passed:false,feedback:'这条结论还不能解释全部记录。比较选中的条件和结果，允许修正最初的猜想。'}
  return {passed:true,feedback:'证据支持这条结论。现在挑一个未测的条件，先预测，再验证。'}
}
export function lockInquiryTransfer(session,params,prediction){
  const task=taskFor(session.id),evidence=evaluateInquiryEvidence(session)
  if(!evidence.passed)throw Error(evidence.feedback)
  if(session.transfer)throw Error('预测已经锁定，请先完成本次验证。')
  if(!validChoice(prediction,task.transferChoices))throw Error('先选择对新条件的预测。')
  const record=captureInquiryObservation(session.id,params)
  comparable(task,[...session.records,record])
  // Only conditions and the child's forecast are kept. The new observation is created by verify, never by selecting a knob.
  return {...copy(session),transfer:{params:record.params,prediction,verified:false,record:null},revision:null}
}
export function verifyInquiryTransfer(session){
  if(!session.transfer||session.transfer.verified)throw Error('请先锁定未测条件和预测，再做一次验证。')
  const evidence=evaluateInquiryEvidence(session)
  if(!evidence.passed)throw Error(evidence.feedback)
  const task=taskFor(session.id),record=captureInquiryObservation(session.id,session.transfer.params)
  comparable(task,[...session.records,record])
  return {...copy(session),transfer:{...session.transfer,verified:true,record}}
}
function transferAnswer(session,task){
  const result=session.transfer.record.result
  if(task.experiment==='float')return result.sunk?0:result.value===1?1:2
  if(task.experiment==='lever')return result.value>0?0:result.value===0?1:2
  const reference=session.records[session.evidence[0]].result.value
  return near(result.value,reference)?1:result.value>reference?0:2
}
export function evaluateInquiry(session){
  const task=taskFor(session.id),evidence=evaluateInquiryEvidence(session)
  if(!evidence.passed)return evidence
  const transfer=session.transfer
  if(!transfer||!validChoice(transfer.prediction,task.transferChoices)||transfer.verified!==true||!transfer.record)return {passed:false,feedback:'新条件需要先锁定预测，再按“实际验证”。调旋钮不能代替验证。'}
  try{
    const [record]=checkedRecords(session.id,[transfer.record])
    if(JSON.stringify(record.params)!==JSON.stringify(captureInquiryObservation(session.id,transfer.params).params))throw Error('验证条件与预测时锁定的条件不同。')
    comparable(task,[...session.records,record])
  }catch(error){return {passed:false,feedback:error.message}}
  if(session.revision!==transferAnswer(session,task))return {passed:false,feedback:'请根据刚才的验证结果，选择现在的判断。预测错了也可以完成研究，关键是用证据修正。'}
  return {passed:true,feedback:'完成了一次研究：自己设计对照、选证据解释，并用新条件检验。'}
}
export const emptyLabInquiries = () => ({version:1,completed:{}})
export function readLabInquiries(raw){
  if(raw===''||raw==null)return emptyLabInquiries()
  const unreadable=()=>Error('探究记录暂时无法读取，原数据已保留，修复前不会覆盖。')
  try{
    const value=typeof raw==='string'?JSON.parse(raw):raw
    if(!value||value.version!==1||!value.completed||typeof value.completed!=='object'||Array.isArray(value.completed))throw unreadable()
    const next=emptyLabInquiries()
    for(const [id,entry] of Object.entries(value.completed)){
      if(!byId.has(id)||!entry||!Number.isFinite(entry.at)||entry.at<0||entry.report?.id!==id||!evaluateInquiry(entry.report).passed)throw unreadable()
      next.completed[id]=copy(entry)
    }
    return next
  }catch{throw unreadable()}
}
export function createLabInquiryStore(storage){
  return {
    read:()=>readLabInquiries(storage.get(LAB_INQUIRIES_KEY)),
    complete(session,at=Date.now()){
      const before=this.read(),result=evaluateInquiry(session)
      if(!result.passed)throw Error(result.feedback)
      if(!Number.isFinite(at)||at<0)throw Error('记录时间无效。')
      const previous=before.completed[session.id]
      if(previous&&JSON.stringify(previous.report)===JSON.stringify(session))return before
      const next={version:1,completed:{...before.completed,[session.id]:{at:previous?.at??at,report:copy(session)}}}
      storage.set(LAB_INQUIRIES_KEY,next)
      return next
    }
  }
}
export const inquiryDefaults = id => defaults(experimentFor(taskFor(id)))
