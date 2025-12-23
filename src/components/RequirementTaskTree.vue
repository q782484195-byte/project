<template>
  <div class="requirement-task-tree">
    <div class="form-container">
      <!-- 直接渲染传入的分类数据（已经是单个分类下的需求数据） -->
      <div class="section">
        <!-- <div class="section-header">   -->
        <!-- <h3>{{ categoryName }}</h3> -->
        <!-- <el-button type="text" @click="toggleCollapse" class="collapse-button">
            <el-icon style="margin-right: 4px">
              <ArrowUp v-if="!isCollapsed" />
              <ArrowDown v-else />
            </el-icon>
            {{ isCollapsed ? '展开' : '收起' }}
          </el-button> -->
        <!-- </div> -->
        <div v-show="!isCollapsed" class="section-content">
          <!-- 递归渲染子分类和需求 -->
          <!-- 最外层不传入 parent-path，让 RequirementSection 识别为根节点 -->
          <RequirementSection v-for="(value, key) in processedData"
            :key="`root_${categoryName}_${String(key)}_${value?._id || key}`"
            :ref="(el) => setSectionRef(el, String(key))" :node-key="String(key)" :node-data="value"
            :parent-path="undefined" :project-id="projectId" :project-name="projectName"
            :project-creator="projectCreator" :selected-path="selectedPath" @add="handleAdd" @edit="handleEdit"
            @delete="handleDelete" @refresh="handleRefresh" @select="handleNodeSelect" />
        </div>
      </div>
    </div>

    <!-- 底部保存按钮，打印所有数据 JSON -->
    <div class="save-json-bar" v-perms="['requirement:update']" v-if="userStore.username === projectCreator">
      <el-button type="success" class="save-json-btn" @click="handleSaveAllData">
        保存
      </el-button>
    </div>

    <!-- 需求 Drawer -->
    <RequirementDrawer :visible="showRequirementDrawer" :project-id="projectId" :project-name="projectName"
      :project-creator="projectCreator" :requirement="currentRequirement"
      :parent-path="currentRequirement ? undefined : selectedPath" @update:visible="showRequirementDrawer = $event"
      @refresh="handleRequirementRefresh" />

    <!-- 任务 Drawer -->
    <TaskDrawer :visible="showTaskDrawer" :project-id="projectId" :requirement-id="currentTaskRequirementId"
      :requirement-name="currentTaskRequirementName" :task="currentTask"
      :parent-path="currentTask ? undefined : selectedPath" @update:visible="showTaskDrawer = $event"
      @refresh="handleTaskRefresh" />
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch, onMounted } from "vue";
import { ArrowUp, ArrowDown } from "@element-plus/icons-vue";
import { ElMessage } from "element-plus";
import { updateTaskByJson, selectAllRequirementsAndTasks } from "@/api/project";
import RequirementSection from "./RequirementSection.vue";
import RequirementDrawer from "./RequirementDrawer.vue";
import TaskDrawer from "./TaskDrawer.vue";
import { useUserStoreHook } from "@/store/modules/user";

const props = defineProps<{
  data: Record<string, any>;
  categoryName: string;
  projectId?: string;
  projectName?: string;
  projectCreator?: string;
}>();

const userStore = useUserStoreHook();

// 打印项目创建人信息
onMounted(() => {
  console.log("=== RequirementTaskTree 项目信息 ===");
  console.log("项目ID:", props.projectId);
  console.log("项目名称:", props.projectName);
  console.log("项目创建人:", props.projectCreator);
  console.log("当前用户:", userStore.username);
  console.log("是否匹配:", userStore.username === props.projectCreator);
  console.log("===================================");
});

// 监听项目创建人变化
watch(
  () => props.projectCreator,
  (newCreator) => {
    console.log("项目创建人已更新:", newCreator);
    console.log("当前用户:", userStore.username);
    console.log("是否匹配:", userStore.username === newCreator);
  }
);

const emit = defineEmits<{
  add: [type: "requirement" | "task", data: any, parentPath: string];
  edit: [type: "requirement" | "task", data: any];
  delete: [type: "requirement" | "task", id: string, name: string];
  refresh: [];
}>();

