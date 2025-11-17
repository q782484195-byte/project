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
      <!-- 项目统计信息 - 全屏上方 -->
      <el-card v-if="project && projectStatistics" class="statistics-card">
        <template #header>
          <span>任务统计</span>
        </template>
        <div class="statistics-content">
          <el-row :gutter="20">
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
          <el-row :gutter="20" style="margin-top: 20px">
            <el-col :span="24">
              <div class="stat-item stat-progress">
                <div class="stat-label">总进度</div>
                <el-progress
                  :percentage="projectStatistics.总进度"
                  :stroke-width="12"
                />
              </div>
            </el-col>
          </el-row>
        </div>
      </el-card>

      <div v-if="project" class="detail-layout">
        <!-- 左侧：基本信息 -->
        <div class="left-panel">
          <el-card class="info-card">
            <template #header>
              <span>基本信息</span>
            </template>
            <el-descriptions :column="1" border>
              <el-descriptions-item label="项目名称">{{
                project.name
              }}</el-descriptions-item>
              <el-descriptions-item label="状态">
                <el-select
                  v-model="currentStatus"
                  :loading="statusUpdating"
                  size="small"
                  style="width: 120px"
                  @change="handleStatusChange"
                >
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
              <el-descriptions-item label="进度">
                <el-progress
                  :percentage="project.progress || 0"
                  :stroke-width="8"
                />
              </el-descriptions-item>
              <el-descriptions-item label="开始日期">{{
                formatDate(project.startDate)
              }}</el-descriptions-item>
              <el-descriptions-item label="结束日期">{{
                formatDate(project.endDate)
              }}</el-descriptions-item>
              <el-descriptions-item v-if="project.createdAt" label="创建时间">{{
                formatDate(project.createdAt)
              }}</el-descriptions-item>
            </el-descriptions>
          </el-card>

          <!-- 项目描述 -->
          <el-card
            v-if="project.describe && project.describe.length > 0"
            class="info-card"
          >
            <template #header>
              <span>项目描述</span>
            </template>
            <div class="project-description">
              <template v-for="(item, index) in project.describe" :key="index">
                <p v-if="item.type === 'text'" class="description-text">
                  {{ item.content }}
                </p>
                <div v-else-if="item.type === 'url'" class="description-image">
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
                <div v-else-if="item.type === 'file'" class="description-image">
                  <el-image
                    :src="getImageUrl(item.content)"
                    :alt="item.content"
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
          <el-card v-else-if="project.description" class="info-card">
            <template #header>
              <span>项目描述</span>
            </template>
            <div class="project-description">{{ project.description }}</div>
          </el-card>

          <!-- 项目附件 -->
          <el-card
            v-if="project.attachment && project.attachment.length > 0"
            class="info-card"
          >
            <template #header>
              <span>项目附件</span>
            </template>
            <div class="attachment-list">
              <div
                v-for="(attachment, index) in project.attachment"
                :key="index"
                class="attachment-item"
              >
                <el-icon class="attachment-icon">
                  <Document />
                </el-icon>
                <a
                  :href="getAttachmentUrl(attachment)"
                  :download="getFileName(attachment)"
                  class="attachment-link"
                  target="_blank"
                >
                  {{ getFileName(attachment) }}
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

          <!-- 团队成员 -->
          <el-card
            v-if="project.members && project.members.length > 0"
            class="info-card"
          >
            <template #header>
              <span>团队成员</span>
            </template>
            <div class="members-list">
              <div
                v-for="member in project.members"
                :key="member.id"
                class="member-item"
              >
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
        </div>

        <!-- 右侧：需求列表 -->
        <div class="right-panel">
          <el-card class="requirements-card">
            <template #header>
              <div class="requirement-header">
                <span>需求列表</span>
                <el-button
                  type="primary"
                  size="small"
                  @click="goToRequirementPage"
                >
                  查看所有需求
                </el-button>
              </div>
            </template>
            <div v-loading="requirementsLoading" class="requirement-list">
              <div
                v-if="projectRequirements.length === 0"
                class="empty-requirements"
              >
                <el-empty description="暂无需求" :image-size="100">
                  <el-button type="primary" @click="goToRequirementPage"
                    >创建第一个需求</el-button
                  >
                </el-empty>
              </div>
              <div v-else class="requirements-container">
                <div
                  v-for="requirement in projectRequirements"
                  :key="requirement.id"
                  class="requirement-item"
                  :class="{
                    selected: selectedRequirement?.id === requirement.id
                  }"
                  @click="selectRequirement(requirement)"
                  @dblclick="openRequirementDrawer(requirement)"
                >
                  <div class="requirement-main">
                    <div class="requirement-title-row">
                      <span class="requirement-title">{{
                        requirement.title
                      }}</span>
                      <div class="requirement-badges">
                        <el-tag
                          :type="
                            getRequirementStatusTagType(requirement.status)
                          "
                          size="small"
                        >
                          {{ getRequirementStatusText(requirement.status) }}
                        </el-tag>
                        <el-tag
                          :type="
                            getRequirementPriorityTagType(requirement.priority)
                          "
                          size="small"
                          effect="plain"
                        >
                          {{ getRequirementPriorityText(requirement.priority) }}
                        </el-tag>
                      </div>
                    </div>
                    <p
                      v-if="requirement.description"
                      class="requirement-description"
                    >
                      {{ requirement.description }}
                    </p>
                    <div class="requirement-meta">
                      <div
                        v-if="requirement.assignee"
                        class="requirement-assignee"
                      >
                        <el-avatar
                          :src="requirement.assignee.avatar"
                          :size="20"
                        >
                          {{ requirement.assignee.name?.charAt(0) }}
                        </el-avatar>
                        <span>{{ requirement.assignee.name }}</span>
                      </div>
                      <div
                        v-if="requirement.category"
                        class="requirement-category"
                      >
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
                    <div
                      v-if="requirement.tags && requirement.tags.length > 0"
                      class="requirement-tags"
                    >
                      <el-tag
                        v-for="tag in requirement.tags"
                        :key="tag"
                        size="small"
                        effect="plain"
                        style="margin-right: 6px"
                      >
                        {{ tag }}
                      </el-tag>
                    </div>
                  </div>
                </div>
              </div>
              <!-- 需求分页 -->
              <div v-if="requirementTotal > 0" class="requirement-pagination">
                <el-pagination
                  v-model:current-page="requirementPage"
                  v-model:page-size="requirementPageSize"
                  :total="requirementTotal"
                  :page-sizes="[7, 10, 20, 50, 100]"
                  layout="total, sizes, prev, pager, next, jumper"
                  @size-change="handleRequirementPageSizeChange"
                  @current-change="handleRequirementPageChange"
                />
              </div>
            </div>
          </el-card>

          <!-- 任务列表（基于需求） -->
          <el-card v-if="selectedRequirement" class="tasks-card">
            <template #header>
              <div class="task-header">
                <span>任务列表 - {{ selectedRequirement.title }}</span>
                <el-button type="primary" size="small" @click="handleAddTask">
                  <el-icon>
                    <Plus />
                  </el-icon>
                  新建任务
                </el-button>
              </div>
            </template>
            <div v-loading="tasksLoading" class="task-list">
              <div v-if="requirementTasks.length === 0" class="empty-tasks">
                <el-empty description="该需求暂无任务" :image-size="80">
                  <el-button type="primary" @click="handleAddTask"
                    >创建第一个任务</el-button
                  >
                </el-empty>
              </div>
              <div v-else class="tasks-container">
                <div
                  v-for="task in requirementTasks"
                  :key="task.id"
                  class="task-item"
                >
                  <div class="task-main">
                    <div class="task-title-row">
                      <el-checkbox
                        :model-value="task.status === TaskStatus.DONE"
                        @change="
                          (val: boolean) => handleTaskStatusChange(task, val)
                        "
                      >
                        <span
                          class="task-title"
                          :class="{
                            completed: task.status === TaskStatus.DONE
                          }"
                          >{{ task.title }}</span
                        >
                      </el-checkbox>
                      <el-tag
                        :type="getTaskStatusTagType(task.status)"
                        size="small"
                      >
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
                        <el-tag
                          :type="getPriorityTagType(task.priority)"
                          size="small"
                        >
                          {{ getPriorityText(task.priority) }}
                        </el-tag>
                      </div>
                      <div
                        v-if="task.startDate || task.endDate"
                        class="task-dates"
                      >
                        <el-icon>
                          <Calendar />
                        </el-icon>
                        <span>{{
                          formatDateRange(task.startDate, task.endDate)
                        }}</span>
                      </div>
                    </div>
                  </div>
                  <div class="task-actions">
                    <el-button
                      type="text"
                      size="small"
                      @click="handleEditTask(task)"
                      >编辑</el-button
                    >
                    <el-button
                      type="text"
                      size="small"
                      @click="handleDeleteTask(task)"
                      >删除</el-button
                    >
                  </div>
                </div>
              </div>
            </div>
          </el-card>
        </div>
      </div>
    </div>

    <!-- 需求管理 Drawer -->
    <RequirementDrawer
      :visible="showRequirementDrawer"
      :project-id="project?.id"
      :project-name="project?.name"
      :requirement="currentRequirement"
      @update:visible="showRequirementDrawer = $event"
      @refresh="
        () =>
          projectId &&
          loadProjectRequirements(
            projectId,
            requirementPage,
            requirementPageSize
          )
      "
    />
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch, onMounted } from "vue";
import { useRoute, useRouter } from "vue-router";
import type { Project, Task, Requirement } from "@/types";
import {
  TaskStatus,
  RequirementStatus,
  type RequirementPriority
} from "@/types";
import dayjs from "dayjs";
import { ElMessage, ElMessageBox } from "element-plus";
import {
  ArrowLeft,
  Edit,
  Plus,
  Calendar,
  Folder,
  Document,
  Download
} from "@element-plus/icons-vue";
import {
  updateProjectState,
  selectProjects,
  selectRequirements,
  getProjectStatistics,
  type RequirementListItem,
  type DescribeContent,
  type ProjectStatisticsResponse
} from "@/api/project";
import { useProjectStoreHook } from "@/store/modules/project";
import RequirementDrawer from "@/components/RequirementDrawer.vue";

