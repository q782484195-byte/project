<template>
  <div class="tasks-page" :class="{ 'is-mobile': isMobile }" ref="pageRef">
    <!-- 搜索表单 -->
    <!-- <el-card class="search-card mb-5">
      <el-form :model="searchForm" :inline="!isMobile" class="search-form" :class="{ 'search-form--mobile': isMobile }">
        <el-form-item label="选择项目" :class="{ 'is-full-width': isMobile }">
          <div class="project-tags">
            <el-tag v-for="project in projects" :key="project.id"
              :type="searchForm.projectId === project.id ? 'primary' : 'info'"
              :effect="searchForm.projectId === project.id ? 'dark' : 'plain'" class="project-tag"
              @click="handleProjectTagClick(project.id)">
              <span class="project-tag-text">
                <span class="project-name-part">{{ project.project_name || project.name }}</span>
                <span v-if="project.motherboard_name" class="project-motherboard-part">-{{ project.motherboard_name
                }}</span>
              </span>
            </el-tag>
          </div>
        </el-form-item>
      </el-form>
    </el-card> -->

    <!-- 任务列表 -->
    <el-card v-loading="loading" ref="tasksCardRef" class="tasks-card">
      <div class="tasks-table-container" ref="containerRef">
        <div class="table-header-actions" v-if="Object.keys(tasks).length > 0">
          <!-- <el-button type="success" @click="handleBatchAssign" v-perms="['task:bulk_assignment']"
            :loading="batchAssignLoading" :disabled="selectedTasks.length === 0">
            <el-icon>
              <Share />
            </el-icon>
            分配选中任务 ({{ selectedTasks.length }})
          </el-button> -->
          <div class="table-header-project-name">项目名：{{ currentProjectDisplayName }}</div>
          <div class="table-header-actions__btns">
            <el-button type="primary" @click="handleProjectReport" v-perms="['task:add']">
              <el-icon>
                <Share />
              </el-icon>
              项目汇报
            </el-button>
            <el-button type="success" :loading="exportLoading" @click="handleExportExcel">
              <el-icon>
                <Download />
              </el-icon>
              导出 Excel
            </el-button>
            <el-button type="primary" @click="handleCreateType" v-perms="['task:add']">
              <el-icon>
                <Plus />
              </el-icon>
              新建一级分类
            </el-button>
            <el-button type="primary" @click="handleCreate" v-perms="['task:add']">
              <el-icon>
                <Plus />
              </el-icon>
              新建任务
            </el-button>
          </div>
        </div>
        <!-- PC 端：折叠表格展示各层级任务 -->
        <div v-if="!isMobile && collapseTree.length > 0" class="tasks-collapse-wrap" v-loading="tabLoading">
          <TablePanel :loading="tabLoading" @refresh="handleTaskRefresh">
            <div v-for="root in collapseTree" :key="root.key" class="tasks-unified-table">
              <el-collapse :model-value="expandedCollapseKeys" class="tasks-unified-table__outer"
                expand-icon-position="left" @update:model-value="handleCollapseKeysUpdate">
                <el-collapse-item :name="root.key">
                  <template #title>
                    <div class="tasks-unified-table__outer-title">
                      <span class="tasks-unified-table__outer-name">{{ root.title }}</span>
                      <span class="tasks-unified-table__outer-count">{{ root.taskCount }}</span>
                    </div>
                  </template>
                  <div class="tasks-unified-table__content">
                    <el-table :data="[]" class="tasks-unified-table__header">
                      <el-table-column prop="一级分类" label="一级分类" :min-width="TASK_TABLE_COLUMN_WIDTHS.primary" />
                      <el-table-column prop="二级分类" label="二级分类" :min-width="TASK_TABLE_COLUMN_WIDTHS.secondary" />
                      <el-table-column prop="department" label="部门" :min-width="TASK_TABLE_COLUMN_WIDTHS.department" />
                      <el-table-column prop="指派人" label="责任人" :min-width="TASK_TABLE_COLUMN_WIDTHS.assignee" />
                      <el-table-column prop="状态" label="状态" :min-width="TASK_TABLE_COLUMN_WIDTHS.status" />
                      <el-table-column prop="优先级" label="优先级" :min-width="TASK_TABLE_COLUMN_WIDTHS.priority" />
                      <el-table-column prop="create_time" label="任务分配时间"
                        :min-width="TASK_TABLE_COLUMN_WIDTHS.assignTime" />
                      <el-table-column prop="task_deadline" label="任务完成期限"
                        :min-width="TASK_TABLE_COLUMN_WIDTHS.deadline" />
                      <el-table-column prop="remark" label="备注" :min-width="TASK_TABLE_COLUMN_WIDTHS.remark" />
                      <el-table-column label="操作" :width="operationColWidth(4)" />
                    </el-table>
                    <TaskCollapseTree v-if="root.children.length > 0" :nodes="root.children"
                      :expanded-keys="expandedCollapseKeys" is-nested
                      @update:expanded-keys="expandedCollapseKeys = $event" />
                    <TaskCollapseNodeTasks v-if="root.hasTasks && root.taskCount > 0 && root.children.length === 0"
                      :node="root" />
                  </div>
                </el-collapse-item>
              </el-collapse>
            </div>
          </TablePanel>
        </div>
        <!-- PC 端：无任何任务数据时的占位提示 -->
        <el-empty v-if="!isMobile && !loading && Object.keys(tasks).length === 0" description="暂无任务数据"
          :image-size="100" />

        <!-- 移动端：折叠卡片列表 -->
        <div v-if="isMobile">
          <div v-if="collapseTree.length > 0" v-loading="tabLoading" class="mobile-task-cards">
            <el-collapse v-for="root in collapseTree" :key="root.key" :model-value="expandedCollapseKeys"
              class="tasks-unified-table__outer tasks-unified-table__outer--mobile" expand-icon-position="left"
              @update:model-value="handleCollapseKeysUpdate">
              <el-collapse-item :name="root.key">
                <template #title>
                  <div class="tasks-unified-table__outer-title">
                    <span class="tasks-unified-table__outer-name">{{ root.title }}</span>
                    <span class="tasks-unified-table__outer-count">{{ root.taskCount }}</span>
                  </div>
                </template>
                <TaskCollapseTree v-if="root.children.length > 0" :nodes="root.children"
                  :expanded-keys="expandedCollapseKeys" is-nested
                  @update:expanded-keys="expandedCollapseKeys = $event" />
                <TaskCollapseNodeTasks v-if="root.hasTasks && root.taskCount > 0 && root.children.length === 0"
                  :node="root" />
              </el-collapse-item>
            </el-collapse>
          </div>
          <el-empty v-else-if="!tabLoading" description="暂无任务数据" :image-size="100" />
        </div>
      </div>
    </el-card>

    <!-- 新建/编辑任务抽屉 -->
    <TaskDrawer v-model:visible="showTaskDrawer" :project-id="currentProjectId || searchForm.projectId"
      :requirement-id="currentRequirementId" :requirement-name="currentRequirementName" :task="currentTask"
      :projects="projectOptions" @refresh="handleTaskRefresh" />

    <!-- 新建一级分类：复用新建层级抽屉，不传 parent-path -->
    <RequirementDrawer v-model:visible="showRequirementDrawer" :project-id="currentProjectId || searchForm.projectId"
      :project-name="currentProjectApiName" :project-creator="currentProjectCreator" @refresh="handleTaskRefresh" />

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

    <!-- 项目汇报对话框 -->
    <el-dialog v-model="projectReportDialogVisible" title="项目汇报" width="960px" append-to-body
      :close-on-click-modal="false">
      <el-form ref="projectReportFormRef" :model="projectReportForm" :rules="projectReportRules" label-width="90px">
        <el-form-item label="项目名称">
          <span>{{ projectReportForm.project_name || "-" }}</span>
        </el-form-item>
        <el-form-item label="接收人">
          <span>{{ projectReportForm.recipient || "-" }}</span>
        </el-form-item>
        <el-form-item label="汇报内容" prop="message">
          <el-input v-model="projectReportForm.message" type="textarea" :rows="12" placeholder="请输入汇报内容" />
        </el-form-item>
      </el-form>
      <template #footer>
        <span class="dialog-footer">
          <el-button @click="projectReportDialogVisible = false">取消</el-button>
          <el-button type="primary" :loading="projectReportSubmitting" @click="handleProjectReportSubmit">
            提交
          </el-button>
        </span>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted, watch, reactive, nextTick, toRaw, provide } from "vue";
