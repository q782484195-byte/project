<template>
  <div class="requirement-detail-page">
    <div class="page-header">
      <el-button type="text" class="back-button" @click="goBack">
        <el-icon>
          <ArrowLeft />
        </el-icon>
        返回
      </el-button>
      <h2>{{ requirement?.requirement_name || "需求详情" }}</h2>
    </div>

    <div v-loading="loading" class="detail-content">
      <div v-if="requirement" class="detail-layout">
        <!-- 左侧：任务列表 -->
        <div class="left-panel">
          <el-card class="tasks-card">
            <template #header>
              <div class="tasks-header">
                <span>相关任务</span>
                <el-tag effect="plain" size="small">{{
                  requirementTasks.length
                  }}</el-tag>
              </div>
            </template>

            <div v-loading="tasksLoading" class="tasks-list">
              <div v-if="requirementTasks.length === 0" class="empty-tasks">
                <el-empty description="暂无任务" :image-size="100">
                  <el-button type="primary" @click="goToTasksListToCreate">创建第一个任务</el-button>
                </el-empty>
              </div>
              <div v-else>
                <div v-for="task in requirementTasks" :key="task._id || task.id" class="task-item"
                  @click="goToTasksList(task)">
                  <div class="task-main">
                    <div class="task-title-row">
                      <span class="task-title"
                        :class="{ completed: (task.状态 || task.status) === '已完成' || (task.状态 || task.status) === TaskStatus.COMPLETED }">
                        {{ task.任务名 || task.task_name || task.title || '-' }}
                      </span>
                      <div class="task-badges">
                        <el-tag :type="getTaskStatusTagType(task.状态 || task.status)" size="small">
                          {{ task.状态 || task.status || "-" }}
                        </el-tag>
                        <el-tag :type="getPriorityType(task.优先级 || task.priority) || undefined" size="small">
                          {{ task.优先级 || task.priority || "-" }}
                        </el-tag>
                      </div>
                    </div>
                    <div class="task-meta">
                      <span v-if="task.指派人 || task.指派给 || task.当前处理人">
                        <strong>负责人：</strong>{{ task.指派人 || task.指派给 || task.当前处理人 || "-" }}
                      </span>
                      <span v-if="task.creator">
                        <strong>创建人：</strong>{{ task.creator }}
                      </span>
                      <span v-if="task.create_time">
                        <el-icon>
                          <Clock />
                        </el-icon>
                        {{ formatDate(task.create_time) }}
                      </span>
                      <span v-if="task.预计工时">
                        预计 {{ task.预计工时 }} 天 / 已用 {{ task.已用工时 || 0 }} 天
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </el-card>
        </div>

        <!-- 右侧：基本信息 -->
        <div class="right-panel">
          <el-card class="info-card">
            <template #header>
              <span>基本信息</span>
            </template>
            <el-descriptions :column="1" border>
              <el-descriptions-item label="层级名称">{{
                requirement.requirement_name
                }}</el-descriptions-item>
              <el-descriptions-item label="选择项目">{{
                requirement.project_name
                }}</el-descriptions-item>
              <el-descriptions-item label="优先级">
                <el-tag :type="getPriorityType(requirement.priority) || undefined" size="small">
                  {{ formatPriorityText(requirement.priority) }}
                </el-tag>
              </el-descriptions-item>
              <el-descriptions-item label="状态">
                <el-select v-model="requirement.status" size="small" style="width: 120px" @change="handleStatusChange">
                  <el-option label="草稿" value="草稿" />
                  <el-option label="进行中" value="进行中" />
                  <el-option label="已完成" value="已完成" />
                  <el-option label="已取消" value="已取消" />
                </el-select>
              </el-descriptions-item>
              <el-descriptions-item v-if="requirement.creator" label="创建人">
                {{ requirement.creator }}
              </el-descriptions-item>
              <el-descriptions-item v-if="requirement.create_time" label="创建时间">
                {{ formatDate(requirement.create_time) }}
              </el-descriptions-item>
            </el-descriptions>
          </el-card>

          <!-- 层级描述 -->
          <el-card v-if="requirement.describe && requirement.describe.length > 0" class="info-card">
            <template #header>
              <span>层级描述</span>
            </template>
            <div class="requirement-description">
              <template v-for="(item, index) in requirement.describe" :key="index">
                <p v-if="item.type === 'text'" class="description-text">
                  {{ item.content }}
                </p>
                <div v-else-if="item.type === 'url' || item.type === 'file'" class="description-image">
                  <el-image :src="getImageUrl(item.content)" :alt="`图片 ${index + 1}`"
                    :preview-src-list="previewImageList" :initial-index="getImageIndex(index)" preview-teleported
                    fit="contain" class="description-image-el" @error="handleImageError" />
                </div>
              </template>
            </div>
          </el-card>

          <!-- 层级附件 -->
          <el-card v-if="requirement.attachment && requirement.attachment.length > 0" class="info-card">
            <template #header>
              <span>层级附件</span>
            </template>
            <div class="attachment-list">
              <div v-for="(attachment, index) in requirement.attachment" :key="index" class="attachment-item">
                <el-icon class="attachment-icon">
                  <DocumentIcon />
                </el-icon>
                <a :href="getAttachmentUrl(attachment)" :download="getFileNameFromPath(attachment)"
                  class="attachment-link" target="_blank">
                  {{ getFileNameFromPath(attachment) }}
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
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, watch } from "vue";
import { useRoute, useRouter } from "vue-router";
import { ElMessage } from "element-plus";
import {
  ArrowLeft,
  Document as DocumentIcon,
  Calendar,
  Clock,
  Download
} from "@element-plus/icons-vue";
import * as dayjsLib from "dayjs";
const dayjs: typeof import("dayjs") = ((dayjsLib as any).default || dayjsLib) as typeof import("dayjs");
import {
  selectRequirements,
  updateRequirementState,
  selectTasksByRequirement,
  flattenRequirementData,
  type RequirementListItem,
  type DescribeContent,
  type TaskListItem
} from "@/api/project";
import type { Task } from "@/types";
import {
  RequirementStatus,
  type RequirementPriority,
  TaskStatus
} from "@/types";

