<template>
  <div class="dept-task-stat" :class="{ 'is-mobile': isMobile }">

    <el-card class="main-card" shadow="never" v-loading="orgLoading || tasksLoading">
      <template v-if="hasData">
        <div class="toolbar">
          <div class="toolbar__filters">
            <div class="filter-field">
              <label class="filter-label">
                部门
              </label>
              <el-select v-model="selectedDepartment" class="filter-control" placeholder="请选择部门" filterable clearable
                size="default" @change="handleDepartmentChange">
                <el-option v-for="dept in departmentKeys" :key="dept"
                  :label="`${dept}（${getDepartmentMemberCount(dept)} 人）`" :value="dept" />
              </el-select>
            </div>
            <div class="filter-field">
              <label class="filter-label">
                人员
              </label>
              <el-select v-model="selectedUser" class="filter-control" placeholder="请选择人员" filterable clearable
                size="default" :disabled="!selectedDepartment">
                <el-option v-for="opt in userOptions" :key="opt.value" :label="opt.label" :value="opt.value" />
              </el-select>
            </div>
          </div>
        </div>

        <div class="table-panel" ref="containerRef">
          <el-table v-if="!isMobile && showTaskPanel" class="data-table" :data="currentTableTasks"
            :style="{ width: '100%' }" :height="tableHeight" row-key="rowKey" stripe border>
            <el-table-column prop="project_name" label="项目名称" min-width="80" show-overflow-tooltip>
              <template #default="{ row }">
                <el-link v-if="getProjectId(row)" type="primary" :underline="false" class="cell-link"
                  @click.stop="goProjectDetail(row)">
                  {{ row.project_name || "-" }}
                </el-link>
                <span v-else>{{ row.project_name || "-" }}</span>
              </template>
            </el-table-column>
            <el-table-column prop="任务名" label="任务名称" min-width="140" show-overflow-tooltip>
              <template #default="{ row }">
                <el-link v-if="getTaskId(row)" type="primary" :underline="false" class="cell-link"
                  @click.stop="goTaskDetail(row)">
                  {{ row.任务名 || row.task_name || row.title || "-" }}
                </el-link>
                <span v-else>{{ row.任务名 || row.task_name || row.title || "-" }}</span>
              </template>
            </el-table-column>
            <el-table-column prop="requirement_name" label="关联层级" min-width="120" show-overflow-tooltip />
            <el-table-column prop="当前处理人" label="责任人" min-width="120">
              <template #default="{ row }">
                <div class="assignee-chips">
                  <el-tag type="primary" size="small" effect="light" class="assignee-chips__tag">
                    <span class="assignee-text">{{ row.当前处理人 || row.assignee || "-" }}</span>
                  </el-tag>
                </div>
              </template>
            </el-table-column>
            <el-table-column prop="状态" label="状态" width="150" align="center">
              <template #default="{ row }">
                <el-tag :type="getStatusType(row.状态 || row.status, row) || undefined" size="small" effect="light">
                  {{ row.状态 || row.status || "-" }}
                </el-tag>
              </template>
            </el-table-column>
            <el-table-column prop="优先级" label="优先级" width="96" align="center">
              <template #default="{ row }">
                <el-tag :type="getPriorityType(row.优先级 || row.priority) || undefined" size="small">
                  {{ row.优先级 || row.priority || "-" }}
                </el-tag>
              </template>
            </el-table-column>
            <!-- <el-table-column prop="进度" label="进度" min-width="140">
              <template #default="{ row }">
                <el-progress :percentage="row.进度 || 0" :stroke-width="10"
                  :status="row.进度 === 100 ? 'success' : undefined" />
              </template>
            </el-table-column> -->
            <el-table-column prop="task_deadline" label="任务完成期限" min-width="120" show-overflow-tooltip />
            <el-table-column prop="create_time" label="创建时间" min-width="160" show-overflow-tooltip />
          </el-table>
          <div v-else-if="isMobile && showTaskPanel" class="mobile-task-list">
            <template v-if="currentTableTasks.length > 0">
              <div v-for="row in currentTableTasks" :key="row.rowKey" class="mobile-task-card">
                <div class="mobile-task-card__row mobile-task-card__row--project">
                  <span class="mobile-task-card__label">项目</span>
                  <span class="mobile-task-card__value">
                    <el-link v-if="getProjectId(row)" type="primary" :underline="false" class="cell-link"
                      @click.stop="goProjectDetail(row)">
                      {{ row.project_name || "-" }}
                    </el-link>
                    <span v-else>{{ row.project_name || "-" }}</span>
                  </span>
                </div>
                <div class="mobile-task-card__title">
                  <el-link v-if="getTaskId(row)" type="primary" :underline="false"
                    class="cell-link mobile-task-card__title-link" @click.stop="goTaskDetail(row)">
                    {{ row.任务名 || row.task_name || row.title || "-" }}
                  </el-link>
                  <span v-else>{{ row.任务名 || row.task_name || row.title || "-" }}</span>
                </div>
                <div class="mobile-task-card__meta">
                  <el-tag :type="getStatusType(row.状态 || row.status, row) || undefined" size="small" effect="light">
                    {{ row.状态 || row.status || "-" }}
                  </el-tag>
                  <el-tag :type="getPriorityType(row.优先级 || row.priority) || undefined" size="small">
                    {{ row.优先级 || row.priority || "-" }}
                  </el-tag>
                </div>
                <div class="mobile-task-card__row">
                  <span class="mobile-task-card__label">关联层级</span>
                  <span class="mobile-task-card__value">{{ row.requirement_name || "-" }}</span>
                </div>
                <div class="mobile-task-card__row">
                  <span class="mobile-task-card__label">责任人</span>
                  <span class="mobile-task-card__value mobile-task-card__value--chips">
                    <span class="assignee-chips assignee-chips--compact">
                      <el-tag type="primary" size="small" effect="light" class="assignee-chips__tag">
                        <span class="assignee-text">{{ row.当前处理人 || row.assignee || "-" }}</span>
                      </el-tag>
                    </span>
                  </span>
                </div>
                <div class="mobile-task-card__row">
                  <span class="mobile-task-card__label">进度</span>
                  <span class="mobile-task-card__value mobile-task-card__progress-wrap">
                    <el-progress :percentage="row.进度 || 0" :stroke-width="8"
                      :status="row.进度 === 100 ? 'success' : undefined" class="mobile-task-card__progress" />
                  </span>
                </div>
                <div class="mobile-task-card__row">
                  <span class="mobile-task-card__label">完成期限</span>
                  <span class="mobile-task-card__value">{{ row.task_deadline || "-" }}</span>
                </div>
                <div class="mobile-task-card__row">
                  <span class="mobile-task-card__label">创建时间</span>
                  <span class="mobile-task-card__value">{{ row.create_time || "-" }}</span>
                </div>
              </div>
            </template>
            <el-empty v-else description="当前范围暂无任务" :image-size="72" class="mobile-task-list__empty" />
          </div>
          <div v-else class="table-placeholder">
            <el-empty description="请在上方选择部门与人员" :image-size="120" />
          </div>
        </div>
      </template>
      <div v-else class="empty-page">
        <el-empty description="暂无部门人员数据" :image-size="140" />
      </div>
    </el-card>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch, onMounted, onUnmounted, nextTick } from "vue";
