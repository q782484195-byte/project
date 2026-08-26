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
            <div class="filter-field">
              <label class="filter-label">
                项目类型
              </label>
              <el-select v-model="selectedProjectType" class="filter-control" placeholder="请选择项目类型" clearable
                size="default">
                <el-option label="定制项目" value="定制项目" />
                <el-option label="公模项目" value="公模项目" />
              </el-select>
            </div>
            <div class="filter-field">
              <label class="filter-label">
                项目名称
              </label>
              <el-input v-model="projectName" class="filter-control" placeholder="请输入项目名称" clearable size="default" />
            </div>
          </div>
        </div>

        <div class="statistics-table-wrap" ref="containerRef" :style="wrapStyle">
          <TablePanel :loading="tasksLoading" @refresh="handleTableRefresh" @fullscreen-change="calculateTableHeight">
            <template v-if="!isMobile && showTaskPanel">
              <div v-if="currentTaskGroups.length" class="project-tables">
                <section v-for="group in currentTaskGroups" :key="group.groupKey" class="project-table-block">
                  <div class="project-table-block__header">
                    <el-link v-if="group.projectId" type="primary" :underline="false" class="project-table-block__title"
                      @click.stop="goProjectByGroup(group)">
                      {{ group.projectName }}
                    </el-link>
                    <span v-else class="project-table-block__title">{{ group.projectName }}</span>
                    <span class="project-table-block__count">{{ group.tasks.length }} 项任务</span>
                  </div>
                  <el-table class="data-table" :data="group.tasks" :style="{ width: '100%' }"
                    :max-height="tableMaxHeight" row-key="rowKey" stripe border :cell-style="getTaskCellStyle">
                    <el-table-column prop="任务名" label="任务名称" min-width="140" show-overflow-tooltip>
                      <template #default="{ row }">
                        <el-link v-if="getTaskId(row)" type="primary" :underline="false" class="cell-link"
                          @click.stop="goTaskDetail(row)">
                          {{ row.任务名 || row.task_name || row.title || "-" }}
                        </el-link>
                        <span v-else>{{ row.任务名 || row.task_name || row.title || "-" }}</span>
                      </template>
                    </el-table-column>
                    <el-table-column prop="department" label="部门" min-width="100" show-overflow-tooltip>
                      <template #default="{ row }">
                        {{ row.department || "" }}
                      </template>
                    </el-table-column>
                    <el-table-column prop="当前处理人" label="责任人" min-width="120">
                      <template #default="{ row }">
                        <DailyTaskAssigneeTags v-if="shouldUseAssignerTags(row)" :task="row" />
                        <span v-else>{{ getTaskAssigneeDisplay(row) }}</span>
                      </template>
                    </el-table-column>
                    <el-table-column prop="状态" label="状态" width="150" align="center">
                      <template #default="{ row }">
                        <el-tag :type="getStatusType(row.状态 || row.status, row) || undefined" size="small"
                          effect="light">
                          {{ getDisplayStatus(row) }}
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
                    <el-table-column prop="task_deadline" label="任务完成期限" min-width="120" show-overflow-tooltip />
                    <el-table-column prop="create_time" label="任务分配时间" min-width="160" show-overflow-tooltip />
                  </el-table>
                </section>
              </div>
              <el-empty v-else description="当前范围暂无任务" :image-size="120" />
            </template>
            <div v-else-if="isMobile && showTaskPanel" class="mobile-task-list">
              <template v-if="currentTaskGroups.length > 0">
                <section v-for="group in currentTaskGroups" :key="group.groupKey" class="mobile-project-block">
                  <div class="mobile-project-block__header">
                    <el-link v-if="group.projectId" type="primary" :underline="false"
                      class="mobile-project-block__title" @click.stop="goProjectByGroup(group)">
                      {{ group.projectName }}
                    </el-link>
                    <span v-else class="mobile-project-block__title">{{ group.projectName }}</span>
                    <span class="mobile-project-block__count">{{ group.tasks.length }} 项任务</span>
                  </div>
                  <div v-for="row in group.tasks" :key="row.rowKey" class="mobile-task-card"
                    :style="getTaskCardStyle(row)">
                    <div class="mobile-task-card__title">
                      <span class="mobile-task-card__label">任务名称</span>
                      <span class="mobile-task-card__value" style="margin-left: 20px;">
                        <el-link v-if="getTaskId(row)" type="primary" :underline="false" class="cell-link"
                          @click.stop="goTaskDetail(row)">
                          {{ row.任务名 || row.task_name || row.title || "-" }}
                        </el-link>
                        <span v-else>{{ row.任务名 || row.task_name || row.title || "-" }}</span>
                      </span>
                    </div>
                    <div class="mobile-task-card__meta">
                      <el-tag :type="getStatusType(row.状态 || row.status, row) || undefined" size="small"
                        effect="light">
                        {{ getDisplayStatus(row) }}
                      </el-tag>
                      <el-tag :type="getPriorityType(row.优先级 || row.priority) || undefined" size="small">
                        {{ row.优先级 || row.priority || "-" }}
                      </el-tag>
                    </div>
                    <div class="mobile-task-card__row">
                      <span class="mobile-task-card__label">部门</span>
                      <span class="mobile-task-card__value">{{ row.department || "" }}</span>
                    </div>
                    <div class="mobile-task-card__row">
                      <span class="mobile-task-card__label">责任人</span>
                      <span class="mobile-task-card__value">
                        <DailyTaskAssigneeTags v-if="shouldUseAssignerTags(row)" :task="row" />
                        <span v-else>{{ getTaskAssigneeDisplay(row) }}</span>
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
                </section>
              </template>
              <el-empty v-else description="当前范围暂无任务" :image-size="72" class="mobile-task-list__empty" />
            </div>
            <div v-else class="table-placeholder">
              <el-empty description="请在上方选择部门与人员" :image-size="120" />
            </div>
          </TablePanel>
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
import { selectAllUsers, flattenDepartmentSelectUsers } from "@/api/system";
import { getTaskAssigneeText } from "@/api/daily-task";
import DailyTaskAssigneeTags from "@/components/DailyTaskAssigneeTags.vue";
import TablePanel from "@/components/TablePanel/index.vue";
import { TABLE_PANEL_TOOLBAR_HEIGHT } from "@/components/TablePanel/constants";
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

