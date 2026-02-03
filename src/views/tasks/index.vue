<template>
  <div class="tasks-page" ref="pageRef">
    <!-- 搜索表单 -->
    <el-card class="search-card mb-5">

      <el-form :model="searchForm" :inline="true" class="search-form">
        <el-form-item label="选择项目">
          <div class="project-tags">
            <el-tag v-for="project in projects" :key="project.id"
              :type="searchForm.projectId === project.id ? 'primary' : 'info'"
              :effect="searchForm.projectId === project.id ? 'dark' : 'plain'" class="project-tag"
              @click="handleProjectTagClick(project.id)">
              <span class="project-tag-text">{{ project.name }}</span>
            </el-tag>
          </div>
        </el-form-item>
      </el-form>
    </el-card>

    <!-- 任务列表 -->
    <el-card v-loading="loading" ref="tasksCardRef">
      <div class="tasks-table-container" ref="containerRef">
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
        <!-- 多层 tab 结构（递归组件） -->
        <NestedTabs v-if="Object.keys(tasks).length > 0" :data="tasks" :level="0" :active-tabs="activeTabs"
          :table-height="tableHeight" :loading="tabLoading" :processed-cache="processedTasksCache"
          @update:active-tabs="activeTabs = $event" @selection-change="handleSelectionChange">
          <el-table-column type="selection" width="55" :selectable="isRowSelectable" />
          <el-table-column prop="任务名" label="任务名称" width="140">
            <template #default="{ row }">
              {{ row.任务名 || row.task_name || row.title || "-" }}
            </template>
          </el-table-column>
          <!-- <el-table-column prop="requirement_name" label="关联层级" width="140" /> -->
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
          <el-table-column prop="状态" label="状态">
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
          <el-table-column prop="进度" label="进度">
            <template #default="{ row }">
              <el-progress :percentage="row.进度 || 0" :status="row.进度 === 100 ? 'success' : undefined" />
            </template>
          </el-table-column>
          <el-table-column prop="task_deadline" label="任务截止日期" width="150" />
          <el-table-column prop="create_time" label="创建时间" width="180" />
          <el-table-column label="操作" width="80" fixed="right">
            <template #default="{ row }">
              <el-dropdown trigger="click" @command="(command) => handleDropdownCommand(command, row)">
                <el-button type="primary" link size="small" circle class="more-icon-btn">
                  <el-icon :size="18">
                    <MoreFilled />
                  </el-icon>
                </el-button>
                <template #dropdown>
                  <el-dropdown-menu>
                    <el-dropdown-item command="view">查看</el-dropdown-item>
                    <el-dropdown-item command="edit"
                      v-if="((userStore.username === (row.当前处理人 || row.current_handler)) || isAdmin || isProjectManager) && row.状态 !== '已完成' && hasPerms(['task:update'])">
                      编辑
                    </el-dropdown-item>
                    <el-dropdown-item command="changeAssignee"
                      v-if="isPendingAssignStatus(row.状态 || row.status) && hasPerms(['task:update_current_assignee'])">
                      更改负责人
                    </el-dropdown-item>
                    <el-dropdown-item command="close" v-if="hasPerms(['task:close'])" divided>
                      <span style="color: var(--el-color-danger)">关闭</span>
                    </el-dropdown-item>
                    <el-dropdown-item command="complete" v-if="row.状态 !== '已完成' && hasPerms(['task:finish'])" divided>
                      <span style="color: var(--el-color-success)">完成</span>
                    </el-dropdown-item>
                    <el-dropdown-item command="report"
                      v-if="(row.当前处理人 || row.current_handler) === userStore.username && canRecordBug(row.状态 || row.status) && hasPerms(['task:report'])">
                      <span style="color: var(--el-color-success)">进度汇报</span>
                    </el-dropdown-item>
                  </el-dropdown-menu>
                </template>
              </el-dropdown>
            </template>
          </el-table-column>
        </NestedTabs>
        <el-empty v-else description="暂无任务数据" :image-size="100" />
      </div>
    </el-card>

    <!-- 新建/编辑任务抽屉 -->
    <TaskDrawer v-model:visible="showTaskDrawer" :project-id="currentProjectId || searchForm.projectId"
      :requirement-id="currentRequirementId" :requirement-name="currentRequirementName" :task="currentTask"
      :projects="projectOptions" @refresh="handleTaskRefresh" />

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

    <!-- 批量分配任务对话框 -->
    <el-dialog v-model="batchAssignDialogVisible" title="批量分配任务" width="600px" append-to-body
      :close-on-click-modal="false">
      <el-form ref="batchAssignFormRef" :model="batchAssignForm" :rules="batchAssignRules" label-width="140px">
        <el-form-item label="任务指派时限" prop="time_limit">
          <el-input-number v-model="batchAssignForm.time_limit" :min="0" :precision="3" placeholder="请输入任务指派时限"
            style="width: 90%" />
          <span style="margin-left: 8px; color: #606266;">时</span>
        </el-form-item>
        <el-form-item label="任务截止期限" prop="task_assign_limit">
          <el-date-picker v-model="batchAssignForm.task_assign_limit" type="date" placeholder="请选择任务截止期限"
            format="YYYY-MM-DD" value-format="YYYY-MM-DD" style="width: 100%" :disabled-date="disabledPastDate" />
        </el-form-item>
        <el-form-item label="指派超时提醒人" prop="notification_recipients">
          <el-tree-select v-model="batchAssignForm.notification_recipients" placeholder="请选择指派超时提醒人"
            :loading="batchAssignDepartmentLeadersLoading" filterable check-strictly default-expand-all
            :data="batchAssignDepartmentLeadersTree" :props="treeSelectProps" node-key="value"
            :render-after-expand="false" style="width: 100%" clearable multiple />
        </el-form-item>
      </el-form>
      <template #footer>
        <span class="dialog-footer">
          <el-button @click="batchAssignDialogVisible = false">取消</el-button>
          <el-button type="primary" :loading="batchAssignLoading" @click="handleBatchAssignSubmit">确定</el-button>
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
import { ref, computed, onMounted, onUnmounted, watch, reactive, nextTick, toRaw } from "vue";
import { useRouter, useRoute } from "vue-router";
import { ElMessage, ElMessageBox } from "element-plus";
import type { FormInstance, FormRules } from "element-plus";
import { Plus, Search, Share, MoreFilled } from "@element-plus/icons-vue";
import { hasPerms } from "@/utils/auth";
import {
  selectProjects,
  selectProjectTasks,
  selectAllRequirementsAndTasksTwo,
  reportTaskProgress,
  updateTaskState,
  bulkAssignment,
  updateCurrentAssignee,
  type ProjectListItem
} from "@/api/project";
import { selectDepartmentUsers, getDepartmentNameList, selectAllUsers, selectNotificationPerson, sendNotification, type DepartmentUserItem, type DepartmentListItem, type DepartmentUserMap } from "@/api/system";
import type { Project } from "@/types";
import { TaskStatus } from "@/types";
import TaskStatusFlowDialog from "@/components/TaskStatusFlowDialog.vue";
import TaskDrawer from "@/components/TaskDrawer.vue";
import NestedTabs from "@/components/NestedTabs.vue";
import { useUserStoreHook } from "@/store/modules/user";

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