const route = useRoute();
const router = useRouter();

const requirementId = computed(() => route.params.id as string);
const projectId = computed(() => route.query.project_id as string | undefined);
const loading = ref(false);

interface RequirementDetail {
  id: string;
  requirement_name: string;
  project_id: string;
  project_name: string;
  priority: string;
  status: string;
  describe: DescribeContent[];
  attachment: string[];
  creator: string;
  create_time: string;
}

const requirement = ref<RequirementDetail | null>(null);
const requirementTasks = ref<any[]>([]);
const tasksLoading = ref(false);
const tasksTotal = ref(0);
const tasksCurrentPage = ref(1);
const tasksPageSize = ref(20);

// 格式化日期
const formatDate = (date: string) => {
  if (!date) return "";
  return dayjs(date).format("YYYY-MM-DD HH:mm:ss");
};

const formatDateRange = (start?: string, end?: string) => {
  if (!start && !end) return "未设置";
  if (start && end) {
    return `${dayjs(start).format("YYYY-MM-DD")} ~ ${dayjs(end).format("YYYY-MM-DD")}`;
  }
  if (start) return `${dayjs(start).format("YYYY-MM-DD")} 开始`;
  if (end) return `${dayjs(end).format("YYYY-MM-DD")} 截止`;
  return "未设置";
};

// 获取图片 URL
const getImageUrl = (filePath: string): string => {
  if (filePath.startsWith("http://") || filePath.startsWith("https://")) {
    return filePath;
  }
  const baseUrl = import.meta.env.VITE_GLOB_API_URL || "";
  if (!baseUrl) {
    return filePath;
  }
  let path = filePath;
  if (!path.startsWith("/")) {
    path = "/" + path;
  }
  const normalizedBaseUrl = baseUrl.endsWith("/")
    ? baseUrl.slice(0, -1)
    : baseUrl;
  return normalizedBaseUrl + path;
};

// 获取预览图片列表（所有图片的完整 URL）- 使用计算属性确保响应式
const previewImageList = computed(() => {
  if (!requirement.value?.describe) return [];
  return requirement.value.describe
    .filter(item => item.type === "url" || item.type === "file")
    .map(item => getImageUrl(item.content));
});

