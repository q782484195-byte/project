<template>
  <div class="task-detail-page">
    <div class="page-header">
      <el-button type="text" class="back-button" @click="goBack">
        <el-icon>
          <ArrowLeft />
        </el-icon>
        返回
      </el-button>
      <h2 class="page-title">
        {{ task?.任务名 || task?.task_name || task?.title || "任务详情" }}
      </h2>

    </div>

    <div v-loading="loading" class="detail-content">
      <el-card v-if="task" class="main-card">
        <el-tabs v-model="activeTab" class="detail-tabs">
          <!-- 基本信息 Tab -->
          <el-tab-pane label="基本信息" name="info">
            <!-- 基本信息 -->
            <el-card class="info-card" shadow="never">
              <template #header>
                <span>基本信息</span>
                <el-button v-if="canOpenStatusFlow" type="primary" :loading="statusFlowLoading" class="ml-16"
                  @click="openStatusFlowDialog">
                  <el-icon>
                    <Share />
                  </el-icon>
                  分配
                </el-button>
              </template>
              <el-descriptions :column="infoDescriptionsColumn" border>
                <!-- 第1行：任务名称（左）| 所属项目（右） -->
                <el-descriptions-item label="任务名称">{{
                  task.任务名 || task.task_name || task.title || "-"
                  }}</el-descriptions-item>
                <el-descriptions-item label="所属项目">{{
                  task.project_name || "-"
                  }}</el-descriptions-item>
                <!-- 第2行：关联层级（左）| 创建人（右） -->
                <el-descriptions-item label="关联层级">{{
                  task.requirement_name || "-"
                  }}</el-descriptions-item>
                <el-descriptions-item label="项目负责人">{{
                  task.creator || "-"
                  }}</el-descriptions-item>
                <!-- 第3行：状态（左）| 负责人（右） -->
                <el-descriptions-item label="状态">
                  <div style="display: flex; align-items: center; gap: 12px">
                    <el-tag :type="getStatusType(task.状态 || task.status) || undefined" size="small">
                      {{ task.状态 || task.status || "-" }}
                    </el-tag>
                  </div>
                </el-descriptions-item>
                <el-descriptions-item label="当前处理人">{{
                  task.当前处理人 || task.assignee || "-"
                  }}</el-descriptions-item>
                <!-- 第4行：进度（左）| 优先级（右） -->
                <el-descriptions-item label="进度">
                  <el-progress :percentage="task.进度 || task.progress || 0" />
                </el-descriptions-item>
                <el-descriptions-item label="优先级">
                  <el-tag :type="getPriorityType(task.优先级 || task.priority) || undefined
                    " size="small">
                    {{ task.优先级 || task.priority || "-" }}
                  </el-tag>
                </el-descriptions-item>
                <!-- 独占一行的字段 -->
                <el-descriptions-item v-if="task.task_deadline || task.task_dead_line" label="任务截止日期" :span="2">
                  <span class="yellow-text">{{ task.task_deadline || task.task_dead_line || "-" }}</span>
                </el-descriptions-item>
                <el-descriptions-item v-if="task.development_start_time" label="研发开始时间" :span="2">
                  <span class="yellow-text">{{ task.development_start_time }}</span>
                </el-descriptions-item>
                <el-descriptions-item v-if="task.development_end_time" label="研发结束时间" :span="2">
                  <span class="yellow-text">{{ task.development_end_time }}</span>
                </el-descriptions-item>
                <el-descriptions-item label="驳回原因" :span="2">
                  <span class="red-text">{{ task.rejection_reason || '' }}</span>
                </el-descriptions-item>
              </el-descriptions>
            </el-card>

            <!-- 任务描述 -->
            <el-card v-if="task?.describe && task.describe.length > 0" class="info-card" shadow="never">
              <template #header>
                <span>任务描述</span>
              </template>
              <div class="task-description">
                <template v-for="(item, index) in task.describe" :key="index">
                  <p v-if="typeof item === 'string' && !item.startsWith('/data/')" class="description-text">
                    {{ item }}
                  </p>
                  <div v-else-if="
                    typeof item === 'string' && item.startsWith('/data/')
                  " class="description-image">
                    <el-image :src="getImageUrl(item)" :alt="`图片 ${Number(index) + 1}`"
                      :preview-src-list="previewImageList" :initial-index="getImageIndex(Number(index))"
                      preview-teleported fit="contain" class="description-image-el" @error="handleImageError" />
                  </div>
                  <p v-else-if="item.type === 'text'" class="description-text">
                    {{ item.content }}
                  </p>
                  <div v-else-if="item.type === 'url' || item.type === 'file'" class="description-image">
                    <el-image :src="getImageUrl(item.content)" :alt="`图片 ${Number(index) + 1}`"
                      :preview-src-list="previewImageList" :initial-index="getImageIndex(Number(index))"
                      preview-teleported fit="contain" class="description-image-el" @error="handleImageError" />
                  </div>
                </template>
              </div>
            </el-card>
            <el-card v-else class="info-card" shadow="never">
              <template #header>
                <span>任务描述</span>
              </template>
              <el-empty description="暂无任务描述" :image-size="100" />
            </el-card>

            <!-- 汇报记录 -->
            <el-card class="info-card" shadow="never">
              <template #header>
                <span>汇报记录</span>
              </template>
              <div v-loading="reportsLoading" ref="reportTableContainerRef">
                <el-table :data="reportList" :style="{ width: '100%' }" :height="reportTableHeight"
                  v-if="reportList.length > 0">
                  <el-table-column prop="task_name" label="任务名称" />
                  <el-table-column prop="任务进度" label="进度">
                    <template #default="{ row }">
                      <span>{{ row.任务进度 || '-' }}</span>
                    </template>
                  </el-table-column>
                  <el-table-column prop="state" label="状态" />
                  <el-table-column prop="message" label="汇报内容" show-overflow-tooltip />

                  <el-table-column prop="create_time" label="汇报时间" />
                </el-table>
                <el-empty v-else description="暂无汇报记录" :image-size="100" />
                <el-pagination v-if="reportTotal > 0" v-model:current-page="reportPage"
                  v-model:page-size="reportPageSize" :total="reportTotal" :page-sizes="[10, 20, 50, 100]"
                  layout="total, sizes, prev, pager, next, jumper" @size-change="handleReportPageSizeChange"
                  @current-change="handleReportPageChange" style="margin-top: 16px; justify-content: flex-end" />
              </div>
            </el-card>

            <!-- 任务附件 -->
            <el-card v-if="task?.attachment && task.attachment.length > 0" class="info-card" shadow="never">
              <template #header>
                <span>任务附件</span>
              </template>
              <div class="attachment-list">
                <div v-for="(attachment, index) in task.attachment" :key="index" class="attachment-item">
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
          </el-tab-pane>

          <!-- 历史记录 Tab -->
          <el-tab-pane label="历史记录" name="history">
            <el-card class="history-card" shadow="never">
              <template #header>
                <span>历史记录</span>
              </template>
              <div v-if="task.历史记录 && task.历史记录.length > 0" class="history-list">
                <div v-for="(record, index) in task.历史记录" :key="index" class="history-item">
                  <div class="history-content">{{ record }}</div>
                </div>
              </div>
              <el-empty v-else description="暂无历史记录" :image-size="100" />
            </el-card>
          </el-tab-pane>

          <!-- BUG记录 Tab -->
          <el-tab-pane label="BUG记录" name="bugs">
            <el-card class="bugs-card" shadow="never">
              <template #header>
                <div class="bugs-header">
                  <span>BUG记录</span>
                  <el-button v-if="canRecordBug(task?.状态 || task?.status)" type="primary" size="small"
                    @click="openBugDialog">
                    记录BUG
                  </el-button>
                </div>
              </template>
              <div v-loading="bugsLoading" ref="bugTableContainerRef">
                <el-table :data="bugList" :style="{ width: '100%' }" :height="bugTableHeight" v-if="bugList.length > 0">
                  <el-table-column prop="bug_name" label="BUG名称" min-width="200" />
                  <el-table-column prop="describe" label="BUG描述" min-width="300" show-overflow-tooltip />
                  <el-table-column prop="create_time" label="创建时间" width="180" />
                  <el-table-column prop="creator" label="创建人" width="120" />
                </el-table>
                <el-empty v-else description="暂无BUG记录" :image-size="100" />
                <el-pagination v-if="bugTotal > 0" v-model:current-page="bugPage" v-model:page-size="bugPageSize"
                  :total="bugTotal" :page-sizes="[10, 20, 50, 100]" layout="total, sizes, prev, pager, next, jumper"
                  @size-change="handleBugPageSizeChange" @current-change="handleBugPageChange"
                  style="margin-top: 16px; justify-content: flex-end" />
              </div>
            </el-card>
          </el-tab-pane>
        </el-tabs>
      </el-card>
      <TaskStatusFlowDialog v-model:visible="statusFlowDialogVisible" :task="task"
        @success="handleStatusFlowDialogSuccess" @flow-start="handleStatusFlowStart" @flow-end="handleStatusFlowEnd" />

      <!-- BUG记录对话框 -->
      <el-dialog v-model="bugDialogVisible" title="记录BUG" width="600px" append-to-body>
        <el-form ref="bugFormRef" :model="bugForm" :rules="bugFormRules" label-width="100px">
          <el-form-item label="BUG名称" prop="bug_name">
            <el-input v-model="bugForm.bug_name" placeholder="请输入BUG名称" />
          </el-form-item>
          <el-form-item label="BUG描述" prop="describe">
            <el-input v-model="bugForm.describe" type="textarea" :rows="4" placeholder="请输入BUG描述" />
          </el-form-item>
          <el-form-item label="关联项目">
            <el-input v-model="bugForm.project_name" disabled />
          </el-form-item>
          <el-form-item label="关联任务">
            <el-input v-model="bugForm.task_name" disabled />
          </el-form-item>
        </el-form>
        <template #footer>
          <span class="dialog-footer">
            <el-button @click="bugDialogVisible = false">取消</el-button>
            <el-button type="primary" :loading="bugSubmitting" @click="submitBug">提交</el-button>
          </span>
        </template>
      </el-dialog>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted, nextTick, watch } from "vue";
