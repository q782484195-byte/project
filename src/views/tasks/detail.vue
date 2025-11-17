<template>
  <div class="task-detail-page">
    <div class="page-header">
      <el-button type="text" class="back-button" @click="goBack">
        <el-icon>
          <ArrowLeft />
        </el-icon>
        返回
      </el-button>
      <h2>
        {{ task?.任务名 || task?.task_name || task?.title || "任务详情" }}
      </h2>
    </div>

    <div v-loading="loading" class="detail-content">
      <el-tabs v-if="task" v-model="activeTab" class="detail-tabs">
        <!-- 基本信息 Tab -->
        <el-tab-pane label="基本信息" name="info">
          <el-card class="info-card">
            <template #header>
              <span>基本信息</span>
            </template>
            <el-descriptions :column="1" border>
              <el-descriptions-item label="任务名称">{{
                task.任务名 || task.task_name || task.title || "-"
              }}</el-descriptions-item>
              <el-descriptions-item label="所属项目">{{
                task.project_name || "-"
              }}</el-descriptions-item>
              <el-descriptions-item label="关联需求">{{
                task.requirement_name || "-"
              }}</el-descriptions-item>
              <el-descriptions-item label="负责人">{{
                task.指派给 || task.assignee || "-"
              }}</el-descriptions-item>
              <el-descriptions-item label="状态">
                <div style="display: flex; align-items: center; gap: 12px">
                  <el-tag
                    :type="getStatusType(task.状态 || task.status) || undefined"
                    size="small"
                  >
                    {{ task.状态 || task.status || "-" }}
                  </el-tag>
                  <el-button
                    v-if="getNextStatus(task.状态 || task.status)"
                    type="primary"
                    size="small"
                    :loading="statusFlowLoading"
                    @click="handleStatusFlow"
                  >
                    流转
                  </el-button>
                </div>
              </el-descriptions-item>
              <el-descriptions-item label="优先级">
                <el-tag
                  :type="
                    getPriorityType(task.优先级 || task.priority) || undefined
                  "
                  size="small"
                >
                  {{ task.优先级 || task.priority || "-" }}
                </el-tag>
              </el-descriptions-item>
              <el-descriptions-item label="预计工时"
                >{{
                  task.预计工时 || task.estimated_time || 0
                }}
                小时</el-descriptions-item
              >
              <el-descriptions-item label="已用工时"
                >{{
                  task.已用工时 || task.actualHours || 0
                }}
                小时</el-descriptions-item
              >
              <el-descriptions-item label="进度">
                <el-progress :percentage="task.进度 || task.progress || 0" />
              </el-descriptions-item>
              <el-descriptions-item v-if="task.create_time" label="创建时间">
                {{ formatDate(task.create_time) }}
              </el-descriptions-item>
              <el-descriptions-item v-if="task.creator" label="创建人">{{
                task.creator
              }}</el-descriptions-item>
            </el-descriptions>
          </el-card>

          <!-- 任务描述 -->
          <el-card
            v-if="task?.describe && task.describe.length > 0"
            class="info-card"
          >
            <template #header>
              <span>任务描述</span>
            </template>
            <div class="task-description">
              <template v-for="(item, index) in task.describe" :key="index">
                <p
                  v-if="typeof item === 'string' && !item.startsWith('/data/')"
                  class="description-text"
                >
                  {{ item }}
                </p>
                <div
                  v-else-if="
                    typeof item === 'string' && item.startsWith('/data/')
                  "
                  class="description-image"
                >
                  <el-image
                    :src="getImageUrl(item)"
                    :alt="`图片 ${index + 1}`"
                    :preview-src-list="previewImageList"
                    :initial-index="getImageIndex(index)"
                    preview-teleported
                    fit="contain"
                    class="description-image-el"
                    @error="handleImageError"
                  />
                </div>
                <p v-else-if="item.type === 'text'" class="description-text">
                  {{ item.content }}
                </p>
                <div
                  v-else-if="item.type === 'url' || item.type === 'file'"
                  class="description-image"
                >
                  <el-image
                    :src="getImageUrl(item.content)"
                    :alt="`图片 ${index + 1}`"
                    :preview-src-list="previewImageList"
                    :initial-index="getImageIndex(index)"
                    preview-teleported
                    fit="contain"
                    class="description-image-el"
                    @error="handleImageError"
                  />
                </div>
              </template>
            </div>
          </el-card>

          <!-- 任务附件 -->
          <el-card
            v-if="task?.attachment && task.attachment.length > 0"
            class="info-card"
          >
            <template #header>
              <span>任务附件</span>
            </template>
            <div class="attachment-list">
              <div
                v-for="(attachment, index) in task.attachment"
                :key="index"
                class="attachment-item"
              >
                <el-icon class="attachment-icon">
                  <DocumentIcon />
                </el-icon>
                <a
                  :href="getAttachmentUrl(attachment)"
                  :download="getFileNameFromPath(attachment)"
                  class="attachment-link"
                  target="_blank"
                >
                  {{ getFileNameFromPath(attachment) }}
                </a>
                <el-button
                  type="text"
                  size="small"
                  @click="downloadAttachment(attachment)"
                >
                  <el-icon>
                    <Download />
                  </el-icon>
                  下载
                </el-button>
              </div>
            </div>
          </el-card>
        </el-tab-pane>

        <!-- 历史记录 Tab -->
        <el-tab-pane label="历史记录" name="history">
          <el-card class="history-card">
            <template #header>
              <span>历史记录</span>
            </template>
            <div
              v-if="task.历史记录 && task.历史记录.length > 0"
              class="history-list"
            >
              <div
                v-for="(record, index) in task.历史记录"
                :key="index"
                class="history-item"
              >
                <div class="history-content">{{ record }}</div>
              </div>
            </div>
            <el-empty v-else description="暂无历史记录" :image-size="100" />
          </el-card>
        </el-tab-pane>
      </el-tabs>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from "vue";
