<template>
  <div class="project-overview">
    <el-card shadow="never" class="overview-card">
      <template #header>
        <div class="card-header">
          <span class="font-medium">项目概览</span>
        </div>
      </template>

      <!-- 查询表单 -->
      <el-form :inline="!isMobile" :model="queryForm" class="query-form" :class="{ 'query-form--mobile': isMobile }">
        <el-form-item label="" :class="{ 'is-full-width': isMobile }">
          <el-button :type="queryMode === 'now' ? 'success' : 'default'" class="query-btn" @click="handleNowClick">
            当前时间
          </el-button>
        </el-form-item>
        <el-form-item label="日期" :class="{ 'is-full-width': isMobile }">
          <el-date-picker v-model="queryForm.date" type="date" placeholder="选择日期" format="YYYY/MM/DD"
            value-format="YYYY-MM-DD" class="date-picker" @change="handleDateChange" />
        </el-form-item>
      </el-form>

      <!-- 多个时间点快照 -->
      <div v-for="snapshot in snapshots" :key="snapshot.id" class="snapshot-block">
        <div v-if="snapshot.dateTime || snapshot.day" class="snapshot-meta">
          <span>统计时间：{{ snapshot.dateTime || snapshot.day }}</span>
        </div>

        <!-- 桌面端：表格 -->
        <TablePanel v-if="!isMobile" :loading="loading" @refresh="loadData">
        <el-table v-loading="loading" :data="snapshot.tableData" border stripe style="width: 100%"
          :default-expand-all="false" row-key="projectId" empty-text="暂无项目数据" :header-cell-style="{
            background: 'var(--el-table-row-hover-bg-color)',
            color: 'var(--el-text-color-primary)',
            textAlign: 'center'
          }" :cell-style="{ textAlign: 'center' }">
          <el-table-column type="expand" width="50">
            <template #default="{ row }">
              <div class="expanded-content">
                <el-table :data="[row.detailedData]" border style="width: 100%" :show-header="true" :header-cell-style="{
                  background: 'var(--el-table-row-hover-bg-color)',
                  color: 'var(--el-text-color-primary)',
                  textAlign: 'center'
                }" :cell-style="{ textAlign: 'center' }">
                  <el-table-column v-for="(header, index) in detailedHeaders" :key="index" :prop="`col_${index}`"
                    :label="header" :min-width="index === 0 ? 120 : 100" show-overflow-tooltip>
                    <template #default="{ row: detailRow }">
                      <span>{{
                        detailRow[`col_${index}`] !== undefined && detailRow[`col_${index}`] !== null
                          ? detailRow[`col_${index}`]
                          : '-'
                      }}</span>
                    </template>
                  </el-table-column>
                </el-table>
              </div>
            </template>
          </el-table-column>
          <el-table-column v-for="(header, index) in overviewHeaders" :key="index" :prop="`col_${index}`"
            :label="header" :min-width="getColumnWidth(header)" :fixed="index === 0 ? 'left' : false"
            show-overflow-tooltip>
            <template #default="{ row }">
              <span v-if="header === '项目状态'">
                <el-tag :type="getStatusTagType(row.overview[index])" size="small">
                  {{ row.overview[index] || '-' }}
                </el-tag>
              </span>
              <span v-else-if="header === '延期时间' && row.overview[index]">
                <el-tag type="danger" size="small">{{ row.overview[index] }} 天</el-tag>
              </span>
              <span v-else-if="header === '项目名' && row.projectId">
                <el-link type="primary" :underline="false" class="cell-link"
                  @click.stop="goToTaskList(row.projectId)">
                  {{
                    row.overview[index] !== undefined &&
                      row.overview[index] !== null &&
                      row.overview[index] !== ''
                      ? row.overview[index]
                      : '-'
                  }}
                </el-link>
              </span>
              <span v-else>{{
                row.overview[index] !== undefined &&
                  row.overview[index] !== null &&
                  row.overview[index] !== ''
                  ? row.overview[index]
                  : '-'
              }}</span>
            </template>
          </el-table-column>
        </el-table>
        </TablePanel>

        <!-- 移动端：卡片列表 -->
        <template v-else>
          <div v-loading="loading" class="mobile-list">
            <template v-if="snapshot.tableData.length">
              <div v-for="row in snapshot.tableData" :key="row.projectId" class="mobile-card"
                @click="toggleMobileExpand(row.projectId)">
                <div class="mobile-card__main">
                  <div class="mobile-card__title">
                    <el-link v-if="row.projectId" type="primary" :underline="false" class="cell-link"
                      @click.stop="goToTaskList(row.projectId)">
                      {{ getProjectName(row) }}
                    </el-link>
                    <span v-else>{{ getProjectName(row) }}</span>
                  </div>
                  <div class="mobile-card__meta">
                    <el-tag v-if="overviewHeaders.includes('项目状态')"
                      :type="getStatusTagType(row.overview[overviewHeaders.indexOf('项目状态')])" size="small"
                      class="mobile-card__tag">
                      {{ row.overview[overviewHeaders.indexOf('项目状态')] || '-' }}
                    </el-tag>
                    <el-tag v-if="overviewHeaders.includes('延期时间') && row.overview[overviewHeaders.indexOf('延期时间')]"
                      type="danger" size="small" class="mobile-card__tag">
                      {{ row.overview[overviewHeaders.indexOf('延期时间')] }} 天
                    </el-tag>
                  </div>
                  <span class="mobile-card__expand" :class="{ 'is-open': expandedRowId === row.projectId }">
                    <el-icon>
                      <ArrowDown />
                    </el-icon>
                  </span>
                </div>
                <div v-show="expandedRowId === row.projectId" class="mobile-card__detail">
                  <div v-for="(header, index) in overviewHeaders" :key="index" class="mobile-detail-row">
                    <span class="mobile-detail-row__label">{{ header }}</span>
                    <span class="mobile-detail-row__value">
                      <template v-if="header === '项目状态'">
                        <el-tag :type="getStatusTagType(row.overview[index])" size="small">
                          {{ row.overview[index] || '-' }}
                        </el-tag>
                      </template>
                      <template v-else-if="header === '延期时间' && row.overview[index]">
                        <el-tag type="danger" size="small">{{ row.overview[index] }} 天</el-tag>
                      </template>
                      <template v-else-if="header === '项目名' && row.projectId">
                        <el-link type="primary" :underline="false" class="cell-link"
                          @click.stop="goToTaskList(row.projectId)">
                          {{ row.overview[index] !== undefined && row.overview[index] !== null && row.overview[index]
                            !== '' ? row.overview[index] : '-' }}
                        </el-link>
                      </template>
                      <template v-else>
                        {{ row.overview[index] !== undefined && row.overview[index] !== null && row.overview[index] !==
                          '' ? row.overview[index] : '-' }}
                      </template>
                    </span>
                  </div>
                  <div class="mobile-detail-section">
                    <div class="mobile-detail-section__title">详细信息</div>
                    <div v-for="(header, index) in detailedHeaders" :key="index" class="mobile-detail-row">
                      <span class="mobile-detail-row__label">{{ header }}</span>
                      <span class="mobile-detail-row__value">
                        {{ row.detailedData && (row.detailedData[`col_${index}`] ?? '-') }}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </template>
            <el-empty v-else description="暂无项目数据" class="mobile-empty" />
          </div>
        </template>
      </div>
    </el-card>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onBeforeUnmount } from 'vue';
