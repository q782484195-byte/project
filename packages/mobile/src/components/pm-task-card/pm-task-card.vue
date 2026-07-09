<template>
  <view
    class="pm-task-card"
    :style="cardStyle"
    @click="$emit('click')"
  >
    <view class="pm-task-card__header">
      <text class="pm-task-card__title">{{ title }}</text>
      <view v-if="tags.length" class="pm-task-card__tags">
        <pm-status-tag
          v-for="(tag, index) in tags"
          :key="index"
          :label="tag.label"
          :tone="tag.tone"
        />
      </view>
    </view>

    <view v-for="row in rows" :key="row.label" class="pm-task-card__row">
      <text class="pm-task-card__label">{{ row.label }}</text>
      <text class="pm-task-card__value">{{ row.value || "-" }}</text>
    </view>

    <view v-if="$slots.actions" class="pm-task-card__actions">
      <slot name="actions" />
    </view>
  </view>
</template>

<script setup lang="ts">
import { computed } from "vue";
import PmStatusTag from "@/components/pm-status-tag/pm-status-tag.vue";
import type { StatusTone } from "@/utils/status";
import { getShowColorBg } from "@/utils/status";

export interface TaskCardRow {
  label: string;
  value?: string | number;
}

export interface TaskCardTag {
  label: string;
  tone: StatusTone;
}

const props = withDefaults(
  defineProps<{
    title: string;
    rows?: TaskCardRow[];
    tags?: TaskCardTag[];
    showColor?: string;
  }>(),
  {
    rows: () => [],
    tags: () => []
  }
);

defineEmits<{ click: [] }>();

const cardStyle = computed(() => {
  const bg = getShowColorBg(props.showColor);
  return bg ? { backgroundColor: bg } : {};
});
</script>

<style lang="scss" scoped>
@import "@/styles/tokens.scss";
@import "@/styles/mixins.scss";

.pm-task-card {
  @include pm-card;
  @include pm-card-active;
  margin-bottom: $pm-space-lg;
  overflow: hidden;
}

.pm-task-card__header {
  padding: $pm-space-lg $pm-space-lg $pm-space-sm;
}

.pm-task-card__title {
  display: block;
  font-size: $pm-font-title;
  font-weight: $pm-weight-semibold;
  color: $pm-text-primary;
  line-height: 1.45;
  word-break: break-all;
}

.pm-task-card__tags {
  display: flex;
  flex-wrap: wrap;
  gap: $pm-space-xs;
  margin-top: $pm-space-sm;
}

.pm-task-card__row {
  @include pm-flex-between;
  align-items: flex-start;
  gap: $pm-space-md;
  padding: $pm-space-sm $pm-space-lg;
  border-top: 1rpx solid $pm-border;
  font-size: $pm-font-caption;
}

.pm-task-card__label {
  flex-shrink: 0;
  min-width: 140rpx;
  color: $pm-text-secondary;
}

.pm-task-card__value {
  flex: 1;
  text-align: right;
  color: $pm-text-primary;
  word-break: break-all;
}

.pm-task-card__actions {
  display: flex;
  flex-wrap: wrap;
  gap: $pm-space-md;
  padding: $pm-space-md $pm-space-lg $pm-space-lg;
  border-top: 1rpx solid $pm-border;
}
</style>
