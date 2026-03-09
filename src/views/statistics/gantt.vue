<template>
  <div class="gantt-page">
    <el-card v-loading="loading" class="gantt-card">
      <template #header>
        <div class="card-header">
          <span class="title">任务甘特图</span>
          <div class="header-actions">
            <el-select v-model="filterDepartment" placeholder="筛选部门" clearable class="filter-select"
              @change="applyFilters">
              <el-option v-for="dept in departmentOptions" :key="dept" :label="dept" :value="dept" />
            </el-select>
            <el-select v-model="filterUser" placeholder="筛选人员" clearable class="filter-select" @change="applyFilters">
              <el-option v-for="u in userOptions" :key="u" :label="u" :value="u" />
            </el-select>
          </div>
        </div>
      </template>

      <div v-if="ganttTasks.length === 0" class="empty-state">
        <el-empty description="暂无带时间信息的任务数据" :image-size="120" />
      </div>

      <div v-else class="gantt-container" ref="ganttRef">
        <!-- 左侧任务列表 -->
        <div class="gantt-sidebar">
          <div class="sidebar-header">
            <div class="col-task">任务名称</div>
            <div class="col-dept">部门</div>
            <div class="col-user">负责人</div>
            <div class="col-status">状态</div>
          </div>
          <div v-for="(task, idx) in ganttTasks" :key="task._id || idx" class="sidebar-row"
            :class="{ 'row-hover': hoveredRow === idx }" @mouseenter="hoveredRow = idx" @mouseleave="hoveredRow = -1">
            <div class="col-task" :title="task.任务名">{{ task.任务名 || '-' }}</div>
            <div class="col-dept">{{ task.部门 || '-' }}</div>
            <div class="col-user" :title="task.当前处理人 || task.用户名 || ''">{{ task.当前处理人 || task.用户名 || '-' }}</div>
            <div class="col-status">
              <el-tag :type="getStatusTagType(task.状态)" size="small" effect="plain">{{ task.状态 || '-' }}</el-tag>
            </div>
          </div>
        </div>

        <!-- 右侧时间轴 -->
        <div class="gantt-timeline">
          <div class="timeline-header">
            <div v-for="day in dateColumns" :key="day.key" class="day-cell"
              :class="{ 'is-weekend': day.isWeekend, 'month-start': day.monthStart }">
              <span v-if="day.monthStart" class="month-label">{{ day.monthLabel }}</span>
              <span class="day-num">{{ day.day }}</span>
              <span class="day-week">{{ day.weekday }}</span>
            </div>
          </div>
          <div class="timeline-body">
            <div v-for="(task, idx) in ganttTasks" :key="task._id || idx" class="timeline-row"
              :class="{ 'row-hover': hoveredRow === idx }">
              <div v-for="day in dateColumns" :key="day.key" class="day-cell"
                :class="{ 'is-weekend': day.isWeekend }" />
              <el-tooltip v-if="task.startDate && task.endDate" placement="top" :show-after="300">
                <template #content>
                  <div>{{ task.任务名 }}</div>
                  <div class="gantt-tooltip-meta">{{ task.部门 }} · {{ task.当前处理人 || task.用户名 }}</div>
                  <div class="gantt-tooltip-meta">{{ task.startDateStr }} ~ {{ task.endDateStr }}</div>
                </template>
                <div class="task-bar-wrap" :style="getTaskBarStyle(task)" @mouseenter="hoveredRow = idx"
                  @mouseleave="hoveredRow = -1">
                  <div class="task-bar" :class="getTaskBarClass(task)">
                    <span class="task-bar-label">{{ task.任务名 || '任务' }}</span>
                  </div>
                </div>
              </el-tooltip>
            </div>
          </div>
        </div>
      </div>
    </el-card>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from "vue";
import { ElMessage } from "element-plus";
import dayjs from "dayjs";
import { getTaskStatistics } from "@/api/system";

const loading = ref(false);
const ganttRef = ref<HTMLElement>();
const hoveredRow = ref(-1);
const rawData = ref<Record<string, Array<{ username: string; role: string[]; task_list: any[] }>>>({});
const filterDepartment = ref<string>("");
const filterUser = ref<string>("");

// 解析任务日期：优先 development_start_time/development_end_time，其次 task_start_time/task_deadline，最后 create_time
function parseTaskDates(task: any): { start: Date | null; end: Date | null } {
  let startStr = task.development_start_time || task.task_start_time || task.create_time;
  let endStr = task.development_end_time || task.task_deadline;

  if (!startStr) return { start: null, end: null };
  const start = dayjs(startStr);
  if (!start.isValid()) return { start: null, end: null };

  let end = endStr ? dayjs(endStr) : start;
  if (!end.isValid()) end = start;
  if (end.isBefore(start)) end = start;

  return { start: start.toDate(), end: end.toDate() };
}

