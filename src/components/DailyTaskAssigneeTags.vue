<template>
  <span v-if="!displayItems.length" class="daily-task-assignee-tags">-</span>
  <span v-else class="daily-task-assignee-tags">
    <template v-for="(item, index) in displayItems" :key="`${item.name}-${index}`">
      <el-tag
        v-if="item.finished"
        type="success"
        size="small"
        effect="light"
        class="daily-task-assignee-tags__tag"
      >
        {{ item.name }}
      </el-tag>
      <span v-else class="daily-task-assignee-tags__name">{{ item.name }}</span>
      <span v-if="index < displayItems.length - 1" class="daily-task-assignee-tags__sep">、</span>
    </template>
  </span>
</template>

<script setup lang="ts">
import { computed } from "vue";
import {
  getDailyTaskAssignerItems,
  type DailyTaskAssignerItem,
  type DailyTaskListItem
} from "@/api/daily-task";

const props = defineProps<{
  task?: DailyTaskListItem | null;
  items?: DailyTaskAssignerItem[];
}>();

const displayItems = computed(() => {
  if (props.task) return getDailyTaskAssignerItems(props.task);
  return props.items ?? [];
});
</script>

<style scoped lang="scss">
.daily-task-assignee-tags {
  display: inline-flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 2px;
  line-height: 1.5;

  &__tag {
    margin: 0;
  }

  &__name {
    color: #303133;
  }

  &__sep {
    color: #909399;
  }
}
</style>
