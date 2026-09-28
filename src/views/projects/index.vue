<template>
  <div class="projects-page">
    <div class="page-header">
      <h2>{{ pageTitle }}</h2>
      <div class="header-actions">
        <el-input v-model="searchKeyword" placeholder="搜索项目..." prefix-icon="Search" clearable style="width: 200px" />
        <el-select v-model="statusFilter" placeholder="状态筛选" clearable style="width: 120px">
          <el-option label="草稿" value="草稿" />
          <!-- <el-option label="延期" value="延期" /> -->
          <el-option label="暂停" value="暂停" />
          <el-option label="进行中" value="进行中" />
          <el-option label="已完成" value="已完成" />
        </el-select>
        <el-button type="primary" @click="openCreateProject" v-perms="['project:add']">
          <el-icon>
            <Plus />
          </el-icon>
          新建项目
        </el-button>
      </div>
    </div>

    <!-- 项目统计 -->
    <el-row :gutter="20" class="stats-row">
      <el-col :span="6" :xs="24">
        <div class="stat-card">
          <div class="stat-number" style="color: #409eff">
            {{ projectStats.total }}
          </div>
          <div class="stat-label">总项目数</div>
        </div>
      </el-col>
      <el-col :span="6" :xs="24">
        <div class="stat-card">
          <div class="stat-number" style="color: #67c23a">
            {{ projectStats.active }}
          </div>
          <div class="stat-label">进行中</div>
        </div>
      </el-col>
      <el-col :span="6" :xs="24">
        <div class="stat-card">
          <div class="stat-number" style="color: #f56c6c">
            {{ projectStats.delayed }}
          </div>
          <div class="stat-label">已延期</div>
        </div>
      </el-col>
      <el-col :span="6" :xs="24">
        <div class="stat-card">
          <div class="stat-number" style="color: #e6a23c">
            {{ projectStats.completed }}
          </div>
          <div class="stat-label">已完成</div>
        </div>
      </el-col>
    </el-row>

    <!-- 移动端：卡片视图 -->
    <div v-if="isMobile">
      <el-tabs v-if="!fixedProjectType" v-model="projectTypeTab" class="project-type-tabs mobile-project-type-tabs">
        <el-tab-pane label="定制项目" name="定制项目" />
        <el-tab-pane label="公模项目" name="公模项目" />
      </el-tabs>
      <div v-loading="loading" class="projects-grid">
        <div v-for="project in filteredProjects" :key="project.id" class="project-card"
          @click="goToTaskList(project, $event)">
          <div class="card-header">
            <div class="project-info">
              <el-tag :type="getStatusTagType(project.status)">
                {{ getDisplayProjectStatus(project) }}
              </el-tag>
            </div>
            <div class="more-button-wrapper"
              v-if="hasPerms(['project:update']) || hasPerms(['project:delete_project'])">
              <el-dropdown :key="`dropdown-${project.id}-${dropdownTrigger}`" :trigger="dropdownTrigger"
                placement="bottom-end" @command="handleCommand($event, project)" :teleported="true"
                :hide-on-click="true">
                <span class="more-button-trigger" @click.stop>
                  <el-button type="text" class="more-button">
                    <el-icon>
                      <MoreFilled />
                    </el-icon>
                  </el-button>
                </span>
                <template #dropdown>
                  <el-dropdown-menu>
                    <el-dropdown-item v-if="hasPerms(['project:update'])" command="edit">编辑项目</el-dropdown-item>
                    <el-dropdown-item v-if="hasPerms(['project:delete_project'])" command="delete"
                      divided>删除项目</el-dropdown-item>
                  </el-dropdown-menu>
                </template>
              </el-dropdown>
            </div>
          </div>

          <!-- 第一行：项目名称（单独一行，突出显示） -->
          <div class="project-row project-row-name">
            <div class="field-item">
              <span class="field-label">项目名称:</span>
              <el-tooltip :content="project.name || '-'" placement="top">
                <span class="field-value project-name-value">{{ project.name || "-" }}</span>
              </el-tooltip>
            </div>
          </div>

          <!-- 第二行：客户名称，产品类型 -->
          <div class="project-row project-row-first">
            <div class="field-item">
              <span class="field-label">客户名称:</span>
              <el-tooltip :content="project.customer_name || '-'" placement="top">
                <span class="field-value">{{ project.customer_name || "-" }}</span>
              </el-tooltip>
            </div>
            <div class="field-item">
              <span class="field-label">产品类型:</span>
              <el-tooltip :content="project.product_type || '-'" placement="top">
                <span class="field-value">{{ project.product_type || "-" }}</span>
              </el-tooltip>
            </div>
          </div>

          <!-- 第三行：平台名称，主板名称 / APP 协议 -->
          <div class="project-row project-row-second">
            <div class="field-item" :class="{ 'field-item--full': isFeatureDevelopmentOnly }">
              <span class="field-label">平台名称:</span>
              <el-tooltip :content="project.platform_name || '-'" placement="top">
                <span class="field-value">{{ project.platform_name || "-" }}</span>
              </el-tooltip>
            </div>
            <div v-if="isStandardProjectList" class="field-item">
              <span class="field-label">主板名称:</span>
              <el-tooltip :content="project.motherboard_name || '-'" placement="top">
                <span class="field-value">{{ project.motherboard_name || "-" }}</span>
              </el-tooltip>
            </div>
            <div v-if="isAppFeatureDevelopment" class="field-item">
              <span class="field-label">APP协议:</span>
              <el-tooltip :content="project.app_protocol || '-'" placement="top">
                <span class="field-value">{{ project.app_protocol || "-" }}</span>
              </el-tooltip>
            </div>
          </div>

          <!-- 第四行：分辨率，业务负责人 / 马甲包名称 -->
          <div class="project-row project-row-third">
            <div class="field-item" :class="{ 'field-item--full': isFeatureDevelopmentOnly }">
              <span class="field-label">分辨率:</span>
              <el-tooltip :content="project.resolution || '-'" placement="top">
                <span class="field-value">{{ project.resolution || "-" }}</span>
              </el-tooltip>
            </div>
            <div v-if="isAppFeatureDevelopment" class="field-item">
              <span class="field-label">马甲包名称:</span>
              <el-tooltip :content="project.shadow_app || '-'" placement="top">
                <span class="field-value">{{ project.shadow_app || "-" }}</span>
              </el-tooltip>
            </div>
            <div v-if="!isFeatureDevelopmentOnly" class="field-item">
              <span class="field-label">业务负责人:</span>
              <el-tooltip :content="project.business_owner || '-'" placement="top">
                <span class="field-value">{{ project.business_owner || "-" }}</span>
              </el-tooltip>
            </div>
          </div>
          <div v-if="!isFeatureDevelopmentOnly" class="project-row project-row-third">
            <div class="field-item">
              <span class="field-label">立项时间:</span>
              <el-tooltip :content="project.project_initiation_date || '-'" placement="top">
                <span class="field-value">{{ project.project_initiation_date || "-" }}</span>
              </el-tooltip>
            </div>
          </div>
          <!-- 第五行：左侧进度条，右侧当前节点 -->
          <div class="project-row project-row-progress">
            <div class="progress-block">
              <div class="progress-info">
                <span>进度</span>
              </div>
              <el-progress :percentage="getProjectProgress(project)" :stroke-width="6" />
            </div>
            <div class="progress-node">
              <span class="progress-node__label">节点</span>
              <el-tooltip :content="getProjectNode(project)" placement="top"
                :disabled="getProjectNode(project) === '-'">
                <span class="progress-node__value">{{ getProjectNode(project) }}</span>
              </el-tooltip>
            </div>
          </div>
          <!-- 项目负责人 -->
          <div v-if="!isAppFeatureDevelopment" class="project-row project-row-owners">
            <div class="field-item">
              <span class="field-label">项目负责人:</span>
              <el-tooltip :content="project.creator || '-'" placement="top">
                <span class="field-value">{{ project.creator || "-" }}</span>
              </el-tooltip>
            </div>
          </div>

          <!-- 计划时间 -->
          <div class="project-row project-row-time">
            <div class="field-item">
              <el-icon>
                <Calendar />
              </el-icon>
              <span class="field-label">计划时间:</span>
              <el-tooltip :content="formatDateRange(project.startDate, project.endDate) || '-'" placement="top">
                <span class="field-value">{{
                  formatDateRange(project.startDate, project.endDate)
                }}</span>
              </el-tooltip>
            </div>
          </div>

          <div class="project-row project-row-actions">
            <el-button type="primary" size="small" class="go-task-list-btn" @click.stop="openProjectDetail(project)">
              查看项目详情
            </el-button>
          </div>

        </div>
      </div>
    </div>

    <!-- PC 端：表格视图 -->
    <el-card v-else v-loading="loading" class="projects-table">
      <el-tabs v-if="!fixedProjectType" v-model="projectTypeTab" class="project-type-tabs">
        <el-tab-pane label="定制项目" name="定制项目" />
        <el-tab-pane label="公模项目" name="公模项目" />
      </el-tabs>
      <TablePanel :loading="loading" @refresh="loadProjects">
        <el-table :data="filteredProjects" style="width: 100%" row-key="id" table-layout="fixed"
          @row-click="handleTableRowClick">
          <el-table-column prop="name" label="项目名称" show-overflow-tooltip>
            <template #default="{ row }">
              <span class="table-project-name">{{ row.name || "-" }}</span>
            </template>
          </el-table-column>
          <el-table-column v-if="isStandardProjectList" prop="motherboard_name" label="主板名称" show-overflow-tooltip />
          <el-table-column prop="status" label="状态">
            <template #default="{ row }">
              <el-tag :type="getStatusTagType(row.status)" size="small">
                {{ getDisplayProjectStatus(row) }}
              </el-tag>
            </template>
          </el-table-column>
          <el-table-column prop="customer_name" label="客户名称" show-overflow-tooltip />
          <el-table-column prop="product_type" label="产品类型" show-overflow-tooltip />
          <el-table-column prop="platform_name" label="平台名称" show-overflow-tooltip />
          <el-table-column prop="resolution" label="分辨率" show-overflow-tooltip />
          <el-table-column v-if="isAppFeatureDevelopment" prop="app_protocol" label="APP协议" show-overflow-tooltip />
          <el-table-column v-if="isAppFeatureDevelopment" prop="shadow_app" label="马甲包名称" show-overflow-tooltip />
          <el-table-column v-if="!isFeatureDevelopmentOnly" prop="business_owner" label="业务负责人" show-overflow-tooltip />
          <el-table-column v-if="!isFeatureDevelopmentOnly" prop="project_initiation_date" label="立项时间"
            show-overflow-tooltip />
          <el-table-column label="进度">
            <template #default="{ row }">
              <div class="table-progress-cell">
                <el-progress :percentage="getProjectProgress(row)" :stroke-width="6" :show-text="false" />
                <span class="progress-text">{{ getProjectProgress(row) }}%</span>
              </div>
            </template>
          </el-table-column>
          <el-table-column label="节点" show-overflow-tooltip>
            <template #default="{ row }">
              {{ getProjectNode(row) }}
            </template>
          </el-table-column>
          <el-table-column v-if="!isAppFeatureDevelopment" prop="creator" label="项目负责人" show-overflow-tooltip />
          <el-table-column label="计划时间" show-overflow-tooltip>
            <template #default="{ row }">
              {{ formatDateRange(row.startDate, row.endDate) }}
            </template>
          </el-table-column>
          <el-table-column label="操作" width="180">
            <template #default="{ row }">
              <div class="table-action-btns" @click.stop>
                <el-button type="primary" link size="small" @click="openProjectDetail(row)">
                  查看详情
                </el-button>
                <el-button type="primary" link size="small" @click="openProjectOverview(row)">
                  项目节点
                </el-button>
                <el-dropdown v-if="hasPerms(['project:update']) || hasPerms(['project:delete_project'])"
                  :key="`table-dropdown-${row.id}-${dropdownTrigger}`" :trigger="dropdownTrigger" placement="bottom-end"
                  @command="handleCommand($event, row)">
                  <el-button type="primary" link size="small">
                    更多
                    <el-icon>
                      <ArrowDown />
                    </el-icon>
                  </el-button>
                  <template #dropdown>
                    <el-dropdown-menu>
                      <el-dropdown-item v-if="hasPerms(['project:update'])" command="edit">编辑项目</el-dropdown-item>
                      <el-dropdown-item v-if="hasPerms(['project:delete_project'])" command="delete" divided>
                        删除项目
                      </el-dropdown-item>
                    </el-dropdown-menu>
                  </template>
                </el-dropdown>
              </div>
            </template>
          </el-table-column>
        </el-table>
      </TablePanel>
    </el-card>

    <!-- 新建/编辑项目对话框 -->
    <ProjectFormDialog v-model:visible="showProjectDialog" :project="editingProject"
      :default-project-type="fixedProjectType" @created="handleProjectCreated" @updated="handleProjectUpdated" />

    <!-- 成员管理对话框 -->
    <ProjectMembersDialog v-model:visible="showMembersDialog" :project="selectedProject"
      @updated="handleProjectUpdated" />
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, watch, nextTick, onBeforeUnmount } from "vue";
import { useRouter, useRoute } from "vue-router";
import { ElMessage, ElMessageBox } from "element-plus";
import {
  Plus,
  MoreFilled,
  Calendar,
  ArrowDown
} from "@element-plus/icons-vue";
import { hasPerms } from "@/utils/auth";
import { useProjectStoreHook } from "@/store/modules/project";
import { useAppStoreHook } from "@/store/modules/app";
import { type Project } from "@/types";
import { mockProjects } from "@/mock/projects";
import ProjectFormDialog from "@/components/ProjectFormDialog.vue";
import ProjectMembersDialog from "@/components/ProjectMembersDialog.vue";
import TablePanel from "@/components/TablePanel/index.vue";
import dayjs from "dayjs";
import {
  selectProjects,
  type SelectProjectParams,
  deleteProject as deleteProjectApi
} from "@/api/project";
import {
  getProjectDetailRouteName,
  isAppFeatureDevelopmentType,
  isFeatureDevelopmentType
} from "@/utils/projectRoute";

