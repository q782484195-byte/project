<template>
  <div class="requirements-page" ref="pageRef">
    <div class="page-header">
      <h2>层级管理</h2>
      <div class="header-actions">
        <el-select v-model="selectedProjectId" placeholder="选择项目" clearable style="width: 180px"
          @change="handleProjectChange">
          <el-option v-for="project in projects" :key="project.id" :label="project.name" :value="project.id" />
        </el-select>
        <el-select v-model="searchRequirementId" placeholder="选择层级" filterable clearable style="width: 220px"
          @change="handleRequirementSelectChange" @clear="handleRequirementSelectChange">
          <el-option v-for="option in requirementOptions" :key="option.value" :label="option.label"
            :value="option.value" />
        </el-select>
        <el-select v-model="statusFilter" placeholder="状态筛选" clearable style="width: 120px">
          <el-option label="草稿" value="草稿" />
          <el-option label="进行中" value="进行中" />
          <el-option label="已完成" value="已完成" />
          <el-option label="已取消" value="已取消" />
        </el-select>
        <el-button type="primary" @click="handleCreate" v-perms="['requirement:add']">
          <el-icon>
            <Plus />
          </el-icon>
          新建层级
        </el-button>
      </div>
    </div>

    <!-- 层级列表 -->
    <el-card v-loading="loading" class="requirements-table-card" ref="requirementsCardRef">
      <el-table :data="filteredRequirements" :style="{ width: '100%' }" :height="tableHeight">
        <el-table-column prop="requirement_name" label="层级名称" min-width="200" />
        <el-table-column prop="project_name" label="选择项目" width="150" />
        <el-table-column prop="priority" label="优先级" width="100">
          <template #default="{ row }">
            <el-tag :type="getPriorityType(row.priority) || undefined" size="small">
              {{ row.priority || "-" }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="priority" label="优先级" width="150">
          <template #default="{ row }">
            <el-select v-model="row.priority" size="small" style="width: 120px" placeholder="选择优先级"
              @change="handlePriorityChange(row)">
              <el-option label="低" value="低" />
              <el-option label="中" value="中" />
              <el-option label="高" value="高" />
              <el-option label="紧急" value="紧急" />
            </el-select>
          </template>
        </el-table-column>
        <el-table-column prop="status" label="状态" width="150">
          <template #default="{ row }">
            <el-select v-model="row.status" size="small" style="width: 100px" @change="handleStatusChange(row)">
              <el-option label="草稿" value="草稿" />
              <el-option label="进行中" value="进行中" />
              <el-option label="已完成" value="已完成" />
              <el-option label="已取消" value="已取消" />
            </el-select>
          </template>
        </el-table-column>
        <el-table-column prop="create_time" label="创建时间" width="180" />
        <el-table-column label="操作" width="150" fixed="right">
          <template #default="{ row }">
            <el-button type="primary" link size="small" @click="handleView(row)">查看</el-button>
            <el-button type="primary" link size="small" @click="handleEdit(row)"
              v-perms="['requirement:update']">编辑</el-button>
            <!-- <el-button type="danger" link size="small" @click="handleDelete(row)">删除</el-button> -->
          </template>
        </el-table-column>
      </el-table>
    </el-card>

    <div class="pagination">
      <el-pagination v-model:current-page="currentPage" v-model:page-size="pageSize" :page-sizes="[10, 20, 50, 100]"
        :total="totalRequirements" layout="total, sizes, prev, pager, next, jumper" />
    </div>

    <!-- 新建/编辑层级抽屉 -->
    <RequirementDrawer v-model:visible="showRequirementDrawer" :project-id="currentProjectId"
      :project-name="currentProjectName" :requirement="currentRequirement" @refresh="handleRequirementRefresh" />
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted, watch, nextTick } from "vue";
import { useRouter, useRoute } from "vue-router";
import { ElMessage, ElMessageBox, ElCard } from "element-plus";
import { Plus } from "@element-plus/icons-vue";
import {
  selectRequirements,
  selectProjects,
  updateRequirementState,
  updateRequirement,
  flattenRequirementData,
  type SelectRequirementParams,
  type RequirementListItem,
  type ProjectListItem
} from "@/api/project";
import type { Requirement, Project } from "@/types";
import { RequirementStatus, type RequirementPriority } from "@/types";
import RequirementDrawer from "@/components/RequirementDrawer.vue";
import { storageLocal } from "@pureadmin/utils";

const router = useRouter();
const route = useRoute();

const statusFilter = ref<string>("");
const searchRequirementId = ref("");
const currentPage = ref(1);
const pageSize = ref(20);
const loading = ref(false);
const projectsLoading = ref(false);

