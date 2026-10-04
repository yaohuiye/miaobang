// Original family scenarios, checked against the official references below.
export const SAFETY_SOURCES = [
  { title: '福建省卫健委 · 儿童安全过马路', url: 'https://wjw.fujian.gov.cn/ztzl/jkjy/jksh/202606/t20260604_7156489.htm' },
  { title: '雅安交警 · 安全乘车提示', url: 'https://www.yaan.gov.cn/zhangzhe/show/8e26570a-6d5a-4df5-b50a-ee6f1de4af58.html' },
  { title: '深圳交警 · 站台与车辆盲区', url: 'https://szjj.sz.gov.cn/JTAQ/DXAL/content/post_10650642.html' }
]
// Option IDs are stable; their on-screen order is shuffled.
export const safetyScenes = [
  { id: 'red-light', title: '朋友在对面喊我', place: '人行横道前', icon: '🚦', scene: '行人信号灯还是红色，朋友在对面喊：“快过来！”小妙正站在安全的等候区域。', safe: '留在安全区域，等允许通行后再观察车辆', wrong: ['路上好像没车，赶快跑过去', '一边挥手打闹，一边走到车道边缘'], why: '先停止嬉闹，留在安全区域。遵守行人信号；允许通行时也要观察车流，再与家长一起通过。', talk: '朋友催你时，可以怎样回答？试着说：“等我安全过去再聊。”', reminder: '停下玩，看看路', sources: [0] },
  { id: 'green-light', title: '绿灯亮了就冲吗', place: '有转弯车辆的路口', icon: '🚶', scene: '行人绿灯亮了，一辆车正准备转弯。小妙想和朋友比赛谁先跑到对面。', safe: '先看转弯车，确认安全后平稳通过', wrong: ['绿灯亮了，闭着眼跑也没事', '跑到一半再折返回来比速度'], why: '绿灯不代表所有车辆都已停下。观察左右和转弯车辆，确认安全后直行通过，途中也留意车流，不奔跑、不折返。', talk: '除了看灯，还需要看哪些地方？', reminder: '看灯，也看车', sources: [0] },
  { id: 'bus-stop', title: '车来了，先站稳', place: '公交站台', icon: '🚏', scene: '公交车正在靠站，还没有停稳。朋友拉着小妙在站台边追跑。', safe: '停止追跑，在安全候车区域等车停稳', wrong: ['追着还在移动的公交车跑', '推着朋友抢到站台最前沿'], why: '站台边缘有车辆经过。先在安全区域等候，车辆停稳后有序上下车，避免推挤和追逐。', talk: '想赶车时，可以怎样提醒自己停住脚步？', reminder: '车停稳，人再动', sources: [1, 2] },
  { id: 'on-bus', title: '车上也要坐稳扶好', place: '正在行驶的公交车', icon: '🚌', scene: '公交车开动了。小妙刚握住扶手，朋友拿着玩具叫他追过去。', safe: '握好扶手或坐稳，等安全的时候再玩', wrong: ['放开扶手，在车厢里追朋友', '爬到座椅上让朋友找不到'], why: '车辆启动、转弯或制动时，身体可能失去平衡。行驶中坐稳扶好，不在车厢内追逐打闹。', talk: '在座位上怎样聊天，也能照顾自己和其他乘客？', reminder: '坐稳扶好，玩耍等会儿', sources: [1] },
  { id: 'after-bus', title: '下车后别急着穿过去', place: '公交车旁的人行区域', icon: '👀', scene: '下车后，公交车挡住了小妙看道路的视线。他想从车头前穿到对面。', safe: '留在人行区域，和家长走到合适过街处再观察', wrong: ['紧贴车头跑过去，司机一定看得见', '换到车尾后面直接跑过去'], why: '停靠的公交车会遮挡视线，你可能看不见来车，司机也可能看不见你。不要从车头、车尾突然横穿；到合适过街设施处遵守信号、观察后通过。', talk: '“我看见公交车”为什么不等于“其他司机看见我”？', reminder: '不从大车旁突然穿出', sources: [0, 2] },
  { id: 'dropped-toy', title: '玩具滚到路上了', place: '人行道与车道交界', icon: '⚽', scene: '小妙和家长在人行道上，手里的小球滚进车道。他下意识想追。', safe: '留在安全处停住，告诉家长，不追进车道', wrong: ['只要跑得快，就能抢在车前捡到', '让朋友一起跑出去帮忙拦车'], why: '突然进入车道，司机可能来不及反应。先停住，不为捡物冒险进入车流，由家长判断后续如何安全处理。', talk: '如果东西掉了，我们可以先说哪句话？', reminder: '东西掉了，先停住', sources: [0] },
  { id: 'parking', title: '停车场不是捉迷藏场', place: '停车场', icon: '🚗', scene: '一排车辆挡住视线，有车可能启动或倒车。朋友想躲到两辆车之间。', safe: '跟紧家长，按人行路线离开车辆活动区域', wrong: ['躲进车缝里，这里最不容易被发现', '蹲在车后面等朋友来找'], why: '车辆周围有视线盲区，停着的车也可能移动。不要在车缝或车后玩耍，跟随家长观察通行。', talk: '如果这里不能玩，附近哪里才适合玩？', reminder: '车旁不躲藏', sources: [0, 2] },
  { id: 'missed-stop', title: '快到站了，别慌', place: '即将停站的公交车', icon: '✋', scene: '小妙发现快到站了，车还在行驶。他想挤过人群，冲到车门旁。', safe: '告诉家长，扶稳慢慢准备，等停稳再下车', wrong: ['车没停就往门口猛冲', '推开别人抢先下车'], why: '先保持身体稳定，不推挤。车辆停稳后再有序下车；如果没来得及下车，和家长商量下一站的安排，不冒险抢门。', talk: '比起赶上这一站，还有什么更重要？', reminder: '没赶上，也别抢', sources: [1] }
].map(({safe,wrong,...scene}) => ({ ...scene, answer: 'safe', options: [{id:'safe',text:safe},...wrong.map((text,index)=>({id:`other-${index}`,text}))] }))