// 保持嵌套结构：可能是2层或3层，动态检测
const tasks = ref<Record<string, any>>({});
const totalTasks = ref(0);
// 动态管理多层 tab 的选中状态
const activeTabs = ref<string[]>([]); // 数组，每个元素代表一层选中的 tab
const activeTab = ref<string>(""); // 兼容旧代码，格式：任务类型/需求名称/...
const projects = ref<Project[]>([]);
const projectsLoading = ref(false);
const showTaskDrawer = ref(false);
const currentTask = ref<any>(null);
const currentProjectId = ref<string>("");
const hasOpenedCreateDrawer = ref(false); // 标志，用于避免重复打开新建抽屉
const currentRequirementId = ref<string | undefined>(undefined);
const currentRequirementName = ref<string | undefined>(undefined);
const batchAssignLoading = ref(false);
const selectedTasks = ref<any[]>([]); // 选中的任务列表
const tabLoading = ref(false); // tab 切换时的加载状态
const currentTabData = ref<any[]>([]); // 当前 tab 的数据（用于延迟加载）

// 表格高度相关
const pageRef = ref<HTMLElement>();
const tasksCardRef = ref<HTMLElement>();
const containerRef = ref<HTMLElement>();
const tableHeight = ref<number>(600);

// 缓存键名
const CACHE_KEY = "tasks-list-params";

// 刷新前保存的 tab 路径，刷新后恢复
const savedActiveTabsBeforeRefresh = ref<string[] | null>(null);

// 保存参数到缓存
// const saveParamsToCache = () => {
//   const params = {
//     projectId: searchForm.value.projectId,
//     taskName: searchForm.value.taskName
//   };
//   storageLocal().setItem(CACHE_KEY, params);
// };



// 缓存处理后的任务数据，避免重复计算
const processedTasksCache = ref<Record<string, any[]>>({});

