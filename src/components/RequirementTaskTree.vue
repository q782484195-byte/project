<template>
  <div class="requirement-task-tree registry-style">
    <!-- 左右分栏布局，类似 Windows 注册表编辑器 -->
    <div class="registry-container">
      <!-- 左侧：树形路径面板（类似注册表的键路径） -->
      <div class="registry-left-panel">
        <div class="panel-header">
          <span class="header-title">需求路径</span>
        </div>
        <div class="tree-container">
          <RequirementTaskNode v-for="(value, key) in processedData" :key="key" :node-key="key" :node-data="value"
            :parent-path="categoryName" :project-id="projectId" :project-name="projectName"
            :selected-path="selectedPath" @add="handleAdd" @edit="handleEdit" @delete="handleDelete"
            @refresh="handleRefresh" @select="handleNodeSelect" />
        </div>
      </div>

      <!-- 分隔条 -->
      <div class="registry-divider" @mousedown="handleDividerMouseDown"></div>

      <!-- 右侧：任务详情面板（类似注册表的值列表） -->
      <div class="registry-right-panel">
        <div class="panel-header">
          <span class="header-title">任务列表</span>
          <div class="header-actions" v-if="selectedRequirement">
            <el-button type="primary" size="small" @click="handleAddTask">
              <el-icon>
                <Plus />
              </el-icon>
              添加任务
            </el-button>
            <el-button type="primary" link size="small" @click="handleEditRequirement">
              <el-icon>
                <Edit />
              </el-icon>
              编辑需求
            </el-button>
          </div>
        </div>
        <div class="content-container">
          <div v-if="!selectedRequirement" class="empty-state">
            <el-empty description="请从左侧选择一个需求查看任务列表" />
          </div>
          <div v-else class="task-details">
            <!-- 需求基本信息 -->
            <div class="requirement-info">
              <div class="info-header">
                <h3>{{ selectedRequirement.需求名 }}</h3>
                <div class="info-tags">
                  <el-tag :type="getStatusTagType(selectedRequirement.状态)" size="small">
                    {{ selectedRequirement.状态 || "未知" }}
                  </el-tag>
                  <el-tag v-if="selectedRequirement.优先级" type="info" size="small" style="margin-left: 8px">
                    {{ selectedRequirement.优先级 }}
                  </el-tag>
                </div>
              </div>
              <div v-if="selectedRequirement.describe" class="info-description">
                <div v-for="(item, index) in selectedRequirement.describe" :key="index">
                  <p v-if="item.type === 'text'">{{ item.content }}</p>
                  <el-image v-else-if="item.type === 'image' || item.type === 'url'" :src="item.url || item.content"
                    fit="contain" style="max-width: 400px; max-height: 300px; margin: 8px 0" />
                </div>
              </div>
              <div v-if="selectedRequirement.进度 !== undefined" class="info-progress">
                <span>进度: {{ selectedRequirement.进度 }}%</span>
                <el-progress :percentage="selectedRequirement.进度" :stroke-width="6"
                  style="width: 300px; margin-left: 8px" />
              </div>
            </div>

            <!-- 任务列表表格 -->
            <div class="task-table-container">
              <el-table :data="selectedRequirement.task_list || []" stripe style="width: 100%" empty-text="暂无任务">
                <el-table-column prop="任务名" label="任务名称" min-width="200">
                  <template #default="{ row }">
                    <span>{{ getTaskDisplayName(row.任务名) }}</span>
                  </template>
                </el-table-column>
                <el-table-column prop="状态" label="状态" width="120">
                  <template #default="{ row }">
                    <el-tag :type="getStatusTagType(row.状态)" size="small">
                      {{ row.状态 }}
                    </el-tag>
                  </template>
                </el-table-column>
                <el-table-column prop="预计工时" label="预计工时" width="100">
                  <template #default="{ row }">
                    <span v-if="row.预计工时">{{ row.预计工时 }}h</span>
                    <span v-else>-</span>
                  </template>
                </el-table-column>
                <el-table-column prop="已用工时" label="已用工时" width="100">
                  <template #default="{ row }">
                    <span v-if="row.已用工时">{{ row.已用工时 }}h</span>
                    <span v-else>-</span>
                  </template>
                </el-table-column>
                <el-table-column prop="进度" label="进度" width="150">
                  <template #default="{ row }">
                    <div v-if="row.进度 !== undefined" style="display: flex; align-items: center;">
                      <span style="margin-right: 8px; min-width: 40px;">{{ row.进度 }}%</span>
                      <el-progress :percentage="row.进度" :stroke-width="4" style="flex: 1;" />
                    </div>
                    <span v-else>-</span>
                  </template>
                </el-table-column>
                <el-table-column label="操作" width="120" fixed="right">
                  <template #default="{ row }">
                    <el-button type="primary" link size="small" @click="handleEditTask(row)">
                      <el-icon>
                        <Edit />
                      </el-icon>
                      编辑
                    </el-button>
                  </template>
                </el-table-column>
              </el-table>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- 需求 Drawer -->
    <RequirementDrawer :visible="showRequirementDrawer" :project-id="projectId" :project-name="projectName"
      :requirement="currentRequirement" :parent-path="currentRequirement ? undefined : selectedPath"
      @update:visible="showRequirementDrawer = $event" @refresh="handleRequirementRefresh" />

    <!-- 任务 Drawer -->
    <TaskDrawer :visible="showTaskDrawer" :project-id="projectId" :requirement-id="currentTaskRequirementId"
      :requirement-name="currentTaskRequirementName" :task="currentTask"
      :parent-path="currentTask ? undefined : selectedPath" @update:visible="showTaskDrawer = $event"
      @refresh="handleTaskRefresh" />
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from "vue";
import { Edit, Plus } from "@element-plus/icons-vue";
import RequirementTaskNode from "./RequirementTaskNode.vue";
import RequirementDrawer from "./RequirementDrawer.vue";
import TaskDrawer from "./TaskDrawer.vue";

