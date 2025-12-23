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
        <el-form-item label="选择项目">
          <el-select v-model="searchForm.projectId" placeholder="请选择项目" clearable style="width: 180px"
            @change="handleProjectChange">
            <el-option v-for="project in projects" :key="project.id" :label="project.name" :value="project.id" />
          </el-select>
        </el-form-item>
        <el-form-item label="层级名称">
          <el-input v-model="searchForm.taskName" placeholder="请输入层级名称（可选）" clearable style="width: 220px"
            @keyup.enter="handleSearchAllTasks" @clear="handleSearchAllTasks" />
        </el-form-item>
        <el-form-item>
          <el-button type="primary" @click="handleSearchAllTasks" :disabled="!searchForm.projectId">查询任务</el-button>
        </el-form-item>
      </el-form>
    </el-card>

    <!-- 任务列表 -->
    <el-card v-loading="loading">
      <div class="tasks-table-container">
        <div class="table-header-actions" v-if="Object.keys(tasks).length > 0">
          <el-button type="success" @click="handleBatchAssign" v-perms="['task:bulk_assignment']"
            :loading="batchAssignLoading" :disabled="selectedTasks.length === 0">
            <el-icon>
              <Share />
            </el-icon>
            分配选中任务 ({{ selectedTasks.length }})
          </el-button>
          <div style="flex: 1;"></div>
          <el-button type="primary" @click="handleCreate" v-perms="['task:add']">
            <el-icon>
              <Plus />
            </el-icon>
            新建任务
          </el-button>
        </div>
        <el-tabs v-model="activeTab" v-if="Object.keys(tasks).length > 0">
          <el-tab-pane v-for="(taskList, taskType) in tasks" :key="taskType" :label="`${taskType} (${taskList.length})`"
            :name="taskType">
            <el-table :data="filteredTasks" :style="{ width: '100%' }" height="600" row-key="rowKey"
              @selection-change="handleSelectionChange">
              <el-table-column type="selection" width="55" :selectable="isRowSelectable" />
              <el-table-column prop="任务名" label="任务名称" width="140">
                <template #default="{ row }">
                  {{ row.任务名 || row.task_name || row.title || "-" }}
                </template>
              </el-table-column>
              <el-table-column prop="requirement_name" label="关联层级" width="140" />
              <el-table-column prop="当前处理人" label="当前处理人/部门" width="220">
                <template #default="{ row }">
                  <div style="display: flex; align-items: center; gap: 6px; flex-wrap: wrap;">
                    <el-tag type="success" size="small">
                      <span class="assignee-text-dept" style="color: #67C23A;">{{ row.部门 || "-" }}</span>
                    </el-tag>
                    <el-tag type="primary" size="small">
                      <span class="assignee-text">{{ row.当前处理人 || row.assignee || "-" }}</span>
                    </el-tag>
                  </div>
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
              <el-table-column prop="预计工时" label="计划工时" width="100" />
              <el-table-column prop="已用工时" label="已用工时" width="100" />
              <el-table-column prop="create_time" label="创建时间" width="180" />
              <el-table-column label="操作" width="260" fixed="right">
                <template #default="{ row }">
                  <el-button type="primary" link size="small" @click="handleView(row)">查看</el-button>
                  <el-button type="primary" link size="small" @click="handleEdit(row)" v-perms="['task:update']"
                    v-if="(userStore.username === (row.当前处理人 || row.current_handler)) || isAdmin || isProjectManager">编辑</el-button>
                  <el-button type="primary" link size="small" @click="handleChangeAssignee(row)"
                    v-perms="['task:update_current_assignee']"
                    v-if="isPendingAssignStatus(row.状态 || row.status)">更改负责人</el-button>
                  <el-button type="danger" link size="small" @click="handleCloseTask(row)"
                    v-perms="['task:close']">关闭</el-button>
                  <!-- <el-button v-if="(row.当前处理人 || row.current_handler) === userStore.username" type="primary" link
                    size="small"
                    :disabled="!row.next_state || !Array.isArray(row.next_state) || row.next_state.length === 0"
                    v-perms="['task:update_state']" :loading="statusFlowButtonLoadingTaskId === (row._id || row.id)"
                    @click="openStatusFlowDialog(row)">
                    分配
                  </el-button> -->
                  <el-button type="success" link size="small" @click="openReportDialog(row)"
                    v-if="(row.当前处理人 || row.current_handler) === userStore.username && canRecordBug(row.状态 || row.status)"
                    v-perms="['task:report']">进度汇报</el-button>
                </template>
              </el-table-column>
            </el-table>
          </el-tab-pane>
        </el-tabs>
        <el-empty v-else description="暂无任务数据" :image-size="100" />
      </div>
    </el-card>

    <!-- 新建/编辑任务抽屉 -->
    <TaskDrawer v-model:visible="showTaskDrawer" :project-id="currentProjectId || searchForm.projectId"
      :requirement-id="undefined" :requirement-name="undefined" :task="currentTask" :projects="projectOptions"
      @refresh="handleTaskRefresh" />

    <TaskStatusFlowDialog v-model:visible="statusFlowDialogVisible" :task="statusFlowTask"
      @success="handleStatusFlowSuccess" @flow-start="handleStatusFlowStart" @flow-end="handleStatusFlowEnd" />

    <el-dialog v-model="reportDialogVisible" title="进度汇报" width="480px" append-to-body :close-on-click-modal="false">
      <el-form ref="reportFormRef" :model="reportForm" :rules="reportRules" label-width="90px">
        <el-form-item label="任务名称">
          <span>{{ reportForm.task_name || "-" }}</span>
        </el-form-item>
        <el-form-item label="接收人" prop="recipient">
          <span>{{ reportForm.recipient || "-" }}</span>
        </el-form-item>
        <el-form-item label="当前进度" prop="progress">
          <div style="display: flex; align-items: center; width: 100%;">
            <el-input-number v-model="reportForm.progress" :min="0" :max="100" controls-position="right"
              style="flex: 1;" />
            <span style="margin-left: 8px; color: #606266;">%</span>
          </div>
        </el-form-item>
        <!-- <el-form-item label="今日用时" prop="use_time">
          <div style="display: flex; align-items: center; width: 100%;">
            <el-input-number v-model="reportForm.use_time" :min="0" controls-position="right" style="flex: 1;"
              placeholder="请输入当前用时" />
            <span style="margin-left: 8px; color: #606266;">时</span>
          </div>
        </el-form-item> -->
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

    <!-- 更改负责人对话框 -->
    <el-dialog v-model="changeAssigneeDialogVisible" title="更改负责人" width="500px" append-to-body
      :close-on-click-modal="false">
      <el-form ref="changeAssigneeFormRef" :model="changeAssigneeForm" :rules="changeAssigneeRules" label-width="100px">
        <el-form-item label="任务名称">
          <span>{{ changeAssigneeForm.task_name || "-" }}</span>
        </el-form-item>
        <el-form-item label="当前负责人">
          <span>{{ changeAssigneeForm.current_assignee || "-" }}</span>
        </el-form-item>
        <el-form-item label="新负责人" prop="new_assignee">
          <el-tree-select v-model="changeAssigneeForm.new_assignee" placeholder="请选择新负责人"
            :loading="changeAssigneeUsersLoading" filterable check-strictly default-expand-all
            :data="changeAssigneeUsersTree" :props="treeSelectProps" node-key="value" :render-after-expand="false"
            style="width: 100%" clearable />
        </el-form-item>
      </el-form>
      <template #footer>
        <span class="dialog-footer">
          <el-button @click="changeAssigneeDialogVisible = false">取消</el-button>
          <el-button type="primary" :loading="changeAssigneeSubmitting"
            @click="handleChangeAssigneeSubmit">确定</el-button>
        </span>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, watch, reactive, nextTick, toRaw } from "vue";