// 处理单个任务数据（提取为函数，便于复用）
const processTask = (task: any, index: number) => {
  const taskId = task._id || task.id;
  const rowKey = taskId ? String(taskId) : `task_${index}_${Date.now()}`;
  return {
    ...task,
    原始状态: task.状态 || task.status,
    rowKey: rowKey
  };
};

// 异步处理任务数据（分批处理，避免阻塞 UI）
const processTasksAsync = async (taskList: any[]): Promise<any[]> => {
  return new Promise((resolve) => {
    // 如果数据量小，直接处理
    if (taskList.length <= 100) {
      const processed = taskList.map((task: any, index: number) => processTask(task, index));
      resolve(processed);
      return;
    }

    // 数据量大时，分批处理
    const batchSize = 50;
    const processed: any[] = [];
    let index = 0;

    const processBatch = () => {
      const end = Math.min(index + batchSize, taskList.length);
      for (let i = index; i < end; i++) {
        processed.push(processTask(taskList[i], i));
      }
      index = end;

      if (index < taskList.length) {
        // 使用 requestIdleCallback 或 setTimeout 延迟下一批处理
        if (typeof requestIdleCallback !== 'undefined') {
          requestIdleCallback(processBatch, { timeout: 100 });
        } else {
          setTimeout(processBatch, 0);
        }
      } else {
        resolve(processed);
      }
    };

    processBatch();
  });
};

// 注意：getProcessedTasks 已废弃，现在使用 loadTabDataForNested
// 保留此注释以避免类型错误

// 任务列表（使用 ref 存储，避免 computed 阻塞）
const filteredTasks = ref<any[]>([]);

// 判断节点是否有 task_list（是否为最后一层）
const hasTaskList = (node: any): boolean => {
  return node && typeof node === 'object' && Array.isArray(node.task_list);
};

// 判断节点是否是中间层（有子节点但不是 task_list）
const isIntermediateNode = (node: any): boolean => {
  if (!node || typeof node !== 'object' || Array.isArray(node.task_list)) {
    return false;
  }
  // 检查是否有子节点（排除 task_list 和其他非节点属性）
  const excludeKeys = ['_id', '需求名', 'describe', '状态', '优先级', 'project_id', 'project_name', 'creator', 'attachment', 'create_time', '进度'];
  const keys = Object.keys(node).filter(key => !excludeKeys.includes(key));
  return keys.length > 0;
};

// 计算某个节点的总任务数（递归）
const getTotalTaskCount = (node: any): number => {
  if (!node || typeof node !== 'object') return 0;

  // 如果直接有 task_list，返回数量
  if (Array.isArray(node.task_list)) {
    return node.task_list.length;
  }

  // 否则递归计算所有子节点的任务数
  const values = Object.values(node) as any[];
  return values.reduce((sum: number, child: any) => {
    if (child && typeof child === 'object') {
      if (Array.isArray(child.task_list)) {
        return sum + child.task_list.length;
      } else {
        const childCount: number = getTotalTaskCount(child);
        return sum + childCount;
      }
    }
    return sum;
  }, 0);
};

// 根据路径获取最终的任务列表
const getTaskListByPath = (path: string[]): any[] => {
  let current: any = tasks.value;
  for (const key of path) {
    if (!current || typeof current !== 'object' || !current[key]) {
      return [];
    }
    current = current[key];
  }

  // 如果当前节点有 task_list，返回它
  if (Array.isArray(current?.task_list)) {
    return current.task_list;
  }

  return [];
};

// 处理 tab 切换（动态层级）
const handleTabChange = async (level: number, value: string) => {
  // 更新对应层级的选中状态
  activeTabs.value[level] = value;
  // 清空后续层级
  activeTabs.value = activeTabs.value.slice(0, level + 1);

  // 构建路径
  const path = activeTabs.value.filter(Boolean);
  activeTab.value = path.join('/');

  // 获取任务列表
  const taskList = getTaskListByPath(path);

  if (taskList.length > 0) {
    // 有任务列表，加载数据
    await loadTaskListData(path, taskList);
  } else {
    // 没有任务列表，清空表格
    filteredTasks.value = [];
  }
};

