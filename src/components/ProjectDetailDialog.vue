<template>
  <el-dialog v-model="dialogVisible" title="项目详情" width="900px" @close="handleClose">
    <div v-if="project" class="project-detail">
      <!-- 使用标签页 -->
      <el-tabs v-model="activeTab" class="project-tabs">
        <!-- 基本信息标签页 -->
        <el-tab-pane label="基本信息" name="info">
          <!-- 项目基本信息 -->
          <el-card class="mb-20">
            <template #header>
              <span>基本信息</span>
            </template>
            <el-descriptions :column="2" border>
              <el-descriptions-item label="项目名称">{{
                project.name
              }}</el-descriptions-item>
              <el-descriptions-item label="状态">
                <el-select v-model="currentStatus" :loading="statusUpdating" size="small" style="width: 120px"
                  @change="handleStatusChange">
                  <el-option label="未开始" value="未开始" />
                  <el-option label="进行中" value="进行中" />
                  <el-option label="已完成" value="已完成" />
                </el-select>
              </el-descriptions-item>
              <el-descriptions-item label="项目负责人">
                <el-tag v-if="project.creator" type="primary" size="small">
                  {{ project.creator }}
                </el-tag>
                <span v-else>-</span>
              </el-descriptions-item>
              <el-descriptions-item label="进度">{{ project.progress || 0 }}%</el-descriptions-item>
              <el-descriptions-item label="计划开始时间">{{
                formatDate(project.startDate)
              }}</el-descriptions-item>
              <el-descriptions-item label="计划结束时间">{{
                formatDate(project.endDate)
              }}</el-descriptions-item>
              <el-descriptions-item v-if="project.budget" label="预算">¥{{ formatBudget(project.budget)
              }}</el-descriptions-item>
              <el-descriptions-item v-if="project.createdAt" label="创建时间">{{
                formatDate(project.createdAt)
              }}</el-descriptions-item>
            </el-descriptions>
          </el-card>

          <!-- 项目描述 -->
          <el-card v-if="project.describe && project.describe.length > 0" class="mb-20">
            <template #header>
              <span>项目描述</span>
            </template>
            <div class="project-description">
              <template v-for="(item, index) in project.describe" :key="index">
                <!-- 文本内容 -->
                <p v-if="item.type === 'text'" class="description-text">
                  {{ item.content }}
                </p>
                <!-- URL 图片 -->
                <div v-else-if="item.type === 'url'" class="description-image">
                  <img :src="getImageUrl(item.content)" :alt="`图片 ${index + 1}`" @error="handleImageError" />
                </div>
                <!-- 文件图片 -->
                <div v-else-if="item.type === 'file'" class="description-image">
                  <img :src="getImageUrl(item.content)" :alt="item.content" @error="handleImageError" />
                </div>
              </template>
            </div>
          </el-card>
          <!-- 如果没有 describe，显示 description -->
          <el-card v-else-if="project.description" class="mb-20">
            <template #header>
              <span>项目描述</span>
            </template>
            <div class="project-description">{{ project.description }}</div>
          </el-card>

          <!-- 项目附件 -->
          <el-card v-if="project.attachment && project.attachment.length > 0" class="mb-20">
            <template #header>
              <span>项目附件</span>
            </template>
            <div class="attachment-list">
              <div v-for="(attachment, index) in project.attachment" :key="index" class="attachment-item">
                <el-icon class="attachment-icon">
                  <Document />
                </el-icon>
                <a :href="getAttachmentUrl(attachment)" :download="getFileName(attachment)" class="attachment-link"
                  target="_blank">
                  {{ getFileName(attachment) }}
                </a>
                <el-button type="text" size="small" @click="downloadAttachment(attachment)">
                  <el-icon>
                    <Download />
                  </el-icon>
                  下载
                </el-button>
              </div>
            </div>
          </el-card>

          <!-- 团队成员 -->
          <el-card v-if="project.members && project.members.length > 0" class="mb-20">
            <template #header>
              <span>团队成员</span>
            </template>
            <div class="members-list">
              <div v-for="member in project.members" :key="member.id" class="member-item">
                <el-avatar :src="member.avatar">{{
                  member.name.charAt(0)
                }}</el-avatar>
                <div class="member-info">
                  <div class="member-name">{{ member.name }}</div>
                  <div v-if="member.role" class="member-role">
                    {{ getRoleText(member.role) }}
                  </div>
                </div>
              </div>
            </div>
          </el-card>
        </el-tab-pane>

        <!-- 需求标签页 -->
        <el-tab-pane label="需求" name="requirements">
          <el-card class="mb-20">
            <template #header>
              <div class="requirement-header">
                <span>需求列表</span>
                <el-button type="primary" size="small" @click="showRequirementDrawer = true">
                  <el-icon>
                    <Plus />
                  </el-icon>
                  新建需求
                </el-button>
              </div>
            </template>
            <div v-loading="requirementsLoading" class="requirement-list">
              <div v-if="projectRequirements.length === 0" class="empty-requirements">
                <el-empty description="暂无需求" :image-size="100">
                  <el-button type="primary" @click="showRequirementDrawer = true">创建第一个需求</el-button>
                </el-empty>
              </div>
              <div v-else class="requirements-container">
                <div v-for="requirement in projectRequirements" :key="requirement.id" class="requirement-item"
                  @click="openRequirementDrawer(requirement)">
                  <div class="requirement-main">
                    <div class="requirement-title-row">
                      <span class="requirement-title">{{
                        requirement.title
                      }}</span>
                      <div class="requirement-badges">
                        <el-tag :type="getRequirementStatusTagType(requirement.status)
                          " size="small">
                          {{ getRequirementStatusText(requirement.status) }}
                        </el-tag>
                        <el-tag :type="getRequirementPriorityTagType(requirement.priority)
                          " size="small" effect="plain">
                          {{ getRequirementPriorityText(requirement.priority) }}
                        </el-tag>
                      </div>
                    </div>
                    <p v-if="requirement.description" class="requirement-description">
                      {{ requirement.description }}
                    </p>
                    <div class="requirement-meta">
                      <div v-if="requirement.assignee" class="requirement-assignee">
                        <el-avatar :src="requirement.assignee.avatar" :size="20">
                          {{ requirement.assignee.name?.charAt(0) }}
                        </el-avatar>
                        <span>{{ requirement.assignee.name }}</span>
                      </div>
                      <div v-if="requirement.category" class="requirement-category">
                        <el-icon>
                          <Folder />
                        </el-icon>
                        <span>{{ requirement.category }}</span>
                      </div>
                      <div v-if="requirement.endDate" class="requirement-dates">
                        <el-icon>
                          <Calendar />
                        </el-icon>
                        <span>截止: {{ formatDate(requirement.endDate) }}</span>
                      </div>
                    </div>
                    <div v-if="requirement.tags && requirement.tags.length > 0" class="requirement-tags">
                      <el-tag v-for="tag in requirement.tags" :key="tag" size="small" effect="plain"
                        style="margin-right: 6px">
                        {{ tag }}
                      </el-tag>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </el-card>
        </el-tab-pane>

        <!-- 任务标签页 -->
        <el-tab-pane label="任务" name="tasks">
          <el-card class="mb-20">
            <template #header>
              <div class="task-header">
                <span>任务列表</span>
                <el-button type="primary" size="small" @click="handleAddTask">
                  <el-icon>
                    <Plus />
                  </el-icon>
                  新建任务
                </el-button>
              </div>
            </template>
            <div v-loading="tasksLoading" class="task-list">
              <div v-if="projectTasks.length === 0" class="empty-tasks">
                <el-empty description="暂无任务" :image-size="100">
                  <el-button type="primary" @click="handleAddTask">创建第一个任务</el-button>
                </el-empty>
              </div>
              <div v-else class="tasks-container">
                <div v-for="task in projectTasks" :key="task.id" class="task-item">
                  <div class="task-main">
                    <div class="task-title-row">
                      <el-checkbox :model-value="task.status === TaskStatus.COMPLETED" @change="
                        (val: boolean) => handleTaskStatusChange(task, val)
                      ">
                        <span class="task-title" :class="{
                          completed: task.status === TaskStatus.COMPLETED
                        }">{{ task.title }}</span>
                      </el-checkbox>
                      <el-tag :type="getTaskStatusTagType(task.status)" size="small">
                        {{ getTaskStatusText(task.status) }}
                      </el-tag>
                    </div>
                    <p v-if="task.description" class="task-description">
                      {{ task.description }}
                    </p>
                    <div class="task-meta">
                      <div v-if="task.assignee" class="task-assignee">
                        <el-avatar :src="task.assignee.avatar" :size="20">
                          {{ task.assignee.name?.charAt(0) }}
                        </el-avatar>
                        <span>{{ task.assignee.name }}</span>
                      </div>
                      <div v-if="task.priority" class="task-priority">
                        <el-tag :type="getPriorityTagType(task.priority)" size="small">
                          {{ getPriorityText(task.priority) }}
                        </el-tag>
                      </div>
                      <div v-if="task.startDate || task.endDate" class="task-dates">
                        <el-icon>
                          <Calendar />
                        </el-icon>
                        <span>{{
                          formatDateRange(task.startDate, task.endDate)
                        }}</span>
                      </div>
                      <div v-if="task.estimatedHours || task.actualHours" class="task-hours">
                        <el-icon>
                          <Clock />
                        </el-icon>
                        <span>{{ task.actualHours || 0 }}/{{
                          task.estimatedHours || 0
                          }}h</span>
                      </div>
                    </div>
                  </div>
                  <div class="task-actions">
                    <el-button type="text" size="small" @click="handleEditTask(task)">编辑</el-button>
                    <el-button type="text" size="small" @click="handleDeleteTask(task)">删除</el-button>
                  </div>
                </div>
              </div>
            </div>
          </el-card>
        </el-tab-pane>
      </el-tabs>
    </div>

    <template #footer>
      <el-button @click="handleClose">关闭</el-button>
    </template>
  </el-dialog>

  <!-- 需求管理 Drawer -->
  <RequirementDrawer :visible="showRequirementDrawer" :project-id="project?.id" :project-name="project?.name"
    :requirement="currentRequirement" @update:visible="showRequirementDrawer = $event"
    @refresh="() => project?.id && loadProjectRequirements(project.id)" />