type ProjectTaskGroup = {
  groupKey: string;
  projectName: string;
  projectId: string;
  tasks: any[];
};

const orgLoading = ref(false);
const tasksLoading = ref(false);
/** 部门名 -> 成员列表（来自 department/select_all_users） */
const deptMembersMap = ref<Record<string, DeptMember[]>>({});
/** 当前筛选下按项目拆分的任务分组（来自 selectTaskStatistics） */
const currentTaskGroups = ref<ProjectTaskGroup[]>([]);
const selectedDepartment = ref<string>("");
const selectedUser = ref<string>("");
const selectedProjectType = ref<string>("定制项目");
const projectName = ref<string>("");
const containerRef = ref<HTMLElement>();
const wrapHeight = ref<number>(800);
const tableMaxHeight = ref<number>(480);

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

const wrapStyle = computed(() => {
  if (isMobile.value) return {};
  return { height: `${wrapHeight.value}px` };
});

/** 有初始空参任务数据，或已选部门+人员时展示任务区 */
const showTaskPanel = computed(
  () =>
    currentTaskGroups.value.length > 0 ||
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

/** 日常任务或多指派人：用 assigner_fished 展示绿色标签 */
const shouldUseAssignerTags = (row: any): boolean =>
  row?.daily_task === true || Array.isArray(row?.assigner_fished);

const getTaskAssigneeDisplay = (row: any): string => {
  const text = getTaskAssigneeText(row);
  if (text !== "-") return text;
  return row.当前处理人 || row.assignee || "-";
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

const goProjectByGroup = (group: ProjectTaskGroup) => {
  goProjectDetail({
    project_id: group.projectId,
    project_name: group.projectName
  });
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

const isTaskDelayed = (row: any): boolean => row?.delay?.task_is_delay === true;

const getDisplayStatus = (row: any): string => {
  if (isTaskDelayed(row)) return "延期";
  return row.状态 || row.status || "-";
};

const getStatusType = (
  status: string,
  row: any
): "success" | "info" | "warning" | "danger" | "" => {
  if (isTaskDelayed(row)) return "danger";
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

/** 接口 show_color 对应浅色行背景 */
const TASK_SHOW_COLOR_MAP: Record<string, string> = {
  red: "#fef0f0",
  green: "#f0f9eb",
  blue: "#ecf5ff",
  yellow: "#fdfce6",
  orange: "#fdf6ec",
  purple: "#f5f0ff",
  gray: "#f4f4f5",
  grey: "#f4f4f5",
  pink: "#fef0f5",
  cyan: "#e8f8f8"
};

const getTaskShowColorBackground = (showColor?: string) => {
  if (!showColor) return undefined;
  return TASK_SHOW_COLOR_MAP[showColor.trim().toLowerCase()];
};

const getTaskCellStyle = ({ row }: { row: Record<string, unknown> }) => {
  const bg = getTaskShowColorBackground(row.show_color as string | undefined);
  return bg ? { backgroundColor: bg } : {};
};

const getTaskCardStyle = (row: Record<string, unknown>) => {
  const bg = getTaskShowColorBackground(row.show_color as string | undefined);
  return bg ? { backgroundColor: bg } : {};
};

const calculateTableHeight = () => {
  nextTick(() => {
    if (!containerRef.value || isMobile.value) return;

    const viewportHeight = window.innerHeight;
    const containerRect = containerRef.value.getBoundingClientRect();
    const containerTopToViewportBottom = viewportHeight - containerRect.top;
    const bottomPadding = 28;
    const availableHeight = containerTopToViewportBottom - bottomPadding;

    wrapHeight.value = Math.max(400, availableHeight);
    tableMaxHeight.value = Math.max(
      280,
      Math.min(520, availableHeight - TABLE_PANEL_TOOLBAR_HEIGHT - 56)
    );
  });
};

const handleResize = () => {
  isNarrowScreen.value = window.innerWidth <= MOBILE_BREAKPOINT;
  calculateTableHeight();
};

const handleTableRefresh = () => {
  void fetchTaskStatistics(
    selectedDepartment.value || "",
    selectedUser.value || "",
    selectedProjectType.value,
    projectName.value
  );
};

/** 将 select_all_users 解析为 部门 -> 成员列表（兼容分组结构） */
const buildDeptMembersMap = (raw: unknown): Record<string, DeptMember[]> => {
  const out: Record<string, DeptMember[]> = {};
  flattenDepartmentSelectUsers(raw).forEach(user => {
    const dept = user.department;
    if (!dept) return;
    if (!out[dept]) out[dept] = [];
    if (out[dept].some(member => member.username === user.username)) return;
    out[dept].push({
      username: user.username,
      role: Array.isArray(user.role)
        ? user.role
        : user.role
          ? [user.role]
          : [],
      department: dept,
      _id: user._id
    });
  });
  return out;
};

const withTaskRowKeys = (tasks: any[], groupKey: string): any[] => {
  return (Array.isArray(tasks) ? tasks : []).map((task: any, index: number) => {
    const taskId = task?._id || task?.id;
    const rowKey = taskId ? String(taskId) : `${groupKey}_${index}`;
    return {
      ...task,
      rowKey
    };
  });
};

const buildGroupFromTasks = (
  projectNameValue: string,
  tasks: any[],
  fallbackIndex = 0
): ProjectTaskGroup | null => {
  const rows = withTaskRowKeys(tasks, `${projectNameValue}_${fallbackIndex}`);
  if (!rows.length) return null;
  const first = rows[0] as Record<string, unknown>;
  const projectId = getProjectId(first);
  return {
    groupKey: projectId || `${projectNameValue}_${fallbackIndex}`,
    projectName: projectNameValue || String(first.project_name || "未分组项目"),
    projectId,
    tasks: rows
  };
};

const groupTasksByProject = (tasks: any[]): ProjectTaskGroup[] => {
  const map = new Map<string, any[]>();
  (Array.isArray(tasks) ? tasks : []).forEach(task => {
    const name = String(task?.project_name || task?.projectName || "未分组项目");
    const id = String(task?.project_id || task?.projectId || "");
    const key = id || name;
    if (!map.has(key)) map.set(key, []);
    map.get(key)!.push(task);
  });
  return Array.from(map.entries())
    .map(([key, list], index) =>
      buildGroupFromTasks(list[0]?.project_name || list[0]?.projectName || key, list, index)
    )
    .filter((group): group is ProjectTaskGroup => group != null);
};

const NESTED_TASK_ARRAY_KEYS = ["task_list", "tasks", "list", "data"] as const;

/** 将 task_select 返回体规范为按项目拆分的任务分组 */
const normalizeTaskSelectGroups = (raw: unknown): ProjectTaskGroup[] => {
  if (raw == null) return [];
  if (Array.isArray(raw)) return groupTasksByProject(raw);
  if (typeof raw !== "object") return [];

  const o = raw as Record<string, unknown>;
  for (const key of NESTED_TASK_ARRAY_KEYS) {
    if (Array.isArray(o[key])) return groupTasksByProject(o[key] as any[]);
  }

  const entries = Object.entries(o);
  const looksGrouped = entries.length > 0 && entries.every(([, value]) => Array.isArray(value));
  if (looksGrouped) {
    return entries
      .map(([name, tasks], index) => buildGroupFromTasks(name, tasks as any[], index))
      .filter((group): group is ProjectTaskGroup => group != null);
  }

  return [];
};

const loadDepartmentMembers = async () => {
  orgLoading.value = true;
  try {
    const res = await selectAllUsers();
    const raw = (res.result ?? res.data) as unknown;
    if (res.code === 200 && raw != null) {
      deptMembersMap.value = buildDeptMembersMap(raw);
      selectedDepartment.value = "";
      selectedUser.value = "";
      calculateTableHeight();
    } else {
      ElMessage.error("加载部门人员失败");
      deptMembersMap.value = {};
      selectedDepartment.value = "";
      selectedUser.value = "";
      currentTaskGroups.value = [];
    }
  } catch (error: any) {
    console.error("加载部门人员失败:", error);
    ElMessage.error(error?.response?.data?.message || error?.message || "加载部门人员失败");
    deptMembersMap.value = {};
    selectedDepartment.value = "";
    selectedUser.value = "";
    currentTaskGroups.value = [];
  } finally {
    orgLoading.value = false;
  }
};

/** 请求任务统计：允许部门、人员均为空（页面初始化与清空筛选时传空参） */
const fetchTaskStatistics = async (
  department: string,
  user: string,
  projectType: string,
  projectNameValue: string
) => {
  tasksLoading.value = true;
  try {
    const userNameParam = user === USER_ALL ? "" : user;
    const res = await selectTaskStatistics({
      department: (department || "").trim(),
      user_name: (userNameParam || "").trim(),
      project_type: (projectType || "").trim(),
      project_name: (projectNameValue || "").trim()
    });
    const raw = (res.result ?? res.data) as unknown;
    if (res.code === 200 && raw != null) {
      currentTaskGroups.value = normalizeTaskSelectGroups(raw);
      calculateTableHeight();
    } else {
      ElMessage.error("加载任务统计失败");
      currentTaskGroups.value = [];
    }
  } catch (error: any) {
    console.error("加载任务统计失败:", error);
    ElMessage.error(error?.response?.data?.message || error?.message || "加载任务统计失败");
    currentTaskGroups.value = [];
  } finally {
    tasksLoading.value = false;
  }
};

watch(
  () =>
    [
      selectedDepartment.value,
      selectedUser.value,
      selectedProjectType.value,
      projectName.value
    ] as const,
  ([dept, user, projectType, projectNameValue]) => {
    void fetchTaskStatistics(dept || "", user || "", projectType, projectNameValue);
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

.statistics-table-wrap {
  width: 99%;
  max-width: 100%;
  min-height: 280px;
  border-radius: 8px;
  overflow: hidden;
  border: 1px solid var(--el-border-color-lighter);
  box-sizing: border-box;

  :deep(.table-panel) {
    height: 100%;
    min-height: 0;
  }

  :deep(.table-panel__body) {
    overflow: auto;
  }

  :deep(.table-panel--fullscreen .table-panel__body) {
    display: block;
    overflow: auto;
  }
}

.project-tables {
  display: flex;
  flex-direction: column;
  gap: 20px;
  padding-bottom: 8px;
}

.project-table-block + .project-table-block {
  padding-top: 4px;
}

.project-table-block__header {
  display: flex;
  align-items: baseline;
  flex-wrap: wrap;
  gap: 8px 12px;
  margin-bottom: 8px;
}

.project-table-block__title {
  font-size: 15px;
  font-weight: 600;
  line-height: 1.4;
  color: var(--el-text-color-primary);
}

.project-table-block__count {
  font-size: 13px;
  font-weight: 400;
  color: var(--el-text-color-secondary);
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

.mobile-project-block {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.mobile-project-block + .mobile-project-block {
  margin-top: 4px;
  padding-top: 16px;
  border-top: 1px dashed var(--el-border-color-light);
}

.mobile-project-block__header {
  display: flex;
  align-items: baseline;
  flex-wrap: wrap;
  gap: 6px 10px;
  padding: 4px 2px 0;
}

.mobile-project-block__title {
  font-size: 15px;
  font-weight: 600;
  line-height: 1.4;
  color: var(--el-text-color-primary);
}

.mobile-project-block__count {
  font-size: 12px;
  color: var(--el-text-color-secondary);
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

  .dept-task-stat.is-mobile .statistics-table-wrap {
    height: auto !important;
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