// 获取图片在预览列表中的索引
const getImageIndex = (currentIndex: number): number => {
  if (!requirement.value?.describe) return 0;
  let imageIndex = 0;
  for (let i = 0; i < currentIndex; i++) {
    const item = requirement.value.describe[i];
    if (item && (item.type === "url" || item.type === "file")) {
      imageIndex++;
    }
  }
  return imageIndex;
};

const handleImageError = (event: Event) => {
  const target = event.target as HTMLImageElement;
  target.src = "https://via.placeholder.com/400x200?text=Image+Not+Found";
};

const getAttachmentUrl = (path: string): string => {
  // 如果已经是完整 URL，直接返回
  if (path.startsWith("http://") || path.startsWith("https://")) {
    return path;
  }

  const baseUrl = import.meta.env.VITE_GLOB_API_URL || "";
  if (!baseUrl) {
    return path;
  }

  // 规范化 baseUrl（去除末尾的斜杠）
  const normalizedBaseUrl = baseUrl.endsWith("/")
    ? baseUrl.slice(0, -1)
    : baseUrl;

  // 规范化 path（确保以斜杠开头）
  let normalizedPath = path;
  if (!normalizedPath.startsWith("/")) {
    normalizedPath = "/" + normalizedPath;
  }

  return normalizedBaseUrl + normalizedPath;
};

const getFileNameFromPath = (path: string): string => {
  const parts = path.split("/").filter(Boolean);
  return parts[parts.length - 1] || path;
};

// 下载附件
const downloadAttachment = (attachment: string) => {
  const url = getAttachmentUrl(attachment);
  const fileName = getFileNameFromPath(attachment);

  // 创建临时链接并触发下载
  const link = document.createElement("a");
  link.href = url;
  link.download = fileName;
  link.target = "_blank";
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
};

// 获取优先级类型
const getPriorityType = (
  priority: string
): "success" | "info" | "warning" | "danger" | undefined => {
  const map: Record<string, "success" | "info" | "warning" | "danger"> = {
    低: "info", // 蓝色
    中: "warning", // 黄色
    高: "danger", // 红色
    紧急: "danger",
    low: "info", // 蓝色
    medium: "warning", // 黄色
    high: "danger", // 红色
    urgent: "danger"
  };
  return map[priority] || undefined;
};

const formatPriorityText = (priority: string) => {
  const map: Record<string, string> = {
    low: "低",
    medium: "中",
    high: "高",
    urgent: "紧急"
  };
  return map[priority] || priority;
};

const mapPriority = (priority: string): RequirementPriority => {
  const priorityMap: Record<string, RequirementPriority> = {
    低: "low",
    中: "medium",
    高: "high",
    紧急: "urgent"
  };
  if (["low", "medium", "high", "urgent"].includes(priority.toLowerCase())) {
    return priority.toLowerCase() as RequirementPriority;
  }
  return priorityMap[priority] || "medium";
};

const convertDescribeContent = (describe: any[]): DescribeContent[] => {
  if (!describe || describe.length === 0) return [];

  if (typeof describe[0] === "object" && "type" in describe[0]) {
    return describe as DescribeContent[];
  }

  // 字符串数组，判断是文本还是图片
  return (describe as string[]).map(item => {
    const isImage =
      (item.startsWith("http://") ||
        item.startsWith("https://") ||
        item.startsWith("/")) &&
      /\.(jpg|jpeg|png|gif|webp|bmp|svg)(\?|$)/i.test(item);
    if (isImage) {
      return { type: "url", content: item } as DescribeContent;
    }
    return { type: "text", content: item } as DescribeContent;
  });
};