const projectStore = useProjectStoreHook();
const router = useRouter();
const route = useRoute();
const appStore = useAppStoreHook();

const fixedProjectType = computed(
  () => route.meta.defaultProjectType as string | undefined
);
const pageTitle = computed(() => fixedProjectType.value || "项目管理");
const projectDetailRouteName = computed(() =>
  getProjectDetailRouteName(fixedProjectType.value)
);
const isFeatureDevelopmentOnly = computed(() =>
  isFeatureDevelopmentType(fixedProjectType.value)
);
const isAppFeatureDevelopment = computed(() =>
  isAppFeatureDevelopmentType(fixedProjectType.value)
);
const isStandardProjectList = computed(
  () => !isFeatureDevelopmentOnly.value && !isAppFeatureDevelopment.value
);

const searchKeyword = ref("");
const statusFilter = ref<string>("");
const projectTypeTab = ref(fixedProjectType.value || "定制项目");
const currentPage = ref(1);
const pageSize = ref(20);
const loading = ref(false);

// 响应式窗口宽度
const windowWidth = ref(window.innerWidth);

// 监听窗口大小变化
const handleResize = () => {
  windowWidth.value = window.innerWidth;
};

onMounted(() => {
  window.addEventListener("resize", handleResize);
});

onBeforeUnmount(() => {
  window.removeEventListener("resize", handleResize);
});