</template>

<script setup lang="ts">
import { computed, ref, watch } from "vue";
import type { Project, Task, Requirement } from "@/types";
import {
  TaskStatus,
  RequirementStatus,
  type RequirementPriority
} from "@/types";
import dayjs from "dayjs";
import { ElMessage, ElMessageBox } from "element-plus";
import {
  Document,
  Download,
  Plus,
  Calendar,
  Clock,
  Folder
} from "@element-plus/icons-vue";
import { updateProjectState } from "@/api/project";
import { useProjectStoreHook } from "@/store/modules/project";
import RequirementDrawer from "./RequirementDrawer.vue";

interface Props {
  visible: boolean;
  project: Project | null;
}

interface Emits {
  (e: "update:visible", value: boolean): void;
  (e: "update", project: Project): void;
}

const props = defineProps<Props>();
const emit = defineEmits<Emits>();

// 当前状态
const currentStatus = ref<string>("");
// 状态更新中
const statusUpdating = ref(false);
// 当前激活的标签页
const activeTab = ref<string>("info");
// 任务列表
const projectTasks = ref<Task[]>([]);
// 任务加载中
const tasksLoading = ref(false);
// 需求列表
const projectRequirements = ref<Requirement[]>([]);
// 需求加载中
const requirementsLoading = ref(false);
// 需求 Drawer 显示状态
const showRequirementDrawer = ref(false);
// 当前编辑的需求
const currentRequirement = ref<Requirement | null>(null);
// 项目 store
const projectStore = useProjectStoreHook();