// 扁平化并解析任务
const ganttTasks = computed(() => {
  const list: any[] = [];
  const deptFilter = filterDepartment.value;
  const userFilter = filterUser.value;

  Object.entries(rawData.value).forEach(([deptName, users]) => {
    if (deptFilter && deptName !== deptFilter) return;
    if (!Array.isArray(users)) return;

    users.forEach((user: any) => {
      if (userFilter && (user?.username || "") !== userFilter) return;
      const tasks = user?.task_list || [];
      tasks.forEach((task: any) => {
        const { start, end } = parseTaskDates(task);
        if (!start || !end) return;
        list.push({
          ...task,
          部门: deptName,
          用户名: user?.username || "-",
          startDate: start,
          endDate: end,
          startDateStr: dayjs(start).format("YYYY-MM-DD"),
          endDateStr: dayjs(end).format("YYYY-MM-DD")
        });
      });
    });
  });

  return list.sort((a, b) => a.startDate.getTime() - b.startDate.getTime());
});

// 日期列
const dateColumns = computed(() => {
  const tasks = ganttTasks.value;
  if (tasks.length === 0) return [];

  let minDate = dayjs(tasks[0].startDate);
  let maxDate = dayjs(tasks[0].endDate);

  tasks.forEach((t) => {
    const s = dayjs(t.startDate);
    const e = dayjs(t.endDate);
    if (s.isBefore(minDate)) minDate = s;
    if (e.isAfter(maxDate)) maxDate = e;
  });

  // 前后各留一点余量
  minDate = minDate.subtract(3, "day");
  maxDate = maxDate.add(7, "day");

  const cols: { key: string; day: number; weekday: string; date: dayjs.Dayjs; isWeekend: boolean; monthStart: boolean; monthLabel: string }[] = [];
  let d = minDate;
  const weekdays = ["日", "一", "二", "三", "四", "五", "六"];
  let lastMonth = -1;

  while (!d.isAfter(maxDate)) {
    const dow = d.day();
    const month = d.month();
    const monthStart = month !== lastMonth;
    if (monthStart) lastMonth = month;
    cols.push({
      key: d.format("YYYY-MM-DD"),
      day: d.date(),
      weekday: weekdays[dow],
      date: d,
      isWeekend: dow === 0 || dow === 6,
      monthStart,
      monthLabel: monthStart ? d.format("M月") : ""
    });
    d = d.add(1, "day");
  }
  return cols;
});

// 时间轴总宽度（按天）
const totalDays = computed(() => dateColumns.value.length);
const dayWidth = 36;

// 任务条样式：按整天对齐，忽略时间部分，保证同一天的任务位置一致
function getTaskBarStyle(task: any) {
  const cols = dateColumns.value;
  if (cols.length === 0) return {};

  const start = dayjs(task.startDate).startOf("day");
  const end = dayjs(task.endDate).startOf("day");
  const first = cols[0].date.startOf("day");

  const startOffset = Math.max(0, start.diff(first, "day"));
  const endOffset = Math.min(cols.length, end.diff(first, "day") + 1);
  const left = (startOffset / cols.length) * 100;
  const width = Math.max(2, ((endOffset - startOffset) / cols.length) * 100);

  return {
    left: `${left}%`,
    width: `${width}%`
  };
}

function getTaskBarClass(task: any) {
  const status = (task.状态 || "").toString();
  if (status.includes("完成") || status.includes("完毕") || status.includes("验收")) return "status-done";
  if (status.includes("进行") || status.includes("测试") || status.includes("审阅")) return "status-progress";
  if (status.includes("待") || status.includes("指派")) return "status-pending";
  return "status-default";
}

function getStatusTagType(status: string) {
  if (!status) return "info";
  if (status.includes("完成") || status.includes("完毕")) return "success";
  if (status.includes("进行") || status.includes("测试")) return "warning";
  if (status.includes("待") || status.includes("指派")) return "info";
  return "info";
}

// 筛选选项
const departmentOptions = computed(() => {
  return Object.keys(rawData.value).filter(Boolean).sort();
});

const userOptions = computed(() => {
  const set = new Set<string>();
  Object.values(rawData.value).forEach((users) => {
    (users || []).forEach((u: any) => {
      if (u?.username) set.add(u.username);
    });
  });
  return Array.from(set).sort();
});

function applyFilters() {
  // 依赖 ganttTasks 的 computed，改变 filter 即可
}

async function loadData() {
  loading.value = true;
  try {
    const res = await getTaskStatistics();
    if (res.code === 200 && res.result && typeof res.result === "object" && !Array.isArray(res.result)) {
      rawData.value = res.result;
    } else {
      rawData.value = {};
    }
  } catch (e: any) {
    console.error(e);
    ElMessage.error(e?.message || "加载数据失败");
    rawData.value = {};
  } finally {
    loading.value = false;
  }
}

onMounted(() => {
  loadData();
});
</script>

