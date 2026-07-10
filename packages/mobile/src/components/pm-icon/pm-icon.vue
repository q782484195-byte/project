<template>
  <view class="pm-icon" :style="wrapStyle">
    <image class="pm-icon__img" :src="src" mode="aspectFit" />
  </view>
</template>

<script setup lang="ts">
import { computed } from "vue";

const props = withDefaults(
  defineProps<{
    name: string;
    size?: number;
  }>(),
  {
    size: 48
  }
);

const src = computed(() => `/static/icons/${props.name}.png`);
const wrapStyle = computed(() => ({
  width: `${props.size}rpx`,
  height: `${props.size}rpx`
}));
</script>

<style lang="scss" scoped>
.pm-icon {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  overflow: hidden;
}

.pm-icon__img {
  width: 100%;
  height: 100%;
}
</style>
