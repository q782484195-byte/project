<template>
  <view :class="['pm-status-tag', `pm-status-tag--${tone}`]">
    <slot>{{ label }}</slot>
  </view>
</template>

<script setup lang="ts">
import type { StatusTone } from "@/utils/status";

withDefaults(
  defineProps<{
    label?: string;
    tone?: StatusTone;
  }>(),
  {
    label: "",
    tone: "info"
  }
);
</script>

<style lang="scss" scoped>
@import "@/styles/tokens.scss";

.pm-status-tag {
  display: inline-flex;
  align-items: center;
  padding: 4rpx 16rpx;
  border-radius: $pm-radius-full;
  font-size: $pm-font-mini;
  line-height: 1.4;
  white-space: nowrap;
}

.pm-status-tag--primary {
  color: $pm-primary;
  background: $pm-primary-light;
}

.pm-status-tag--success {
  color: $pm-success;
  background: $pm-success-light;
}

.pm-status-tag--warning {
  color: $pm-warning;
  background: $pm-warning-light;
}

.pm-status-tag--danger {
  color: $pm-danger;
  background: $pm-danger-light;
}

.pm-status-tag--info {
  color: $pm-info;
  background: $pm-info-light;
}
</style>