// 加载需求详情
const loadRequirement = async () => {
  if (!requirementId.value || !projectId.value) {
    ElMessage.error("缺少项目信息，无法查看需求详情");
    router.push({ name: "RequirementsList" });
    return;
  }

  loading.value = true;
  try {
    const response = await selectRequirements({
      project_id: projectId.value,
      page: 1,
      page_size: 20
    });

    if (response.code === 200 && response.result) {
      // 扁平化嵌套对象结构为数组
      const flattenedResult = flattenRequirementData(response.result);
      const matched = flattenedResult.find(
        item => item._id === requirementId.value
      );
      if (!matched) {
        ElMessage.error("未找到该需求");
        router.push({ name: "RequirementsList" });
        return;
      }

      requirement.value = {
        id: matched._id,
        requirement_name: matched.需求名,
        project_id: matched.project_id,
        project_name: (route.query.project_name as string) || "",
        priority: matched.优先级,
        status: matched.状态,
        describe: convertDescribeContent(matched.describe || []),
        attachment: matched.attachment || [],
        creator: matched.creator || "",
        create_time: matched.create_time
      };
    } else {
      ElMessage.error(response.message || "加载需求详情失败");
      router.push({ name: "RequirementsList" });
    }
  } catch (error: any) {
    console.error("加载需求详情失败:", error);
    ElMessage.error(
      error?.response?.data?.message || error?.message || "加载需求详情失败"
    );
    router.push({ name: "RequirementsList" });
  } finally {
    loading.value = false;
  }
};

// 加载需求相关的任务列表
const loadRequirementTasks = async (requirementId: string) => {
  if (!requirementId) {
    requirementTasks.value = [];
    return;
  }

  tasksLoading.value = true;
  try {
    const response = await selectTasksByRequirement({
      requirement_id: requirementId,
      page: tasksCurrentPage.value,
      page_size: tasksPageSize.value
    });

    if (response.code === 200 && response.result) {
      // 直接使用接口返回的原始数据，不进行状态映射
      requirementTasks.value = response.result.map((item: TaskListItem) => ({
        ...item,
        id: item._id,
        _id: item._id
      }));
      tasksTotal.value = response.total_count || 0;
    } else {
      ElMessage.error(response.message || "加载任务列表失败");
      requirementTasks.value = [];
      tasksTotal.value = 0;
    }
  } catch (error: any) {
    console.error("加载任务列表失败:", error);
    ElMessage.error(
      error?.response?.data?.message || error?.message || "加载任务列表失败"
    );
    requirementTasks.value = [];
    tasksTotal.value = 0;
  } finally {
    tasksLoading.value = false;
  }
};

// 映射任务状态
const mapTaskStatus = (status: string): TaskStatus => {
  const statusMap: Record<string, TaskStatus> = {
    待开始: TaskStatus.NOT_STARTED,
    进行中: TaskStatus.IN_PROGRESS,
    测试中: TaskStatus.TESTING,
    已完成: TaskStatus.COMPLETED,
    已阻塞: TaskStatus.CANCELLED,
    todo: TaskStatus.NOT_STARTED,
    in_progress: TaskStatus.IN_PROGRESS,
    testing: TaskStatus.TESTING,
    done: TaskStatus.COMPLETED,
    blocked: TaskStatus.CANCELLED
  };
  return statusMap[status] || TaskStatus.NOT_STARTED;
};

// 映射任务优先级
const mapTaskPriority = (priority: string): "low" | "medium" | "high" => {
  const priorityMap: Record<string, "low" | "medium" | "high"> = {
    低: "low",
    中: "medium",
    高: "high",
    low: "low",
    medium: "medium",
    high: "high"
  };
  return priorityMap[priority] || "medium";
};

const getTaskStatusTagType = (
  status: TaskStatus | string
): "success" | "info" | "warning" | "danger" | undefined => {
  if (!status) return undefined;
  const statusStr = String(status);
  const map: Record<
    string,
    "success" | "info" | "warning" | "danger" | undefined
  > = {
    // 枚举值映射（枚举值本身就是中文字符串）
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
    [TaskStatus.COMPLETED]: "success",
    [TaskStatus.CANCELLED]: "danger",
    // 其他可能的原始状态字符串（如果接口返回的与枚举值不同）
    "待分配给部门主管": "warning",
    "待开始": "info",
    "进行中": "warning",
    "取消": "danger"
  };
  return map[statusStr] || "info";
};

const getTaskStatusText = (status: TaskStatus | string) => {
  const map: Record<string, string> = {
    [TaskStatus.NOT_STARTED]: "待开始",
    [TaskStatus.IN_PROGRESS]: "进行中",
    [TaskStatus.TESTING]: "测试中",
    [TaskStatus.COMPLETED]: "已完成",
    [TaskStatus.CANCELLED]: "阻塞中",
    cancelled: "已取消"
  };
  return map[status] || status;
};

