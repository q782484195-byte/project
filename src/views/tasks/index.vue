<template>
  <div class="tasks-page">
    <!-- 搜索表单 -->
    <el-card class="search-card mb-5">
      <template #header>
        <div class="card-header">
          <span>任务查询</span>
        </div>
      </template>
      <el-form :model="searchForm" :inline="true" class="search-form">
        <el-form-item label="所属项目">
          <el-select
            v-model="searchForm.projectId"
            placeholder="全部项目"
            clearable
            style="width: 180px"
            @change="handleProjectChange"
          >
            <el-option
              v-for="project in projects"
              :key="project.id"
              :label="project.name"
              :value="project.id"
            />
          </el-select>
        </el-form-item>
        <el-form-item label="所属需求">
          <el-select
            v-model="searchForm.requirementId"
            placeholder="全部需求"
            clearable
            style="width: 180px"
            @change="handleRequirementChange"
          >
            <el-option
              v-for="requirement in requirements"
              :key="requirement.id"
              :label="requirement.requirement_name"
              :value="requirement.id"
            />
          </el-select>
        </el-form-item>
        <el-form-item label="状态">
          <el-select
            v-model="searchForm.status"
            placeholder="全部状态"
            clearable
            style="width: 180px"
          >
            <el-option
              label="待分配给部门主管"
              :value="TaskStatus.PENDING_ASSIGN_TO_DEPT_LEADER"
            />
            <el-option
              label="待指派给成员"
              :value="TaskStatus.PENDING_ASSIGN_TO_MEMBER"
            />
            <el-option label="任务未开始" :value="TaskStatus.NOT_STARTED" />
            <el-option label="任务进行中" :value="TaskStatus.IN_PROGRESS" />
            <el-option label="待测试" :value="TaskStatus.PENDING_TEST" />
            <el-option label="测试中" :value="TaskStatus.TESTING" />
            <el-option label="测试完成" :value="TaskStatus.TEST_COMPLETED" />
            <el-option label="待审阅" :value="TaskStatus.PENDING_REVIEW" />
            <el-option label="审阅中" :value="TaskStatus.REVIEWING" />
            <el-option label="审阅完成" :value="TaskStatus.REVIEW_COMPLETED" />
            <el-option label="已取消" :value="TaskStatus.CANCELLED" />
            <el-option label="已完成" :value="TaskStatus.COMPLETED" />
          </el-select>
        </el-form-item>
        <el-form-item>
          <el-button type="primary" @click="handleSearch">
            <el-icon>
              <Search />
            </el-icon>
            搜索
          </el-button>
        </el-form-item>
      </el-form>
    </el-card>

    <!-- 任务列表 -->
    <el-card v-loading="loading">
      <template #header>
        <div class="card-header">
          <span>任务列表</span>
          <el-button type="primary" @click="handleCreate">
            <el-icon>
              <Plus />
            </el-icon>
            新建任务
          </el-button>
        </div>
      </template>
      <el-table :data="filteredTasks" style="width: 100%" height="505">
        <el-table-column prop="任务名" label="任务名称" min-width="200">
          <template #default="{ row }">
            {{ row.任务名 || row.task_name || row.title || "-" }}
          </template>
        </el-table-column>
        <el-table-column prop="requirement_name" label="关联需求" width="200" />
        <el-table-column prop="指派给" label="负责人" width="120">
          <template #default="{ row }">
            {{ row.指派给 || row.assignee || "-" }}
          </template>
        </el-table-column>
        <el-table-column prop="状态" label="状态" width="180">
          <template #default="{ row }">
            <el-select
              v-model="row.状态"
              size="small"
              style="width: 100%"
              :class="`status-select-${getStatusType(row.状态 || row.status) || 'default'}`"
              @change="handleStatusChange(row)"
            >
              <el-option
                label="待分配给部门主管"
                :value="TaskStatus.PENDING_ASSIGN_TO_DEPT_LEADER"
              />
              <el-option
                label="待指派给成员"
                :value="TaskStatus.PENDING_ASSIGN_TO_MEMBER"
              />
              <el-option label="任务未开始" :value="TaskStatus.NOT_STARTED" />
              <el-option label="任务进行中" :value="TaskStatus.IN_PROGRESS" />
              <el-option label="待测试" :value="TaskStatus.PENDING_TEST" />
              <el-option label="测试中" :value="TaskStatus.TESTING" />
              <el-option label="测试完成" :value="TaskStatus.TEST_COMPLETED" />
              <el-option label="待审阅" :value="TaskStatus.PENDING_REVIEW" />
              <el-option label="审阅中" :value="TaskStatus.REVIEWING" />
              <el-option
                label="审阅完成"
                :value="TaskStatus.REVIEW_COMPLETED"
              />
              <el-option label="已取消" :value="TaskStatus.CANCELLED" />
              <el-option label="已完成" :value="TaskStatus.COMPLETED" />
            </el-select>
          </template>
        </el-table-column>
        <el-table-column prop="优先级" label="优先级" width="100">
          <template #default="{ row }">
            <el-tag
              :type="getPriorityType(row.优先级 || row.priority) || undefined"
              size="small"
            >
              {{ row.优先级 || row.priority || "-" }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="进度" label="进度" width="120">
          <template #default="{ row }">
            <el-progress
              :percentage="row.进度 || 0"
              :status="row.进度 === 100 ? 'success' : undefined"
            />
          </template>
        </el-table-column>
        <el-table-column prop="预计工时" label="预计工时" width="100" />
        <el-table-column prop="已用工时" label="已用工时" width="100" />
        <el-table-column prop="create_time" label="创建时间" width="180" />
        <el-table-column label="操作" width="150" fixed="right">
          <template #default="{ row }">
            <el-button type="primary" link size="small" @click="handleView(row)"
              >查看</el-button
            >
            <el-button type="primary" link size="small" @click="handleEdit(row)"
              >编辑</el-button
            >
            <el-button
              type="danger"
              link
              size="small"
              @click="handleDelete(row)"
              >删除</el-button
            >
          </template>
        </el-table-column>
      </el-table>

      <div class="pagination">
        <el-pagination
          v-model:current-page="currentPage"
          v-model:page-size="pageSize"
          :page-sizes="[10, 20, 50, 100]"
          :total="totalTasks"
          layout="total, sizes, prev, pager, next, jumper"
        />
      </div>
    </el-card>

    <!-- 新建/编辑任务抽屉 -->
    <TaskDrawer
      v-model:visible="showTaskDrawer"
      :project-id="currentProjectId || searchForm.projectId"
      :requirement-id="searchForm.requirementId"
      :requirement-name="getRequirementName(searchForm.requirementId)"
      :task="currentTask"
      :projects="projectOptions"
      @refresh="handleTaskRefresh"
    />
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, watch } from "vue";
import { useRouter, useRoute } from "vue-router";
import { ElMessage, ElMessageBox } from "element-plus";
import { Plus, Search } from "@element-plus/icons-vue";
import {
  selectProjects,
  selectRequirements,
  selectTasks,
  updateTaskState,
  type ProjectListItem,
  type RequirementListItem
} from "@/api/project";
import type { Project } from "@/types";
import { TaskStatus } from "@/types";
import TaskDrawer from "@/components/TaskDrawer.vue";
import { useUserStoreHook } from "@/store/modules/user";