const route = useRoute();
const router = useRouter();

const project = ref<Project | null>(null);
const projectStatistics = ref<ProjectStatisticsResponse | null>(null);
const loading = ref(false);
const currentStatus = ref<string>("");
const statusUpdating = ref(false);
const projectRequirements = ref<Requirement[]>([]);
const requirementsLoading = ref(false);
const showRequirementDrawer = ref(false);
const currentRequirement = ref<Requirement | null>(null);
const selectedRequirement = ref<Requirement | null>(null);
const requirementTasks = ref<Task[]>([]);
const tasksLoading = ref(false);
const projectStore = useProjectStoreHook();

// 需求分页
const requirementPage = ref(1);
const requirementPageSize = ref(7);
const requirementTotal = ref(0);

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
        createdAt: item.create_time,
        progress: 0
      };
      currentStatus.value = project.value.status || "进行中";

      // 加载项目统计数据
      await loadProjectStatistics(projectId.value);
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
      // 将 API 返回的数据映射到 Requirement 类型
      projectRequirements.value = response.result.map(
        (item: RequirementListItem): Requirement => {
          return {
            id: item._id,
            title: item.需求名,
            description: extractDescription(item.describe),
            status: mapStatusToEnum(item.状态),
            priority: mapPriority(item.优先级),
            projectId: item.project_id,
            creatorId: item.creator, // 保存创建者ID
            createdAt: item.create_time
          };
        }
      );

      // 更新总数（如果 API 返回了 total，使用它；否则使用当前返回的数据长度作为估算）
      // 注意：如果当前页数据量等于 pageSize，说明可能还有更多数据
      if ((response as any).total !== undefined) {
        requirementTotal.value = (response as any).total;
      } else if (response.result.length < pageSize) {
        // 如果返回的数据少于 pageSize，说明这是最后一页
        requirementTotal.value = (page - 1) * pageSize + response.result.length;
      } else {
        // 如果返回的数据等于 pageSize，可能还有更多数据，暂时估算
        requirementTotal.value = page * pageSize + 1; // 至少还有一页
      }
    } else {
      ElMessage.error(response.message || "加载需求失败");
      projectRequirements.value = [];
      requirementTotal.value = 0;
    }
  } catch (error: any) {
    console.error("加载需求失败:", error);
    ElMessage.error(
      error?.response?.data?.message || error?.message || "加载需求失败"
    );
    projectRequirements.value = [];
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
    // TODO: 从 API 获取任务
    const allTasks = projectStore.getTasksByProjectId(projectId.value);
    requirementTasks.value = allTasks.filter(
      task => (task as any).requirementId === requirementId
    );
  } catch (error) {
    console.error("加载任务失败:", error);
    ElMessage.error("加载任务失败");
  } finally {
    tasksLoading.value = false;
  }
};

