<template>
  <view class="container tool-page">
    <view class="page-content">
      <view class="tool-header"><image src="/static/ui/book.png" mode="aspectFit" /><view><text class="tool-title">古诗助手</text><text class="tool-copy">一起读一首诗，慢慢理解其中的意思。</text></view></view>
      <view class="search-section">
        <input v-model="searchText" class="search-input" type="text" placeholder="搜索古诗" />
        <button class="search-button" @click="searchPoetry">搜索</button>
      </view>

      <view class="poetry-card" v-if="currentPoetry">
        <view class="poetry-header">
          <view class="title-card">
            <text class="poetry-title">{{currentPoetry.title}}</text><br><br>
            <text class="poetry-author">[{{currentPoetry.dynasty}}] {{currentPoetry.author}}</text>
          </view>
        </view>

        <view class="poetry-content">
          <view v-for="(line, index) in currentPoetry.lines" :key="index" class="poetry-line">
            <view class="pinyin-row">
              <text v-for="(pinyin, pIndex) in line.pinyins"
                    :key="'p'+pIndex"
                    class="pinyin-text"
                    :style="{width: `${100/line.pinyins.length}%`}">
                {{pinyin}}
              </text>
            </view>
            <view class="character-row">
              <text v-for="(char, cIndex) in line.characters"
                    :key="'c'+cIndex"
                    class="character-text"
                    :style="{width: `${100/line.characters.length}%`}">
                {{char}}
              </text>
            </view>
          </view>
        </view>

        <view class="poetry-info">
          <view class="info-section" v-if="currentPoetry.keywords && currentPoetry.keywords.length">
            <text class="info-label">关键词：</text>
            <view class="tags-container">
              <text v-for="(keyword, index) in currentPoetry.keywords.slice(0, 3)"
                    :key="index"
                    class="keyword-tag">
                {{keyword}}
              </text>
            </view>
          </view>

          <view class="info-section" v-for="(trans, idx) in currentPoetry.annotations" :key="'trans'+idx">
            <text class="info-label">译文{{currentPoetry.annotations.length > 1 ? idx+1 : ''}}：</text>
            <text class="info-value">{{trans.translation.join('；')}}</text>
          </view>

          <view class="info-section" v-for="(anno, idx) in currentPoetry.annotations" :key="'anno'+idx">
            <text class="info-label">注释{{currentPoetry.annotations.length > 1 ? idx+1 : ''}}：</text>
            <text class="info-value">{{anno.annotation.join('；')}}</text>
          </view>
        </view>


      </view>
    </view>
  </view>
</template>

<script>
import poems from '@/data/poems.js'

export default {
  data() {
    return {
      searchText: '',
      currentPoetry: null,
      audioContext: null,
      allPoems: []
    }
  },
  created() {
    // 初始化时扁平化诗词数据
    this.allPoems = poems.flat(2)
    // 随机展示一首诗
    this.showRandomPoetry()
  },
  methods: {
    showRandomPoetry() {
      const randomIndex = Math.floor(Math.random() * this.allPoems.length)
      this.currentPoetry = this.allPoems[randomIndex]
    },

    async searchPoetry() {
      if (!this.searchText) {
        this.showRandomPoetry()
        return
      }

      try {
        const poetry = await this.fetchPoetry(this.searchText)
        this.currentPoetry = poetry
      } catch (error) {
        uni.showToast({
          title: '未找到相关古诗',
          icon: 'none'
        })
      }
    },

    async fetchPoetry(keyword) {
      const found = this.allPoems.find(p =>
        p.title.includes(keyword) ||
        p.author.includes(keyword) ||
        p.lines.some(line => line.characters.join('').includes(keyword))
      )

      if (!found) {
        throw new Error('古诗未找到')
      }

      return found
    }
  }
}
</script>

<style scoped>
.container {
  background-color: #f8f8f8;
  min-height: 100vh;
  padding: 20px;
}

.page-content {
  max-width: 600px;
  margin: 0 auto;
}

