import type { Task } from "@/types";
import { TaskStatus } from "@/types";

export const mockTasks: Task[] = [
  {
    id: "1",
    title: "用户登录功能开发",
    description: "实现用户登录、注册、忘记密码功能",
    status: TaskStatus.COMPLETED,
    assigneeId: "1",
    projectId: "1",
    priority: "high",
    startDate: "2024-01-01",
    endDate: "2024-01-15",
    actualHours: 40,
    estimatedHours: 32
  },
  {
    id: "2",
    title: "项目列表页面",
    description: "开发项目列表展示和筛选功能",
    status: TaskStatus.IN_PROGRESS,
    assigneeId: "2",
    projectId: "1",
    priority: "high",
    startDate: "2024-01-10",
    endDate: "2024-01-25",
    actualHours: 24,
    estimatedHours: 40
  },
  {
    id: "3",
    title: "任务管理模块",
    description: "实现任务的创建、编辑、删除功能",
    status: TaskStatus.IN_PROGRESS,
    assigneeId: "1",
    projectId: "1",
    priority: "high",
    startDate: "2024-01-15",
    endDate: "2024-02-05",
    actualHours: 32,
    estimatedHours: 48
  },
  {
    id: "4",
    title: "移动端UI设计",
    description: "设计移动端应用的UI界面",
    status: TaskStatus.TESTING,
    assigneeId: "3",
    projectId: "2",
    priority: "medium",
    startDate: "2024-02-01",
    endDate: "2024-02-20",
    actualHours: 48,
    estimatedHours: 40
  },
  {
    id: "5",
    title: "iOS原生开发",
    description: "使用Swift开发iOS应用",
    status: TaskStatus.NOT_STARTED,
    assigneeId: "2",
    projectId: "2",
    priority: "high",
    startDate: "2024-02-15",
    endDate: "2024-03-15",
    actualHours: 0,
    estimatedHours: 80
  },
  {
    id: "6",
    title: "数据采集模块",
    description: "开发数据采集和预处理功能",
    status: TaskStatus.IN_PROGRESS,
    assigneeId: "1",
    projectId: "3",
    priority: "high",
    startDate: "2024-03-01",
    endDate: "2024-03-30",
    actualHours: 16,
    estimatedHours: 60
  },
  {
    id: "7",
    title: "数据可视化",
    description: "使用ECharts实现数据可视化",
    status: TaskStatus.NOT_STARTED,
    assigneeId: "3",
    projectId: "3",
    priority: "medium",
    startDate: "2024-03-15",
    endDate: "2024-04-15",
    actualHours: 0,
    estimatedHours: 40
  },
  {
    id: "8",
    title: "API文档编写",
    description: "编写API网关的接口文档",
    status: TaskStatus.COMPLETED,
    assigneeId: "2",
    projectId: "4",
    priority: "low",
    startDate: "2023-12-01",
    endDate: "2023-12-20",
    actualHours: 16,
    estimatedHours: 24
  }
];
