# 构建与音频

HBuilderX 打开 app/，获取你自己的 DCloud AppID；仓库 manifest.json 中 AppID 为空。使用自己的 Android 包名和签名。正式包通过发行菜单的 Android 云打包/安心打包生成；不在源码中保存口令。官方说明：https://uniapp.dcloud.net.cn/dev/app/cloud-build.html

Android 原生提醒由 app/uni_modules/miaobang-reminder 提供。需要通知和适用的精确闹钟权限；系统调度成功不证明实际响铃。请分别测前台、锁屏、暂停取消、后台恢复、重启中断、静音/勿扰/省电。

## 完整离线音频

仓库已提供全部 596 个 .m4a 文件，无需重新生成即可运行听音游戏。生成只发生在开发电脑，手机无需 Python、Piper 或模型。

如修改了英语文本，请安装 Python 3.9+、FFmpeg（可用 ffmpeg 命令）和 Node 20+，然后在 app/ 中准备隔离环境：

```sh
python3 -m venv .audio-tools
.audio-tools/bin/python -m pip install -r scripts/requirements-audio.txt
```

下载以下两个文件至同一目录，保留原文件名：

- [en_US-ljspeech-high.onnx](https://huggingface.co/rhasspy/piper-voices/resolve/main/en/en_US/ljspeech/high/en_US-ljspeech-high.onnx)
- [en_US-ljspeech-high.onnx.json](https://huggingface.co/rhasspy/piper-voices/resolve/main/en/en_US/ljspeech/high/en_US-ljspeech-high.onnx.json)

生成脚本校验模型与配置的 SHA-256（见 ASSETS.md），防止上游文件变化时静默换音源。macOS / Linux：

```sh
PIPER_PYTHON=.audio-tools/bin/python node scripts/build-english-audio.mjs /absolute/path/en_US-ljspeech-high.onnx
node --test tests/*.test.mjs
```

Windows PowerShell：

```powershell
$env:PIPER_PYTHON = '.audio-tools\Scripts\python.exe'
node scripts/build-english-audio.mjs C:\voices\en_US-ljspeech-high.onnx
```

生成脚本复用同文本、同模型及参数的既有文件；更新后检查清单引用，并删除不再引用的旧音频。所有音频随源码提交，测试不会因为缺少音频而跳过。合成发音仍需结合实际教学听审。

覆盖更新需同包名、同签名并递增版本。不先卸载，业务记录仍需独立验证；备份尚未实现。APK 暂不作为 GitHub Release 分发。
