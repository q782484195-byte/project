<template>
  <el-collapse
    :model-value="expandedKeys"
    expand-icon-position="left"
    class="tasks-collapse"
    :class="{ 'tasks-collapse--nested': isNested, 'tasks-collapse--mobile': isMobile }"
    @update:model-value="emit('update:expandedKeys', $event)"
  >
    <template v-for="node in nodes" :key="node.key">
      <el-collapse-item v-if="shouldShowCollapseItem(node)" :name="node.key">
        <template #title>
          <div
            class="tasks-collapse__title"
            :data-depth="node.depth"
            :style="{ paddingLeft: `${ctx.getGroupIndentPx(node.depth)}px` }"
          >
            <span class="tasks-collapse__name">{{ node.title }}</span>
            <span class="tasks-collapse__count">{{ node.taskCount }}</span>
          </div>
        </template>

        <TaskCollapseTree
          v-if="node.children.length > 0"
          :nodes="node.children"
          :expanded-keys="expandedKeys"
          is-nested
          @update:expanded-keys="emit('update:expandedKeys', $event)"
        />

        <TaskCollapseNodeTasks v-if="node.hasTasks && node.taskCount > 0 && node.children.length === 0" :node="node" />
      </el-collapse-item>

      <div v-else-if="node.hasTasks && node.taskCount > 0" class="tasks-collapse-single" :data-depth="node.depth">
        <TaskCollapseNodeTasks :node="node" />
      </div>
    </template>
  </el-collapse>
</template>

<script setup lang="ts">
import { inject } from "vue";
import TaskCollapseNodeTasks from "./TaskCollapseNodeTasks.vue";
import {
  TASK_COLLAPSE_CTX_KEY,
  shouldShowCollapseItem,
  type TaskCollapseContext,
  type TaskCollapseNode
} from "./taskCollapseContext";

import TaskCollapseTree from "./TaskCollapseTree.vue";

const props = withDefaults(
  defineProps<{
    nodes: TaskCollapseNode[];
    expandedKeys: string[];
    isNested?: boolean;
  }>(),
  { isNested: false }
);

const emit = defineEmits<{
  "update:expandedKeys": [keys: string[]];
}>();

const ctx = inject<TaskCollapseContext>(TASK_COLLAPSE_CTX_KEY)!;
const isMobile = ctx.isMobile;
</script>
