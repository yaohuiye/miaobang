# 素材与内容来源

| 内容 | 来源与许可范围 |
| --- | --- |
| 550 张知识卡、题目、关卡、安全情境 | 项目编写；课程/科学核查链接位于 app/data/knowledge/index.mjs 及场景文件。引用链接不表示第三方网页适用 MIT |
| UI 图标与安全插画 | app/scripts/draw-ui-assets.py 原创绘制；PNG 随仓库提供，绘图工具 Pillow 自有许可 |
| App 桌面 Logo | AI 图像生成工具生成的小妙与小红花；static/app-icon 中提供原图及安卓各尺寸 |
| 小妙机器人 | AI 图像生成工具生成的项目角色 |
| static/icons | 用项目原创图标替换原始许可未明确的旧图标 |
| 汉字 | 完整沿用原项目 app/data/characters.js：2480 条记录、2468 个不同汉字。年级、拼音、部首、笔画等用于查询；旧导入数据未记录完整上游地址，来源追溯尚未完成 |
| 诗词 | 完整沿用原项目 app/data/poems.js：114 条记录、113 个不同标题，包含原文、拼音及注释。既有古典诗词，也有近现代作品；不能笼统声明全部公有领域。原注释作者和汇编来源仍待补充 |
| 英语音频 | 项目英语文本，经 Piper 1.8.0 / LJSpeech 合成的 596 个 AAC 文件。没有使用 Apple 系统声音、教材配套录音或在线声音服务 |
| 构建工具/依赖 | HBuilderX、Android、Node、Pillow、Piper、FFmpeg 等各自许可，不纳入项目 MIT 许可 |

## 英语音源

模型：en_US-ljspeech-high，美国英语女声；作者 Bryce Beattie 在[模型发布页](https://brycebeattie.com/files/tts/)声明 LJSpeech 模型为 public domain。[上游模型卡](https://huggingface.co/rhasspy/piper-voices/blob/main/en/en_US/ljspeech/high/MODEL_CARD)关联该作者。

[LJ Speech 数据集](https://keithito.com/LJ-Speech-Dataset/)由 Linda Johnson 的 LibriVox 朗读和 Keith Ito 的整理构成，上游声明为美国公有领域。音频使用本项目英语文本重新合成，并非直接打包该语料的朗读录音。

模型 SHA-256：`5d4f08ba6a2a48c44592eed3ce56bf85e9de3dd4e20df90541ae68a8310c029a`。

配置 SHA-256：`7e1f4634af596d83cca997fb7a931ba80b70f8a316a2655ee69c55365e0ace14`。

生成参数：Piper 1.8.0，length_scale=1.1，22,050 Hz，AAC 48 kbps 单声道。模型权重和语音引擎不打包进 App；仅开发时使用。[Piper 引擎](https://github.com/OHF-Voice/piper1-gpl)遵循 GPL-3.0，生成工具依赖不改变应用自身代码的 MIT 许可。

## MIT 的范围

根目录 LICENSE 适用于本项目原创代码、学习卡、关卡、脚本和原创插图。旧导入字库、诗词原文与注释的第三方权利不因此改变；保留完整内容不等于已完成每条资料的来源与许可核查。后续补齐来源时不以少量示例替代运行数据。

教材方向只作辅助，不宣称完整覆盖特定教材。新增素材请记录作者、原链接与适用许可。