const MOBILE_BREAKPOINT = 640;

const isMobile = computed(() => windowWidth.value <= MOBILE_BREAKPOINT);

// 根据设备类型决定下拉菜单的触发方式
const dropdownTrigger = computed(() => {
  return isMobile.value ? "click" : "hover";
});

const selectedProject = ref<Project | null>(null);
const editingProject = ref<Project | null>(null);
const showProjectDialog = ref(false);
const showMembersDialog = ref(false);

// 项目列表
const projects = ref<Project[]>([]);
const totalProjects = ref(0);

const defaultProjectStats = () => ({
  total: 0,
  active: 0,
  delayed: 0,
  completed: 0
});

const projectStats = ref(defaultProjectStats());

const applyProjectStateCount = (stateCount?: Record<string, unknown>) => {
  if (!stateCount) {
    projectStats.value = defaultProjectStats();
    return;
  }
  projectStats.value = {
    total: Number(stateCount["总项目数"] ?? 0),
    active: Number(stateCount["进行中"] ?? 0),
    delayed: Number(stateCount["延期"] ?? 0),
    completed: Number(stateCount["已完成"] ?? 0)
  };
};

// 过滤后的项目列表（现在直接从 API 获取，不需要前端过滤）
const filteredProjects = computed(() => {
  return projects.value;
});