<style scoped lang="scss">
.gantt-page {
  padding: 0;
  min-height: 100%;
}

.gantt-card {
  border-radius: 10px;
  box-shadow: 0 1px 4px rgba(0, 0, 0, 0.06);

  :deep(.el-card__header) {
    padding: 14px 20px;
    background: linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%);
    border-bottom: 1px solid #e2e8f0;
  }

  :deep(.el-card__body) {
    padding: 0;
    overflow: auto;
    max-height: calc(100vh - 180px);
    border-radius: 0 0 10px 10px;
  }
}

.card-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  flex-wrap: wrap;
  gap: 12px;

  .title {
    font-size: 16px;
    font-weight: 600;
    color: #1e293b;
  }

  .header-actions {
    display: flex;
    gap: 10px;
    align-items: center;
  }

  .filter-select {
    width: 140px;
  }
}

.empty-state {
  padding: 60px 20px;
}

.gantt-container {
  display: flex;
  min-width: max-content;
  font-size: 13px;
}

.gantt-sidebar {
  flex-shrink: 0;
  width: 460px;
  min-width: 460px;
  border-right: 1px solid #e2e8f0;
  background: #fafbfc;
}

.sidebar-header {
  display: grid;
  grid-template-columns: minmax(100px, 160px) 80px 80px 120px;
  gap: 8px;
  padding: 0 12px;
  height: 48px;
  min-height: 48px;
  align-items: center;
  background: #f1f5f9;
  font-weight: 600;
  color: #475569;
  font-size: 12px;
  border-bottom: 1px solid #e2e8f0;
  position: sticky;
  top: 0;
  z-index: 2;
}

.sidebar-row {
  display: grid;
  grid-template-columns: minmax(100px, 160px) 80px 80px 120px;
  gap: 8px;
  padding: 0 12px;
  height: 40px;
  min-height: 40px;
  align-items: center;
  border-bottom: 1px solid #f1f5f9;
  transition: background 0.15s ease;

  &.row-hover {
    background: #eff6ff;
  }

  .col-task {
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
    color: #334155;
    font-weight: 500;
  }

  .col-dept,
  .col-user {
    color: #64748b;
    font-size: 12px;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
    min-width: 0;
  }

  .col-status {
    display: flex;
    align-items: center;
  }
}

.gantt-timeline {
  flex: 1;
  min-width: 600px;
}

.timeline-header {
  display: flex;
  height: 48px;
  min-height: 48px;
  align-items: stretch;
  background: #f8fafc;
  border-bottom: 2px solid #cbd5e1;
  position: sticky;
  top: 0;
  z-index: 2;
}

.timeline-body {
  position: relative;
}

.day-cell {
  flex: 0 0 36px;
  width: 36px;
  min-width: 36px;
  padding: 4px;
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  text-align: center;
  border-right: 1px solid #e2e8f0;
  font-size: 11px;
  color: #64748b;

  &.is-weekend {
    background: #f8fafc;
  }

  &.month-start {
    border-left: 2px solid #cbd5e1;
  }

  .month-label {
    display: block;
    font-size: 10px;
    color: #64748b;
    margin-bottom: 2px;
  }

  .day-num {
    display: block;
    font-weight: 600;
    color: #334155;
  }

  .day-week {
    font-size: 10px;
    color: #94a3b8;
  }
}

.timeline-row {
  position: relative;
  display: flex;
  height: 40px;
  min-height: 40px;
  border-bottom: 1px solid #e2e8f0;
  align-items: center;

  &.row-hover {
    background: #f8fafc;
  }

  .day-cell {
    border-right: 1px solid #e2e8f0;
  }
}

.task-bar-wrap {
  position: absolute;
  top: 6px;
  bottom: 6px;
  padding: 0 4px;
  cursor: default;
  z-index: 1;
}

.task-bar {
  height: 100%;
  border-radius: 6px;
  display: flex;
  align-items: center;
  padding: 0 8px;
  box-shadow: 0 1px 2px rgba(0, 0, 0, 0.06);
  transition: transform 0.15s ease, box-shadow 0.15s ease;

  .task-bar-wrap:hover & {
    transform: translateY(-1px);
    box-shadow: 0 2px 6px rgba(0, 0, 0, 0.1);
  }

  .task-bar-label {
    font-size: 12px;
    color: #fff;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  &.status-done {
    background: linear-gradient(135deg, #22c55e 0%, #16a34a 100%);
  }

  &.status-progress {
    background: linear-gradient(135deg, #3b82f6 0%, #2563eb 100%);
  }

  &.status-pending {
    background: linear-gradient(135deg, #f59e0b 0%, #d97706 100%);
  }

  &.status-default {
    background: linear-gradient(135deg, #64748b 0%, #475569 100%);
  }
}
</style>

<style lang="scss">
.gantt-tooltip-meta {
  font-size: 12px;
  color: #94a3b8;
  margin-top: 4px;
}
</style>
