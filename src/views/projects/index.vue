<template>
  <div class="projects-page">
    <div class="page-header">
      <h2>项目管理</h2>
      <div class="header-actions">
        <el-input v-model="searchKeyword" placeholder="搜索项目..." prefix-icon="Search" clearable style="width: 200px" />
        <el-select v-model="statusFilter" placeholder="状态筛选" clearable style="width: 120px"
          v-perms="['project:update_state']">
          <el-option label="未开始" value="未开始" />
          <el-option label="进行中" value="进行中" />
          <el-option label="已完成" value="已完成" />
        </el-select>
        <el-button type="primary" @click="showProjectDialog = true" v-perms="['project:add']">
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

    <!-- 视图切换 -->
    <!-- <div class="view-controls">
      <el-radio-group v-model="viewMode" size="small">
        <el-radio-button label="card">卡片视图</el-radio-button>
        <el-radio-button label="table">表格视图</el-radio-button>
      </el-radio-group>
    </div> -->

    <!-- 卡片视图 -->
    <div v-if="viewMode === 'card'" v-loading="loading" class="projects-grid">
      <div v-for="project in filteredProjects" :key="project.id" class="project-card"
        @click="openProjectDetail(project, $event)">
        <div class="card-header">
          <div class="project-info">
            <el-tag :type="getStatusTagType(project.status)">
              {{ getStatusText(project.status) }}
            </el-tag>
          </div>
          <div class="more-button-wrapper" v-if="hasPerms(['project:update']) || hasPerms(['project:delete_project'])">
            <el-dropdown :key="`dropdown-${project.id}-${dropdownTrigger}`" :trigger="dropdownTrigger"
              placement="bottom-end" @command="handleCommand($event, project)" :teleported="true" :hide-on-click="true">
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

        <!-- 第三行：平台名称，主板名称 -->
        <div class="project-row project-row-second">
          <div class="field-item">
            <span class="field-label">平台名称:</span>
            <el-tooltip :content="project.platform_name || '-'" placement="top">
              <span class="field-value">{{ project.platform_name || "-" }}</span>
            </el-tooltip>
          </div>
          <div class="field-item">
            <span class="field-label">主板名称:</span>
            <el-tooltip :content="project.motherboard_name || '-'" placement="top">
              <span class="field-value">{{ project.motherboard_name || "-" }}</span>
            </el-tooltip>
          </div>
        </div>

        <!-- 第四行：分辨率，业务负责人 -->
        <div class="project-row project-row-third">
          <div class="field-item">
            <span class="field-label">分辨率:</span>
            <el-tooltip :content="project.resolution || '-'" placement="top">
              <span class="field-value">{{ project.resolution || "-" }}</span>
            </el-tooltip>
          </div>
          <div class="field-item">
            <span class="field-label">业务负责人:</span>
            <el-tooltip :content="project.business_owner || '-'" placement="top">
              <span class="field-value">{{ project.business_owner || "-" }}</span>
            </el-tooltip>
          </div>
        </div>

        <!-- 第五行：进度 -->
        <div class="project-row project-row-progress">
          <div class="progress-info">
            <span>进度</span>
          </div>
          <el-progress :percentage="getProjectProgress(project)" :stroke-width="6" />
        </div>
        <!-- 第三行：项目负责人，业务负责人 -->
        <div class="project-row project-row-owners">
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

        <!-- 右下角：查看任务列表 -->
        <div class="project-row project-row-actions">
          <el-button type="primary" size="small" class="go-task-list-btn" @click.stop="goToTaskList(project)">
            查看任务列表
          </el-button>
        </div>

      </div>
    </div>



    <!-- 新建/编辑项目对话框 -->
    <ProjectFormDialog v-model:visible="showProjectDialog" :project="editingProject" @created="handleProjectCreated"
      @updated="handleProjectUpdated" />

    <!-- 成员管理对话框 -->
    <ProjectMembersDialog v-model:visible="showMembersDialog" :project="selectedProject"
      @updated="handleProjectUpdated" />
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, watch, nextTick, onBeforeUnmount } from "vue";
import { useRouter } from "vue-router";
import { ElMessage, ElMessageBox } from "element-plus";
import {
  Plus,
  MoreFilled,
  Calendar
} from "@element-plus/icons-vue";
import { hasPerms } from "@/utils/auth";
import { useProjectStoreHook } from "@/store/modules/project";
import { useAppStoreHook } from "@/store/modules/app";
import { type Project } from "@/types";
import { mockProjects } from "@/mock/projects";
import ProjectFormDialog from "@/components/ProjectFormDialog.vue";
import ProjectMembersDialog from "@/components/ProjectMembersDialog.vue";
import dayjs from "dayjs";
import {
  selectProjects,
  type SelectProjectParams,
  deleteProject as deleteProjectApi
} from "@/api/project";

const projectStore = useProjectStoreHook();
const router = useRouter();
const appStore = useAppStoreHook();

const searchKeyword = ref("");
const statusFilter = ref<string>("");
const viewMode = ref<"card" | "table">("card");
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