// 状态映射：直接使用中文状态，不需要转换
const getStateForApi = (status: string): string => {
  return status;
};

// 加载项目列表
const loadProjects = async () => {
  loading.value = true;
  try {
    const params: SelectProjectParams = {
      project_name: searchKeyword.value || "",
      project_type: projectTypeTab.value,
      creator: "",
      state: statusFilter.value ? getStateForApi(statusFilter.value) : "",
      page: currentPage.value,
      page_size: pageSize.value
    };

    const response = await selectProjects(params);

    if (response.code === 200) {
      // 获取返回的数据（可能是 result 或 data）
      const rawList = response.result ?? response.data;
      const projectList = Array.isArray(rawList) ? rawList : [];

      // 将 API 返回的数据转换为前端 Project 类型
      projects.value = projectList.map((item: any) => {
        // 处理 describe 数组，转换为描述文本（用于列表显示）
        let description = "";
        if (item.describe && Array.isArray(item.describe)) {
          if (item.describe.length > 0) {
            if (typeof item.describe[0] === "string") {
              // 字符串数组，直接提取文本（过滤掉图片URL）
              description = item.describe
                .filter((str: string) => {
                  // 过滤掉图片URL
                  const isImageUrl =
                    (str.startsWith("http://") ||
                      str.startsWith("https://") ||
                      str.startsWith("/")) &&
                    /\.(jpg|jpeg|png|gif|webp|bmp|svg)(\?|$)/i.test(str);
                  return !isImageUrl;
                })
                .join("\n");
            } else {
              // 对象数组，提取文本类型的内容
              description = item.describe
                .filter((d: any) => d.type === "text")
                .map((d: any) => d.content)
                .join("\n");
            }
          }
        }

        // 处理状态：如果 state 包含多个状态（用逗号分隔），取第一个
        let state = item.state || "进行中";
        if (state.includes(",")) {
          state = state.split(",")[0].trim();
        }

        // 处理 describe 数组，适配 API 返回格式
        // 可能是字符串数组（如 ["vvgv"]）或对象数组（如 [{type: "text", content: "..."}, {type: "image", url: "..."}]）
        let processedDescribe: any[] = [];
        if (item.describe && Array.isArray(item.describe)) {
          if (item.describe.length > 0) {
            // 判断第一个元素是字符串还是对象
            if (typeof item.describe[0] === "string") {
              // 字符串数组，转换为 DescribeContent[] 格式
              processedDescribe = item.describe.map((str: string) => {
                // 判断是否是图片 URL（以 http://、https:// 或 / 开头，且包含图片扩展名）
                const isImageUrl =
                  (str.startsWith("http://") ||
                    str.startsWith("https://") ||
                    str.startsWith("/")) &&
                  /\.(jpg|jpeg|png|gif|webp|bmp|svg)(\?|$)/i.test(str);

                if (isImageUrl) {
                  return {
                    type: "url" as const,
                    content: str
                  };
                } else {
                  return {
                    type: "text" as const,
                    content: str
                  };
                }
              });
            } else {
              // 对象数组，处理 type: "image" 和 type: "url" 的情况
              processedDescribe = item.describe.map((d: any) => {
                // 如果 type 是 "image" 且有 url 字段，转换为 "url" 类型
                if (d.type === "image" && d.url) {
                  return {
                    type: "url" as const,
                    content: d.url
                  };
                }
                // 如果 type 是 "url" 且有 url 字段，使用 url 作为 content
                if (d.type === "url" && d.url && !d.content) {
                  return {
                    type: "url" as const,
                    content: d.url
                  };
                }
                // 如果已经是正确的格式（有 type 和 content），直接返回
                if (d.type && d.content) {
                  return d;
                }
                // 其他情况，尝试转换为文本类型
                return {
                  type: "text" as const,
                  content: typeof d === "string" ? d : d.content || d.url || ""
                };
              });
            }
          }
        }

        const convertedProject = {
          id: item._id || item.project_id || item.id,
          name: item.project_name || item.name,
          description: description || item.description || "",
          describe: processedDescribe, // 保存处理后的 describe 数组
          status: state,
          creator: item.creator || "", // 项目负责人
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
          state_description: item.state_description || "", // 状态描述
          总进度: item.总进度 || item.progress || 0, // 优先使用后端返回的 总进度 字段
          attachment: item.attachment || [], // 保存附件数组
          project_proposal: item.project_proposal || [], // 保存立项文件数组
          customer_name: item.customer_name || "", // 客户名称
          project_type: item.project_type || "", // 项目类型
          product_type: item.product_type || "", // 产品类型
          platform_name: item.platform_name || "", // 平台名称
          motherboard_name: item.motherboard_name || "", // 主板名称
          resolution: item.resolution || "", // 分辨率
          app_protocol: item.app_protocol || "", // APP协议
          shadow_app: item.shadow_app || "", // 马甲包名称
          business_owner: item.business_owner || "", // 业务负责人
          project_initiation_date: item.project_initiation_date || "", // 立项时间
          node: (() => {
            const raw = item.node ?? item.node_name ?? item["节点"];
            return raw != null && String(raw).trim() !== "" ? String(raw).trim() : "";
          })(),
          createdAt:
            item.create_time ||
            item.created_at ||
            item.createdAt ||
            new Date().toISOString(),
          updatedAt:
            item.updated_at || item.updatedAt || new Date().toISOString()
        } as Project;

        return convertedProject;
      });
      totalProjects.value = response.total_count ?? projectList.length;
      applyProjectStateCount(response.state_count as Record<string, unknown>);
    } else {
      ElMessage.error(response.message || "加载项目列表失败");
      // 如果 API 失败，使用 mock 数据作为后备
      projects.value = [...mockProjects];
      totalProjects.value = mockProjects.length;
      applyProjectStateCount();
    }
  } catch (error: any) {
    console.error("加载项目列表失败:", error);
    ElMessage.error(
      error?.response?.data?.message || error?.message || "加载项目列表失败"
    );
    // 如果 API 失败，使用 mock 数据作为后备
    projects.value = [...mockProjects];
    totalProjects.value = mockProjects.length;
    applyProjectStateCount();
  } finally {
    loading.value = false;
  }
};

