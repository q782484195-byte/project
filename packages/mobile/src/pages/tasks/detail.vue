<template>
  <view class="task-detail-page">
    <view class="task-detail-page__head">
      <text class="task-detail-page__title">{{ task.title }}</text>
      <view class="task-detail-page__tags">
        <pm-status-tag :label="task.status" :tone="getStatusTone(task.status)" />
        <pm-status-tag :label="task.priority" :tone="getPriorityTone(task.priority)" />
      </view>
    </view>

    <view class="task-detail-page__panel">
      <view v-for="row in infoRows" :key="row.label" class="task-detail-page__row">
        <text class="task-detail-page__label">{{ row.label }}</text>
        <text class="task-detail-page__value">{{ row.value }}</text>
      </view>
    </view>

    <view class="task-detail-page__panel">
      <text class="pm-section-title">任务描述</text>
      <text class="task-detail-page__desc">{{ task.description }}</text>
    </view>

    <view class="task-detail-page__footer">
      <pm-action-bar
        secondary-text="记录 BUG"
        primary-text="进度汇报"
        @secondary="handleBug"
        @primary="handleReport"
      />
    </view>
  </view>
</template>

<script setup lang="ts">
import PmStatusTag from "@/components/pm-status-tag/pm-status-tag.vue";
import PmActionBar from "@/components/pm-action-bar/pm-action-bar.vue";
import { getPriorityTone, getStatusTone } from "@/utils/status";

const task = {
  title: "优化登录页表单校验逻辑",
  status: "任务进行中",
  priority: "高",
  description: "完善前端表单校验与错误提示，覆盖账号、密码、验证码场景。"
};

const infoRows = [
  { label: "所属项目", value: "智能硬件 V2.0" },
  { label: "当前处理人", value: "张三" },
  { label: "计划完成", value: "2026-07-15" },
  { label: "进度", value: "65%" }
];

function handleBug() {
  uni.showToast({ title: "记录 BUG", icon: "none" });
}

function handleReport() {
  uni.showToast({ title: "进度汇报", icon: "none" });
}
</script>

<style lang="scss" scoped>
@import "@/styles/tokens.scss";
@import "@/styles/mixins.scss";
@import "@/styles/global.scss";

.task-detail-page {
  @include pm-page;
  padding: $pm-space-lg;
  padding-bottom: calc(#{$pm-action-bar-height} + #{$pm-space-xl});
}

.task-detail-page__head {
  margin-bottom: $pm-space-lg;
}

.task-detail-page__title {
  display: block;
  font-size: $pm-font-display;
  font-weight: $pm-weight-semibold;
  line-height: 1.4;
}

.task-detail-page__tags {
  display: flex;
  flex-wrap: wrap;
  gap: $pm-space-xs;
  margin-top: $pm-space-sm;
}

.task-detail-page__panel {
  @include pm-card;
  padding: $pm-space-lg;
  margin-bottom: $pm-space-lg;
}

.task-detail-page__row {
  @include pm-flex-between;
  align-items: flex-start;
  gap: $pm-space-md;
  padding: $pm-space-sm 0;
  border-bottom: 1rpx solid $pm-border;

  &:last-child {
    border-bottom: none;
  }
}

.task-detail-page__label {
  font-size: $pm-font-caption;
  color: $pm-text-secondary;
}

.task-detail-page__value {
  flex: 1;
  text-align: right;
  font-size: $pm-font-caption;
  color: $pm-text-primary;
}

.task-detail-page__desc {
  display: block;
  margin-top: $pm-space-sm;
  font-size: $pm-font-body;
  color: $pm-text-regular;
  line-height: 1.6;
}

.task-detail-page__footer {
  position: fixed;
  left: 0;
  right: 0;
  bottom: 0;
  z-index: 100;
  background: $pm-bg-card;
  border-top: 1rpx solid $pm-border;
  padding: $pm-space-md $pm-space-lg;
  @include pm-safe-bottom;
}
</style>
