<template>
  <div class="dashboard">
    <!-- 统计卡片 -->
    <el-row :gutter="20" class="mb-24">
      <el-col :span="6" :xs="12">
        <div class="stat-card">
          <div class="stat-number" style="color: #409eff">
            {{ stats.totalProjects }}
          </div>
          <div class="stat-label">总项目数</div>
        </div>
      </el-col>
      <el-col :span="6" :xs="12">
        <div class="stat-card">
          <div class="stat-number" style="color: #67c23a">
            {{ stats.activeProjects }}
          </div>
          <div class="stat-label">进行中项目</div>
        </div>
      </el-col>
      <el-col :span="6" :xs="12">
        <div class="stat-card">
          <div class="stat-number" style="color: #e6a23c">
            {{ stats.totalTasks }}
          </div>
          <div class="stat-label">总任务数</div>
        </div>
      </el-col>
      <el-col :span="6" :xs="12">
        <div class="stat-card">
          <div class="stat-number" style="color: #f56c6c">
            {{ stats.completedTasks }}
          </div>
          <div class="stat-label">已完成任务</div>
        </div>
      </el-col>
    </el-row>

    <el-row :gutter="20" class="mb-24">
      <!-- 项目进度图表 -->
      <el-col :span="12" :xs="24">
        <el-card class="mb-20">
          <template #header>
            <div class="card-header-title">
              <span>项目进度</span>
            </div>
          </template>
          <div ref="projectProgressChart" class="chart" />
        </el-card>
      </el-col>

      <!-- 任务状态分布 -->
      <el-col :span="12" :xs="24">
        <el-card class="mb-20">
          <template #header>
            <div class="card-header-title">
              <span>任务状态分布</span>
            </div>
          </template>
          <div ref="taskStatusChart" class="chart" />
        </el-card>
      </el-col>
    </el-row>

    <el-row :gutter="20">
      <!-- 最近任务 -->
      <el-col :span="14" :xs="24">
        <el-card>
          <template #header>
            <div class="flex-between">
              <span>最近任务</span>
              <el-button
                type="primary"
                size="small"
                @click="$router.push('/tasks/my-tasks')"
              >
                查看更多
              </el-button>
            </div>
          </template>
          <el-table :data="recentTasks" style="width: 100%">
            <el-table-column prop="title" label="任务名称" />
            <el-table-column prop="status" label="状态" width="100">
              <template #default="{ row }">
                <el-tag :type="getStatusTagType(row.status)" size="small">
                  {{ getStatusText(row.status) }}
                </el-tag>
              </template>
            </el-table-column>
            <el-table-column prop="assignee" label="负责人" width="100">
              <template #default="{ row }">
                {{ row.assignee?.name || "-" }}
              </template>
            </el-table-column>
            <el-table-column prop="endDate" label="截止日期" width="120" />
          </el-table>
        </el-card>
      </el-col>

      <!-- 团队成员工作量 -->
      <el-col :span="10" :xs="24">
        <el-card>
          <template #header>
            <div class="card-header-title">
              <span>团队成员工作量</span>
            </div>
          </template>
          <div v-if="teamWorkload.length === 0" class="empty-workload">
            <el-empty description="暂无数据" :image-size="80" />
          </div>
          <div v-else>
            <div
              v-for="member in teamWorkload"
              :key="member.userId"
              class="member-workload mb-16"
            >
              <div class="flex-between mb-8">
                <div class="member-name">
                  <el-avatar
                    :size="24"
                    :src="member.user.avatar"
                    style="margin-right: 8px"
                  >
                    {{ member.user.name?.charAt(0) }}
                  </el-avatar>
                  <span>{{ member.user.name }}</span>
                </div>
                <span class="task-count"
                  >{{ member.completedTasks }} 个任务</span
                >
              </div>
              <el-progress
                :percentage="
                  Math.round(
                    (member.completedTasks /
                      Math.max(...teamWorkload.map(m => m.completedTasks), 1)) *
                      100
                  )
                "
                :stroke-width="10"
                :color="getProgressColor(member.completedTasks)"
              />
            </div>
          </div>
        </el-card>
      </el-col>
    </el-row>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, nextTick, onBeforeUnmount } from "vue";
