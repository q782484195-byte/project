<template>
  <div v-if="hasVisibleTasks" class="tasks-collapse-node-tasks" :data-depth="node.depth">
    <el-table
      v-if="!isMobile"
      :data="tableRows"
      :style="{ width: '100%' }"
      row-key="rowKey"
      class="tasks-collapse-table"
      empty-text="暂无任务数据"
      :show-header="false"
      :row-class-name="getRowClassName"
    >
      <el-table-column prop="一级分类" :min-width="TASK_TABLE_COLUMN_WIDTHS.primary" show-overflow-tooltip>
        <template #default="{ row }">
          <span
            class="tasks-collapse-table__text"
            :class="{ 'tasks-collapse-table__group-title': isGroupTitleRow(node, row) }"
          >
            {{ getTaskPrimaryCategory(node, row) }}
            <span v-if="row._isGroupHeader" class="tasks-collapse-table__count">{{ node.taskCount }}</span>
          </span>
        </template>
      </el-table-column>
      <el-table-column prop="二级分类" :min-width="TASK_TABLE_COLUMN_WIDTHS.secondary" show-overflow-tooltip>
        <template #default="{ row }">
          <span class="tasks-collapse-table__text">
            {{ getTaskSecondaryCategory(node, row) }}
          </span>
        </template>
      </el-table-column>
      <el-table-column prop="department" :min-width="TASK_TABLE_COLUMN_WIDTHS.department">
        <template #default="{ row }">
          <span v-if="!row._isGroupHeader" class="tasks-collapse-table__text assignee-text-dept">
            {{ getTaskDepartment(row) }}
          </span>
        </template>
      </el-table-column>
      <el-table-column prop="指派人" :min-width="TASK_TABLE_COLUMN_WIDTHS.assignee">
        <template #default="{ row }">
          <span v-if="!row._isGroupHeader" class="tasks-collapse-table__text assignee-text">
            {{ getTaskAssignee(row) || "-" }}
          </span>
        </template>
      </el-table-column>
      <el-table-column prop="状态" :min-width="TASK_TABLE_COLUMN_WIDTHS.status">
        <template #default="{ row }">
          <el-tag
            v-if="!row._isGroupHeader"
            :type="ctx.getStatusType(row.状态 || row.status) || undefined"
            size="small"
            effect="plain"
            round
          >
            {{ row.状态 || row.status || "-" }}
          </el-tag>
        </template>
      </el-table-column>
      <el-table-column prop="优先级" :min-width="TASK_TABLE_COLUMN_WIDTHS.priority">
        <template #default="{ row }">
          <el-tag
            v-if="!row._isGroupHeader"
            :type="ctx.getPriorityType(row.优先级 || row.priority) || undefined"
            size="small"
            effect="plain"
            round
          >
            {{ row.优先级 || row.priority || "-" }}
          </el-tag>
        </template>
      </el-table-column>
      <el-table-column prop="create_time" :min-width="TASK_TABLE_COLUMN_WIDTHS.assignTime" show-overflow-tooltip>
        <template #default="{ row }">
          <span v-if="!row._isGroupHeader" class="tasks-collapse-table__text tasks-collapse-table__muted">
            {{ row.create_time || "-" }}
          </span>
        </template>
      </el-table-column>
      <el-table-column prop="task_deadline" :min-width="TASK_TABLE_COLUMN_WIDTHS.deadline" show-overflow-tooltip>
        <template #default="{ row }">
          <span v-if="!row._isGroupHeader" class="tasks-collapse-table__text tasks-collapse-table__muted">
            {{ row.task_deadline || "-" }}
          </span>
        </template>
      </el-table-column>
      <el-table-column prop="remark" :min-width="TASK_TABLE_COLUMN_WIDTHS.remark">
        <template #default="{ row }">
          <div v-if="!row._isGroupHeader" class="task-remark-cell" @click.stop>
            <el-input
              v-if="canUpdateRemark && isEditingRemark(row)"
              ref="remarkInputRef"
              v-model="row.remark"
              size="small"
              placeholder="请输入备注"
              :disabled="!!savingRemarkIds[row._id || row.id]"
              @blur="handleSaveRemark(row)"
              @keyup.enter="blurRemarkInput"
            />
            <template v-else>
              <span
                class="task-remark-cell__text tasks-collapse-table__text tasks-collapse-table__muted"
                :title="getTaskRemark(row) || undefined"
              >
                {{ getTaskRemark(row) || "-" }}
              </span>
              <el-icon
                v-if="canUpdateRemark"
                class="task-remark-edit"
                title="编辑备注"
                @click="startEditRemark(row, $event)"
              >
                <EditPen />
              </el-icon>
            </template>
          </div>
        </template>
      </el-table-column>
      <el-table-column :width="ctx.operationColWidth(4)">
        <template #default="{ row }">
          <TaskCollapseRowActions v-if="!row._isGroupHeader" :row="row" />
        </template>
      </el-table-column>
    </el-table>

    <template v-else-if="isMobile">
      <div v-if="isMultiTaskLeaf(node)" class="mobile-task-group-header">
        <span class="mobile-task-group-header__title">{{ node.title }}</span>
        <span class="mobile-task-group-header__count">{{ node.taskCount }}</span>
      </div>
      <div v-else-if="isSingleTaskLeaf(node)" class="mobile-task-group-header">
        <span class="mobile-task-group-header__title">{{ node.title }}</span>
      </div>
      <div v-for="row in node.processedTasks" :key="row.rowKey" class="mobile-task-card">
        <div class="mobile-task-card__main">
          <div v-if="getTaskSecondaryCategory(node, row)" class="mobile-task-card__row">
            <span class="mobile-task-card__label">二级分类</span>
            <span class="mobile-task-card__value">{{ getTaskSecondaryCategory(node, row) }}</span>
          </div>
          <div class="mobile-task-card__title">{{ row.任务名 || row.task_name || row.title || "-" }}</div>
          <div class="mobile-task-card__meta">
            <el-tag
              :type="ctx.getStatusType(row.状态 || row.status) || undefined"
              size="small"
              effect="light"
            >
              {{ row.状态 || row.status || "-" }}
            </el-tag>
            <el-tag :type="ctx.getPriorityType(row.优先级 || row.priority) || undefined" size="small">
              {{ row.优先级 || row.priority || "-" }}
            </el-tag>
          </div>
          <div class="mobile-task-card__row">
            <span class="mobile-task-card__label">部门</span>
            <span class="mobile-task-card__value">
              <el-tag v-if="getTaskDepartment(row)" type="success" size="small">{{ getTaskDepartment(row) }}</el-tag>
            </span>
          </div>
          <div class="mobile-task-card__row">
            <span class="mobile-task-card__label">责任人</span>
            <span class="mobile-task-card__value">
              <el-tag type="primary" size="small">{{ getTaskAssignee(row) || "-" }}</el-tag>
            </span>
          </div>
          <div class="mobile-task-card__row">
            <span class="mobile-task-card__label">截止日期</span>
            <span class="mobile-task-card__value">{{ row.task_deadline || "-" }}</span>
          </div>
          <div class="mobile-task-card__row">
            <span class="mobile-task-card__label">备注</span>
            <span class="mobile-task-card__value">
              <div v-if="canUpdateRemark && isEditingRemark(row)" class="task-remark-cell">
                <el-input
                  ref="remarkInputRef"
                  v-model="row.remark"
                  size="small"
                  placeholder="请输入备注"
                  :disabled="!!savingRemarkIds[row._id || row.id]"
                  @blur="handleSaveRemark(row)"
                  @keyup.enter="blurRemarkInput"
                />
              </div>
              <div v-else class="task-remark-cell">
                <span class="task-remark-cell__text">{{ getTaskRemark(row) || "-" }}</span>
                <el-icon
                  v-if="canUpdateRemark"
                  class="task-remark-edit"
                  title="编辑备注"
                  @click="startEditRemark(row, $event)"
                >
                  <EditPen />
                </el-icon>
              </div>
            </span>
          </div>
          <div class="mobile-task-card__row">
            <span class="mobile-task-card__label">创建时间</span>
            <span class="mobile-task-card__value">{{ row.create_time || "-" }}</span>
          </div>
          <div class="mobile-task-card__actions">
            <TaskCollapseRowActions :row="row" mobile />
          </div>
        </div>
      </div>
    </template>
  </div>
