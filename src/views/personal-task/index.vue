<template>
  <div class="personal-task-page">
    <el-card v-loading="loading" shadow="never" class="main-card">
      <template #header>
        <div class="card-header">
          <span class="card-title">日常任务</span>
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

      <el-form :model="searchForm" :inline="true" class="search-form" @submit.prevent>
        <el-form-item label="任务名称">
          <el-input v-model="searchForm.task_name" clearable placeholder="请输入任务名称" style="width: 220px"
            @keyup.enter="handleSearch" />
        </el-form-item>
        <el-form-item label="状态">
          <el-select v-model="searchForm.state" clearable placeholder="全部状态" style="width: 160px">
            <el-option label="未完成" value="未完成" />
            <el-option label="已完成" value="已完成" />
            <el-option label="已取消" value="已取消" />
          </el-select>
        </el-form-item>
        <el-form-item>
          <el-button type="primary" @click="handleSearch">搜索</el-button>
          <el-button @click="handleSearchReset">重置</el-button>
        </el-form-item>
      </el-form>

      <template v-if="total > 0">
        <el-table :data="tasks" stripe class="task-table">
          <el-table-column label="序号" width="80" align="center">
            <template #default="{ row }">
              {{ row.index ?? "-" }}
            </template>
          </el-table-column>
          <el-table-column label="任务名称" min-width="180" show-overflow-tooltip>
            <template #default="{ row }">
              <el-button type="primary" link @click="goToDetail(row.id)">
                {{ row.title }}
              </el-button>
            </template>
          </el-table-column>
          <el-table-column prop="creator" label="创建人" show-overflow-tooltip width="100">
            <template #default="{ row }">
              {{ row.creator || "-" }}
            </template>
          </el-table-column>
          <el-table-column label="指派人" min-width="180" class-name="assignee-cell">
            <template #default="{ row }">
              <DailyTaskAssigneeTags :task="row.source" />
            </template>
          </el-table-column>
          <el-table-column label="优先级" width="90">
            <template #default="{ row }">
              <el-tag :type="row.priority === '紧急' ? 'danger' : 'warning'" size="small">
                {{ row.priority || "-" }}
              </el-tag>
            </template>
          </el-table-column>
          <el-table-column prop="state" label="状态" width="100" show-overflow-tooltip>
            <template #default="{ row }">
              {{ row.state || "-" }}
            </template>
          </el-table-column>
          <el-table-column label="进度" width="80">
            <template #default="{ row }">
              {{ row.progress }}%
            </template>
          </el-table-column>
          <el-table-column prop="taskDeadline" label="完成期限" width="120" show-overflow-tooltip>
            <template #default="{ row }">
              {{ row.taskDeadline || "-" }}
            </template>
          </el-table-column>
          <el-table-column prop="createTime" label="创建时间" show-overflow-tooltip width="170">
            <template #default="{ row }">
              {{ row.createTime || "-" }}
            </template>
          </el-table-column>
          <el-table-column label="操作" width="120" fixed="right">
            <template #default="{ row }">
              <el-button type="primary" link @click="goToDetail(row.id)">
                详情
              </el-button>
              <el-button v-if="row.canDelete" type="danger" link @click="handleDelete(row)">
                删除
              </el-button>
            </template>
          </el-table-column>
        </el-table>

        <div class="pagination-container">
          <el-pagination v-model:current-page="currentPage" v-model:page-size="pageSize" :page-sizes="[10, 20, 50, 100]"
            :total="total" layout="total, sizes, prev, pager, next, jumper" @size-change="handleSizeChange"
            @current-change="handlePageChange" />
        </div>
      </template>

      <el-empty v-else-if="!loading" description="暂无任务" :image-size="100">
        <el-button type="primary" @click="handleAdd">新建任务</el-button>
      </el-empty>
    </el-card>

    <el-dialog v-model="createDialogVisible" title="新建任务" width="900px" top="4vh" :close-on-click-modal="false"
      destroy-on-close class="task-dialog" @closed="resetCreateForm">
      <el-form label-width="100px" @submit.prevent>

        <el-form-item label="任务名称" required>
          <el-input v-model="createForm.title" maxlength="100" show-word-limit placeholder="请输入任务名称" clearable />
        </el-form-item>

        <el-form-item label="指派人" required>
          <el-select v-model="createForm.assigner" multiple filterable placeholder="请选择指派人" style="width: 100%"
            :loading="departmentManagersLoading">
            <el-option v-for="username in departmentManagers" :key="username" :label="username" :value="username" />
          </el-select>
        </el-form-item>

        <el-form-item label="优先级">
          <el-select v-model="createForm.priority" placeholder="选择优先级" style="width: 200px">
            <el-option label="正常" value="正常" />
            <el-option label="紧急" value="紧急" />
          </el-select>
        </el-form-item>

        <el-form-item label="完成期限">
          <el-date-picker v-model="createForm.task_deadline" type="date" placeholder="请选择完成期限" style="width: 240px"
            format="YYYY-MM-DD" value-format="YYYY-MM-DD" clearable />
        </el-form-item>

        <el-form-item label="任务描述">
          <div class="describe-editor-wrap">
            <RichTextEditor v-if="createDialogVisible" :key="editorKey" v-model="createForm.describe" />
          </div>
        </el-form-item>

        <el-form-item label="附件文件">
          <el-upload v-model:file-list="fileList" multiple :auto-upload="false" :on-remove="handleFileRemove"
            :on-change="handleFileChange" :before-upload="handleBeforeUpload">
            <el-button type="primary">
              <el-icon>
                <Upload />
              </el-icon>
              选择文件
            </el-button>
            <template #tip>
              <div class="el-upload__tip">可以上传多个文件，与任务描述分开管理</div>
            </template>
          </el-upload>
        </el-form-item>
      </el-form>

      <template #footer>
        <el-button @click="createDialogVisible = false">取消</el-button>
        <el-button type="primary" :loading="saving" @click="handleCreate">
          确定
        </el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, computed, onMounted } from "vue";
