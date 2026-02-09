<template>
  <div ref="tabsContainerRef" class="nested-tabs-container">
    <el-tabs v-model="currentActiveTab" :lazy="true" @tab-change="handleTabChange" class="nested-tabs">
      <el-tab-pane v-for="(child, key) in data" :key="key" :name="key">
        <template #label>
          <el-tooltip :content="key || '未命名'" placement="top" :disabled="!isOverflowed[key]">
            <span class="tab-label" :class="{
              'is-all-completed':
                currentActiveTab === key &&
                hasTaskList(child) &&
                isAllTasksCompleted(child.task_list)
            }">
              <span :ref="setTabNameRef(key)" class="tab-name">{{ key || '未命名' }}</span>
              <span class="tab-count">{{ getTotalTaskCount(child) }}</span>
            </span>
          </el-tooltip>
        </template>
        <!-- 如果当前节点有 task_list 且是当前选中的 tab，显示表格（移动端 hideTable 时占位由父级渲染卡片） -->
        <div v-if="hasTaskList(child) && currentActiveTab === key" class="table-wrapper">
          <template v-if="!hideTable">
            <el-table :data="getProcessedTasks(child.task_list, key)" :height="tableHeight" row-key="rowKey"
              v-loading="loading" element-loading-text="加载任务数据..." empty-text="暂无任务数据"
              @selection-change="$emit('selection-change', $event)" class="nested-table">
              <slot></slot>
            </el-table>
          </template>
          <div v-else class="mobile-cards-placeholder" />
        </div>
        <!-- 如果当前节点是中间层且是当前选中的 tab，递归渲染下一层 tab -->
        <div v-else-if="isIntermediateNode(child) && currentActiveTab === key" class="nested-content">
          <NestedTabs :data="child" :level="level + 1" :active-tabs="activeTabs" :table-height="tableHeight"
            :loading="loading" :processed-cache="processedCache" :hide-table="hideTable"
            @update:active-tabs="handleUpdateActiveTabs" @selection-change="$emit('selection-change', $event)">
            <slot></slot>
          </NestedTabs>
        </div>
      </el-tab-pane>
    </el-tabs>
  </div>
</template>

<script setup lang="ts">
import { computed, ref, onMounted, onBeforeUnmount, nextTick, watch } from "vue";

const props = withDefaults(
  defineProps<{
    data: Record<string, any>;
    level: number;
    activeTabs: string[];
    tableHeight: number;
    loading: boolean;
    processedCache: Record<string, any[]>;
    /** 为 true 时不渲染表格（由父级在移动端渲染卡片列表） */
    hideTable?: boolean;
  }>(),
  { hideTable: false }
);

const emit = defineEmits<{
  "update:active-tabs": [tabs: string[]];
  "selection-change": [selection: any[]];
}>();

// 存储每个 tab 是否被截断的状态
const isOverflowed = ref<Record<string, boolean>>({});
const tabNameRefs = ref<Record<string, HTMLElement>>({});
const tabsContainerRef = ref<HTMLElement | null>(null);

const currentActiveTab = computed({
  get: () => props.activeTabs[props.level] || "",
  set: (val) => {
    const newTabs = [...props.activeTabs];
    newTabs[props.level] = val;
    // 清空后续层级
    newTabs.splice(props.level + 1);
    emit("update:active-tabs", newTabs);
  }
});

// 检查文本是否被截断
const checkOverflow = (key: string) => {
  nextTick(() => {
    const element = tabNameRefs.value[key];
    if (element) {
      isOverflowed.value[key] = element.scrollWidth > element.clientWidth;
    }
  });
};

// 设置 ref
const setTabNameRef = (key: string) => {
  return (el: HTMLElement | null) => {
    if (el) {
      tabNameRefs.value[key] = el;
      checkOverflow(key);
    } else {
      // 元素被卸载时清理
      delete tabNameRefs.value[key];
      delete isOverflowed.value[key];
    }
  };
};