import { useRouter } from "vue-router";
import { ElMessage } from "element-plus";
import { deviceDetection } from "@pureadmin/utils";
import { selectTaskStatistics } from "@/api/project";
import { selectAllUsers } from "@/api/system";
import { TaskStatus } from "@/types";

const router = useRouter();

/** 人员「全部」选项值，对应 task_select 传 user_name 空串 */
const USER_ALL = "__ALL__";

type DeptMember = {
  username: string;
  role?: string[];
  department?: string;
  _id?: string;
};

const orgLoading = ref(false);
const tasksLoading = ref(false);
/** 部门名 -> 成员列表（来自 department/select_all_users） */
const deptMembersMap = ref<Record<string, DeptMember[]>>({});
/** 当前部门 + 人员筛选下的任务列表（来自 selectTaskStatistics） */
const currentTaskList = ref<any[]>([]);
const selectedDepartment = ref<string>("");
const selectedUser = ref<string>("");
const containerRef = ref<HTMLElement>();
const tableHeight = ref<number>(800);

const MOBILE_BREAKPOINT = 768;
const isNarrowScreen = ref(typeof window !== "undefined" && window.innerWidth <= MOBILE_BREAKPOINT);
const isMobile = computed(() => deviceDetection() || isNarrowScreen.value);

const hasData = computed(() => Object.keys(deptMembersMap.value).length > 0);

const departmentKeys = computed(() => Object.keys(deptMembersMap.value));

const userOptions = computed(() => {
  const dept = selectedDepartment.value;
  const members = deptMembersMap.value[dept];
  if (!dept || !members?.length) return [];
  return [
    { value: USER_ALL, label: "全部成员（部门汇总）" },
    ...members.map((m) => ({
      value: m.username,
      label: getMemberOptionLabel(m)
    }))
  ];
});

