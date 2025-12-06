<template>
  <div class="project-detail-page">
    <div class="page-header">
      <div class="header-left">
        <el-button type="text" class="back-button" @click="goBack">
          <el-icon>
            <ArrowLeft />
          </el-icon>
          返回
        </el-button>
        <h2>{{ project?.name || "项目详情" }}</h2>
      </div>
      <!-- <div class="header-actions">
        <el-button type="primary" @click="handleEdit">
          <el-icon>
            <Edit />
          </el-icon>
          编辑项目
        </el-button>
      </div> -->
    </div>

    <div v-loading="loading" class="detail-content">
      <!-- 项目统计信息 - Tab 形式 -->
      <el-card v-if="project" class="statistics-card">
        <el-tabs v-model="activeTab" class="statistics-tabs">
          <el-tab-pane label="项目统计" name="statistics">
            <div v-if="projectStatistics" class="statistics-content">
              <div class="statistics-header">
                <el-button type="primary" :loading="importingRequirement" @click="handleImportRequirement">
                  <el-icon>
                    <InfoFilled />
                  </el-icon>
                  导入需求
                </el-button>
                <el-button type="primary" @click="showInfoDrawer = true">
                  <el-icon>
                    <InfoFilled />
                  </el-icon>
                  查看项目信息
                </el-button>
              </div>
              <el-row :gutter="8" style="margin-top: 12px">
                <el-col :span="6">
                  <div class="stat-item stat-in-progress">
                    <div class="stat-label">进行中</div>
                    <div class="stat-value">{{ projectStatistics.进行中 }}</div>
                  </div>
                </el-col>
                <el-col :span="6">
                  <div class="stat-item stat-testing">
                    <div class="stat-label">测试审阅中</div>
                    <div class="stat-value">{{ projectStatistics.测试审阅中 }}</div>
                  </div>
                </el-col>
                <el-col :span="6">
                  <div class="stat-item stat-completed">
                    <div class="stat-label">已完成</div>
                    <div class="stat-value">{{ projectStatistics.已完成 }}</div>
                  </div>
                </el-col>
                <el-col :span="6">
                  <div class="stat-item stat-cancelled">
                    <div class="stat-label">已取消</div>
                    <div class="stat-value">{{ projectStatistics.已取消 }}</div>
                  </div>
                </el-col>
              </el-row>

              <!-- 需求任务管理模块 -->
              <div v-if="requirementsTasksData" class="requirements-tasks-manager" style="margin-top: 20px">
                <el-tabs v-model="activeCategoryTab" type="border-card">
                  <el-tab-pane v-for="(categoryData, categoryName) in requirementsTasksData" :key="categoryName"
                    :label="categoryName" :name="categoryName">
                    <RequirementTaskTree :data="categoryData" :category-name="categoryName" :project-id="project?.id"
                      :project-name="project?.name" @add="handleAddRequirementOrTask"
                      @edit="handleEditRequirementOrTask" @delete="handleDeleteRequirementOrTask"
                      @refresh="handleRequirementTaskRefresh" />
                  </el-tab-pane>
                </el-tabs>
              </div>
            </div>
            <div v-else class="statistics-loading">
              <el-skeleton :rows="3" animated />
            </div>
          </el-tab-pane>
          <el-tab-pane label="项目总览" name="overview">
            <ProjectStructureTree :tree-data="structureTreeData" :loading="structureTreeLoading"
              :root-title="project?.name || '项目结构'" />
          </el-tab-pane>
          <el-tab-pane label="BUG统计" name="bug-statistics">
            <div v-loading="bugStatisticsLoading" class="bug-statistics-content">
              <!-- BUG统计卡片 -->
              <div v-if="bugList && bugList.length > 0" class="bug-stats-summary">
                <el-row :gutter="12">
                  <el-col :span="6">
                  </el-col>
                </el-row>
              </div>
              <!-- BUG列表 -->
              <el-card v-if="bugList && bugList.length > 0" class="bug-list-card" shadow="never">
                <template #header>
                  <div class="bug-list-header">
                    <span>BUG列表</span>
                  </div>
                </template>
                <el-table :data="bugList" :style="{ width: '100%' }" stripe>
                  <el-table-column prop="bug_name" label="BUG名称" min-width="200" />
                  <el-table-column prop="describe" label="BUG描述" min-width="300" show-overflow-tooltip />
                  <el-table-column prop="requirement_name" label="所属需求" width="150" />
                  <el-table-column prop="task_name" label="所属任务" width="150" />
                  <el-table-column prop="creator" label="创建人" width="120" />
                  <el-table-column prop="create_time" label="创建时间" width="180" />
                </el-table>
              </el-card>
              <div v-else-if="!bugStatisticsLoading" class="bug-empty">
                <el-empty description="暂无BUG记录" :image-size="100" />
              </div>
            </div>
          </el-tab-pane>
        </el-tabs>
      </el-card>

      <div v-if="project && activeTab === 'statistics'" class="detail-layout">


      </div>

    </div>


    <!-- 项目信息 Drawer -->
    <el-drawer v-model="showInfoDrawer" title="项目信息" :size="500" direction="rtl">
      <div v-if="project" class="info-drawer-content">
        <!-- 基本信息 -->
        <el-card class="info-card">
          <template #header>
            <span>基本信息</span>
          </template>
          <el-descriptions :column="1" border>
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
            <el-descriptions-item label="计划开始时间">{{
              formatDate(project.startDate)
            }}</el-descriptions-item>
            <el-descriptions-item label="计划结束时间">{{
              formatDate(project.endDate)
            }}</el-descriptions-item>
            <el-descriptions-item v-if="project.createdAt" label="创建时间">{{
              formatDate(project.createdAt)
            }}</el-descriptions-item>
          </el-descriptions>
        </el-card>

        <!-- 项目描述 -->
        <el-card v-if="project.describe && project.describe.length > 0" class="info-card" style="margin-top: 16px">
          <template #header>
            <span>项目描述</span>
          </template>
          <div class="project-description">
            <template v-for="(item, index) in project.describe" :key="index">
              <p v-if="item.type === 'text'" class="description-text">
                {{ item.content }}
              </p>
              <div v-else-if="item.type === 'url'" class="description-image">
                <el-image :src="getImageUrl(item.content)" :alt="`图片 ${index + 1}`" :preview-src-list="previewImageList"
                  :initial-index="getImageIndex(index)" preview-teleported fit="contain" class="description-image-el"
                  @error="handleImageError" />
              </div>
              <div v-else-if="item.type === 'file'" class="description-image">
                <el-image :src="getImageUrl(item.content)" :alt="item.content" :preview-src-list="previewImageList"
                  :initial-index="getImageIndex(index)" preview-teleported fit="contain" class="description-image-el"
                  @error="handleImageError" />
              </div>
            </template>
          </div>
        </el-card>
        <el-card v-else-if="project.description" class="info-card" style="margin-top: 16px">
          <template #header>
            <span>项目描述</span>
          </template>
          <div class="project-description">{{ project.description }}</div>
        </el-card>

        <!-- 立项文件 -->
        <el-card v-if="(project as any).project_proposal && (project as any).project_proposal.length > 0"
          class="info-card" style="margin-top: 16px">
          <template #header>
            <span>立项文件</span>
          </template>
          <div class="attachment-list">
            <div v-for="(file, index) in (project as any).project_proposal" :key="index" class="attachment-item">
              <el-icon class="attachment-icon">
                <Document />
              </el-icon>
              <span class="attachment-link">{{ getFileName(file) }}</span>
              <el-button type="primary" link size="small" @click="downloadAttachment(file)">
                <el-icon>
                  <Download />
                </el-icon>
                下载
              </el-button>
            </div>
          </div>
        </el-card>

        <!-- 项目附件 -->
        <el-card v-if="project.attachment && project.attachment.length > 0" class="info-card" style="margin-top: 16px">
          <template #header>
            <span>项目附件</span>
          </template>
          <div class="attachment-list">
            <div v-for="(file, index) in project.attachment" :key="index" class="attachment-item">
              <el-icon class="attachment-icon">
                <Document />
              </el-icon>
              <span class="attachment-link">{{ getFileName(file) }}</span>
              <el-button type="primary" link size="small" @click="downloadAttachment(file)">
                <el-icon>
                  <Download />
                </el-icon>
                下载
              </el-button>
            </div>
          </div>
        </el-card>
      </div>
    </el-drawer>

    <!-- 任务列表 Drawer -->
    <el-drawer v-model="showTasksDrawer" title="任务列表" :size="600" direction="rtl">
      <template #header>
        <div style="display: flex; justify-content: space-between; align-items: center; width: 100%;">
          <span>任务列表 - {{ selectedRequirement?.title || (selectedRequirement as any)?.需求名 || '需求任务' }}</span>
          <el-button type="primary" size="small" @click="handleAddTask">
            <el-icon>
              <Plus />
            </el-icon>
            新建任务
          </el-button>
        </div>
      </template>
      <div v-loading="tasksLoading" class="task-list-drawer">
        <div v-if="requirementTasks.length === 0" class="empty-tasks">
          <el-empty description="该需求暂无任务" :image-size="80">
            <el-button type="primary" @click="handleAddTask">创建第一个任务</el-button>
          </el-empty>
        </div>
        <div v-else class="tasks-container">
          <div v-for="task in requirementTasks" :key="task.id || task._id" class="task-item">
            <div class="task-main">
              <div class="task-title-row">
                <span class="task-title" :class="{
                  completed: (task.status === TaskStatus.COMPLETED) || (task.状态 === '已完成')
                }">{{ task.title || task.任务名 || task.task_name || '-' }}</span>
                <el-tag :type="getTaskStatusTagType(task.status || task.状态)" size="small">
                  {{ getTaskStatusText(task.status || task.状态) }}
                </el-tag>
              </div>
              <p v-if="task.description || task.describe" class="task-description">
                {{
                  task.description ||
                  (Array.isArray(task.describe)
                    ? task.describe
                      .map((d: any) => d.content || d)
                      .join(" ")
                    : "")
                }}
              </p>
              <div class="task-meta">
                <div v-if="task.assignee || task.指派人" class="task-assignee">
                  <el-tag type="info" size="small">
                    {{ task.assignee?.name || task.指派人 || task.assignee || '-' }}
                  </el-tag>
                </div>
                <div v-if="task.priority || task.优先级" class="task-priority">
                  <el-tag :type="getPriorityTagType(task.priority || task.优先级)" size="small">
                    {{ getPriorityText(task.priority || task.优先级) }}
                  </el-tag>
                </div>
                <div v-if="task.预计工时" class="task-hours">
                  <el-icon>
                    <Clock />
                  </el-icon>
                  <span>{{ task.预计工时 }}小时</span>
                </div>
              </div>
            </div>
            <div class="task-actions">
              <el-button type="primary" link size="small" @click="handleViewTask(task)">查看</el-button>
              <el-button type="text" size="small" @click="handleEditTask(task)">编辑</el-button>
              <el-button type="text" size="small" @click="handleDeleteTask(task)">删除</el-button>
            </div>
          </div>
        </div>
      </div>
    </el-drawer>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch, onMounted, nextTick } from "vue";