import { useRoute, useRouter } from "vue-router";
import { ElMessage } from "element-plus";
import {
  ArrowLeft,
  Document as DocumentIcon,
  Download,
  Share
} from "@element-plus/icons-vue";
import { TaskStatus } from "@/types";
import TaskStatusFlowDialog from "@/components/TaskStatusFlowDialog.vue";
import { createBug, selectBugsByTask, type BugRecord } from "@/api/bug";
import { selectReportList, selectTaskInfo } from "@/api/project";
import type { FormInstance, FormRules } from "element-plus";
import { useUserStore } from "@/store/modules/user";
const userStore = useUserStore();
const route = useRoute();
const router = useRouter();

const taskId = computed(() => route.params.id as string);
const projectId = computed(() => route.query.project_id as string | undefined);
const projectName = computed(
  () => route.query.project_name as string | undefined
);
const from = computed(() => route.query.from as string | undefined);
const loading = ref(false);
const task = ref<any>(null);
const originalStatus = ref<string>("");
const activeTab = ref("info");
const statusFlowLoading = ref(false);
const statusFlowDialogVisible = ref(false);

// 移动端检测：基本信息描述列表在移动端一行一个
const windowWidth = ref(typeof window !== "undefined" ? window.innerWidth : 1024);
const isMobile = computed(() => windowWidth.value <= 640);
const infoDescriptionsColumn = computed(() => (isMobile.value ? 1 : 2));

