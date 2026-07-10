<template>
  <view class="pm-stat-bar" :class="{ 'pm-stat-bar--4': items.length >= 4 }">
    <view
      v-for="item in items"
      :key="item.key"
      class="pm-stat-bar__item"
      @click="$emit('click', item.key)"
    >
      <text
        class="pm-stat-bar__value"
        :class="{ 'pm-stat-bar__value--warn': item.warn }"
      >
        {{ item.value }}
      </text>
      <text class="pm-stat-bar__label">{{ item.label }}</text>
    </view>
  </view>
</template>

<script setup lang="ts">
export interface StatItem {
  key: string;
  label: string;
  value: string | number;
  warn?: boolean;
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
  background: $pm-bg-card;
  border-top: 1rpx solid $pm-border;
  border-bottom: 1rpx solid $pm-border;
  padding: $pm-space-lg $pm-space-sm;
}

.pm-stat-bar--4 {
  grid-template-columns: repeat(4, 1fr);
}

.pm-stat-bar__item {
  text-align: center;
  position: relative;
}

.pm-stat-bar__item + .pm-stat-bar__item::before {
  content: "";
  position: absolute;
  left: 0;
  top: 16rpx;
  bottom: 16rpx;
  width: 1rpx;
  background: $pm-border;
}

.pm-stat-bar__value {
  display: block;
  font-size: $pm-font-display;
  font-weight: $pm-weight-semibold;
  color: $pm-primary;
  line-height: 1.2;
}

.pm-stat-bar__value--warn {
  color: $pm-warning;
}

.pm-stat-bar__label {
  display: block;
  margin-top: $pm-space-xs;
  font-size: $pm-font-mini;
  color: $pm-text-secondary;
}
</style>