import { useRoute, useRouter } from "vue-router";
import type { Project, Task, Requirement } from "@/types";
import {
  TaskStatus,
  RequirementStatus,
  type RequirementPriority
} from "@/types";
import * as dayjsLib from "dayjs";
const dayjs: typeof import("dayjs") = ((dayjsLib as any).default || dayjsLib) as typeof import("dayjs");
import { ElMessage, ElMessageBox } from "element-plus";
import {
  ArrowLeft,
  Edit,
  Plus,
  Calendar,
  Folder,
  Document,
  Download,
  Clock,
  InfoFilled,
  Delete
} from "@element-plus/icons-vue";
import type { RequirementItemData } from "@/api/project";
import {
  updateProjectState,
  selectProjects,
  selectRequirements,
  getProjectStatistics,
  selectTasksByRequirement,
  selectAllRequirementsAndTasks,
  isRequirementItem,
  selectProjectSelectAll,
  loadRequirementFromJson,
  type RequirementListItem,
  type DescribeContent,
  type ProjectStatisticsResponse,
  type TaskListItem,
  type RequirementWithTasksItem,
  type TaskWithDetailItem
} from "@/api/project";
import { useProjectStoreHook } from "@/store/modules/project";
import RequirementDrawer from "@/components/RequirementDrawer.vue";
import ProjectStructureTree, { StructureTreeNode } from "@/components/ProjectStructureTree.vue";
import RequirementTaskTree from "@/components/RequirementTaskTree.vue";

const route = useRoute();
const router = useRouter();

const project = ref<Project | null>(null);
const projectStatistics = ref<ProjectStatisticsResponse | null>(null);
const loading = ref(false);
const currentStatus = ref<string>("");
const statusUpdating = ref(false);
// 树形需求节点类型
interface RequirementTreeNode {
  id: string;
  label: string;
  type: "folder" | "requirement";
  data?: RequirementListItem; // 如果是需求节点，包含完整数据
  children?: RequirementTreeNode[];
  isLeaf?: boolean;
}

const projectRequirements = ref<Requirement[]>([]);
const requirementTreeData = ref<RequirementTreeNode[]>([]);
const requirementsLoading = ref(false);
const currentRequirement = ref<Requirement | null>(null);
const selectedRequirement = ref<Requirement | null>(null);
const requirementTasks = ref<any[]>([]);
const tasksLoading = ref(false);
const showTasksDrawer = ref(false);
const showInfoDrawer = ref(false);
const projectStore = useProjectStoreHook();
const activeTab = ref<string>("statistics");
const structureTreeData = ref<StructureTreeNode | Record<string, any> | null>(null);
const structureTreeLoading = ref(false);
// 需求任务嵌套数据（原始格式）
const requirementsTasksData = ref<Record<string, any> | null>(null);
const activeCategoryTab = ref<string>("");
const importingRequirement = ref(false);
const bugList = ref<Array<{
  _id?: string;
  bug_name: string;
  describe: string;
  creator?: string;
  task_id?: string;
  task_name?: string;
  create_time?: string;
  requirement_name?: string;
}>>([]);
const bugStatisticsLoading = ref(false);

