<template>
  <view class="pm-action-bar">
    <view
      v-if="secondaryText"
      class="pm-action-bar__btn pm-action-bar__btn--ghost"
      @click="$emit('secondary')"
    >
      {{ secondaryText }}
    </view>
    <view
      class="pm-action-bar__btn pm-action-bar__btn--primary"
      :class="{ 'pm-action-bar__btn--full': !secondaryText }"
      @click="$emit('primary')"
    >
      {{ primaryText }}
    </view>
  </view>
</template>

<script setup lang="ts">
withDefaults(
  defineProps<{
    primaryText?: string;
    secondaryText?: string;
  }>(),
  {
    primaryText: "确定",
    secondaryText: ""
  }
);

defineEmits<{
  primary: [];
  secondary: [];
}>();
</script>

<style lang="scss" scoped>
@import "@/styles/tokens.scss";
@import "@/styles/mixins.scss";

.pm-action-bar {
  display: flex;
  gap: $pm-space-md;
}

.pm-action-bar__btn {
  height: $pm-btn-height;
  line-height: $pm-btn-height;
  text-align: center;
  border-radius: $pm-radius-xl;
  font-size: $pm-font-body;
  font-weight: $pm-weight-medium;
}

.pm-action-bar__btn--ghost {
  flex: 1;
  color: $pm-text-primary;
  background: $pm-bg-card;
  border: 1rpx solid $pm-border;
}

.pm-action-bar__btn--primary {
  flex: 1.2;
  color: #fff;
  background: $pm-primary;
}

.pm-action-bar__btn--full {
  flex: 1;
}
</style>