const props = defineProps<{
  data: Record<string, any>;
  categoryName: string;
  projectId?: string;
  projectName?: string;
}>();

const emit = defineEmits<{
  add: [type: "requirement" | "task", data: any, parentPath: string];
  edit: [type: "requirement" | "task", data: any];
  delete: [type: "requirement" | "task", id: string, name: string];
  refresh: [];
}>();

// 选中状态
const selectedPath = ref<string>("");
const selectedRequirement = ref<any>(null);

// Drawer 控制
const showRequirementDrawer = ref(false);
const showTaskDrawer = ref(false);
const currentRequirement = ref<any>(null);
const currentTask = ref<any>(null);
const currentTaskRequirementId = ref<string>("");
const currentTaskRequirementName = ref<string>("");

// 左侧面板宽度（可调整）
const leftPanelWidth = ref(300);

// 直接使用原始数据，因为数据结构已经是正确的嵌套格式
const processedData = computed(() => {
  return props.data;
});

// 查找需求节点（在处理后的数据中查找）
const findRequirementByPath = (data: Record<string, any>, path: string): any => {
  if (!path) return null;

  const pathParts = path.split("/");
  let current = data;

  for (let i = 0; i < pathParts.length; i++) {
    const part = pathParts[i];
    if (current[part]) {
      current = current[part];
      // 检查是否是需求节点
      if (current._id && current.需求名 && i === pathParts.length - 1) {
        return current;
      }
    } else {
      return null;
    }
  }

  return null;
};

// 处理节点选中
const handleNodeSelect = (path: string, requirement: any) => {
  selectedPath.value = path;
  selectedRequirement.value = requirement;
};

// 处理分隔条拖拽
const handleDividerMouseDown = (e: MouseEvent) => {
  e.preventDefault();
  const startX = e.clientX;
  const startWidth = leftPanelWidth.value;

  const handleMouseMove = (e: MouseEvent) => {
    const diff = e.clientX - startX;
    const newWidth = Math.max(200, Math.min(600, startWidth + diff));
    leftPanelWidth.value = newWidth;
  };

  const handleMouseUp = () => {
    document.removeEventListener("mousemove", handleMouseMove);
    document.removeEventListener("mouseup", handleMouseUp);
  };

  document.addEventListener("mousemove", handleMouseMove);
  document.addEventListener("mouseup", handleMouseUp);
};

// 获取任务显示名称
const getTaskDisplayName = (taskName: string) => {
  if (!taskName) return "";
  if (typeof taskName === "string" && taskName.includes("/")) {
    return taskName.split("/").pop() || taskName;
  }
  return taskName;
};

// 获取状态标签类型
const getStatusTagType = (status: string) => {
  const statusMap: Record<string, "success" | "warning" | "danger" | "info"> = {
    已完成: "success",
    审阅完毕: "success",
    测试完毕: "success",
    进行中: "warning",
    任务进行中: "warning",
    测试中: "warning",
    审阅中: "warning",
    草稿: "info",
    待办: "info",
  };
  return statusMap[status] || "info";
};

// 添加任务
const handleAddTask = () => {
  if (selectedRequirement.value) {
    currentTaskRequirementId.value = selectedRequirement.value._id || "";
    currentTaskRequirementName.value = selectedRequirement.value.需求名 || "";
  }
  currentTask.value = null;
  showTaskDrawer.value = true;
};

