<template>
  <div class="requirement-task-node registry-tree-node">
    <!-- 如果是需求（有 _id 字段） -->
    <div v-if="isRequirement" class="tree-node requirement-node" :class="{ 'is-selected': isSelected }"
      @click="handleRequirementClick">
      <div class="node-content">
        <el-icon class="expand-icon" @click.stop="isExpanded = !isExpanded" style="cursor: pointer; margin-right: 2px;">
          <ArrowDown v-if="isExpanded" />
          <ArrowRight v-else />
        </el-icon>
        <el-icon class="node-icon">
          <Document />
        </el-icon>
        <span class="node-path">{{ getDisplayName() }}</span>
      </div>
      <div v-show="isExpanded" class="node-children">
        <!-- 子节点（如果有嵌套的需求） -->
        <RequirementTaskNode v-for="(childValue, childKey) in getFolderChildren"
          :key="`${props.parentPath || ''}_${String(childKey)}_${childValue?._id || childKey}`"
          :node-key="String(childKey)" :node-data="childValue" :parent-path="getCurrentPath()" :project-id="projectId"
          :project-name="projectName" :selected-path="selectedPath" @add="handleAdd" @edit="handleEdit"
          @delete="handleDelete" @refresh="handleRequirementRefresh" @select="handleSelect" />
      </div>
    </div>

    <!-- 如果是文件夹（嵌套对象） -->
    <div v-else class="tree-node folder-node">
      <div class="node-content" @click.stop="isFolderExpanded = !isFolderExpanded">
        <el-icon class="expand-icon" style="cursor: pointer; margin-right: 2px;">
          <ArrowDown v-if="isFolderExpanded" />
          <ArrowRight v-else />
        </el-icon>
        <el-icon class="folder-icon">
          <Folder />
        </el-icon>
        <span class="node-path">{{ getDisplayName() }}</span>
      </div>
      <div v-show="isFolderExpanded" class="node-children">
        <RequirementTaskNode v-for="(childValue, childKey) in getFolderChildren"
          :key="`${props.parentPath || ''}_${String(childKey)}_${childValue?._id || childKey}`"
          :node-key="String(childKey)" :node-data="childValue" :parent-path="getCurrentPath()" :project-id="projectId"
          :project-name="projectName" :selected-path="selectedPath" @add="handleAdd" @edit="handleEdit"
          @delete="handleDelete" @refresh="handleRequirementRefresh" @select="handleSelect" />
      </div>
    </div>

    <!-- 需求 Drawer -->
    <RequirementDrawer :visible="showRequirementDrawer" :project-id="projectId" :project-name="projectName"
      :requirement="currentRequirement" :parent-path="currentRequirement ? undefined : getCurrentPath()"
      @update:visible="showRequirementDrawer = $event" @refresh="handleRequirementRefresh" />

    <!-- 任务 Drawer -->
    <TaskDrawer :visible="showTaskDrawer" :project-id="projectId" :requirement-id="currentTaskRequirementId"
      :requirement-name="currentTaskRequirementName" :task="currentTask"
      :parent-path="currentTask ? undefined : getCurrentPath()" @update:visible="showTaskDrawer = $event"
      @refresh="handleTaskRefresh" />
  </div>
</template>

<script setup lang="ts">
import { computed, ref } from "vue";
import { Document, Folder, Edit, Delete, Plus, ArrowDown, ArrowRight } from "@element-plus/icons-vue";
import { ElMessageBox } from "element-plus";
import RequirementDrawer from "./RequirementDrawer.vue";
import TaskDrawer from "./TaskDrawer.vue";

const props = defineProps<{
  nodeKey: string;
  nodeData: any;
  parentPath?: string;
  projectId?: string;
  projectName?: string;
  selectedPath?: string; // 当前选中的路径
}>();

const emit = defineEmits<{
  add: [type: "requirement" | "task", data: any, parentPath: string];
  edit: [type: "requirement" | "task", data: any];
  delete: [type: "requirement" | "task", id: string, name: string];
  refresh: [];
  select: [path: string, requirement: any]; // 选中事件
}>();

// Drawer 控制
const showRequirementDrawer = ref(false);
const showTaskDrawer = ref(false);
const currentRequirement = ref<any>(null);
const currentTask = ref<any>(null);
const currentTaskRequirementId = ref<string>("");
const currentTaskRequirementName = ref<string>("");

// 需求展开/收起状态
const isExpanded = ref(true);
// 文件夹展开/收起状态
const isFolderExpanded = ref(true);

// 判断是否选中
const isSelected = computed(() => {
  return props.selectedPath === getCurrentPath();
});

// 判断是否是需求（有 _id 和 需求名 字段，且不是数组）
const isRequirement = computed(() => {
  const data = props.nodeData;
  if (!data || typeof data !== "object" || Array.isArray(data)) {
    return false;
  }

  // 严格判断：必须有 _id 和 需求名 字段，且 _id 是字符串
  const hasId = "_id" in data && typeof data._id === "string" && data._id.length > 0;
  const hasName = "需求名" in data && typeof data.需求名 === "string" && data.需求名.length > 0;

  if (hasId && hasName) {
    // 如果有 task_list，必须是数组才是需求
    if ("task_list" in data) {
      return Array.isArray(data.task_list);
    }
    // 如果没有 task_list，但有 _id 和 需求名，也是需求
    return true;
  }

  // 如果没有 _id 和 需求名，则是文件夹（嵌套对象）
  return false;
});

