<template>
  <div class="personal-task-page">
    <el-card v-loading="loading" shadow="never" class="main-card">
      <template #header>
        <div class="card-header">
          <span class="card-title">个人任务</span>
          <div class="card-actions">
            <el-button type="primary" @click="handleAdd">
              <el-icon>
                <Plus />
              </el-icon>
              新建任务
            </el-button>
          </div>
        </div>
      </template>

      <template v-if="total > 0">
        <el-table :data="tasks" stripe class="task-table">
          <el-table-column label="序号" show-overflow-tooltip width="100">
            <template #default="{ row, $index }">
              {{ row.index }}
            </template>
          </el-table-column>
          <el-table-column label="任务名称" min-width="200" show-overflow-tooltip>
            <template #default="{ row }">
              <el-button type="primary" link @click="handleOpenTask(row)">
                {{ row.title }}
              </el-button>
            </template>
          </el-table-column>
          <el-table-column prop="creator" label="创建人" show-overflow-tooltip width="100">
            <template #default="{ row }">
              {{ row.creator || "-" }}
            </template>
          </el-table-column>
          <el-table-column prop="createTime" label="创建时间" show-overflow-tooltip width="200">
            <template #default="{ row }">
              {{ row.createTime || "-" }}
            </template>
          </el-table-column>
          <el-table-column label="操作" width="100" fixed="right">
            <template #default="{ row }">
              <el-button type="danger" link @click="handleDelete(row)">删除</el-button>
            </template>
          </el-table-column>
        </el-table>

        <div class="pagination-container">
          <el-pagination v-model:current-page="currentPage" v-model:page-size="pageSize" :page-sizes="[10, 20, 50, 100]"
            :total="total" layout="total, sizes, prev, pager, next, jumper" @size-change="handleSizeChange"
            @current-change="handlePageChange" />
        </div>
      </template>

      <el-empty v-else-if="!loading" description="暂无任务，点击新建任务开始" :image-size="100">
        <el-button type="primary" @click="handleAdd">新建任务</el-button>
      </el-empty>
    </el-card>

    <!-- 新建 / 编辑任务 -->
    <el-dialog v-model="taskDialogVisible" :title="isCreateMode ? '新建任务' : '编辑任务'" width="98%" top="2vh"
      :close-on-click-modal="false" destroy-on-close class="task-dialog" @closed="handleTaskDialogClosed">
      <el-form label-width="80px" @submit.prevent>
        <el-form-item label="任务名称" required>
          <el-input v-model="taskFormData.title" maxlength="100" show-word-limit placeholder="请输入任务名称" clearable />
        </el-form-item>
        <el-form-item label="任务内容">
          <div v-loading="detailLoading" class="task-editor-wrap">
            <TaskTableEditor v-if="taskDialogVisible" :key="editorKey" v-model="taskFormData.html" embedded />
          </div>
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="taskDialogVisible = false">取消</el-button>
        <el-button type="primary" :loading="saving" @click="handleSave">
          {{ isCreateMode ? "确定" : "保存" }}
        </el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, computed, onMounted } from "vue";
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
  index?: number;
  createTime: string;
  updateTime: string;
  creator: string;
}

const mapDailyTask = (item: DailyTaskListItem): PersonalTaskItem => ({
  id: getDailyTaskId(item),
  title: getDailyTaskName(item),
  index: item.index as number,
  createTime: String(item.create_time || item.created_at || ""),
  updateTime: String(item.update_time || item.updated_at || ""),
  creator: String(item.creator || "")
});

const loading = ref(false);
const detailLoading = ref(false);
const saving = ref(false);
const tasks = ref<PersonalTaskItem[]>([]);
const currentPage = ref(1);
const pageSize = ref(20);
const total = ref(0);

const taskDialogVisible = ref(false);
const editTaskId = ref<string | null>(null);
const editorKey = ref(0);
const taskFormData = reactive({
  title: "",
  html: ""
});

const isCreateMode = computed(() => !editTaskId.value);

const resetTaskForm = () => {
  taskFormData.title = "";
  taskFormData.html = "";
  editorKey.value += 1;
};

