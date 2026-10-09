<template>
  <view class="family-page essays-page">
    <view class="card hero"><view><text class="heading">作文范例 · 四年级上册</text><text class="muted">对应统编版（人教）八个习作单元。范文是给孩子的对照样本，一起读读写写，不要照抄。</text></view></view>
    <text v-if="error" class="error">{{ error }}</text>
    <view v-for="item in compositions" :key="item.id" class="card essay-card">
      <button class="essay-toggle" :aria-expanded="openId === item.id" @click="toggle(item.id)">
        <view><text class="essay-title">{{ item.unit }} · {{ item.topic }}</text><text class="muted">{{ item.genre }} · 范文约 {{ item.words }} 字</text></view>
        <text class="essay-arrow">{{ openId === item.id ? '收起 −' : '展开 ＋' }}</text>
      </button>
      <view v-if="openId === item.id" class="essay-body">
        <view class="tips">
          <text class="subheading">怎么写好这篇</text>
          <text v-for="(tip, index) in item.tips" :key="index" class="tip">{{ index + 1 }}. {{ tip }}</text>
          <view class="prompts"><text v-for="(prompt, index) in item.prompts" :key="index" class="prompt">想一想：{{ prompt }}</text></view>
        </view>
        <view class="sample">
          <text class="sample-title">{{ item.sample.title }}</text>
          <text v-for="(paragraph, index) in item.sample.paragraphs" :key="index" class="paragraph">{{ paragraph }}</text>
        </view>
        <text class="muted">范文为本应用原创，按四年级上学期水平编写；和孩子自己的经历换一换，才是最好的作文。</text>
      </view>
    </view>
    <text class="muted footer">内容随应用保存在本机，查看不需要联网。</text>
  </view>
</template>
<script>
import { compositions } from '@/data/compositions.mjs'
export default {
  data() { return { compositions, openId: '', error: '' } },
  methods: {
    toggle(id) { this.openId = this.openId === id ? '' : id }
  }
}
</script>
<style src="@/styles/family.css"></style>
<style scoped>
.hero .heading { display: block; font-size: 20px; margin-bottom: 6px; }.hero .muted { display: block; font-size: 13px; }
.essay-card { padding: 0; overflow: hidden; }.essay-toggle { display: flex; align-items: center; justify-content: space-between; gap: 10px; width: 100%; margin: 0; padding: 15px 16px; text-align: left; background: #fff; border-radius: 0; font-size: 14px; line-height: 1.5; }.essay-title { display: block; color: #23476e; font-size: 16px; font-weight: 650; margin-bottom: 4px; }.essay-toggle .muted { display: block; font-size: 12px; }.essay-arrow { flex-shrink: 0; color: #557399; font-size: 12px; }
.essay-body { padding: 0 16px 16px; border-top: 1px dashed #e2ecf7; }
.tips { background: #f2f7fd; border-radius: 14px; padding: 14px; margin-top: 14px; }.subheading { display: block; font-weight: 650; color: #23476e; margin-bottom: 8px; font-size: 14px; }.tip { display: block; font-size: 13px; color: #45638a; line-height: 1.9; }.prompts { margin-top: 8px; }.prompt { display: block; font-size: 12px; color: #6b5a86; background: #efeafa; border-radius: 9px; padding: 6px 10px; margin-top: 6px; }
.sample { margin-top: 14px; background: #fffdf6; border: 1px solid #efe6cf; border-radius: 14px; padding: 16px; }.sample-title { display: block; text-align: center; font-size: 16px; font-weight: 650; color: #4c4029; margin-bottom: 12px; }.paragraph { display: block; font-size: 15px; color: #4a4433; line-height: 2; margin-bottom: 8px; text-indent: 2em; }
.essay-body > .muted { display: block; margin-top: 12px; font-size: 12px; }
.footer { display: block; margin-top: 14px; text-align: center; font-size: 12px; }
</style>
