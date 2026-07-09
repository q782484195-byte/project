<template>
  <view class="pm-filter-bar">
    <view class="pm-filter-bar__search">
      <text class="pm-filter-bar__icon">搜</text>
      <input
        class="pm-filter-bar__input"
        :value="modelValue"
        :placeholder="placeholder"
        confirm-type="search"
        @input="onInput"
        @confirm="$emit('search')"
      />
    </view>
    <scroll-view v-if="chips.length" scroll-x class="pm-filter-bar__chips" show-scrollbar="false">
      <view
        v-for="chip in chips"
        :key="chip.value"
        class="pm-filter-bar__chip"
        :class="{ 'pm-filter-bar__chip--active': chip.value === activeChip }"
        @click="$emit('chip-change', chip.value)"
      >
        {{ chip.label }}
      </view>
    </scroll-view>
  </view>
</template>

<script setup lang="ts">
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
    placeholder: "搜索任务、项目",
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

.pm-filter-bar__search {
  display: flex;
  align-items: center;
  height: $pm-input-height;
  padding: 0 $pm-space-lg;
  background: $pm-bg-card;
  border: 1rpx solid $pm-border;
  border-radius: $pm-radius-full;
}

.pm-filter-bar__icon {
  margin-right: $pm-space-sm;
  color: $pm-text-placeholder;
  font-size: $pm-font-body;
}

.pm-filter-bar__input {
  flex: 1;
  font-size: $pm-font-body;
  color: $pm-text-primary;
}

.pm-filter-bar__chips {
  margin-top: $pm-space-md;
  white-space: nowrap;
}

.pm-filter-bar__chip {
  display: inline-block;
  margin-right: $pm-space-sm;
  padding: 10rpx 24rpx;
  font-size: $pm-font-caption;
  color: $pm-text-regular;
  background: $pm-bg-card;
  border: 1rpx solid $pm-border;
  border-radius: $pm-radius-full;
}

.pm-filter-bar__chip--active {
  color: $pm-primary;
  background: $pm-primary-light;
  border-color: $pm-primary-light;
}
</style>