// 监听项目变化，更新当前状态和任务列表
watch(
  () => props.project,
  project => {
    if (project) {
      currentStatus.value = project.status || "进行中";
      loadProjectTasks(project.id);
      loadProjectRequirements(project.id);
    }
  },
  { immediate: true }
);

const dialogVisible = computed({
  get: () => props.visible,
  set: value => emit("update:visible", value)
});

const handleClose = () => {
  dialogVisible.value = false;
};

// 处理状态变更
const handleStatusChange = async (newStatus: string) => {
  if (!props.project || !props.project.id) {
    ElMessage.error("项目信息不完整");
    return;
  }

  // 如果状态没有变化，不执行更新
  if (newStatus === props.project.status) {
    return;
  }

  statusUpdating.value = true;

  try {
    const response = await updateProjectState({
      project_id: props.project.id
    });

    if (response.code === 200) {
      ElMessage.success("状态更新成功");

      // 更新本地项目状态
      const updatedProject: Project = {
        ...props.project,
        status: newStatus as any
      };
      emit("update", updatedProject);
    } else {
      ElMessage.error(response.message || "状态更新失败");
      // 恢复原状态
      currentStatus.value = props.project.status || "进行中";
    }
  } catch (error: any) {
    console.error("更新状态失败:", error);
    ElMessage.error(
      error?.response?.data?.message || error?.message || "状态更新失败"
    );
    // 恢复原状态
    currentStatus.value = props.project.status || "进行中";
  } finally {
    statusUpdating.value = false;
  }
};