const getTaskCreatedAt = (task: Task): string | undefined => {
  const raw = (task as any).createdAt ?? (task as any).create_time;
  return raw ? String(raw) : undefined;
};

const formatTaskCreatedAt = (task: Task): string => {
  const createdAt = getTaskCreatedAt(task);
  return createdAt ? formatDate(createdAt) : "";
};

watch(requirement, value => {
  if (value) {
    tasksCurrentPage.value = 1; // 重置到第一页
    loadRequirementTasks(value.id);
  } else {
    requirementTasks.value = [];
    tasksTotal.value = 0;
  }
});

// 处理状态切换
const handleStatusChange = async () => {
  if (!requirement.value) return;

  try {
    const response = await updateRequirementState({
      requirement_id: requirement.value.id,
      state: requirement.value.status
    });

    if (response.code === 200) {
      ElMessage.success("状态更新成功");
      // 重新加载需求详情
      loadRequirement();
    } else {
      // 如果更新失败，恢复原状态
      ElMessage.error(response.message || "状态更新失败");
      loadRequirement();
    }
  } catch (error: any) {
    console.error("更新状态失败:", error);
    ElMessage.error(
      error?.response?.data?.message || error?.message || "状态更新失败"
    );
    // 恢复原状态
    loadRequirement();
  }
};

// 返回
const goBack = () => {
  const from = route.query.from as string;
  if (from === "workspace") {
    // 从工作台来的，返回到工作台的需求TAB
    router.push({
      name: "Workspace",
      query: { tab: "requirements" }
    });
  } else {
    // 默认返回到层级列表
    router.push({ name: "RequirementsList" });
  }
};

const goToTasksList = (task: Task | Record<string, any>) => {
  const rawTask = task as Record<string, any>;
  const taskName = rawTask?.任务名 || rawTask?.task_name || task.title || "";
  router.push({
    name: "TasksList",
    query: {
      project_id: requirement.value?.project_id || projectId.value || "",
      requirement_id: requirement.value?.id || "",
      task_name: taskName
    }
  });
};

// 跳转到任务列表页并自动打开新建任务抽屉
const goToTasksListToCreate = () => {
  if (!requirement.value?.id) {
    ElMessage.warning("需求信息不完整，无法创建任务");
    return;
  }
  router.push({
    name: "TasksList",
    query: {
      project_id: requirement.value?.project_id || projectId.value || "",
      requirement_id: requirement.value?.id || "",
      create: "true"
    }
  });
};

const hasTextContent = (describe: any[]): boolean => {
  if (!Array.isArray(describe)) return false;
  return describe.some(item => {
    if (typeof item === "string") return item.trim().length > 0;
    if (item && typeof item === "object" && item.type === "text") {
      return !!item.content?.trim();
    }
    return false;
  });
};

const getDescribeText = (describe: any[]): string => {
  if (!Array.isArray(describe)) return "";
  return describe
    .filter(item => typeof item === "string" || (item && item.type === "text"))
    .map(item => (typeof item === "string" ? item : item.content))
    .join(" ");
};

onMounted(() => {
  loadRequirement();
});
</script>