const getProjectProgress = (project: Project & Record<string, unknown>) => {
  const extraProgress = project["总进度"];
  if (typeof extraProgress === "number") {
    return extraProgress;
  }
  if (typeof project.progress === "number") {
    return project.progress;
  }
  return 0;
};

/** 当前流程节点文案（如 1.立项表），兼容接口 node / 节点 */
const getProjectNode = (project: Project & Record<string, unknown>) => {
  const raw = project.node ?? project["节点"] ?? project["node_name"];
  if (raw == null) return "-";
  const s = String(raw).trim();
  return s !== "" ? s : "-";
};

// 打开项目详情（跳转到详情页）
const getProjectTypeParam = (project: Project) =>
  project.project_type || projectTypeTab.value;

const openProjectDetail = (project: Project) => {
  router.push({
    name: projectDetailRouteName.value,
    params: { id: project.id, state: project.status },
    query: { project_type: getProjectTypeParam(project) }
  });
};

// 打开项目节点（与点击行一致，跳转任务列表）
const openProjectOverview = (project: Project) => {
  goToTaskList(project);
};

const handleTableRowClick = (row: Project) => {
  goToTaskList(row);
};

// 点击卡片主体：前往任务列表并带上当前项目；忽略「更多」区域点击
const goToTaskList = (project: Project, event?: Event) => {
  if (event?.target) {
    const target = event.target as HTMLElement;
    if (
      target.closest(".more-button-wrapper") ||
      target.closest(".more-button-trigger") ||
      target.closest(".more-button")
    ) {
      return;
    }
  }
  router.push({
    path: "/tasks/list",
    query: {
      project_id: project.id,
      project_name:
        (project as Project & { project_name?: string }).project_name ||
        project.name ||
        ""
    }
  });
};

// 处理命令
const handleCommand = async (command: string, project: Project) => {
  selectedProject.value = project;

  switch (command) {
    case "edit":
      editProject(project);
      break;
    case "change_status":
      changeProjectStatus(project);
      break;
    case "members":
      manageMembers(project);
      break;
    case "delete":
      await deleteProject(project);
      break;
  }
};

// 新建项目
const openCreateProject = () => {
  editingProject.value = null;
  showProjectDialog.value = true;
};

// 编辑项目
const editProject = (project: Project) => {
  editingProject.value = project;
  showProjectDialog.value = true;
};

// 更改项目状态
const changeProjectStatus = (project: Project) => {
  console.log(project);
};

// 管理成员
const manageMembers = (project: Project) => {
  showMembersDialog.value = true;
};

// 删除项目
const deleteProject = async (project: Project) => {
  try {
    await ElMessageBox.confirm(
      `确定要删除项目"${project.name}"吗？此操作不可撤销。`,
      "删除确认",
      {
        confirmButtonText: "确定",
        cancelButtonText: "取消",
        type: "error"
      }
    );

    // 调用删除接口
    const response = await deleteProjectApi({
      project_id: project.id
    });

    if (response.code === 200) {
      // 从列表中移除
      const index = projects.value.findIndex(p => p.id === project.id);
      if (index > -1) {
        projects.value.splice(index, 1);
        projectStore.deleteProject(project.id);
      }
      ElMessage.success("项目删除成功");
      // 重新加载项目列表
      loadProjects();
    } else {
      ElMessage.error(response.message || "项目删除失败");
    }
  } catch (error: any) {
    // 如果是用户取消，不显示错误
    if (error !== "cancel") {
      console.error("删除项目失败:", error);
      ElMessage.error(
        error?.response?.data?.message || error?.message || "项目删除失败"
      );
    }
  }
};

