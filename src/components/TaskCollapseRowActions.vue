<template>
  <div class="table-action-btns">
    <el-button type="primary" link size="small" @click="run('view', $event)">
      查看
    </el-button>
    <el-button
      type="primary"
      link
      size="small"
      v-if="((ctx.username === (row.当前处理人 || row.current_handler)) || ctx.isAdmin || ctx.isProjectManager) && row.状态 !== '已完成' && ctx.hasPerms(['task:update'])"
      @click="run('edit', $event)"
    >
      编辑
    </el-button>
    <el-button
      type="primary"
      link
      size="small"
      v-if="ctx.isPendingAssignStatus(row.状态 || row.status) && ctx.hasPerms(['task:update_current_assignee'])"
      @click="run('changeAssignee', $event)"
    >
      更改负责人
    </el-button>
    <el-button
      type="primary"
      link
      size="small"
      v-if="row.next_state && Array.isArray(row.next_state) && row.next_state.length > 0 && ctx.hasPerms(['task:update']) && ctx.username === row.当前处理人"
      @click="run('assign', $event)"
    >
      分配
    </el-button>
    <el-button
      type="primary"
      link
      size="small"
      v-if="ctx.hasPerms(['task:close'])"
      class="action-danger"
      @click="run('close', $event)"
    >
      关闭
    </el-button>
    <el-button
      type="primary"
      link
      size="small"
      v-if="row.状态 !== '已完成' && ctx.hasPerms(['task:finish'])"
      class="action-success"
      @click="run('complete', $event)"
    >
      完成
    </el-button>
    <el-button
      type="primary"
      link
      size="small"
      v-if="(row.当前处理人 || row.current_handler) === ctx.username && ctx.canRecordBug(row.状态 || row.status) && ctx.hasPerms(['task:report'])"
      class="action-success"
      @click="run('report', $event)"
    >
      进度汇报
    </el-button>
  </div>
</template>

<script setup lang="ts">
import { inject } from "vue";
import { TASK_COLLAPSE_CTX_KEY, type TaskCollapseContext } from "./taskCollapseContext";

const props = defineProps<{
  row: Record<string, any>;
  mobile?: boolean;
}>();

const ctx = inject<TaskCollapseContext>(TASK_COLLAPSE_CTX_KEY)!;

const run = (command: string, event: Event) => {
  if (props.mobile) event.stopPropagation();
  ctx.onCommand(command, props.row);
};
</script>