<style scoped lang="scss">
.requirement-detail-page {
  padding: 20px;

  .page-header {
    display: flex;
    align-items: center;
    gap: 12px;
    margin-bottom: 20px;

    h2 {
      margin: 0;
      font-size: 24px;
      font-weight: 600;
    }

    .back-button {
      padding: 0;
    }
  }

  .detail-content {
    .detail-layout {
      display: grid;
      grid-template-columns: 2fr 1fr;
      gap: 24px;
      align-items: start;

      @media (max-width: 1200px) {
        grid-template-columns: 1fr;
      }
    }

    .left-panel {
      display: flex;
      flex-direction: column;
      gap: 20px;

      .info-card {
        margin-bottom: 0;
      }
    }

    .right-panel {
      display: flex;
      flex-direction: column;
      gap: 20px;

      .tasks-card {
        height: 100%;
      }
    }

    .requirement-description {
      line-height: 1.8;
      color: #606266;
      font-size: 14px;

      .description-text {
        margin: 0.8em 0;
        white-space: pre-wrap;
        word-wrap: break-word;
      }

      .description-image {
        margin: 1em 0.8em;
        margin-bottom: 1.2em;
        display: inline-block;
        cursor: pointer;
        vertical-align: top;

        .description-image-el {
          max-width: 150px;
          max-height: 150px;
          border-radius: 8px;
          box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
          transition:
            transform 0.3s ease,
            box-shadow 0.3s ease;

          &:hover {
            transform: scale(1.05);
            box-shadow: 0 6px 16px rgba(0, 0, 0, 0.15);
          }

          ::v-deep(.el-image__inner) {
            border-radius: 8px;
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
        padding: 12px;
        border: 1px solid #e4e7ed;
        border-radius: 8px;
        background-color: #fafbfc;
        transition: all 0.2s;

        &:hover {
          background-color: #f0f2f5;
          border-color: #c0c4cc;
        }

        .attachment-icon {
          font-size: 20px;
          color: #409eff;
          flex-shrink: 0;
        }

        .attachment-link {
          flex: 1;
          color: #409eff;
          text-decoration: none;
          overflow: hidden;
          text-overflow: ellipsis;
          white-space: nowrap;

          &:hover {
            color: #66b1ff;
            text-decoration: underline;
          }
        }
      }
    }

    .tasks-card {
      .tasks-header {
        display: flex;
        justify-content: space-between;
        align-items: center;
      }

      .tasks-list {
        max-height: 600px;
        overflow-y: auto;

        .empty-tasks {
          padding: 40px 0;
        }

        .task-item {
          padding: 16px;
          border: 1px solid #ebeef5;
          border-radius: 8px;
          margin-bottom: 12px;
          transition: all 0.2s;

          &:hover {
            border-color: #409eff;
            box-shadow: 0 4px 12px rgba(64, 158, 255, 0.12);
          }

          .task-main {
            display: flex;
            flex-direction: column;
            gap: 8px;

            .task-title-row {
              display: flex;
              justify-content: space-between;
              align-items: center;

              .task-title {
                font-weight: 600;
                font-size: 16px;

                &.completed {
                  text-decoration: line-through;
                  color: #909399;
                }
              }

              .task-badges {
                display: flex;
                gap: 8px;
              }
            }

            .task-description {
              color: #606266;
              font-size: 14px;
              line-height: 1.6;
            }

            .task-meta {
              display: flex;
              gap: 16px;
              color: #909399;
              font-size: 13px;

              span {
                display: flex;
                align-items: center;
                gap: 6px;
              }
            }
          }
        }
      }
    }
  }
}

// 图片预览全屏样式
::v-deep(.el-image-viewer__wrapper) {
  position: fixed !important;
  top: 0 !important;
  left: 0 !important;
  right: 0 !important;
  bottom: 0 !important;
  width: 100vw !important;
  height: 100vh !important;
  z-index: 9999 !important;
  background-color: rgba(0, 0, 0, 0.8) !important;

  .el-image-viewer__mask {
    position: fixed !important;
    top: 0 !important;
    left: 0 !important;
    right: 0 !important;
    bottom: 0 !important;
    width: 100vw !important;
    height: 100vh !important;
  }

  .el-image-viewer__canvas {
    width: 100vw !important;
    height: 100vh !important;
    display: flex !important;
    align-items: center !important;
    justify-content: center !important;

    img {
      max-width: 90vw !important;
      max-height: 90vh !important;
      object-fit: contain !important;
    }
  }
}

// 移动端适配 (640px)
@media (max-width: 640px) {
  .requirement-detail-page {
    padding: 12px;

    .page-header {
      flex-direction: column;
      align-items: flex-start;
      gap: 12px;
      margin-bottom: 16px;

      h2 {
        font-size: 18px;
        width: 100%;
        overflow: hidden;
        text-overflow: ellipsis;
        white-space: nowrap;
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

    .detail-layout {
      grid-template-columns: 1fr;
      gap: 16px;
    }

    .info-card {
      :deep(.el-card__header) {
        padding: 12px 16px;
        font-size: 14px;
      }

      :deep(.el-card__body) {
        padding: 16px 12px;
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
}
</style>
