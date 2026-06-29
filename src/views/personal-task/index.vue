<template>
  <div class="personal-task-page" ref="pageRef">
    <el-card v-loading="loading" ref="mainCardRef" shadow="never" class="main-card">
      <template #header>
        <div class="card-header">
          <span class="card-title">个人任务</span>
          <div class="card-actions">
            <template v-if="activeTask">
              <el-button type="primary" :loading="saving" @click="handleSaveContent">
                保存
              </el-button>
              <el-button type="danger" plain @click="handleDelete(activeTask)">删除</el-button>
            </template>
            <el-button type="primary" @click="handleAdd">
              <el-icon>
                <Plus />
              </el-icon>
              新建任务
            </el-button>
          </div>
        </div>
      </template>

      <div v-if="tasks.length > 0" class="task-tabs-wrap">
        <div class="task-tabs">
          <button
            v-for="task in tasks"
            :key="task.id"
            type="button"
            class="task-tab"
            :class="{ 'is-active': activeTaskId === task.id }"
            :title="task.title"
            @click="handleTabChange(task)"
          >
            {{ task.title }}
          </button>
        </div>

        <div v-loading="detailLoading" class="task-tab-content">
          <TaskTableEditor
            v-if="activeTaskId"
            :key="detailEditorKey"
            v-model="activeTableHtml"
            embedded
          />
        </div>
      </div>

      <el-empty v-else description="暂无任务，点击新建任务开始" :image-size="100">
        <el-button type="primary" @click="handleAdd">新建任务</el-button>
      </el-empty>
    </el-card>

    <!-- 新建任务 -->
    <el-dialog
      v-model="dialogVisible"
      title="新建任务"
      width="480px"
      :close-on-click-modal="false"
      destroy-on-close
    >
      <el-form label-width="80px" @submit.prevent>
        <el-form-item label="任务名称" required>
          <el-input
            v-model="formData.title"
            maxlength="100"
            show-word-limit
            placeholder="请输入任务名称"
            clearable
            @keyup.enter="handleCreate"
          />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="dialogVisible = false">取消</el-button>
        <el-button type="primary" :loading="saving" @click="handleCreate">确定</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, computed, onMounted, onUnmounted, nextTick } from "vue";
import { ElMessage, ElMessageBox } from "element-plus";
import { Plus } from "@element-plus/icons-vue";
import TaskTableEditor from "@/components/TaskTableEditor/index.vue";
import {
  parseTaskEditorHtmlFromItem,
  buildTaskValue,
  isBlankTableHtml
} from "@/utils/taskTableContent";
import {
  addDailyTask,
  updateDailyTask,
  deleteDailyTask,
  selectDailyTasks,
  getDailyTaskInfo,
  getDailyTaskId,
  getDailyTaskName,
  unwrapDailyTaskList,
  unwrapDailyTaskInfo,
  type DailyTaskListItem
} from "@/api/daily-task";

defineOptions({
  name: "PersonalTask"
});

interface PersonalTaskItem {
  id: string;
  title: string;
  createTime: string;
  creator: string;
}

const mapDailyTask = (item: DailyTaskListItem): PersonalTaskItem => ({
  id: getDailyTaskId(item),
  title: getDailyTaskName(item),
  createTime: String(item.create_time || item.created_at || ""),
  creator: String(item.creator || "")
});

const loading = ref(false);
const detailLoading = ref(false);
const saving = ref(false);
const tasks = ref<PersonalTaskItem[]>([]);

const pageRef = ref<HTMLElement>();
const mainCardRef = ref<InstanceType<typeof import("element-plus").ElCard>>();
const contentMinHeight = ref(480);

const dialogVisible = ref(false);

const formData = reactive({
  title: ""
});

const activeTaskId = ref<string | null>(null);
const detailEditorKey = ref(0);
const activeTableHtml = ref("");

const activeTask = computed(() =>
  tasks.value.find(task => task.id === activeTaskId.value) || null
);

const loadTasks = async (preferredId?: string | null) => {
  loading.value = true;
  try {
    const response = await selectDailyTasks({
      page: 1,
      page_size: 9999
    });

    if (response.code === 200) {
      const { list } = unwrapDailyTaskList(response);
      tasks.value = list.map(mapDailyTask);

      const targetId =
        preferredId && tasks.value.some(task => task.id === preferredId)
          ? preferredId
          : activeTaskId.value && tasks.value.some(task => task.id === activeTaskId.value)
            ? activeTaskId.value
            : tasks.value[0]?.id || null;

      if (targetId) {
        activeTaskId.value = targetId;
        await loadActiveTaskDetail(targetId);
      } else {
        clearActiveTask();
      }
    } else {
      tasks.value = [];
      clearActiveTask();
      ElMessage.error(response.message || "加载任务列表失败");
    }
  } catch (error: any) {
    tasks.value = [];
    clearActiveTask();
    ElMessage.error(
      error?.response?.data?.message || error?.message || "加载任务列表失败"
    );
  } finally {
    loading.value = false;
  }
};

const clearActiveTask = () => {
  activeTaskId.value = null;
  activeTableHtml.value = "";
  detailEditorKey.value += 1;
};

const loadActiveTaskDetail = async (id: string) => {
  detailLoading.value = true;
  try {
    const response = await getDailyTaskInfo({ daily_task_id: id });
    if (response.code === 200) {
      const item = unwrapDailyTaskInfo(response);
      if (item) {
        activeTableHtml.value = parseTaskEditorHtmlFromItem(item);
        detailEditorKey.value += 1;
        return;
      }
    }
    throw new Error(response.message || "加载任务详情失败");
  } catch (error: any) {
    activeTableHtml.value = "";
    detailEditorKey.value += 1;
    ElMessage.error(error?.message || "加载任务详情失败");
  } finally {
    detailLoading.value = false;
  }
};

