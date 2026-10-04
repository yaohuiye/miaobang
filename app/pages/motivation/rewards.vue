<template>
  <!-- 在最外层添加 canvas -->
  <view class="rewards-page">
    <!-- 修改 canvas 元素的尺寸单位 -->
    <canvas canvas-id="reward-canvas" style="width: 1200rpx; height: 1000rpx; position: fixed; left: -9999rpx;"></canvas>
    <!-- 奖励类型选择 -->
    <view class="section">
      <text class="section-title">选择奖励类型</text>
      <view class="reward-types">
        <view
          v-for="(type, index) in rewardTypes"
          :key="index"
          :class="['reward-type', selectedType === type.id ? 'active' : '']"
          @click="selectType(type.id)"
        >
          <text>{{ type.name }}</text>
        </view>
      </view>
    </view>

    <!-- 定制内容 -->
    <view class="section">
      <text class="section-title">定制内容</text>
      <view class="input-group">
        <text class="input-label">孩子姓名</text>
        <input
          type="text"
          class="input-box"
          v-model="childName"
          placeholder="请输入孩子的名字"
        />
      </view>

      <!-- 修改表扬内容输入框为textarea -->
      <view class="input-group">
        <text class="input-label">表扬内容</text>
        <textarea
          class="input-box textarea"
          v-model="content"
          placeholder="请输入表扬内容或选择预设内容"
        />
      </view>

      <view class="input-group">
        <text class="input-label">选择背景样式</text>
        <view class="background-options">
          <view
            v-for="(bg, index) in backgrounds"
            :key="index"
            :class="['background-option', selectedBg === index ? 'active' : '']"
            :style="{ background: bg }"
            @click="selectBackground(index)"
          ></view>
        </view>
      </view>
    </view>

    <!-- 预览效果 -->
    <view class="section">
      <view class="section-header">
        <text class="section-title">预览效果</text>
      </view>
      <view class="preview-card" :style="{ background: backgrounds[selectedBg] }">
        <view class="reward-icon">
          <image :src="rewardTypes[selectedType].icon" mode="aspectFit" />
        </view>
        <text class="reward-title">{{ previewTitle }}</text><br>
        <text class="reward-desc">{{ content || '今天认真完成了作业，继续加油！' }}</text>
      </view>
    </view>

    <!-- 底部按钮 -->
    <view class="action-buttons">
      <button class="btn btn-primary" @click="saveReward">下载保存</button>
    </view>
  </view>
</template>

<script>
export default {
  data() {
    return {
      rewardTypes: [
        { id: 0, name: '小红花', icon: '/static/icons/flower.png' },
        { id: 1, name: '奖章', icon: '/static/icons/jiangzhang.png' },
        { id: 2, name: '表扬卡', icon: '/static/icons/biaoyang.png' },
        { id: 3, name: '成就证书', icon: '/static/icons/zhengshu.png' }
      ],
      backgrounds: [
        'linear-gradient(135deg, #FF6B6B 0%, #FF8E53 100%)',
        'linear-gradient(135deg, #4A90E2 0%, #50E3C2 100%)',
        'linear-gradient(135deg, #F5A623 0%, #FFE259 100%)',
        'linear-gradient(135deg, #B6E3FF 0%, #52A0FD 100%)'
      ],
      selectedType: 0,
      selectedBg: 0,
      childName: '',
      content: ''
    }
  },
  computed: {
    previewTitle() {
      return this.childName ? `${this.childName}真棒！` : '小朋友真棒！'
    }
  },
  methods: {
    selectType(typeId) {
      this.selectedType = typeId
    },
    selectBackground(index) {
      this.selectedBg = index
    },
    resetDesign() {
      this.selectedType = 0
      this.selectedBg = 0
      this.childName = ''
      this.content = ''
    },
    async saveReward() {
      try {
        const canvasId = 'reward-canvas'
        const ctx = uni.createCanvasContext(canvasId, this)

        // 调整画布尺寸为全屏宽度
        const width = 600  // 对应 750rpx
        const height = 500 // 对应 1000rpx

        // 创建渐变背景
        const grd = ctx.createLinearGradient(0, 0, width * 0.8, width * 0.8)  // 修改渐变方向
        switch(this.selectedBg) {
          case 0:
            grd.addColorStop(0, '#FF6B6B')
            grd.addColorStop(1, '#FF8E53')
            break
          case 1:
            grd.addColorStop(0, '#4A90E2')
            grd.addColorStop(1, '#50E3C2')
            break
          case 2:
            grd.addColorStop(0, '#F5A623')
            grd.addColorStop(1, '#FFE259')
            break
          case 3:
            grd.addColorStop(0, '#B6E3FF')
            grd.addColorStop(1, '#52A0FD')
            break
        }
        console.log('创建渐变背景:', grd)
        // 绘制渐变背景
        ctx.setFillStyle(grd)
        ctx.fillRect(0, 0, width, height)

        // 绘制白色圆形背景
        const iconSize = width * 0.3
        const iconX = (width - iconSize) / 2
        const iconY = height * 0.15
        ctx.setFillStyle('#ffffff')
        ctx.beginPath()
        ctx.arc(iconX + iconSize/2, iconY + iconSize/2, iconSize/2, 0, Math.PI * 2)
        ctx.fill()

        // 绘制奖励图标
        ctx.drawImage(this.rewardTypes[this.selectedType].icon,
          iconX + iconSize * 0.15,
          iconY + iconSize * 0.15,
          iconSize * 0.7,
          iconSize * 0.7
        )

        // 居中绘制文字
        ctx.setTextAlign('center')
        ctx.setTextBaseline('middle')

        // 绘制标题
        ctx.setFontSize(width * 0.12)
        ctx.setFillStyle('#ffffff')
        ctx.fillText(this.previewTitle, width/2, height * 0.6)

        // 绘制描述文字
        ctx.setFontSize(width * 0.05)
        const text = this.content || '今天认真完成了作业，继续加油！'
        ctx.fillText(text, width/2, height * 0.75)

        // 确保绘制完成后再执行下一步
        await new Promise(resolve => {
          ctx.draw(true, resolve)
        })

        console.log('绘制完成...')

        // 延迟一下再保存，确保绘制完成
        setTimeout(() => {
          uni.canvasToTempFilePath({
            canvasId: canvasId,
            success: (res) => {
              console.log('生成临时文件成功:', res.tempFilePath)
              uni.saveImageToPhotosAlbum({
                filePath: res.tempFilePath,
                success: () => {
                  uni.showToast({
                    title: '已保存到相册',
                    icon: 'success'
                  })
                },
                fail: (err) => {
                  if (err.errMsg.includes('auth deny')) {
                    uni.showModal({
                      title: '提示',
                      content: '需要相册权限才能保存，请在设置中允许访问相册',
                      success: (res) => {
                        if (res.confirm) {
                          uni.openSetting()
                        }
                      }
                    })
                  }
                }
              })
            },
            fail: (err) => {
              console.error('生成图片失败:', err)
              uni.showToast({
                title: '生成图片失败',
                icon: 'error'
              })
            }
          })
        }, 300)
      } catch (error) {
        console.error('保存失败:', error)
        uni.showToast({
          title: '保存失败',
          icon: 'error'
        })
      }
    }
  }
}
</script>