const router = useRouter();
const route = useRoute();
const userStore = useUserStoreHook();

// 搜索表单
const searchForm = ref({
  projectId: "",
  requirementId: "",
  keyword: "",
  status: ""
});

// 兼容旧代码的 ref（用于向后兼容）
const searchKeyword = computed({
  get: () => searchForm.value.keyword,
  set: val => {
    searchForm.value.keyword = val;
  }
});
const statusFilter = computed({
  get: () => searchForm.value.status,
  set: val => {
    searchForm.value.status = val;
  }
});
const selectedProjectId = computed({
  get: () => searchForm.value.projectId,
  set: val => {
    searchForm.value.projectId = val;
  }
});
const selectedRequirementId = computed({
  get: () => searchForm.value.requirementId,
  set: val => {
    searchForm.value.requirementId = val;
  }
});

const currentPage = ref(1);
const pageSize = ref(20);
const loading = ref(false);

const tasks = ref<any[]>([]);
const totalTasks = ref(0);
const projects = ref<Project[]>([]);
const requirements = ref<any[]>([]);
const projectsLoading = ref(false);
const requirementsLoading = ref(false);
const showTaskDrawer = ref(false);
const currentTask = ref<any>(null);
const currentProjectId = ref<string>("");

// 过滤后的任务列表（前端过滤：关键词搜索和状态筛选）
const filteredTasks = computed(() => {
  let result = tasks.value;

  // 关键词搜索（前端过滤）
  if (searchKeyword.value) {
    const keyword = searchKeyword.value.toLowerCase();
    result = result.filter(
      t =>
        (t.任务名 || t.task_name || t.title || "")
          .toLowerCase()
          .includes(keyword) ||
        (t.requirement_name || "").toLowerCase().includes(keyword) ||
        (t.指派给 || t.assignee || "").toLowerCase().includes(keyword)
    );
  }

  // 状态筛选（前端过滤）
  if (statusFilter.value) {
    result = result.filter(t => (t.状态 || t.status) === statusFilter.value);
  }

  return result;
});

