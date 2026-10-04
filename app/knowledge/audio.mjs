// One active context per page; ignore events from an old clip after switching or leaving.
export function createLessonPlayer(createContext, onState) {
  let current = null
  function stop() {
    const old = current
    current = null
    if (old) { try { old.stop() } finally { old.destroy() } }
    onState({ phase: 'idle', key: '', error: '' })
  }
  return {
    stop,
    play(src, key = src) {
      stop()
      try {
        const context = createContext()
        current = context
        const update = (phase, error = '') => { if (current === context) onState({ phase, key, error }) }
        context.autoplay = false
        context.loop = false
        context.onPlay(() => update('playing'))
        context.onEnded(() => update('idle'))
        context.onError(() => update('error', '这段声音暂时没能播放，请点一下重试。也可以先看文字一起读。'))
        onState({ phase: 'loading', key, error: '' })
        context.src = src
        context.play()
      } catch (error) {
        stop()
        onState({ phase: 'error', key, error: '这段声音暂时没能播放，请点一下重试。也可以先看文字一起读。' })
      }
    }
  }
}