// 编辑需求
const handleEditRequirement = () => {
  if (!selectedRequirement.value) return;
  currentRequirement.value = {
    id: selectedRequirement.value._id,
    title: selectedRequirement.value.需求名,
    describe: selectedRequirement.value.describe || [],
    status: selectedRequirement.value.状态,
    priority: selectedRequirement.value.优先级 || "",
    projectId: selectedRequirement.value.project_id,
    creatorId: selectedRequirement.value.creator,
    createdAt: selectedRequirement.value.create_time,
    attachment: selectedRequirement.value.attachment || []
  };
  showRequirementDrawer.value = true;
};

// 编辑任务
const handleEditTask = (task: any) => {
  currentTask.value = task;
  currentTaskRequirementId.value = task.requirement_id || selectedRequirement.value?._id || "";
  currentTaskRequirementName.value = task.requirement_name || selectedRequirement.value?.需求名 || "";
  showTaskDrawer.value = true;
};

// 刷新处理
const handleRequirementRefresh = () => {
  emit("refresh");
  showRequirementDrawer.value = false;
  // 重新查找并更新选中的需求
  if (selectedPath.value) {
    const requirement = findRequirementByPath(processedData.value, selectedPath.value);
    selectedRequirement.value = requirement;
  }
};

const handleTaskRefresh = () => {
  emit("refresh");
  showTaskDrawer.value = false;
  // 重新查找并更新选中的需求
  if (selectedPath.value) {
    const requirement = findRequirementByPath(processedData.value, selectedPath.value);
    selectedRequirement.value = requirement;
  }
};

const handleAdd = (type: "requirement" | "task", data: any, parentPath: string) => {
  emit("add", type, data, parentPath);
};

const handleEdit = (type: "requirement" | "task", data: any) => {
  emit("edit", type, data);
};

const handleDelete = (type: "requirement" | "task", id: string, name: string) => {
  emit("delete", type, id, name);
};

const handleRefresh = () => {
  emit("refresh");
  // 刷新后重新查找选中的需求
  if (selectedPath.value) {
    const requirement = findRequirementByPath(processedData.value, selectedPath.value);
    selectedRequirement.value = requirement;
  }
};
</script>

<style scoped lang="scss">
.requirement-task-tree.registry-style {
  height: 100%;
  display: flex;
  flex-direction: column;
  background: #f5f5f5;
}

.registry-container {
  display: flex;
  height: 100%;
  min-height: 600px;
  background: #fff;
  border: 1px solid #d1d1d1;
}

.registry-left-panel {
  width: v-bind(leftPanelWidth + 'px');
  min-width: 200px;
  max-width: 600px;
  display: flex;
  flex-direction: column;
  border-right: 1px solid #d1d1d1;
  background: #fff;
  overflow: hidden;
}

.registry-divider {
  width: 4px;
  background: #d1d1d1;
  cursor: col-resize;
  flex-shrink: 0;
  position: relative;

  &:hover {
    background: #0078d4;
  }

  &::after {
    content: "";
    position: absolute;
    left: -2px;
    right: -2px;
    top: 0;
    bottom: 0;
  }
}

.registry-right-panel {
  flex: 1;
  display: flex;
  flex-direction: column;
  background: #fff;
  overflow: hidden;
}

.panel-header {
  height: 32px;
  background: #f0f0f0;
  border-bottom: 1px solid #d1d1d1;
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 8px;
  flex-shrink: 0;

  .header-title {
    font-weight: 600;
    font-size: 13px;
    color: #333;
  }

  .header-actions {
    display: flex;
    gap: 8px;
  }
}

.tree-container {
  flex: 1;
  overflow-y: auto;
  padding: 4px;
  font-family: "Segoe UI", sans-serif;
  font-size: 12px;
}

.content-container {
  flex: 1;
  overflow-y: auto;
  padding: 16px;
}

.empty-state {
  display: flex;
  align-items: center;
  justify-content: center;
  height: 100%;
}

.task-details {
  .requirement-info {
    margin-bottom: 24px;
    padding-bottom: 16px;
    border-bottom: 1px solid #e4e7ed;

    .info-header {
      display: flex;
      align-items: center;
      justify-content: space-between;
      margin-bottom: 12px;

      h3 {
        margin: 0;
        font-size: 16px;
        font-weight: 600;
        color: #303133;
      }

      .info-tags {
        display: flex;
        align-items: center;
      }
    }

    .info-description {
      margin: 12px 0;
      color: #606266;
      font-size: 14px;
      line-height: 1.6;
    }

    .info-progress {
      display: flex;
      align-items: center;
      margin-top: 12px;
      font-size: 13px;
      color: #909399;
    }
  }

  .task-table-container {
    margin-top: 16px;
  }
}
</style>