// 获取状态类型
const getStatusType = (
  status: string
): "success" | "info" | "warning" | "danger" | "" => {
  if (!status) return "";
  const map: Record<string, "success" | "info" | "warning" | "danger" | ""> = {
    [TaskStatus.PENDING_ASSIGN_TO_DEPT_LEADER]: "warning", // 待分配给部门主管 - 黄色
    [TaskStatus.PENDING_ASSIGN_TO_MEMBER]: "warning", // 待指派给成员 - 黄色
    [TaskStatus.NOT_STARTED]: "info", // 任务未开始 - 蓝色
    [TaskStatus.IN_PROGRESS]: "warning", // 任务进行中 - 黄色
    [TaskStatus.PENDING_TEST]: "info", // 待测试 - 蓝色
    [TaskStatus.TESTING]: "warning", // 测试中 - 黄色
    [TaskStatus.TEST_COMPLETED]: "success", // 测试完成 - 绿色
    [TaskStatus.PENDING_REVIEW]: "info", // 待审阅 - 蓝色
    [TaskStatus.REVIEWING]: "warning", // 审阅中 - 黄色
    [TaskStatus.REVIEW_COMPLETED]: "success", // 审阅完成 - 绿色
    [TaskStatus.CANCELLED]: "danger", // 已取消 - 红色
    [TaskStatus.COMPLETED]: "success" // 已完成 - 绿色
  };
  return map[status] || "info";
};

// 获取优先级类型
const getPriorityType = (
  priority: string
): "success" | "info" | "warning" | "danger" | "" => {
  const map: Record<string, "success" | "info" | "warning" | "danger" | ""> = {
    低: "info", // 蓝色
    中: "warning", // 黄色
    高: "danger", // 红色
    紧急: "danger"
  };
  return map[priority] || "";
};

// 加载项目列表
const loadProjects = async () => {
  projectsLoading.value = true;
  try {
    const response = await selectProjects({
      page: 1,
      page_size: 100 // 获取所有项目
    });

    if (response.code === 200 && response.result) {
      projects.value = response.result.map((item: ProjectListItem): Project => {
        return {
          id: item._id,
          name: item.project_name,
          status: item.state as any,
          startDate: item.plant_start_time,
          endDate: item.plant_end_time,
          creator: item.creator,
          createdAt: item.create_time
        };
      });
    } else {
      ElMessage.error(response.message || "加载项目列表失败");
      projects.value = [];
    }
  } catch (error: any) {
    console.error("加载项目列表失败:", error);
    ElMessage.error(
      error?.response?.data?.message || error?.message || "加载项目列表失败"
    );
    projects.value = [];
  } finally {
    projectsLoading.value = false;
  }
};

// 加载需求列表
const loadRequirements = async () => {
  if (!searchForm.value.projectId) {
    requirements.value = [];
    return;
  }

  requirementsLoading.value = true;
  try {
    const response = await selectRequirements({
      project_id: searchForm.value.projectId,
      page: 1,
      page_size: 100 // 获取所有需求
    });

    if (response.code === 200 && response.result) {
      requirements.value = response.result.map(
        (item: RequirementListItem): any => {
          return {
            id: item._id,
            requirement_name: item.需求名,
            project_id: item.project_id
          };
        }
      );
    } else {
      ElMessage.error(response.message || "加载需求列表失败");
      requirements.value = [];
    }
  } catch (error: any) {
    console.error("加载需求列表失败:", error);
    ElMessage.error(
      error?.response?.data?.message || error?.message || "加载需求列表失败"
    );
    requirements.value = [];
  } finally {
    requirementsLoading.value = false;
  }
};

