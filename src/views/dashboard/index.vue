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
import { TaskStatus, type Statistics, type Project } from "@/types";
import { mockProjects } from "@/mock/projects";
import { mockTasks } from "@/mock/tasks";
import { mockUsers } from "@/mock/users";
import { selectProjects, type SelectProjectParams } from "@/api/project";
import { ElMessage } from "element-plus";

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
const projects = ref<Project[]>([]);
const loadingProjects = ref(false);

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

// 加载项目数据
const loadProjects = async () => {
  loadingProjects.value = true;
  try {
    const params: SelectProjectParams = {
      project_name: "",
      creator: "",
      state: "",
      page: 1,
      page_size: 100 // 获取所有项目用于图表显示
    };

    const response = await selectProjects(params);

    if (response.code === 200) {
      const projectList = response.result || response.data || [];

      // 将 API 返回的数据转换为前端 Project 类型
      projects.value = projectList.map((item: any) => {
        // 处理 describe 数组，转换为描述文本
        let description = "";
        if (item.describe && Array.isArray(item.describe)) {
          description = item.describe
            .filter((d: any) => d.type === "text")
            .map((d: any) => d.content)
            .join("\n");
        }

        // 处理状态
        let state = item.state || "进行中";
        if (state.includes(",")) {
          state = state.split(",")[0].trim();
        }

        // 处理 describe 数组
        let processedDescribe = item.describe || [];
        if (Array.isArray(processedDescribe)) {
          processedDescribe = processedDescribe.map((d: any) => {
            if (d.type === "image" && d.url) {
              return {
                type: "url" as const,
                content: d.url
              };
            }
            if (d.type === "url" && d.url && !d.content) {
              return {
                type: "url" as const,
                content: d.url
              };
            }
            return d;
          });
        }

        return {
          id: item._id || item.project_id || item.id,
          name: item.project_name || item.name,
          description: description || item.description || "",
          describe: processedDescribe,
          status: state,
          creator: item.creator || "",
          managerId: item.manager_id || item.managerId || "",
          manager: item.manager || undefined,
          members: item.members || [],
          typeId: item.type_id || item.typeId,
          templateId: item.template_id || item.templateId,
          budget: item.budget || 0,
          startDate:
            item.plant_start_time ||
            item.start_time ||
            item.start_date ||
            item.startDate,
          endDate:
            item.plant_end_time ||
            item.completion_time ||
            item.end_date ||
            item.endDate,
          progress: item.progress || 0,
          总进度: item.总进度 || item.progress || 0, // 优先使用后端返回的 总进度 字段
          attachment: item.attachment || [],
          createdAt:
            item.create_time ||
            item.created_at ||
            item.createdAt ||
            new Date().toISOString(),
          updatedAt:
            item.updated_at || item.updatedAt || new Date().toISOString()
        } as Project;
      });

      // 数据加载完成后更新图表
      updateProjectProgressChart();
    } else {
      ElMessage.error(response.message || "加载项目数据失败");
      // 如果 API 失败，使用 mock 数据作为后备
      projects.value = [...mockProjects];
      updateProjectProgressChart();
    }
  } catch (error: any) {
    console.error("加载项目数据失败:", error);
    ElMessage.error(
      error?.response?.data?.message || error?.message || "加载项目数据失败"
    );
    // 如果 API 失败，使用 mock 数据作为后备
    projects.value = [...mockProjects];
    updateProjectProgressChart();
  } finally {
    loadingProjects.value = false;
  }
};

// 获取项目进度值
const getProjectProgress = (project: Project): number => {
  return project.总进度 ?? project.progress ?? 0;
};

// 初始化项目进度图表
const initProjectProgressChart = () => {
  if (!projectProgressChart.value) return;

  projectProgressChartInstance = echarts.init(projectProgressChart.value);
  updateProjectProgressChart();
};

// 更新项目进度图表
const updateProjectProgressChart = () => {
  if (!projectProgressChartInstance) return;

  // 按进度排序，显示前10个项目
  const sortedProjects = [...projects.value]
    .sort((a, b) => getProjectProgress(b) - getProjectProgress(a))
    .slice(0, 10);

  const option = {
    tooltip: {
      trigger: "axis",
      axisPointer: {
        type: "shadow"
      },
      formatter: (params: any) => {
        const param = params[0];
        return `${param.name}<br/>${param.seriesName}: ${param.value}%`;
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
      max: 100,
      axisLabel: {
        formatter: "{value}%"
      }
    },
    yAxis: {
      type: "category",
      data: sortedProjects.map(p => p.name),
      axisLabel: {
        interval: 0,
        formatter: (value: string) => {
          // 如果名称太长，截断并显示省略号
          return value.length > 10 ? value.substring(0, 10) + "..." : value;
        }
      }
    },
    series: [
      {
        name: "进度",
        type: "bar",
        data: sortedProjects.map(p => getProjectProgress(p)),
        itemStyle: {
          color: (params: any) => {
            const progress = params.value;
            if (progress >= 80) return "#67c23a";
            if (progress >= 50) return "#409eff";
            if (progress >= 20) return "#e6a23c";
            return "#909399";
          }
        },
        label: {
          show: true,
          position: "right",
          formatter: "{c}%"
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
    [TaskStatus.TEST_COMPLETED]: "测试完毕",
    [TaskStatus.PENDING_REVIEW]: "待审阅",
    [TaskStatus.REVIEWING]: "审阅中",
    [TaskStatus.REVIEW_COMPLETED]: "审阅完毕",
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

onMounted(async () => {
  loadDashboardData();
  await loadProjects(); // 加载项目数据
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