import { useRouter, useRoute } from "vue-router";
import { ElMessage, ElMessageBox } from "element-plus";
import type { FormInstance, FormRules } from "element-plus";
import { Plus, Search, Share } from "@element-plus/icons-vue";
import {
  selectProjects,
  selectProjectTasks,
  reportTaskProgress,
  updateTaskState,
  bulkAssignment,
  updateCurrentAssignee,
  type ProjectListItem
} from "@/api/project";
import { selectDepartmentUsers, getDepartmentNameList, type DepartmentUserItem, type DepartmentListItem } from "@/api/system";
import type { Project } from "@/types";
import { TaskStatus } from "@/types";
import TaskStatusFlowDialog from "@/components/TaskStatusFlowDialog.vue";
import TaskDrawer from "@/components/TaskDrawer.vue";
import { useUserStoreHook } from "@/store/modules/user";
import { storageLocal } from "@pureadmin/utils";

const router = useRouter();
const route = useRoute();
const userStore = useUserStoreHook();
const userRoles = computed(() => userStore.roles || []);
const isAdmin = computed(() => userRoles.value.includes("Admin"));
const isProjectManager = computed(() => userRoles.value.includes("ProjectManager"));
const canCallDepartmentSelect = computed(() => isAdmin.value || isProjectManager.value);
// 搜索表单
const searchForm = ref({
  projectId: "",
  taskName: ""
});

