<template>
  <view class="page-content">
    <view class="task-card">
      <text class="task-title">今日小任务</text>
      <text class="task-desc">{{ currentTask.content || '选择类别抽取今天的任务吧！' }}</text>
      <text class="task-category" v-if="currentTask.content">{{ currentTask.category }}</text>
    </view>

    <view class="category-section">
      <view
        v-for="(category, index) in categories"
        :key="index"
        class="category-item"
        :class="{ active: selectedCategory === category }"
        @click="selectCategory(category)"
      >
        <text class="category-text">{{ category }}</text>
      </view>
    </view>

    <button class="draw-button" @click="drawTask">抽取任务</button>
  </view>
</template>

<script>
export default {
  data() {
    return {
      categories: ['学习', '家务', '运动', '兴趣'],
      selectedCategory: '',
      tasks: [
        // 学习类
        { content: '读一首古诗', category: '学习' },
        { content: '练习写字15分钟', category: '学习' },
        { content: '背诵一篇课文', category: '学习' },
        { content: '做一道数学题', category: '学习' },
        { content: '学习一个成语故事', category: '学习' },
        { content: '阅读一篇童话故事', category: '学习' },
        { content: '练习英语口语5分钟', category: '学习' },
        { content: '复习今天的课程', category: '学习' },

        // 家务类
        { content: '整理书桌', category: '家务' },
        { content: '叠被子', category: '家务' },
        { content: '帮忙晾衣服', category: '家务' },
        { content: '给花浇水', category: '家务' },
        { content: '整理玩具', category: '家务' },
        { content: '帮忙擦桌子', category: '家务' },
        { content: '整理书包', category: '家务' },
        { content: '收拾自己的衣物', category: '家务' },

        // 运动类
        { content: '做10个俯卧撑', category: '运动' },
        { content: '跳绳100下', category: '运动' },
        { content: '做5分钟体操', category: '运动' },
        { content: '原地跑步3分钟', category: '运动' },
        { content: '做10个深蹲', category: '运动' },
        { content: '踢毽子10分钟', category: '运动' },
        { content: '打乒乓球练习', category: '运动' },

        // 兴趣类
        { content: '画一幅画', category: '兴趣' },
        { content: '折一个纸飞机', category: '兴趣' },
        { content: '学一首儿歌', category: '兴趣' },
        { content: '练习一首歌', category: '兴趣' },
        { content: '做一件手工', category: '兴趣' },
        { content: '玩一次拼图', category: '兴趣' },
        { content: '练习书法', category: '兴趣' }
      ],
      currentTask: {}
    }
  },
  methods: {
    selectCategory(category) {
      this.selectedCategory = category
      this.currentTask = {}
    },
    drawTask() {
      if (!this.selectedCategory) {
        uni.showToast({
          title: '请先选择任务类别',
          icon: 'none'
        })
        return
      }

      const categoryTasks = this.tasks.filter(task => task.category === this.selectedCategory)
      const randomIndex = Math.floor(Math.random() * categoryTasks.length)
      this.currentTask = categoryTasks[randomIndex]
    }
  }
}
</script>

<style>
.page-content {
  padding: 32rpx;
  background: #f8f8f8;
  min-height: 100vh;
}

.task-card {
  background: linear-gradient(135deg, #9c27b0 0%, #673ab7 100%);
  border-radius: 32rpx;
  padding: 48rpx;
  margin: 40rpx 0;
  color: white;
  text-align: center;
  min-height: 400rpx;
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  box-shadow: 0 16rpx 48rpx rgba(156, 39, 176, 0.2);
  position: relative;
  overflow: hidden;
}

.task-card::before {
  content: '';
  position: absolute;
  top: -50%;
  left: -50%;
  width: 200%;
  height: 200%;
  background: radial-gradient(circle, rgba(255,255,255,0.1) 0%, transparent 60%);
  transform: rotate(45deg);
}

.category-section {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 24rpx;
  margin: 40rpx 0;
}

.category-item {
  background: white;
  border-radius: 16rpx;
  padding: 32rpx;
  text-align: center;
  box-shadow: 0 4rpx 12rpx rgba(0,0,0,0.05);
  transition: all 0.3s;
}

.category-item.active {
  background: #9c27b0;
  color: white;
  transform: scale(1.02);
}

.category-text {
  font-size: 32rpx;
  font-weight: 500;
}

.draw-button {
  background: #9c27b0;
  color: white;
  border: none;
  border-radius: 48rpx;
  padding: 24rpx 64rpx;
  font-size: 32rpx;
  margin-top: 40rpx;
  box-shadow: 0 8rpx 24rpx rgba(156, 39, 176, 0.2);
  width: 100%;
}

.task-title {
  font-size: 48rpx;
  margin-bottom: 24rpx;
  font-weight: 500;
}

.task-desc {
  font-size: 36rpx;
  opacity: 0.9;
  margin: 32rpx 0;
  min-height: 100rpx;
  display: flex;
  align-items: center;
  justify-content: center;
}

.task-category {
  font-size: 24rpx;
  color: rgba(255, 255, 255, 0.8);
  background: rgba(255, 255, 255, 0.2);
  padding: 8rpx 24rpx;
  border-radius: 24rpx;
  margin-top: 16rpx;
}
</style>