const currentTableTasks = computed(() => {
  return currentTaskList.value.map((task: any, index: number) => {
    const taskId = task._id || task.id;
    const rowKey = taskId ? String(taskId) : `task_${index}`;
    return {
      ...task,
      rowKey
    };
  });
});

/** 有初始空参任务数据，或已选部门+人员时展示任务区 */
const showTaskPanel = computed(
  () =>
    currentTableTasks.value.length > 0 ||
    !!(selectedDepartment.value && selectedUser.value)
);

const roleMap: Record<string, string> = {
  Admin: "管理员",
  ProjectManager: "项目经理",
  ProjectDirector: "项目总监",
  DepartmentManager: "部门负责人",
  Member: "普通成员",
  BusinessDepartmentMembers: "业务部门成员"
};

const formatRole = (roles: string[]): string => {
  if (!roles || roles.length === 0) return "";
  return roles.map(role => roleMap[role] || role).join("、");
};

const getMemberOptionLabel = (m: DeptMember): string => {
  const roleText = formatRole(m.role || []);
  return roleText ? `${m.username} [${roleText}]` : m.username;
};

const getDepartmentMemberCount = (departmentName: string): number => {
  return deptMembersMap.value[departmentName]?.length ?? 0;
};

const getProjectId = (row: Record<string, unknown>): string => {
  const v =
    row.project_id ??
    row.projectId ??
    (row.project as Record<string, unknown> | undefined)?._id ??
    (row.project as Record<string, unknown> | undefined)?.id;
  return v != null && v !== "" ? String(v).trim() : "";
};

const getTaskId = (row: Record<string, unknown>): string => {
  const v = row._id ?? row.id;
  return v != null && v !== "" ? String(v).trim() : "";
};

const goProjectDetail = (row: Record<string, unknown>) => {
  const pid = getProjectId(row);
  if (!pid) {
    ElMessage.warning("缺少项目信息，无法跳转");
    return;
  }
  router.push({ name: "ProjectDetail", params: { id: pid } }).catch(() => { });
};

const goTaskDetail = (row: Record<string, unknown>) => {
  const tid = getTaskId(row);
  if (!tid) {
    ElMessage.warning("缺少任务信息，无法跳转");
    return;
  }
  try {
    sessionStorage.setItem(`task_${tid}`, JSON.stringify(row));
  } catch {
    /* ignore quota / private mode */
  }
  const projectId = getProjectId(row);
  const query: Record<string, string> = { from: "department-task-statistics" };
  if (projectId) {
    query.project_id = projectId;
    const pn = row.project_name;
    if (pn != null && String(pn) !== "") query.project_name = String(pn);
  }
  router.push({ name: "TaskDetail", params: { id: tid }, query }).catch(() => { });
};

const handleDepartmentChange = () => {
  if (!selectedDepartment.value) {
    selectedUser.value = "";
    return;
  }
  selectedUser.value = USER_ALL;
};

const getStatusType = (
  status: string,
  row: any
): "success" | "info" | "warning" | "danger" | "" => {
  if (!status) return "";
  const map: Record<string, "success" | "info" | "warning" | "danger" | ""> = {
    [TaskStatus.PENDING_ASSIGN_TO_DEPT_LEADER]: "warning",
    [TaskStatus.PENDING_ASSIGN_TO_MEMBER]: "warning",
    [TaskStatus.NOT_STARTED]: "info",
    [TaskStatus.IN_PROGRESS]: "warning",
    [TaskStatus.PENDING_TEST]: "info",
    [TaskStatus.TESTING]: "warning",
    [TaskStatus.TEST_COMPLETED]: "success",
    [TaskStatus.PENDING_REVIEW]: "info",
    [TaskStatus.REVIEWING]: "warning",
    [TaskStatus.REVIEW_COMPLETED]: "success",
    [TaskStatus.CANCELLED]: "danger",
    [TaskStatus.COMPLETED]: "success"
  };
  return map[status] || "info";
};

const getPriorityType = (
  priority: string
): "success" | "info" | "warning" | "danger" | "" => {
  const map: Record<string, "success" | "info" | "warning" | "danger" | ""> = {
    低: "info",
    中: "warning",
    高: "danger",
    紧急: "danger"
  };
  return map[priority] || "";
};

