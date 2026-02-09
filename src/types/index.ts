// 任务状态枚举
export enum TaskStatus {
  PENDING_ASSIGN_TO_DEPT_LEADER = "待分配给部门负责人",
  PENDING_ASSIGN_TO_MEMBER = "待指派给成员",
  NOT_STARTED = "任务未开始",
  IN_PROGRESS = "任务进行中",
  PENDING_TEST = "待测试",
  TESTING = "测试中",
  TEST_COMPLETED = "测试完毕",
  PENDING_REVIEW = "待审阅",
  REVIEWING = "审阅中",
  REVIEW_COMPLETED = "审阅完毕",
  CANCELLED = "已取消",
  COMPLETED = "已完成",
  TEST_FAILED = "测试未通过",
  REVIEW_FAILED = "审阅未通过"
}

// 用户接口
export interface User {
  id: string;
  name: string;
  email?: string;
  avatar?: string;
}

// 任务接口
export interface Task {
  id: string;
  title: string;
  description?: string;
  status: TaskStatus;
  assigneeId?: string;
  assignee?: User;
  projectId?: string;
  priority?: "low" | "medium" | "high";
  startDate?: string;
  endDate?: string;
  actualHours?: number;
  estimatedHours?: number;
  任务名?: string;
}

// 项目类型枚举
export enum ProjectType {
  SOFTWARE = "software",
  HARDWARE = "hardware",
  RESEARCH = "research",
  IMPLEMENTATION = "implementation",
  MAINTENANCE = "maintenance"
}

// 项目类型自定义字段
export interface ProjectTypeField {
  id: string;
  name: string;
  label: string;
  type: "text" | "number" | "date" | "select" | "textarea" | "boolean";
  required: boolean;
  defaultValue?: any;
  options?: string[];
  order: number;
}

// 项目类型配置
export interface ProjectTypeConfig {
  id: string;
  name: string;
  code: string;
  description: string;
  type: ProjectType;
  defaultTemplateId?: string;
  customFields: ProjectTypeField[];
  jsonConfig?: any;
  createdAt: string;
  updatedAt: string;
}

// 项目模板树节点
export interface ProjectTemplateNode {
  id: string;
  templateId: string;
  name: string;
  description: string;
  type: "phase" | "milestone" | "task" | "subtask";
  level: number;
  parentId?: string;
  children?: ProjectTemplateNode[];
  estimatedDays?: number;
  assigneeRole?: string;
  departmentId?: string;
  order: number;
  createdAt: string;
  updatedAt: string;
}

// 项目模板接口
export interface ProjectTemplate {
  id: string;
  name: string;
  description: string;
  typeId: string;
  type?: ProjectTypeConfig;
  rootNode?: ProjectTemplateNode;
  nodes?: ProjectTemplateNode[];
  usageCount?: number;
  isActive?: boolean;
  createdAt: string;
  updatedAt: string;
  createdBy?: string;
  createdByUser?: User;
}

// 项目描述内容类型
export interface DescribeContent {
  type: "text" | "url" | "file";
  content: string;
}

// 项目接口
export interface Project {
  id: string;
  name: string;
  description?: string;
  describe?: DescribeContent[]; // 项目描述内容数组（包含文本、图片URL、文件路径）
  status?:
  | "未开始"
  | "进行中"
  | "已完成"
  | "延期"
  | "active"
  | "completed"
  | "paused"
  | "cancelled";
  delayed?: boolean;
  // 支持中文和英文状态
  progress?: number;
  startDate?: string;
  endDate?: string;
  managerId?: string;
  manager?: User;
  creator?: string; // 项目负责人（创建者）
  members?: Array<{
    id: string;
    name: string;
    avatar?: string;
    role?: string;
  }>;
  budget?: number;
  typeId?: string;
  type?: ProjectTypeConfig;
  templateId?: string;
  template?: ProjectTemplate;
  attachment?: string[]; // 项目附件链接数组
  project_proposal?: string[]; // 立项文件链接数组
  customer_name?: string; // 客户名称
  product_type?: string; // 产品类型
  platform_name?: string; // 平台名称
  motherboard_name?: string; // 主板名称
  resolution?: string; // 分辨率
  business_owner?: string; // 业务负责人
  createdAt?: string;
  updatedAt?: string;
  总进度?: number; // 项目总进度（来自后端API）
}

// 需求状态枚举
export enum RequirementStatus {
  DRAFT = "draft", // 草稿
  REVIEWING = "reviewing", // 评审中
  APPROVED = "approved", // 已通过
  DEVELOPING = "developing", // 开发中
  TESTING = "testing", // 测试中
  COMPLETED = "completed", // 已完成
  REJECTED = "rejected", // 已拒绝
  CANCELLED = "cancelled" // 已取消
}

// 需求优先级
export type RequirementPriority = "low" | "medium" | "high" | "urgent";

// 需求接口
export interface Requirement {
  id: string;
  title: string;
  description?: string;
  status: RequirementStatus;
  priority: RequirementPriority;
  projectId: string;
  creatorId?: string;
  creator?: User;
  assigneeId?: string;
  assignee?: User;
  category?: string; // 需求分类
  tags?: string[]; // 标签
  acceptanceCriteria?: string; // 验收标准
  estimatedHours?: number;
  actualHours?: number;
  startDate?: string;
  endDate?: string;
  createdAt?: string;
  updatedAt?: string;
}

// 统计数据接口
export interface Statistics {
  totalProjects: number;
  activeProjects: number;
  totalTasks: number;
  completedTasks: number;
  totalRequirements?: number;
  completedRequirements?: number;
  totalHours?: number;
  userStats?: Array<{
    userId: string;
    user: User;
    completedTasks: number;
    totalHours: number;
  }>;
}