// 选中状态
const selectedPath = ref<string>("");
const selectedRequirement = ref<any>(null);

// 存储所有 RequirementSection 组件的引用
const sectionRefs = ref<Record<string, any>>({});

// 设置组件引用
const setSectionRef = (el: any, key: string) => {
  if (el) {
    sectionRefs.value[key] = el;
  }
};

// 展开/收起状态
const isCollapsed = ref(false);

// Drawer 控制
const showRequirementDrawer = ref(false);
const showTaskDrawer = ref(false);
const currentRequirement = ref<any>(null);
const currentTask = ref<any>(null);
const currentTaskRequirementId = ref<string>("");
const currentTaskRequirementName = ref<string>("");

// 处理后的数据
const processedData = computed(() => {
  const data = props.data;

  // 确保数据是对象格式
  if (!data || typeof data !== "object" || Array.isArray(data)) {
    console.log("[RequirementTaskTree] 数据格式不正确，返回空对象");
    return {};
  }

  const requirementTypes = ["软件任务", "硬件任务", "结构任务"];
  const keys = Object.keys(data);

  // 如果最外层键是层级类型（软件任务、硬件任务、结构任务），直接返回其子节点
  for (const key of keys) {
    if (requirementTypes.includes(key)) {
      const value = data[key];
      // 确保值是一个对象，且不是数组
      if (value && typeof value === "object" && !Array.isArray(value)) {
        // 检查是否有子节点（避免空对象）
        if (Object.keys(value).length > 0) {
          // 直接返回子节点，跳过层级类型层
          return value;
        }
      }
    }
  }

  // 如果最外层只有一个键，且这个键对应的值是一个文件夹（包含多个子节点，而不是单个需求节点），
  // 则直接展开这个文件夹，返回其子节点
  if (keys.length === 1) {
    const firstKey = keys[0];
    const firstValue = data[firstKey];

    // 检查是否是文件夹（不是需求节点）
    if (
      firstValue &&
      typeof firstValue === "object" &&
      !Array.isArray(firstValue)
    ) {
      // 检查 firstValue 本身是否有 _id 和 需求名（需求节点的特征）
      const hasId = "_id" in firstValue && typeof firstValue._id === "string" && firstValue._id.length > 0;
      const hasName = "需求名" in firstValue && typeof firstValue.需求名 === "string" && firstValue.需求名.length > 0;

      // 如果没有 _id 和 需求名，说明这是一个文件夹，直接返回其子节点
      // 同时检查是否有子节点（避免空对象）
      if ((!hasId || !hasName) && Object.keys(firstValue).length > 0) {
        // 直接返回子节点，跳过最外层的文件夹
        return firstValue;
      }
    }
  }

  return data;
});

// 切换展开/收起状态
const toggleCollapse = () => {
  isCollapsed.value = !isCollapsed.value;
};