const completedTreeStatuses = new Set<string>([
  "已完成",
  "完成",
  "completed",
  TaskStatus.COMPLETED,
  TaskStatus.REVIEW_COMPLETED,
  TaskStatus.TEST_COMPLETED,
  TaskStatus.CANCELLED,
  "审阅完毕",
  "测试完毕",
  "已取消"
]);

const inProgressTreeStatuses = new Set<string>([
  "进行中",
  "开发中",
  "in_progress",
  TaskStatus.IN_PROGRESS,
  TaskStatus.PENDING_TEST,
  TaskStatus.TESTING,
  TaskStatus.PENDING_REVIEW,
  TaskStatus.REVIEWING,
  "测试审阅中",
  "测试中",
  "审阅中"
]);

const mapTreeStatus = (
  status?: string
): StructureTreeNode["status"] => {
  if (!status) return "pending";
  if (completedTreeStatuses.has(status)) return "completed";
  if (inProgressTreeStatuses.has(status)) return "in-progress";
  return "pending";
};

// 需求分页
const requirementPage = ref(1);
const requirementPageSize = ref(7);
const requirementTotal = ref(0);

// 树形组件配置
const treeProps = {
  children: "children",
  label: "label"
};

// 使用从 API 导入的工具函数 isRequirementItem

// 递归将嵌套对象转换为树形结构
const convertToTreeData = (
  data: RequirementItemData,
  parentPath: string = ""
): RequirementTreeNode[] => {
  const result: RequirementTreeNode[] = [];

  // 如果是需求项（包含 _id），直接返回
  if (isRequirementItem(data)) {
    // 从需求名中提取显示名称（取最后一段）
    const nameParts = data.需求名.split("/");
    const displayName = nameParts[nameParts.length - 1] || data.需求名;

    return [
      {
        id: data._id,
        label: displayName,
        type: "requirement",
        data: data,
        isLeaf: true
      }
    ];
  }

  // 如果是对象，遍历其属性
  if (data && typeof data === "object" && !Array.isArray(data)) {
    for (const key in data) {
      if (Object.prototype.hasOwnProperty.call(data, key)) {
        const value = data[key];
        const currentPath = parentPath ? `${parentPath}/${key}` : key;

        if (isRequirementItem(value)) {
          // 如果是需求项，添加到结果中
          // 从需求名中提取显示名称
          const nameParts = value.需求名.split("/");
          const displayName = nameParts[nameParts.length - 1] || key;

          result.push({
            id: value._id,
            label: displayName,
            type: "requirement",
            data: value,
            isLeaf: true
          });
        } else if (value && typeof value === "object" && !Array.isArray(value)) {
          // 如果是嵌套对象，递归处理
          const children = convertToTreeData(value, currentPath);
          if (children.length > 0) {
            result.push({
              id: `folder_${currentPath}_${Date.now()}_${Math.random()}`, // 生成唯一ID
              label: key,
              type: "folder",
              children: children,
              isLeaf: false
            });
          }
        }
      }
    }
  }

  return result;
};

// 获取项目ID
const projectId = computed(() => route.params.id as string);

// 加载项目详情
const loadProject = async () => {
  if (!projectId.value) return;

  loading.value = true;
  try {
    const response = await selectProjects({
      project_id: projectId.value,
      page: 1,
      page_size: 1
    });

    if (
      response.code === 200 &&
      response.result &&
      response.result.length > 0
    ) {
      const item = response.result[0];
      // 处理 describe：可能是字符串数组或 DescribeContent[]
      let describeContent: DescribeContent[] = [];
      if (item.describe && Array.isArray(item.describe)) {
        // 检查第一个元素是否是对象（DescribeContent[] 格式）
        if (
          item.describe.length > 0 &&
          typeof item.describe[0] === "object" &&
          "type" in item.describe[0]
        ) {
          // 已经是 DescribeContent[] 格式
          describeContent = item.describe.map((d: any) => {
            // 处理 type: "image" 的情况
            if (d.type === "image" && d.url) {
              return { type: "url" as const, content: d.url };
            }
            // 处理 type: "url" 但使用 url 字段的情况
            if (d.type === "url" && d.url && !d.content) {
              return { type: "url" as const, content: d.url };
            }
            return d;
          });
        } else {
          // 是字符串数组，转换为 DescribeContent[]
          const stringArray = item.describe as unknown as string[];
          describeContent = stringArray.map(str => {
            // 判断是否是图片 URL（以 http://、https:// 或 / 开头，且包含图片扩展名）
            const isImageUrl =
              (str.startsWith("http://") ||
                str.startsWith("https://") ||
                str.startsWith("/")) &&
              /\.(jpg|jpeg|png|gif|webp|bmp|svg)(\?|$)/i.test(str);

            if (isImageUrl) {
              return { type: "url" as const, content: str };
            } else {
              return { type: "text" as const, content: str };
            }
          });
        }
      }

      project.value = {
        id: item._id,
        name: item.project_name,
        startDate: item.plant_start_time,
        endDate: item.plant_end_time,
        status: item.state as "未开始" | "进行中" | "已完成",
        creator: item.creator,
        describe: describeContent,
        attachment: item.attachment || [],
        project_proposal: (item as any).project_proposal || [],
        createdAt: item.create_time,
        progress: 0
      } as any;
      currentStatus.value = project.value.status || "进行中";

      // 加载项目统计数据
      await loadProjectStatistics(projectId.value);
      // 加载BUG统计数据
      await loadBugStatistics(projectId.value);
    } else {
      ElMessage.error("项目不存在");
      router.push("/projects/index");
    }
  } catch (error: any) {
    console.error("加载项目失败:", error);
    ElMessage.error(
      error?.response?.data?.message || error?.message || "加载项目失败"
    );
    router.push("/projects/index");
  } finally {
    loading.value = false;
  }
};

// 加载项目统计数据
const loadProjectStatistics = async (projectId: string) => {
  try {
    const response = await getProjectStatistics({ project_id: projectId });
    if (response.code === 200) {
      projectStatistics.value = response;
    }
  } catch (error: any) {
    console.error("加载项目统计失败:", error);
    // 统计信息加载失败不影响页面显示，只记录错误
  }
};