import { useRouter, useRoute } from "vue-router";
import { ElMessage, ElMessageBox, ElLoading } from "element-plus";
import type { FormInstance, FormRules } from "element-plus";
import { Plus, Search, Share, Download } from "@element-plus/icons-vue";
import dayjs from "dayjs";
import { exportTaskTableToExcel } from "@/utils/taskTableExport";
import { deviceDetection } from "@pureadmin/utils";
import { hasPerms } from "@/utils/auth";
import {
  selectProjects,
  selectProjectTasks,
  selectAllRequirementsAndTasksTwo,
  selectTaskInfo,
  reportTaskProgress,
  updateTaskState,
  bulkAssignment,
  updateCurrentAssignee,
  type ProjectListItem
} from "@/api/project";
import { createProjectReport } from "@/api/report";
import { getDepartmentNameList, selectAllUsers, selectAllUsersToDepartmentMaps, selectNotificationPerson, sendNotification, flattenDepartmentList, type DepartmentUserItem, type DepartmentListItem, type DepartmentSelectUser } from "@/api/system";
import type { Project } from "@/types";
import { TaskStatus } from "@/types";
import TaskStatusFlowDialog from "@/components/TaskStatusFlowDialog.vue";
import TaskDrawer from "@/components/TaskDrawer.vue";
import RequirementDrawer from "@/components/RequirementDrawer.vue";
import TablePanel from "@/components/TablePanel/index.vue";
import TaskCollapseTree from "@/components/TaskCollapseTree.vue";
import TaskCollapseNodeTasks from "@/components/TaskCollapseNodeTasks.vue";
import {
  TASK_COLLAPSE_CTX_KEY,
  shouldShowCollapseItem,
  TASK_TABLE_COLUMN_WIDTHS,
  type TaskCollapseNode
} from "@/components/taskCollapseContext";
import { useUserStoreHook } from "@/store/modules/user";

const router = useRouter();
const route = useRoute();
const userStore = useUserStoreHook();
const userRoles = computed(() => userStore.roles || []);
const isAdmin = computed(() => userRoles.value.includes("Admin"));
const isProjectManager = computed(() => userRoles.value.includes("ProjectManager"));
const isProjectDirector = computed(() => userRoles.value.includes("ProjectDirector"));
const canCallDepartmentSelect = computed(() => isAdmin.value || isProjectManager.value);

// 移动端适配：设备检测 + 视口宽度
const MOBILE_BREAKPOINT = 768;
const isNarrowScreen = ref(window.innerWidth <= MOBILE_BREAKPOINT);
const isMobile = computed(() => deviceDetection() || isNarrowScreen.value);

// 搜索表单
const searchForm = ref({
  projectId: "",
  taskName: ""
});

const loading = ref(false);
const projectReportDialogVisible = ref(false);
const projectReportSubmitting = ref(false);
const projectReportFormRef = ref<FormInstance>();

// 保持嵌套结构：可能是2层或3层，动态检测
const tasks = ref<Record<string, any>>({});
const totalTasks = ref(0);

const collapseTree = ref<TaskCollapseNode[]>([]);
const expandedCollapseKeys = ref<string[]>([]);

const handleCollapseKeysUpdate = (value: string | string[]) => {
  expandedCollapseKeys.value = Array.isArray(value) ? value : [value];
};

watch(expandedCollapseKeys, () => {
  syncTaskTableColumnWidths();
});
const projects = ref<Project[]>([]);
const projectsLoading = ref(false);
const showTaskDrawer = ref(false);
const showRequirementDrawer = ref(false);
const currentTask = ref<any>(null);
const currentProjectId = ref<string>("");
const hasOpenedCreateDrawer = ref(false); // 标志，用于避免重复打开新建抽屉
const currentRequirementId = ref<string | undefined>(undefined);
const currentRequirementName = ref<string | undefined>(undefined);
const batchAssignLoading = ref(false);
const selectedTasks = ref<any[]>([]); // 选中的任务列表
const tabLoading = ref(false); // 折叠分组加载状态
const exportLoading = ref(false);

// 表格高度相关
const pageRef = ref<HTMLElement>();
const tasksCardRef = ref<HTMLElement>();
const containerRef = ref<HTMLDivElement>();

// 缓存键名
const CACHE_KEY = "tasks-list-params";

const readCachedListQuery = () => {
  try {
    const cached = JSON.parse(sessionStorage.getItem(CACHE_KEY) || "null");
    if (!cached || typeof cached !== "object") return null;
    return cached as {
      project_id?: string;
      project_name?: string;
      task_name?: string;
    };
  } catch {
    return null;
  }
};