const calculateTableHeight = () => {
  nextTick(() => {
    if (!containerRef.value || isMobile.value) return;

    const viewportHeight = window.innerHeight;
    const containerRect = containerRef.value.getBoundingClientRect();
    const containerTopToViewportBottom = viewportHeight - containerRect.top;
    const bottomPadding = 28;
    const chromeBelowTable = 32;
    const availableHeight =
      containerTopToViewportBottom - bottomPadding - chromeBelowTable;

    tableHeight.value = Math.max(400, availableHeight);
  });
};

const handleResize = () => {
  isNarrowScreen.value = window.innerWidth <= MOBILE_BREAKPOINT;
  calculateTableHeight();
};

/** 解析 select_all_users：result 为 [{ 部门名: 成员[] }, ...] 或单层对象 */
const parseDeptMembersFromSelectAllUsers = (raw: unknown): Record<string, DeptMember[]> => {
  const out: Record<string, DeptMember[]> = {};
  if (raw == null) return out;

  const ingest = (chunk: Record<string, unknown>) => {
    for (const dept of Object.keys(chunk)) {
      const arr = chunk[dept];
      if (!Array.isArray(arr)) continue;
      if (!out[dept]) out[dept] = [];
      out[dept].push(...(arr as DeptMember[]));
    }
  };

  if (Array.isArray(raw)) {
    raw.forEach((item) => {
      if (item && typeof item === "object" && !Array.isArray(item)) {
        ingest(item as Record<string, unknown>);
      }
    });
    return out;
  }

  if (typeof raw === "object" && !Array.isArray(raw)) {
    ingest(raw as Record<string, unknown>);
  }

  return out;
};

/** 将 task_select 返回体规范为任务数组 */
const normalizeTaskSelectRows = (raw: unknown): any[] => {
  if (raw == null) return [];
  if (Array.isArray(raw)) return raw;
  if (typeof raw === "object") {
    const o = raw as Record<string, unknown>;
    if (Array.isArray(o.task_list)) return o.task_list as any[];
    if (Array.isArray(o.tasks)) return o.tasks as any[];
    if (Array.isArray(o.list)) return o.list as any[];
    if (Array.isArray(o.data)) return o.data as any[];
  }
  return [];
};

const loadDepartmentMembers = async () => {
  orgLoading.value = true;
  try {
    const res = await selectAllUsers();
    const raw = (res.result ?? res.data) as unknown;
    if (res.code === 200 && raw != null) {
      deptMembersMap.value = parseDeptMembersFromSelectAllUsers(raw);
      selectedDepartment.value = "";
      selectedUser.value = "";
      calculateTableHeight();
    } else {
      ElMessage.error("加载部门人员失败");
      deptMembersMap.value = {};
      selectedDepartment.value = "";
      selectedUser.value = "";
      currentTaskList.value = [];
    }
  } catch (error: any) {
    console.error("加载部门人员失败:", error);
    ElMessage.error(error?.response?.data?.message || error?.message || "加载部门人员失败");
    deptMembersMap.value = {};
    selectedDepartment.value = "";
    selectedUser.value = "";
    currentTaskList.value = [];
  } finally {
    orgLoading.value = false;
  }
};

/** 请求任务统计：允许部门、人员均为空（页面初始化与清空筛选时传空参） */
const fetchTaskStatistics = async (department: string, user: string) => {
  tasksLoading.value = true;
  try {
    const userNameParam = user === USER_ALL ? "" : user;
    const res = await selectTaskStatistics({
      department: (department || "").trim(),
      user_name: (userNameParam || "").trim()
    });
    const raw = (res.result ?? res.data) as unknown;
    if (res.code === 200 && raw != null) {
      currentTaskList.value = normalizeTaskSelectRows(raw);
      calculateTableHeight();
    } else {
      ElMessage.error("加载任务统计失败");
      currentTaskList.value = [];
    }
  } catch (error: any) {
    console.error("加载任务统计失败:", error);
    ElMessage.error(error?.response?.data?.message || error?.message || "加载任务统计失败");
    currentTaskList.value = [];
  } finally {
    tasksLoading.value = false;
  }
};

watch(
  () => [selectedDepartment.value, selectedUser.value] as const,
  ([dept, user]) => {
    void fetchTaskStatistics(dept || "", user || "");
  },
  { immediate: true }
);

onMounted(() => {
  void loadDepartmentMembers();
  calculateTableHeight();
  window.addEventListener("resize", handleResize);
});
onUnmounted(() => {
  window.removeEventListener("resize", handleResize);
});
</script>

<style scoped lang="scss">
.dept-task-stat {
  box-sizing: border-box;
  width: 100%;
  max-width: 100%;
  min-width: 0;
  margin: 0;
  padding: 0 0 20px;
}