// 加载BUG统计数据
const loadBugStatistics = async (projectId: string) => {
  bugStatisticsLoading.value = true;
  try {
    const response = await selectProjectSelectAll({ project_id: projectId });
    if (response.code === 200) {
      // 处理返回的数据，如果是数组则直接使用
      if (Array.isArray(response.result)) {
        bugList.value = response.result;
      } else if (Array.isArray(response.data)) {
        bugList.value = response.data;
      } else {
        bugList.value = [];
      }
    } else {
      ElMessage.error(response.message || "加载BUG统计失败");
      bugList.value = [];
    }
  } catch (error: any) {
    console.error("加载BUG统计失败:", error);
    ElMessage.error(
      error?.response?.data?.message || error?.message || "加载BUG统计失败"
    );
    bugList.value = [];
  } finally {
    bugStatisticsLoading.value = false;
  }
};

// 将中文状态映射到 RequirementStatus
const mapStatusToEnum = (status: string): RequirementStatus => {
  const statusMap: Record<string, RequirementStatus> = {
    草稿: RequirementStatus.DRAFT,
    评审中: RequirementStatus.REVIEWING,
    已通过: RequirementStatus.APPROVED,
    开发中: RequirementStatus.DEVELOPING,
    测试中: RequirementStatus.TESTING,
    已完成: RequirementStatus.COMPLETED,
    已拒绝: RequirementStatus.REJECTED,
    已取消: RequirementStatus.CANCELLED
  };
  return statusMap[status] || RequirementStatus.DRAFT;
};

// 将优先级字符串映射到 RequirementPriority
const mapPriority = (priority: string): RequirementPriority => {
  if (!priority || priority.trim() === "") {
    return "medium"; // 默认优先级
  }
  const priorityMap: Record<string, RequirementPriority> = {
    低: "low",
    中: "medium",
    高: "high",
    紧急: "urgent"
  };
  // 如果已经是英文值，直接返回
  if (["low", "medium", "high", "urgent"].includes(priority.toLowerCase())) {
    return priority.toLowerCase() as RequirementPriority;
  }
  return priorityMap[priority] || "medium";
};


const buildStructureTree = (
  requirementList: (RequirementListItem & { 进度?: number })[],
  tasksMap: Record<string, TaskListItem[]>,
  projectName?: string,
  rawRequirementList?: RequirementWithTasksItem[] // 传入原始的需求数据
): StructureTreeNode | null => {

  const requirementNodes: StructureTreeNode[] = requirementList.map(req => {
    const reqTasks = tasksMap[req._id] || [];
    // 从原始需求列表中查找完整的需求数据
    const rawRequirementData = rawRequirementList?.find(r => r._id === req._id);
    return {
      id: req._id,
      name: req.需求名 || req._id,
      type: "requirement",
      status: req.状态 || "未知状态", // 直接使用需求的状态，不进行映射
      assignee: req.creator,
      progress: req.进度, // 从 result 中获取需求进度
      rawData: rawRequirementData, // 保存完整的原始需求数据
      // 不设置 expanded，让 ProjectStructureTree 组件的 cloneNode 函数控制
      children: reqTasks.map(
        (task): StructureTreeNode => {
          // 从对应需求的 task_list 中查找原始任务数据
          const rawTaskData = rawRequirementData?.task_list?.find(
            (t: any) => {
              // 尝试通过任务名和需求ID匹配
              return t.任务名 === task.任务名 && t.requirement_id === task.requirement_id;
            }
          );
          return {
            id: task._id || task.id,
            name: task.任务名 || task.task_name || task.title || "-",
            type: "task",
            status: task.状态 || task.status || "未知状态", // 直接使用任务的状态，不进行映射
            assignee: task.指派人 || task.assignee || task.assigneeId,
            estimate: task.预计工时 ? `${task.预计工时} 小时` : undefined,
            progress: task.进度 || task.progress, // 从 task_list 中获取任务进度
            rawData: rawTaskData // 保存完整的原始任务数据
          };
        }
      )
    };
  });

  // 优先使用传入的 projectName，然后是 project.value?.name，最后是默认值
  const finalProjectName = projectName || project.value?.name || "项目详情";

  return {
    id: project.value?.id || projectId.value || "project",
    name: finalProjectName, // 与页面标题保持一致
    type: "project",
    status: mapTreeStatus(project.value?.status || "进行中"),
    assignee: project.value?.creator,
    // 不设置 expanded，让 ProjectStructureTree 组件的 cloneNode 函数控制
    children: requirementNodes
  };
};

// 从 describe 数组中提取文本内容作为 description
const extractDescription = (describe: DescribeContent[]): string => {
  if (!describe || describe.length === 0) {
    return "";
  }
  return describe
    .filter(item => item.type === "text")
    .map(item => item.content)
    .join("\n");
};

// 加载项目需求
const loadProjectRequirements = async (
  projectId: string,
  page: number = requirementPage.value,
  pageSize: number = requirementPageSize.value
) => {
  requirementsLoading.value = true;
  try {
    const response = await selectRequirements({
      project_id: projectId,
      page: page,
      page_size: pageSize
    });

    if (response.code === 200 && response.result) {
      // 判断返回的是数组还是嵌套对象
      if (Array.isArray(response.result)) {
        // 旧格式：数组
        projectRequirements.value = response.result.map(
          (item: RequirementListItem): Requirement => {
            return {
              id: item._id,
              title: item.需求名,
              description: extractDescription(item.describe),
              status: mapStatusToEnum(item.状态),
              priority: mapPriority(item.优先级),
              projectId: item.project_id,
              creatorId: item.creator,
              createdAt: item.create_time
            };
          }
        );
        requirementTreeData.value = [];

        if (typeof response.total_count === "number") {
          requirementTotal.value = response.total_count;
        } else {
          requirementTotal.value = response.result.length;
        }
      } else {
        // 新格式：嵌套对象
        requirementTreeData.value = convertToTreeData(response.result);
        projectRequirements.value = [];

        // 计算总需求数（递归统计所有需求项）
        const countRequirements = (data: RequirementItemData): number => {
          if (isRequirementItem(data)) {
            return 1;
          }
          if (data && typeof data === "object") {
            let count = 0;
            for (const key in data) {
              if (Object.prototype.hasOwnProperty.call(data, key)) {
                count += countRequirements(data[key]);
              }
            }
            return count;
          }
          return 0;
        };

        requirementTotal.value = countRequirements(response.result);
      }
    } else {
      ElMessage.error(response.message || "加载需求失败");
      projectRequirements.value = [];
      requirementTreeData.value = [];
      requirementTotal.value = 0;
    }
  } catch (error: any) {
    console.error("加载需求失败:", error);
    ElMessage.error(
      error?.response?.data?.message || error?.message || "加载需求失败"
    );
    projectRequirements.value = [];
    requirementTreeData.value = [];
    requirementTotal.value = 0;
  } finally {
    requirementsLoading.value = false;
  }
};

// 处理需求分页大小变化
const handleRequirementPageSizeChange = (newSize: number) => {
  requirementPageSize.value = newSize;
  requirementPage.value = 1; // 重置到第一页
  if (projectId.value) {
    loadProjectRequirements(projectId.value, 1, newSize);
  }
};

