# 代码结构

所有运行源码在 app/。

| 模块 | 职责 |
| --- | --- |
| pages | 首页、知识、历史、专注、游戏、成长与验收页面 |
| focus / game / growth / knowledge / math / lab | 可独立测试的规则与版本化数据；math 目前只有每日口算生成、打卡与错题本规则，game 另含五个街机小游戏（扫雷、俄罗斯方块、消消乐、贪吃蛇、纸翼飞行队）与共享的最佳成绩记录 |
| services | uni 存储、原生提醒与音频适配 |
| data | 723 条知识卡（含外研版四上、四下课本同步词 173 条）、口算/游戏关卡、场景、音频映射、完整汉字、127 篇诗词与八个习作单元的作文范例 |
| static/ui | 绘图脚本生成的本地 PNG 图标/场景 |
| static/english | 596 个随包 AAC 单词/例句文件（覆盖原 300 张英语卡；课本同步词暂无音频） |
| static/puzzle | AI 生成的小妙机器人插图 |
| uni_modules/miaobang-reminder | UTS/Kotlin 时钟、AlarmManager 与通知 |
| tests / scripts | 规则检查及开发期资源工具 |

本地键：miaobang.focus.v1、miaobang.knowledge.v1、miaobang.puzzle-progress.v1、miaobang.family-games.v1、miaobang.light.v1、miaobang.growth.v1、miaobang.oral.v1（每日口算打卡记录与错题本，旧记录缺错题本字段时按空错题本读取）、miaobang.arcade.v1（五个街机小游戏的 best 成绩，旧四游戏记录可继续读取）、miaobang.lab.v1（13 个实验的本机发现笔记，每个实验最多 280 字、一条记录）；安装验收探针另用 miaobang.m0.local-note.v1。原生提醒保存私有 SharedPreferences 调度信息。

改结构先考虑旧记录迁移，读取失败不覆盖旧值、写入失败不显示成功。不要用浏览器支持推断安卓逻辑层支持：原始白屏修复将 replaceAll 与 Object.hasOwn 改成兼容写法，并有回归检查。

三个 tab 为首页、知识口袋、本机记录；子页面使用返回栈。四个旧专注/激励页面保留源码和路由，主流程无入口。

好奇实验室的内容与简化公式在 lab/experiments.mjs，画布绘制在 lab/draw.mjs；飞机规则与绘制分别在 game/plane.mjs、game/plane-draw.mjs。所有新功能均不请求业务服务端，页面隐藏时停止实验动画、声音和飞行计时。宽屏适配按逻辑窗口宽度判断，不把 2560×1600 物理像素直接当作布局宽度。