import * as echarts from "echarts/core";
import { BarChart, PieChart } from "echarts/charts";
import { CanvasRenderer } from "echarts/renderers";
import {
  TitleComponent,
  TooltipComponent,
  LegendComponent,
  GridComponent
} from "echarts/components";
import { use } from "echarts/core";
import { useProjectStoreHook } from "@/store/modules/project";
import { useUserStoreHook } from "@/store/modules/user";
import { TaskStatus, type Statistics } from "@/types";
import { mockProjects } from "@/mock/projects";
import { mockTasks } from "@/mock/tasks";
import { mockUsers } from "@/mock/users";

// 注册 echarts 组件
use([
  CanvasRenderer,
  BarChart,
  PieChart,
  TitleComponent,
  TooltipComponent,
  LegendComponent,
  GridComponent
]);

const projectStore = useProjectStoreHook();
const userStore = useUserStoreHook();

const stats = ref<Statistics>({
  totalProjects: 0,
  activeProjects: 0,
  totalTasks: 0,
  completedTasks: 0,
  totalRequirements: 0,
  completedRequirements: 0,
  totalHours: 0,
  userStats: []
});

const projectProgressChart = ref<HTMLDivElement>();
const taskStatusChart = ref<HTMLDivElement>();
let projectProgressChartInstance: echarts.ECharts | null = null;
let taskStatusChartInstance: echarts.ECharts | null = null;

const recentTasks = computed(() => {
  // 如果没有当前用户，显示所有任务
  return mockTasks.slice(0, 5).map(task => ({
    ...task,
    assignee: mockUsers.find(u => u.id === task.assigneeId)
  }));
});

const teamWorkload = computed(() => {
  return mockUsers.map(user => {
    const userTasks = mockTasks.filter(task => task.assigneeId === user.id);
    const completedTasks = userTasks.filter(
      task => task.status === TaskStatus.COMPLETED
    ).length;
    const totalHours = userTasks.reduce(
      (sum, task) => sum + (task.actualHours || 0),
      0
    );

    return {
      userId: user.id,
      user,
      completedTasks,
      totalHours
    };
  });
});

// 初始化项目进度图表
const initProjectProgressChart = () => {
  if (!projectProgressChart.value) return;

  projectProgressChartInstance = echarts.init(projectProgressChart.value);

  const option = {
    tooltip: {
      trigger: "axis",
      axisPointer: {
        type: "shadow"
      }
    },
    grid: {
      left: "3%",
      right: "4%",
      bottom: "3%",
      containLabel: true
    },
    xAxis: {
      type: "value",
      max: 100
    },
    yAxis: {
      type: "category",
      data: mockProjects.map(p => p.name)
    },
    series: [
      {
        name: "进度",
        type: "bar",
        data: mockProjects.map(p => p.progress || 0),
        itemStyle: {
          color: "#409eff"
        }
      }
    ]
  };

  projectProgressChartInstance.setOption(option);
};

// 初始化任务状态分布图表
const initTaskStatusChart = () => {
  if (!taskStatusChart.value) return;

  taskStatusChartInstance = echarts.init(taskStatusChart.value);

  const statusCount = {
    pendingAssign: mockTasks.filter(
      t =>
        t.status === TaskStatus.PENDING_ASSIGN_TO_DEPT_LEADER ||
        t.status === TaskStatus.PENDING_ASSIGN_TO_MEMBER
    ).length,
    notStarted: mockTasks.filter(t => t.status === TaskStatus.NOT_STARTED)
      .length,
    inProgress: mockTasks.filter(t => t.status === TaskStatus.IN_PROGRESS)
      .length,
    testing: mockTasks.filter(
      t =>
        t.status === TaskStatus.TESTING ||
        t.status === TaskStatus.PENDING_TEST ||
        t.status === TaskStatus.TEST_COMPLETED
    ).length,
    reviewing: mockTasks.filter(
      t =>
        t.status === TaskStatus.PENDING_REVIEW ||
        t.status === TaskStatus.REVIEWING ||
        t.status === TaskStatus.REVIEW_COMPLETED
    ).length,
    completed: mockTasks.filter(t => t.status === TaskStatus.COMPLETED).length,
    cancelled: mockTasks.filter(t => t.status === TaskStatus.CANCELLED).length
  };

  const option = {
    tooltip: {
      trigger: "item",
      formatter: "{a} <br/>{b}: {c} ({d}%)"
    },
    legend: {
      orient: "vertical",
      left: "left"
    },
    series: [
      {
        name: "任务状态",
        type: "pie",
        radius: "50%",
        data: [
          {
            value: statusCount.pendingAssign,
            name: "待分配",
            itemStyle: { color: "#e6a23c" }
          },
          {
            value: statusCount.notStarted,
            name: "未开始",
            itemStyle: { color: "#909399" }
          },
          {
            value: statusCount.inProgress,
            name: "进行中",
            itemStyle: { color: "#409eff" }
          },
          {
            value: statusCount.testing,
            name: "测试相关",
            itemStyle: { color: "#e6a23c" }
          },
          {
            value: statusCount.reviewing,
            name: "审阅相关",
            itemStyle: { color: "#909399" }
          },
          {
            value: statusCount.completed,
            name: "已完成",
            itemStyle: { color: "#67c23a" }
          },
          {
            value: statusCount.cancelled,
            name: "已取消",
            itemStyle: { color: "#f56c6c" }
          }
        ],
        emphasis: {
          itemStyle: {
            shadowBlur: 10,
            shadowOffsetX: 0,
            shadowColor: "rgba(0, 0, 0, 0.5)"
          }
        }
      }
    ]
  };

  taskStatusChartInstance.setOption(option);
};

