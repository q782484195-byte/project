<template>
  <div class="my-tasks-page" ref="pageRef">
    <!-- 搜索表单 -->
    <el-card class="search-card mb-20">
      <el-form :model="searchForm" :inline="true" class="search-form">
        <el-form-item label="关键词">
          <el-input v-model="searchForm.keyword" placeholder="搜索任务名称、层级名称..." clearable style="width: 250px"
            prefix-icon="Search" />
        </el-form-item>
        <el-form-item label="状态">
          <el-select v-model="searchForm.status" placeholder="全部状态" clearable style="width: 180px">
            <el-option label="待分配给部门主管" :value="TaskStatus.PENDING_ASSIGN_TO_DEPT_LEADER" />
            <el-option label="待指派给成员" :value="TaskStatus.PENDING_ASSIGN_TO_MEMBER" />
            <el-option label="任务未开始" :value="TaskStatus.NOT_STARTED" />
            <el-option label="任务进行中" :value="TaskStatus.IN_PROGRESS" />
            <el-option label="待测试" :value="TaskStatus.PENDING_TEST" />
            <el-option label="测试中" :value="TaskStatus.TESTING" />
            <el-option label="测试完毕" :value="TaskStatus.TEST_COMPLETED" />
            <el-option label="待审阅" :value="TaskStatus.PENDING_REVIEW" />
            <el-option label="审阅中" :value="TaskStatus.REVIEWING" />
            <el-option label="审阅完毕" :value="TaskStatus.REVIEW_COMPLETED" />
            <el-option label="已取消" :value="TaskStatus.CANCELLED" />
            <el-option label="已完成" :value="TaskStatus.COMPLETED" />
          </el-select>
        </el-form-item>
        <el-form-item label="优先级">
          <el-select v-model="searchForm.priority" placeholder="全部优先级" clearable style="width: 120px">
            <el-option label="低" value="低" />
            <el-option label="中" value="中" />
            <el-option label="高" value="高" />
          </el-select>
        </el-form-item>
        <el-form-item>
          <el-button type="primary" @click="handleSearch">
            <el-icon>
              <Search />
            </el-icon>
            搜索
          </el-button>
          <el-button @click="handleReset">重置</el-button>
        </el-form-item>
      </el-form>
    </el-card>

    <!-- 任务表格 -->
    <el-card v-loading="loading" ref="tasksCardRef">
      <el-table :data="filteredTasks" style="width: 100%" :height="tableHeight">
        <el-table-column prop="任务名" label="任务名称" min-width="200">
          <template #default="{ row }">
            <el-link type="primary" :underline="false" @click="handleView(row)">
              {{ row.任务名 || row.task_name || row.title || "-" }}
            </el-link>
          </template>
        </el-table-column>
        <el-table-column prop="requirement_name" label="关联层级" width="200" />
        <el-table-column prop="优先级" label="优先级" width="100">
          <template #default="{ row }">
            <el-tag :type="getPriorityType(row.优先级 || row.priority) || undefined" size="small">
              {{ row.优先级 || row.priority || "-" }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="状态" label="状态" width="150">
          <template #default="{ row }">
            <el-tag :type="getStatusType(row.状态 || row.status) || undefined" size="small">
              {{ row.状态 || row.status || "-" }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="预计工时" label="计划工时" width="100">
          <template #default="{ row }">
            {{ row.预计工时 || row.estimated_time || "-" }} 天
          </template>
        </el-table-column>
        <el-table-column prop="已用工时" label="已用工时" width="100">
          <template #default="{ row }">
            {{ row.已用工时 || row.actual_hours || "-" }} 天
          </template>
        </el-table-column>
        <el-table-column prop="进度" label="进度" width="120">
          <template #default="{ row }">
            <el-progress :percentage="row.进度 || row.progress || 0" :stroke-width="8" />
          </template>
        </el-table-column>
        <el-table-column prop="create_time" label="创建时间" width="180" />
        <el-table-column label="操作" width="120" fixed="right">
          <template #default="{ row }">
            <el-button type="primary" link size="small" @click="handleView(row)">查看</el-button>
          </template>
        </el-table-column>
      </el-table>

      <!-- 分页 -->
      <div class="pagination-container">
        <el-pagination v-model:current-page="currentPage" v-model:page-size="pageSize" :page-sizes="[10, 20, 50, 100]"
          :total="totalTasks" layout="total, sizes, prev, pager, next, jumper" @size-change="handleSizeChange"
          @current-change="handlePageChange" />
      </div>
    </el-card>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted, watch, nextTick } from "vue";
import { useRouter } from "vue-router";
import { ElMessage } from "element-plus";
import { Search } from "@element-plus/icons-vue";
import {
  selectMyTasks,
  type TaskListItem,
  type SelectMyTasksParams
} from "@/api/project";
import { TaskStatus } from "@/types";

const router = useRouter();

// 搜索表单
const searchForm = ref({
  keyword: "",
  status: "",
  priority: ""
});

const currentPage = ref(1);
const pageSize = ref(20);
const loading = ref(false);

const tasks = ref<any[]>([]);
const totalTasks = ref(0);

// 表格高度相关
const pageRef = ref<HTMLElement>();
const tasksCardRef = ref<HTMLElement>();
const tableHeight = ref<number>(650);

// 过滤后的任务列表（前端过滤：关键词和优先级）
const filteredTasks = computed(() => {
  let result = tasks.value;

  // 关键词搜索（前端过滤）
  if (searchForm.value.keyword) {
    const keyword = searchForm.value.keyword.toLowerCase();
    result = result.filter(
      t =>
        (t.任务名 || t.task_name || t.title || "")
          .toLowerCase()
          .includes(keyword) ||
        (t.requirement_name || "").toLowerCase().includes(keyword)
    );
  }

  // 优先级筛选（前端过滤）
  if (searchForm.value.priority) {
    result = result.filter(
      t => (t.优先级 || t.priority) === searchForm.value.priority
    );
  }

  // 状态筛选由后端API处理，不需要前端过滤

  return result;
});

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
  if (!priority) return undefined;
  const map: Record<string, "success" | "info" | "warning" | "danger"> = {
    低: "info",
    中: "warning",
    高: "danger",
    紧急: "danger"
  };
  return map[priority] || undefined;
};

