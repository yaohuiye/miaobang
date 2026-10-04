# 代码结构

所有运行源码在 app/。

| 模块 | 职责 |
| --- | --- |
| pages | 首页、知识、历史、专注、游戏、成长与验收页面 |
| focus / game / growth / knowledge | 可独立测试的规则与版本化数据 |
| services | uni 存储、原生提醒与音频适配 |
| data | 550 条知识卡、关卡、场景、音频映射、完整汉字与诗词 |
| static/ui | 绘图脚本生成的本地 PNG 图标/场景 |
| static/english | 596 个随包 AAC 单词/例句文件 |
| static/puzzle | AI 生成的小妙机器人插图 |
| uni_modules/miaobang-reminder | UTS/Kotlin 时钟、AlarmManager 与通知 |
| tests / scripts | 规则检查及开发期资源工具 |

本地键：miaobang.focus.v1、miaobang.knowledge.v1、miaobang.puzzle-progress.v1、miaobang.family-games.v1、miaobang.light.v1、miaobang.growth.v1；安装验收探针另用 miaobang.m0.local-note.v1。原生提醒保存私有 SharedPreferences 调度信息。

改结构先考虑旧记录迁移，读取失败不覆盖旧值、写入失败不显示成功。不要用浏览器支持推断安卓逻辑层支持：原始白屏修复将 replaceAll 与 Object.hasOwn 改成兼容写法，并有回归检查。

三个 tab 为首页、知识口袋、本机记录；子页面使用返回栈。四个旧专注/激励页面保留源码和路由，主流程无入口。