</template>

<script setup lang="ts">
import { computed, inject, nextTick, reactive, ref } from "vue";
import { ElMessage } from "element-plus";
import { EditPen } from "@element-plus/icons-vue";
import { updateTaskRemark } from "@/api/project";
import TaskCollapseRowActions from "./TaskCollapseRowActions.vue";
import {
  TASK_COLLAPSE_CTX_KEY,
  getTaskPrimaryCategory,
  getTaskSecondaryCategory,
  getTaskDepartment,
  getTaskAssignee,
  getTaskRemark,
  isMultiTaskLeaf,
  isSingleTaskLeaf,
  TASK_TABLE_COLUMN_WIDTHS,
  type TaskCollapseContext,
  type TaskCollapseNode
} from "./taskCollapseContext";

const props = defineProps<{
  node: TaskCollapseNode;
}>();

const ctx = inject<TaskCollapseContext>(TASK_COLLAPSE_CTX_KEY)!;
const isMobile = ctx.isMobile;
const canUpdateRemark = computed(() => ctx.hasPerms(["task:update_remark"]));
const savingRemarkIds = reactive<Record<string, boolean>>({});
const editingRemarkId = ref("");
const remarkInputRef = ref();

const getRowId = (row: any) => String(row?._id || row?.id || "");

const isEditingRemark = (row: any) => editingRemarkId.value === getRowId(row);