// 监听选中的需求变化
watch(selectedRequirement, requirement => {
  if (requirement) {
    loadRequirementTasks(requirement.id);
  } else {
    requirementTasks.value = [];
  }
});

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
      name: "RequirementsIndex",
      query: {
        project_id: project.value.id,
        project_name: project.value.name
      }
    });
  } else {
    router.push({ name: "RequirementsIndex" });
  }
};

// 打开需求 Drawer（编辑）
const openRequirementDrawer = (requirement?: Requirement) => {
  currentRequirement.value = requirement || null;
  showRequirementDrawer.value = true;
};

// 选择需求（显示该需求的任务）
const selectRequirement = (requirement: Requirement) => {
  selectedRequirement.value = requirement;
  loadRequirementTasks(requirement.id);
};

const handleAddTask = () => {
  if (!selectedRequirement.value) {
    ElMessage.warning("请先选择一个需求");
    return;
  }
  // TODO: 打开新建任务对话框
  ElMessage.info("新建任务功能待实现");
};

const handleEditTask = (task: Task) => {
  // TODO: 打开编辑任务对话框
  ElMessage.info("编辑任务功能待实现");
};

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
    projectStore.deleteTask(task.id);
    if (selectedRequirement.value) {
      loadRequirementTasks(selectedRequirement.value.id);
    }
    ElMessage.success("任务删除成功");
  } catch {
    // 用户取消
  }
};