// 获取图片 URL（处理文件路径）
// 显示时：相对路径需要拼接 baseUrl 为完整 URL
const getImageUrl = (filePath: string): string => {
  // 如果已经是完整 URL，直接返回
  if (filePath.startsWith("http://") || filePath.startsWith("https://")) {
    return filePath;
  }

  // 使用环境变量 VITE_GLOB_API_URL 拼接图片 URL
  const baseUrl = import.meta.env.VITE_GLOB_API_URL || "";

  if (!baseUrl) {
    console.warn("VITE_GLOB_API_URL 未配置，使用原始路径:", filePath);
    return filePath;
  }

  // filePath 是相对路径（如 /data/xxx.png 或 data/xxx.png）
  let path = filePath;

  // 确保 path 以 / 开头
  if (!path.startsWith("/")) {
    path = "/" + path;
  }

  // 拼接 baseUrl 和 path
  // 如果 baseUrl 以 / 结尾，去掉末尾的 /
  const normalizedBaseUrl = baseUrl.endsWith("/")
    ? baseUrl.slice(0, -1)
    : baseUrl;

  // 拼接：baseUrl + path（path 已经以 / 开头）
  return normalizedBaseUrl + path;
};

// 处理图片加载错误
const handleImageError = (event: Event) => {
  const img = event.target as HTMLImageElement;
  img.style.display = "none";
  console.warn("图片加载失败:", img.src);
};

const getRoleText = (role: string) => {
  const roleMap: Record<string, string> = {
    project_manager: "项目经理",
    ui_designer: "UI设计师",
    frontend_developer: "前端开发",
    backend_developer: "后端开发",
    tester: "测试工程师"
  };
  return roleMap[role] || role;
};

const formatDate = (dateStr?: string) => {
  return dateStr ? dayjs(dateStr).format("YYYY-MM-DD") : "-";
};

const formatBudget = (budget: number) => {
  return (budget / 10000).toFixed(1) + "w";
};

// 获取附件 URL（处理文件路径）
const getAttachmentUrl = (attachment: string): string => {
  // 如果已经是完整 URL，直接返回
  if (attachment.startsWith("http://") || attachment.startsWith("https://")) {
    return attachment;
  }

  // 使用环境变量 VITE_GLOB_API_URL 拼接附件 URL
  const baseUrl = import.meta.env.VITE_GLOB_API_URL || "";

  if (!baseUrl) {
    return attachment;
  }

  // 处理路径拼接
  let path = attachment;
  // 如果路径以 / 开头，去掉第一个 /
  if (path.startsWith("/")) {
    path = path.substring(1);
  }

  // 确保 baseUrl 和 path 正确拼接
  if (baseUrl.endsWith("/") && path.startsWith("/")) {
    return baseUrl + path.substring(1);
  } else if (!baseUrl.endsWith("/") && !path.startsWith("/")) {
    return `${baseUrl}/${path}`;
  } else {
    return baseUrl + path;
  }
};

// 获取文件名
const getFileName = (attachment: string): string => {
  // 如果是完整 URL，提取文件名
  if (attachment.includes("/")) {
    const parts = attachment.split("/");
    return parts[parts.length - 1] || attachment;
  }
  return attachment;
};

// 下载附件
const downloadAttachment = (attachment: string) => {
  const url = getAttachmentUrl(attachment);
  const fileName = getFileName(attachment);

  // 创建临时链接并触发下载
  const link = document.createElement("a");
  link.href = url;
  link.download = fileName;
  link.target = "_blank";
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
};

