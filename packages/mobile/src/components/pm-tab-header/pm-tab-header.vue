<template>
  <view class="tab-hero">
    <view class="tab-hero__top">
      <view class="tab-hero__brand">
        <image
          v-if="showLogo"
          class="tab-hero__logo"
          src="/static/icons/logo.png"
          mode="aspectFit"
        />
        <text class="tab-hero__title">{{ title }}</text>
      </view>
      <view v-if="$slots.extra" class="tab-hero__actions">
        <slot name="extra" />
      </view>
    </view>

    <view class="tab-hero__card">
      <view class="tab-hero__decor tab-hero__decor--1" />
      <view class="tab-hero__decor tab-hero__decor--2" />
      <view class="tab-hero__card-body">
        <text v-if="subtitle" class="tab-hero__slogan">{{ subtitle }}</text>
        <slot name="bottom" />
      </view>
    </view>
  </view>
</template>

<script setup lang="ts">
withDefaults(
  defineProps<{
    title: string;
    subtitle?: string;
    showLogo?: boolean;
  }>(),
  {
    subtitle: "",
    showLogo: true
  }
);
</script>

<style lang="scss" scoped>
@import "@/styles/tab-page.scss";
</style>