// 处理项目创建
const handleProjectCreated = (newProject: Project) => {
  // 重新加载项目列表
  loadProjects();
  projectStore.addProject(newProject);
  editingProject.value = null;
};

// 处理项目编辑完成
const handleProjectUpdated = (updatedProject: Project) => {
  // 重新加载项目列表
  loadProjects();
  projectStore.updateProject(updatedProject);
  ElMessage.success("项目更新成功");
  editingProject.value = null;
};

// 获取状态标签类型
const getStatusTagType = (
  status?: string
): "success" | "primary" | "info" | "warning" | "danger" | undefined => {
  const typeMap: Record<string, "success" | "primary" | "info" | "warning" | "danger"> = {
    未开始: "warning",
    进行中: "success",
    已完成: "primary",
    延期: 'danger'
  };
  return status ? typeMap[status] : undefined;
};

// 获取状态文本（直接返回中文状态，不需要转换）
const getStatusText = (status?: string) => {
  return status || "-";
};

const isProjectDelayed = (project: { status?: string }): boolean =>
  project?.status === "延期";

/** 根据计划结束时间 endDate 与当前日期计算延期天数 */
const getProjectDelayDays = (project: { endDate?: string }): number | null => {
  const deadline = project?.endDate;
  if (!deadline) return null;
  const deadlineDate = dayjs(deadline).startOf("day");
  if (!deadlineDate.isValid()) return null;
  const days = dayjs().startOf("day").diff(deadlineDate, "day");
  return days > 0 ? days : null;
};

const getDisplayProjectStatus = (project: Project): string => {
  let statusText = getStatusText(project.status);
  if (isProjectDelayed(project)) {
    const days = getProjectDelayDays(project);
    statusText = days != null ? `延期 ${days}天` : "延期";
  }
  const desc = project.state_description?.trim();
  return desc ? `${statusText}（${desc}）` : statusText;
};

// 格式化日期范围
const formatDateRange = (startDate?: string, endDate?: string) => {
  if (!startDate || !endDate) return "-";
  return `${dayjs(startDate).format("MM-DD")} ~ ${dayjs(endDate).format("MM-DD")}`;
};


// 关闭弹窗后清空编辑对象，避免取消后再点新建仍走编辑态
watch(showProjectDialog, visible => {
  if (!visible) {
    editingProject.value = null;
  }
});

watch(fixedProjectType, type => {
  if (type) {
    projectTypeTab.value = type;
  } else if (!["定制项目", "公模项目"].includes(projectTypeTab.value)) {
    projectTypeTab.value = "定制项目";
  }
});

watch(
  () => route.path,
  (path, oldPath) => {
    const isListRoute =
      path === "/projects/index" ||
      path === "/feature-development/index" ||
      path === "/app-feature-development/index";
    const wasListRoute =
      oldPath === "/projects/index" ||
      oldPath === "/feature-development/index" ||
      oldPath === "/app-feature-development/index";
    if (isListRoute && wasListRoute && path !== oldPath) {
      searchKeyword.value = "";
      statusFilter.value = "";
      currentPage.value = 1;
    }
  }
);

// 监听搜索和筛选变化，重新加载数据
watch(
  [searchKeyword, statusFilter, projectTypeTab, currentPage, pageSize],
  () => {
    loadProjects();
  },
  { deep: true }
);

onMounted(() => {
  // 加载项目列表
  loadProjects();
  // 初始化数据
  projectStore.setProjects(projects.value);
});
</script>

<style scoped lang="scss">
.projects-page {
  background: linear-gradient(135deg, #f5f7fa 0%, #fafbfc 100%);
  min-height: calc(100vh - 60px);
}

.page-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 28px;
  padding-bottom: 16px;
  border-bottom: 1px solid rgba(0, 0, 0, 0.06);

  h2 {
    margin: 0;
    color: #303133;
    font-size: 26px;
    font-weight: 600;
    letter-spacing: -0.5px;
  }


  .header-actions {
    display: flex;
    gap: 12px;
    align-items: center;
  }
}

.stats-row {
  margin-bottom: 28px;
}

.project-type-tabs {
  margin-bottom: 0;

  :deep(.el-tabs__header) {
    margin-bottom: 0;
  }
}

.mobile-project-type-tabs {
  margin-bottom: 12px;
  background: #fff;
  border-radius: 12px;
  padding: 0 12px;
  box-shadow:
    0 2px 8px rgba(0, 0, 0, 0.04),
    0 1px 3px rgba(0, 0, 0, 0.08);
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

  &:hover {
    transform: translateY(-2px);
    box-shadow:
      0 4px 16px rgba(0, 0, 0, 0.08),
      0 2px 6px rgba(0, 0, 0, 0.12);
  }

  .stat-number {
    font-size: 36px;
    font-weight: 700;
    margin-bottom: 8px;
    letter-spacing: -1px;
  }

  .stat-label {
    font-size: 14px;
    color: #909399;
    font-weight: 500;
  }
}

.view-controls {
  margin-bottom: 24px;
  display: flex;
  justify-content: flex-end;
}