<style>
.rewards-page {
  padding: 32rpx;
  background: #f8f8f8;
  min-height: 100vh;
}

.section {
  background: #ffffff;
  border-radius: 24rpx;
  padding: 32rpx;
  margin-bottom: 32rpx;
}

.section-title {
  font-size: 32rpx;
  color: #333;
  font-weight: 600;
  margin-bottom: 24rpx;
}

.reward-types {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 24rpx;
}

.reward-type {
  background: #f5f5f5;
  border-radius: 16rpx;
  padding: 32rpx;
  text-align: center;
  font-size: 28rpx;
  color: #666;
  transition: all 0.3s;
}

.reward-type.active {
  background: #4A90E2;
  color: white;
}

.input-group {
  margin-bottom: 32rpx;
}

.input-label {
  font-size: 28rpx;
  color: #666;
  margin-bottom: 16rpx;
}

.input-box {
  width: 100%;
  height: 80rpx;
  background: #f5f5f5;
  border-radius: 16rpx;
  padding: 0 24rpx;
  font-size: 28rpx;
}

.background-options {
  display: flex;
  gap: 16rpx;
  overflow-x: auto;
  padding: 8rpx;
}

.background-option {
  width: 96rpx;
  height: 96rpx;
  border-radius: 16rpx;
  flex-shrink: 0;
  border: 4rpx solid transparent;
}

.background-option.active {
  border-color: #4A90E2;
}

.preview-card {
  border-radius: 32rpx;
  padding: 48rpx;
  text-align: center;
  color: white;
  margin-top: 32rpx;
}

.reward-icon {
  width: 160rpx;
  height: 160rpx;
  margin: 0 auto 32rpx;
  background: white;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
}

.reward-icon image {
  width: 100rpx;
  height: 100rpx;
}

.reward-title {
  font-size: 48rpx;
  font-weight: 500;
  margin-bottom: 16rpx;
}

.reward-desc {
  font-size: 32rpx;
  opacity: 0.9;
  white-space: pre-line; /* 改用pre-line处理换行 */
  line-height: 1.6;
  padding: 0 32rpx;
}

.input-box.textarea {
  height: 160rpx;
  padding: 16rpx 24rpx;
  line-height: 1.6;
}


.section-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 24rpx;
}


.action-buttons {
  position: fixed;
  bottom: 0;
  left: 0;
  right: 0;
  padding: 24rpx;
  background: rgba(255, 255, 255, 0.9);
  backdrop-filter: blur(10px);
  box-shadow: 0 -4rpx 20rpx rgba(0,0,0,0.05);
  display: flex;
  gap: 24rpx;
}

.btn {
  flex: 1;
  height: 88rpx;
  border-radius: 44rpx;
  font-size: 32rpx;
  font-weight: 500;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.3s;
}

.btn-primary {
  background: rgba(156, 39, 176, 0.1);
  color: #9c27b0;
  border: 2rpx solid rgba(156, 39, 176, 0.3);
}

.btn-primary:active {
  background: rgba(156, 39, 176, 0.2);
}

</style>