const handleTaskStatusChange = (task: Task, completed: boolean) => {
  if (completed) {
    task.status = TaskStatus.DONE;
  } else {
    task.status = TaskStatus.TODO;
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
  const typeMap: Record<
    TaskStatus,
    "success" | "primary" | "info" | "warning" | "danger"
  > = {
    [TaskStatus.TODO]: "info",
    [TaskStatus.IN_PROGRESS]: "primary",
    [TaskStatus.TESTING]: "warning",
    [TaskStatus.DONE]: "success",
    [TaskStatus.BLOCKED]: "danger"
  };
  return typeMap[status] || "info";
};

const getTaskStatusText = (status: TaskStatus): string => {
  const textMap: Record<TaskStatus, string> = {
    [TaskStatus.TODO]: "待办",
    [TaskStatus.IN_PROGRESS]: "进行中",
    [TaskStatus.TESTING]: "测试中",
    [TaskStatus.DONE]: "已完成",
    [TaskStatus.BLOCKED]: "已阻塞"
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
  min-height: calc(100vh - 60px);
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
  grid-template-columns: 35vw 1fr;
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
  margin-bottom: 24px;
  border-radius: 12px;
  box-shadow:
    0 2px 8px rgba(0, 0, 0, 0.04),
    0 1px 3px rgba(0, 0, 0, 0.08);
  border: 1px solid rgba(0, 0, 0, 0.04);

  :deep(.el-card__header) {
    padding: 18px 20px;
    border-bottom: 1px solid rgba(0, 0, 0, 0.06);
    font-weight: 600;
    font-size: 16px;
    color: #303133;
  }

  :deep(.el-card__body) {
    padding: 24px;
  }
}

.statistics-content {
  .stat-item {
    padding: 20px;
    background: linear-gradient(135deg, #f8f9fa 0%, #ffffff 100%);
    border-radius: 10px;
    text-align: center;
    transition: all 0.3s;
    border: 1px solid #e4e7ed;

    &:hover {
      transform: translateY(-3px);
      box-shadow: 0 6px 16px rgba(0, 0, 0, 0.12);
    }

    .stat-label {
      font-size: 14px;
      color: #606266;
      margin-bottom: 12px;
      font-weight: 500;
    }

    .stat-value {
      font-size: 32px;
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
      padding: 24px;
      background: linear-gradient(135deg, #f0f7ff 0%, #ffffff 100%);

      .stat-label {
        margin-bottom: 16px;
        font-size: 15px;
        font-weight: 600;
        color: #303133;
      }

      .stat-value {
        margin-top: 12px;
        font-size: 20px;
        text-align: right;
        color: #409eff;
      }
    }
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
</style>
