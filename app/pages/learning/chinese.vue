<template>
  <view class="container tool-page">
    <view class="page-content">
      <view class="tool-header"><image src="/static/ui/book.png" mode="aspectFit" /><view><text class="tool-title">汉字查询</text><text class="tool-copy">认一个字，看看它的拼音和部首。</text></view></view>
      <view class="input-section">
        <input
          v-model="character"
          class="character-input"
          type="text"
          @input="handleInput"
          placeholder="请输入汉字"
        />
        <button class="primary-button" @click="showCharacterDetails">查询</button>
      </view>

      <view class="character-card" v-if="currentCharacter">
        <view class="character-header">
          <text class="large-character">{{currentCharacter.name}}</text>
          <text class="pinyin">{{currentCharacter.pinyin}}</text>
        </view>

        <view class="character-details">
          <view class="detail-item">
            <text class="detail-label">年级</text>
            <text class="detail-value">{{currentCharacter.grade}}</text>
          </view>
          <view class="detail-item">
            <text class="detail-label">笔画数</text>
            <text class="detail-value">{{currentCharacter.stroke_count}}</text>
          </view>
          <view class="detail-item">
            <text class="detail-label">部首</text>
            <text class="detail-value">{{currentCharacter.radicals}}</text>
          </view>
          <view class="detail-item">
            <text class="detail-label">难度</text>
            <text class="detail-value" :class="difficultyClass">{{currentCharacter.difficulty}}</text>
          </view>
        </view>
      </view>
    </view>
  </view>
</template>

<script>
import { characters } from '@/data/characters.js'

export default {
  data() {
    return {
      character: '爱',  // 设置默认值为"爱"
      currentCharacter: null,
      characterMap: null
    }
  },
  computed: {
    difficultyClass() {
      if (!this.currentCharacter) return ''
      return {
        'easy': this.currentCharacter.difficulty === '简单',
        'medium': this.currentCharacter.difficulty === '普通',
        'hard': this.currentCharacter.difficulty === '复杂'
      }
    }
  },
  created() {
    // 创建字符映射以提高查询效率
    this.characterMap = new Map(
      characters.map(char => [char.name, char])
    )
    // 组件创建后立即查询"爱"字
    this.showCharacterDetails()
  },
  methods: {
    handleInput(e) {
      // 获取输入值并只保留第一个字符
      const value = e.detail.value;
      if (value.length > 1) {
        this.character = value.charAt(0);
        // 强制更新视图
        this.$nextTick(() => {
          this.character = value.charAt(0);
        });
      } else {
        this.character = value;
      }
    },
    async showCharacterDetails() {
      if (!this.character) {
        uni.showToast({
          title: '请输入汉字',
          icon: 'none'
        })
        return
      }

      try {
        const response = await this.fetchCharacterData(this.character)
        this.currentCharacter = response
      } catch (error) {
        uni.showToast({
          title: '暂不支持该汉字',
          icon: 'none'
        })
        this.currentCharacter = null
      }
    },

    async fetchCharacterData(character) {
      // 确保输入是有效的汉字
      if (!/^[\u4e00-\u9fa5]$/.test(character)) {
        throw new Error('请输入有效的汉字')
      }

      const found = this.characterMap.get(character)

      if (!found) {
        throw new Error('暂不支持该汉字')
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

.input-section {
  display: flex;
  gap: 12px;
  margin-bottom: 24px;
}

.character-input {
  flex: 1;
  height: 50px;
  padding: 0 16px;
  font-size: 18px;
  border: 2px solid #4A90E2;
  border-radius: 10px;
  background: #fff;
}

.primary-button {
  height: 50px;
  padding: 0 24px;
  font-size: 18px;
  color: #fff;
  background: #4A90E2;
  border-radius: 10px;
  border: none;
}

.character-card {
  background: #fff;
  border-radius: 16px;
  padding: 25px;
  box-shadow: 0 8px 20px rgba(0,0,0,0.1);
}

.character-header {
  display: flex;
  flex-direction: column;
  align-items: center;
  margin-bottom: 20px;
  border-bottom: 2px dashed #eee;
  padding-bottom: 20px;
}

.large-character {
  font-size: 80px;
  line-height: 1.2;
  color: #333;
  font-weight: bold;
}

.pinyin {
  font-size: 24px;
  color: #FF6B6B;
  margin-top: 10px;
}

.character-details {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 15px;
}

.detail-item {
  display: flex;
  flex-direction: column;
}

.detail-label {
  font-size: 14px;
  color: #888;
  margin-bottom: 5px;
}

.detail-value {
  font-size: 18px;
  color: #333;
  font-weight: 500;
}

.easy {
  color: #4CAF50;
}

.medium {
  color: #FF9800;
}

.hard {
  color: #F44336;
}

</style>
<style src="@/styles/tools.css"></style>