// 检查所有 tab 的截断状态
const checkAllOverflow = () => {
  nextTick(() => {
    setTimeout(() => {
      Object.keys(props.data).forEach(key => {
        checkOverflow(key);
      });
    }, 50);
  });
};

// Tab 栏滑动：与 department-task-statistics 一致，原生横向滚动；滚动时显示滚动条，停止后隐藏
const SCROLLBAR_VISIBLE_MS = 800;
let tabsWheelCleanups: (() => void)[] = [];
const setupTabsHeaderWheel = () => {
  nextTick(() => {
    tabsWheelCleanups.forEach((fn) => fn());
    tabsWheelCleanups = [];
    const container = tabsContainerRef.value;
    if (!container) return;
    container.querySelectorAll<HTMLElement>(".el-tabs__nav-wrap").forEach((wrap) => {
      let scrollbarTimeout: ReturnType<typeof setTimeout> | null = null;
      const onWheel = (e: WheelEvent) => {
        if (wrap.scrollWidth <= wrap.clientWidth) return;
        e.preventDefault();
        wrap.scrollLeft += e.deltaY;
      };
      const onScroll = () => {
        wrap.classList.add("nav-wrap-scrolling");
        if (scrollbarTimeout) clearTimeout(scrollbarTimeout);
        scrollbarTimeout = setTimeout(() => {
          wrap.classList.remove("nav-wrap-scrolling");
          scrollbarTimeout = null;
        }, SCROLLBAR_VISIBLE_MS);
      };
      wrap.addEventListener("wheel", onWheel, { passive: false });
      wrap.addEventListener("scroll", onScroll, { passive: true });
      tabsWheelCleanups.push(() => {
        wrap.removeEventListener("wheel", onWheel);
        wrap.removeEventListener("scroll", onScroll);
        if (scrollbarTimeout) clearTimeout(scrollbarTimeout);
        wrap.classList.remove("nav-wrap-scrolling");
      });
    });
  });
};

onMounted(() => {
  checkAllOverflow();
  setupTabsHeaderWheel();
});

onBeforeUnmount(() => {
  tabsWheelCleanups.forEach((fn) => fn());
  tabsWheelCleanups = [];
});

// 监听数据变化，重新检查截断状态并重新绑定 tab 滚动
watch(() => props.data, () => {
  checkAllOverflow();
  setupTabsHeaderWheel();
}, { deep: true });

// 监听 activeTabs 变化，重新检查并重新绑定 tab 滚动
watch(() => props.activeTabs, () => {
  checkAllOverflow();
  setupTabsHeaderWheel();
});

// 判断节点是否有 task_list
const hasTaskList = (node: any): boolean => {
  return node && typeof node === 'object' && Array.isArray(node.task_list);
};

// 判断节点是否是中间层（有子节点但不是 task_list）
const isIntermediateNode = (node: any): boolean => {
  if (!node || typeof node !== 'object' || Array.isArray(node.task_list)) {
    return false;
  }
  // 排除需求对象的属性
  const excludeKeys = ['_id', '需求名', 'describe', '状态', '优先级', 'project_id', 'project_name', 'creator', 'attachment', 'create_time', '进度'];
  const keys = Object.keys(node).filter(key => !excludeKeys.includes(key));
  return keys.length > 0;
};

// 计算总任务数（递归）
const getTotalTaskCount = (node: any): number => {
  if (!node || typeof node !== 'object') return 0;

  if (Array.isArray(node.task_list)) {
    return node.task_list.length;
  }

  const values = Object.values(node) as any[];
  return values.reduce((sum: number, child: any) => {
    if (child && typeof child === 'object') {
      if (Array.isArray(child.task_list)) {
        return sum + child.task_list.length;
      } else {
        return sum + getTotalTaskCount(child);
      }
    }
    return sum;
  }, 0);
};

// 判断 task_list 下是否所有任务状态均为「已完成」或「已作废」
const DONE_STATUSES = ["已完成", "已作废", "已取消", "COMPLETED", "CANCELLED", "completed", "cancelled"];

