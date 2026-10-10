const knob = (key, label, min, max, value, unit = '', step = 1) => ({ key, label, min, max, value, unit, step })
const source = 'https://openstax.org/books/college-physics-2e/pages/'
export const EXPERIMENTS = [
  { id:'shadow', icon:'☀', title:'影子变身术', area:'光与颜色', question:'物体靠近灯，影子会怎样？', guesses:['变大','变小'], answer:0, knobs:[knob('distance','物体离灯',20,80,50,'厘米')], explain:'灯光沿直线传播。物体靠近点光源，挡住的光束展开得更宽，屏幕上的影子就更大。这里固定灯到屏幕为 100 厘米。', challenge:'让影子变成物体的两倍大，你把物体放在哪里？', source:source+'25-1-the-ray-aspect-of-light' },
  { id:'float', icon:'⛵', title:'小船浮起来', area:'水与空气', question:'同样重的小船，排开水的体积越大，会怎样？', guesses:['更容易浮起来','更容易沉下去'], answer:0, knobs:[knob('volume','小船最大排水体积',40,200,100,'毫升'),knob('mass','小船总质量',40,160,80,'克')], explain:'小船排开的水越多，水给它的向上托力越大。当排开的水和船一样重，船就能平衡。这里用淡水，每毫升水约重 1 克；旋钮表示船浸到边缘前最多能排开的水。', challenge:'给船加重后，怎样改变船的体积才能让它重新浮起来？', source:source+'11-7-archimedes-principle' },
  { id:'circuit', icon:'💡', title:'点亮小灯泡', area:'电与磁', question:'只接好两段导线，灯会亮吗？', guesses:['会亮','不会亮'], answer:1, knobs:[knob('a','第一段导线',0,1,0),knob('b','第二段导线',0,1,0),knob('c','第三段导线',0,1,0)], explain:'电池、导线和灯泡要连成完整的回路，电流才能持续流过灯泡。任何一处断开，灯都会熄灭。这是屏幕模拟，无须接触家里的插座。', challenge:'先点亮灯，再断开一段，看看发生了什么。', source:source+'20-2-ohms-law-resistance-and-simple-circuits' },
  { id:'materials', icon:'🧲', title:'磁铁找朋友', area:'电与磁', question:'磁铁能吸住所有金属吗？', guesses:['所有金属都可以','只有一些材料可以'], answer:1, knobs:[knob('material','试一试哪种材料',0,4,0)], labels:['铁钉','铜片','铝片','木块','塑料'], explain:'普通磁铁能明显吸引铁等材料，但并不能吸住所有金属。这里的铜片、铝片、木块和塑料都不会像铁钉一样被吸住。', challenge:'铜和铝都是金属，为什么还要亲自试一试？', source:source+'22-1-magnets' },
  { id:'poles', icon:'↔', title:'磁极碰碰头', area:'电与磁', question:'两个 N 极面对面，会怎样？', guesses:['吸引','排斥'], answer:1, knobs:[knob('flip','翻转右边磁铁',0,1,0)], explain:'同名磁极相互排斥，异名磁极相互吸引。图中箭头表示受力方向；磁铁大小没有变化。', challenge:'只翻转一块磁铁，吸引和排斥会交换吗？', source:source+'22-1-magnets' },
  { id:'sound', icon:'♪', title:'声音波浪', area:'声音与运动', question:'音调越高，波浪会怎样？', guesses:['同一段里波浪更多','波浪更高'], answer:0, knobs:[knob('tone','音调档位',0,2,1),knob('volume','声音大小',1,3,2)], explain:'频率越高，音调越高；振幅越大，声音通常越响。图中的波浪只是帮助观察，并不是空气真的沿波浪上下跑。三个音调分别为 220、440、880 赫兹。', challenge:'保持音调不变，只改变音量。你听到的音高变了吗？', source:source+'17-2-speed-of-sound-frequency-and-wavelength' },
  { id:'ramp', icon:'🚗', title:'斜坡小赛车', area:'声音与运动', question:'从更高的地方出发，小车到坡底会怎样？', guesses:['更快','更慢'], answer:0, knobs:[knob('height','起点高度',10,80,40,'厘米')], explain:'起点越高，重力势能越多。它转化成运动的能量时，小车就会更快。这里忽略摩擦和车轮转动的能量，是一个简化模型。', challenge:'把高度变成原来的四倍，速度会变成四倍吗？', source:source+'7-3-gravitational-potential-energy' },
  { id:'friction', icon:'〰', title:'谁滑得更远', area:'声音与运动', question:'同样速度出发，在更粗糙的路上会怎样？', guesses:['更早停下','滑得更远'], answer:0, knobs:[knob('rough','路面粗糙程度',1,5,3)], explain:'在这个模型里，路面越粗糙，摩擦系数越大，小车受到的阻力越大，停下来的距离越短。起始速度固定为每秒 2 米，忽略空气阻力。', challenge:'保持出发速度相同，比较最光滑和最粗糙的两条路。', source:source+'5-1-friction' },
  { id:'parachute', icon:'☂', title:'降落伞慢慢落', area:'水与空气', question:'同样重的人，伞面越大，稳定下降时会怎样？', guesses:['更慢','更快'], answer:0, knobs:[knob('area','伞面面积',10,50,30,'平方米')], explain:'较大的伞面受到更大的空气阻力，稳定下降的速度会更小。这里固定总质量为 60 千克，使用理想化的终端速度模型，不模拟刚打开降落伞的过程。', challenge:'面积加倍，下降速度会刚好减半吗？', source:source+'5-2-drag-forces' },
  { id:'lever', icon:'⚖', title:'跷跷板平衡术', area:'声音与运动', question:'较轻的一边离支点更远，也可能平衡吗？', guesses:['可能','不可能'], answer:0, knobs:[knob('left','左边离支点',1,5,2,'格'),knob('right','右边离支点',1,5,4,'格')], explain:'重量和离支点的距离一起决定转动效果。这里左边重 2 份，右边重 1 份；左边 2 格、右边 4 格时，两边转动效果相同。图中倾斜只表示哪一边占上风。', challenge:'把左边移到 1 格，右边该放几格？', source:source+'9-2-the-second-condition-for-equilibrium' },
  { id:'color', icon:'🎨', title:'三色光魔法', area:'光与颜色', question:'红光和绿光一起照，会看到什么？', guesses:['黄色','棕色'], answer:0, knobs:[knob('red','红光',0,255,255),knob('green','绿光',0,255,255),knob('blue','蓝光',0,255,0)], explain:'这里混合的是红、绿、蓝三种光。红光和绿光叠加得到黄光，三色光同样强时得到白光。颜料混合的规律不同，不能用这个结果替代颜料实验。', challenge:'只用两个旋钮，试着调出青色和品红色。', source:source+'26-3-color-and-color-vision' },
  { id:'pressure', icon:'💧', title:'小水柱跳远', area:'水与空气', question:'水面高出同一个小孔更多时，水会怎样？', guesses:['喷得更远','喷得更近'], answer:0, knobs:[knob('height','水面高出小孔',5,60,30,'厘米')], explain:'同一个孔上方的水越深，水的压强越大，喷出速度越快。孔离地面固定为 20 厘米；这是水位保持不变、忽略阻力的模型，真实瓶子放水时水位会逐渐降低。', challenge:'孔的位置不动，只降低水位，水柱落地点如何变化？', source:source+'11-4-variation-of-pressure-with-depth-in-a-fluid' },
  { id:'moon', icon:'☽', title:'月亮变脸', area:'地球与天空', question:'平常月亮的圆缺，是地球影子挡住它吗？', guesses:['是','不是'], answer:1, knobs:[knob('angle','月亮绕地球的角度',0,360,90,'度',15)], explain:'太阳总照亮月球的一半。月亮绕地球运动时，我们看到的被照亮部分不同，于是出现月相。普通月相不是地球影子造成的；地球影子遮住月亮是月食。图中大小和距离不按真实比例。', challenge:'找到新月和满月，再看看太阳、地球、月亮的位置。', source:'https://science.nasa.gov/moon/moon-phases/' }
]
export const defaults = experiment => Object.fromEntries(experiment.knobs.map(k => [k.key,k.value]))
export function observe(id, p) {
  switch (id) {
    case 'shadow': return { value:100/p.distance, text:`影子约是物体的 ${(100/p.distance).toFixed(1)} 倍` }
    case 'float': return { value:Math.min(1,p.mass/p.volume), sunk:p.mass>p.volume, text:p.mass>p.volume?'排水能力不够，小船下沉':p.mass===p.volume?'刚好全浸没，已没有多余承载量':`浮着，约 ${(p.mass/p.volume*100).toFixed(0)}% 的排水体积在水下` }
    case 'circuit': return { value:p.a*p.b*p.c, text:p.a&&p.b&&p.c?'回路完整，灯亮了！':'回路还没有接通' }
    case 'materials': return { value:p.material===0?1:0, text:p.material===0?'铁钉被吸住了':'这件材料没有被吸住' }
    case 'poles': return { value:p.flip, text:p.flip?'N 和 S 相对：相互吸引':'N 和 N 相对：相互排斥' }
    case 'sound': return { value:[220,440,880][p.tone], text:`${[220,440,880][p.tone]} 赫兹 · 音量 ${p.volume} 档` }
    case 'ramp': { const v=Math.sqrt(2*9.8*p.height/100); return {value:v,text:`理想坡底速度约 ${v.toFixed(2)} 米/秒`} }
    case 'friction': { const d=4/(2*9.8*p.rough/10); return {value:d,text:`约滑行 ${d.toFixed(2)} 米后停下`} }
    case 'parachute': { const v=Math.sqrt(2*60*9.8/(1.225*1.5*p.area)); return {value:v,text:`稳定下降速度约 ${v.toFixed(2)} 米/秒`} }
    case 'lever': return { value:2*p.left-p.right, text:2*p.left===p.right?'平衡啦！':2*p.left>p.right?'左边转动效果更大':'右边转动效果更大' }
    case 'color': return { value:`rgb(${p.red},${p.green},${p.blue})`, text:`红 ${p.red} · 绿 ${p.green} · 蓝 ${p.blue}` }
    case 'pressure': { const v=Math.sqrt(2*9.8*p.height/100), d=v*Math.sqrt(2*.2/9.8); return {value:d,text:`水平喷出约 ${(d*100).toFixed(0)} 厘米`} }
    case 'moon': { const f=(1-Math.cos(p.angle*Math.PI/180))/2; return {value:f,text:`从地球看，约 ${(f*100).toFixed(0)}% 的月面明亮`} }
    default: throw new Error('找不到这个实验')
  }
}
export const LAB_KEY = 'miaobang.lab.v1'
export function readNotebook(raw) {
  if (!raw) return {version:1,notes:{}}
  const book=typeof raw==='string'?JSON.parse(raw):raw
  if (!book || book.version!==1 || !book.notes || Array.isArray(book.notes) || typeof book.notes!=='object' || Object.entries(book.notes).some(([id,n])=>!EXPERIMENTS.some(e=>e.id===id)||!n||typeof n.text!=='string'||n.text.length>280||!Number.isFinite(n.at))) throw new Error('实验笔记暂时无法读取，原记录已保留。')
  return {version:1,notes:JSON.parse(JSON.stringify(book.notes))}
}
export function saveNote(storage, id, text, at) {
  if (!EXPERIMENTS.some(e=>e.id===id)) throw new Error('找不到这个实验')
  const book=readNotebook(storage.get(LAB_KEY))
  const note=text.trim().slice(0,280)
  if (!note) throw new Error('先写下一点发现吧。')
  const next={version:1,notes:{...book.notes,[id]:{text:note,at}}}
  storage.set(LAB_KEY,next)
  return next
}
