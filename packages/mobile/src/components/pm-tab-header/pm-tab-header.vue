<template>
  <view class="pm-tab-header" :class="{ 'pm-tab-header--gradient': gradient }">
    <view class="pm-tab-header__safe" />
    <view class="pm-tab-header__inner">
      <view class="pm-tab-header__row">
        <view class="pm-tab-header__text">
          <text class="pm-tab-header__title">{{ title }}</text>
          <text v-if="subtitle" class="pm-tab-header__subtitle">{{ subtitle }}</text>
        </view>
        <slot name="extra" />
      </view>
      <slot name="bottom" />
    </view>
  </view>
</template>

<script setup lang="ts">
withDefaults(
  defineProps<{
    title: string;
    subtitle?: string;
    gradient?: boolean;
  }>(),
  {
    subtitle: "",
    gradient: true
  }
);
</script>

<style lang="scss" scoped>
@import "@/styles/tokens.scss";
@import "@/styles/mixins.scss";

.pm-tab-header {
  background: $pm-bg-card;
  border-bottom: 1rpx solid $pm-border;
}

.pm-tab-header--gradient {
  background: linear-gradient(180deg, #dbeafe 0%, #eff6ff 55%, $pm-bg-page 100%);
  border-bottom: none;
}

.pm-tab-header__safe {
  height: var(--status-bar-height, 44px);
}

.pm-tab-header__inner {
  padding: 12rpx $pm-space-lg 28rpx;
}

.pm-tab-header__row {
  @include pm-flex-between;
  align-items: flex-start;
  gap: $pm-space-md;
}

.pm-tab-header__text {
  flex: 1;
  min-width: 0;
}

.pm-tab-header__title {
  display: block;
  font-size: $pm-font-display;
  font-weight: $pm-weight-semibold;
  color: $pm-text-primary;
  line-height: 1.25;
  letter-spacing: 0.5rpx;
}

.pm-tab-header__subtitle {
  display: block;
  margin-top: 10rpx;
  font-size: $pm-font-caption;
  color: $pm-text-secondary;
  line-height: 1.4;
}

.pm-tab-header--gradient .pm-tab-header__subtitle {
  color: rgba(15, 23, 42, 0.55);
}
</style>