const getCurrentPath = () => {
  if (props.parentPath) {
    return `${props.parentPath}/${props.nodeKey}`;
  }
  return props.nodeKey;
};

// 获取文件夹的有效子节点（过滤掉非对象类型的值）
const getFolderChildren = computed(() => {
  const data = props.nodeData;
  if (!data || typeof data !== "object" || Array.isArray(data)) {
    return {};
  }

  const children: Record<string, any> = {};
  for (const key in data) {
    if (Object.prototype.hasOwnProperty.call(data, key)) {
      const value = data[key];
      // 只包含对象类型的值（可能是子文件夹或需求）
      // 排除原始值、数组、null 和函数
      if (
        value &&
        typeof value === "object" &&
        !Array.isArray(value) &&
        value !== null &&
        typeof value !== "function"
      ) {
        children[key] = value;
      }
    }
  }
  return children;
});

// 获取完整路径（类似注册表的键路径）- 使用 key 构建路径，不使用需求名字段
const getFullPath = () => {
  // 始终使用基于 key 的路径
  return getCurrentPath();
};

// 获取显示名称（只显示当前层级的 key）
const getDisplayName = () => {
  // 只显示当前层级的 key，不显示需求名
  return props.nodeKey;
};

// 处理需求点击（选中）
const handleRequirementClick = () => {
  if (isRequirement.value) {
    const path = getCurrentPath();
    emit("select", path, props.nodeData);
  }
};

// 处理选中事件传递
const handleSelect = (path: string, requirement: any) => {
  emit("select", path, requirement);
};

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

const handleAddRequirement = () => {
  currentRequirement.value = null;
  const parentPath = getCurrentPath();
  showRequirementDrawer.value = true;
};

const handleEditRequirement = () => {
  // 将 nodeData 转换为 Requirement 格式
  currentRequirement.value = {
    id: props.nodeData._id,
    title: props.nodeData.需求名,
    describe: props.nodeData.describe || [], // 改为 describe，并且确保是数组格式
    status: props.nodeData.状态,
    priority: props.nodeData.优先级 || "",
    projectId: props.nodeData.project_id,
    creatorId: props.nodeData.creator,
    createdAt: props.nodeData.create_time,
    attachment: props.nodeData.attachment || []
  };
  console.log("【编辑需求】传递给 RequirementDrawer 的值：", {
    visible: true,
    "project-id": props.projectId,
    "project-name": props.projectName,
    requirement: currentRequirement.value,
    "parent-path": undefined
  });
  showRequirementDrawer.value = true;
};

const handleEditTask = (task: any) => {
  currentTask.value = task;
  currentTaskRequirementId.value = task.requirement_id || props.nodeData._id || "";
  currentTaskRequirementName.value = task.requirement_name || props.nodeData.需求名 || "";
  console.log("【编辑任务】传递给 TaskDrawer 的值：", {
    visible: true,
    "project-id": props.projectId,
    "requirement-id": currentTaskRequirementId.value,
    "requirement-name": currentTaskRequirementName.value,
    task: currentTask.value,
    "parent-path": undefined
  });
  showTaskDrawer.value = true;
};

const handleRequirementRefresh = () => {
  emit("refresh");
  showRequirementDrawer.value = false;
};

const handleTaskRefresh = () => {
  emit("refresh");
  showTaskDrawer.value = false;
};

const handleDeleteRequirement = async () => {
  try {
    await ElMessageBox.confirm(`确定要删除需求"${props.nodeData.需求名 || props.nodeKey}"吗？`, "删除确认", {
      confirmButtonText: "确定",
      cancelButtonText: "取消",
      type: "warning",
    });
    emit("delete", "requirement", props.nodeData._id, props.nodeData.需求名 || props.nodeKey);
  } catch {
    // 用户取消
  }
};

const handleDeleteTask = async (task: any) => {
  try {
    await ElMessageBox.confirm(`确定要删除任务"${task.任务名}"吗？`, "删除确认", {
      confirmButtonText: "确定",
      cancelButtonText: "取消",
      type: "warning",
    });
    emit("delete", "task", task._id || task.id || "", task.任务名);
  } catch {
    // 用户取消
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
</script>

<style scoped lang="scss">
.requirement-task-node.registry-tree-node {
  font-size: 12px;
  line-height: 20px;
}

.tree-node {
  user-select: none;

  .node-content {
    display: flex;
    align-items: center;
    padding: 2px 4px;
    cursor: pointer;
    border-radius: 2px;
    transition: background-color 0.15s;

    &:hover {
      background-color: #e8f4f8;
    }

    .expand-icon {
      width: 16px;
      height: 16px;
      color: #666;
      font-size: 12px;
      display: flex;
      align-items: center;
      justify-content: center;
      flex-shrink: 0;
    }

    .node-icon,
    .folder-icon {
      width: 16px;
      height: 16px;
      margin-right: 4px;
      flex-shrink: 0;
    }

    .node-icon {
      color: #0078d4;
    }

    .folder-icon {
      color: #f0a30a;
    }

    .node-path {
      flex: 1;
      color: #333;
      font-family: "Consolas", "Courier New", monospace;
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
    }
  }

  &.is-selected {
    .node-content {
      background-color: #0078d4;
      color: #fff;

      .node-path {
        color: #fff;
      }

      .expand-icon,
      .node-icon {
        color: #fff;
      }

      &:hover {
        background-color: #005a9e;
      }
    }
  }
}

.requirement-node {
  .node-children {
    margin-left: 16px;
  }
}

.folder-node {
  .node-children {
    margin-left: 16px;
  }
}
</style>