.projects-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(340px, 1fr));
  gap: 24px;
}

.project-card {
  background: #ffffff;
  border-radius: 12px;
  padding: 24px;
  cursor: pointer;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  box-shadow:
    0 2px 8px rgba(0, 0, 0, 0.04),
    0 1px 3px rgba(0, 0, 0, 0.08);
  border: 1px solid rgba(0, 0, 0, 0.04);
  position: relative;
  overflow: visible; // 改为 visible 确保下拉菜单不被裁剪
  box-sizing: border-box;
  width: 100%;
  max-width: 100%;

  &::before {
    content: "";
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    height: 3px;
    background: linear-gradient(90deg, #409eff 0%, #67c23a 100%);
    opacity: 0;
    transition: opacity 0.3s;
  }

  &:hover {
    transform: translateY(-4px);
    box-shadow:
      0 8px 24px rgba(0, 0, 0, 0.12),
      0 2px 8px rgba(0, 0, 0, 0.08);
    border-color: rgba(64, 158, 255, 0.2);

    &::before {
      opacity: 1;
    }
  }

  .card-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 16px;
    padding-bottom: 12px;
    border-bottom: 1px solid rgba(0, 0, 0, 0.06);

    .more-button-wrapper {
      display: flex;
      align-items: center;
      justify-content: center;
      z-index: 100;
      position: relative;

      // 确保下拉菜单在PC端正确显示
      :deep(.el-dropdown__popper) {
        z-index: 2000 !important;
      }
    }

    .more-button-trigger {
      display: inline-flex;
      align-items: center;
      justify-content: center;
      cursor: pointer;
    }

    .more-button {
      min-width: 32px;
      min-height: 32px;
      padding: 6px;
      display: flex;
      align-items: center;
      justify-content: center;
      cursor: pointer;

      &:hover {
        background-color: rgba(64, 158, 255, 0.1);
      }
    }
  }

  .project-row {
    margin-bottom: 16px;
    padding-bottom: 12px;
    border-bottom: 1px solid rgba(0, 0, 0, 0.06);

    &:last-child {
      border-bottom: none;
      margin-bottom: 0;
      padding-bottom: 0;
    }

    .field-item {
      display: flex;
      align-items: center;
      font-size: 15px;
      color: #606266;
      line-height: 1.6;
      margin-bottom: 8px;

      &:last-child {
        margin-bottom: 0;
      }

      .el-icon {
        font-size: 18px;
        color: #909399;
        margin-right: 6px;
      }

      .field-label {
        color: #909399;
        margin-right: 8px;
        font-weight: 500;
        white-space: nowrap;
        font-size: 15px;
      }

      .field-value {
        color: #303133;
        flex: 1;
        font-size: 15px;
        overflow: hidden;
        text-overflow: ellipsis;
        white-space: nowrap;
        min-width: 0;
        max-width: 100%;
      }
    }
  }

  .project-row-name {
    .field-item {
      margin-bottom: 0;

      .project-name-value {
        font-weight: 600;
        font-size: 16px;
        color: #303133;
      }
    }
  }

  .project-row-first,
  .project-row-second,
  .project-row-third {
    display: flex;
    gap: 16px;

    .field-item {
      margin-bottom: 0;
      width: 50%;
      flex: 0 0 50%;
      box-sizing: border-box;

      &.field-item--full {
        width: 100%;
        flex: 0 0 100%;
      }
    }
  }

  .project-row-actions {
    display: flex;
    justify-content: flex-end;
    align-items: center;

    .go-task-list-btn {
      flex-shrink: 0;
    }
  }

  .project-row-progress {
    display: grid;
    grid-template-columns: 1fr 1fr;
    align-items: stretch;
    column-gap: 0;
    width: 100%;
    box-sizing: border-box;

    .progress-block {
      min-width: 0;
      padding-right: 12px;
      box-sizing: border-box;
    }

    .progress-info {
      display: flex;
      justify-content: space-between;
      margin-bottom: 10px;
      font-size: 15px;
      color: #606266;
      font-weight: 500;
      min-width: 0;
    }

    .progress-node {
      min-width: 0;
      display: flex;
      flex-direction: column;
      justify-content: flex-start;
      gap: 6px;
      padding-left: 12px;
      border-left: 1px solid rgba(0, 0, 0, 0.08);
      box-sizing: border-box;

      &__label {
        font-size: 13px;
        color: #909399;
        font-weight: 500;
        line-height: 1.2;
      }

      &__value {
        font-size: 15px;
        color: #303133;
        font-weight: 500;
        line-height: 1.45;
        overflow: hidden;
        text-overflow: ellipsis;
        display: -webkit-box;
        -webkit-line-clamp: 2;
        line-clamp: 2;
        -webkit-box-orient: vertical;
        word-break: break-word;
      }
    }

    :deep(.el-progress) {
      width: 100%;
      max-width: 100%;

      .el-progress-bar {
        width: 100%;
        max-width: 100%;
      }
    }
  }
}