const loadTasks = async () => {
  loading.value = true;
  try {
    const response = await selectDailyTasks({
      page: currentPage.value,
      page_size: pageSize.value
    });

    if (response.code === 200) {
      const { list, total: totalCount } = unwrapDailyTaskList(response);
      tasks.value = list.map(mapDailyTask);
      total.value = totalCount;
    } else {
      tasks.value = [];
      total.value = 0;
      ElMessage.error(response.message || "加载任务列表失败");
    }
  } catch (error: any) {
    tasks.value = [];
    total.value = 0;
    ElMessage.error(
      error?.response?.data?.message || error?.message || "加载任务列表失败"
    );
  } finally {
    loading.value = false;
  }
};

const handlePageChange = (page: number) => {
  currentPage.value = page;
  loadTasks();
};

const handleSizeChange = (size: number) => {
  pageSize.value = size;
  currentPage.value = 1;
  loadTasks();
};

const loadTaskDetail = async (id: string) => {
  detailLoading.value = true;
  try {
    const response = await getDailyTaskInfo({ daily_task_id: id });
    if (response.code === 200) {
      const item = unwrapDailyTaskInfo(response);
      if (item) {
        taskFormData.html = parseTaskEditorHtmlFromItem(item);
        editorKey.value += 1;
        return;
      }
    }
    throw new Error(response.message || "加载任务详情失败");
  } catch (error: any) {
    taskFormData.html = "";
    editorKey.value += 1;
    ElMessage.error(error?.message || "加载任务详情失败");
  } finally {
    detailLoading.value = false;
  }
};

const handleOpenTask = async (row: PersonalTaskItem) => {
  editTaskId.value = row.id;
  taskFormData.title = row.title;
  taskFormData.html = "";
  editorKey.value += 1;
  taskDialogVisible.value = true;
  await loadTaskDetail(row.id);
};

const handleTaskDialogClosed = () => {
  editTaskId.value = null;
  resetTaskForm();
};

const handleAdd = () => {
  editTaskId.value = null;
  resetTaskForm();
  taskDialogVisible.value = true;
};

const handleSave = async () => {
  const title = taskFormData.title.trim();
  if (!title) {
    ElMessage.warning("请输入任务名称");
    return;
  }

  if (isBlankTableHtml(taskFormData.html)) {
    ElMessage.warning("请填写表格或上传附件内容");
    return;
  }

  const value = buildTaskValue(taskFormData.html, title);

  saving.value = true;
  try {
    if (isCreateMode.value) {
      const response = await addDailyTask({
        daily_task_name: title,
        value
      });
      if (response.code !== 200) {
        ElMessage.error(response.message || "创建失败");
        return;
      }
      ElMessage.success("创建成功");
      currentPage.value = 1;
    } else {
      const response = await updateDailyTask({
        daily_task_id: editTaskId.value!,
        value
      });
      if (response.code !== 200) {
        ElMessage.error(response.message || "保存失败");
        return;
      }
      ElMessage.success("保存成功");
    }

    taskDialogVisible.value = false;
    await loadTasks();
  } catch (error: any) {
    ElMessage.error(
      error?.response?.data?.message || error?.message || (isCreateMode.value ? "创建失败" : "保存失败")
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
        if (editTaskId.value === row.id) {
          taskDialogVisible.value = false;
        }
        if (tasks.value.length === 1 && currentPage.value > 1) {
          currentPage.value -= 1;
        }
        await loadTasks();
      } else {
        ElMessage.error(response.message || "删除失败");
      }
    })
    .catch(() => { });
};

onMounted(() => {
  loadTasks();
});
</script>

<style scoped lang="scss">
.personal-task-page {
  background: #f5f7fa;
  min-height: calc(100vh - 130px);
}

.main-card {
  min-height: calc(100vh - 130px);
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

.task-table {
  width: 100%;
  min-height: calc(100vh - 330px);
}

.pagination-container {
  display: flex;
  justify-content: flex-end;
  margin-top: 16px;
}

.task-editor-wrap {
  width: 100%;
  min-height: 700px;

  :deep(.task-table-editor) {
    min-height: 700px;
    height: 78vh;
  }
}

:deep(.el-dialog.task-dialog) {
  margin-bottom: 2vh;
  max-height: 96vh;
  display: flex;
  flex-direction: column;

  .el-dialog__body {
    flex: 1;
    min-height: 0;
    overflow: auto;
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
}
</style>