const requirements = ref<any[]>([]);
const totalRequirements = ref(0);
const projects = ref<Project[]>([]);
const selectedProjectId = ref<string>("");
const showRequirementDrawer = ref(false);
const currentRequirement = ref<Requirement | null>(null);
const requirementOptions = ref<Array<{ label: string; value: string }>>([]);
const hasOpenedCreateDrawer = ref(false); // 标志，用于避免重复打开新建抽屉

// 表格高度相关
const pageRef = ref<HTMLElement>();
const requirementsCardRef = ref<InstanceType<typeof ElCard>>();
const tableHeight = ref<number>(680);

// 缓存键名
const CACHE_KEY = "requirements-list-params";

// 保存参数到缓存
const saveParamsToCache = () => {
  const params = {
    selectedProjectId: selectedProjectId.value,
    searchRequirementId: searchRequirementId.value,
    statusFilter: statusFilter.value,
    currentPage: currentPage.value,
    pageSize: pageSize.value
  };
  storageLocal().setItem(CACHE_KEY, params);
};

// 从缓存恢复参数
const restoreParamsFromCache = () => {
  const cached = storageLocal().getItem<{
    selectedProjectId?: string;
    searchRequirementId?: string;
    statusFilter?: string;
    currentPage?: number;
    pageSize?: number;
  }>(CACHE_KEY);
  if (cached) {
    if (cached.selectedProjectId) selectedProjectId.value = cached.selectedProjectId;
    if (cached.searchRequirementId) searchRequirementId.value = cached.searchRequirementId;
    if (cached.statusFilter) statusFilter.value = cached.statusFilter;
    if (cached.currentPage) currentPage.value = cached.currentPage;
    if (cached.pageSize) pageSize.value = cached.pageSize;
  }
};

// 当前使用的项目ID（用于加载需求）
const projectId = computed(() => selectedProjectId.value);

// 当前选中的项目信息（用于传递给 RequirementDrawer）
const currentProjectId = computed(() => selectedProjectId.value);
const currentProjectName = computed(() => {
  const project = projects.value.find(p => p.id === selectedProjectId.value);
  return project?.name || (route.query.project_name as string) || "";
});

// 过滤后的层级列表
const filteredRequirements = computed(() => {
  let result = requirements.value;
  if (statusFilter.value) {
    result = result.filter(r => r.status === statusFilter.value);
  }
  return result;
});

// 将状态字符串映射到 RequirementStatus
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
const mapPriority = (priority: string): RequirementPriority | "" => {
  if (!priority || priority.trim() === "") {
    return ""; // 如果优先级为空，返回空字符串而不是默认值
  }
  const priorityMap: Record<string, RequirementPriority> = {
    低: "low",
    中: "medium",
    高: "high",
    紧急: "urgent"
  };
  if (["low", "medium", "high", "urgent"].includes(priority.toLowerCase())) {
    return priority.toLowerCase() as RequirementPriority;
  }
  return priorityMap[priority] || "";
};

// 从 describe 数组中提取文本内容作为 description
const extractDescription = (describe: any[]): string => {
  if (!describe || describe.length === 0) {
    return "";
  }
  if (typeof describe[0] === "object" && "type" in describe[0]) {
    return describe
      .filter((item: any) => item.type === "text")
      .map((item: any) => item.content)
      .join("\n");
  }
  return describe.join("\n");
};

// 获取优先级类型
const getPriorityType = (
  priority: string
): "success" | "info" | "warning" | "danger" | undefined => {
  const map: Record<string, "success" | "info" | "warning" | "danger"> = {
    低: "info", // 蓝色
    中: "warning", // 黄色
    高: "danger", // 红色
    紧急: "danger"
  };
  return map[priority] || undefined;
};

// 获取状态类型
const getStatusType = (
  status: string
): "success" | "info" | "warning" | "danger" | undefined => {
  const map: Record<string, "success" | "info" | "warning" | "danger"> = {
    草稿: "info", // 蓝色
    进行中: "warning", // 黄色
    已完成: "success", // 绿色
    已取消: "danger" // 红色
  };
  return map[status] || undefined;
};