// BUG记录相关
const bugList = ref<BugRecord[]>([]);
const bugsLoading = ref(false);
const bugPage = ref(1);
const bugPageSize = ref(10);
const bugTotal = ref(0);

// 汇报记录相关
const reportList = ref<any[]>([]);
const reportsLoading = ref(false);
const reportPage = ref(1);
const reportPageSize = ref(10);
const reportTotal = ref(0);

// 表格高度相关
const bugTableContainerRef = ref<HTMLElement>();
const bugTableHeight = ref<number>(400);
const reportTableContainerRef = ref<HTMLElement>();
const reportTableHeight = ref<number>(400);

// 计算BUG表格高度
const calculateBugTableHeight = () => {
  nextTick(() => {
    if (!bugTableContainerRef.value) return;

    const viewportHeight = window.innerHeight;
    const containerRect = bugTableContainerRef.value.getBoundingClientRect();
    const containerTopToViewportBottom = viewportHeight - containerRect.top;
    const cardHeaderHeight = 50; // card header高度
    const cardPadding = 40;
    const paginationHeight = 60;
    const bottomPadding = 20;
    const availableHeight = containerTopToViewportBottom - cardHeaderHeight - cardPadding - paginationHeight - bottomPadding;
    bugTableHeight.value = Math.max(300, availableHeight);
  });
};

