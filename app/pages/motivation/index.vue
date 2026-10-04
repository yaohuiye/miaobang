<template>
	<view class="container">
		<view class="page-content">
			<view class="grid-list">
				<view class="grid-item" @click="navigateTo('/pages/motivation/rewards')">
					<image class="grid-item-icon" src="/static/icons/rewards.png" mode="aspectFit"></image>
					<view class="grid-item-title">小红花生成器</view>
					<view class="grid-item-desc">定制化电子奖励贴纸</view>
				</view>
			</view>
		</view>
	</view>
</template>

<script>
export default {
	data() {
		return {}
	},
	methods: {
		navigateTo(url) {
			uni.navigateTo({
				url
			})
		}
	}
}
</script>

<style>
.container {
	background-color: #f8f8f8;
	min-height: 100vh;
}

.page-content {
	padding: 16px;
}

.grid-list {
	display: grid;
	grid-template-columns: repeat(2, 1fr);
	gap: 16px;
}

.grid-item {
	background: linear-gradient(135deg, #ffffff 0%, #f5f5f5 100%);
	border-radius: 12px;
	padding: 20px;
	text-align: center;
	box-shadow: 0 4px 12px rgba(0,0,0,0.05);
	display: flex;
	flex-direction: column;
	align-items: center;
	min-height: 120px;
}

.grid-item-icon {
	width: 32px;
	height: 32px;
	margin-bottom: 8px;
}

.grid-item-title {
	font-size: 14px;
	color: #333;
	margin-bottom: 4px;
}

.grid-item-desc {
	font-size: 12px;
	color: #666;
	line-height: 1.4;
}
</style>