// 加载项目列表
const loadProjects = async () => {
  projectsLoading.value = true;
  try {
    const response = await selectProjects({
      page: 1,
      page_size: 100 // 获取所有项目
    });

    if (response.code === 200 && response.result) {
      projects.value = response.result.map((item: ProjectListItem): Project => {
        return {
          id: item._id,
          name: item.project_name,
          status: item.state as any,
          startDate: item.plant_start_time,
          endDate: item.plant_end_time,
          creator: item.creator,
          createdAt: item.create_time
        };
      });

      // 如果路由有项目ID，使用路由的；否则从缓存恢复或选择第一个项目
      const routeProjectId = route.query.project_id as string | undefined;
      if (routeProjectId && projects.value.some(p => p.id === routeProjectId)) {
        selectedProjectId.value = routeProjectId;
        saveParamsToCache(); // 保存路由参数到缓存
      } else if (projects.value.length > 0 && !selectedProjectId.value) {
        // 如果没有路由参数且没有缓存，选择第一个项目
        selectedProjectId.value = projects.value[0].id;
        saveParamsToCache();
      }

      // 如果路由有 create 参数且项目已选择，尝试打开新建抽屉
      const createParam = route.query.create;
      const shouldCreate = createParam === "true" || (Array.isArray(createParam) && createParam.includes("true"));
      if (shouldCreate && selectedProjectId.value && !hasOpenedCreateDrawer.value) {
        hasOpenedCreateDrawer.value = true;
        // 使用 nextTick 确保在下一个 tick 打开
        nextTick(() => {
          currentRequirement.value = null;
          showRequirementDrawer.value = true;
          // 清除 query 参数，避免刷新时重复打开
        });
      }
    } else {
      ElMessage.error(response.message || "加载项目列表失败");
      projects.value = [];
    }
  } catch (error: any) {
    console.error("加载项目列表失败:", error);
    ElMessage.error(
      error?.response?.data?.message || error?.message || "加载项目列表失败"
    );
    projects.value = [];
  } finally {
    projectsLoading.value = false;
  }
};

// 加载层级列表
const loadRequirements = async () => {
  loading.value = true;
  try {
    const params: SelectRequirementParams & { requirement_id?: string } = {
      project_id: projectId.value || "",
      page: currentPage.value,
      page_size: pageSize.value
    };
    if (searchRequirementId.value && searchRequirementId.value.trim() !== "") {
      params.requirement_id = searchRequirementId.value.trim();
    }
    const response = await selectRequirements(params);

    if (response.code === 200 && response.result) {
      // 扁平化嵌套对象结构为数组
      const flattenedResult = flattenRequirementData(response.result);

      // 将 API 返回的数据映射到前端需要的格式
      requirements.value = flattenedResult.map(
        (item: RequirementListItem): any => {
          // 从API返回的数据中获取项目名称，如果没有则从项目列表中查找
          let projectName = item.project_name || "";
          if (!projectName && item.project_id) {
            const project = projects.value.find(p => p.id === item.project_id);
            projectName = project?.name || "";
          }

          return {
            id: item._id,
            requirement_name: item.需求名,
            project_id: item.project_id,
            project_name: projectName,
            status: item.状态,
            priority: item.优先级,
            description: extractDescription(item.describe),
            describe: item.describe || [], // 保留完整的 describe 数组，用于编辑
            creator: item.creator,
            create_time: item.create_time,
            attachment: item.attachment || []
          };
        }
      );

      // 更新总数（使用 total_count，如果没有则使用扁平化后的数组长度）
      totalRequirements.value = response.total_count ?? flattenedResult.length;
    } else {
      ElMessage.error(response.message || "加载层级列表失败");
      requirements.value = [];
      totalRequirements.value = 0;
    }
  } catch (error: any) {
    console.error("加载层级列表失败:", error);
    ElMessage.error(
      error?.response?.data?.message || error?.message || "加载层级列表失败"
    );
    requirements.value = [];
    totalRequirements.value = 0;
  } finally {
    loading.value = false;
  }
};

// 加载需求选项（用于需求 ID 下拉）
const loadRequirementOptions = async () => {
  try {
    const response = await selectRequirements({
      project_id: projectId.value || "",
      page: 1,
      page_size: 100
    });
    if (response.code === 200 && response.result) {
      // 扁平化嵌套对象结构为数组
      const flattenedResult = flattenRequirementData(response.result);
      requirementOptions.value = flattenedResult.map(item => ({
        label: item.需求名 || item._id,
        value: item._id
      }));
    } else {
      requirementOptions.value = [];
    }
  } catch (error) {
    console.error("加载需求选项失败:", error);
    requirementOptions.value = [];
  }
};

// 处理项目选择变化
const handleProjectChange = () => {
  currentPage.value = 1; // 重置到第一页
  saveParamsToCache(); // 保存到缓存
  loadRequirementOptions();
  loadRequirements();
};

