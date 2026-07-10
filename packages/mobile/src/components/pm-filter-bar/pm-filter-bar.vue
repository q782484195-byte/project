<template>
  <view class="pm-filter-bar">
    <view class="pm-filter-bar__search">
      <pm-icon name="search" :size="32" />
      <input
        class="pm-filter-bar__input"
        :value="modelValue"
        :placeholder="placeholder"
        confirm-type="search"
        @input="onInput"
        @confirm="$emit('search')"
      />
    </view>
    <scroll-view v-if="chips.length" scroll-x class="pm-filter-bar__chips" :show-scrollbar="false">
      <view class="pm-filter-bar__chips-inner">
        <view
          v-for="chip in chips"
          :key="chip.value"
          class="pm-filter-bar__chip"
          :class="{ 'pm-filter-bar__chip--active': chip.value === activeChip }"
          @click="$emit('chip-change', chip.value)"
        >
          {{ chip.label }}
        </view>
      </view>
    </scroll-view>
  </view>
</template>

<script setup lang="ts">
import PmIcon from "@/components/pm-icon/pm-icon.vue";

export interface FilterChip {
  label: string;
  value: string;
}

withDefaults(
  defineProps<{
    modelValue?: string;
    placeholder?: string;
    chips?: FilterChip[];
    activeChip?: string;
  }>(),
  {
    modelValue: "",
    placeholder: "搜索任务标题 / 编号",
    chips: () => [],
    activeChip: ""
  }
);

const emit = defineEmits<{
  "update:modelValue": [value: string];
  search: [];
  "chip-change": [value: string];
}>();

function onInput(e: { detail: { value: string } }) {
  emit("update:modelValue", e.detail.value);
}
</script>

<style lang="scss" scoped>
@import "@/styles/tokens.scss";

.pm-filter-bar {
  padding: $pm-space-md $pm-space-lg $pm-space-sm;
  background: $pm-bg-card;
  border-bottom: 1rpx solid $pm-border;
}

.pm-filter-bar__search {
  display: flex;
  align-items: center;
  height: 80rpx;
  padding: 0 $pm-space-md;
  gap: $pm-space-sm;
  background: $pm-bg-muted;
  border-radius: $pm-radius-xl;
}

.pm-filter-bar__input {
  flex: 1;
  font-size: 28rpx;
  color: $pm-text-primary;
}

.pm-filter-bar__chips {
  margin-top: $pm-space-md;
  white-space: nowrap;
  width: 100%;
}

.pm-filter-bar__chips-inner {
  display: inline-flex;
  flex-direction: row;
  align-items: center;
  padding-bottom: 4rpx;
}

.pm-filter-bar__chip {
  display: inline-flex;
  align-items: center;
  flex-shrink: 0;
  margin-right: $pm-space-sm;
  height: 64rpx;
  padding: 0 28rpx;
  font-size: $pm-font-caption;
  color: $pm-text-secondary;
  background: $pm-bg-card;
  border: 1rpx solid $pm-border;
  border-radius: $pm-radius-full;
}

.pm-filter-bar__chip--active {
  color: $pm-primary;
  background: $pm-primary-light;
  border-color: transparent;
  font-weight: $pm-weight-medium;
}
</style>