const isAllTasksCompleted = (taskList: any[] | undefined): boolean => {
  if (!Array.isArray(taskList) || taskList.length === 0) return false;
  return taskList.every((task: any) => {
    const status = String(task.状态 ?? task.status ?? "").trim();
    return DONE_STATUSES.includes(status);
  });
};

// 处理任务列表
const getProcessedTasks = (taskList: any[] | undefined, currentKey: string): any[] => {
  // 如果 task_list 不存在或不是数组，返回空数组（但表格仍会显示）
  if (!Array.isArray(taskList)) return [];

  // 构建完整的路径作为缓存 key
  const path = [...props.activeTabs.slice(0, props.level), currentKey];
  const cacheKey = path.join('/');
  const cached = props.processedCache[cacheKey];

  if (cached && cached.length === taskList.length && taskList.length > 0) {
    const firstTask = taskList[0];
    const firstCached = cached[0];
    if (firstTask && firstCached &&
      (firstTask._id || firstTask.id) === (firstCached._id || firstCached.id)) {
      return cached;
    }
  }

  // 处理数据
  const processed = taskList.map((task: any, index: number) => {
    const taskId = task._id || task.id;
    const rowKey = taskId ? String(taskId) : `task_${index}_${Date.now()}`;
    return {
      ...task,
      原始状态: task.状态 || task.status,
      rowKey: rowKey
    };
  });

  props.processedCache[cacheKey] = processed;
  return processed;
};

const handleTabChange = (value: string) => {
  currentActiveTab.value = value;
};

const handleUpdateActiveTabs = (tabs: string[]) => {
  emit("update:active-tabs", tabs);
};
</script>

<style scoped lang="scss">
.nested-tabs-container {
  width: 100%;
  height: 100%;
}

.mobile-cards-placeholder {
  min-height: 0;
  height: 0;
  overflow: hidden;
}

.nested-tabs {
  height: 100%;
  display: flex;
  flex-direction: column;

  :deep(.el-tabs__header) {
    margin: 0 0 16px 0;
    border-bottom: 1px solid var(--el-border-color-lighter);
    background: transparent;
    min-width: 0;
    width: 100%;
  }

  /* 与 department-task-statistics 一致：原生横向滚动，滚动时显示滚动条，停止后隐藏 */
  :deep(.el-tabs__nav-wrap) {
    &::after {
      display: none;
    }

    overflow-x: auto !important;
    overflow-y: hidden !important;
    -webkit-overflow-scrolling: touch;
    touch-action: pan-x;
    scrollbar-width: none;

    &::-webkit-scrollbar {
      height: 0;
      transition: height 0.2s ease;
    }

    &::-webkit-scrollbar-thumb {
      background: transparent;
      border-radius: 3px;
    }

    &.nav-wrap-scrolling {
      scrollbar-width: thin;

      &::-webkit-scrollbar {
        height: 2px;
      }

      &::-webkit-scrollbar-thumb {
        background: var(--el-border-color-lighter);
      }
    }
  }

  :deep(.el-tabs__nav-scroll) {
    overflow: visible !important;
    width: max-content;
    min-width: 100%;
    display: inline-block;
  }

  :deep(.el-tabs__nav) {
    border: none;
    white-space: nowrap;
    transform: none !important;
  }

  :deep(.el-tabs__nav-prev),
  :deep(.el-tabs__nav-next) {
    display: none;
  }

  :deep(.el-tabs__item) {
    height: 44px;
    line-height: 44px;
    padding: 0 20px;
    margin-right: 8px;
    font-size: 14px;
    font-weight: 500;
    color: var(--el-text-color-regular);
    border: none;
    border-radius: 8px 8px 0 0;
    transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
    position: relative;
    max-width: 200px;
    overflow: hidden;

    &:hover {
      color: var(--el-color-primary);
      background-color: var(--el-fill-color-light);
    }

    &.is-active {
      color: var(--el-color-primary);
      font-weight: 600;
      background-color: var(--el-color-primary-light-9);

      &::after {
        content: '';
        position: absolute;
        bottom: 0;
        left: 0;
        right: 0;
        height: 2px;
        background: var(--el-color-primary);
        border-radius: 2px 2px 0 0;
      }
    }

    /* 当前 tab 的 task_list 下所有任务均为「已完成」时，tab 背景为绿色 */
    &:has(.tab-label.is-all-completed) {
      color: var(--el-color-success-dark-2);
      font-weight: 600;
      background-color: var(--el-color-success-light-9);

      &::after {
        content: '';
        position: absolute;
        bottom: 0;
        left: 0;
        right: 0;
        height: 2px;
        background: var(--el-color-success);
        border-radius: 2px 2px 0 0;
      }

      .tab-count {
        color: var(--el-color-success);
        background-color: var(--el-color-success-light-7);
      }
    }
  }


  :deep(.el-tabs__active-bar) {
    display: none;
  }

  :deep(.el-tabs__content) {
    flex: 1;
    overflow: hidden;
    padding: 0;
  }

  :deep(.el-tab-pane) {
    height: 100%;
  }
}