// 加载任务列表数据
const loadTaskListData = async (path: string[], taskList: any[]) => {
  if (!Array.isArray(taskList) || taskList.length === 0) {
    filteredTasks.value = [];
    return;
  }

  // 构建缓存 key
  const cacheKey = path.join('/');
  const cached = processedTasksCache.value[cacheKey];

  // 检查缓存
  if (cached && cached.length === taskList.length && taskList.length > 0) {
    const firstTask = taskList[0];
    const firstCached = cached[0];
    if (firstTask && firstCached &&
      (firstTask._id || firstTask.id) === (firstCached._id || firstCached.id)) {
      filteredTasks.value = cached;
      return;
    }
  }

  // 没有缓存，异步加载数据
  tabLoading.value = true;

  // 使用 nextTick 确保 tab 先切换，UI 先响应
  await nextTick();

  try {
    // 异步处理数据
    const processed = await processTasksAsync(taskList);
    processedTasksCache.value[cacheKey] = processed;
    filteredTasks.value = processed;
  } catch (error) {
    console.error("加载任务数据失败:", error);
    filteredTasks.value = [];
  } finally {
    // 延迟隐藏 loading，确保用户能看到加载状态
    await nextTick();
    tabLoading.value = false;
  }
};

// 注意：loadTabData 已废弃，现在使用 loadTabDataForNested

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
    "第1轮测试", "第2轮测试", "第3轮测试", "第4轮测试", "第5轮测试", "第6轮测试", "第7轮测试", "第8轮测试", "任务进行中",
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