const startEditRemark = async (row: any, event?: Event) => {
  event?.stopPropagation();
  if (!canUpdateRemark.value) return;
  const id = getRowId(row);
  if (!id) return;
  editingRemarkId.value = id;
  await nextTick();
  remarkInputRef.value?.focus?.();
};

const exitEditRemark = (id?: string) => {
  if (!id || editingRemarkId.value === id) {
    editingRemarkId.value = "";
  }
};

const tableRows = computed(() => {
  const tasks = props.node.processedTasks;
  if (isMultiTaskLeaf(props.node)) {
    return [
      { rowKey: `group-header-${props.node.key}`, _isGroupHeader: true },
      ...tasks
    ];
  }
  return tasks;
});

const hasVisibleTasks = computed(
  () => props.node.processedTasks.length > 0 || tableRows.value.length > 0
);

const getRowClassName = ({ row }: { row: any }) =>
  row._isGroupHeader ? "tasks-collapse-table__group-row" : "";

const isGroupTitleRow = (node: TaskCollapseNode, row?: any) =>
  Boolean(row?._isGroupHeader || isSingleTaskLeaf(node));

const blurRemarkInput = (event: KeyboardEvent) => {
  (event.target as HTMLInputElement)?.blur();
};

const handleSaveRemark = async (row: any) => {
  if (!canUpdateRemark.value) return;
  const taskId = row?._id || row?.id;
  if (!taskId) {
    ElMessage.warning("任务ID不存在，无法保存备注");
    return;
  }

  const id = String(taskId);
  const remark = String(row.remark ?? "").trim();
  const origin = row._originRemark != null ? String(row._originRemark) : "";
  if (remark === origin) {
    exitEditRemark(id);
    return;
  }

  if (savingRemarkIds[id]) return;
  savingRemarkIds[id] = true;

  try {
    const response = await updateTaskRemark({ task_id: id, remark });
    if (response.code === 200) {
      row.remark = remark;
      row.备注 = remark;
      row._originRemark = remark;
      ElMessage.success("备注已更新");
      exitEditRemark(id);
    } else {
      row.remark = origin;
      ElMessage.error(response.message || "备注更新失败");
    }
  } catch (error: any) {
    row.remark = origin;
    ElMessage.error(error?.response?.data?.message || error?.message || "备注更新失败");
  } finally {
    savingRemarkIds[id] = false;
  }
};
</script>

<style scoped lang="scss">
:deep(.el-input) {
  width: 100%;
}

.task-remark-cell {
  display: flex;
  align-items: center;
  gap: 6px;
  min-width: 0;
  width: 100%;
}

.task-remark-cell__text {
  flex: 1;
  min-width: 0;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.task-remark-edit {
  flex-shrink: 0;
  font-size: 14px;
  color: var(--el-color-primary);
  cursor: pointer;
}

.task-remark-edit:hover {
  color: var(--el-color-primary-light-3);
}
</style>
