<template>
  <view class="message-page">
    <view
      v-for="item in messages"
      :key="item.id"
      class="message-page__item"
      @click="openMessage(item.id)"
    >
      <view class="message-page__top">
        <text class="message-page__title">{{ item.title }}</text>
        <text class="message-page__time">{{ item.time }}</text>
      </view>
      <text class="message-page__content">{{ item.content }}</text>
      <view v-if="!item.read" class="message-page__dot" />
    </view>
  </view>
</template>

<script setup lang="ts">
const messages = [
  {
    id: "1",
    title: "任务分配提醒",
    content: "张三将任务「优化登录页表单校验逻辑」分配给你",
    time: "10:30",
    read: false
  },
  {
    id: "2",
    title: "进度汇报",
    content: "李四提交了任务进度汇报，当前进度 90%",
    time: "昨天",
    read: true
  }
];

function openMessage(id: string) {
  uni.showToast({ title: `消息 ${id}`, icon: "none" });
}
</script>

<style lang="scss" scoped>
@import "@/styles/tokens.scss";
@import "@/styles/mixins.scss";

.message-page {
  padding: 24rpx;
}

.message-page__item {
  @include pm-card;
  position: relative;
  padding: 24rpx;
  margin-bottom: 20rpx;
}

.message-page__top {
  @include pm-flex-between;
  margin-bottom: 8rpx;
}

.message-page__title {
  font-size: 28rpx;
  font-weight: 600;
  color: $pm-text-primary;
}

.message-page__time {
  font-size: 22rpx;
  color: $pm-text-secondary;
}

.message-page__content {
  font-size: 24rpx;
  color: $pm-text-regular;
  line-height: 1.5;
}

.message-page__dot {
  position: absolute;
  top: 24rpx;
  right: 24rpx;
  width: 12rpx;
  height: 12rpx;
  border-radius: 50%;
  background: $pm-danger;
}
</style>