import { useRouter } from 'vue-router';
import { ElMessage } from 'element-plus';
import { ArrowDown } from '@element-plus/icons-vue';
import TablePanel from '@/components/TablePanel/index.vue';
import { deviceDetection } from '@pureadmin/utils';
import { selectProjectOverview, selectProjectRecord } from '@/api/project';

const router = useRouter();

const MOBILE_BREAKPOINT = 768;
const isNarrowScreen = ref(window.innerWidth <= MOBILE_BREAKPOINT);
const isMobile = computed(() => deviceDetection() || isNarrowScreen.value);

function updateNarrowScreen() {
  isNarrowScreen.value = window.innerWidth <= MOBILE_BREAKPOINT;
}


const expandedRowId = ref<string | null>(null);

function toggleMobileExpand(projectId: string) {
  expandedRowId.value = expandedRowId.value === projectId ? null : projectId;
}

const getProjectName = (row: { overview: (string | number)[] }) => {
  const idx = overviewHeaders.value.indexOf('项目名');
  if (idx >= 0 && row.overview[idx] !== undefined && row.overview[idx] !== null && row.overview[idx] !== '') {
    return String(row.overview[idx]);
  }
  return '未命名项目';
};

const goToTaskList = (projectId: string) => {
  if (!projectId) return;
  router.push({
    path: '/tasks/list',
    query: { project_id: projectId }
  });
};