// 处理项目标签点击
const handleProjectTagClick = (projectId: string) => {
  // 如果点击的是已选中的项目，则取消选择
  if (searchForm.value.projectId === projectId) {
    searchForm.value.projectId = "";
    currentProjectId.value = "";
    tasks.value = {};
    totalTasks.value = 0;
    activeTabs.value = [];
    activeTab.value = "";
  } else {
    // 选择新项目并查询
    searchForm.value.projectId = projectId;
    handleProjectChange();
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
    const response = await selectAllRequirementsAndTasksTwo({
      project_id: searchForm.value.projectId
    });
    if (response.code === 200 && response.result) {
      // 保持嵌套数据结构，不扁平化
      let totalCount = 0;

      if (typeof response.result === 'object' && !Array.isArray(response.result)) {
        // 直接使用原始嵌套结构
        tasks.value = response.result;

        // 递归计算总任务数
        const countTasks = (node: any): number => {
          if (!node || typeof node !== 'object') return 0;
          if (Array.isArray(node.task_list)) {
            return node.task_list.length;
          }
          const values = Object.values(node) as any[];
          return values.reduce((sum: number, child: any) => {
            const childCount: number = countTasks(child);
            return sum + childCount;
          }, 0);
        };

        const resultValues = Object.values(response.result) as any[];
        totalCount = resultValues.reduce((sum: number, group: any) => {
          const groupCount: number = countTasks(group);
          return sum + groupCount;
        }, 0);
      } else {
        tasks.value = {};
      }

      // 清除缓存，因为数据已更新
      processedTasksCache.value = {};

      // 优先恢复刷新前选中的 tab，否则使用第一层第一个
      const taskTypes = Object.keys(tasks.value);
      if (taskTypes.length > 0) {
        const saved = savedActiveTabsBeforeRefresh.value;
        if (saved && saved.length > 0 && isPathValidInTasks(saved, tasks.value)) {
          activeTabs.value = [...saved];
          activeTab.value = saved.join("/");
        } else {
          activeTabs.value = [taskTypes[0]];
          activeTab.value = taskTypes[0];
        }
        savedActiveTabsBeforeRefresh.value = null;
      } else {
        activeTabs.value = [];
        activeTab.value = "";
        savedActiveTabsBeforeRefresh.value = null;
      }

      // 计算总任务数
      totalTasks.value = totalCount;
    } else {
      ElMessage.error(response.message || "查询任务列表失败");
      tasks.value = {};
      totalTasks.value = 0;
      activeTabs.value = [];
      activeTab.value = "";
      selectedTasks.value = [];
      // 清除缓存
      processedTasksCache.value = {};
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
    // 清除缓存
    processedTasksCache.value = {};
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

// 在刷新前记录当前选中的 tab，供 handleSearchAllTasks 恢复
const saveCurrentTabForRestore = () => {
  if (activeTabs.value && activeTabs.value.length > 0) {
    savedActiveTabsBeforeRefresh.value = [...activeTabs.value];
  } else {
    savedActiveTabsBeforeRefresh.value = null;
  }
};

// 校验 path 在新 tasks 树中是否仍存在
const isPathValidInTasks = (path: string[], data: Record<string, any>): boolean => {
  let current: any = data;
  for (const key of path) {
    if (!current || typeof current !== "object" || !current[key]) return false;
    current = current[key];
  }
  return true;
};

// 处理任务刷新（会先保存当前 tab，刷新后恢复）
const handleTaskRefresh = () => {
  saveCurrentTabForRestore();
  return handleSearchAllTasks();
};

// 根据 activeTabs 获取当前选中层级的 requirement_id 和 requirement_name
const getCurrentRequirementInfo = () => {
  if (!activeTabs.value || activeTabs.value.length === 0 || !tasks.value) {

    return { requirementId: undefined, requirementName: undefined };
  }

  try {
    // 根据 activeTabs 路径遍历 tasks 数据
    let currentData = tasks.value;
    let requirementId = undefined;
    let requirementName = undefined;
    let lastNodeWithId = null; // 记录最后一个有 _id 的节点


    // 遍历 activeTabs，找到当前选中的层级节点
    for (let i = 0; i < activeTabs.value.length; i++) {
      const tabKey = activeTabs.value[i];

      if (!tabKey || !currentData || typeof currentData !== 'object' || !currentData[tabKey]) {
        break;
      }
      const currentNode = currentData[tabKey];


      // 如果当前节点有 task_list，说明这是最后一层，从任务列表中获取 requirement_id
      if (Array.isArray(currentNode.task_list) && currentNode.task_list.length > 0) {
        // 从第一个任务中获取 requirement_id
        const firstTask = currentNode.task_list[0];
        if (firstTask && (firstTask.requirement_id || firstTask.requirementId)) {
          requirementId = firstTask.requirement_id || firstTask.requirementId;
          requirementName = currentNode.需求名 || currentNode.requirement_name || firstTask.requirement_name || requirementName;
        } else if (currentNode.需求名) {
          // 如果任务中没有 requirement_id，至少保存需求名
          requirementName = currentNode.需求名 || currentNode.requirement_name || requirementName;
        }
        break;
      }
      // 如果当前节点有 _id（且不为空）或 需求名，说明这是一个层级节点
      if (currentNode._id && currentNode._id.trim() !== "") {
        requirementId = currentNode._id || currentNode.id || requirementId;
        requirementName = currentNode.需求名 || currentNode.requirement_name || requirementName;
        lastNodeWithId = currentNode;
      } else if (currentNode.需求名) {
        // 即使 _id 为空，也保存需求名
        requirementName = currentNode.需求名 || currentNode.requirement_name || requirementName;
      }

      // 继续下一层
      currentData = currentNode;
    }

    console.log("最终返回的层级信息:", { requirementId, requirementName });
    return { requirementId, requirementName };
  } catch (error) {
    console.error("获取当前层级信息失败:", error);
    return { requirementId: undefined, requirementName: undefined };
  }
};

// 新建任务
const handleCreate = () => {
  currentTask.value = null;

  // 获取当前选中的层级信息
  const { requirementId, requirementName } = getCurrentRequirementInfo();

  // 调试信息
  console.log("当前选中的层级信息:", { requirementId, requirementName, activeTabs: activeTabs.value });

  // 将层级信息保存到临时变量，用于传递给 TaskDrawer
  currentRequirementId.value = requirementId;
  currentRequirementName.value = requirementName;

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

// 构建所有用户的树形数据（用于批量分配）
const buildBatchAssignDepartmentLeadersTree = (departmentList: DepartmentListItem[], userMaps: DepartmentUserMap[]): any[] => {
  if (!Array.isArray(departmentList)) return [];

  // 将用户映射数组转换为对象，方便查找
  const departmentUsersMap: Record<string, string[]> = {};
  if (Array.isArray(userMaps)) {
    userMaps.forEach(map => {
      Object.keys(map).forEach(department => {
        departmentUsersMap[department] = map[department].map(
          user => user.username
        );
      });
    });
  }

  return departmentList.map((item, index) => {
    const departmentName = String(item.部门名 || "未分配部门");
    // 获取该部门的所有用户
    const users = departmentUsersMap[departmentName] || [];
    // 如果没有用户数据，使用负责人列表作为备选
    const allUsers = users.length > 0 ? users : (item.负责人 || []);

    const children: any[] = allUsers
      .filter(user => user && String(user).trim())
      .map(user => ({
        label: String(user),
        value: String(user)
      }));

    return {
      label: departmentName,
      value: `dept_${index}_${departmentName.replace(/[^a-zA-Z0-9\u4e00-\u9fa5]/g, '_')}`,
      disabled: true,
      children
    };
  });
};

// 加载批量分配部门用户列表（使用department/select获取所有用户）
const loadBatchAssignDepartmentLeaders = async () => {
  batchAssignDepartmentLeadersLoading.value = true;
  try {
    // 先获取部门列表
    const departmentResponse = await getDepartmentNameList();
    if (departmentResponse.code !== 200 || !Array.isArray(departmentResponse.result)) {
      ElMessage.error("加载部门列表失败");
      batchAssignDepartmentLeadersTree.value = [];
      return;
    }

    // 获取所有用户
    const usersResponse = await selectAllUsers();
    if (usersResponse.code === 200 && Array.isArray(usersResponse.result)) {
      batchAssignDepartmentLeadersTree.value = buildBatchAssignDepartmentLeadersTree(
        departmentResponse.result,
        usersResponse.result
      );
    } else {
      // 如果获取用户失败，只使用部门列表和负责人
      batchAssignDepartmentLeadersTree.value = buildBatchAssignDepartmentLeadersTree(
        departmentResponse.result,
        []
      );
    }
  } catch (error: any) {
    console.error("加载部门用户列表失败:", error);
    ElMessage.error(
      error?.response?.data?.message || error?.message || "加载部门用户列表失败"
    );
    batchAssignDepartmentLeadersTree.value = [];
  } finally {
    batchAssignDepartmentLeadersLoading.value = false;
  }
};

// 加载超时消息接收人
const loadNotificationPerson = async () => {
  try {
    const response = await selectNotificationPerson();
    if (response.code === 200 && response.result) {
      // 如果返回的是数组，设置到表单中
      if (response.result && Array.isArray(response.result.recipient)) {
        batchAssignForm.notification_recipients = response.result.recipient;
      } else {
        batchAssignForm.notification_recipients = [];
      }
    }
  } catch (error: any) {
    console.error("加载超时消息接收人失败:", error);
    // 不显示错误，使用默认值
  }
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

  // 打开批量分配对话框
  batchAssignDialogVisible.value = true;

  // 重置表单
  batchAssignForm.time_limit = 1;
  batchAssignForm.notification_recipients = [];

  // 加载部门负责人列表和超时消息接收人
  if (batchAssignDepartmentLeadersTree.value.length === 0) {
    await loadBatchAssignDepartmentLeaders();
  }
  await loadNotificationPerson();

  nextTick(() => {
    batchAssignFormRef.value?.clearValidate();
  });
};

// 批量分配提交
const handleBatchAssignSubmit = async () => {
  if (!batchAssignFormRef.value) return;

  await batchAssignFormRef.value.validate(async (valid) => {
    if (!valid) return;

    if (!searchForm.value.projectId) {
      ElMessage.warning("请先选择项目");
      return;
    }

    const currentTasks = selectedTasks.value;
    if (currentTasks.length === 0) {
      ElMessage.warning("请先选择要分配的任务");
      return;
    }

    try {
      batchAssignLoading.value = true;

      // 先调用更新超时消息接收人接口
      try {
        const notificationResponse = await sendNotification({
          recipient: Array.isArray(batchAssignForm.notification_recipients)
            ? batchAssignForm.notification_recipients
            : [batchAssignForm.notification_recipients]
        });

        if (notificationResponse.code !== 200) {
          ElMessage.error(notificationResponse.message || "更新超时消息接收人失败");
          batchAssignLoading.value = false;
          return;
        }
      } catch (notificationError: any) {
        console.error("更新超时消息接收人失败:", notificationError);
        ElMessage.error(
          notificationError?.response?.data?.message || notificationError?.message || "更新超时消息接收人失败"
        );
        batchAssignLoading.value = false;
        return;
      }

      // 直接使用表格数据构建 task_json
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
        if (!/^\d+$/.test(key)) {
          taskJsonFinal[key] = taskJson[key];
        }
      });

      if (Object.keys(taskJsonFinal).length === 0) {
        ElMessage.warning("没有有效的任务可以分配");
        batchAssignLoading.value = false;
        return;
      }

      // 使用 JSON 序列化/反序列化创建纯对象
      const taskJsonPlain = JSON.parse(JSON.stringify(taskJsonFinal));

      // 最终检查：确保没有任何数字键
      const finalKeys = Object.keys(taskJsonPlain);
      const hasNumericKeys = finalKeys.some(k => /^\d+$/.test(k));
      if (hasNumericKeys) {
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

      // 调用批量分配接口
      console.log({
        hour: Number(batchAssignForm.time_limit),
        task_json: taskJsonPlain
      });

      // 格式化日期，只保留年月日
      let formattedDeadline = batchAssignForm.task_assign_limit;


      const response = await bulkAssignment({
        hour: Number(batchAssignForm.time_limit),
        task_json: taskJsonPlain,
        task_deadline: formattedDeadline
      });

      if (response.code === 200) {
        const successMsg = typeof response.message === 'string' ? response.message : `成功分配 ${currentTasks.length} 个任务`;
        ElMessage.success(successMsg);
        // 关闭对话框
        batchAssignDialogVisible.value = false;
        // 清空选中状态
        selectedTasks.value = [];
        // 刷新任务列表（会恢复刷新前选中的 tab）
        await handleTaskRefresh();
      } else {
        const errorMsg = typeof response.message === 'string' ? response.message : "批量分配失败";
        ElMessage.error(errorMsg);
      }
    } catch (error: any) {
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
    } finally {
      batchAssignLoading.value = false;
    }
  });
};

// 查看任务
// 处理下拉菜单命令
const handleDropdownCommand = (command: string, row: any) => {
  switch (command) {
    case 'view':
      handleView(row);
      break;
    case 'edit':
      handleEdit(row);
      break;
    case 'changeAssignee':
      handleChangeAssignee(row);
      break;
    case 'close':
      handleCloseTask(row);
      break;
    case 'complete':
      handleCompleteTask(row);
      break;
    case 'report':
      openReportDialog(row);
      break;
  }
};

const handleCompleteTask = async (task: any) => {
  const taskId = task.id || task._id;
  if (!taskId) {
    ElMessage.error("任务ID不存在");
    return;
  }

  const currentState = task.状态 || task.status || "";
  if (!currentState) {
    ElMessage.error("无法获取任务当前状态");
    return;
  }

  try {
    await ElMessageBox.confirm("确定将该任务标记为已完成吗？", "提示", {
      confirmButtonText: "确定",
      cancelButtonText: "取消",
      type: "warning"
    });

    const response = await updateTaskState({
      task_id: taskId,
      current_state: currentState,
      next_state: TaskStatus.COMPLETED,
      person_name: ""
    });

    if (response?.code === 200) {
      ElMessage.success("完成任务成功");
      // 刷新任务列表（会恢复刷新前选中的 tab）
      await handleTaskRefresh();
    } else {
      ElMessage.error(response?.message || "完成任务失败");
    }
  } catch (error: any) {
    // 用户取消或请求异常
    if (error === "cancel" || error === "close") return;
    console.error("完成任务失败:", error);
    ElMessage.error(
      error?.response?.data?.message || error?.message || "完成任务失败，请检查网络连接"
    );
  }
};

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
    task_deadline: task.task_deadline || "",
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
          await handleTaskRefresh();
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

// 批量分配对话框相关
const batchAssignDialogVisible = ref(false);
const batchAssignFormRef = ref<FormInstance>();
const batchAssignForm = reactive({
  time_limit: 0,
  task_assign_limit: '',
  notification_recipients: [] as string[]
});

// 禁用过去的日期
const disabledPastDate = (time: Date): boolean => {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  return time.getTime() < today.getTime();
};

const batchAssignRules: FormRules = {
  time_limit: [
    { required: true, message: "请输入任务指派时限（小时）", trigger: "blur" },
    { type: "number", min: 0, message: "任务指派时限必须大于0", trigger: "blur" }
  ],
  task_assign_limit: [
    { required: true, message: "请输入任务截止期限（天）", trigger: "blur" },

  ],
  notification_recipients: [{ required: true, message: "请选择指派超时提醒人", trigger: "change" }]
};
const batchAssignDepartmentLeadersTree = ref<any[]>([]);
const batchAssignDepartmentLeadersLoading = ref(false);
const reportForm = reactive({
  recipient: "",
  cc_person: "",
  task_id: "",
  task_name: "",
  progress: 0,
  use_time: 0,
  message: "",
  state: ""
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
    handleTaskRefresh();
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
  reportForm.state = task.状态 || task.status || "";
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
        use_time: 1,
        state: reportForm.state
      });
      if (response.code === 200) {
        ElMessage.success("汇报成功");
        reportDialogVisible.value = false;
        if (searchForm.value.projectId) {
          handleTaskRefresh();
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
      person_name: task.指派人 || task.assignee || "",
      rejection_reason: ""
    });
    if (response.code === 200) {
      ElMessage.success("任务已关闭");
      if (searchForm.value.projectId) {
        handleTaskRefresh();
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

// 监听 activeTabs 变化，加载对应的任务数据
watch(
  () => activeTabs.value,
  async (newTabs, oldTabs) => {
    // 立即清空选中状态
    selectedTasks.value = [];

    if (newTabs.length > 0) {
      // 根据路径获取任务列表
      const taskList = getTaskListByPath(newTabs);
      if (taskList.length > 0) {
        await loadTaskListData(newTabs, taskList);
      } else {
        filteredTasks.value = [];
      }
    } else {
      filteredTasks.value = [];
    }
  },
  { immediate: false }
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

// 计算表格高度
const calculateTableHeight = () => {
  nextTick(() => {
    if (!containerRef.value) return;

    const viewportHeight = window.innerHeight;
    const containerRect = containerRef.value.getBoundingClientRect();
    const containerTopToViewportBottom = viewportHeight - containerRect.top;
    const tabsHeaderHeight = 40;
    const cardPadding = 70;
    const bottomPadding = 20;
    const availableHeight = containerTopToViewportBottom - tabsHeaderHeight - cardPadding - bottomPadding;

    tableHeight.value = availableHeight
  });
};

// 窗口大小改变时重新计算
const handleResize = () => {
  calculateTableHeight();
};

onMounted(async () => {
  // 打印权限列表（调试用）
  // 先加载项目列表
  await loadProjects();
  // 从路由参数中恢复搜索条件（内部会处理 create 参数）
  await restoreSearchFromQuery();
  // 如果需求还未选择，watch 会在需求选择后自动处理

  // 计算表格高度
  calculateTableHeight();
  window.addEventListener('resize', handleResize);
});

onUnmounted(() => {
  window.removeEventListener('resize', handleResize);
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

  .project-tags {
    display: flex;
    flex-wrap: wrap;
    gap: 12px;
    align-items: center;
  }

  .project-tag {
    cursor: pointer;
    transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
    user-select: none;
    padding: 10px 16px;
    font-size: 14px;
    font-weight: 500;
    border-radius: 8px;
    box-shadow: 0 2px 6px rgba(0, 0, 0, 0.08);
    border: 1.5px solid transparent;
    min-height: 36px;
    width: 140px;
    min-width: 140px;
    max-width: 140px;
    overflow: hidden;
    display: inline-flex;
    align-items: center;
    justify-content: center;

    .project-tag-text {
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
    }

    &:hover {
      transform: translateY(-2px);
      box-shadow: 0 6px 16px rgba(0, 0, 0, 0.12);
    }

    &:active {
      transform: translateY(0);
    }
  }

  // 未选中状态（info + plain）
  :deep(.project-tag.el-tag--info.el-tag--plain) {
    background: linear-gradient(135deg, #ffffff 0%, #f8f9fa 100%);
    color: #606266;
    border-color: #dcdfe6;

    &:hover {
      background: linear-gradient(135deg, #ecf5ff 0%, #d9ecff 100%);
      color: #409eff;
      border-color: #b3d8ff;
    }
  }

  // 选中状态（primary + dark）
  :deep(.project-tag.el-tag--primary.el-tag--dark) {
    background: linear-gradient(135deg, #409eff 0%, #66b1ff 100%);
    color: #ffffff;
    border-color: #409eff;
    box-shadow: 0 4px 12px rgba(64, 158, 255, 0.35);
    font-weight: 600;

    &:hover {
      background: linear-gradient(135deg, #66b1ff 0%, #409eff 100%);
      box-shadow: 0 6px 20px rgba(64, 158, 255, 0.45);
    }
  }

  // 隐藏不可选择行的 checkbox
  :deep(.el-table__body-wrapper) {
    tr {
      .el-checkbox.is-disabled {
        display: none;
      }
    }
  }

  // 放大三个点图标
  .more-icon-btn {
    :deep(.el-icon) {
      font-size: 18px;
    }
  }
}

// 移动端适配 (640px)
@media (max-width: 640px) {
  .tasks-page {
    padding: 12px;

    .page-header {
      flex-direction: column;
      align-items: flex-start;
      gap: 12px;
      margin-bottom: 16px;

      h2 {
        font-size: 18px;
      }

      .header-actions {
        width: 100%;
        flex-direction: column;
        gap: 8px;

        .el-button {
          width: 100%;
        }
      }
    }

    .search-card {
      margin-bottom: 12px;

      :deep(.el-card__body) {
        padding: 12px;
      }
    }

    .search-form {
      :deep(.el-form-item) {
        width: 100%;
        margin-right: 0;
        margin-bottom: 12px;
      }

      .project-tags {
        width: 100%;
        gap: 8px;

        .project-tag {
          width: 120px;
          min-width: 120px;
          max-width: 120px;
          padding: 8px 12px;
          font-size: 13px;
          min-height: 32px;
        }
      }
    }

    .table-header-actions {
      flex-direction: column;
      gap: 8px;
      margin-bottom: 12px;

      .el-button {
        width: 100%;
        margin: 0;
      }
    }

    .tasks-table-container {
      min-height: 400px;

      :deep(.el-table) {
        .el-table__body-wrapper {
          overflow-x: auto;
          -webkit-overflow-scrolling: touch;
        }

        .el-table__header-wrapper {
          overflow-x: auto;
        }

        .el-table__cell {
          padding: 8px 4px;
          font-size: 12px;
          white-space: nowrap;
        }
      }
    }
  }
}
</style>