// 处理需求页码变化
const handleRequirementPageChange = (newPage: number) => {
  requirementPage.value = newPage;
  if (projectId.value) {
    loadProjectRequirements(
      projectId.value,
      newPage,
      requirementPageSize.value
    );
  }
};

// 加载需求的任务
const loadRequirementTasks = async (requirementId: string) => {
  tasksLoading.value = true;
  try {
    const response = await selectTasksByRequirement({
      requirement_id: requirementId,
      page: 1,
      page_size: 100
    });
    if (response.code === 200 && response.result) {
      requirementTasks.value = response.result;
    } else {
      requirementTasks.value = [];
      ElMessage.error(response.message || "加载任务失败");
    }
  } catch (error: any) {
    console.error("加载任务失败:", error);
    ElMessage.error(error?.response?.data?.message || error?.message || "加载任务失败");
    requirementTasks.value = [];
  } finally {
    tasksLoading.value = false;
  }
};

// 加载项目-需求-任务架构树
const loadProjectStructure = async () => {
  if (!projectId.value) return;
  structureTreeLoading.value = true;
  try {
    const response = await selectAllRequirementsAndTasks({
      project_id: projectId.value
    });

    if (response.code === 200) {
      // 保存原始嵌套数据
      if (response.result && typeof response.result === "object" && !Array.isArray(response.result)) {
        requirementsTasksData.value = response.result;
        // 设置默认激活的 tab
        const categoryNames = Object.keys(response.result);
        if (categoryNames.length > 0 && !activeCategoryTab.value) {
          activeCategoryTab.value = categoryNames[0];
        }
      }

      if (Array.isArray(response.result)) {
        const requirementList: RequirementWithTasksItem[] = response.result;

        // 从需求列表中获取项目名称（如果 project.value 还没有加载完成）
        const projectNameFromApi = requirementList.length > 0 ? requirementList[0].project_name : null;

        // 将 RequirementWithTasksItem 转换为 RequirementListItem 格式
        const convertedRequirementList: (RequirementListItem & { 进度?: number })[] = requirementList.map(req => ({
          _id: req._id,
          需求名: req.需求名,
          describe: req.describe,
          状态: req.状态,
          优先级: req.优先级,
          进度: req.进度, // 保留需求进度字段
          project_id: req.project_id,
          project_name: req.project_name,
          creator: req.creator,
          attachment: req.attachment,
          create_time: req.create_time
        }));

        // 将任务列表转换为 TaskListItem 格式并构建 tasksMap
        const tasksMap: Record<string, TaskListItem[]> = {};
        requirementList.forEach(req => {
          if (req.task_list && Array.isArray(req.task_list)) {
            tasksMap[req._id] = req.task_list.map((task: TaskWithDetailItem, index: number): TaskListItem => {
              // 优先使用后端返回的任务ID，如果没有则生成唯一ID
              const taskId = task._id || `${req._id}_${task.任务名}_${index}_${task.create_time}`;
              return {
                _id: taskId,
                id: taskId,
                任务名: task.任务名,
                task_name: task.任务名,
                title: task.任务名,
                状态: task.状态,
                status: task.状态,
                优先级: task.优先级,
                priority: task.优先级,
                指派人: task.指派人 || task.指派给,
                assignee: task.指派给 || task.指派人,
                assigneeId: task.指派给 || task.指派人,
                预计工时: task.预计工时 || 0,
                estimated_time: task.预计工时 || 0,
                已用工时: task.已用工时 || 0,
                actualHours: task.已用工时 || 0,
                进度: task.进度 || 0,
                progress: task.进度 || 0,
                requirement_id: task.requirement_id,
                requirement_name: task.requirement_name,
                creator: task.creator,
                create_time: task.create_time,
                describe: task.describe,
                attachment: task.attachment || [],
                历史记录: task.历史记录 || []
              };
            });
          } else {
            tasksMap[req._id] = [];
          }
        });

        // 使用 project.value?.name，如果没有则使用 API 返回的 project_name，最后才使用默认值
        const projectName = project.value?.name || projectNameFromApi || "项目详情";

        // 传递原始的需求列表数据，以便在弹框中显示完整字段
        structureTreeData.value = buildStructureTree(convertedRequirementList, tasksMap, projectName, requirementList);
      } else if (response.result && typeof response.result === "object") {
        structureTreeData.value = response.result as Record<string, any>;
      } else {
        structureTreeData.value = null;
      }
    } else {
      structureTreeData.value = null;
    }
  } catch (error) {
    ElMessage.error("加载项目结构失败");
    structureTreeData.value = null;
  } finally {
    structureTreeLoading.value = false;
  }
};

const handleRequirementDrawerRefresh = () => {
  if (!projectId.value) return;
  loadProjectRequirements(
    projectId.value,
    requirementPage.value,
    requirementPageSize.value
  );
  loadProjectStructure();
};

// 处理添加需求或任务
const handleAddRequirementOrTask = (type: "requirement" | "task", data: any, parentPath: string) => {
  // 这个事件现在由 RequirementTaskNode 内部处理，这里保留作为备用
};

// 处理编辑需求或任务
const handleEditRequirementOrTask = (type: "requirement" | "task", data: any) => {
  // 这个事件现在由 RequirementTaskNode 内部处理，这里保留作为备用
};

// 处理删除需求或任务
const handleDeleteRequirementOrTask = async (type: "requirement" | "task", id: string, name: string) => {
  ElMessage.info(`${type === "requirement" ? "删除需求" : "删除任务"}功能待实现`);
  // TODO: 实现删除逻辑，删除后需要重新加载数据
  // await loadProjectStructure();
};

// 处理需求任务刷新
const handleRequirementTaskRefresh = () => {
  if (projectId.value) {
    loadProjectStructure();
  }
};

// 导入需求
const handleImportRequirement = () => {
  // 创建文件输入元素
  const input = document.createElement("input");
  input.type = "file";
  input.accept = ".json";
  input.onchange = async (event: Event) => {
    const target = event.target as HTMLInputElement;
    const file = target.files?.[0];
    if (!file) return;

    importingRequirement.value = true;
    try {
      // 读取JSON文件内容
      const text = await file.text();
      let jsonData: Record<string, any>;

      try {
        jsonData = JSON.parse(text);
      } catch (parseError) {
        ElMessage.error("JSON文件格式错误，请检查文件内容");
        importingRequirement.value = false;
        return;
      }

      // 验证必填字段
      if (!projectId.value || !project.value?.name) {
        ElMessage.error("项目信息不完整");
        importingRequirement.value = false;
        return;
      }

      // 调用导入接口
      const response = await loadRequirementFromJson({
        project_id: projectId.value,
        project_name: project.value.name,
        json_data: jsonData
      });

      if (response.code === 200) {
        ElMessage.success("需求导入成功");
        // 刷新需求任务数据
        if (projectId.value) {
          await loadProjectStructure();
        }
      } else {
        ElMessage.error(response.message || "需求导入失败");
      }
    } catch (error: any) {
      console.error("导入JSON失败:", error);
      ElMessage.error(
        error?.response?.data?.message || error?.message || "导入JSON失败"
      );
    } finally {
      importingRequirement.value = false;
    }
  };
  input.click();
};