interface OverviewData {
  head: {
    overview: string[];
    detailed: string[];
  };
  [key: string]: {
    overview: (string | number)[];
    detailed: (string | number)[];
  } | {
    overview: string[];
    detailed: string[];
  };
}

interface OverviewSnapshot {
  id: string;
  dateTime?: string;
  day?: string;
  tableData: any[];
}

const loading = ref(false);
const overviewHeaders = ref<string[]>([]);
const detailedHeaders = ref<string[]>([]);
const snapshots = ref<OverviewSnapshot[]>([]);

// 查询表单
const queryForm = ref<{
  date: string | null;
}>({
  date: null
});

// 查询模式：now 使用 selectProjectOverview，date 使用 selectProjectRecord
const queryMode = ref<"now" | "date">("now");

// 获取列宽
const getColumnWidth = (header: string) => {
  const widthMap: Record<string, number> = {
    '项目名': 150,
    '客户名': 120,
    '平台名': 120,
    '分辨率': 100,
    '产品类型': 120,
    '主板名称': 120,
    '项目负责人': 120,
    '业务负责人': 120,
    '项目阶段': 150,
    '项目状态': 100,
    '延期时间': 100
  };
  return widthMap[header] || 120;
};

// 获取状态标签类型
const getStatusTagType = (status?: string): "success" | "primary" | "info" | "warning" | "danger" | undefined => {
  if (!status) return undefined;
  const typeMap: Record<string, "success" | "primary" | "info" | "warning" | "danger"> = {
    '正常': 'success',
    '延期': 'danger',
    '进行中': 'success',
    '已完成': 'primary',
    '未开始': 'warning'
  };
  return typeMap[status] || undefined;
};

// 当前时间按钮：切换为 now 模式并调用 selectProjectOverview
const handleNowClick = () => {
  queryMode.value = "now";
  queryForm.value.date = null;
  loadData();
};

// 选择日期后自动查询：有日期走记录接口，无日期走概览接口
const handleDateChange = (value: string | null) => {
  if (value) {
    queryMode.value = "date";
  } else {
    queryMode.value = "now";
  }
  loadData();
};

// 将 OverviewData 转换为表格数据
const buildTableData = (data: OverviewData): any[] => {
  const rows: any[] = [];
  Object.keys(data).forEach(key => {
    if (key !== 'head' && data[key]) {
      const item = data[key];
      if (item.overview && item.detailed) {
        const detailedData: Record<string, any> = {};
        item.detailed.forEach((value, index) => {
          detailedData[`col_${index}`] = value;
        });
        rows.push({
          projectId: key,
          overview: item.overview,
          detailed: item.detailed,
          detailedData
        });
      }
    }
  });
  return rows;
};

// 加载数据（兼容两种返回格式：直接返回 project_overview，或数组包一层 { day, project_overview }）
const loadData = async () => {
  loading.value = true;
  try {
    // 根据模式选择不同接口
    let response;
    if (queryMode.value === "date" && queryForm.value.date) {
      response = await selectProjectRecord({ day: queryForm.value.date });
    } else {
      response = await selectProjectOverview();
    }

    if (response.code === 200 && response.result) {
      // 兼容两种 result 结构：
      // 1）旧格式：result 直接是 OverviewData
      // 2）新格式：result 是数组，[ { day, date_time, project_overview } ]
      snapshots.value = [];

      if (Array.isArray(response.result)) {
        const arr = response.result as any[];
        if (!arr.length) {
          overviewHeaders.value = [];
          detailedHeaders.value = [];
        } else {
          const first = arr[0]?.project_overview as OverviewData | undefined;
          if (!first || !first.head) {
            ElMessage.error('项目概览数据格式不正确');
            overviewHeaders.value = [];
            detailedHeaders.value = [];
            return;
          }
          overviewHeaders.value = first.head.overview || [];
          detailedHeaders.value = first.head.detailed || [];

          snapshots.value = arr
            .filter(item => item && item.project_overview)
            .map((item, index) => {
              const data = item.project_overview as OverviewData;
              return {
                id: `${item.date_time || item.day || index}`,
                dateTime: item.date_time,
                day: item.day,
                tableData: buildTableData(data)
              } as OverviewSnapshot;
            });
        }
      } else {
        const data = response.result as unknown as OverviewData;
        if (!data || !data.head) {
          ElMessage.error('项目概览数据格式不正确');
          overviewHeaders.value = [];
          detailedHeaders.value = [];
          return;
        }
        overviewHeaders.value = data.head.overview || [];
        detailedHeaders.value = data.head.detailed || [];
        snapshots.value = [{
          id: 'now',
          dateTime: undefined,
          day: queryForm.value.date || '',
          tableData: buildTableData(data)
        }];
      }
      ElMessage.success('加载数据成功');
    } else {
      ElMessage.error(response.message || '加载数据失败');
    }
  } catch (error: any) {
    console.error('加载项目概览数据失败:', error);
    ElMessage.error(error?.response?.data?.message || error?.message || '加载数据失败');
  } finally {
    loading.value = false;
  }
};