const getStatusTagType = (
  status: TaskStatus
): "primary" | "success" | "warning" | "info" | "danger" => {
  const typeMap: Partial<
    Record<TaskStatus, "primary" | "success" | "warning" | "info" | "danger">
  > = {
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
  return typeMap[status] || "info";
};

const getStatusText = (status: TaskStatus) => {
  const textMap: Partial<Record<TaskStatus, string>> = {
    [TaskStatus.PENDING_ASSIGN_TO_DEPT_LEADER]: "待分配给部门主管",
    [TaskStatus.PENDING_ASSIGN_TO_MEMBER]: "待指派给成员",
    [TaskStatus.NOT_STARTED]: "任务未开始",
    [TaskStatus.IN_PROGRESS]: "任务进行中",
    [TaskStatus.PENDING_TEST]: "待测试",
    [TaskStatus.TESTING]: "测试中",
    [TaskStatus.TEST_COMPLETED]: "测试完成",
    [TaskStatus.PENDING_REVIEW]: "待审阅",
    [TaskStatus.REVIEWING]: "审阅中",
    [TaskStatus.REVIEW_COMPLETED]: "审阅完成",
    [TaskStatus.CANCELLED]: "已取消",
    [TaskStatus.COMPLETED]: "已完成"
  };
  return textMap[status] || status;
};

// 获取进度条颜色
const getProgressColor = (count: number) => {
  if (count >= 10) return "#67c23a";
  if (count >= 5) return "#409eff";
  if (count >= 2) return "#e6a23c";
  return "#909399";
};

const loadDashboardData = async () => {
  // 模拟加载统计数据
  stats.value = {
    totalProjects: mockProjects.length,
    activeProjects: mockProjects.filter(p => p.status === "active").length,
    totalTasks: mockTasks.length,
    completedTasks: mockTasks.filter(t => t.status === TaskStatus.COMPLETED)
      .length,
    totalRequirements: 0,
    completedRequirements: 0,
    totalHours: mockTasks.reduce(
      (sum, task) => sum + (task.actualHours || 0),
      0
    ),
    userStats: teamWorkload.value
  };

  // 设置store数据
  projectStore.setProjects(mockProjects);
  projectStore.setTasks(mockTasks);
};

// 窗口大小变化处理函数
const handleResize = () => {
  try {
    if (projectProgressChartInstance) {
      projectProgressChartInstance.resize();
    }
  } catch (e) {
    // 实例已被销毁，忽略错误
  }
  try {
    if (taskStatusChartInstance) {
      taskStatusChartInstance.resize();
    }
  } catch (e) {
    // 实例已被销毁，忽略错误
  }
};

onMounted(() => {
  loadDashboardData();
  nextTick(() => {
    initProjectProgressChart();
    initTaskStatusChart();
  });

  // 监听窗口大小变化，重新调整图表
  window.addEventListener("resize", handleResize);
});

onBeforeUnmount(() => {
  // 移除事件监听器
  window.removeEventListener("resize", handleResize);

  // 销毁图表实例
  try {
    if (projectProgressChartInstance) {
      projectProgressChartInstance.dispose();
      projectProgressChartInstance = null;
    }
  } catch (e) {
    // 实例已被销毁，忽略错误
    projectProgressChartInstance = null;
  }

  try {
    if (taskStatusChartInstance) {
      taskStatusChartInstance.dispose();
      taskStatusChartInstance = null;
    }
  } catch (e) {
    // 实例已被销毁，忽略错误
    taskStatusChartInstance = null;
  }
});
</script>

<style scoped lang="scss">
.dashboard {
  padding: 24px;
  background: linear-gradient(135deg, #f5f7fa 0%, #fafbfc 100%);
  min-height: calc(100vh - 60px);
}

.stat-card {
  background: linear-gradient(135deg, #ffffff 0%, #f8f9fa 100%);
  border-radius: 12px;
  padding: 28px 24px;
  text-align: center;
  box-shadow:
    0 2px 8px rgba(0, 0, 0, 0.04),
    0 1px 3px rgba(0, 0, 0, 0.08);
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  border: 1px solid rgba(0, 0, 0, 0.04);
  position: relative;
  overflow: hidden;

  &::before {
    content: "";
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    height: 3px;
    background: linear-gradient(90deg, currentColor 0%, currentColor 100%);
    opacity: 0.3;
  }

  &:hover {
    transform: translateY(-4px);
    box-shadow:
      0 8px 24px rgba(0, 0, 0, 0.12),
      0 2px 8px rgba(0, 0, 0, 0.08);
    border-color: rgba(64, 158, 255, 0.2);

    &::before {
      opacity: 0.6;
    }
  }

  .stat-number {
    font-size: 36px;
    font-weight: 700;
    margin-bottom: 10px;
    letter-spacing: -1px;
    line-height: 1.2;
  }

  .stat-label {
    font-size: 14px;
    color: #606266;
    font-weight: 500;
  }
}

:deep(.el-card) {
  border-radius: 12px;
  box-shadow:
    0 2px 8px rgba(0, 0, 0, 0.04),
    0 1px 3px rgba(0, 0, 0, 0.08);
  border: 1px solid rgba(0, 0, 0, 0.04);
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);

  &:hover {
    box-shadow:
      0 4px 16px rgba(0, 0, 0, 0.08),
      0 2px 6px rgba(0, 0, 0, 0.12);
  }

  .el-card__header {
    padding: 18px 20px;
    border-bottom: 1px solid rgba(0, 0, 0, 0.06);
    font-weight: 600;
    font-size: 15px;
    color: #303133;
  }

  .el-card__body {
    padding: 20px;
  }
}

.chart {
  height: 320px;
  width: 100%;
  transition: all 0.3s;
}

.card-header-title {
  display: flex;
  align-items: center;
  font-weight: 600;
  font-size: 15px;
  color: #303133;
}

.member-workload {
  padding: 16px;
  background: #fafbfc;
  border-radius: 10px;
  border: 1px solid rgba(0, 0, 0, 0.04);
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);

  &:hover {
    background: #f0f2f5;
    transform: translateX(4px);
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.06);
  }

  &:last-child {
    margin-bottom: 0;
  }

  .flex-between {
    margin-bottom: 12px;

    .member-name {
      display: flex;
      align-items: center;
      font-weight: 500;
      color: #303133;
      font-size: 14px;
    }

    .task-count {
      color: #606266;
      font-size: 13px;
      font-weight: 500;
    }
  }

  :deep(.el-progress) {
    .el-progress-bar__outer {
      background-color: #f0f2f5;
      border-radius: 10px;
      overflow: hidden;
    }

    .el-progress-bar__inner {
      border-radius: 10px;
      transition: width 0.6s ease;
    }
  }
}

.empty-workload {
  padding: 40px 0;
}

.flex-between {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

:deep(.el-table) {
  .el-table__row {
    transition: background-color 0.2s;

    &:hover {
      background-color: #f8f9fa;
    }
  }

  .el-table__cell {
    padding: 14px 12px;
  }

  .el-table__header {
    .el-table__cell {
      background-color: #fafbfc;
      font-weight: 600;
      color: #303133;
    }
  }
}

.mb-24 {
  margin-bottom: 28px;
}

.mb-20 {
  margin-bottom: 24px;
}

.mb-16 {
  margin-bottom: 18px;
}

.mb-8 {
  margin-bottom: 10px;
}

@media (max-width: 768px) {
  .dashboard {
    padding: 16px;
  }

  .stat-card {
    padding: 20px 16px;

    .stat-number {
      font-size: 28px;
    }
  }

  .chart {
    height: 250px;
  }

  :deep(.el-card) {
    .el-card__header {
      padding: 14px 16px;
    }

    .el-card__body {
      padding: 16px;
    }
  }
}
</style>