import { useRouter } from "vue-router";
import { ElMessage, ElMessageBox } from "element-plus";
import { Plus, Upload } from "@element-plus/icons-vue";
import type { UploadFile, UploadFiles } from "element-plus";
import RichTextEditor from "@/components/RichTextEditor.vue";
import DailyTaskAssigneeTags from "@/components/DailyTaskAssigneeTags.vue";
import type { DescribeContent } from "@/api/project";
import {
  collectAttachmentUrlsFromFileList,
  isBlankDailyTaskContent,
  buildAddDailyTaskParams
} from "@/utils/dailyTaskContent";
import {
  addDailyTask,
  deleteDailyTask,
  selectDailyTasks,
  getDailyTaskId,
  getDailyTaskName,
  getDailyTaskState,
  getDailyTaskPriority,
  getDailyTaskProgress,
  isDailyTaskCreator,
  unwrapDailyTaskList,
  type DailyTaskListItem
} from "@/api/daily-task";
import {
  getDepartmentNameList,
  flattenDepartmentList
} from "@/api/system";
import { useUserStoreHook } from "@/store/modules/user";

defineOptions({
  name: "PersonalTask"
});

interface PersonalTaskItem {
  id: string;
  index: number | null;
  title: string;
  createTime: string;
  creator: string;
  source: DailyTaskListItem;
  priority: string;
  state: string;
  progress: number;
  taskDeadline: string;
  canDelete: boolean;
}

const router = useRouter();
const userStore = useUserStoreHook();
const currentUsername = computed(() => (userStore.username || "").trim());

const mapDailyTask = (item: DailyTaskListItem): PersonalTaskItem => {
  const indexValue = Number(item.index);
  return {
    id: getDailyTaskId(item),
    index: Number.isFinite(indexValue) ? indexValue : null,
    title: getDailyTaskName(item),
    createTime: String(item.create_time || item.created_at || ""),
    creator: String(item.creator || ""),
    source: item,
    priority: getDailyTaskPriority(item),
    state: getDailyTaskState(item),
    progress: getDailyTaskProgress(item),
    taskDeadline: String(item.task_deadline || ""),
    canDelete: isDailyTaskCreator(item, currentUsername.value)
  };
};

const loading = ref(false);
const saving = ref(false);
const departmentManagersLoading = ref(false);
const tasks = ref<PersonalTaskItem[]>([]);
const departmentManagers = ref<string[]>([]);
const currentPage = ref(1);
const pageSize = ref(20);
const total = ref(0);
const searchForm = reactive({
  task_name: "",
  state: ""
});