// 加载项目任务
const loadProjectTasks = (projectId: string) => {
  tasksLoading.value = true;
  try {
    // 从 store 获取任务
    const tasks = projectStore.getTasksByProjectId(projectId);
    projectTasks.value = tasks;
  } catch (error) {
    console.error("加载任务失败:", error);
    ElMessage.error("加载任务失败");
  } finally {
    tasksLoading.value = false;
  }
};

// 处理任务状态变更
const handleTaskStatusChange = (task: Task, completed: boolean) => {
  // TODO: 调用 API 更新任务状态
  if (completed) {
    task.status = TaskStatus.COMPLETED;
  } else {
    task.status = TaskStatus.NOT_STARTED;
  }
  projectStore.updateTask(task);
  console.log("任务状态变更:", task);
};

// 新建任务
const handleAddTask = () => {
  // TODO: 打开新建任务对话框
  ElMessage.info("新建任务功能待实现");
};

// 编辑任务
const handleEditTask = (task: Task) => {
  // TODO: 打开编辑任务对话框
  ElMessage.info("编辑任务功能待实现");
};

// 删除任务
const handleDeleteTask = async (task: Task) => {
  try {
    await ElMessageBox.confirm(
      `确定要删除任务"${task.title}"吗？`,
      "删除确认",
      {
        confirmButtonText: "确定",
        cancelButtonText: "取消",
        type: "warning"
      }
    );
    // TODO: 调用 API 删除任务
    projectStore.deleteTask(task.id);
    loadProjectTasks(props.project!.id);
    ElMessage.success("任务删除成功");
  } catch {
    // 用户取消
  }
};

// 获取任务状态标签类型
const getTaskStatusTagType = (
  status: TaskStatus
): "success" | "primary" | "info" | "warning" | "danger" => {
  const typeMap: Partial<
    Record<TaskStatus, "success" | "primary" | "info" | "warning" | "danger">
  > = {
    [TaskStatus.NOT_STARTED]: "info",
    [TaskStatus.IN_PROGRESS]: "primary",
    [TaskStatus.TESTING]: "warning",
    [TaskStatus.COMPLETED]: "success",
    [TaskStatus.CANCELLED]: "danger"
  };
  return typeMap[status] || "info";
};

// 获取任务状态文本
const getTaskStatusText = (status: TaskStatus): string => {
  const textMap: Partial<Record<TaskStatus, string>> = {
    [TaskStatus.NOT_STARTED]: "待办",
    [TaskStatus.IN_PROGRESS]: "进行中",
    [TaskStatus.TESTING]: "测试中",
    [TaskStatus.COMPLETED]: "已完成",
    [TaskStatus.CANCELLED]: "已阻塞"
  };
  return textMap[status] || status;
};

// 获取优先级标签类型
const getPriorityTagType = (
  priority?: "low" | "medium" | "high"
): "success" | "warning" | "danger" | "info" => {
  if (!priority) return "info";
  const typeMap: Record<
    "low" | "medium" | "high",
    "success" | "warning" | "danger"
  > = {
    low: "success",
    medium: "warning",
    high: "danger"
  };
  return typeMap[priority];
};

// 获取优先级文本
const getPriorityText = (priority: "low" | "medium" | "high"): string => {
  const textMap = {
    low: "低",
    medium: "中",
    high: "高"
  };
  return textMap[priority] || priority;
};

// 格式化日期范围
const formatDateRange = (startDate?: string, endDate?: string): string => {
  if (!startDate && !endDate) return "-";
  if (startDate && endDate) {
    return `${formatDate(startDate)} ~ ${formatDate(endDate)}`;
  }
  return startDate ? formatDate(startDate) : formatDate(endDate);
};

// 加载项目需求
const loadProjectRequirements = (projectId: string) => {
  requirementsLoading.value = true;
  try {
    // TODO: 从 API 或 store 获取需求
    // 暂时使用空数组
    projectRequirements.value = [];
  } catch (error) {
    console.error("加载需求失败:", error);
    ElMessage.error("加载需求失败");
  } finally {
    requirementsLoading.value = false;
  }
};

// 打开需求 Drawer
const openRequirementDrawer = (requirement?: Requirement) => {
  currentRequirement.value = requirement || null;
  showRequirementDrawer.value = true;
};

