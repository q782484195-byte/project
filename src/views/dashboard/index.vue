<template>
  <div class="dashboard">
    <el-row :gutter="20">
      <!-- 左侧：汇报列表 -->
      <el-col :span="12" :xs="24">
        <el-card class="report-card">
          <template #header>
            <div class="card-header-title">
              <span>汇报列表</span>
            </div>
          </template>
          <div v-loading="reportsLoading" class="report-container">
            <div v-if="reports.length > 0" class="report-list">
              <div v-for="(report, index) in reports" :key="report._id || index" class="report-item"
                @click="handleReportClick(report)">
                <div class="report-header">
                  <div class="report-title-section">
                    <el-icon class="report-icon">
                      <Document />
                    </el-icon>
                    <div class="report-title-info">
                      <div class="report-title-row">
                        <span class="report-project">{{ report.project_name || "-" }}</span>
                        <span v-if="report.requirement_name" class="report-divider">|</span>
                        <span v-if="report.requirement_name" class="report-requirement">{{ report.requirement_name
                          }}</span>
                        <span v-if="report.task_name" class="report-divider">|</span>
                        <span v-if="report.task_name" class="report-task">{{ report.task_name }}</span>
                        <el-tag v-if="report.state" :type="getReportStatusType(report.state)" size="small">状态: {{
                          report.state }}</el-tag>

                      </div>
                    </div>
                  </div>
                  <div class="report-time">{{ report.create_time || "-" }}</div>
                </div>
                <div class="report-content">
                  <div class="report-message">{{ report.message || "-" }}</div>
                  <div class="report-meta">
                    <div class="report-meta-left">
                      <el-tag v-if="report.recipient" type="info" size="small">接收人: {{ report.recipient }}</el-tag>
                      <el-tag v-if="report.creator" type="success" size="small">创建人: {{ report.creator }}</el-tag>
                    </div>
                    <div v-if="report.任务进度 !== undefined && report.任务进度 !== null" class="report-progress">
                      <span class="progress-label">阶段进度:</span>
                      <el-progress :percentage="Number(report.任务进度) || 0" :stroke-width="8" :show-text="true" />
                    </div>
                  </div>
                </div>
              </div>
            </div>
            <el-empty v-else description="暂无汇报记录" :image-size="100" />
            <div v-if="reports.length > 0" class="report-pagination">
              <el-pagination v-model:current-page="reportsPage" v-model:page-size="reportsPageSize"
                :total="reportsTotal" :page-sizes="[10, 20, 50, 100]" layout="total, sizes, prev, pager, next"
                @size-change="handleReportsPageSizeChange" @current-change="handleReportsPageChange" />
            </div>
          </div>
        </el-card>
      </el-col>

      <!-- 右侧：图表 -->
      <el-col :span="12" :xs="24">
        <!-- 项目进度图表 -->
        <el-card class="mb-20">
          <template #header>
            <div class="card-header-title">
              <span>进行中项目进度</span>
            </div>
          </template>
          <div ref="projectProgressChart" class="chart" />
        </el-card>

        <!-- 任务状态分布 -->
        <el-card class="mb-20">
          <template #header>
            <div class="card-header-title">
              <span>进行中任务状态分布</span>
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
import { useRouter } from "vue-router";
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
import { selectProjects, selectStatisticsTaskState, type SelectProjectParams } from "@/api/project";
import { selectReports, type ReportRecord } from "@/api/report";
import { ElMessage } from "element-plus";
import { Document } from "@element-plus/icons-vue";

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
const router = useRouter();
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
const taskStatusData = ref<any>(null);
const loadingTaskStatus = ref(false);