const createDialogVisible = ref(false);
const editorKey = ref(0);
const fileList = ref<UploadFile[]>([]);
const createForm = reactive({
  title: "",
  describe: [] as DescribeContent[],
  assigner: [] as string[],
  priority: "正常",
  task_deadline: ""
});

const resetCreateForm = () => {
  createForm.title = "";
  createForm.describe = [];
  createForm.assigner = [];
  createForm.priority = "正常";
  createForm.task_deadline = "";
  fileList.value = [];
  editorKey.value += 1;
};

const handleBeforeUpload = () => false;

const handleFileChange = (_file: UploadFile, files: UploadFiles) => {
  fileList.value = files;
};

const handleFileRemove = (_file: UploadFile, files: UploadFiles) => {
  fileList.value = files;
};

const goToDetail = (id: string) => {
  router.push({
    name: "PersonalTaskDetail",
    params: { id }
  });
};

const loadDepartmentManagers = async () => {
  departmentManagersLoading.value = true;
  try {
    const response = await getDepartmentNameList();
    if (response.code === 200 && response.result != null) {
      const departmentList = flattenDepartmentList(response.result);
      const managers = new Set<string>();
      departmentList.forEach(dept => {
        (dept.负责人 || []).forEach(name => {
          const trimmed = String(name).trim();
          if (trimmed) managers.add(trimmed);
        });
      });
      departmentManagers.value = Array.from(managers);
    } else {
      departmentManagers.value = [];
      ElMessage.error("加载部门负责人列表失败");
    }
  } catch (error: any) {
    departmentManagers.value = [];
    ElMessage.error(
      error?.response?.data?.message || error?.message || "加载部门负责人列表失败"
    );
  } finally {
    departmentManagersLoading.value = false;
  }
};

const loadTasks = async () => {
  loading.value = true;
  try {
    const response = await selectDailyTasks({
      task_name: searchForm.task_name.trim(),
      state: searchForm.state,
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

const handleSearch = () => {
  currentPage.value = 1;
  loadTasks();
};

const handleSearchReset = () => {
  searchForm.task_name = "";
  searchForm.state = "";
  currentPage.value = 1;
  loadTasks();
};

const handleSizeChange = (size: number) => {
  pageSize.value = size;
  currentPage.value = 1;
  loadTasks();
};

const handleAdd = async () => {
  resetCreateForm();
  if (!departmentManagers.value.length) {
    await loadDepartmentManagers();
  }
  createDialogVisible.value = true;
};

const handleCreate = async () => {
  const title = createForm.title.trim();
  if (!title) {
    ElMessage.warning("请输入任务名称");
    return;
  }

  if (!createForm.assigner.length) {
    ElMessage.warning("请选择指派人");
    return;
  }

  if (isBlankDailyTaskContent(createForm.describe, fileList.value.length)) {
    ElMessage.warning("请输入任务描述或上传附件");
    return;
  }

  saving.value = true;
  try {
    const attachmentUrls = await collectAttachmentUrlsFromFileList(fileList.value);
    if (!attachmentUrls.length && fileList.value.some(file => file.raw)) {
      ElMessage.error("附件上传失败");
      return;
    }

    const response = await addDailyTask(
      buildAddDailyTaskParams(createForm.describe, attachmentUrls, title, {
        assigner: createForm.assigner,
        priority: createForm.priority,
        task_deadline: createForm.task_deadline
      })
    );
    if (response.code !== 200) {
      ElMessage.error(response.message || "创建失败");
      return;
    }

    ElMessage.success("创建成功");
    createDialogVisible.value = false;
    currentPage.value = 1;
    await loadTasks();
  } catch (error: any) {
    ElMessage.error(
      error?.response?.data?.message || error?.message || "创建失败"
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
      const response = await deleteDailyTask({ task_id: row.id });
      if (response.code === 200) {
        ElMessage.success("删除成功");
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
  loadDepartmentManagers();
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

.search-form {
  margin-bottom: 16px;
}

.task-table {
  width: 100%;
  min-height: calc(100vh - 330px);

  :deep(.assignee-cell .cell) {
    overflow: visible;
    white-space: normal;
    line-height: 1.6;
  }
}

.pagination-container {
  display: flex;
  justify-content: flex-end;
}

.describe-editor-wrap {
  width: 100%;

  :deep(.rich-text-editor) {
    min-height: 280px;
  }

  :deep(.editor-content) {
    min-height: 240px;
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