// 处理项目变化
const handleProjectChange = () => {
  // 项目变化时，清空需求选择并重新加载需求列表
  searchForm.value.requirementId = "";
  currentProjectId.value = searchForm.value.projectId;
  currentPage.value = 1;
  loadRequirements();
  // 清空任务列表，因为还没有选择需求
  tasks.value = [];
  totalTasks.value = 0;
};

// 处理需求变化
const handleRequirementChange = () => {
  // 需求变化时，重置页码并重新加载任务列表
  if (searchForm.value.requirementId) {
    currentPage.value = 1;
    loadTasks();
  } else {
    // 如果清空了需求选择，清空任务列表
    tasks.value = [];
    totalTasks.value = 0;
  }
};

// 搜索
const handleSearch = () => {
  currentPage.value = 1;
  // 如果选择了需求，重新加载任务列表
  if (searchForm.value.requirementId) {
    loadTasks();
  }
};

// 重置
const handleReset = () => {
  searchForm.value = {
    projectId: "",
    requirementId: "",
    keyword: "",
    status: ""
  };
  currentPage.value = 1;
  requirements.value = [];
  tasks.value = [];
  totalTasks.value = 0;
  currentProjectId.value = "";
};

// 获取需求名称
const getRequirementName = (requirementId: string): string => {
  if (!requirementId) return "";
  const requirement = requirements.value.find(r => r.id === requirementId);
  return requirement?.requirement_name || "";
};

// 项目选项（用于传递给 TaskDrawer）
const projectOptions = computed(() => {
  return projects.value.map((project: Project) => ({
    id: project.id,
    name: project.name
  }));
});

// 处理任务刷新
const handleTaskRefresh = () => {
  loadTasks();
};

// 加载任务列表
const loadTasks = async () => {
  if (!searchForm.value.requirementId) {
    tasks.value = [];
    totalTasks.value = 0;
    return;
  }

  loading.value = true;
  try {
    const response = await selectTasks({
      requirement_id: searchForm.value.requirementId,
      page: currentPage.value,
      page_size: pageSize.value
    });

    if (response.code === 200 && response.result) {
      tasks.value = response.result.map((task: any) => ({
        ...task,
        原始状态: task.状态 || task.status // 保存原始状态，用于状态变化比较
      }));
      totalTasks.value = response.total_count || 0;
    } else {
      ElMessage.error(response.message || "加载任务列表失败");
      tasks.value = [];
      totalTasks.value = 0;
    }
  } catch (error: any) {
    console.error("加载任务列表失败:", error);
    ElMessage.error(
      error?.response?.data?.message || error?.message || "加载任务列表失败"
    );
    tasks.value = [];
    totalTasks.value = 0;
  } finally {
    loading.value = false;
  }
};

// 新建任务
const handleCreate = () => {
  currentTask.value = null;
  showTaskDrawer.value = true;
};

// 查看任务
const handleView = (task: any) => {
  // 使用 sessionStorage 临时存储任务数据
  const taskId = task.id || task._id;
  sessionStorage.setItem(`task_${taskId}`, JSON.stringify(task));
  // 传递项目ID和项目名称（从搜索表单或任务数据中获取）
  const projectId = searchForm.value.projectId || task.project_id || "";
  // 获取项目名称
  let projectName = task.project_name || "";
  if (projectId && !projectName) {
    // 从项目列表中查找项目名称
    const project = projects.value.find((p: Project) => p.id === projectId);
    if (project) {
      projectName = project.name;
    }
  }
  router.push({
    name: "TaskDetail",
    params: { id: taskId },
    query: projectId
      ? {
          project_id: projectId,
          project_name: projectName
        }
      : {}
  });
};

