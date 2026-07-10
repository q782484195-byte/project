<template>
  <view class="pm-page-layout">
    <view v-if="title || $slots.header" class="pm-page-layout__header">
      <slot name="header">
        <view class="pm-page-layout__header-row">
          <view class="pm-page-layout__titles">
            <text v-if="title" class="pm-page-layout__title">{{ title }}</text>
            <text v-if="subtitle" class="pm-page-layout__subtitle">{{ subtitle }}</text>
          </view>
          <slot name="extra" />
        </view>
      </slot>
    </view>

    <view
      class="pm-page-layout__body"
      :class="{
        'pm-page-layout__body--with-tab': tabbar,
        'pm-page-layout__body--with-action': actionBar
      }"
    >
      <slot />
    </view>

    <view v-if="$slots.action" class="pm-page-layout__action">
      <slot name="action" />
    </view>
  </view>
</template>

<script setup lang="ts">
withDefaults(
  defineProps<{
    title?: string;
    subtitle?: string;
    tabbar?: boolean;
    actionBar?: boolean;
  }>(),
  {
    tabbar: true,
    actionBar: false
  }
);
</script>

<style lang="scss" scoped>
@import "@/styles/tokens.scss";
@import "@/styles/mixins.scss";

.pm-page-layout {
  @include pm-page;
  display: flex;
  flex-direction: column;
}

.pm-page-layout__header {
  padding: $pm-space-md $pm-space-lg $pm-space-sm;
  padding-top: calc(#{$pm-space-md} + var(--status-bar-height, 20px));
  background: $pm-bg-card;
}

.pm-page-layout__header-row {
  @include pm-flex-between;
  align-items: flex-start;
  gap: $pm-space-md;
}

.pm-page-layout__titles {
  flex: 1;
  min-width: 0;
}

.pm-page-layout__title {
  display: block;
  font-size: $pm-font-display;
  font-weight: $pm-weight-semibold;
  color: $pm-text-primary;
  line-height: 1.3;
}

.pm-page-layout__subtitle {
  display: block;
  margin-top: $pm-space-xs;
  font-size: $pm-font-caption;
  color: $pm-text-placeholder;
}

.pm-page-layout__body {
  flex: 1;
}

.pm-page-layout__body--with-tab {
  padding-bottom: calc(
    #{$pm-tabbar-height} + #{$pm-space-lg} + env(safe-area-inset-bottom)
  );
}

.pm-page-layout__body--with-action {
  padding-bottom: calc(
    #{$pm-action-bar-height} + #{$pm-space-lg} + env(safe-area-inset-bottom)
  );
}

.pm-page-layout__action {
  position: fixed;
  left: 0;
  right: 0;
  bottom: 0;
  z-index: 100;
  background: $pm-bg-card;
  border-top: 1rpx solid $pm-border;
  padding: $pm-space-md $pm-space-lg;
}
</style>