// 根据设备类型决定下拉菜单的触发方式
const dropdownTrigger = computed(() => {
  // 使用响应式窗口宽度判断
  const isMobile = windowWidth.value <= 640;
  return isMobile ? "click" : "hover";
});

const selectedProject = ref<Project | null>(null);
const editingProject = ref<Project | null>(null);
const showProjectDialog = ref(false);
const showMembersDialog = ref(false);

// 项目列表
const projects = ref<Project[]>([]);
const totalProjects = ref(0);

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
      creator: "",
      state: statusFilter.value ? getStateForApi(statusFilter.value) : "",
      page: currentPage.value,
      page_size: pageSize.value
    };

    const response = await selectProjects(params);

    if (response.code === 200) {
      // 获取返回的数据（可能是 result 或 data）
      const projectList = response.result || response.data || [];

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
          总进度: item.总进度 || item.progress || 0, // 优先使用后端返回的 总进度 字段
          attachment: item.attachment || [], // 保存附件数组
          project_proposal: item.project_proposal || [], // 保存立项文件数组
          customer_name: item.customer_name || "", // 客户名称
          product_type: item.product_type || "", // 产品类型
          platform_name: item.platform_name || "", // 平台名称
          motherboard_name: item.motherboard_name || "", // 主板名称
          resolution: item.resolution || "", // 分辨率
          business_owner: item.business_owner || "", // 业务负责人
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
      totalProjects.value = projectList.length;
    } else {
      ElMessage.error(response.message || "加载项目列表失败");
      // 如果 API 失败，使用 mock 数据作为后备
      projects.value = [...mockProjects];
      totalProjects.value = mockProjects.length;
    }
  } catch (error: any) {
    console.error("加载项目列表失败:", error);
    ElMessage.error(
      error?.response?.data?.message || error?.message || "加载项目列表失败"
    );
    // 如果 API 失败，使用 mock 数据作为后备
    projects.value = [...mockProjects];
    totalProjects.value = mockProjects.length;
  } finally {
    loading.value = false;
  }
};

// 项目统计
const projectStats = computed(() => ({
  total: projects.value.length,
  active: projects.value.filter(p => p.status === "进行中").length,
  completed: projects.value.filter(p => p.status === "已完成").length,
  delayed: projects.value.filter(p => p.status === "延期").length
}));

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

// 打开项目详情（跳转到详情页）
const openProjectDetail = (project: Project, event?: Event) => {
  // 如果点击的是三个点按钮区域，不跳转
  if (event?.target) {
    const target = event.target as HTMLElement;
    if (target.closest('.more-button-wrapper') || target.closest('.more-button-trigger') || target.closest('.more-button')) {
      return;
    }
  }
  router.push({
    name: "ProjectDetail",
    params: { id: project.id }
  });
};

// 前往任务列表页，并默认选中当前项目
const goToTaskList = (project: Project) => {
  router.push({
    path: "/tasks/list",
    query: { project_id: project.id }
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

// 格式化日期范围
const formatDateRange = (startDate?: string, endDate?: string) => {
  if (!startDate || !endDate) return "-";
  return `${dayjs(startDate).format("MM-DD")} ~ ${dayjs(endDate).format("MM-DD")}`;
};


// 监听搜索和筛选变化，重新加载数据
watch(
  [searchKeyword, statusFilter, currentPage, pageSize],
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
    width: 100%;
    box-sizing: border-box;

    .progress-info {
      display: flex;
      justify-content: space-between;
      margin-bottom: 10px;
      font-size: 15px;
      color: #606266;
      font-weight: 500;
      min-width: 0; // 允许收缩
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
  :deep(.el-card__body) {
    padding: 0;
  }

  :deep(.el-table) {
    .el-table__row {
      transition: background-color 0.2s;

      &:hover {
        background-color: #f8f9fa;
      }
    }

    .el-table__cell {
      padding: 16px 12px;
    }
  }

  .project-name {
    cursor: pointer;
    transition: color 0.2s;

    h4 {
      margin: 0 0 6px 0;
      color: #303133;
      font-size: 15px;
      font-weight: 600;
      letter-spacing: -0.2px;
      transition: color 0.2s;

      &:hover {
        color: #409eff;
      }
    }

    p {
      margin: 0;
      color: #909399;
      font-size: 13px;
      display: -webkit-box;
      -webkit-line-clamp: 1;
      line-clamp: 1;
      -webkit-box-orient: vertical;
      overflow: hidden;
    }
  }

  .manager-info {
    display: flex;
    align-items: center;
    gap: 8px;

    span {
      font-size: 12px;
      color: #606266;
    }
  }

  .progress-text {
    font-size: 12px;
    color: #606266;
    margin-left: 8px;
  }

  .member-count {
    font-size: 12px;
    color: #909399;
    margin-left: 8px;
  }

  .table-avatar-group {
    display: flex;
    align-items: center;
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
  .projects-page {
    padding: 12px;
  }

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
    padding: 12px;
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