.tab-label {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  max-width: 100%;
  overflow: hidden;
}

.tab-name {
  font-weight: inherit;
  max-width: 160px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  flex-shrink: 1;
}

.tab-count {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-width: 20px;
  height: 20px;
  padding: 0 6px;
  font-size: 12px;
  font-weight: 500;
  line-height: 1;
  color: var(--el-text-color-secondary);
  background-color: var(--el-fill-color);
  border-radius: 10px;
  transition: all 0.2s ease;
}

.nested-tabs :deep(.el-tabs__item.is-active) .tab-count {
  color: var(--el-color-primary);
  background-color: var(--el-color-primary-light-8);
}

.table-wrapper {
  width: 100%;
  height: 100%;
  padding: 0;
  background: transparent;
}

.nested-table {
  width: 100%;
  height: 100%;

  :deep(.el-table__header-wrapper) {
    .el-table__header {
      th {
        background-color: var(--el-fill-color-lighter);
        color: var(--el-text-color-primary);
        font-weight: 600;
        border-bottom: 1px solid var(--el-border-color-lighter);
      }
    }
  }

  :deep(.el-table__body-wrapper) {
    .el-table__body {
      tr {
        transition: background-color 0.2s ease;

        &:hover {
          background-color: var(--el-fill-color-light);
        }
      }

      td {
        border-bottom: 1px solid var(--el-border-color-lighter);
      }
    }
  }

  :deep(.el-table__empty-block) {
    background: transparent;
  }
}

.nested-content {
  width: 100%;
  height: 100%;
  padding: 0;
}

// 暗色模式适配
html.dark {
  .nested-tabs {
    :deep(.el-tabs__item) {
      &:hover {
        background-color: var(--el-fill-color-dark);
      }

      &.is-active {
        background-color: var(--el-color-primary-dark-2);
      }
    }
  }


  .tab-count {
    background-color: var(--el-fill-color-dark);
  }

  .nested-tabs :deep(.el-tabs__item.is-active) .tab-count {
    background-color: var(--el-color-primary-dark-2);
  }

  .nested-table {
    :deep(.el-table__header-wrapper) {
      .el-table__header {
        th {
          background-color: var(--el-fill-color-darker);
        }
      }
    }
  }
}

// 移动端适配 (640px)
@media (max-width: 640px) {
  .nested-tabs-container {
    .nested-tabs {
      :deep(.el-tabs__nav-wrap) {
        scrollbar-width: none;

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
        // padding: 8px 0;
      }
    }

    .tab-label {
      font-size: 13px;

      .tab-name {
        max-width: 80px;
        overflow: hidden;
        text-overflow: ellipsis;
        white-space: nowrap;
      }

      .tab-count {
        font-size: 11px;
        padding: 2px 6px;
      }
    }

    .table-wrapper {
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
}
</style>