onMounted(() => {
  window.addEventListener('resize', updateNarrowScreen);
  loadData();
});
onBeforeUnmount(() => {
  window.removeEventListener('resize', updateNarrowScreen);
});
</script>

<style lang="scss" scoped>
.project-overview {
  .card-header {
    display: flex;
    justify-content: space-between;
    align-items: center;

    .font-medium {
      font-weight: 500;
      font-size: 16px;
    }
  }

  .query-form {
    margin-bottom: 20px;
  }

  // 快照块样式
  .snapshot-block {
    margin-bottom: 32px;

    &:last-child {
      margin-bottom: 0;
    }
  }

  // 时间标签样式
  .snapshot-meta {
    margin-bottom: 12px;
    padding: 8px 16px;
    background: linear-gradient(135deg, #f5f7fa 0%, #e9ecef 100%);
    border-left: 4px solid #409eff;
    border-radius: 4px;
    font-size: 14px;
    font-weight: 500;
    color: #303133;

    span {
      display: inline-flex;
      align-items: center;
      gap: 8px;

      &::before {
        content: '🕐';
        font-size: 14px;
      }
    }
  }

  // 主表格样式优化
  :deep(.el-table) {
    border-radius: 6px;
    overflow: hidden;

    .el-table__header-wrapper {
      .el-table__header {
        th {
          background: linear-gradient(135deg, #f8f9fa 0%, #e9ecef 100%);
          font-weight: 600;
          color: #303133;
          padding: 12px 0;
          border-bottom: 2px solid #dee2e6;
        }
      }
    }

    .el-table__body-wrapper {
      .el-table__body {
        tr {
          transition: background-color 0.2s;

          &:hover {
            background-color: #f8f9fa;
          }

          td {
            padding: 12px 0;
            border-bottom: 1px solid #e9ecef;
          }
        }
      }
    }

    .el-table__expand-column {
      .el-table__expand-icon {
        color: #409eff;
      }
    }
  }

  // 展开内容区域样式（子表格）
  .expanded-content {
    margin: 8px 0;
    padding: 12px 16px;
    background: #ecf5ff; // 浅蓝背景
    border-radius: 4px;
    border: 1px solid #d0e2ff;

    :deep(.el-table) {
      background: #ffffff;
      border-radius: 4px;
      border: 1px solid #d0e2ff;
      overflow: hidden;

      .el-table__header-wrapper {
        .el-table__header {
          th {
            background: #e3f0ff;
            font-weight: 500;
            color: #1f3b5d; // 深蓝标题文字
            padding: 8px 0;
            border-bottom: 1px solid #c4d7f5;
          }
        }
      }

      .el-table__body-wrapper {
        .el-table__body {
          tr {
            background-color: #ffffff;

            &:nth-child(2n) {
              background-color: #f5f9ff;
            }

            &:hover {
              background-color: #e0f0ff;
            }

            td {
              padding: 8px 0;
              border-bottom: 1px solid #e1e8f5;
              font-size: 13px;
              color: #2b3f5c; // 子表正文文字颜色
            }
          }
        }
      }
    }
  }

  // 标签样式优化
  :deep(.el-tag) {
    border-radius: 4px;
    font-weight: 500;
    padding: 4px 10px;
  }

  // 空数据提示
  :deep(.el-table__empty-block) {
    padding: 40px 0;
    color: #909399;
  }

  // 移动端：卡片头部与查询表单
  .query-form--mobile {
    display: flex;
    flex-direction: column;
    gap: 12px;
    margin-bottom: 16px;

    .el-form-item.is-full-width {
      width: 100%;
      margin-right: 0;
      margin-bottom: 0;
    }

    .el-form-item .el-form-item__content {
      width: 100%;
    }

    .query-btn {
      width: 100%;
    }

    .date-picker {
      width: 100% !important;
    }
  }

  // 移动端：卡片列表
  .mobile-list {
    min-height: 120px;
  }

  .mobile-card {
    background: var(--el-bg-color);
    border: 1px solid var(--el-border-color-lighter);
    border-radius: 8px;
    margin-bottom: 12px;
    overflow: hidden;
    transition: box-shadow 0.2s;

    &:last-child {
      margin-bottom: 0;
    }

    &:active {
      box-shadow: 0 2px 12px rgba(0, 0, 0, 0.08);
    }
  }

  .mobile-card__main {
    display: flex;
    align-items: center;
    gap: 10px;
    padding: 14px 12px;
    min-height: 44px;
    cursor: pointer;
    -webkit-tap-highlight-color: transparent;
  }

  .mobile-card__title {
    flex: 1;
    font-size: 15px;
    font-weight: 500;
    color: var(--el-text-color-primary);
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;

    .cell-link {
      font-weight: inherit;
      max-width: 100%;
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
      display: inline-block;
      vertical-align: bottom;
    }
  }

  .cell-link {
    font-weight: inherit;
  }

  .mobile-card__meta {
    display: flex;
    flex-wrap: wrap;
    gap: 6px;
    flex-shrink: 0;
  }

  .mobile-card__tag {
    flex-shrink: 0;
  }

  .mobile-card__expand {
    flex-shrink: 0;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    width: 28px;
    height: 28px;
    color: var(--el-text-color-secondary);
    transition: transform 0.2s;

    &.is-open {
      transform: rotate(180deg);
    }
  }

  .mobile-card__detail {
    padding: 0 12px 14px;
    border-top: 1px solid var(--el-border-color-lighter);
    background: var(--el-fill-color-light);
  }

  .mobile-detail-row {
    display: flex;
    align-items: flex-start;
    justify-content: space-between;
    gap: 12px;
    padding: 10px 0;
    font-size: 13px;
    border-bottom: 1px solid var(--el-border-color-lighter);

    &:last-child {
      border-bottom: none;
    }
  }

  .mobile-detail-row__label {
    flex-shrink: 0;
    color: var(--el-text-color-secondary);
    min-width: 90px;
  }

  .mobile-detail-row__value {
    flex: 1;
    text-align: right;
    word-break: break-all;
    color: var(--el-text-color-primary);
  }

  .mobile-detail-section {
    margin-top: 12px;
    padding-top: 12px;
    border-top: 1px dashed var(--el-border-color);
  }

  .mobile-detail-section__title {
    font-size: 13px;
    font-weight: 600;
    color: var(--el-text-color-primary);
    margin-bottom: 10px;
    padding-bottom: 6px;
  }

  .mobile-empty {
    padding: 32px 0;
  }
}

// 移动端媒体查询：统一缩小间距与字号
@media (max-width: 768px) {
  .project-overview {
    padding: 0 2px;

    .overview-card {
      :deep(.el-card__header) {
        padding: 12px 14px;
      }

      :deep(.el-card__body) {
        padding: 14px;
      }
    }

    .card-header {
      flex-wrap: wrap;
      gap: 10px;
      align-items: center;

      .font-medium {
        font-size: 15px;
      }

      .header-btn {
        padding: 8px 12px;
        font-size: 13px;
      }
    }

    .query-form {
      margin-bottom: 12px;
    }

    .snapshot-block {
      margin-bottom: 24px;
    }

    .snapshot-meta {
      margin-bottom: 10px;
      padding: 8px 12px;
      font-size: 13px;

      span::before {
        font-size: 12px;
      }
    }
  }
}
</style>