import { useRoute, useRouter } from "vue-router";
import { ElMessage } from "element-plus";
import {
  ArrowLeft,
  Document as DocumentIcon,
  Download
} from "@element-plus/icons-vue";
import dayjs from "dayjs";
import { updateTaskState } from "@/api/project";
import { TaskStatus } from "@/types";
import { useUserStoreHook } from "@/store/modules/user";

const route = useRoute();
const router = useRouter();
const userStore = useUserStoreHook();

const taskId = computed(() => route.params.id as string);
const projectId = computed(() => route.query.project_id as string | undefined);
const projectName = computed(
  () => route.query.project_name as string | undefined
);
const loading = ref(false);
const task = ref<any>(null);
const originalStatus = ref<string>("");
const activeTab = ref("info");
const statusFlowLoading = ref(false);

// 格式化日期
const formatDate = (date: string) => {
  if (!date) return "";
  return dayjs(date).format("YYYY-MM-DD HH:mm:ss");
};

// 获取状态类型
const getStatusType = (
  status: string
): "success" | "info" | "warning" | "danger" | undefined => {
  if (!status) return undefined;
  const map: Record<string, "success" | "info" | "warning" | "danger"> = {
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
  return map[status] || undefined;
};

// 获取优先级类型
const getPriorityType = (
  priority: string
): "success" | "info" | "warning" | "danger" | undefined => {
  const map: Record<string, "success" | "info" | "warning" | "danger"> = {
    低: "info",
    中: "warning",
    高: "danger",
    紧急: "danger"
  };
  return map[priority] || undefined;
};

// 获取图片 URL
const getImageUrl = (filePath: string): string => {
  if (!filePath) return "";
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

// 获取附件 URL
const getAttachmentUrl = (path: string): string => {
  return getImageUrl(path);
};

// 从路径中提取文件名
const getFileNameFromPath = (path: string): string => {
  if (!path) return "未知文件";
  const parts = path.split("/");
  return parts[parts.length - 1] || "未知文件";
};

// 下载附件
const downloadAttachment = (path: string) => {
  const url = getAttachmentUrl(path);
  const link = document.createElement("a");
  link.href = url;
  link.download = getFileNameFromPath(path);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
};

// 预览图片列表
const previewImageList = computed(() => {
  if (!task.value?.describe) return [];
  const images: string[] = [];
  task.value.describe.forEach((item: any) => {
    if (typeof item === "string" && item.startsWith("/data/")) {
      images.push(getImageUrl(item));
    } else if (item.type === "url" || item.type === "file") {
      images.push(getImageUrl(item.content));
    }
  });
  return images;
});

// 获取图片索引
const getImageIndex = (index: number): number => {
  if (!task.value?.describe) return 0;
  let imageIndex = 0;
  for (let i = 0; i < index; i++) {
    const item = task.value.describe[i];
    if (typeof item === "string" && item.startsWith("/data/")) {
      imageIndex++;
    } else if (item.type === "url" || item.type === "file") {
      imageIndex++;
    }
  }
  return imageIndex;
};

// 处理图片加载错误
const handleImageError = () => {
  console.error("图片加载失败");
};

// 获取下一个状态
const getNextStatus = (currentStatus: string): string | null => {
  if (!currentStatus) return null;

  const statusFlow: Record<string, string> = {
    [TaskStatus.PENDING_ASSIGN_TO_DEPT_LEADER]:
      TaskStatus.PENDING_ASSIGN_TO_MEMBER,
    [TaskStatus.PENDING_ASSIGN_TO_MEMBER]: TaskStatus.NOT_STARTED,
    [TaskStatus.NOT_STARTED]: TaskStatus.IN_PROGRESS,
    [TaskStatus.IN_PROGRESS]: TaskStatus.PENDING_TEST,
    [TaskStatus.PENDING_TEST]: TaskStatus.TESTING,
    [TaskStatus.TESTING]: TaskStatus.TEST_COMPLETED,
    [TaskStatus.TEST_COMPLETED]: TaskStatus.PENDING_REVIEW,
    [TaskStatus.PENDING_REVIEW]: TaskStatus.REVIEWING,
    [TaskStatus.REVIEWING]: TaskStatus.REVIEW_COMPLETED,
    [TaskStatus.REVIEW_COMPLETED]: TaskStatus.COMPLETED
  };

  return statusFlow[currentStatus] || null;
};

// 处理状态流转
const handleStatusFlow = async () => {
  if (!task.value) return;

  const currentState = task.value.状态 || task.value.status;
  const nextState = getNextStatus(currentState);

  if (!nextState) {
    ElMessage.warning("当前状态无法流转");
    return;
  }

  statusFlowLoading.value = true;
  try {
    const personName = userStore.username || userStore.nickname || "Admin";

    const response = await updateTaskState({
      task_id: task.value._id || task.value.id,
      current_state: currentState,
      next_state: nextState,
      person_name: personName
    });

    if (response.code === 200) {
      ElMessage.success("状态流转成功");
      // 更新任务状态
      task.value.状态 = nextState;
      originalStatus.value = nextState;
      // 更新 sessionStorage 中的数据
      sessionStorage.setItem(
        `task_${taskId.value}`,
        JSON.stringify(task.value)
      );
    } else {
      ElMessage.error(response.message || "状态流转失败");
    }
  } catch (error: any) {
    console.error("状态流转失败:", error);
    ElMessage.error(
      error?.response?.data?.message || error?.message || "状态流转失败"
    );
  } finally {
    statusFlowLoading.value = false;
  }
};

// 加载任务详情（从 sessionStorage 获取）
const loadTask = () => {
  if (!taskId.value) {
    ElMessage.error("任务ID不存在");
    router.push({ name: "TasksList" });
    return;
  }

  // 从 sessionStorage 中获取任务数据
  const taskDataStr = sessionStorage.getItem(`task_${taskId.value}`);

  if (taskDataStr) {
    try {
      task.value = JSON.parse(taskDataStr);

      // 如果 URL 中有 project_id，且任务数据中没有 project_id，则使用 URL 中的
      if (projectId.value && !task.value.project_id) {
        task.value.project_id = projectId.value;
      }
      // 如果 URL 中有 project_name，且任务数据中没有 project_name，则使用 URL 中的
      if (projectName.value && !task.value.project_name) {
        task.value.project_name = projectName.value;
      }

      // 保存原始状态
      originalStatus.value = task.value.状态 || task.value.status || "";

      // 确保状态字段存在
      if (!task.value.状态) {
        task.value.状态 = task.value.status || "";
      }

      // 清理 sessionStorage（可选，如果希望数据只使用一次）
      // sessionStorage.removeItem(`task_${taskId.value}`)
    } catch (error) {
      console.error("解析任务数据失败:", error);
      ElMessage.error("任务数据格式错误");
      router.push({ name: "TasksList" });
    }
  } else {
    ElMessage.error("未找到任务数据，请从任务列表页面进入");
    router.push({ name: "TasksList" });
  }
};

// 返回
const goBack = () => {
  // 构建查询参数，传递项目ID和需求ID
  const query: Record<string, string> = {};
  if (projectId.value) {
    query.project_id = projectId.value;
  }
  if (projectName.value) {
    query.project_name = projectName.value;
  }
  // 从任务数据中获取需求ID
  if (task.value?.requirement_id) {
    query.requirement_id = task.value.requirement_id;
  }
  if (task.value?.requirement_name) {
    query.requirement_name = task.value.requirement_name;
  }

  router.push({
    name: "TasksList",
    query: Object.keys(query).length > 0 ? query : undefined
  });
};

onMounted(() => {
  loadTask();
});
</script>

<style scoped lang="scss">
.task-detail-page {
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
    .detail-tabs {
      .info-card {
        margin-bottom: 20px;
      }

      .task-description {
        line-height: 1.8;
        color: #606266;
        font-size: 14px;
        white-space: pre-wrap;
        word-wrap: break-word;

        .description-text {
          margin: 8px 0;
        }

        .description-image {
          margin: 16px 0;
          text-align: center;

          .description-image-el {
            max-width: 100px;
            max-height: 100px;
            cursor: pointer;
            border-radius: 4px;
            transition: transform 0.3s;

            &:hover {
              transform: scale(1.02);
            }
          }
        }
      }

      .attachment-list {
        .attachment-item {
          display: flex;
          align-items: center;
          gap: 8px;
          padding: 12px;
          border: 1px solid #e4e7ed;
          border-radius: 4px;
          margin-bottom: 8px;
          transition: background-color 0.3s;

          &:hover {
            background-color: #f5f7fa;
          }

          .attachment-icon {
            font-size: 20px;
            color: #409eff;
          }

          .attachment-link {
            flex: 1;
            color: #606266;
            text-decoration: none;
            overflow: hidden;
            text-overflow: ellipsis;
            white-space: nowrap;

            &:hover {
              color: #409eff;
            }
          }
        }
      }

      .history-card {
        .history-list {
          .history-item {
            padding: 12px;
            border-bottom: 1px solid #e4e7ed;
            transition: background-color 0.3s;

            &:last-child {
              border-bottom: none;
            }

            &:hover {
              background-color: #f5f7fa;
            }

            .history-content {
              color: #606266;
              font-size: 14px;
              line-height: 1.6;
              word-wrap: break-word;
            }
          }
        }
      }
    }
  }

  // 状态选择器样式
  :deep(.status-select-info) {
    .el-input__inner {
      color: #409eff;
      border-color: #409eff;
    }
  }

  :deep(.status-select-warning) {
    .el-input__inner {
      color: #e6a23c;
      border-color: #e6a23c;
    }
  }

  :deep(.status-select-success) {
    .el-input__inner {
      color: #67c23a;
      border-color: #67c23a;
    }
  }

  :deep(.status-select-danger) {
    .el-input__inner {
      color: #f56c6c;
      border-color: #f56c6c;
    }
  }
}

// 全局样式：图片预览器
:global(.el-image-viewer__wrapper) {
  z-index: 3000;
}
</style>