// 获取需求状态标签类型
const getRequirementStatusTagType = (
  status: RequirementStatus
): "success" | "primary" | "info" | "warning" | "danger" => {
  const typeMap: Record<
    RequirementStatus,
    "success" | "primary" | "info" | "warning" | "danger"
  > = {
    [RequirementStatus.DRAFT]: "info",
    [RequirementStatus.REVIEWING]: "primary",
    [RequirementStatus.APPROVED]: "success",
    [RequirementStatus.DEVELOPING]: "primary",
    [RequirementStatus.TESTING]: "warning",
    [RequirementStatus.COMPLETED]: "success",
    [RequirementStatus.REJECTED]: "danger",
    [RequirementStatus.CANCELLED]: "info"
  };
  return typeMap[status] || "info";
};

// 获取需求状态文本
const getRequirementStatusText = (status: RequirementStatus): string => {
  const textMap: Record<RequirementStatus, string> = {
    [RequirementStatus.DRAFT]: "草稿",
    [RequirementStatus.REVIEWING]: "评审中",
    [RequirementStatus.APPROVED]: "已通过",
    [RequirementStatus.DEVELOPING]: "开发中",
    [RequirementStatus.TESTING]: "测试中",
    [RequirementStatus.COMPLETED]: "已完成",
    [RequirementStatus.REJECTED]: "已拒绝",
    [RequirementStatus.CANCELLED]: "已取消"
  };
  return textMap[status] || status;
};

// 获取需求优先级标签类型
const getRequirementPriorityTagType = (
  priority: RequirementPriority
): "success" | "warning" | "danger" | "info" => {
  const typeMap: Record<
    RequirementPriority,
    "success" | "warning" | "danger" | "info"
  > = {
    low: "info",
    medium: "success",
    high: "warning",
    urgent: "danger"
  };
  return typeMap[priority] || "info";
};

// 获取需求优先级文本
const getRequirementPriorityText = (priority: RequirementPriority): string => {
  const textMap: Record<RequirementPriority, string> = {
    low: "低",
    medium: "中",
    high: "高",
    urgent: "紧急"
  };
  return textMap[priority] || priority;
};
</script>

<style scoped lang="scss">
.project-detail {
  .project-description {
    line-height: 1.8;
    color: #606266;
    font-size: 14px;

    .description-text {
      margin: 0.8em 0;
      white-space: pre-wrap;
      word-wrap: break-word;
      color: #606266;
    }

    .description-image {
      margin: 1.2em 0;

      img {
        max-width: 30%;
        max-height: 500px;
        height: auto;
        border-radius: 8px;
        box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
        cursor: pointer;
        transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);

        &:hover {
          transform: scale(1.03);
          box-shadow: 0 6px 20px rgba(0, 0, 0, 0.15);
        }
      }
    }
  }

  .attachment-list {
    display: flex;
    flex-direction: column;
    gap: 12px;

    .attachment-item {
      display: flex;
      align-items: center;
      gap: 12px;
      padding: 14px 16px;
      border: 1px solid #e4e7ed;
      border-radius: 8px;
      transition: all 0.2s;
      background: #fafbfc;

      &:hover {
        background-color: #f0f2f5;
        border-color: #c0c4cc;
        transform: translateX(2px);
      }

      .attachment-icon {
        font-size: 20px;
        color: #409eff;
      }

      .attachment-link {
        flex: 1;
        color: #409eff;
        text-decoration: none;
        word-break: break-all;

        &:hover {
          text-decoration: underline;
        }
      }
    }
  }

  .members-list {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
    gap: 16px;

    .member-item {
      display: flex;
      align-items: center;
      gap: 12px;
      padding: 14px 16px;
      border: 1px solid #e4e7ed;
      border-radius: 8px;
      transition: all 0.2s;
      background: #fafbfc;

      &:hover {
        background-color: #f0f2f5;
        border-color: #c0c4cc;
        transform: translateY(-2px);
        box-shadow: 0 2px 8px rgba(0, 0, 0, 0.06);
      }

      .member-info {
        .member-name {
          font-weight: 500;
          color: #303133;
          margin-bottom: 4px;
          font-size: 14px;
        }

        .member-role {
          font-size: 12px;
          color: #909399;
        }
      }
    }
  }
}