// 刷新前保存的折叠展开状态，刷新后恢复
const savedExpandedKeysBeforeRefresh = ref<string[] | null>(null);

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
  const remark = task.remark ?? task.备注 ?? "";
  return {
    ...task,
    remark,
    原始状态: task.状态 || task.status,
    rowKey: rowKey,
    _originRemark: String(remark)
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

// 任务列表（移动端扁平列表，由折叠分组汇总）
const filteredTasks = ref<any[]>([]);

const TASK_NODE_META_KEYS = new Set([
  "_id", "需求名", "describe", "状态", "优先级", "project_id", "project_name",
  "creator", "attachment", "create_time", "进度", "task_list"
]);

/** 构建树形折叠节点（保留中间层如「整机项目流程」） */
const buildCollapseNode = (
  node: Record<string, any>,
  path: string[]
): TaskCollapseNode | null => {
  if (!node || typeof node !== "object") return null;

  const key = path.join("/");
  const title = node.需求名 || node.requirement_name || path[path.length - 1] || key;

  if (Array.isArray(node.task_list)) {
    if (node.task_list.length === 0) return null;
    return {
      key,
      title,
      path: [...path],
      depth: path.length,
      node,
      children: [],
      taskList: node.task_list,
      processedTasks: [],
      taskCount: node.task_list.length,
      hasTasks: true
    };
  }

  const children: TaskCollapseNode[] = [];
  Object.entries(node).forEach(([childKey, child]) => {
    if (TASK_NODE_META_KEYS.has(childKey)) return;
    if (child && typeof child === "object" && !Array.isArray(child)) {
      const childNode = buildCollapseNode(child as Record<string, any>, [...path, childKey]);
      if (childNode) children.push(childNode);
    }
  });

  if (children.length === 0) return null;

  const taskCount = children.reduce((sum, child) => sum + child.taskCount, 0);
  return {
    key,
    title,
    path: [...path],
    depth: path.length,
    node,
    children,
    taskList: [],
    processedTasks: [],
    taskCount,
    hasTasks: false
  };
};

const collectCollapseTreeRoots = (data: Record<string, any>): TaskCollapseNode[] => {
  const roots: TaskCollapseNode[] = [];
  Object.entries(data).forEach(([key, node]) => {
    if (node && typeof node === "object") {
      const built = buildCollapseNode(node as Record<string, any>, [key]);
      if (built) roots.push(built);
    }
  });
  return roots;
};

const collectAllCollapseKeys = (nodes: TaskCollapseNode[]): string[] => {
  const keys: string[] = [];
  const walk = (list: TaskCollapseNode[], isRoot = false) => {
    list.forEach(node => {
      if (isRoot || shouldShowCollapseItem(node)) {
        keys.push(node.key);
      }
      if (node.children.length) walk(node.children);
    });
  };
  walk(nodes, true);
  return keys;
};

const collectAllProcessedTasks = (nodes: TaskCollapseNode[]): any[] => {
  const rows: any[] = [];
  const walk = (list: TaskCollapseNode[]) => {
    list.forEach(node => {
      if (node.hasTasks) rows.push(...node.processedTasks);
      if (node.children.length) walk(node.children);
    });
  };
  walk(nodes);
  return rows;
};

const processCollapseTreeTasks = async (nodes: TaskCollapseNode[]) => {
  for (const node of nodes) {
    if (node.hasTasks && node.taskList.length > 0) {
      const cacheKey = node.key;
      let processed = processedTasksCache.value[cacheKey];
      if (!processed) {
        processed = await processTasksAsync(node.taskList);
        processedTasksCache.value[cacheKey] = processed;
      }
      node.processedTasks = processed;
    }
    if (node.children.length > 0) {
      await processCollapseTreeTasks(node.children);
    }
  }
};

const buildCollapseTree = async () => {
  const roots = collectCollapseTreeRoots(tasks.value);
  if (roots.length === 0) {
    collapseTree.value = [];
    expandedCollapseKeys.value = [];
    filteredTasks.value = [];
    return;
  }

  tabLoading.value = true;
  await nextTick();

  try {
    await processCollapseTreeTasks(roots);
    collapseTree.value = roots;
    filteredTasks.value = collectAllProcessedTasks(roots);

    const allKeys = collectAllCollapseKeys(roots);
    const saved = savedExpandedKeysBeforeRefresh.value;
    if (saved && saved.length > 0) {
      const restored = allKeys.filter(key => saved.includes(key));
      expandedCollapseKeys.value = restored.length > 0 ? restored : allKeys;
    } else {
      expandedCollapseKeys.value = allKeys;
    }
    savedExpandedKeysBeforeRefresh.value = null;
  } catch (error) {
    console.error("构建折叠任务树失败:", error);
    collapseTree.value = [];
    expandedCollapseKeys.value = [];
    filteredTasks.value = [];
  } finally {
    await nextTick();
    tabLoading.value = false;
    syncTaskTableColumnWidths();
  }
};

const syncTaskTableColumnWidths = () => {
  if (isMobile.value) return;

  nextTick(() => {
    requestAnimationFrame(() => {
      document.querySelectorAll(".tasks-unified-table").forEach(tableRoot => {
        const headerCells = tableRoot.querySelectorAll(
          ".tasks-unified-table__header .el-table__header th.el-table__cell"
        );
        if (!headerCells.length) return;

        const widths = Array.from(headerCells).map(cell => (cell as HTMLElement).offsetWidth);

        tableRoot.querySelectorAll(".tasks-collapse-table").forEach(tableEl => {
          tableEl.querySelectorAll("colgroup col").forEach((col, index) => {
            const width = widths[index];
            if (width > 0) {
              col.setAttribute("width", String(width));
              (col as HTMLElement).style.width = `${width}px`;
            }
          });

          tableEl.querySelectorAll(".el-table__body td.el-table__cell").forEach(cell => {
            const index = (cell as HTMLTableCellElement).cellIndex;
            const width = widths[index];
            if (width > 0) {
              (cell as HTMLElement).style.width = `${width}px`;
            }
          });
        });
      });
    });
  });
};

const GROUP_INDENT_BASE = 0;
const GROUP_INDENT_STEP = 28;

const getGroupIndentPx = (depth: number) => GROUP_INDENT_BASE + Math.max(0, depth - 1) * GROUP_INDENT_STEP;

const getTaskIndentPx = (depth: number) => 8 + depth * GROUP_INDENT_STEP;

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

// 获取状态类型
const isTaskDelayed = (row: any): boolean => {
  const status = row?.状态 || row?.status;
  if (status === TaskStatus.COMPLETED) return false;
  return row?.delay?.task_is_delay === true;
};

const DAY_MS = 24 * 60 * 60 * 1000;

const getTaskDeadline = (row: any): string | undefined =>
  row?.task_deadline || row?.task_dead_line || row?.任务完成期限 || undefined;

/** 根据 task_deadline 与当前日期计算延期天数 */
const getTaskDelayDays = (row: any): number | null => {
  const deadline = getTaskDeadline(row);
  if (!deadline) return null;
  const deadlineDate = new Date(deadline);
  if (Number.isNaN(deadlineDate.getTime())) return null;
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  deadlineDate.setHours(0, 0, 0, 0);
  const days = Math.floor((today.getTime() - deadlineDate.getTime()) / DAY_MS);
  return days > 0 ? days : null;
};

const getDisplayStatus = (row: any): string => {
  if (isTaskDelayed(row)) {
    const days = getTaskDelayDays(row);
    return days != null ? `延期 ${days}天` : "延期";
  }
  return row.状态 || row.status || "-";
};

const getStatusType = (
  status: string,
  row?: any
): "success" | "info" | "warning" | "danger" | "" => {
  if (row && isTaskDelayed(row)) return "danger";
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
    [TaskStatus.COMPLETED]: "success", // 已完成 - 绿色
    [TaskStatus.NOT_COMPLETED]: "warning", // 未完成 - 黄色
    [TaskStatus.NOT_COMPLETED_K]: "info" // 未完成（带空格）- 黄色
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
  return normalized === TaskStatus.PENDING_ASSIGN_TO_MEMBER || normalized === TaskStatus.PENDING_ACCEPTANCE
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
    "第1轮测试", "第2轮测试", "第3轮测试", "第4轮测试", "第5轮测试", "第6轮测试", "第7轮测试", "第8轮测试", "任务进行中", "测试任务进行中"
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

    if (response.code === 200 && Array.isArray(response.result)) {
      projects.value = response.result.map((item: ProjectListItem) => {
        const raw = item as ProjectListItem & { project_id?: string; id?: string };
        return {
        id: raw._id || raw.project_id || raw.id || "",
        name: `${item.project_name || ""} - ${item.motherboard_name || ""}`,
        project_name: item.project_name || "",
        motherboard_name: item.motherboard_name || "",
        status: item.state as any,
        startDate: item.plant_start_time,
        endDate: item.plant_end_time,
        creator: item.creator,
        createdAt: item.create_time
      };
      }) as Project[];
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
    collapseTree.value = [];
    expandedCollapseKeys.value = [];
    filteredTasks.value = [];
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
    collapseTree.value = [];
    expandedCollapseKeys.value = [];
    filteredTasks.value = [];
  }
};

// 查询所有任务
const handleSearchAllTasks = async () => {
  if (!searchForm.value.projectId) {
    ElMessage.warning("请先选择项目");
    return;
  }
  saveCachedListQuery();
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
      await buildCollapseTree();

      // 计算总任务数
      totalTasks.value = totalCount;
    } else {
      ElMessage.error(response.message || "查询任务列表失败");
      tasks.value = {};
      totalTasks.value = 0;
      collapseTree.value = [];
      expandedCollapseKeys.value = [];
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
    collapseTree.value = [];
    expandedCollapseKeys.value = [];
    filteredTasks.value = [];
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

// 在刷新前记录当前折叠展开状态，供 handleSearchAllTasks 恢复
const saveExpandedStateForRestore = () => {
  if (expandedCollapseKeys.value.length > 0) {
    savedExpandedKeysBeforeRefresh.value = [...expandedCollapseKeys.value];
  } else {
    savedExpandedKeysBeforeRefresh.value = null;
  }
};

// 处理任务刷新（会先保存当前折叠状态，刷新后恢复）
const handleTaskRefresh = () => {
  saveExpandedStateForRestore();
  return handleSearchAllTasks();
};

const getRequirementInfoFromNode = (group: TaskCollapseNode) => {
  const node = group.node;
  const firstTask = group.processedTasks[0] || group.taskList[0];
  let requirementId: string | undefined;
  let requirementName: string | undefined;

  if (node._id && String(node._id).trim() !== "") {
    requirementId = node._id || node.id;
  }
  requirementName = node.需求名 || node.requirement_name || requirementName;

  if (firstTask) {
    requirementId = firstTask.requirement_id || firstTask.requirementId || requirementId;
    requirementName = firstTask.requirement_name || requirementName;
  }

  return { requirementId, requirementName };
};

const findFirstTaskLeaf = (nodes: TaskCollapseNode[]): TaskCollapseNode | undefined => {
  for (const node of nodes) {
    if (node.hasTasks && node.processedTasks.length > 0) return node;
    const found = findFirstTaskLeaf(node.children);
    if (found) return found;
  }
  return undefined;
};

// 获取新建任务时默认关联的层级（取第一个有任务数据的叶子节点）
const getCurrentRequirementInfo = () => {
  const leaf = findFirstTaskLeaf(collapseTree.value);
  if (!leaf) {
    return { requirementId: undefined, requirementName: undefined };
  }
  return getRequirementInfoFromNode(leaf);
};

// 新建一级分类（打开新建层级抽屉，不带父路径）
const handleCreateType = () => {
  const projectId = currentProjectId.value || searchForm.value.projectId;
  if (!projectId) {
    ElMessage.warning("请先选择项目");
    return;
  }
  showRequirementDrawer.value = true;
};

// 新建任务
const handleCreate = () => {
  currentTask.value = null;

  // 获取当前选中的层级信息
  const { requirementId, requirementName } = getCurrentRequirementInfo();

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

// 处理项目汇报
const projectReportForm = reactive({
  recipient: "",
  project_name: "",
  project_id: "",
  message: ""
});

const projectReportRules: FormRules = {
  message: [{ required: true, message: "请输入汇报内容", trigger: "blur" }]
};

const getQueryString = (key: string) => {
  const value = route.query[key];
  const raw = Array.isArray(value) ? value[0] : value;
  return typeof raw === "string" && raw.trim() ? raw.trim() : "";
};

const getSelectedProject = () => {
  const projectId = searchForm.value.projectId;
  if (!projectId) return undefined;
  return projects.value.find(
    (project: Project) => String(project.id) === String(projectId)
  );
};

const currentProjectDisplayName = computed(() => {
  const project = getSelectedProject();
  if (project) {
    const projectName = (
      project as Project & { project_name?: string }
    ).project_name?.trim();
    if (projectName) return projectName;
    const combinedName = project.name?.trim();
    if (combinedName && combinedName !== "-") return combinedName;
  }
  const fromRoute = getQueryString("project_name");
  if (fromRoute) return fromRoute;
  const cachedName = readCachedListQuery()?.project_name?.trim();
  if (cachedName) return cachedName;
  return "-";
});

const currentProjectApiName = computed(() => {
  const project = getSelectedProject();
  if (!project) return "";
  return (project as Project & { project_name?: string }).project_name || project.name || "";
});

const currentProjectCreator = computed(() => getSelectedProject()?.creator || "");

const sanitizeFilename = (name: string) =>
  name.replace(/[\\/:*?"<>|]/g, "_").replace(/\s+/g, "_").slice(0, 80);

const handleExportExcel = async () => {
  if (!searchForm.value.projectId) {
    ElMessage.warning("请先选择项目");
    return;
  }
  if (Object.keys(tasks.value).length === 0) {
    ElMessage.warning("暂无任务数据可导出");
    return;
  }

  exportLoading.value = true;
  try {
    if (collapseTree.value.length === 0 || tabLoading.value) {
      await buildCollapseTree();
    }

    const projectName = currentProjectDisplayName.value;
    const timestamp = dayjs().format("YYYYMMDD_HHmmss");
    const filename = `${sanitizeFilename(projectName)}_${timestamp}.xlsx`;
    const taskCount = exportTaskTableToExcel(collapseTree.value, filename, projectName);

    if (taskCount === 0) {
      ElMessage.warning("暂无任务数据可导出");
      return;
    }

    ElMessage.success(`成功导出 ${taskCount} 条任务`);
  } catch (error: any) {
    console.error("导出 Excel 失败:", error);
    ElMessage.error(error?.message || "导出 Excel 失败");
  } finally {
    exportLoading.value = false;
  }
};

const handleProjectReport = () => {
  if (!searchForm.value.projectId) {
    ElMessage.warning("请先选择项目");
    return;
  }
  const project = getSelectedProject();
  if (!project) {
    ElMessage.warning("项目信息不完整");
    return;
  }
  projectReportForm.recipient = project.creator || "";
  projectReportForm.project_name = project.project_name || project.name || "";
  projectReportForm.project_id = searchForm.value.projectId;
  projectReportForm.message = "";
  projectReportDialogVisible.value = true;
  nextTick(() => {
    projectReportFormRef.value?.clearValidate();
  });
};

const handleProjectReportSubmit = () => {
  projectReportFormRef.value?.validate(async valid => {
    if (!valid) return;
    if (!projectReportForm.project_id) {
      ElMessage.error("项目信息缺失");
      return;
    }
    if (!projectReportForm.recipient) {
      ElMessage.error("接收人信息缺失");
      return;
    }
    projectReportSubmitting.value = true;
    try {
      const response = await createProjectReport({
        recipient: projectReportForm.recipient,
        project_id: projectReportForm.project_id,
        project_name: projectReportForm.project_name,
        message: projectReportForm.message.trim()
      });
      if (response.code === 200) {
        ElMessage.success(response.message || "项目汇报成功");
        projectReportDialogVisible.value = false;
      } else {
        ElMessage.error(response.message || "项目汇报失败");
      }
    } catch (error: any) {
      console.error("项目汇报失败:", error);
      ElMessage.error(
        error?.response?.data?.message || error?.message || "项目汇报失败"
      );
    } finally {
      projectReportSubmitting.value = false;
    }
  });
};

// 处理表格选择变化
const handleSelectionChange = (selection: any[]) => {
  selectedTasks.value = selection;
};

// 构建所有用户的树形数据（用于批量分配）
const buildBatchAssignDepartmentLeadersTree = (
  departmentList: DepartmentListItem[],
  userMaps: Array<Record<string, DepartmentSelectUser[]>>
): any[] => {
  if (!Array.isArray(departmentList)) return [];

  // 将用户映射数组转换为对象，方便查找
  const departmentUsersMap: Record<string, string[]> = {};
  if (Array.isArray(userMaps)) {
    userMaps.forEach(map => {
      Object.entries(map).forEach(([department, users]) => {
        if (!Array.isArray(users)) return;
        const names = users.map(user => user.username).filter(Boolean);
        if (!departmentUsersMap[department]) {
          departmentUsersMap[department] = [];
        }
        names.forEach(name => {
          if (!departmentUsersMap[department].includes(name)) {
            departmentUsersMap[department].push(name);
          }
        });
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
    if (departmentResponse.code !== 200 || departmentResponse.result == null) {
      ElMessage.error("加载部门列表失败");
      batchAssignDepartmentLeadersTree.value = [];
      return;
    }

    const departmentList = flattenDepartmentList(departmentResponse.result);
    const usersResponse = await selectAllUsers();
    const usersRaw = usersResponse.result ?? usersResponse.data;
    if (usersResponse.code === 200 && usersRaw != null) {
      batchAssignDepartmentLeadersTree.value = buildBatchAssignDepartmentLeadersTree(
        departmentList,
        selectAllUsersToDepartmentMaps(usersRaw)
      );
    } else {
      batchAssignDepartmentLeadersTree.value = buildBatchAssignDepartmentLeadersTree(
        departmentList,
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

// 根据操作按钮数量计算操作列宽度（单行排下按钮，避免多余空白）
const operationColWidth = (buttonCount: number): number => {
  return Math.max(180, 28 + buttonCount * 42);
};

// 查看任务
// 处理操作按钮命令
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
    case 'assign':
      openStatusFlowDialog(row);
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

/** 将 info 接口任务数据映射为 TaskDrawer 所需结构 */
const mapTaskInfoToDrawerTask = (raw: any) => ({
  _id: raw._id || raw.id,
  id: raw._id || raw.id,
  task_name: raw.task_name || raw.title || raw.任务名 || "",
  describe: raw.describe || [],
  project_id: raw.project_id || raw.projectId || raw.project?._id || "",
  requirement_id: raw.requirement_id || raw.requirementId || "",
  requirement_name: raw.requirement_name || "",
  priority: raw.priority || raw.优先级 || "",
  task_deadline: raw.task_deadline || raw.task_dead_line || "",
  default_person: raw.default_person || raw.默认部门负责人 || "",
  department: raw.department ? String(raw.department) : "",
  attachment: raw.attachment || raw.files || [],
  current_handler: raw.current_handler || raw.当前处理人 || raw.assignee || ""
});

// 编辑任务：调用 info 接口获取完整数据后打开抽屉
const handleEdit = async (task: any) => {
  const taskId = task._id || task.id;
  if (!taskId) {
    ElMessage.error("任务ID不存在");
    return;
  }

  const loadingInstance = ElLoading.service({
    lock: true,
    text: "加载任务信息...",
    background: "rgba(0, 0, 0, 0.45)"
  });

  try {
    const response = await selectTaskInfo({ task_id: taskId });
    if (response.code !== 200) {
      ElMessage.error(response.message || "获取任务详情失败");
      return;
    }

    const raw = response.result || response.data;
    if (!raw) {
      ElMessage.error("未找到任务详情");
      return;
    }

    const taskData = { ...raw };
    // 列表行可能带有项目/层级信息，接口未返回时兜底
    if (!taskData.project_id) {
      taskData.project_id =
        task.project_id || task.projectId || searchForm.value.projectId || "";
    }
    if (!taskData.requirement_id) {
      taskData.requirement_id = task.requirement_id || task.requirementId || "";
    }
    if (!taskData.requirement_name) {
      taskData.requirement_name = task.requirement_name || "";
    }
    if (!taskData.department && task.department) {
      taskData.department = task.department;
    }
    if (!taskData.project_id && taskData.project?._id) {
      taskData.project_id = taskData.project._id;
    }
    // 完成期限优先使用列表中的「任务完成期限」
    const listDeadline =
      task.task_deadline || task.task_dead_line || task.任务完成期限 || "";
    if (listDeadline) {
      taskData.task_deadline = listDeadline;
    }

    currentTask.value = mapTaskInfoToDrawerTask(taskData);

    if (currentTask.value.project_id) {
      currentProjectId.value = currentTask.value.project_id;
      if (currentTask.value.project_id !== searchForm.value.projectId) {
        searchForm.value.projectId = currentTask.value.project_id;
      }
    }

    showTaskDrawer.value = true;
  } catch (error: any) {
    console.error("获取任务详情失败:", error);
    ElMessage.error(
      error?.response?.data?.message || error?.message || "获取任务详情失败"
    );
  } finally {
    loadingInstance.close();
  }
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
    if (response.code === 200 && response.result != null) {
      const departmentList = flattenDepartmentList(response.result);
      changeAssigneeUsersRawData.value = departmentList;
      changeAssigneeUsersTree.value = buildChangeAssigneeUsersTree(departmentList);
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
    const list = await userStore.fetchDepartmentUsers();
    departmentUsers.value =
      list.filter(user =>
        Array.isArray(user.role)
          ? user.role.includes("DepartmentManager")
          : false
      ) || [];
    if (!list.length) {
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

const saveCachedListQuery = () => {
  if (!searchForm.value.projectId) return;
  const payload: Record<string, string> = {
    project_id: searchForm.value.projectId
  };
  const project = getSelectedProject();
  const projectName =
    project?.project_name?.trim() ||
    project?.name?.trim() ||
    getQueryString("project_name");
  if (projectName && projectName !== "-") {
    payload.project_name = projectName;
  }
  if (searchForm.value.taskName) payload.task_name = searchForm.value.taskName;
  sessionStorage.setItem(CACHE_KEY, JSON.stringify(payload));
};

// 从路由参数中恢复搜索条件；标签点击丢失参数时，回退到上次打开的项目
const restoreSearchFromQuery = async () => {
  const queryValue = (value: unknown) =>
    Array.isArray(value) ? value[0] : value;
  let routeProjectId = queryValue(route.query.project_id) as string | undefined;
  let routeProjectName = queryValue(route.query.project_name) as string | undefined;
  let routeTaskName = queryValue(route.query.task_name) as string | undefined;
  let restoredFromCache = false;

  if (!routeProjectId) {
    const cached = readCachedListQuery();
    if (cached?.project_id) {
      routeProjectId = cached.project_id;
      routeProjectName = routeProjectName || cached.project_name;
      routeTaskName = routeTaskName || cached.task_name;
      restoredFromCache = true;
    }
  }

  if (routeProjectId || routeProjectName || routeTaskName) {
    if (routeProjectId) {
      searchForm.value.projectId = routeProjectId;
    }
    if (routeTaskName) {
      searchForm.value.taskName = routeTaskName;
    }
    if (restoredFromCache && routeProjectId) {
      const query: Record<string, string> = { project_id: routeProjectId };
      if (routeProjectName) query.project_name = routeProjectName;
      if (routeTaskName) query.task_name = routeTaskName;
      await router.replace({ name: "TasksList", query });
    }
    if (searchForm.value.projectId) {
      saveCachedListQuery();
      await handleSearchAllTasks();
    }
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

provide(TASK_COLLAPSE_CTX_KEY, {
  expandedKeys: expandedCollapseKeys,
  isMobile,
  get username() {
    return userStore.username;
  },
  get isAdmin() {
    return isAdmin.value;
  },
  get isProjectManager() {
    return isProjectManager.value;
  },
  get isProjectDirector() {
    return isProjectDirector.value;
  },
  getGroupIndentPx,
  getTaskIndentPx,
  getStatusType,
  getDisplayStatus,
  getPriorityType,
  operationColWidth,
  hasPerms,
  isPendingAssignStatus,
  canRecordBug,
  onCommand: handleDropdownCommand
});

const handleResize = () => {
  isNarrowScreen.value = window.innerWidth <= MOBILE_BREAKPOINT;
  syncTaskTableColumnWidths();
};

onMounted(async () => {
  await loadProjects();
  await restoreSearchFromQuery();
  window.addEventListener("resize", handleResize);
});

watch(
  () => [route.query.project_id, route.query.project_name],
  async () => {
    await restoreSearchFromQuery();
  }
);

onUnmounted(() => {
  window.removeEventListener("resize", handleResize);
});
</script>

<style scoped lang="scss">
.tasks-page {
  width: 100%;
  min-width: 0;
  box-sizing: border-box;

  .tasks-card {
    width: 100%;
    min-width: 0;

    :deep(.el-card__body) {
      padding: 16px;
      width: 100%;
      min-width: 0;
      box-sizing: border-box;
    }
  }

  .tasks-table-container {
    width: 100%;
    min-width: 0;
    min-height: 0;
    display: flex;
    flex-direction: column;
    box-sizing: border-box;
  }

  .tasks-collapse-wrap {
    flex: 1;
    min-height: 0;
    min-width: 0;
    width: 100%;

    :deep(.table-panel) {
      width: 100%;
      min-width: 0;
    }

    :deep(.table-panel__body) {
      width: 100%;
      min-width: 0;
    }
  }

  .tasks-unified-table {
    width: 100%;
    border: 1px solid var(--el-border-color);
    border-radius: 8px;
    overflow: hidden;
    background: #f3f5f8;
    box-shadow: 0 1px 3px rgba(15, 23, 42, 0.06);

    &:not(:last-child) {
      margin-bottom: 12px;
    }

    &__outer {
      border: none;
      background: transparent;

      :deep(.el-collapse-item) {
        border: none;
      }

      :deep(.el-collapse-item__header) {
        height: auto;
        min-height: 42px;
        line-height: 1.45;
        padding: 8px 12px 8px 8px;
        font-weight: 600;
        background: #d4dae4 !important;
        border-bottom: 1px solid #9aaabe;
        transition: background-color 0.15s ease;

        &:hover {
          background: #a8b8cc !important;
        }
      }

      :deep(.el-collapse-item__arrow) {
        margin: 0 6px 0 2px;
        font-size: 12px;
        color: var(--el-text-color-secondary);
      }

      :deep(.el-collapse-item__wrap) {
        border-bottom: none;
      }

      :deep(.el-collapse-item__content) {
        padding: 0;
        background: #f3f5f8;
      }

      &--mobile {
        margin-bottom: 12px;
        border: 1px solid #9aaabe;
        border-radius: 8px;
        overflow: hidden;
        background: #ffffff;

        :deep(.el-collapse-item__header) {
          background: #b8c5d6 !important;
          border-bottom: 1px solid #9aaabe;

          &:hover {
            background: #a8b8cc !important;
          }
        }

        :deep(.el-collapse-item__content) {
          padding: 8px;
          background: #fafbfc;
        }
      }
    }

    &__outer-title {
      display: flex;
      align-items: center;
      gap: 8px;
      min-width: 0;
      flex: 1;
    }

    &__outer-name {
      font-size: 14px;
      font-weight: 600;
      color: var(--el-text-color-primary);
      word-break: break-all;
      line-height: 1.45;
    }

    &__outer-count {
      flex-shrink: 0;
      min-width: 20px;
      height: 20px;
      padding: 0 6px;
      font-size: 12px;
      line-height: 20px;
      text-align: center;
      font-weight: 400;
      color: var(--el-text-color-regular);
      background: #dfe4ec;
      border-radius: 10px;
    }

    &__content {
      width: 100%;
      background: #f3f5f8;
      overflow-x: auto;
    }

    &__header {
      width: 100%;

      :deep(.el-table__header) table {
        width: 100% !important;
        table-layout: fixed;
      }

      :deep(.el-table__body-wrapper) {
        display: none;
      }

      :deep(.el-table__empty-block) {
        display: none;
      }

      :deep(.el-table__inner-wrapper::before) {
        display: none;
      }

      :deep(.el-table__border-left-patch),
      :deep(.el-table__border-right-patch) {
        display: none;
      }

      :deep(th.el-table__cell) {
        background: #e4e8ee;
        font-weight: 600;
        font-size: 13px;
        color: var(--el-text-color-primary);
        padding: 4px 10px;
        border-bottom: 1px solid var(--el-border-color);
        border-right: 1px solid #d8dde6;

        &:last-child {
          border-right: none;
        }

        .cell {
          padding: 0;
          line-height: 22px;
          white-space: nowrap;
        }
      }
    }
  }

  :deep(.tasks-collapse) {
    width: 100%;
    border: none;
    background: #f3f5f8;

    &.tasks-collapse--nested {
      background: #fafbfc;
    }

    .el-collapse-item {
      margin-bottom: 0;
      border: none;
      border-radius: 0;
      overflow: hidden;
    }

    .el-collapse-item__header {
      height: auto;
      min-height: 38px;
      line-height: 1.45;
      padding: 6px 12px 6px 8px;
      font-weight: 500;
      background: #eef1f6 !important;
      border-bottom: 1px solid #d8dde6;
      transition: background-color 0.15s ease;

      &:hover {
        background: #e8ecf2;
      }
    }

    .el-collapse-item__arrow {
      margin: 0 6px 0 2px;
      font-size: 12px;
      color: var(--el-text-color-secondary);
    }

    .el-collapse-item__wrap {
      border-bottom: none;
    }

    .el-collapse-item__content {
      padding: 0;
      background: #fafbfc;
    }

    &:not(.tasks-collapse--nested)>.el-collapse-item>.el-collapse-item__header {
      background: #e8ecf2;
      border-bottom: 1px solid #d0d6e0;
    }
  }

  :deep(.tasks-collapse--nested) {
    .el-collapse-item__header {
      background: #f0f3f7;
      border-bottom: 1px solid #d8dde6;
    }

    .el-collapse-item__content {
      background: #f7f8fa;
    }
  }

  :deep(.tasks-collapse--mobile) {
    background: #f3f5f8;

    .el-collapse-item {
      margin-bottom: 8px;
      border-radius: 8px;
      border: 1px solid #d0d6e0;
      overflow: hidden;
      background: #ffffff;
    }

    .el-collapse-item__header {
      padding: 10px 12px 10px 6px;
      background: #eef1f6;
      border-bottom: 1px solid #d8dde6;
    }

    .el-collapse-item__content {
      padding: 6px 8px 10px;
      background: #fafbfc;
    }
  }

  :deep(.tasks-collapse-single) {
    background: #ffffff;
    border-bottom: 1px solid #d8dde6;

    &[data-depth="1"] {
      background: #f7f9fc;
    }
  }

  :deep(.tasks-collapse__title) {
    display: flex;
    align-items: center;
    gap: 8px;
    min-width: 0;
    flex: 1;
    box-sizing: border-box;
    position: relative;

    &[data-depth="2"],
    &[data-depth="3"],
    &[data-depth="4"] {
      &::before {
        content: "";
        position: absolute;
        left: 0;
        top: 4px;
        bottom: 4px;
        width: 2px;
        border-radius: 1px;
        background: var(--el-color-primary-light-7);
      }
    }

    &[data-depth="3"]::before,
    &[data-depth="4"]::before {
      background: var(--el-color-primary-light-8);
    }
  }

  :deep(.tasks-collapse__name) {
    font-size: 13px;
    font-weight: 500;
    color: var(--el-text-color-primary);
    word-break: break-all;
    line-height: 1.45;
  }

  :deep(.tasks-collapse__title[data-depth="1"] .tasks-collapse__name) {
    font-size: 14px;
    font-weight: 600;
  }

  :deep(.tasks-collapse__count) {
    flex-shrink: 0;
    min-width: 20px;
    height: 20px;
    padding: 0 6px;
    font-size: 12px;
    line-height: 20px;
    text-align: center;
    color: var(--el-text-color-regular);
    background: #dfe4ec;
    border-radius: 10px;
  }

  :deep(.tasks-collapse-node-tasks) {
    background: #ffffff;
    border-top: 1px solid #e2e6ed;
  }

  :deep(.tasks-collapse-table) {
    width: 100%;
    background: #ffffff;

    .el-table__header table,
    .el-table__body table {
      width: 100% !important;
      table-layout: fixed;
    }

    .el-table__body-wrapper {
      overflow: hidden;
    }

    .el-table__inner-wrapper::before {
      display: none;
    }

    .el-table__border-left-patch,
    .el-table__border-right-patch {
      display: none;
    }

    .el-table__cell {
      padding: 4px 10px;
      font-size: 13px;
      border-right: 1px solid #e2e6ed !important;
      background: #ffffff;

      &:last-child {
        border-right: none !important;
      }

      .cell {
        padding: 0;
        line-height: 22px;
        white-space: nowrap;
      }
    }

    .el-table__body tr {
      td {
        border-bottom: 1px solid #d8dde6;
      }

      &:nth-child(even):not(.tasks-collapse-table__group-row) td {
        background: #f6f8fb;
      }

      &:hover:not(.tasks-collapse-table__group-row)>td {
        background-color: #eef3f9 !important;
      }

      &.tasks-collapse-table__group-row td {
        background: #eef1f6 !important;
        font-weight: 500;
      }
    }
  }

  :deep(.tasks-collapse-table__group-title) {
    display: inline-flex;
    align-items: center;
    gap: 8px;
    font-weight: 600;
    color: var(--el-text-color-primary);
  }

  :deep(.tasks-collapse-table__count) {
    flex-shrink: 0;
    min-width: 20px;
    height: 20px;
    padding: 0 6px;
    font-size: 12px;
    line-height: 20px;
    text-align: center;
    font-weight: 400;
    color: var(--el-text-color-regular);
    background: #dfe4ec;
    border-radius: 10px;
  }

  :deep(.tasks-collapse-table__task-name) {
    display: inline-block;
    box-sizing: border-box;
    max-width: 100%;
    word-break: break-all;
    font-weight: 500;
    color: var(--el-text-color-primary);
    position: relative;

    &[data-depth="2"]::before,
    &[data-depth="3"]::before,
    &[data-depth="4"]::before {
      content: "";
      position: absolute;
      left: 0;
      top: 0.35em;
      width: 5px;
      height: 5px;
      border-radius: 50%;
      background: var(--el-color-primary-light-5);
      transform: translateX(-10px);
    }
  }

  :deep(.tasks-collapse-table__text) {
    font-size: 13px;
    color: var(--el-text-color-primary);
  }

  :deep(.tasks-collapse-table__muted) {
    color: var(--el-text-color-secondary);
    font-size: 12px;
  }

  :deep(.tasks-collapse-table .el-tag) {
    border: none;
  }

  .table-header-actions {
    position: relative;
    display: flex;
    align-items: center;
    justify-content: flex-end;
    gap: 12px;
    margin-bottom: 16px;
    min-height: 32px;
  }

  .table-header-project-name {
    position: absolute;
    left: 50%;
    transform: translateX(-50%);
    font-size: 15px;
    font-weight: 600;
    color: var(--el-text-color-primary);
    line-height: 1.4;
    text-align: center;
    max-width: calc(100% - 280px);
    word-break: break-all;
    pointer-events: none;
  }

  .table-header-actions__btns {
    display: flex;
    gap: 12px;
    align-items: center;
    flex-shrink: 0;
    flex-wrap: wrap;
    justify-content: flex-end;
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
    flex: 0 1 auto;
    min-width: 100px;
    max-width: 200px;
    overflow: hidden;
    display: inline-flex;
    align-items: center;
    justify-content: center;

    .project-tag-text {
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
      display: inline-flex;
      align-items: center;
      gap: 2px;

      .project-name-part {
        font-weight: 600;
        color: inherit;
      }

      .project-motherboard-part {
        font-weight: 400;
        opacity: 0.85;
      }
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

  // 操作列按钮组
  .table-action-btns {
    display: flex;
    flex-wrap: nowrap;
    align-items: center;
    white-space: nowrap;
    gap: 0 6px;

    .el-button {
      padding: 0 4px;
      margin: 0;
      flex-shrink: 0;
      white-space: nowrap;
    }

    .action-danger {
      color: var(--el-color-danger);

      &:hover {
        color: var(--el-color-danger);
        opacity: 0.8;
      }
    }

    .action-success {
      color: var(--el-color-success);

      &:hover {
        color: var(--el-color-success);
        opacity: 0.8;
      }
    }
  }

  // 移动端：搜索表单纵向排列
  .search-form--mobile {
    display: flex;
    flex-direction: column;
    gap: 0;

    .el-form-item.is-full-width {
      width: 100%;
      margin-right: 0;
      margin-bottom: 12px;
    }

    .el-form-item .el-form-item__content {
      width: 100%;
    }
  }

  // 移动端：任务卡片列表
  .mobile-task-cards {
    min-height: 200px;
  }

  .mobile-task-cards-empty {
    padding: 32px 0;
  }

  :deep(.mobile-task-group-header) {
    display: flex;
    align-items: center;
    gap: 8px;
    padding: 10px 12px;
    margin-bottom: 8px;
    background: #eef1f6;
    border: 1px solid #d8dde6;
    border-radius: 8px;
    font-weight: 600;
    color: var(--el-text-color-primary);
  }

  :deep(.mobile-task-group-header__count) {
    min-width: 20px;
    height: 20px;
    padding: 0 6px;
    font-size: 12px;
    line-height: 20px;
    text-align: center;
    font-weight: 400;
    color: var(--el-text-color-regular);
    background: #dfe4ec;
    border-radius: 10px;
  }

  .mobile-task-card {
    background: var(--el-bg-color);
    border: 1px solid var(--el-border-color-lighter);
    border-radius: 10px;
    margin-bottom: 12px;
    overflow: hidden;
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.06);
    transition: box-shadow 0.2s;

    &:last-child {
      margin-bottom: 0;
    }

    &:active {
      box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
    }
  }

  .mobile-task-card__main {
    padding: 14px 12px;
  }

  .mobile-task-card__title {
    font-size: 15px;
    font-weight: 600;
    color: var(--el-text-color-primary);
    margin-bottom: 10px;
    line-height: 1.4;
    word-break: break-all;
  }

  .mobile-task-card__meta {
    display: flex;
    flex-wrap: wrap;
    gap: 6px;
    margin-bottom: 10px;
  }

  .mobile-task-card__row {
    display: flex;
    align-items: flex-start;
    justify-content: space-between;
    gap: 10px;
    padding: 8px 0;
    font-size: 13px;
    border-bottom: 1px solid var(--el-border-color-lighter);

    &:last-of-type {
      border-bottom: none;
    }
  }

  .mobile-task-card__label {
    flex-shrink: 0;
    color: var(--el-text-color-secondary);
    min-width: 90px;
  }

  .mobile-task-card__value {
    flex: 1;
    text-align: right;
    word-break: break-all;
    color: var(--el-text-color-primary);
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    justify-content: flex-end;
    gap: 4px 8px;
  }

  .mobile-task-card__progress-wrap {
    min-width: 140px;
    width: 100%;
    justify-content: flex-end;
  }

  .mobile-task-card__progress {
    min-width: 140px;
    width: 100%;
  }

  .mobile-task-card__progress-wrap :deep(.el-progress-bar) {
    padding-right: 0;
  }

  .mobile-task-card__progress-wrap :deep(.el-progress-bar__outer) {
    min-width: 140px;
  }

  .mobile-task-card__actions {
    display: flex;
    flex-wrap: wrap;
    gap: 4px 8px;
    margin-top: 12px;
    padding-top: 12px;
    border-top: 1px solid var(--el-border-color-lighter);

    .el-button {
      padding: 2px 8px;
      font-size: 12px;
    }

    .action-danger {
      color: var(--el-color-danger);
    }

    .action-success {
      color: var(--el-color-success);
    }
  }
}

// 移动端适配：768px 与 640px 断点
@media (max-width: 768px) {
  .tasks-page {
    .tasks-card :deep(.el-card__body) {
      padding: 12px 10px;
    }

    .search-card {
      margin-bottom: 12px;

      :deep(.el-card__body) {
        padding: 14px 12px;
      }
    }

    .search-form {
      :deep(.el-form-item) {
        margin-right: 0;
      }

      .project-tags {
        gap: 10px;
      }

      .project-tag {
        min-height: 40px;
        padding: 10px 14px;
        font-size: 13px;
        flex: 1 1 calc((100% - 20px) / 3);
        min-width: calc((100% - 20px) / 3);
        max-width: none;
      }
    }

    .table-header-actions {
      gap: 8px;
      margin-bottom: 12px;
      min-height: 32px;

      .table-header-project-name {
        max-width: calc(100% - 200px);
        font-size: 14px;
      }

      .table-header-actions__btns {
        gap: 8px;
      }

      .table-header-actions__btns .el-button {
        padding: 8px 12px;
      }
    }

    .tasks-table-container {
      min-height: 0;

      .tasks-collapse__name {
        font-size: 13px;
      }

      :deep(.el-table) {
        .el-table__body-wrapper {
          overflow-x: auto;
          -webkit-overflow-scrolling: touch;
        }

        .el-table__header-wrapper {
          overflow-x: auto;
        }

        .el-table__cell {
          padding: 10px 6px;
          font-size: 12px;
        }

        .el-progress {
          min-width: 60px;
        }
      }

      .table-action-btns {
        gap: 6px 4px;

        .el-button {
          padding: 2px 6px;
          font-size: 12px;
        }
      }
    }
  }
}

@media (max-width: 640px) {
  .tasks-page {
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

    .search-card :deep(.el-card__body) {
      padding: 12px 10px;
    }

    .search-form .project-tags .project-tag {
      flex: 1 1 calc((100% - 20px) / 3);
      min-width: calc((100% - 20px) / 3);
      max-width: none;
      min-height: 44px;
      padding: 12px 14px;
      font-size: 14px;
    }

    .tasks-table-container {
      min-height: 0;

      .tasks-collapse__name {
        font-size: 12px;
      }

      :deep(.el-table) .el-table__cell {
        padding: 8px 4px;
        font-size: 12px;
      }
    }
  }
}
</style>

<!-- 移动端弹窗宽度（弹窗挂载在 body，需单独样式） -->
<style lang="scss">
@media (max-width: 768px) {
  .el-overlay-dialog .el-dialog {
    width: calc(100% - 24px) !important;
    max-width: none;
    margin: 12px auto;
  }
}
</style>