.search-section {
  display: flex;
  gap: 12px;
  margin-bottom: 24px;
}

.search-input {
  flex: 1;
  height: 50px;
  padding: 0 16px;
  font-size: 18px;
  border: 2px solid #4A90E2;
  border-radius: 10px;
  background: #fff;
}

.search-button {
  height: 50px;
  padding: 0 24px;
  font-size: 18px;
  color: #fff;
  background: #4A90E2;
  border-radius: 10px;
  border: none;
}

.poetry-card {
  /* 基础布局 */
  padding: 28px;
  border-radius: 24px;

  /* 玻璃态背景（半透明+模糊） */
  background: rgba(255, 255, 255, 0.6);
  backdrop-filter: blur(12px);
  -webkit-backdrop-filter: blur(12px);

  /* 渐变边框（伪元素实现） */
  border: 1px solid transparent;
  position: relative;
  overflow: hidden;
  z-index: 1;
}

/* 渐变边框的伪元素 */
.poetry-card::before {
  content: '';
  position: absolute;
  top: -2px;
  left: -2px;
  right: -2px;
  bottom: -2px;
  background: linear-gradient(135deg,
    rgba(255, 255, 255, 0.8) 0%,
    rgba(200, 220, 255, 0.5) 50%,
    rgba(255, 255, 255, 0.8) 100%);
  border-radius: 26px; /* 比主容器大2px */
  z-index: -1;
  opacity: 0.8;
}

/* 阴影（多层增强立体感） */
.poetry-card {
  box-shadow:
    0 4px 6px rgba(0, 0, 0, 0.05),
    0 10px 15px rgba(0, 0, 0, 0.1),
    0 0 0 1px rgba(255, 255, 255, 0.3) inset;
}


.poetry-header {
  text-align: center;
  margin-bottom: 20px;
  border-bottom: 1px dashed #eee;
  padding-bottom: 20px;
}

.poetry-title {
  font-size: 18px;
  font-weight: bold;
  color: #333;
  margin-bottom: 8px;
}

.poetry-author {
  padding-top: 5px;
  font-size: 14px;
  color: #666;
}

.poetry-content {
  margin-bottom: 24px;
  padding: 0 15px;
}

.poetry-line {
  font-size: 18px;
  line-height: 2;
  text-align: center;
  color: #333;
}


.pinyin-row, .character-row {
  display: flex;
  justify-content: center;
  gap: 16px;
}


.pinyin-container, .char-container {
  width: 36px;
  text-align: center;
}

.pinyin-text {
  font-size: 14px;
  color: #5c7999;
  font-family: -apple-system, BlinkMacSystemFont, "PingFang SC", sans-serif;
}


.character-text {
  font-size: 24px;
  color: #2c3e50;
  font-family: "STKaiti", "KaiTi", serif;
  font-weight: 500;
}

.pinyin-row {
  margin-bottom: 8px;
}
.poetry-info {
  background: rgba(245, 248, 255, 0.8);
  border-radius: 16px;
  padding: 24px;
  margin-bottom: 24px;
  border: 1px solid rgba(200, 210, 230, 0.5);
}

.info-section {
  margin-bottom: 20px;
  line-height: 1.8;
}

.info-label {
  font-size: 15px;
  font-weight: 600;
  color: #4A90E2;
  display: block;
  margin-bottom: 6px;
  letter-spacing: 0.5px;
}

.info-value {
  font-size: 15px;
  color: #555;
  line-height: 1.8;
  letter-spacing: 0.3px;
  display: block;
  padding-left: 12px;
  border-left: 2px solid rgba(74, 144, 226, 0.2);
}

.tags-container {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  margin-top: 8px;
}

.keyword-tag {
  display: inline-block;
  padding: 2px 8px;
  background-color: rgba(74, 144, 226, 0.1);
  color: #1976D2;
  border-radius: 10px;
  font-size: 10px;
  border: 1px solid rgba(74, 144, 226, 0.2);
}

</style>
<style src="@/styles/tools.css"></style>