.main-card {
  width: 100%;
  max-width: 100%;
  border-radius: 8px;
  border: 1px solid var(--el-border-color-lighter);

  :deep(.el-card__body) {
    padding: 16px;
    box-sizing: border-box;
  }
}

.toolbar {
  margin-bottom: 16px;
  width: 99%;
}

.toolbar__filters {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 12px 16px;
  width: 100%;
}

.filter-field {
  display: flex;
  flex-direction: row;
  align-items: center;
  gap: 10px;
  flex: 0 0 auto;
  min-width: 0;
}

.filter-label {
  flex: 0 0 auto;
  min-width: 3em;
  margin: 0;
  padding: 0;
  font-size: 14px;
  font-weight: 500;
  color: var(--el-text-color-regular);
  line-height: 32px;
  text-align: right;
}

.filter-control {
  flex: 0 0 auto;
  width: 200px;
  max-width: 100%;
}

.table-panel {
  width: 99%;
  max-width: 100%;
  min-height: 280px;
  border-radius: 8px;
  overflow: hidden;
  border: 1px solid var(--el-border-color-lighter);
  box-sizing: border-box;
}

.data-table {
  :deep(.el-table__header th) {
    font-weight: 600;
    background: var(--el-fill-color-light) !important;
  }
}

.table-placeholder {
  display: flex;
  align-items: center;
  justify-content: center;
  min-height: 320px;
  padding: 24px 16px;
  background: var(--el-fill-color-blank);
}

.empty-page {
  display: flex;
  align-items: center;
  justify-content: center;
  min-height: 360px;
  padding: 40px 16px;
}

.assignee-chips {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 8px;
}

.assignee-chips__tag {
  margin: 0;
  border: none;
  max-width: 100%;
}

.assignee-text {
  color: var(--el-color-primary);
}

.assignee-text-dept {
  color: var(--el-color-success);
}

.assignee-chips--compact {
  gap: 6px;
}

.cell-link {
  font-weight: inherit;
}

.mobile-task-card__row--project {
  border-top: none;
  padding-top: 0;
  padding-bottom: 2px;
}

.mobile-task-card__title-link {
  font-size: 15px;
  font-weight: 600;
  line-height: 1.45;
}

.mobile-task-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
  padding: 4px 0 8px;
}

.mobile-task-list__empty {
  padding: 24px 0;
}

.mobile-task-card {
  padding: 14px 14px 12px;
  background: var(--el-bg-color);
  border: 1px solid var(--el-border-color-lighter);
  border-radius: 10px;
  box-shadow: 0 1px 2px rgb(0 0 0 / 4%);
}

.mobile-task-card__title {
  font-size: 15px;
  font-weight: 600;
  color: var(--el-text-color-primary);
  line-height: 1.45;
  margin-bottom: 10px;
  word-break: break-word;
}

.mobile-task-card__meta {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  margin-bottom: 12px;
}

.mobile-task-card__row {
  display: flex;
  align-items: flex-start;
  gap: 10px;
  padding: 6px 0;
  font-size: 13px;
  border-top: 1px solid var(--el-border-color-extra-light);
}

.mobile-task-card__row:first-of-type {
  border-top: none;
  padding-top: 0;
}

.mobile-task-card__label {
  flex: 0 0 5.5em;
  color: var(--el-text-color-secondary);
  line-height: 1.5;
}

.mobile-task-card__value {
  flex: 1 1 0;
  min-width: 0;
  color: var(--el-text-color-regular);
  line-height: 1.5;
  word-break: break-word;
}

.mobile-task-card__value--chips {
  line-height: inherit;
}

.mobile-task-card__progress-wrap {
  padding-top: 2px;
}

.mobile-task-card__progress {
  width: 100%;
}

@media (max-width: 768px) {
  .dept-task-stat.is-mobile {
    padding: 0 0 16px;
  }

  .dept-task-stat.is-mobile .main-card :deep(.el-card__body) {
    padding: 12px;
  }

  .toolbar__filters {
    flex-direction: column;
    align-items: stretch;
    gap: 14px;
  }

  .filter-field {
    align-items: flex-start;
    flex-direction: column;
    gap: 6px;
    flex: 1 1 auto;
  }

  .filter-label {
    width: auto;
    min-width: 0;
    text-align: left;
    line-height: 1.4;
  }

  .filter-control {
    width: 100%;
  }

  .dept-task-stat.is-mobile .table-panel {
    min-height: 0;
    overflow: visible;
    border: none;
    background: transparent;
  }

  .dept-task-stat.is-mobile .table-placeholder {
    min-height: 240px;
    padding: 20px 12px;
  }
}
</style>