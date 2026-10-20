# 代码结构

所有运行源码在 app/。

| 模块 | 职责 |
| --- | --- |
| pages | 首页、知识、历史、专注、游戏、成长与验收页面 |
| focus / game / growth / knowledge / math / lab | 可独立测试的规则与版本化数据；math 目前只有每日口算生成、打卡与错题本规则，game 另含六个街机小游戏（扫雷、俄罗斯方块、消消乐、贪吃蛇、纸翼飞行队、跳一跳）与共享的最佳成绩记录 |
| services | uni 存储、原生提醒与音频适配 |
| data | 723 条知识卡（含外研版四上、四下课本同步词 173 条）、口算/游戏关卡、场景、音频映射、完整汉字、127 篇诗词与八个习作单元的作文范例 |
| static/ui | 绘图脚本生成的本地 PNG 图标/场景 |
| static/english | 596 个随包 AAC 单词/例句文件（覆盖原 300 张英语卡；课本同步词暂无音频） |
| static/puzzle | AI 生成的小妙机器人插图 |
| uni_modules/miaobang-reminder | UTS/Kotlin 时钟、AlarmManager 与通知 |
| tests / scripts | 规则检查及开发期资源工具 |

本地键：miaobang.focus.v1、miaobang.knowledge.v1、miaobang.puzzle-progress.v1、miaobang.family-games.v1、miaobang.light.v1、miaobang.growth.v1、miaobang.oral.v1（每日口算打卡记录与错题本，旧记录缺错题本字段时按空错题本读取）、miaobang.arcade.v1（六个街机小游戏的 best 成绩，旧四/五游戏记录可继续读取）、miaobang.match-levels.v1（消消乐 12 关已解锁进度；独立于旧最高分）、miaobang.lab.v1（13 个实验的本机发现笔记，每个实验最多 280 字、一条记录）；安装验收探针另用 miaobang.m0.local-note.v1。原生提醒保存私有 SharedPreferences 调度信息。

改结构先考虑旧记录迁移，读取失败不覆盖旧值、写入失败不显示成功。不要用浏览器支持推断安卓逻辑层支持：原始白屏修复将 replaceAll 与 Object.hasOwn 改成兼容写法，并有回归检查。

三个 tab 为首页、知识口袋、本机记录；子页面使用返回栈。四个旧专注/激励页面保留源码和路由，主流程无入口。

好奇实验室的内容与简化公式在 lab/experiments.mjs，画布绘制在 lab/draw.mjs；飞机规则与绘制分别在 game/plane.mjs、game/plane-draw.mjs。所有新功能均不请求业务服务端，页面隐藏时停止实验动画、声音和飞行计时。宽屏适配按逻辑窗口宽度判断，不把 2560×1600 物理像素直接当作布局宽度。

## 学习进度（1.1.0）

旧业务记录不改键、不清空。新增独立键：

- `miaobang.word-progress.v1`：按词保存认词/拼装/独立输入证据及到期复习；不把当轮改对或看答案当首次独立完成。
- `miaobang.oral-learning.v1`：按题型统计首次作答、变式任务及验证日期，自动去重读取旧错题；复习不写每日打卡，跨两次存储采用 session ID 幂等补存。
- `miaobang.safety-learning.v1`：8 个故事各 3 步，分别记录独立完成过的步骤与当前待复习判断；旧看过不迁移成掌握。页面用 FIFO 队列顺序补存步骤和旧看过标记。
- `miaobang.lab-challenges.v1`：3 个主题各 3 项独立实验任务；通过数值条件、显式观察记录、迁移结论判定，旧笔记完整保留。
- `miaobang.skill-challenges.v1`：扫雷及跳跃各 3 档通过与最佳成绩；不混合旧无难度的街机纪录。
- `miaobang.learning-badges.v1`：18 个有限徽章的首次授予时间；从可核对的模块证据授予一次，并保留已获徽章。

统一入口为 `pages/growth/learning.vue`。等级只表达挑战进度；家长小红花的每日规则独立保留。读取任一模块失败时，统一页不补写徽章，提示保留数据后重试。

## 五子棋（1.1.1）

`game/gomoku.mjs` 是无 uni 依赖的自由规则/局部评分陪练；`data/gomoku-lessons.mjs` 提供原创短课与局面；`game/gomoku-learning.mjs` 按真实局面判定并保存 `miaobang.gomoku-learning.v1`（练习/独立完成集合）。`pages/games/gomoku.vue` 提供教学、训练与本地对弈，隐藏时取消陪练定时器，返回后手动继续。9×9 训练支持多解，15×15 对弈使用预选再确认，避免小屏误落。

成长追加 3 枚五子棋徽章，总数 21、上限 420 点；原 0/40/100/200/360 等级阈值保持，旧徽章完整保留。独立训练 2/8/16 题各得一次徽章，重复对弈或同题练习不刷经验。


### 连续攻防与完整研究

`game/gomoku-tactics.mjs` 提供 6 段多轮训练与有界连续冲四验证；`game/gomoku-tactics-progress.mjs` 和 `services/gomoku-tactics.js` 将整段完成保存到 `miaobang.gomoku-tactics.v1`。旧单步键不迁移；提示、试错、回退后本轮只记练习通过。页面保存失败保留终局与待保存状态。

`lab/inquiries.mjs` 包含 4 项研究、纯状态推进、证据判定及 `miaobang.lab-inquiries.v1` 报告存储。页面仅在显式记录后展示当前结果，新条件锁预测后仍需实际验证；数值从原实验模型重新计算，不相信提供的结果。旧自由实验、笔记和九项任务独立保留。
