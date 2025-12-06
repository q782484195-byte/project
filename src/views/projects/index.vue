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
      <el-col :span="8" :xs="24">
        <div class="stat-card">
          <div class="stat-number" style="color: #409eff">
            {{ projectStats.total }}
          </div>
          <div class="stat-label">总项目数</div>
        </div>
      </el-col>
      <el-col :span="8" :xs="24">
        <div class="stat-card">
          <div class="stat-number" style="color: #67c23a">
            {{ projectStats.active }}
          </div>
          <div class="stat-label">进行中</div>
        </div>
      </el-col>
      <el-col :span="8" :xs="24">
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
        @click="openProjectDetail(project)">
        <div class="card-header">
          <div class="project-info">
            <h3>{{ project.name }}</h3>
            <el-tag :type="getStatusTagType(project.status)" size="small">
              {{ getStatusText(project.status) }}
            </el-tag>
          </div>
          <el-dropdown trigger="hover" @command="handleCommand($event, project)" @click.stop>
            <el-button type="text" size="small">
              <el-icon>
                <MoreFilled />
              </el-icon>
            </el-button>
            <template #dropdown>
              <el-dropdown-menu>
                <el-dropdown-item v-if="hasPerms(['project:update'])" command="edit">编辑项目</el-dropdown-item>
                <!-- <el-dropdown-item command="members">管理成员</el-dropdown-item> -->
                <el-dropdown-item v-if="hasPerms(['project:delete'])" command="delete" divided>删除项目</el-dropdown-item>
              </el-dropdown-menu>
            </template>
          </el-dropdown>
        </div>

        <p class="project-description">{{ project.description }}</p>

        <div class="project-progress">
          <div class="progress-info">
            <span>进度</span>
          </div>
          <el-progress :percentage="getProjectProgress(project)" :stroke-width="6" />
        </div>

        <div class="project-meta">
          <div class="meta-item">
            <el-icon>
              <User />
            </el-icon>
            <span>{{ project.creator || "-" }}</span>
          </div>
          <div class="meta-item">
            <el-icon>
              <Calendar />
            </el-icon>
            <span>{{
              formatDateRange(project.startDate, project.endDate)
              }}</span>
          </div>
          <div v-if="project.members" class="meta-item">
            <el-icon>
              <UserFilled />
            </el-icon>
            <span>{{ project.members.length }}人</span>
          </div>
          <div v-if="project.budget" class="meta-item">
            <el-icon>
              <Money />
            </el-icon>
            <span>¥{{ formatBudget(project.budget) }}</span>
          </div>
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
import { ref, computed, onMounted, watch } from "vue";
import { useRouter } from "vue-router";
import { ElMessage, ElMessageBox } from "element-plus";
import {
  Plus,
  MoreFilled,
  User,
  Calendar,
  UserFilled,
  Money,
  ArrowDown
} from "@element-plus/icons-vue";
import { hasPerms } from "@/utils/auth";
import { useProjectStoreHook } from "@/store/modules/project";
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

const searchKeyword = ref("");
const statusFilter = ref<string>("");
const viewMode = ref<"card" | "table">("card");
const currentPage = ref(1);
const pageSize = ref(20);
const loading = ref(false);

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
          description = item.describe
            .filter((d: any) => d.type === "text")
            .map((d: any) => d.content)
            .join("\n");
        }

        // 处理状态：如果 state 包含多个状态（用逗号分隔），取第一个
        let state = item.state || "进行中";
        if (state.includes(",")) {
          state = state.split(",")[0].trim();
        }

        // 处理 describe 数组，适配 API 返回格式（可能包含 type: "image" 和 url 字段）
        let processedDescribe = item.describe || [];
        if (Array.isArray(processedDescribe)) {
          processedDescribe = processedDescribe.map((d: any) => {
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
            return d;
          });
        }

        return {
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
          createdAt:
            item.create_time ||
            item.created_at ||
            item.createdAt ||
            new Date().toISOString(),
          updatedAt:
            item.updated_at || item.updatedAt || new Date().toISOString()
        } as Project;
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
  completed: projects.value.filter(p => p.status === "已完成").length
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
const openProjectDetail = (project: Project) => {
  router.push({
    name: "ProjectDetail",
    params: { id: project.id }
  });
};

// 处理命令
const handleCommand = async (command: string, project: Project) => {
  selectedProject.value = project;

  switch (command) {
    case "edit":
      editProject(project);
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
): "success" | "primary" | "info" | "warning" | undefined => {
  const typeMap: Record<string, "success" | "primary" | "info" | "warning"> = {
    未开始: "warning",
    进行中: "success",
    已完成: "primary"
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

// 格式化预算
const formatBudget = (budget: number) => {
  return (budget / 10000).toFixed(1) + "w";
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
  padding: 24px;
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
  overflow: hidden;

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
    align-items: flex-start;
    margin-bottom: 16px;
    padding-bottom: 16px;
    border-bottom: 1px solid rgba(0, 0, 0, 0.06);

    .project-info {
      flex: 1;

      h3 {
        margin: 0 0 10px 0;
        color: #303133;
        font-size: 18px;
        font-weight: 600;
        letter-spacing: -0.3px;
        line-height: 1.4;
      }
    }
  }

  .project-description {
    color: #606266;
    font-size: 14px;
    line-height: 1.6;
    margin: 16px 0;
    display: -webkit-box;
    -webkit-line-clamp: 2;
    line-clamp: 2;
    -webkit-box-orient: vertical;
    overflow: hidden;
  }

  .project-progress {
    margin: 20px 0;
    padding: 16px;
    background: #f8f9fa;
    border-radius: 8px;

    .progress-info {
      display: flex;
      justify-content: space-between;
      margin-bottom: 10px;
      font-size: 13px;
      color: #606266;
      font-weight: 500;
    }
  }

  .project-meta {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 12px;
    margin: 20px 0;
    padding-top: 16px;
    border-top: 1px solid rgba(0, 0, 0, 0.06);

    .meta-item {
      display: flex;
      align-items: center;
      gap: 8px;
      font-size: 13px;
      color: #606266;

      .el-icon {
        font-size: 16px;
        color: #909399;
      }
    }
  }

  .project-members {
    display: flex;
    justify-content: flex-end;
    margin-top: 16px;
    padding-top: 16px;
    border-top: 1px solid rgba(0, 0, 0, 0.06);
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

    .header-actions {
      justify-content: space-between;
      flex-wrap: wrap;
      gap: 8px;
    }
  }

  .projects-grid {
    grid-template-columns: 1fr;
    gap: 16px;
  }

  .project-card {
    padding: 16px;
  }
}
</style>