// 新建层级
const handleCreate = () => {
  // 检查是否已选择项目
  if (!selectedProjectId.value) {
    ElMessage.warning("请先选择项目");
    return;
  }
  currentRequirement.value = null;
  showRequirementDrawer.value = true;
};

// 处理需求刷新
const handleRequirementRefresh = () => {
  loadRequirements();
};

const handleRequirementSelectChange = () => {
  currentPage.value = 1;
  saveParamsToCache(); // 保存到缓存
  loadRequirements();
};

// 查看需求
const handleView = (requirement: any) => {
  router.push({
    name: "RequirementDetail",
    params: { id: requirement.id || requirement._id },
    query: {
      project_id: requirement.project_id,
      project_name: requirement.project_name || currentProjectName.value
    }
  });
};

// 编辑层级
const handleEdit = (requirement: any) => {
  // 将需求数据转换为 Requirement 类型，并保留原始数据用于编辑
  currentRequirement.value = {
    id: requirement.id,
    title: requirement.requirement_name,
    description: requirement.description,
    status: mapStatusToEnum(requirement.status),
    priority: mapPriority(requirement.priority),
    projectId: requirement.project_id,
    creatorId: requirement.creator,
    createdAt: requirement.create_time,
    // 保留原始数据，用于编辑
    describe: requirement.describe || [],
    attachment: requirement.attachment || []
  } as Requirement & { describe?: any[]; attachment?: string[] };
  showRequirementDrawer.value = true;
};

// 处理状态切换
const handleStatusChange = async (requirement: any) => {
  try {
    const response = await updateRequirementState({
      requirement_id: requirement.id,
      state: requirement.status
    });

    if (response.code === 200) {
      ElMessage.success("状态更新成功");
      // 刷新列表
      loadRequirements();
    } else {
      // 如果更新失败，恢复原状态
      ElMessage.error(response.message || "状态更新失败");
      loadRequirements();
    }
  } catch (error: any) {
    console.error("更新状态失败:", error);
    ElMessage.error(
      error?.response?.data?.message || error?.message || "状态更新失败"
    );
    // 恢复原状态
    loadRequirements();
  }
};

const handlePriorityChange = async (requirement: any) => {
  try {
    const describeList = Array.isArray(requirement.describe)
      ? requirement.describe.map((item: any) => {
        if (typeof item === "string") return item;
        if (item && typeof item === "object") {
          if ("content" in item && typeof item.content === "string") {
            return item.content;
          }
          if ("url" in item && typeof item.url === "string") {
            return item.url;
          }
        }
        return "";
      }).filter(Boolean)
      : [];

    const response = await updateRequirement({
      requirement_id: requirement.id,
      requirement_name: requirement.requirement_name,
      priority: requirement.priority || "",
      describe: describeList,
      attachment: requirement.attachment || []
    });

    if (response.code === 200) {
      ElMessage.success("优先级更新成功");
      loadRequirements();
    } else {
      ElMessage.error(response.message || "优先级更新失败");
      loadRequirements();
    }
  } catch (error: any) {
    console.error("更新优先级失败:", error);
    ElMessage.error(
      error?.response?.data?.message || error?.message || "优先级更新失败"
    );
    loadRequirements();
  }
};

// 删除需求
const handleDelete = async (requirement: any) => {
  try {
    await ElMessageBox.confirm("确定要删除该需求吗？", "提示", {
      confirmButtonText: "确定",
      cancelButtonText: "取消",
      type: "warning"
    });
    // TODO: 调用删除 API
    ElMessage.success("删除成功");
    loadRequirements();
  } catch {
    // 用户取消
  }
};

// 监听分页变化
watch([() => currentPage.value, () => pageSize.value], () => {
  saveParamsToCache(); // 保存到缓存
  if (projectId.value) {
    loadRequirements();
  }
});

// 监听状态筛选变化
watch(
  () => statusFilter.value,
  () => {
    saveParamsToCache(); // 保存到缓存
  }
);

// 监听项目ID变化，自动加载层级列表
watch(
  () => selectedProjectId.value,
  () => {
    saveParamsToCache(); // 保存到缓存
    if (selectedProjectId.value) {
      currentPage.value = 1; // 重置到第一页
      loadRequirementOptions();
      loadRequirements();
    } else {
      requirements.value = [];
      totalRequirements.value = 0;
    }
  }
);

// 监听路由项目ID变化，更新选中的项目
watch(
  () => route.query.project_id,
  newProjectId => {
    if (
      newProjectId &&
      projects.value.length > 0 &&
      projects.value.some(p => p.id === newProjectId)
    ) {
      selectedProjectId.value = newProjectId as string;
      saveParamsToCache(); // 保存到缓存
    }
  }
);