.mb-20 {
  margin-bottom: 24px;
}

.project-tabs {
  :deep(.el-tabs__header) {
    margin-bottom: 24px;
  }

  :deep(.el-tabs__content) {
    padding-top: 0;
  }

  :deep(.el-tabs__item) {
    font-size: 15px;
    font-weight: 500;
    padding: 0 20px;
    height: 48px;
    line-height: 48px;
  }

  :deep(.el-tabs__active-bar) {
    height: 3px;
  }
}

.task-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.task-list {
  min-height: 200px;
}

.empty-tasks {
  padding: 40px 0;
}

.tasks-container {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.task-item {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  padding: 18px 20px;
  border: 1px solid #e4e7ed;
  border-radius: 10px;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  background: #ffffff;
  position: relative;

  &::before {
    content: "";
    position: absolute;
    left: 0;
    top: 0;
    bottom: 0;
    width: 3px;
    background: #409eff;
    border-radius: 10px 0 0 10px;
    opacity: 0;
    transition: opacity 0.3s;
  }

  &:hover {
    background-color: #f8f9fa;
    border-color: #c0c4cc;
    transform: translateX(4px);
    box-shadow: 0 2px 12px rgba(0, 0, 0, 0.08);

    &::before {
      opacity: 1;
    }
  }

  .task-main {
    flex: 1;

    .task-title-row {
      display: flex;
      align-items: center;
      gap: 12px;
      margin-bottom: 8px;

      .task-title {
        font-weight: 500;
        color: #303133;

        &.completed {
          text-decoration: line-through;
          color: #909399;
        }
      }
    }

    .task-description {
      margin: 8px 0;
      color: #606266;
      font-size: 14px;
      line-height: 1.5;
    }

    .task-meta {
      display: flex;
      align-items: center;
      gap: 16px;
      margin-top: 12px;
      font-size: 12px;
      color: #909399;

      .task-assignee {
        display: flex;
        align-items: center;
        gap: 6px;
      }

      .task-dates,
      .task-hours {
        display: flex;
        align-items: center;
        gap: 4px;
      }
    }
  }

  .task-actions {
    display: flex;
    gap: 8px;
  }
}

.requirement-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.requirement-list {
  min-height: 200px;
}

.empty-requirements {
  padding: 40px 0;
}

.requirements-container {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.requirement-item {
  padding: 18px 20px;
  border: 1px solid #e4e7ed;
  border-radius: 10px;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  background: #ffffff;
  cursor: pointer;
  position: relative;

  &::before {
    content: "";
    position: absolute;
    left: 0;
    top: 0;
    bottom: 0;
    width: 3px;
    background: #409eff;
    border-radius: 10px 0 0 10px;
    opacity: 0;
    transition: opacity 0.3s;
  }

  &:hover {
    background-color: #f8f9fa;
    border-color: #c0c4cc;
    transform: translateX(4px);
    box-shadow: 0 2px 12px rgba(0, 0, 0, 0.08);

    &::before {
      opacity: 1;
    }
  }

  .requirement-main {
    flex: 1;

    .requirement-title-row {
      display: flex;
      align-items: center;
      justify-content: space-between;
      margin-bottom: 10px;
      gap: 12px;

      .requirement-title {
        font-weight: 600;
        color: #303133;
        font-size: 15px;
        flex: 1;
        line-height: 1.4;
      }

      .requirement-badges {
        display: flex;
        gap: 8px;
        flex-shrink: 0;
      }
    }

    .requirement-description {
      margin: 10px 0;
      color: #606266;
      font-size: 14px;
      line-height: 1.6;
      display: -webkit-box;
      -webkit-line-clamp: 2;
      line-clamp: 2;
      -webkit-box-orient: vertical;
      overflow: hidden;
    }

    .requirement-meta {
      display: flex;
      align-items: center;
      gap: 16px;
      margin-top: 12px;
      font-size: 12px;
      color: #909399;

      .requirement-assignee {
        display: flex;
        align-items: center;
        gap: 6px;
      }

      .requirement-category,
      .requirement-dates {
        display: flex;
        align-items: center;
        gap: 4px;
      }
    }

    .requirement-tags {
      margin-top: 10px;
      display: flex;
      flex-wrap: wrap;
      gap: 6px;
    }
  }
}
</style>
