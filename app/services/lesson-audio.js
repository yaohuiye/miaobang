import { createLessonPlayer } from '@/knowledge/audio.mjs'
// Used by the dictionary and both English games. Playback starts only on a tap.
export const lessonAudioMixin = {
  data() { return { audioState: { phase: 'idle', key: '', error: '' } } },
  created() { this.lessonPlayer = createLessonPlayer(() => uni.createInnerAudioContext(), state => { this.audioState = state }) },
  onHide() { this.stopAudio() },
  onUnload() { this.stopAudio() },
  beforeUnmount() { this.stopAudio() },
  methods: {
    playAudio(clip) { if (clip) this.lessonPlayer.play(clip.src, clip.src) },
    stopAudio() { this.lessonPlayer?.stop() }
  }
}