const loading = ref(false);

const tasks = ref<Record<string, any[]>>({});
const totalTasks = ref(0);
const activeTab = ref<string>("");
const projects = ref<Project[]>([]);
const projectsLoading = ref(false);
const showTaskDrawer = ref(false);
const currentTask = ref<any>(null);
const currentProjectId = ref<string>("");
const hasOpenedCreateDrawer = ref(false); // 标志，用于避免重复打开新建抽屉
const batchAssignLoading = ref(false);
const selectedTasks = ref<any[]>([]); // 选中的任务列表

// 缓存键名
const CACHE_KEY = "tasks-list-params";

// 保存参数到缓存
// const saveParamsToCache = () => {
//   const params = {
//     projectId: searchForm.value.projectId,
//     taskName: searchForm.value.taskName
//   };
//   storageLocal().setItem(CACHE_KEY, params);
// };



// 任务列表（根据选中的 tab 返回对应的任务列表）
const filteredTasks = computed(() => {
  if (!activeTab.value || !tasks.value[activeTab.value]) {
    return [];
  }
  return tasks.value[activeTab.value].map((task: any, index: number) => {
    const taskId = task._id || task.id;
    const rowKey = taskId ? String(taskId) : `task_${index}_${Date.now()}`;
    return {
      ...task,
      原始状态: task.状态 || task.status,
      rowKey: rowKey
    };
  });
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
  TaskStatus.TEST_FAILED,
  TaskStatus.REVIEW_FAILED,
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

// 判断是否是待分配状态（待分配给部门负责人或待指派给成员）
const isPendingAssignStatus = (status: string): boolean => {
  const normalized = normalizeStatus(status);
  return normalized === TaskStatus.PENDING_ASSIGN_TO_MEMBER
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

// 判断是否可以进度汇报（测试或审阅状态或进行中）
const canRecordBug = (status: string): boolean => {
  if (!status) return false;
  // 如果无法标准化，检查中文状态
  const testReviewStatuses = [
    "测试中", "任务进行中", "测试未通过", "审阅未通过", '任务未开始'

  ];
  return testReviewStatuses.includes(status);
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

// 处理项目变化
const handleProjectChange = () => {
  currentProjectId.value = searchForm.value.projectId;
  // 如果选择了项目，自动调用列表接口
  if (searchForm.value.projectId) {
    handleSearchAllTasks();
  } else {
    // 如果没有选择项目，清空任务列表
    tasks.value = {};
    totalTasks.value = 0;
    activeTab.value = "";
  }
};

// 查询所有任务
const handleSearchAllTasks = async () => {
  if (!searchForm.value.projectId) {
    ElMessage.warning("请先选择项目");
    return;
  }
  loading.value = true;
  try {
    const response = await selectProjectTasks({
      project_id: searchForm.value.projectId,
      requirement_name: searchForm.value.taskName?.trim() || ""
    });
    if (response.code === 200 && response.result) {
      // 处理新的数据格式：对象，键是任务类型，值是任务数组
      if (typeof response.result === 'object' && !Array.isArray(response.result)) {
        tasks.value = response.result;
        // 设置默认选中的 tab（第一个有数据的 tab）
        const taskTypes = Object.keys(tasks.value);
        if (taskTypes.length > 0 && !activeTab.value) {
          activeTab.value = taskTypes[0];
        }
        // 计算总任务数
        totalTasks.value = Object.values(tasks.value).reduce((sum: number, taskList: any) => {
          return sum + (Array.isArray(taskList) ? taskList.length : 0);
        }, 0);
      } else {
        // 兼容旧的数据格式（数组）
        const taskList = Array.isArray(response.result) ? response.result : [];
        tasks.value = {
          "全部任务": taskList
        };
        activeTab.value = "全部任务";
        totalTasks.value = taskList.length;
      }
    } else {
      ElMessage.error(response.message || "查询任务列表失败");
      tasks.value = {};
      totalTasks.value = 0;
      activeTab.value = "";
      selectedTasks.value = [];
    }
  } catch (error: any) {
    console.error("查询任务列表失败:", error);
    ElMessage.error(
      error?.response?.data?.message || error?.message || "查询任务列表失败"
    );
    tasks.value = {};
    totalTasks.value = 0;
    activeTab.value = "";
    selectedTasks.value = [];
  } finally {
    loading.value = false;
  }
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
  handleSearchAllTasks();
};

// 新建任务
const handleCreate = () => {
  currentTask.value = null;
  showTaskDrawer.value = true;
};

// 判断行是否可选择（只有 creator 才能选择）
const isRowSelectable = (row: any) => {
  const creator = row.creator || row.创建人 || "";
  return userStore.username === creator;
};

// 处理表格选择变化
const handleSelectionChange = (selection: any[]) => {
  selectedTasks.value = selection;
};

// 批量分配选中任务
const handleBatchAssign = async () => {
  if (!searchForm.value.projectId) {
    ElMessage.warning("请先选择项目");
    return;
  }

  // 使用选中的任务
  const currentTasks = selectedTasks.value;

  if (currentTasks.length === 0) {
    ElMessage.warning("请先选择要分配的任务");
    return;
  }

  try {
    await ElMessageBox.confirm(
      `确定要批量分配任务吗？`,
      "批量分配确认",
      {
        confirmButtonText: "确定",
        cancelButtonText: "取消",
        type: "warning"
      }
    );

    batchAssignLoading.value = true;

    // 直接使用表格数据构建 task_json
    // 使用 Object.create(null) 创建纯对象，避免响应式处理
    const taskJson: Record<string, {
      task_name: string;
      state: string;
      current_assignee: string;
      default_person: string;
    }> = Object.create(null);

    currentTasks.forEach((task: any) => {
      const taskId = task._id || task.id;
      if (taskId) {
        const taskIdStr = String(taskId);
        // 确保 taskId 不是 "0"
        if (taskIdStr && taskIdStr !== "0") {
          taskJson[taskIdStr] = {
            task_name: String(task.任务名 || task.task_name || task.title || ""),
            state: String(task.状态 || task.status || ""),
            current_assignee: String(task.当前处理人 || task.current_handler || task.assignee || ""),
            default_person: String(task.default_person || task.默认部门负责人 || "")
          };
        }
      }
    });

    if (Object.keys(taskJson).length === 0) {
      ElMessage.warning("没有有效的任务可以分配");
      batchAssignLoading.value = false;
      return;
    }

    // 构建最终的对象，确保所有键都是有效的字符串（不是纯数字）
    const taskJsonFinal: Record<string, {
      task_name: string;
      state: string;
      current_assignee: string;
      default_person: string;
    }> = {};

    Object.keys(taskJson).forEach(key => {
      // 跳过纯数字键（如 "0", "1" 等），这些会导致 Vue 渲染错误
      if (!/^\d+$/.test(key)) {
        taskJsonFinal[key] = taskJson[key];
      }
    });

    if (Object.keys(taskJsonFinal).length === 0) {
      ElMessage.warning("没有有效的任务可以分配");
      batchAssignLoading.value = false;
      return;
    }

    // 使用 JSON 序列化/反序列化创建纯对象，确保不会被响应式系统处理
    const taskJsonPlain = JSON.parse(JSON.stringify(taskJsonFinal));

    // 最终检查：确保没有任何数字键
    const finalKeys = Object.keys(taskJsonPlain);
    const hasNumericKeys = finalKeys.some(k => /^\d+$/.test(k));
    if (hasNumericKeys) {
      console.error("警告：taskJsonPlain 仍然包含数字键:", finalKeys.filter(k => /^\d+$/.test(k)));
      // 移除所有数字键
      finalKeys.forEach(key => {
        if (/^\d+$/.test(key)) {
          delete taskJsonPlain[key];
        }
      });
    }

    if (Object.keys(taskJsonPlain).length === 0) {
      ElMessage.warning("没有有效的任务可以分配");
      batchAssignLoading.value = false;
      return;
    }

    // 使用 try-catch 包装 API 调用，确保错误被正确捕获
    let response;
    try {
      response = await bulkAssignment({
        task_json: taskJsonPlain
      });
    } catch (apiError: any) {
      // 如果 API 调用失败，直接抛出错误，让外层 catch 处理
      throw apiError;
    }

    if (response.code === 200) {
      const successMsg = typeof response.message === 'string' ? response.message : `成功分配 ${currentTasks.length} 个任务`;
      ElMessage.success(successMsg);
      // 清空选中状态
      selectedTasks.value = [];
      // 刷新任务列表
      await handleSearchAllTasks();
    } else {
      const errorMsg = typeof response.message === 'string' ? response.message : "批量分配失败";
      ElMessage.error(errorMsg);
    }
  } catch (error: any) {
    if (error !== "cancel") {
      // 确保错误信息是字符串，避免对象被用于渲染
      let errorMessage = "批量分配失败";
      if (error?.response?.data?.message) {
        errorMessage = typeof error.response.data.message === 'string'
          ? error.response.data.message
          : String(error.response.data.message);
      } else if (error?.message) {
        errorMessage = typeof error.message === 'string'
          ? error.message
          : String(error.message);
      }
      console.error("批量分配失败:", errorMessage, error);
      ElMessage.error(errorMessage);
    }
  } finally {
    batchAssignLoading.value = false;
  }
};

// 查看任务
const handleView = (task: any) => {
  // 使用 sessionStorage 临时存储任务数据
  const taskId = task.id || task._id;
  if (!taskId) {
    ElMessage.error("任务ID不存在，无法查看详情");
    console.error("任务数据:", task);
    return;
  }
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
  }).catch((error) => {
    console.error("路由跳转失败:", error);
    ElMessage.error("跳转到任务详情页失败");
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
    default_person: task.default_person || task.默认部门负责人 || "",
    attachment: task.attachment || [],
    // 用于权限判断的当前处理人
    current_handler: task.current_handler || task.当前处理人 || task.assignee || ""
  };

  // 如果任务有项目ID，设置当前项目ID
  if (currentTask.value.project_id) {
    currentProjectId.value = currentTask.value.project_id;
    // 如果项目ID不在搜索表单中，更新搜索表单的项目ID
    if (currentTask.value.project_id !== searchForm.value.projectId) {
      searchForm.value.projectId = currentTask.value.project_id;
    }
  }

  showTaskDrawer.value = true;
};

// 更改负责人
const handleChangeAssignee = (task: any) => {
  const taskId = task._id || task.id;
  if (!taskId) {
    ElMessage.error("任务ID不存在");
    return;
  }
  changeAssigneeForm.task_id = taskId;
  changeAssigneeForm.task_name = task.任务名 || task.task_name || task.title || "";
  changeAssigneeForm.current_assignee = task.当前处理人 || task.current_handler || task.assignee || "";
  changeAssigneeForm.new_assignee = "";
  changeAssigneeDialogVisible.value = true;
  if (!changeAssigneeUsersRawData.value.length) {
    loadChangeAssigneeUsers();
  }
  nextTick(() => {
    changeAssigneeFormRef.value?.clearValidate();
  });
};

// 加载用户列表（用于更改负责人）
const loadChangeAssigneeUsers = async () => {
  if (!canCallDepartmentSelect.value) {
    changeAssigneeUsersRawData.value = [];
    changeAssigneeUsersTree.value = [];
    return;
  }
  changeAssigneeUsersLoading.value = true;
  try {
    const response = await getDepartmentNameList();
    if (response.code === 200 && Array.isArray(response.result)) {
      changeAssigneeUsersRawData.value = response.result;
      changeAssigneeUsersTree.value = buildChangeAssigneeUsersTree(response.result);
    } else {
      changeAssigneeUsersRawData.value = [];
      changeAssigneeUsersTree.value = [];
      ElMessage.error("加载人员列表失败");
    }
  } catch (error: any) {
    console.error("加载人员列表失败:", error);
    ElMessage.error(
      error?.response?.data?.message || error?.message || "加载人员列表失败"
    );
    changeAssigneeUsersRawData.value = [];
    changeAssigneeUsersTree.value = [];
  } finally {
    changeAssigneeUsersLoading.value = false;
  }
};

// 构建用户树数据（用于更改负责人）
const buildChangeAssigneeUsersTree = (data: DepartmentListItem[]): any[] => {
  if (!Array.isArray(data)) return [];
  return data.map((item, index) => {
    const departmentName = String(item.部门名 || "未分配部门");
    const managers = item.负责人 || [];
    const children: any[] = managers
      .filter(manager => manager && String(manager).trim())
      .map(manager => ({
        label: String(manager),
        value: String(manager)
      }));
    // 使用索引确保 value 的唯一性和有效性
    return {
      label: departmentName,
      value: `dept_${index}_${departmentName.replace(/[^a-zA-Z0-9\u4e00-\u9fa5]/g, '_')}`,
      disabled: true,
      children
    };
  });
};

// 提交更改负责人
const handleChangeAssigneeSubmit = () => {
  changeAssigneeFormRef.value?.validate(async valid => {
    if (!valid) return;
    if (!changeAssigneeForm.task_id || !changeAssigneeForm.new_assignee) {
      ElMessage.error("信息不完整");
      return;
    }
    changeAssigneeSubmitting.value = true;
    try {
      const response = await updateCurrentAssignee({
        task_id: changeAssigneeForm.task_id,
        current_assignee: changeAssigneeForm.new_assignee.trim()
      });
      if (response.code === 200) {
        ElMessage.success("更改负责人成功");
        changeAssigneeDialogVisible.value = false;
        if (searchForm.value.projectId) {
          await handleSearchAllTasks();
        }
      } else {
        ElMessage.error(response.message || "更改负责人失败");
      }
    } catch (error: any) {
      console.error("更改负责人失败:", error);
      ElMessage.error(
        error?.response?.data?.message || error?.message || "更改负责人失败"
      );
    } finally {
      changeAssigneeSubmitting.value = false;
    }
  });
};

const statusFlowDialogVisible = ref(false);
const statusFlowTask = ref<any>(null);
const statusFlowButtonLoadingTaskId = ref<string>("");
const reportDialogVisible = ref(false);
const reportSubmitting = ref(false);
const reportFormRef = ref<FormInstance>();
const departmentUsers = ref<DepartmentUserItem[]>([]);
const departmentUsersLoading = ref(false);
const changeAssigneeDialogVisible = ref(false);
const changeAssigneeSubmitting = ref(false);
const changeAssigneeFormRef = ref<FormInstance>();
const changeAssigneeUsersLoading = ref(false);
const changeAssigneeUsersTree = ref<any[]>([]);
const changeAssigneeUsersRawData = ref<DepartmentListItem[]>([]);
const changeAssigneeForm = reactive({
  task_id: "",
  task_name: "",
  current_assignee: "",
  new_assignee: ""
});
const changeAssigneeRules: FormRules = {
  new_assignee: [{ required: true, message: "请选择新负责人", trigger: "blur" }]
};
const treeSelectProps = {
  label: "label",
  children: "children",
  disabled: "disabled"
} as const;
const reportForm = reactive({
  recipient: "",
  cc_person: "",
  task_id: "",
  task_name: "",
  progress: 0,
  use_time: 0,
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
  use_time: [
    { required: true, message: "请输入当前用时", trigger: "blur" },
    {
      type: "number",
      min: 0,
      message: "当前用时需大于 0",
      trigger: "change"
    }
  ],
  message: [{ required: true, message: "请输入汇报内容", trigger: "blur" }]
};

const openStatusFlowDialog = (task: any) => {
  // 检查 next_state 是否存在且有值
  if (!task.next_state || !Array.isArray(task.next_state) || task.next_state.length === 0) {
    ElMessage.warning("当前状态无法继续分配");
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
  if (searchForm.value.projectId) {
    handleSearchAllTasks();
  }
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
  reportForm.use_time = Number(task.已用工时 || task.actualHours || 0);
  reportForm.recipient = task.creator || "";
  reportForm.cc_person = task.指派人 || task.assignee || "";
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
        cc_person: reportForm.cc_person,
        task_id: reportForm.task_id,
        task_name: reportForm.task_name,
        progress: reportForm.progress,
        message: reportForm.message,
        use_time: 1
      });
      if (response.code === 200) {
        ElMessage.success("汇报成功");
        reportDialogVisible.value = false;
        if (searchForm.value.projectId) {
          handleSearchAllTasks();
        }
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
      if (searchForm.value.projectId) {
        handleSearchAllTasks();
      }
    } else {
      ElMessage.error(response.message || "关闭任务失败");
    }
  } catch {
    // 用户取消
  }
};

// 监听项目ID变化
watch(
  () => searchForm.value.projectId,
  () => {
  }
);

// 监听 tab 切换，清空选中状态
watch(
  () => activeTab.value,
  () => {
    selectedTasks.value = [];
  }
);

// 监听 create 参数，自动打开新建任务抽屉
watch(
  () => route.query.create,
  (createParam) => {
    const shouldCreate = createParam === "true" || (Array.isArray(createParam) && createParam.includes("true"));
    // 如果 create 参数存在且项目已选择，且还没有打开过，则打开抽屉
    if (shouldCreate && searchForm.value.projectId && !hasOpenedCreateDrawer.value) {
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
  // 优先使用路由参数，如果没有则从缓存恢复
  const routeProjectId = route.query.project_id as string | undefined;
  const routeTaskName = route.query.task_name as string | undefined;

  if (routeProjectId || routeTaskName) {
    // 如果有路由参数，使用路由参数
    if (routeProjectId) {
      searchForm.value.projectId = routeProjectId;
    }
    if (routeTaskName) {
      searchForm.value.taskName = routeTaskName;
    }
    // 如果项目ID存在，自动查询任务
    if (searchForm.value.projectId) {
      await handleSearchAllTasks();
    }
  } else {
  }

  // 如果路由有 create 参数且项目已选择，尝试打开新建抽屉
  const createParam = route.query.create;
  const shouldCreate = createParam === "true" || (Array.isArray(createParam) && createParam.includes("true"));
  if (shouldCreate && searchForm.value.projectId && !hasOpenedCreateDrawer.value) {
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
  .tasks-table-container {
    min-height: 550px;
    display: flex;
    flex-direction: column;
  }

  .table-header-actions {
    display: flex;
    gap: 12px;
    margin-bottom: 16px;
    align-items: center;
    justify-content: space-between;
  }

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

  .card-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
  }

  .assignee-text {
    color: #409eff;
  }

  .assignee-text-dept {
    color: #67C23A;
  }

  // 隐藏不可选择行的 checkbox
  :deep(.el-table__body-wrapper) {
    tr {
      .el-checkbox.is-disabled {
        display: none;
      }
    }
  }
}
</style>
