<template>
  <view class="pm-stat-bar">
    <view
      v-for="item in items"
      :key="item.label"
      class="pm-stat-bar__item"
      @click="$emit('click', item.key)"
    >
      <text class="pm-stat-bar__value">{{ item.value }}</text>
      <text class="pm-stat-bar__label">{{ item.label }}</text>
    </view>
  </view>
</template>

<script setup lang="ts">
export interface StatItem {
  key: string;
  label: string;
  value: string | number;
}

defineProps<{
  items: StatItem[];
}>();

defineEmits<{
  click: [key: string];
}>();
</script>

<style lang="scss" scoped>
@import "@/styles/tokens.scss";

.pm-stat-bar {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: $pm-space-sm;
}

.pm-stat-bar__item {
  background: $pm-bg-card;
  border: 1rpx solid $pm-border;
  border-radius: $pm-radius-md;
  padding: $pm-space-md $pm-space-sm;
  text-align: center;
}

.pm-stat-bar__value {
  display: block;
  font-size: $pm-font-display;
  font-weight: $pm-weight-semibold;
  color: $pm-primary;
  line-height: 1.2;
}

.pm-stat-bar__label {
  display: block;
  margin-top: $pm-space-xs;
  font-size: $pm-font-mini;
  color: $pm-text-secondary;
}
</style>