.projects-table {
  border-radius: 12px;
  box-shadow:
    0 2px 8px rgba(0, 0, 0, 0.04),
    0 1px 3px rgba(0, 0, 0, 0.08);

  .project-type-tabs {
    padding: 0 16px;

    :deep(.el-tabs__header) {
      margin-bottom: 0;
    }

    :deep(.el-tabs__nav-wrap::after) {
      height: 1px;
    }
  }

  :deep(.el-card__body) {
    padding: 0;
  }

  :deep(.el-table) {
    width: 100%;

    .el-table__body-wrapper {
      overflow-x: hidden;
    }

    .el-table__row {
      cursor: pointer;
      transition: background-color 0.2s;

      &:hover {
        background-color: #f8f9fa;
      }
    }

    .el-table__cell {
      padding: 14px 12px;
    }
  }

  .table-project-name {
    color: #303133;
    font-weight: 600;
  }

  .table-progress-cell {
    display: flex;
    align-items: center;
    gap: 8px;
    min-width: 0;

    :deep(.el-progress) {
      flex: 1;
      min-width: 0;
    }
  }

  .progress-text {
    flex-shrink: 0;
    font-size: 12px;
    color: #606266;
  }

  .table-action-btns {
    display: flex;
    align-items: center;
    gap: 4px;
    flex-wrap: wrap;
  }
}

.avatar-group {
  display: flex;
  align-items: center;
  justify-content: flex-end;

  .more-members {
    font-size: 12px;
    color: #909399;
    margin-left: 8px;
  }
}

.pagination {
  display: flex;
  justify-content: center;
  margin-top: 20px;
}

@media (max-width: 768px) {
  .page-header {
    flex-direction: column;
    gap: 16px;
    align-items: stretch;

  }

  .projects-grid {
    grid-template-columns: 1fr;
    gap: 16px;
  }

  .project-card {
    padding: 16px;
  }
}

// 移动端适配 (640px)
@media (max-width: 640px) {
  .projects-page {
    width: 100%;
    box-sizing: border-box;
    overflow-x: hidden; // 防止横向滚动
  }

  .page-header {
    flex-direction: column;
    gap: 12px;
    align-items: stretch;
    margin-bottom: 16px;

    h2 {
      font-size: 18px;
    }

    .header-actions {
      .el-input {
        width: 100% !important;
      }

      .el-select {
        width: 100% !important;
      }

      .el-button {
        width: 100%;
      }
    }
  }

  .stats-row {
    margin-bottom: 16px !important;

    .el-col {
      margin-bottom: 12px;
    }
  }

  .stat-card {
    padding: 16px 12px;

    .stat-number {
      font-size: 24px;
    }

    .stat-label {
      font-size: 13px;
    }
  }

  .projects-grid {
    grid-template-columns: 1fr;
    gap: 12px;
    width: 100%;
    box-sizing: border-box;
  }

  .project-card {
    padding: 12px;
    border-radius: 8px;
    width: 100%;
    max-width: 100%;
    box-sizing: border-box;
    overflow-x: hidden; // 防止内容横向溢出

    .card-header {
      margin-bottom: 12px;

      h3 {
        font-size: 16px;
      }

      .more-button-wrapper {
        z-index: 200;
        position: relative;
      }

      .more-button-trigger {
        min-width: 44px;
        min-height: 44px;
        display: flex;
        align-items: center;
        justify-content: center;
        touch-action: manipulation; // 优化移动端触摸
        -webkit-tap-highlight-color: transparent; // 移除移动端点击高亮
      }

      .more-button {
        min-width: 44px;
        min-height: 44px;
        padding: 10px;
        display: flex;
        align-items: center;
        justify-content: center;

        :deep(.el-icon) {
          font-size: 20px;
        }
      }

      // 确保下拉菜单在移动端正确显示
      :deep(.el-dropdown__popper) {
        z-index: 3000 !important;
      }
    }

    .project-row {
      width: 100%;
      box-sizing: border-box;
      overflow-x: hidden;

      .field-item {
        min-width: 0; // 允许 flex 子元素收缩
        overflow-wrap: break-word;
        word-break: break-word;

        .field-label {
          white-space: normal; // 允许换行
          flex-shrink: 0;
        }

        .field-value {
          min-width: 0; // 允许文本换行
          overflow-wrap: break-word;
          word-break: break-word;
        }
      }
    }

    .project-row-first,
    .project-row-second,
    .project-row-third {
      grid-template-columns: 1fr; // 移动端改为单列布局
      gap: 8px;
    }

    .project-row-progress {
      grid-template-columns: 1fr;
      row-gap: 12px;

      .progress-block {
        width: 100%;
        padding-right: 0;
      }

      .progress-node {
        max-width: 100%;
        width: 100%;
        padding-left: 0;
        padding-top: 10px;
        border-left: none;
        border-top: 1px solid rgba(0, 0, 0, 0.08);
      }

      :deep(.el-progress) {
        width: 100%;
        max-width: 100%;

        .el-progress-bar {
          width: 100%;
          max-width: 100%;
        }
      }
    }

    .project-row-actions {
      justify-content: stretch;

      .go-task-list-btn {
        width: 100%;
      }
    }

    .card-content {
      font-size: 13px;
    }

    .card-footer {
      margin-top: 12px;
      padding-top: 12px;
      flex-direction: column;
      gap: 8px;
      align-items: stretch;

      .card-actions {
        width: 100%;
        flex-direction: column;
        gap: 8px;

        .el-button {
          width: 100%;
        }
      }
    }
  }

  .pagination {
    margin-top: 16px;
    padding: 0 8px;
  }
}
</style>