// 汇报列表
const reports = ref<ReportRecord[]>([]);
const reportsLoading = ref(false);
const reportsPage = ref(1);
const reportsPageSize = ref(10);
const reportsTotal = ref(0);

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

      // 过滤掉 state === "未开始" 的项目
      const filteredProjectList = projectList.filter((item: any) => {
        const state = item.state || "";
        // 如果 state 包含逗号，取第一个值
        const actualState = state.includes(",") ? state.split(",")[0].trim() : state;
        return actualState !== "未开始";
      });

      // 将 API 返回的数据转换为前端 Project 类型
      projects.value = filteredProjectList.map((item: any) => {
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

// 加载任务状态统计数据
const loadTaskStatusData = async () => {
  loadingTaskStatus.value = true;
  try {
    const response = await selectStatisticsTaskState();
    if (response.code === 200) {
      // 接口数据直接在响应对象上，提取除了 code 之外的所有字段
      const { code, ...statusData } = response;
      taskStatusData.value = statusData || {};
      // 如果图表已初始化，则更新图表
      if (taskStatusChartInstance) {
        updateTaskStatusChart();
      }
    } else {
      ElMessage.error(response.message || "加载任务状态数据失败");
      // 如果接口失败，使用空数据
      taskStatusData.value = {};
      if (taskStatusChartInstance) {
        updateTaskStatusChart();
      }
    }
  } catch (error: any) {
    console.error("加载任务状态数据失败:", error);
    ElMessage.error(
      error?.response?.data?.message || error?.message || "加载任务状态数据失败"
    );
    taskStatusData.value = {};
    if (taskStatusChartInstance) {
      updateTaskStatusChart();
    }
  } finally {
    loadingTaskStatus.value = false;
  }
};

// 初始化任务状态分布图表
const initTaskStatusChart = () => {
  if (!taskStatusChart.value) return;
  taskStatusChartInstance = echarts.init(taskStatusChart.value);
  updateTaskStatusChart();
};

// 更新任务状态分布图表
const updateTaskStatusChart = () => {
  if (!taskStatusChartInstance) return;

  // 从接口数据中获取各状态的计数，如果接口没有返回某个状态，则默认为0
  const data = taskStatusData.value || {};
  const statusCount = {
    pendingAssign: (data["待分配"] || 0) + (data["待指派"] || 0),
    notStarted: data["未开始"] || 0,
    inProgress: data["进行中"] || 0,
    testing: data["测试中"] || 0,
    reviewing: data["审阅中"] || 0,
    completed: data["已完成"] || 0,
    cancelled: data["已取消"] || 0
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
            name: "验收相关",
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
        ].filter(item => item.value > 0), // 只显示有数据的项
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

// 获取汇报状态标签类型
const getReportStatusType = (
  status: string
): "primary" | "success" | "warning" | "info" | "danger" => {
  if (!status) return "info";

  // 处理中文状态
  const statusMap: Record<string, "primary" | "success" | "warning" | "info" | "danger"> = {
    "待分配给部门负责人": "warning",
    "待分配给部门主管": "warning",
    "待指派给成员": "warning",
    "待开始": "info",
    "任务未开始": "info",
    "进行中": "warning",
    "任务进行中": "warning",
    "待测试": "info",
    "测试中": "warning",
    "测试完毕": "success",
    "待审阅": "info",
    "审阅中": "warning",
    "审阅完毕": "success",
    "已取消": "danger",
    "取消": "danger",
    "已完成": "success"
  };

  // 先检查中文状态
  if (statusMap[status]) {
    return statusMap[status];
  }

  // 检查英文状态（TaskStatus枚举值）
  const taskStatusMap: Partial<
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

  return taskStatusMap[status as TaskStatus] || "info";
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

// 加载汇报列表
const loadReports = async (page: number = reportsPage.value) => {
  reportsLoading.value = true;
  try {
    const response = await selectReports({
      page: page,
      page_size: reportsPageSize.value
    });

    if (response.code === 200) {
      reports.value = response.result || response.data || [];
      reportsTotal.value = response.total_count || response.total || 0;
      reportsPage.value = page;
    } else {
      ElMessage.error(response.message || "加载汇报列表失败");
      reports.value = [];
      reportsTotal.value = 0;
    }
  } catch (error: any) {
    console.error("加载汇报列表失败:", error);
    ElMessage.error(
      error?.response?.data?.message || error?.message || "加载汇报列表失败"
    );
    reports.value = [];
    reportsTotal.value = 0;
  } finally {
    reportsLoading.value = false;
  }
};

// 处理汇报分页改变
const handleReportsPageChange = (page: number) => {
  loadReports(page);
};

// 处理汇报每页数量改变
const handleReportsPageSizeChange = () => {
  loadReports(1);
};

// 处理汇报点击
const handleReportClick = (report: ReportRecord) => {
  router.push({
    name: "TaskDetail",
    params: { id: report.task_id },
    query: {
      from: "dashboard"
    }
  });
};

onMounted(async () => {
  loadDashboardData();
  await loadProjects(); // 加载项目数据
  await loadReports(); // 加载汇报列表
  nextTick(() => {
    initProjectProgressChart();
    initTaskStatusChart(); // 先初始化图表
  });
  // 在图表初始化后再加载数据
  await loadTaskStatusData(); // 加载任务状态统计数据

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

.report-card {
  height: 100%;
  display: flex;
  flex-direction: column;

  :deep(.el-card__body) {
    flex: 1;
    display: flex;
    flex-direction: column;
    padding: 20px;
    overflow: hidden;
  }
}

.report-container {
  display: flex;
  flex-direction: column;
  height: 100%;
  min-height: 600px;
  max-height: calc(100vh - 250px);
}

.report-list {
  flex: 1;
  overflow-y: auto;
  overflow-x: hidden;
  padding-right: 4px;
  margin-bottom: 16px;

  &::-webkit-scrollbar {
    width: 6px;
  }

  &::-webkit-scrollbar-track {
    background: #f1f1f1;
    border-radius: 3px;
  }

  &::-webkit-scrollbar-thumb {
    background: #c1c1c1;
    border-radius: 3px;

    &:hover {
      background: #a8a8a8;
    }
  }
}

.report-pagination {
  flex-shrink: 0;
  padding-top: 16px;
  border-top: 1px solid #e4e7ed;
  display: flex;
  justify-content: flex-end;
}

.report-item {
  padding: 16px;
  margin-bottom: 16px;
  background: #fafbfc;
  border-radius: 8px;
  border: 1px solid #e4e7ed;
  transition: all 0.3s ease;

  &:hover {
    background: #f0f2f5;
    border-color: #c0c4cc;
    transform: translateX(4px);
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
  }

  &:last-child {
    margin-bottom: 0;
  }

  .report-header {
    display: flex;
    justify-content: space-between;
    align-items: flex-start;
    margin-bottom: 12px;
    min-width: 0;
    gap: 12px;

    .report-title-section {
      display: flex;
      align-items: flex-start;
      gap: 10px;
      flex: 1;
      min-width: 0;

      .report-icon {
        color: #409eff;
        font-size: 20px;
        flex-shrink: 0;
        margin-top: 2px;
      }

      .report-title-info {
        flex: 1;
        min-width: 0;

        .report-title-row {
          display: flex;
          align-items: center;
          gap: 8px;
          flex-wrap: wrap;
          line-height: 1.5;

          .report-project {
            color: #303133;
            font-weight: 600;
            font-size: 15px;
            overflow: hidden;
            text-overflow: ellipsis;
            white-space: nowrap;
            max-width: 200px;
          }

          .report-divider {
            color: #dcdfe6;
            font-size: 12px;
            flex-shrink: 0;
          }

          .report-requirement {
            font-size: 13px;
            color: #606266;
            font-weight: 500;
            overflow: hidden;
            text-overflow: ellipsis;
            white-space: nowrap;
            max-width: 180px;
          }

          .report-task {
            font-size: 13px;
            color: #909399;
            font-weight: 400;
            overflow: hidden;
            text-overflow: ellipsis;
            white-space: nowrap;
            max-width: 180px;
          }
        }
      }
    }

    .report-time {
      font-size: 12px;
      color: #909399;
      flex-shrink: 0;
      white-space: nowrap;
    }
  }

  .report-content {
    .report-message {
      color: #606266;
      font-size: 14px;
      line-height: 1.6;
      margin-bottom: 12px;
      word-wrap: break-word;
      word-break: break-word;
      overflow-wrap: break-word;
      white-space: pre-wrap;
      max-width: 100%;
    }

    .report-meta {
      display: flex;
      align-items: center;
      justify-content: space-between;
      flex-wrap: wrap;
      gap: 12px;
      margin-top: 8px;

      .report-meta-left {
        display: flex;
        align-items: center;
        gap: 8px;
        flex-wrap: wrap;
        flex: 1;
      }

      .report-progress {
        display: flex;
        align-items: center;
        gap: 8px;
        flex-shrink: 0;
        min-width: 200px;

        .progress-label {
          font-size: 12px;
          color: #606266;
          white-space: nowrap;
          font-weight: 500;
        }

        :deep(.el-progress) {
          flex: 1;
          min-width: 120px;
          max-width: 200px;

          .el-progress__text {
            font-size: 11px;
          }
        }
      }
    }
  }
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

// 移动端适配 (640px)
@media (max-width: 640px) {
  .dashboard {
    padding: 12px;
  }

  .stat-card {
    padding: 16px 12px;
    margin-bottom: 12px;

    .stat-number {
      font-size: 24px;
    }

    .stat-label {
      font-size: 13px;
    }
  }

  .chart {
    height: 220px;
  }

  :deep(.el-card) {
    margin-bottom: 12px;

    .el-card__header {
      padding: 12px 16px;
      font-size: 14px;
    }

    .el-card__body {
      padding: 12px;
    }
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
      padding: 8px 4px;
      font-size: 12px;
    }
  }
}
</style>