// 监听路由需求ID变化
watch(
  () => route.query.requirement_id,
  newRequirementId => {
    if (typeof newRequirementId === "string" && newRequirementId) {
      searchRequirementId.value = newRequirementId;
      currentPage.value = 1;
      saveParamsToCache(); // 保存到缓存
      loadRequirements();
    }
  }
);

// 监听 create 参数和项目选择，自动打开新建模态框
watch(
  [() => route.query.create, () => selectedProjectId.value],
  ([createParam, projectId]) => {
    const shouldCreate = createParam === "true" || (Array.isArray(createParam) && createParam.includes("true"));
    // 如果 create 参数存在且项目已选择，且还没有打开过，则打开抽屉
    if (shouldCreate && projectId && !hasOpenedCreateDrawer.value) {
      hasOpenedCreateDrawer.value = true;
      nextTick(() => {
        currentRequirement.value = null;
        showRequirementDrawer.value = true;
        // 清除 query 参数，避免刷新时重复打开
      });
    }
  },
  { immediate: false }
);

// 计算表格高度
const calculateTableHeight = () => {
  nextTick(() => {
    if (!requirementsCardRef.value || !requirementsCardRef.value.$el) return;

    const viewportHeight = window.innerHeight;
    const cardRect = requirementsCardRef.value.$el.getBoundingClientRect();
    const cardTopToViewportBottom = viewportHeight - cardRect.top;
    const cardHeaderHeight = 0; // card没有header
    const cardPadding = 40;
    const paginationHeight = 60;
    const bottomPadding = 20;
    const availableHeight = cardTopToViewportBottom - cardHeaderHeight - cardPadding - paginationHeight - bottomPadding;
    tableHeight.value = Math.max(400, availableHeight);
  });
};

// 窗口大小改变时重新计算
const handleResize = () => {
  calculateTableHeight();
};

onMounted(async () => {
  // 先加载项目列表
  await loadProjects();

  // 优先使用路由参数，如果没有则从缓存恢复
  const routeProjectId = route.query.project_id as string | undefined;
  const routeRequirementId = route.query.requirement_id as string | undefined;

  if (routeProjectId) {
    // 如果有路由参数，使用路由参数
    if (projects.value.some(p => p.id === routeProjectId)) {
      selectedProjectId.value = routeProjectId;
    }
  } else {
    // 如果没有路由参数，从缓存恢复
    restoreParamsFromCache();
  }

  if (routeRequirementId) {
    searchRequirementId.value = routeRequirementId;
  }

  // 保存当前参数到缓存（包括路由参数）
  saveParamsToCache();

  await loadRequirementOptions();
  // 项目列表加载完成后，会自动设置selectedProjectId，然后加载层级列表
  if (projectId.value) {
    loadRequirements();
  }

  // 检查是否需要自动打开新建模态框（在项目加载完成后检查）
  const createParam = route.query.create;
  const shouldCreate = createParam === "true" || (Array.isArray(createParam) && createParam.includes("true"));
  if (shouldCreate && selectedProjectId.value && !hasOpenedCreateDrawer.value) {
    hasOpenedCreateDrawer.value = true;
    // 延迟一下，确保所有响应式更新完成
    await nextTick();
    currentRequirement.value = null;
    showRequirementDrawer.value = true;
    // 清除 query 参数，避免刷新时重复打开

  }
  // 如果项目还未选择，watch 会在项目选择后自动处理

  // 计算表格高度
  calculateTableHeight();
  window.addEventListener('resize', handleResize);
});

onUnmounted(() => {
  window.removeEventListener('resize', handleResize);
});
</script>

<style scoped lang="scss">
.requirements-page {
  .page-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 20px;

    h2 {
      margin: 0;
      font-size: 24px;
      font-weight: 600;
    }

    .header-actions {
      display: flex;
      gap: 12px;
      align-items: center;
    }
  }

  .pagination {
    margin-top: 20px;
    display: flex;
    justify-content: flex-end;
  }
}

// 移动端适配 (640px)
@media (max-width: 640px) {
  .requirements-page {
    padding: 12px;

    .page-header {
      flex-direction: column;
      align-items: flex-start;
      gap: 12px;
      margin-bottom: 16px;

      h2 {
        font-size: 18px;
      }

      .header-actions {
        width: 100%;
        flex-direction: column;
        gap: 8px;

        .el-select,
        .el-button {
          width: 100% !important;
        }
      }
    }

    .requirements-table-card {
      :deep(.el-card__body) {
        padding: 12px;
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