// 查找需求节点
const findRequirementByPath = (data: Record<string, any>, path: string): any => {
  if (!path) return null;

  const pathParts = path.split("/");
  let current = data;

  // 如果路径的第一部分是分类名称（与 categoryName 相同），则跳过它
  let startIndex = 0;
  if (pathParts.length > 0 && pathParts[0] === props.categoryName) {
    startIndex = 1;
  }

  for (let i = startIndex; i < pathParts.length; i++) {
    const part = pathParts[i];
    if (current && typeof current === "object" && !Array.isArray(current) && current[part]) {
      current = current[part];
      // 检查是否是需求节点
      if (current && typeof current === "object" && !Array.isArray(current) && current._id && current.需求名 && i === pathParts.length - 1) {
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

// 递归收集所有子组件的数据（包括编辑中的值）
// 由于 RequirementSection 是递归组件，我们需要递归访问所有层级的 refs
const collectAllData = (data: any, refs: Record<string, any>, path: string = ""): any => {
  if (!data || typeof data !== "object" || Array.isArray(data)) {
    return data;
  }

  const result: any = {};

  for (const key in data) {
    if (Object.prototype.hasOwnProperty.call(data, key)) {
      const value = data[key];
      const currentPath = path ? `${path}.${key}` : key;

      // 判断是否是需求节点（有 _id 和 需求名）
      const isRequirementNode = value && typeof value === "object" && !Array.isArray(value) && value._id && value.需求名;

      if (isRequirementNode) {
        // 这是需求节点，尝试从对应的 ref 获取当前数据
        const sectionRef = refs[currentPath];
        if (sectionRef && typeof sectionRef.getCurrentData === "function") {
          result[key] = sectionRef.getCurrentData();
        } else {
          result[key] = JSON.parse(JSON.stringify(value));
        }
      } else if (value && typeof value === "object" && !Array.isArray(value)) {
        // 这是文件夹节点，递归处理
        const sectionRef = refs[currentPath];
        if (sectionRef && typeof sectionRef.getCurrentData === "function") {
          const currentData = sectionRef.getCurrentData();
          // 递归处理子节点，传递当前路径用于查找子组件的 refs
          result[key] = collectAllData(currentData, refs, currentPath);
        } else {
          // 如果没有 ref，递归处理原始数据
          result[key] = collectAllData(value, refs, currentPath);
        }
      } else {
        result[key] = value;
      }
    }
  }

  return result;
};

// 打印所有数据的 JSON 并保存
const handleSaveAllData = async () => {
  try {
    // 收集所有数据，包括编辑中的值
    const allDataRaw = processedData.value ?? {};
    const allData = collectAllData(allDataRaw, sectionRefs.value);

    // 根据当前tab的分类名称，在最外层加上分类名称作为key
    const result = {
      [props.categoryName]: allData
    };

    // 转换为JSON字符串用于打印
    const jsonString = JSON.stringify(result, null, 2);

    // 打印到控制台
    console.log("RequirementTaskTree 全部数据 JSON（包含编辑中的值）:", jsonString);

    // 调用接口保存（传入JSON对象，不是字符串）
    const response = await updateTaskByJson({
      json_data: result
    });

    if (response.code === 200) {
      ElMessage.success("数据保存成功");

      // 保存成功后重新请求 select_all 接口刷新数据
      if (props.projectId) {
        try {
          const refreshResponse = await selectAllRequirementsAndTasks({
            project_id: props.projectId
          });

          if (refreshResponse.code === 200) {
            // 触发 refresh 事件，让父组件更新数据
            emit("refresh");
          } else {
            console.warn("刷新数据失败:", refreshResponse.message);
          }
        } catch (refreshError: any) {
          console.error("刷新数据失败:", refreshError);
          // 即使刷新失败，也触发 refresh 事件，让父组件尝试刷新
          emit("refresh");
        }
      } else {
        // 如果没有 projectId，直接触发 refresh 事件
        emit("refresh");
      }
    } else {
      ElMessage.error(response.message || "数据保存失败");
    }
  } catch (error: any) {
    console.error("保存数据失败:", error);
    ElMessage.error(error?.response?.data?.message || error?.message || "保存数据失败");
  }
};
</script>

<style scoped lang="scss">
.requirement-task-tree {
  background: #ffffff;
  border-radius: 8px;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.1);
  overflow: hidden;
  min-width: 1080px;
}

.form-container {
  padding: 32px;
  max-height: none;
  overflow-y: visible;
}

.section {
  margin-bottom: 32px;
  border: 1px solid #e4e7ed;
  border-radius: 12px;
  background-color: #ffffff;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.04);

  &:last-child {
    margin-bottom: 0;
  }
}

.section-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 20px 24px;
  background-color: #f8f9fa;
  border-bottom: 1px solid #e4e7ed;
  border-radius: 12px 12px 0 0;

  h3 {
    margin: 0;
    color: #303133;
    font-size: 18px;
    font-weight: 600;
  }
}

.section-content {
  transition: all 0.3s ease;
  padding: 24px;
}

// 收缩展开按钮样式
.collapse-button {
  color: #606266;
  font-size: 14px;
  padding: 4px 8px;
  border-radius: 4px;
  transition: all 0.2s ease;

  &:hover {
    color: #409eff;
    background-color: #f0f9ff;
  }
}

.save-json-bar {
  display: flex;
  justify-content: center;
  padding: 16px 32px;
  border-top: 1px solid #e4e7ed;
  background-color: #fafafa;
}

.save-json-btn {
  min-width: 100px;
}
</style>