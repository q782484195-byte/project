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
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: $pm-space-md;
  @include pm-safe-bottom;
}

.pm-action-bar__btn {
  height: $pm-btn-height;
  line-height: $pm-btn-height;
  text-align: center;
  border-radius: $pm-radius-md;
  font-size: $pm-font-body;
  font-weight: $pm-weight-medium;
}

.pm-action-bar__btn--ghost {
  color: $pm-text-regular;
  background: $pm-bg-card;
  border: 1rpx solid $pm-border;
}

.pm-action-bar__btn--primary {
  color: #fff;
  background: $pm-primary;
}

.pm-action-bar__btn--full {
  grid-column: 1 / -1;
}
</style>