// 加载任务列表
const loadTasks = async () => {
  loading.value = true;
  try {
    const response = await selectMyTasks({
      state: searchForm.value.status || "",
      page: currentPage.value,
      page_size: pageSize.value
    });

    if (response.code === 200 && response.result) {
      tasks.value = response.result.map((item: TaskListItem): any => {
        return {
          ...item,
          任务名: item.任务名 || item.task_name,
          状态: item.状态 || item.status,
          优先级: item.优先级 || item.priority,
          requirement_name: item.requirement_name,
          预计工时: item.预计工时 || item.estimated_time,
          已用工时: item.已用工时 || item.actual_hours,
          进度: item.进度 || item.progress,
          create_time: item.create_time
        };
      });
      totalTasks.value = response.total_count || 0;
    } else {
      ElMessage.error(response.message || "加载任务列表失败");
      tasks.value = [];
      totalTasks.value = 0;
    }
  } catch (error: any) {
    console.error("加载任务列表失败:", error);
    ElMessage.error(
      error?.response?.data?.message || error?.message || "加载任务列表失败"
    );
    tasks.value = [];
    totalTasks.value = 0;
  } finally {
    loading.value = false;
  }
};

// 搜索
const handleSearch = () => {
  currentPage.value = 1;
  loadTasks();
};

// 重置
const handleReset = () => {
  searchForm.value = {
    keyword: "",
    status: "",
    priority: ""
  };
  currentPage.value = 1;
  loadTasks();
};

// 查看任务详情
const handleView = (row: any) => {
  const taskId = row._id || row.id;
  if (taskId) {
    router.push(`/tasks/detail/${taskId}`);
  }
};

// 分页变化
const handlePageChange = (page: number) => {
  currentPage.value = page;
  loadTasks();
};

const handleSizeChange = (size: number) => {
  pageSize.value = size;
  currentPage.value = 1;
  loadTasks();
};

// 计算表格高度
const calculateTableHeight = () => {
  nextTick(() => {
    if (!tasksCardRef.value) return;

    const viewportHeight = window.innerHeight;
    const cardRect = tasksCardRef.value.getBoundingClientRect();
    const cardTopToViewportBottom = viewportHeight - cardRect.top;
    const cardHeaderHeight = 0; // 这个card没有header
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

onMounted(() => {
  loadTasks();
  calculateTableHeight();
  window.addEventListener('resize', handleResize);
});

onUnmounted(() => {
  window.removeEventListener('resize', handleResize);
});
</script>

<style lang="scss" scoped>
// 移动端适配 (640px)
@media (max-width: 640px) {
  .my-tasks-page {
    .search-card {
      margin-bottom: 12px;

      :deep(.el-card__body) {
        padding: 12px;
      }
    }

    .search-form {
      :deep(.el-form-item) {
        width: 100%;
        margin-right: 0;
        margin-bottom: 12px;
      }

      .el-input,
      .el-select {
        width: 100% !important;
      }

      .el-button {
        width: 100%;
        margin-bottom: 8px;
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

<style scoped lang="scss">
.my-tasks-page {
  background: #f5f7fa;
  min-height: calc(100vh - 200px);
}

.page-header {
  margin-bottom: 20px;

  h2 {
    margin: 0;
    font-size: 20px;
    font-weight: 600;
    color: #303133;
  }
}

.search-card {
  :deep(.el-card__body) {
    padding: 20px;
  }
}

.search-form {
  .el-form-item {
    margin-bottom: 0;
  }
}

.pagination-container {
  margin-top: 20px;
  display: flex;
  justify-content: flex-end;
}

.mb-20 {
  margin-bottom: 20px;
}
</style>