// 监听项目ID变化，自动加载架构树
watch(
  () => projectId.value,
  id => {
    if (id) {
      structureTreeData.value = null;
      loadProjectStructure();
      loadBugStatistics(id);
    }
  },
  { immediate: true }
);

// 监听tab切换，当切换到BUG统计时加载数据
watch(
  () => activeTab.value,
  tab => {
    if (tab === "bug-statistics" && projectId.value && bugList.value.length === 0) {
      loadBugStatistics(projectId.value);
    }
  }
);

onMounted(() => {
  loadProject();
  if (projectId.value) {
    loadProjectRequirements(
      projectId.value,
      requirementPage.value,
      requirementPageSize.value
    );
  }
});

const goBack = () => {
  router.back();
};

const handleEdit = () => {
  // TODO: 打开编辑项目对话框
  ElMessage.info("编辑项目功能待实现");
};

const handleStatusChange = async (newStatus: string) => {
  if (!project.value || !project.value.id) {
    ElMessage.error("项目信息不完整");
    return;
  }

  if (newStatus === project.value.status) {
    return;
  }

  statusUpdating.value = true;
  try {
    const response = await updateProjectState({
      project_id: project.value.id
    });

    if (response.code === 200) {
      ElMessage.success("状态更新成功");
      if (project.value) {
        project.value.status = newStatus as any;
      }
      currentStatus.value = newStatus;
    } else {
      ElMessage.error(response.message || "状态更新失败");
      currentStatus.value = project.value.status || "进行中";
    }
  } catch (error: any) {
    console.error("更新状态失败:", error);
    ElMessage.error(
      error?.response?.data?.message || error?.message || "状态更新失败"
    );
    currentStatus.value = project.value.status || "进行中";
  } finally {
    statusUpdating.value = false;
  }
};

// 跳转到需求管理页面
const goToRequirementPage = () => {
  if (project.value?.id) {
    router.push({
      name: "RequirementsList",
      query: {
        project_id: project.value.id,
        project_name: project.value.name,
        create: "true"
      }
    });
  } else {
    router.push({
      name: "RequirementsList",
      query: {
        create: "true"
      }
    });
  }
};



// 选择需求（打开任务列表抽屉）
const selectRequirement = (requirement: Requirement) => {
  selectedRequirement.value = requirement;
  showTasksDrawer.value = true;
  const requirementId = requirement.id || (requirement as any)._id;
  if (requirementId) {
    loadRequirementTasks(requirementId);
  }
};

// 点击需求列表，跳转到需求列表页并带上参数
const handleRequirementClick = (requirement: Requirement) => {
  const projectIdValue = project.value?.id || projectId.value || "";
  const requirementId = requirement.id || (requirement as any)._id || "";
  router.push({
    name: "RequirementsList",
    query: {
      project_id: projectIdValue,
      requirement_id: requirementId
    }
  });
};

// 处理树节点点击
const handleTreeNodeClick = (data: RequirementTreeNode) => {
  if (data.type === "requirement" && data.data) {
    // 将 RequirementListItem 转换为 Requirement 格式
    const requirement: Requirement = {
      id: data.data._id,
      title: data.data.需求名,
      description: extractDescription(data.data.describe),
      status: mapStatusToEnum(data.data.状态),
      priority: mapPriority(data.data.优先级),
      projectId: data.data.project_id,
      creatorId: data.data.creator,
      createdAt: data.data.create_time
    };
    handleRequirementClick(requirement);
  }
};

// 处理树节点双击
const handleTreeNodeDblClick = (data: RequirementTreeNode) => {
  if (data.type === "requirement" && data.data) {
    const requirement: Requirement = {
      id: data.data._id,
      title: data.data.需求名,
      description: extractDescription(data.data.describe),
      status: mapStatusToEnum(data.data.状态),
      priority: mapPriority(data.data.优先级),
      projectId: data.data.project_id,
      creatorId: data.data.creator,
      createdAt: data.data.create_time
    };
    selectRequirement(requirement);
  }
};

const handleAddTask = () => {
  if (!selectedRequirement.value) {
    ElMessage.warning("请先选择一个需求");
    return;
  }
  // TODO: 打开新建任务对话框
  ElMessage.info("新建任务功能待实现");
};

// 查看任务
const handleViewTask = (task: any) => {
  const taskId = task._id || task.id;
  if (!taskId) {
    ElMessage.error("任务ID不存在");
    return;
  }
  // 存储任务数据到 sessionStorage
  sessionStorage.setItem(`task_${taskId}`, JSON.stringify(task));
  router.push({
    name: "TaskDetail",
    params: { id: taskId },
    query: {
      from: "project",
      project_id: projectId.value || "",
      project_name: project.value?.name || ""
    }
  });
};

const handleEditTask = (task: Task) => {
  // TODO: 打开编辑任务对话框
  ElMessage.info("编辑任务功能待实现");
};

const handleDeleteTask = async (task: any) => {
  try {
    await ElMessageBox.confirm(
      `确定要删除任务"${task.title || task.任务名 || task.task_name}"吗？`,
      "删除确认",
      {
        confirmButtonText: "确定",
        cancelButtonText: "取消",
        type: "warning"
      }
    );
    // TODO: 调用删除任务 API
    if (selectedRequirement.value) {
      const requirementId = selectedRequirement.value.id || (selectedRequirement.value as any)._id;
      if (requirementId) {
        loadRequirementTasks(requirementId);
      }
    }
    ElMessage.success("任务删除成功");
  } catch {
    // 用户取消
  }
};

const handleTaskStatusChange = (task: Task, completed: boolean) => {
  if (completed) {
    task.status = TaskStatus.COMPLETED;
  } else {
    task.status = TaskStatus.NOT_STARTED;
  }
  projectStore.updateTask(task);
};

// 获取图片 URL（处理文件路径）
// 显示时：相对路径需要拼接 baseUrl 为完整 URL
// 获取预览图片列表（所有图片的完整 URL）- 使用计算属性确保响应式
const previewImageList = computed(() => {
  if (!project.value?.describe) return [];
  return project.value.describe
    .filter(item => item.type === "url" || item.type === "file")
    .map(item => getImageUrl(item.content));
});

// 获取图片在预览列表中的索引
const getImageIndex = (currentIndex: number): number => {
  if (!project.value?.describe) return 0;
  let imageIndex = 0;
  for (let i = 0; i < currentIndex; i++) {
    const item = project.value.describe[i];
    if (item && (item.type === "url" || item.type === "file")) {
      imageIndex++;
    }
  }
  return imageIndex;
};