const handleTabChange = async (task: PersonalTaskItem) => {
  if (activeTaskId.value === task.id) return;

  activeTaskId.value = task.id;
  await loadActiveTaskDetail(task.id);
};

const handleAdd = () => {
  formData.title = "";
  dialogVisible.value = true;
};

const handleCreate = async () => {
  const title = formData.title.trim();
  if (!title) {
    ElMessage.warning("请输入任务名称");
    return;
  }

  const value = buildTaskValue("", title);

  saving.value = true;
  try {
    const response = await addDailyTask({
      daily_task_name: title,
      value
    });
    if (response.code !== 200) {
      ElMessage.error(response.message || "创建失败");
      return;
    }

    ElMessage.success("创建成功");
    dialogVisible.value = false;

    const createdId =
      (response.result as { _id?: string; daily_task_id?: string } | undefined)?._id ||
      (response.result as { _id?: string; daily_task_id?: string } | undefined)?.daily_task_id ||
      (response.data as { _id?: string; daily_task_id?: string } | undefined)?._id ||
      (response.data as { _id?: string; daily_task_id?: string } | undefined)?.daily_task_id ||
      null;

    await loadTasks(createdId);
  } catch (error: any) {
    ElMessage.error(
      error?.response?.data?.message || error?.message || "创建失败"
    );
  } finally {
    saving.value = false;
  }
};

const handleSaveContent = async () => {
  if (!activeTask.value || !activeTaskId.value) return;

  if (isBlankTableHtml(activeTableHtml.value)) {
    ElMessage.warning("请填写表格或上传附件内容");
    return;
  }

  const value = buildTaskValue(activeTableHtml.value, activeTask.value.title);

  saving.value = true;
  try {
    const response = await updateDailyTask({
      daily_task_id: activeTaskId.value,
      value
    });
    if (response.code !== 200) {
      ElMessage.error(response.message || "保存失败");
      return;
    }
    ElMessage.success("保存成功");
  } catch (error: any) {
    ElMessage.error(
      error?.response?.data?.message || error?.message || "保存失败"
    );
  } finally {
    saving.value = false;
  }
};

const handleDelete = (row: PersonalTaskItem) => {
  ElMessageBox.confirm(`确定删除任务「${row.title}」吗？`, "提示", {
    type: "warning",
    confirmButtonText: "确定",
    cancelButtonText: "取消"
  })
    .then(async () => {
      const response = await deleteDailyTask({ daily_task_id: row.id });
      if (response.code === 200) {
        ElMessage.success("删除成功");
        if (activeTaskId.value === row.id) {
          clearActiveTask();
        }
        await loadTasks();
      } else {
        ElMessage.error(response.message || "删除失败");
      }
    })
    .catch(() => {});
};

const calculateContentHeight = () => {
  nextTick(() => {
    if (!mainCardRef.value) return;
    const viewportHeight = window.innerHeight;
    const cardRect = mainCardRef.value.$el.getBoundingClientRect();
    const cardTopToViewportBottom = viewportHeight - cardRect.top;
    const cardHeaderHeight = 56;
    const cardPadding = 40;
    const tabsHeight = 48;
    const bottomPadding = 24;
    const availableHeight =
      cardTopToViewportBottom -
      cardHeaderHeight -
      cardPadding -
      tabsHeight -
      bottomPadding;
    contentMinHeight.value = Math.max(360, availableHeight);
  });
};

const handleResize = () => {
  calculateContentHeight();
};

onMounted(() => {
  loadTasks();
  calculateContentHeight();
  window.addEventListener("resize", handleResize);
});

onUnmounted(() => {
  window.removeEventListener("resize", handleResize);
});
</script>

<style scoped lang="scss">
.personal-task-page {
  background: #f5f7fa;
  min-height: calc(100vh - 200px);
}

.main-card {
  min-height: calc(100vh - 200px);
  display: flex;
  flex-direction: column;

  :deep(.el-card__body) {
    flex: 1;
    min-height: 0;
    display: flex;
    flex-direction: column;
  }
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 12px;

  .card-title {
    font-size: 16px;
    font-weight: 600;
    color: #303133;
    flex-shrink: 0;
  }

  .card-actions {
    display: flex;
    align-items: center;
    gap: 8px;
    flex-wrap: wrap;
    justify-content: flex-end;
  }
}

.task-tabs-wrap {
  flex: 1;
  min-height: 0;
  display: flex;
  flex-direction: column;
}

.task-tabs {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 8px;
  flex-shrink: 0;
  margin-bottom: 12px;
}

.task-tab {
  max-width: 200px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  border: 1px solid var(--el-border-color);
  background: #fff;
  color: var(--el-text-color-regular);
  border-radius: 4px;
  padding: 8px 16px;
  font-size: 13px;
  line-height: 1;
  cursor: pointer;
  transition: all 0.2s;

  &:hover {
    color: var(--el-color-primary);
    border-color: var(--el-color-primary-light-5);
  }

  &.is-active {
    color: var(--el-color-primary);
    border-color: var(--el-color-primary);
    background: var(--el-color-primary-light-9);
    font-weight: 600;
  }
}

.task-tab-content {
  flex: 1;
  min-height: 0;
  display: flex;
  flex-direction: column;

  :deep(.task-table-editor) {
    flex: 1;
    min-height: v-bind('contentMinHeight + "px"');
    height: auto;
  }
}

@media (max-width: 640px) {
  .card-header {
    flex-direction: column;
    align-items: flex-start;

    .card-actions {
      width: 100%;

      .el-button {
        flex: 1;
      }
    }
  }

  .task-tab {
    max-width: 140px;
  }
}
</style>