// 计算汇报表格高度
const calculateReportTableHeight = () => {
  nextTick(() => {
    if (!reportTableContainerRef.value) return;

    const viewportHeight = window.innerHeight;
    const containerRect = reportTableContainerRef.value.getBoundingClientRect();
    const containerTopToViewportBottom = viewportHeight - containerRect.top;
    const cardHeaderHeight = 50; // card header高度
    const cardPadding = 40;
    const paginationHeight = 60;
    const bottomPadding = 20;
    const availableHeight = containerTopToViewportBottom - cardHeaderHeight - cardPadding - paginationHeight - bottomPadding;
    reportTableHeight.value = Math.max(300, availableHeight);
  });
};

// 窗口大小改变时重新计算
const handleResize = () => {
  windowWidth.value = window.innerWidth;
  calculateBugTableHeight();
  calculateReportTableHeight();
};

// BUG记录对话框
const bugDialogVisible = ref(false);
const bugFormRef = ref<FormInstance>();
const bugSubmitting = ref(false);
const bugForm = ref({
  bug_name: "",
  describe: "",
  project_id: "",
  task_id: "",
  task_name: "",
  project_name: ""
});

const bugFormRules: FormRules = {
  bug_name: [
    { required: true, message: "请输入BUG名称", trigger: "blur" }
  ],
  describe: [
    { required: true, message: "请输入BUG描述", trigger: "blur" }
  ]
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

const handleStatusFlowDialogSuccess = async (
  nextState: string,
  personName: string
) => {
  if (!task.value) return;
  task.value.状态 = nextState;
  task.value.status = nextState;
  originalStatus.value = nextState;
  if (personName) {
    task.value.指派人 = personName;
    task.value.assignee = personName;
  }
  // 分配完成后刷新详情
  await loadTask();
};

const handleStatusFlowStart = () => {
  statusFlowLoading.value = true;
};

const handleStatusFlowEnd = () => {
  statusFlowLoading.value = false;
};

// 是否可进行分配（有下一状态且非终态，且当前处理人为当前用户）
const canOpenStatusFlow = computed(() => {
  const t = task.value;
  if (!t) return false;
  const status = t.状态 || t.status || "";

  if ((status === TaskStatus.CANCELLED || status === "已取消")) {
    return false;
  }
  // 当前处理人不是当前用户时，不能进行分配/状态流转
  const currentHandler = t.当前处理人 || t.assignee || "";
  if (currentHandler && currentHandler !== userStore.username) {
    return false;
  }
  const nextState = t.next_state;
  return Array.isArray(nextState) && nextState.length > 0;
});

// 打开分配/状态流转弹窗
const openStatusFlowDialog = () => {
  if (!task.value) return;
  statusFlowDialogVisible.value = true;
};

// 加载任务详情（调用 API）
const loadTask = async () => {
  if (!taskId.value) {
    ElMessage.error("任务ID不存在");
    router.push({ name: "TasksList" });
    return;
  }

  loading.value = true;
  try {
    const response = await selectTaskInfo({
      task_id: taskId.value
    });

    if (response.code === 200) {
      task.value = response.result || response.data || null;

      if (!task.value) {
        ElMessage.error("未找到任务详情");
        router.push({ name: "TasksList" });
        return;
      }

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

      // 加载汇报记录
      loadReports();
    } else {
      ElMessage.error(response.message || "获取任务详情失败");
      router.push({ name: "TasksList" });
    }
  } catch (error: any) {
    console.error("获取任务详情失败:", error);
    ElMessage.error(
      error?.response?.data?.message || error?.message || "获取任务详情失败"
    );
    router.push({ name: "TasksList" });
  } finally {
    loading.value = false;
  }
};

// 返回
const goBack = () => {
  // 根据来源决定返回到哪里
  if (from.value === "workspace") {
    // 从工作台进入的，返回到工作台
    router.push({ name: "Workspace" });
  }

  else if (from.value === "dashboard") {
    // 从dashboard进入的，返回到dashboard
    router.push({ name: "Dashboard" });
  } else {
    // 从任务列表进入的，返回到任务列表
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
  }
};

// 判断是否可以记录BUG（测试或审阅状态）
const canRecordBug = (status: string): boolean => {
  if (!status) return false;
  const testReviewStatuses = [
    TaskStatus.PENDING_TEST,
    TaskStatus.TESTING,
    TaskStatus.TEST_COMPLETED,
    TaskStatus.PENDING_REVIEW,
    TaskStatus.REVIEWING,
    TaskStatus.REVIEW_COMPLETED,
    "待测试", "测试中", "测试完毕",
    "待审阅", "审阅中", "审阅完毕",
    "测试审阅中"
  ];
  return testReviewStatuses.includes(status);
};

// 加载BUG记录
const loadBugs = async () => {
  if (!task.value) return;
  const currentTaskId = task.value._id || task.value.id;
  if (!currentTaskId) return;

  bugsLoading.value = true;
  try {
    const response = await selectBugsByTask({
      task_id: currentTaskId,
      page: bugPage.value,
      page_size: bugPageSize.value
    });

    if (response.code === 200) {
      bugList.value = response.result || response.data || [];
      bugTotal.value = response.total_count || response.total || bugList.value.length;
    } else {
      ElMessage.error(response.message || "加载BUG记录失败");
      bugList.value = [];
      bugTotal.value = 0;
    }
  } catch (error: any) {
    console.error("加载BUG记录失败:", error);
    ElMessage.error(
      error?.response?.data?.message || error?.message || "加载BUG记录失败"
    );
    bugList.value = [];
    bugTotal.value = 0;
  } finally {
    bugsLoading.value = false;
  }
};

// 打开BUG记录对话框
const openBugDialog = () => {
  if (!task.value) return;
  bugForm.value = {
    bug_name: "",
    describe: "",
    project_id: task.value.project_id || "",
    task_id: task.value._id || task.value.id || "",
    task_name: task.value.任务名 || task.value.task_name || task.value.title || "",
    project_name: task.value.project_name || ""
  };
  bugDialogVisible.value = true;
  nextTick(() => {
    bugFormRef.value?.clearValidate();
  });
};

// 提交BUG记录
const submitBug = async () => {
  if (!bugFormRef.value) return;

  await bugFormRef.value.validate(async (valid) => {
    if (!valid) return;

    bugSubmitting.value = true;
    try {
      const response = await createBug({
        bug_name: bugForm.value.bug_name,
        describe: bugForm.value.describe,
        project_id: bugForm.value.project_id,
        task_id: bugForm.value.task_id,
        task_name: bugForm.value.task_name
      });

      if (response.code === 200) {
        ElMessage.success("BUG记录成功");
        bugDialogVisible.value = false;
        bugForm.value = {
          bug_name: "",
          describe: "",
          project_id: "",
          task_id: "",
          task_name: "",
          project_name: ""
        };
        // 重新加载BUG记录列表
        await loadBugs();
      } else {
        ElMessage.error(response.message || "BUG记录失败");
      }
    } catch (error: any) {
      console.error("提交BUG失败:", error);
      ElMessage.error(
        error?.response?.data?.message || error?.message || "BUG记录失败"
      );
    } finally {
      bugSubmitting.value = false;
    }
  });
};

// BUG分页处理
const handleBugPageSizeChange = (size: number) => {
  bugPageSize.value = size;
  bugPage.value = 1;
  loadBugs();
};

const handleBugPageChange = (page: number) => {
  bugPage.value = page;
  loadBugs();
};

// 加载汇报记录
const loadReports = async () => {
  if (!task.value) return;
  const currentTaskId = task.value._id || task.value.id;
  if (!currentTaskId) return;

  reportsLoading.value = true;
  try {
    const response = await selectReportList({
      task_id: currentTaskId,
      page: reportPage.value,
      page_size: reportPageSize.value
    });

    if (response.code === 200) {
      reportList.value = response.result || response.data || [];
      reportTotal.value = (response as any).total_count || (response as any).total || reportList.value.length;
      // 计算表格高度
      nextTick(() => {
        calculateReportTableHeight();
      });
    } else {
      ElMessage.error(response.message || "加载汇报记录失败");
      reportList.value = [];
      reportTotal.value = 0;
    }
  } catch (error: any) {
    console.error("加载汇报记录失败:", error);
    ElMessage.error(
      error?.response?.data?.message || error?.message || "加载汇报记录失败"
    );
    reportList.value = [];
    reportTotal.value = 0;
  } finally {
    reportsLoading.value = false;
  }
};

// 汇报记录分页处理
const handleReportPageSizeChange = (size: number) => {
  reportPageSize.value = size;
  reportPage.value = 1;
  loadReports();
};

const handleReportPageChange = (page: number) => {
  reportPage.value = page;
  loadReports();
};

// 监听activeTab变化，切换到BUG记录tab时加载数据
watch(
  () => activeTab.value,
  (newTab) => {
    if (newTab === "bugs" && task.value) {
      loadBugs();
    }
  }
);

onMounted(() => {
  loadTask();
  calculateBugTableHeight();
  calculateReportTableHeight();
  window.addEventListener('resize', handleResize);
});

onUnmounted(() => {
  window.removeEventListener('resize', handleResize);
});
</script>

<style scoped lang="scss">
.task-detail-page {
  .page-header {
    display: flex;
    align-items: center;
    gap: 12px;
    margin-bottom: 20px;

    .page-title {
      flex: 1;
      margin: 0;
      font-size: 24px;
      font-weight: 600;
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
    }

    .header-actions {
      display: flex;
      align-items: center;
      gap: 8px;
      flex-shrink: 0;
    }

    .back-button {
      padding: 0;
    }
  }

  .detail-content {
    .main-card {
      .detail-tabs {
        .info-card {
          margin-bottom: 20px;

          // 基本信息卡片头部：标题在左，分配按钮在右侧靠边
          :deep(.el-card__header) {
            display: flex;
            align-items: center;
            justify-content: space-between;
            gap: 12px;
          }

          .header-actions {
            display: flex;
            align-items: center;
            gap: 8px;
          }
        }

        .task-description {
          line-height: 1.8;
          color: #606266;
          font-size: 14px;
          white-space: pre-wrap;
          word-wrap: break-word;
          text-align: left;

          .description-text {
            margin: 8px 0;
            text-align: left;
          }

          .description-image {
            margin: 16px 0;
            text-align: left;

            .description-image-el {
              max-width: 400px;
              max-height: 400px;
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

        .bugs-card {
          .bugs-header {
            display: flex;
            justify-content: space-between;
            align-items: center;
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

  // 基本信息颜色样式
  .yellow-text {
    color: #e6a23c;
    font-weight: 500;
  }

  .red-text {
    color: #f56c6c;
    font-weight: 500;
  }
}

// 全局样式：图片预览器
:global(.el-image-viewer__wrapper) {
  z-index: 3000;
}

// 移动端适配 (640px)
@media (max-width: 640px) {
  .task-detail-page {
    padding: 12px;
  }

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

    .back-button {
      font-size: 14px;
      padding: 4px 8px;
    }
  }

  .detail-content {
    .main-card {
      :deep(.el-card__body) {
        padding: 12px;
      }
    }

    .detail-tabs {
      :deep(.el-tabs__header) {
        overflow-x: auto;
        overflow-y: hidden;
        -webkit-overflow-scrolling: touch;
        scrollbar-width: none;
        -ms-overflow-style: none;

        &::-webkit-scrollbar {
          display: none;
        }
      }

      :deep(.el-tabs__nav) {
        white-space: nowrap;
      }

      :deep(.el-tabs__item) {
        padding: 8px 12px;
        font-size: 13px;
        white-space: nowrap;
      }

      :deep(.el-tabs__content) {
        padding: 12px 0;
      }
    }

    .info-card {
      margin-bottom: 12px;

      :deep(.el-card__header) {
        padding: 12px 16px;
        font-size: 14px;
      }

      :deep(.el-card__body) {
        padding: 16px 12px;
      }
    }

    :deep(.el-descriptions) {
      .el-descriptions__table {
        .el-descriptions__label {
          width: 100px;
          font-size: 13px;
        }

        .el-descriptions__content {
          font-size: 13px;
        }
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

    .task-description {
      .description-image {
        .description-image-el {
          max-width: 100% !important;
          max-height: 300px;
        }
      }
    }
  }
}
</style>
