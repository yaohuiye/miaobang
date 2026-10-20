<template>
  <view class="family-portrait" :class="{ 'portrait-loaded': loaded }" aria-hidden="true">
    <view class="portrait-fallback">
      <slot>
        <text v-if="fallbackSymbol" class="portrait-symbol">{{ fallbackSymbol }}</text>
        <image v-else :src="fallback" :mode="mode" class="portrait-image" />
      </slot>
    </view>
    <image v-if="!failed" :key="source" :src="source" :mode="mode" class="portrait-image portrait-private"
      @load="loaded = true" @error="onError" />
  </view>
</template>

<script>
import { privatePortraitPath } from '../../family/portraits.mjs'
export default {
  props: {
    pose: { type: String, default: 'ready' },
    fallback: { type: String, default: '/static/puzzle/robot-miao.png' },
    fallbackSymbol: { type: String, default: '' },
    mode: { type: String, default: 'aspectFit' }
  },
  data() { return { loaded: false, failed: false } },
  computed: { source() { return privatePortraitPath(this.pose) } },
  watch: { source() { this.loaded = false; this.failed = false } },
  methods: { onError() { this.loaded = false; this.failed = true } }
}
</script>

<style scoped>
.family-portrait { display:block;position:relative;width:100%;height:100%;pointer-events:none; }
.portrait-fallback { position:absolute;inset:0;display:flex;align-items:center;justify-content:center; }
.portrait-loaded .portrait-fallback { visibility:hidden; }
.portrait-image { display:block;width:100%;height:100%; }
.portrait-private { position:absolute;inset:0;opacity:0; }
.portrait-loaded .portrait-private { opacity:1; }
.portrait-symbol { font-size:inherit;line-height:1; }
</style>
