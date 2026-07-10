<template>
  <view
    class="pm-task-row"
    :class="{ 'pm-task-row--card': variant === 'card' }"
    @click="$emit('click')"
  >
    <view class="pm-task-row__bar" :class="`pm-task-row__bar--${barTone}`" />
    <view class="pm-task-row__main">
      <text class="pm-task-row__title">{{ title }}</text>
      <view class="pm-task-row__meta">
        <pm-status-tag
          v-for="(tag, index) in tags"
          :key="index"
          :label="tag.label"
          :tone="tag.tone"
        />
        <text v-if="meta" class="pm-task-row__meta-text">{{ meta }}</text>
      </view>
    </view>
    <view
      v-if="actionText"
      class="pm-task-row__action"
      @click.stop="$emit('action')"
    >
      <text>{{ actionText }}</text>
    </view>
  </view>
</template>

<script setup lang="ts">
import { computed } from "vue";
import PmStatusTag from "@/components/pm-status-tag/pm-status-tag.vue";
import type { StatusBarTone, StatusTone } from "@/utils/status";
import { getStatusBarTone } from "@/utils/status";

export interface TaskRowTag {
  label: string;
  tone: StatusTone;
}

const props = withDefaults(
  defineProps<{
    title: string;
    tags?: TaskRowTag[];
    meta?: string;
    status?: string;
    bar?: StatusBarTone;
    actionText?: string;
    variant?: "list" | "card";
  }>(),
  {
    tags: () => [],
    meta: "",
    actionText: "",
    variant: "list"
  }
);

defineEmits<{
  click: [];
  action: [];
}>();

const barTone = computed<StatusBarTone>(
  () => props.bar || getStatusBarTone(props.status) || "todo"
);
</script>

<style lang="scss" scoped>
@import "@/styles/tokens.scss";
@import "@/styles/mixins.scss";

.pm-task-row {
  display: flex;
  align-items: stretch;
  min-height: 140rpx;
  background: $pm-bg-card;
  border-bottom: 1rpx solid $pm-border;

  &:active {
    background: $pm-bg-hover;
  }
}

.pm-task-row--card {
  margin: 0 $pm-space-lg $pm-space-sm;
  min-height: 132rpx;
  border: 1rpx solid $pm-border;
  border-radius: $pm-radius-xl;
  border-bottom: 1rpx solid $pm-border;
  box-shadow: 0 6rpx 20rpx rgba(15, 23, 42, 0.04);
  overflow: hidden;

  &:last-child {
    margin-bottom: 0;
  }
}

.pm-task-row__bar {
  width: 6rpx;
  flex-shrink: 0;
  background: $pm-bar-doing;
}

.pm-task-row__bar--todo {
  background: $pm-bar-todo;
}

.pm-task-row__bar--doing {
  background: $pm-bar-doing;
}

.pm-task-row__bar--test {
  background: $pm-bar-test;
}

.pm-task-row__bar--done {
  background: $pm-bar-done;
}

.pm-task-row__bar--block {
  background: $pm-bar-block;
}

.pm-task-row__main {
  flex: 1;
  min-width: 0;
  padding: 24rpx 20rpx 24rpx 24rpx;
  display: flex;
  flex-direction: column;
  justify-content: center;
  gap: 10rpx;
}

.pm-task-row__title {
  font-size: $pm-font-body;
  font-weight: $pm-weight-semibold;
  color: $pm-text-primary;
  line-height: 1.35;
  @include pm-ellipsis;
}

.pm-task-row__meta {
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: 12rpx;
  min-width: 0;
}

.pm-task-row__meta-text {
  font-size: $pm-font-mini;
  color: $pm-text-placeholder;
  @include pm-ellipsis;
  flex: 1;
  min-width: 0;
}

.pm-task-row__action {
  flex-shrink: 0;
  padding: 0 $pm-space-lg;
  display: flex;
  align-items: center;
  font-size: $pm-font-caption;
  font-weight: $pm-weight-medium;
  color: $pm-primary;
}
</style>
