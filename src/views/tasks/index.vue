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
          <el-select v-model="searchForm.projectId" placeholder="全部项目" clearable style="width: 180px"
            @change="handleProjectChange">
            <el-option v-for="project in projects" :key="project.id" :label="project.name" :value="project.id" />
          </el-select>
        </el-form-item>
        <el-form-item label="所属需求">
          <el-select v-model="searchForm.requirementId" placeholder="全部需求" clearable style="width: 180px"
            @change="handleRequirementChange">
            <el-option v-for="requirement in requirements" :key="requirement.id" :label="requirement.requirement_name"
              :value="requirement.id" />
          </el-select>
        </el-form-item>
        <el-form-item label="任务关键词">
          <el-input v-model="searchForm.taskName" placeholder="支持任务名、描述等关键词模糊搜索" clearable style="width: 220px"
            @keyup.enter="handleSearch" @clear="handleSearch" />
        </el-form-item>
        <!-- <el-form-item label="状态">
          <el-select v-model="searchForm.status" placeholder="全部状态" clearable style="width: 180px">
            <el-option label="待分配给部门负责人" :value="TaskStatus.PENDING_ASSIGN_TO_DEPT_LEADER" />
            <el-option label="待指派给成员" :value="TaskStatus.PENDING_ASSIGN_TO_MEMBER" />
            <el-option label="任务未开始" :value="TaskStatus.NOT_STARTED" />
            <el-option label="任务进行中" :value="TaskStatus.IN_PROGRESS" />
            <el-option label="待测试" :value="TaskStatus.PENDING_TEST" />
            <el-option label="测试中" :value="TaskStatus.TESTING" />
            <el-option label="测试完毕" :value="TaskStatus.TEST_COMPLETED" />
            <el-option label="待审阅" :value="TaskStatus.PENDING_REVIEW" />
            <el-option label="审阅中" :value="TaskStatus.REVIEWING" />
            <el-option label="审阅完毕" :value="TaskStatus.REVIEW_COMPLETED" />
            <el-option label="已取消" :value="TaskStatus.CANCELLED" />
            <el-option label="已完成" :value="TaskStatus.COMPLETED" />
          </el-select>
        </el-form-item> -->
        <el-form-item>
          <el-button type="primary" @click="handleSearch">搜索</el-button>
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
      <el-table :data="filteredTasks" style="width: 100%" height="525">
        <el-table-column prop="任务名" label="任务名称" width="140">
          <template #default="{ row }">
            {{ row.任务名 || row.task_name || row.title || "-" }}
          </template>
        </el-table-column>
        <el-table-column prop="requirement_name" label="关联需求" width="140" />
        <el-table-column prop="指派人" label="负责人" width="140">
          <template #default="{ row }">
            <el-tag type="info">
              <span class="assignee-text">{{ row.指派人 || row.assignee || "-" }}</span>
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="状态" label="状态" width="140">
          <template #default="{ row }">
            <el-tag :type="getStatusType(row.状态 || row.status) || undefined" size="small" effect="light">
              {{ row.状态 || row.status || "-" }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="优先级" label="优先级">
          <template #default="{ row }">
            <el-tag :type="getPriorityType(row.优先级 || row.priority) || undefined" size="small">
              {{ row.优先级 || row.priority || "-" }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="进度" label="进度" width="150">
          <template #default="{ row }">
            <el-progress :percentage="row.进度 || 0" :status="row.进度 === 100 ? 'success' : undefined" />
          </template>
        </el-table-column>
        <el-table-column prop="预计工时" label="预计工时" width="100" />
        <el-table-column prop="已用工时" label="已用工时" width="100" />
        <el-table-column prop="create_time" label="创建时间" width="180" />
        <el-table-column label="操作" width="260" fixed="right">
          <template #default="{ row }">
            <el-button type="primary" link size="small" @click="handleView(row)">查看</el-button>
            <el-button type="primary" link size="small" @click="handleEdit(row)">编辑</el-button>
            <el-button type="danger" link size="small" @click="handleCloseTask(row)">关闭</el-button>
            <el-button type="primary" link size="small" :disabled="!getNextStatus(row.状态 || row.status)"
              :loading="statusFlowButtonLoadingTaskId === (row._id || row.id)" @click="openStatusFlowDialog(row)">
              流转
            </el-button>
            <el-button type="success" link size="small" @click="openReportDialog(row)">进度汇报</el-button>
          </template>
        </el-table-column>
      </el-table>

      <div class="pagination">
        <el-pagination v-model:current-page="currentPage" v-model:page-size="pageSize" :page-sizes="[10, 20, 50, 100]"
          :total="totalTasks" layout="total, sizes, prev, pager, next, jumper" />
      </div>
    </el-card>

    <!-- 新建/编辑任务抽屉 -->
    <TaskDrawer v-model:visible="showTaskDrawer" :project-id="currentProjectId || searchForm.projectId"
      :requirement-id="searchForm.requirementId" :requirement-name="getRequirementName(searchForm.requirementId)"
      :task="currentTask" :projects="projectOptions" @refresh="handleTaskRefresh" />

    <TaskStatusFlowDialog v-model:visible="statusFlowDialogVisible" :task="statusFlowTask"
      @success="handleStatusFlowSuccess" @flow-start="handleStatusFlowStart" @flow-end="handleStatusFlowEnd" />

    <el-dialog v-model="reportDialogVisible" title="进度汇报" width="480px" append-to-body :close-on-click-modal="false">
      <el-form ref="reportFormRef" :model="reportForm" :rules="reportRules" label-width="90px">
        <el-form-item label="任务名称">
          <span>{{ reportForm.task_name || "-" }}</span>
        </el-form-item>
        <el-form-item label="接收人" prop="recipient">
          <el-select v-model="reportForm.recipient" placeholder="请选择接收人" filterable clearable
            :loading="departmentUsersLoading">
            <el-option v-for="user in departmentUsers" :key="user.username" :label="user.nickname
              ? `${user.nickname} (${user.username})`
              : user.username
              " :value="user.username" />
          </el-select>
        </el-form-item>
        <el-form-item label="当前进度" prop="progress">
          <el-input-number v-model="reportForm.progress" :min="0" :max="100" controls-position="right"
            style="width: 100%" />
        </el-form-item>
        <el-form-item label="汇报内容" prop="message">
          <el-input v-model="reportForm.message" type="textarea" :rows="4" placeholder="请输入汇报内容" />
        </el-form-item>
      </el-form>
      <template #footer>
        <span class="dialog-footer">
          <el-button @click="reportDialogVisible = false">取消</el-button>
          <el-button type="primary" :loading="reportSubmitting" @click="handleReportSubmit">提交</el-button>
        </span>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, watch, reactive, nextTick } from "vue";
import { useRouter, useRoute } from "vue-router";
import { ElMessage, ElMessageBox } from "element-plus";
import type { FormInstance, FormRules } from "element-plus";
import { Plus, Search } from "@element-plus/icons-vue";
import {
  selectProjects,
  selectRequirements,
  selectTasks,
  reportTaskProgress,
  updateTaskState,
  type ProjectListItem,
  type RequirementListItem,
  type SelectTasksParams
} from "@/api/project";
import { selectDepartmentUsers, type DepartmentUserItem } from "@/api/system";
import type { Project } from "@/types";
import { TaskStatus } from "@/types";
import TaskStatusFlowDialog from "@/components/TaskStatusFlowDialog.vue";
import TaskDrawer from "@/components/TaskDrawer.vue";

const router = useRouter();
const route = useRoute();
// 搜索表单
const searchForm = ref({
  projectId: "",
  requirementId: "",
  keyword: "",
  status: "",
  taskName: ""
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
const hasOpenedCreateDrawer = ref(false); // 标志，用于避免重复打开新建抽屉

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
    [TaskStatus.PENDING_ASSIGN_TO_DEPT_LEADER]: "warning", // 待分配给部门负责人 - 黄色
    [TaskStatus.PENDING_ASSIGN_TO_MEMBER]: "warning", // 待指派给成员 - 黄色
    [TaskStatus.NOT_STARTED]: "info", // 任务未开始 - 蓝色
    [TaskStatus.IN_PROGRESS]: "warning", // 任务进行中 - 黄色
    [TaskStatus.PENDING_TEST]: "info", // 待测试 - 蓝色
    [TaskStatus.TESTING]: "warning", // 测试中 - 黄色
    [TaskStatus.TEST_COMPLETED]: "success", // 测试完毕 - 绿色
    [TaskStatus.PENDING_REVIEW]: "info", // 待审阅 - 蓝色
    [TaskStatus.REVIEWING]: "warning", // 审阅中 - 黄色
    [TaskStatus.REVIEW_COMPLETED]: "success", // 审阅完毕 - 绿色
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

const statusFlowOrder: TaskStatus[] = [
  TaskStatus.PENDING_ASSIGN_TO_DEPT_LEADER,
  TaskStatus.PENDING_ASSIGN_TO_MEMBER,
  TaskStatus.NOT_STARTED,
  TaskStatus.IN_PROGRESS,
  TaskStatus.PENDING_TEST,
  TaskStatus.TESTING,
  TaskStatus.TEST_COMPLETED,
  TaskStatus.PENDING_REVIEW,
  TaskStatus.REVIEWING,
  TaskStatus.REVIEW_COMPLETED,
  TaskStatus.CANCELLED,
  TaskStatus.COMPLETED
];

const statusAliasMap: Record<string, TaskStatus> = {
  待分配给部门负责人: TaskStatus.PENDING_ASSIGN_TO_DEPT_LEADER,
  待分配给部门主管: TaskStatus.PENDING_ASSIGN_TO_DEPT_LEADER,
  待指派给成员: TaskStatus.PENDING_ASSIGN_TO_MEMBER,
  待开始: TaskStatus.NOT_STARTED,
  任务未开始: TaskStatus.NOT_STARTED,
  进行中: TaskStatus.IN_PROGRESS,
  任务进行中: TaskStatus.IN_PROGRESS,
  待测试: TaskStatus.PENDING_TEST,
  测试中: TaskStatus.TESTING,
  测试完毕: TaskStatus.TEST_COMPLETED,
  待审阅: TaskStatus.PENDING_REVIEW,
  审阅中: TaskStatus.REVIEWING,
  审阅完毕: TaskStatus.REVIEW_COMPLETED,
  已取消: TaskStatus.CANCELLED,
  取消: TaskStatus.CANCELLED,
  已完成: TaskStatus.COMPLETED
};

const normalizeStatus = (status: string): TaskStatus | "" => {
  if (!status) return "";
  if (Object.values(TaskStatus).includes(status as TaskStatus)) {
    return status as TaskStatus;
  }
  return statusAliasMap[status] || "";
};

const getNextStatus = (currentStatus: string): TaskStatus | "" => {
  const normalized = normalizeStatus(currentStatus);
  if (!normalized) return "";
  if (normalized === TaskStatus.CANCELLED || normalized === TaskStatus.COMPLETED) {
    return "";
  }
  const index = statusFlowOrder.indexOf(normalized);
  if (index === -1 || index === statusFlowOrder.length - 1) {
    return "";
  }
  return statusFlowOrder[index + 1];
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
  currentPage.value = 1;
  if (searchForm.value.requirementId) {
    loadTasks();
  } else {
    tasks.value = [];
    totalTasks.value = 0;
  }
};

// 搜索
const handleSearch = () => {
  currentPage.value = 1;
  if (!searchForm.value.requirementId) {
    ElMessage.warning("请先选择所属需求");
    tasks.value = [];
    totalTasks.value = 0;
    return;
  }
  loadTasks();
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
    const params: SelectTasksParams & { task_name?: string } = {
      requirement_id: searchForm.value.requirementId,
      page: currentPage.value,
      page_size: pageSize.value
    };
    const taskNameTrimmed = searchForm.value.taskName?.trim();
    if (taskNameTrimmed) {
      params.task_name = taskNameTrimmed;
    }
    const response = await selectTasks(params);

    if (response.code === 200 && response.result) {
      tasks.value = response.result.map((task: any) => ({
        ...task,
        原始状态: task.状态 || task.status
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
  const query: Record<string, string> = {
    from: "tasks"
  };
  if (projectId) {
    query.project_id = projectId;
    query.project_name = projectName;
  }
  router.push({
    name: "TaskDetail",
    params: { id: taskId },
    query
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

const statusFlowDialogVisible = ref(false);
const statusFlowTask = ref<any>(null);
const statusFlowButtonLoadingTaskId = ref<string>("");
const reportDialogVisible = ref(false);
const reportSubmitting = ref(false);
const reportFormRef = ref<FormInstance>();
const departmentUsers = ref<DepartmentUserItem[]>([]);
const departmentUsersLoading = ref(false);
const reportForm = reactive({
  recipient: "",
  task_id: "",
  task_name: "",
  progress: 0,
  message: ""
});
const reportRules: FormRules = {
  recipient: [{ required: true, message: "请输入接收人", trigger: "blur" }],
  progress: [
    { required: true, message: "请输入进度", trigger: "change" },
    {
      type: "number",
      min: 0,
      max: 100,
      message: "进度需在 0-100 之间",
      trigger: "change"
    }
  ],
  message: [{ required: true, message: "请输入汇报内容", trigger: "blur" }]
};

const openStatusFlowDialog = (task: any) => {
  const nextState = getNextStatus(task.状态 || task.status);
  if (!nextState) {
    ElMessage.warning("当前状态无法继续流转");
    return;
  }
  statusFlowTask.value = task;
  statusFlowDialogVisible.value = true;
};

const handleStatusFlowSuccess = (nextState: string, personName: string) => {
  if (!statusFlowTask.value) return;
  statusFlowTask.value.状态 = nextState;
  statusFlowTask.value.status = nextState;
  statusFlowTask.value.原始状态 = nextState;
  if (personName) {
    statusFlowTask.value.指派人 = personName;
    statusFlowTask.value.assignee = personName;
  }
  loadTasks();
};

const handleStatusFlowStart = (taskId: string) => {
  statusFlowButtonLoadingTaskId.value = taskId;
};

const handleStatusFlowEnd = () => {
  statusFlowButtonLoadingTaskId.value = "";
};

const loadDepartmentUsers = async () => {
  departmentUsersLoading.value = true;
  try {
    const response = await selectDepartmentUsers();
    if (response.code === 200 && Array.isArray(response.result)) {
      departmentUsers.value =
        response.result?.filter(user =>
          Array.isArray(user.role)
            ? user.role.includes("DepartmentManager")
            : false
        ) || [];
    } else {
      departmentUsers.value = [];
      ElMessage.error("加载接收人列表失败");
    }
  } catch (error: any) {
    console.error("加载接收人列表失败:", error);
    ElMessage.error(
      error?.response?.data?.message || error?.message || "加载接收人列表失败"
    );
    departmentUsers.value = [];
  } finally {
    departmentUsersLoading.value = false;
  }
};

const openReportDialog = (task: any) => {
  reportForm.task_id = task._id || task.id || "";
  reportForm.task_name = task.任务名 || task.task_name || task.title || "";
  reportForm.progress = Number(task.进度) || 0;
  reportForm.recipient = task.指派人 || task.assignee || "";
  reportForm.message = "";
  reportDialogVisible.value = true;
  if (!departmentUsers.value.length) {
    loadDepartmentUsers();
  }
  nextTick(() => {
    reportFormRef.value?.clearValidate();
  });
};

const handleReportSubmit = () => {
  reportFormRef.value?.validate(async valid => {
    if (!valid) return;
    if (!reportForm.task_id) {
      ElMessage.error("任务信息缺失");
      return;
    }
    reportSubmitting.value = true;
    try {
      const response = await reportTaskProgress({
        recipient: reportForm.recipient,
        task_id: reportForm.task_id,
        task_name: reportForm.task_name,
        progress: reportForm.progress,
        message: reportForm.message
      });
      if (response.code === 200) {
        ElMessage.success("汇报成功");
        reportDialogVisible.value = false;
        loadTasks();
      } else {
        ElMessage.error(response.message || "汇报失败");
      }
    } catch (error: any) {
      console.error("进度汇报失败:", error);
      ElMessage.error(
        error?.response?.data?.message || error?.message || "汇报失败"
      );
    } finally {
      reportSubmitting.value = false;
    }
  });
};

// 关闭任务（状态置为已取消）
const handleCloseTask = async (task: any) => {
  try {
    await ElMessageBox.confirm("确定要关闭该任务吗？", "提示", {
      confirmButtonText: "确定",
      cancelButtonText: "取消",
      type: "warning"
    });
    const taskId = task._id || task.id;
    const currentState = task.状态 || task.status;
    if (!taskId || !currentState) {
      ElMessage.error("任务信息不完整，无法关闭");
      return;
    }
    const response = await updateTaskState({
      task_id: taskId,
      current_state: currentState,
      next_state: TaskStatus.CANCELLED,
      person_name: task.指派人 || task.assignee || ""
    });
    if (response.code === 200) {
      ElMessage.success("任务已关闭");
      loadTasks();
    } else {
      ElMessage.error(response.message || "关闭任务失败");
    }
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
  if (searchForm.value.requirementId) {
    loadTasks();
  }
});

// 监听 create 参数和需求选择，自动打开新建任务抽屉
watch(
  [() => route.query.create, () => searchForm.value.requirementId],
  ([createParam, requirementId]) => {
    const shouldCreate = createParam === "true" || (Array.isArray(createParam) && createParam.includes("true"));
    // 如果 create 参数存在且需求已选择，且还没有打开过，则打开抽屉
    if (shouldCreate && requirementId && !hasOpenedCreateDrawer.value) {
      hasOpenedCreateDrawer.value = true;
      nextTick(() => {
        currentTask.value = null;
        showTaskDrawer.value = true;
      });
    }
  },
  { immediate: false }
);

// 从路由参数中恢复搜索条件
const restoreSearchFromQuery = async () => {
  if (route.query.project_id) {
    searchForm.value.projectId = route.query.project_id as string;
    // 如果项目ID存在，加载需求列表
    if (searchForm.value.projectId) {
      await loadRequirements();
    }
  }
  if (route.query.requirement_id) {
    searchForm.value.requirementId = route.query.requirement_id as string;
  }
  if (route.query.task_name) {
    searchForm.value.taskName = route.query.task_name as string;
  }
  if (searchForm.value.requirementId) {
    loadTasks();
  }

  // 如果路由有 create 参数且需求已选择，尝试打开新建抽屉
  const createParam = route.query.create;
  const shouldCreate = createParam === "true" || (Array.isArray(createParam) && createParam.includes("true"));
  if (shouldCreate && searchForm.value.requirementId && !hasOpenedCreateDrawer.value) {
    hasOpenedCreateDrawer.value = true;
    // 使用 nextTick 确保在下一个 tick 打开
    nextTick(() => {
      currentTask.value = null;
      showTaskDrawer.value = true;
    });
  }
};

onMounted(async () => {
  // 先加载项目列表
  await loadProjects();
  // 从路由参数中恢复搜索条件（内部会处理 create 参数）
  await restoreSearchFromQuery();
  // 如果需求还未选择，watch 会在需求选择后自动处理
});
</script>

<style scoped lang="scss">
.tasks-page {

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

  .assignee-text {
    color: #409eff;
  }
}
</style>
