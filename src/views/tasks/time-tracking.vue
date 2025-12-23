<template>
  <div class="time-tracking-page">
    <!-- 查询表单 -->
    <el-card class="search-card mb-20">
      <el-form :model="searchForm" :inline="true" class="search-form">
        <el-form-item label="项目">
          <el-select v-model="searchForm.project_id" placeholder="请选择项目" clearable filterable style="width: 300px"
            :loading="projectsLoading" @change="handleProjectChange">
            <el-option v-for="project in projectOptions" :key="project.id" :label="project.name" :value="project.id" />
          </el-select>
        </el-form-item>
        <el-form-item label="天数">
          <el-input-number v-model="searchForm.day" :min="1" :max="365" placeholder="请输入天数" style="width: 200px" />
        </el-form-item>
        <el-form-item>
          <el-button type="primary" @click="handleSearch" :loading="loading">
            <el-icon>
              <Search />
            </el-icon>
            查询
          </el-button>
          <el-button @click="handleReset">重置</el-button>
        </el-form-item>
      </el-form>
    </el-card>

    <!-- 结果展示 -->
    <el-card v-loading="loading" class="result-card">
      <template #header>
        <div class="card-header">
          <span>工时统计结果</span>
        </div>
      </template>
      <div v-if="tableData.length > 0" class="result-container">
        <el-table :data="tableData" border stripe style="width: 100%" height="100%">
          <el-table-column v-for="(header, index) in tableHeaders" :key="index" :prop="`col_${index}`" :label="header"
            :min-width="index === 0 ? 200 : 120" :fixed="index === 0 ? 'left' : false" show-overflow-tooltip>
            <template #default="{ row }">
              <div v-if="row[`col_${index}`]" class="cell-content">
                <template v-if="hasMultipleValues(row[`col_${index}`])">
                  <div v-for="(item, idx) in splitValue(row[`col_${index}`])" :key="idx" class="cell-item">
                    {{ item }}
                  </div>
                </template>
                <span v-else>{{ row[`col_${index}`] }}</span>
              </div>
              <span v-else style="color: #c0c4cc;">-</span>
            </template>
          </el-table-column>
        </el-table>
      </div>
      <div v-else class="empty-container">
        <el-empty description="暂无数据，请先查询" />
      </div>
    </el-card>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from "vue";
import { ElMessage } from "element-plus";
import { Search } from "@element-plus/icons-vue";
import {
  timeTracking as timeTrackingApi,
  selectProjects,
  type TimeTrackingParams
} from "@/api/project";

defineOptions({
  name: "TimeTracking"
});

// 搜索表单
const searchForm = ref({
  project_id: "",
  day: 5
});

const loading = ref(false);
const projectsLoading = ref(false);
const timeTrackingData = ref<Record<string, any>>({});

// 表头数据
const tableHeaders = ref<string[]>([]);

// 表格数据
const tableData = ref<Array<Record<string, any>>>([]);

// 项目列表
const projects = ref<Array<{ id: string; name: string }>>([]);

// 项目选项
const projectOptions = computed(() => {
  return projects.value;
});

// 项目选择
const handleProjectChange = (value: string) => {
  searchForm.value.project_id = value;
  loadTimeTracking();
};

// 加载项目列表
const loadProjects = async () => {
  projectsLoading.value = true;
  try {
    const response = await selectProjects({
      page: 1,
      page_size: 1000 // 获取所有项目
    });

    if (response.code === 200 && response.result) {
      projects.value = response.result.map((item: any) => ({
        id: item._id,
        name: item.project_name
      }));
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

// 加载时间追踪数据
const loadTimeTracking = async () => {
  if (!searchForm.value.project_id) {
    ElMessage.warning("请选择项目");
    return;
  }

  if (!searchForm.value.day || searchForm.value.day < 1) {
    ElMessage.warning("请输入有效的天数");
    return;
  }

  loading.value = true;
  try {
    const params: TimeTrackingParams = {
      project_id: searchForm.value.project_id,
      day: searchForm.value.day
    };

    const res = await timeTrackingApi(params);
    if (res.code === 200) {
      // 处理返回的数据，可能是 data 或 result
      timeTrackingData.value = res.data || res.result || {};

      // 处理表格数据
      processTableData(timeTrackingData.value);

      if (tableData.value.length === 0) {
        ElMessage.info("查询成功，但暂无数据");
      } else {
        ElMessage.success("查询成功");
      }
    } else {
      ElMessage.error(res.message || "查询失败");
      timeTrackingData.value = {};
      tableHeaders.value = [];
      tableData.value = [];
    }
  } catch (error: any) {
    console.error("查询时间追踪失败:", error);
    ElMessage.error(
      error?.response?.data?.message || error?.message || "查询失败"
    );
    timeTrackingData.value = {};
    tableHeaders.value = [];
    tableData.value = [];
  } finally {
    loading.value = false;
  }
};

// 处理表格数据
const processTableData = (data: Record<string, any>) => {
  // 提取表头
  if (data["#head#"] && Array.isArray(data["#head#"])) {
    tableHeaders.value = data["#head#"];
  } else {
    tableHeaders.value = [];
    tableData.value = [];
    return;
  }

  // 处理表格行数据
  tableData.value = [];
  Object.keys(data).forEach(key => {
    if (key !== "#head#" && Array.isArray(data[key])) {
      const row: Record<string, any> = {};
      data[key].forEach((value: any, index: number) => {
        row[`col_${index}`] = value;
      });
      // 添加任务ID作为唯一标识
      row._id = key;
      tableData.value.push(row);
    }
  });
};

// 搜索
const handleSearch = () => {
  loadTimeTracking();
};

// 重置
const handleReset = () => {
  searchForm.value = {
    project_id: "",
    day: 5
  };
  timeTrackingData.value = {};
  tableHeaders.value = [];
  tableData.value = [];
};

// 检查是否包含多个值（逗号分隔）
const hasMultipleValues = (value: any): boolean => {
  if (typeof value !== "string") return false;
  return value.includes(",");
};

// 分割逗号分隔的值
const splitValue = (value: any): string[] => {
  if (typeof value !== "string") return [String(value)];
  return value.split(",").map(item => item.trim()).filter(item => item);
};

onMounted(() => {
  loadProjects();
});
</script>

<style scoped lang="scss">
.time-tracking-page {
  padding: 20px;
  background: #f5f7fa;
  height: calc(100vh - 160px);
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

.search-card {
  flex-shrink: 0;

  :deep(.el-card__body) {
    padding: 20px;
  }
}

.search-form {
  .el-form-item {
    margin-bottom: 0;
  }
}

.mb-20 {
  margin-bottom: 20px;
}

.result-card {
  flex: 1;
  display: flex;
  flex-direction: column;
  overflow: hidden;
  min-height: 0;

  :deep(.el-card__body) {
    flex: 1;
    display: flex;
    flex-direction: column;
    overflow: hidden;
    padding: 20px;
  }
}

.card-header {
  font-weight: 600;
  font-size: 16px;
}

.result-container {
  flex: 1;
  overflow: hidden;
  padding: 0;

  :deep(.el-table) {
    height: 100%;
  }

  :deep(.el-table__body-wrapper) {
    max-height: 100%;
    overflow-y: auto;
  }
}

.cell-content {
  padding: 4px 0;

  .cell-item {
    padding: 2px 0;
    line-height: 1.6;
    word-break: break-word;

    &:not(:last-child) {
      margin-bottom: 4px;
      border-bottom: 1px solid #f0f0f0;
      padding-bottom: 4px;
    }
  }
}

.empty-container {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
}
</style>