const getImageUrl = (filePath: string): string => {
  // 如果已经是完整 URL，直接返回
  if (filePath.startsWith("http://") || filePath.startsWith("https://")) {
    return filePath;
  }

  // 使用环境变量 VITE_GLOB_API_URL 拼接图片 URL
  const baseUrl = import.meta.env.VITE_GLOB_API_URL || "";

  if (!baseUrl) {
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

const handleImageError = (event: Event) => {
  const img = event.target as HTMLImageElement;
  img.style.display = "none";
  console.warn("图片加载失败:", img.src);
};

const getAttachmentUrl = (attachment: string): string => {
  if (attachment.startsWith("http://") || attachment.startsWith("https://")) {
    return attachment;
  }
  const baseUrl = import.meta.env.VITE_GLOB_API_URL || "";
  if (!baseUrl) {
    return attachment;
  }
  let path = attachment;
  if (path.startsWith("/")) {
    path = path.substring(1);
  }
  if (baseUrl.endsWith("/") && path.startsWith("/")) {
    return baseUrl + path.substring(1);
  } else if (!baseUrl.endsWith("/") && !path.startsWith("/")) {
    return `${baseUrl}/${path}`;
  } else {
    return baseUrl + path;
  }
};

const getFileName = (attachment: string): string => {
  if (attachment.includes("/")) {
    const parts = attachment.split("/");
    return parts[parts.length - 1] || attachment;
  }
  return attachment;
};

const downloadAttachment = (attachment: string) => {
  const url = getAttachmentUrl(attachment);
  const fileName = getFileName(attachment);
  const link = document.createElement("a");
  link.href = url;
  link.download = fileName;
  link.target = "_blank";
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
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

const formatDateRange = (startDate?: string, endDate?: string): string => {
  if (!startDate && !endDate) return "-";
  if (startDate && endDate) {
    return `${formatDate(startDate)} ~ ${formatDate(endDate)}`;
  }
  return startDate ? formatDate(startDate) : formatDate(endDate);
};

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

const getRequirementPriorityText = (priority: RequirementPriority): string => {
  const textMap: Record<RequirementPriority, string> = {
    low: "低",
    medium: "中",
    high: "高",
    urgent: "紧急"
  };
  return textMap[priority] || priority;
};

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

const getPriorityText = (priority: "low" | "medium" | "high"): string => {
  const textMap = {
    low: "低",
    medium: "中",
    high: "高"
  };
  return textMap[priority] || priority;
};
</script>

<style scoped lang="scss">
.project-detail-page {
  padding: 24px;
  background: linear-gradient(135deg, #f5f7fa 0%, #fafbfc 100%);
}

.page-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 24px;
  padding-bottom: 16px;
  border-bottom: 1px solid rgba(0, 0, 0, 0.06);

  .header-left {
    display: flex;
    align-items: center;
    gap: 16px;

    .back-button {
      padding: 0;
      font-size: 14px;
      color: #606266;

      &:hover {
        color: #409eff;
      }
    }

    h2 {
      margin: 0;
      color: #303133;
      font-size: 24px;
      font-weight: 600;
      letter-spacing: -0.3px;
    }
  }

  .header-actions {
    display: flex;
    gap: 12px;
  }
}

.detail-content {
  min-height: calc(100vh - 250px);
}

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
}

.right-panel {
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.statistics-card {
  margin-bottom: 16px;
  border-radius: 8px;
  box-shadow:
    0 2px 8px rgba(0, 0, 0, 0.04),
    0 1px 3px rgba(0, 0, 0, 0.08);
  border: 1px solid rgba(0, 0, 0, 0.04);

  :deep(.el-card__body) {
    padding: 0;
  }

  .statistics-tabs {
    :deep(.el-tabs__header) {
      margin: 0;
      padding: 0 12px;
      border-bottom: 1px solid #e4e7ed;
    }

    :deep(.el-tabs__nav-wrap::after) {
      display: none;
    }

    :deep(.el-tabs__item) {
      padding: 10px 16px;
      font-size: 14px;
      font-weight: 500;
      color: #606266;

      &.is-active {
        color: #409eff;
        font-weight: 600;
      }
    }

    :deep(.el-tabs__content) {
      padding: 8px;
      overflow: hidden; // 防止内容超出导致页面滚动
      display: flex;
      flex-direction: column;
    }

    // 项目总览tab内容区域
    :deep(.el-tab-pane[name="overview"]) {
      height: 100%;
      overflow: hidden;
      display: flex;
      flex-direction: column;
    }
  }
}

.statistics-loading {
  padding: 8px 0;
}

.statistics-content {
  .stat-item {
    padding: 8px;
    background: linear-gradient(135deg, #f8f9fa 0%, #ffffff 100%);
    border-radius: 6px;
    text-align: center;
    transition: all 0.3s;
    border: 1px solid #e4e7ed;

    &:hover {
      transform: translateY(-2px);
      box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
    }

    .stat-label {
      font-size: 11px;
      color: #606266;
      margin-bottom: 6px;
      font-weight: 500;
    }

    .stat-value {
      font-size: 20px;
      font-weight: 700;
      line-height: 1.2;
    }

    // 进行中 - 蓝色
    &.stat-in-progress {
      border-color: #409eff;

      &:hover {
        background: linear-gradient(135deg, #ecf5ff 0%, #f0f7ff 100%);
        border-color: #66b1ff;
      }

      .stat-value {
        color: #409eff;
      }
    }

    // 测试审阅中 - 黄色
    &.stat-testing {
      border-color: #e6a23c;

      &:hover {
        background: linear-gradient(135deg, #fdf6ec 0%, #fef0e6 100%);
        border-color: #ebb563;
      }

      .stat-value {
        color: #e6a23c;
      }
    }

    // 已完成 - 绿色
    &.stat-completed {
      border-color: #67c23a;

      &:hover {
        background: linear-gradient(135deg, #f0f9ff 0%, #f5fdf0 100%);
        border-color: #85ce61;
      }

      .stat-value {
        color: #67c23a;
      }
    }

    // 已取消 - 红色
    &.stat-cancelled {
      border-color: #f56c6c;

      &:hover {
        background: linear-gradient(135deg, #fef0f0 0%, #fef5f5 100%);
        border-color: #f78989;
      }

      .stat-value {
        color: #f56c6c;
      }
    }

    &.stat-progress {
      text-align: left;
      padding: 10px;
      background: linear-gradient(135deg, #f0f7ff 0%, #ffffff 100%);

      .stat-label {
        margin-bottom: 6px;
        font-size: 12px;
        font-weight: 600;
        color: #303133;
      }

      .stat-value {
        margin-top: 6px;
        font-size: 14px;
        text-align: right;
        color: #409eff;
      }
    }

    // BUG统计 - 红色主题
    &.stat-bug {
      border-color: #f56c6c;

      &:hover {
        background: linear-gradient(135deg, #fef0f0 0%, #fef5f5 100%);
        border-color: #f78989;
      }

      .stat-value {
        color: #f56c6c;
      }
    }
  }
}

.bug-statistics-content {
  .bug-stats-summary {
    margin-bottom: 20px;
  }

  .bug-list-card {
    margin-top: 20px;
    border-radius: 8px;
    box-shadow:
      0 2px 8px rgba(0, 0, 0, 0.04),
      0 1px 3px rgba(0, 0, 0, 0.08);
    border: 1px solid rgba(0, 0, 0, 0.04);

    :deep(.el-card__header) {
      padding: 18px 20px;
      border-bottom: 1px solid rgba(0, 0, 0, 0.06);
      font-weight: 600;
      font-size: 15px;
      color: #303133;
    }

    :deep(.el-card__body) {
      padding: 20px;
    }

    .bug-list-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
    }
  }

  .bug-empty {
    padding: 40px 0;
  }
}

.info-card,
.requirements-card,
.tasks-card {
  border-radius: 12px;
  box-shadow:
    0 2px 8px rgba(0, 0, 0, 0.04),
    0 1px 3px rgba(0, 0, 0, 0.08);
  border: 1px solid rgba(0, 0, 0, 0.04);
  min-width: 0;
  /* 允许卡片收缩 */
  overflow: visible;
  /* 确保卡片内容可以溢出显示滚动条 */

  :deep(.el-card__header) {
    padding: 18px 20px;
    border-bottom: 1px solid rgba(0, 0, 0, 0.06);
    font-weight: 600;
    font-size: 15px;
    color: #303133;
    flex-shrink: 0;
    /* 头部不收缩 */
  }

  :deep(.el-card__body) {
    padding: 20px;
    overflow: visible;
    /* 确保内容可以溢出 */
    min-width: 0;
  }
}

.project-description {
  line-height: 1.8;
  color: #606266;
  font-size: 14px;
  word-wrap: break-word;
  overflow-wrap: break-word;

  .description-text {
    margin: 0.8em 0;
    white-space: pre-wrap;
    word-wrap: break-word;
    overflow-wrap: break-word;
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
    transition: all 0.2s;
    background: #fafbfc;

    &:hover {
      background-color: #f0f2f5;
      border-color: #c0c4cc;
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
  display: flex;
  flex-direction: column;
  gap: 12px;

  .member-item {
    display: flex;
    align-items: center;
    gap: 12px;
    padding: 12px;
    border: 1px solid #e4e7ed;
    border-radius: 8px;
    transition: all 0.2s;
    background: #fafbfc;

    &:hover {
      background-color: #f0f2f5;
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

.requirement-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.requirement-list {
  min-height: 200px;
  overflow: visible;
  /* 允许内容溢出显示滚动条 */
  width: 100%;

  .requirement-tree {
    :deep(.el-tree-node) {
      .el-tree-node__content {
        height: auto;
        min-height: 40px;
        padding: 8px 0;
        line-height: 1.5;

        &:hover {
          background-color: #f5f7fa;
        }
      }

      .el-tree-node__expand-icon {
        padding: 0 4px;
      }
    }

    .tree-node-content {
      width: 100%;
      padding: 4px 8px;
      cursor: pointer;
      transition: all 0.2s;

      &:hover {
        background-color: #f0f2f5;
        border-radius: 4px;
      }

      &.tree-node-requirement {
        padding: 8px 12px;
        border-radius: 6px;
        border: 1px solid transparent;
        transition: all 0.2s;

        &:hover {
          background-color: #ecf5ff;
          border-color: #b3d8ff;
        }
      }

      .tree-node-main {
        display: flex;
        align-items: center;
        gap: 8px;
        flex-wrap: wrap;

        .folder-icon {
          color: #409eff;
          font-size: 16px;
        }

        .file-icon {
          color: #67c23a;
          font-size: 16px;
        }

        .tree-node-label {
          flex: 1;
          font-weight: 500;
          color: #303133;
          font-size: 14px;
        }

        .tree-node-badges {
          display: flex;
          gap: 6px;
          flex-shrink: 0;
        }
      }

      .tree-node-description {
        margin-top: 6px;
        padding-left: 24px;
        font-size: 12px;
        color: #909399;
        line-height: 1.5;
        display: -webkit-box;
        -webkit-line-clamp: 2;
        line-clamp: 2;
        -webkit-box-orient: vertical;
        overflow: hidden;
        text-overflow: ellipsis;
      }
    }
  }
}

.requirement-pagination {
  margin-top: 20px;
  display: flex;
  justify-content: flex-end;
  padding-top: 16px;
  border-top: 1px solid rgba(0, 0, 0, 0.06);
}

.empty-requirements {
  padding: 40px 0;
}

.requirements-container {
  display: flex;
  flex-direction: column;
  gap: 12px;
  width: 100%;
  min-width: 0;
  /* 允许容器收缩 */
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

  &.selected {
    border-color: #409eff;
    background-color: #ecf5ff;

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

.task-header {
  display: flex;
  justify-content: space-between;
  align-items: center;

  .task-header-left {
    display: flex;
    align-items: center;
  }
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
  padding: 16px;
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
    background: #67c23a;
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

      .task-dates {
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

.task-list-drawer {
  .tasks-container {
    display: flex;
    flex-direction: column;
    gap: 12px;
  }

  .task-item {
    display: flex;
    justify-content: space-between;
    align-items: flex-start;
    padding: 16px;
    border: 1px solid #e4e7ed;
    border-radius: 8px;
    transition: all 0.3s ease;
    background: #ffffff;

    &:hover {
      background-color: #f8f9fa;
      border-color: #c0c4cc;
      box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
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
          font-size: 15px;

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
        flex-wrap: wrap;

        .task-assignee,
        .task-priority,
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
      flex-shrink: 0;
    }
  }

  .empty-tasks {
    padding: 40px 0;
  }
}

.info-drawer-content {
  padding: 0;

  .info-card {
    border-radius: 8px;
    box-shadow:
      0 2px 8px rgba(0, 0, 0, 0.04),
      0 1px 3px rgba(0, 0, 0, 0.08);
    border: 1px solid rgba(0, 0, 0, 0.04);

    :deep(.el-card__header) {
      padding: 16px 20px;
      border-bottom: 1px solid rgba(0, 0, 0, 0.06);
      font-weight: 600;
      font-size: 15px;
      color: #303133;
    }

    :deep(.el-card__body) {
      padding: 20px;
    }
  }
}

.statistics-header {
  display: flex;
  justify-content: flex-end;
  margin-bottom: 8px;
}

.requirements-tasks-manager {
  margin-top: 20px;
  border-top: 1px solid #e4e7ed;
  padding-top: 20px;

  :deep(.el-tabs) {
    .el-tabs__header {
      margin: 0;
    }

    .el-tabs__content {
      padding: 16px;
    }
  }
}
</style>