// 编辑任务
const handleEdit = (task: any) => {
  // 直接从列表数据构建任务对象，不调用接口
  currentTask.value = {
    _id: task._id || task.id,
    task_name: task.任务名 || task.task_name || task.title || "",
    describe: task.describe || [],
    project_id: task.project_id || task.projectId || "",
    requirement_id: task.requirement_id || task.requirementId || "",
    requirement_name: task.requirement_name || "",
    priority: task.优先级 || task.priority || "",
    estimated_time: task.预计工时 || task.estimated_time || 0,
    attachment: task.attachment || []
  };

  // 如果任务有项目ID，设置当前项目ID（用于加载需求列表）
  if (currentTask.value.project_id) {
    currentProjectId.value = currentTask.value.project_id;
    // 如果项目ID不在搜索表单中，更新搜索表单的项目ID（但不触发加载任务）
    if (currentTask.value.project_id !== searchForm.value.projectId) {
      searchForm.value.projectId = currentTask.value.project_id;
      // 加载该项目的需求列表
      loadRequirements();
    }
  }

  showTaskDrawer.value = true;
};

// 处理状态变化
const handleStatusChange = async (task: any) => {
  const taskId = task._id || task.id;
  const currentState = task.原始状态 || task.状态 || task.status;
  const nextState = task.状态 || task.status;

  if (!taskId) {
    ElMessage.error("任务ID不存在");
    return;
  }

  if (currentState === nextState) {
    // 状态没有变化，不需要调用接口
    return;
  }

  try {
    // 获取当前用户名称
    const personName = userStore.username || userStore.nickname || "Admin";

    const response = await updateTaskState({
      task_id: taskId,
      current_state: currentState,
      next_state: nextState,
      person_name: personName
    });

    if (response.code === 200) {
      ElMessage.success("状态更新成功");
      // 保存原始状态，用于下次比较
      task.原始状态 = nextState;
      // 刷新任务列表
      loadTasks();
    } else {
      ElMessage.error(response.message || "状态更新失败");
      // 恢复原状态
      task.状态 = currentState;
    }
  } catch (error: any) {
    console.error("更新任务状态失败:", error);
    ElMessage.error(
      error?.response?.data?.message || error?.message || "状态更新失败"
    );
    // 恢复原状态
    task.状态 = currentState;
  }
};

// 删除任务
const handleDelete = async (task: any) => {
  try {
    await ElMessageBox.confirm("确定要删除该任务吗？", "提示", {
      confirmButtonText: "确定",
      cancelButtonText: "取消",
      type: "warning"
    });
    // TODO: 调用删除 API
    ElMessage.success("删除成功");
    loadTasks();
  } catch {
    // 用户取消
  }
};

// 监听项目ID变化，自动加载需求列表
watch(
  () => searchForm.value.projectId,
  () => {
    if (searchForm.value.projectId) {
      loadRequirements();
    } else {
      requirements.value = [];
      searchForm.value.requirementId = "";
    }
  }
);

// 监听分页变化
watch([currentPage, pageSize], () => {
  // 只有在选择了需求时才加载任务列表
  if (searchForm.value.requirementId) {
    loadTasks();
  }
});

// 从路由参数中恢复搜索条件
const restoreSearchFromQuery = () => {
  if (route.query.project_id) {
    searchForm.value.projectId = route.query.project_id as string;
    // 如果项目ID存在，加载需求列表
    if (searchForm.value.projectId) {
      loadRequirements();
    }
  }
  if (route.query.requirement_id) {
    searchForm.value.requirementId = route.query.requirement_id as string;
    // 如果需求ID存在，加载任务列表
    if (searchForm.value.requirementId) {
      loadTasks();
    }
  }
};

onMounted(async () => {
  // 先加载项目列表
  await loadProjects();
  // 从路由参数中恢复搜索条件
  restoreSearchFromQuery();
});
</script>

<style scoped lang="scss">
.tasks-page {
  padding: 20px;

  .page-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 20px;

    h2 {
      margin: 0;
      font-size: 24px;
      font-weight: 600;
    }

    .header-actions {
      display: flex;
      gap: 12px;
      align-items: center;
    }
  }

  .pagination {
    margin-top: 20px;
    display: flex;
    justify-content: flex-end;
  }

  .card-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
  }

  // 状态选择器样式
  :deep(.status-select-info) {
    .el-input__inner {
      color: #409eff;
      border-color: #409eff;
    }
  }

  :deep(.status-select-warning) {
    .el-input__inner {
      color: #e6a23c;
      border-color: #e6a23c;
    }
  }

  :deep(.status-select-success) {
    .el-input__inner {
      color: #67c23a;
      border-color: #67c23a;
    }
  }

  :deep(.status-select-danger) {
    .el-input__inner {
      color: #f56c6c;
      border-color: #f56c6c;
    }
  }
}
</style>
