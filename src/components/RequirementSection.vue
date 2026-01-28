<template>
  <div class="requirement-section">
    <!-- 如果是层级类型层（软件任务、硬件任务、结构任务），直接渲染子节点，不显示节点本身 -->
    <template v-if="isRequirementTypeLayer">
      <RequirementSection v-for="(childValue, childKey) in getFolderChildren"
        :key="`type_layer_${String(childKey)}_${childValue?._id || childKey}`"
        :ref="(el) => setChildRef(el, String(childKey))" :node-key="String(childKey)" :node-data="childValue"
        :parent-path="undefined" :project-id="projectId" :project-name="projectName" :selected-path="selectedPath"
        @add="handleAdd" @edit="handleEdit" @delete="handleDelete" @refresh="handleRefresh" @select="handleSelect" />
    </template>
    <!-- 如果是需求节点（有 _id 和 需求名） -->
    <div v-else-if="isRequirement" class="requirement-card">
      <el-card>
        <template #header>
          <div class="card-header">
            <div class="header-left">
              <span class="requirement-name">{{ getDisplayName() }}</span>
              <el-tag :type="getStatusTagType(nodeData.状态)" size="small" style="margin-left: 8px">
                {{ nodeData.状态 || "未知" }}
              </el-tag>
              <el-tag v-if="nodeData.优先级" type="info" size="small" style="margin-left: 8px">
                {{ nodeData.优先级 }}
              </el-tag>
            </div>
            <div class="header-actions">
              <!-- <el-button type="primary" link size="small" @click="handleEditRequirement">
                编辑层级
              </el-button> -->
              <el-button type="primary" link size="small" @click="handleAddTask"
                v-if="userStore.username === projectCreator">
                添加任务
              </el-button>
              <el-button type="text" @click="isTasksExpanded = !isTasksExpanded" class="collapse-button"
                v-if="nodeData.task_list && nodeData.task_list.length > 0">
                <el-icon style="margin-right: 4px">
                  <ArrowUp v-if="isTasksExpanded" />
                  <ArrowDown v-else />
                </el-icon>
                {{ isTasksExpanded ? '收起' : '展开' }}
              </el-button>
            </div>
          </div>
        </template>

        <!-- 需求信息 -->
        <!-- <div class="requirement-info">
          <div v-if="nodeData.describe && nodeData.describe.length > 0" class="info-description">
            <div v-for="(item, index) in nodeData.describe" :key="index" class="description-item">
              <p v-if="item.type === 'text'" class="description-text">{{ item.content }}</p>
              <el-image v-else-if="item.type === 'image' || item.type === 'url'" :src="item.url || item.content"
                fit="contain" class="description-image" :preview-src-list="[item.url || item.content]"
                :initial-index="0" />
            </div>
          </div>
        </div> -->

        <!-- 任务列表 -->
        <div v-if="nodeData.task_list && nodeData.task_list.length > 0" v-show="isTasksExpanded" class="task-list">
          <div class="task-grid">
            <el-card v-for="task in nodeData.task_list" :key="task._id || task.id" class="task-card" shadow="hover">
              <div class="task-card-header">
                <div class="task-name-wrapper">
                  <el-input :model-value="getEditingTaskName(task)"
                    @update:model-value="(val) => updateEditingTask(task, 'task_name', val)" placeholder="请输入任务名"
                    size="small" class="task-name-input" />
                </div>
                <div class="header-right"
                  v-if="task && Object.prototype.hasOwnProperty.call(task, 'upload_file') && task.upload_file">
                  <el-upload :show-file-list="false" :http-request="(options) => handleTaskUpload(task, options)"
                    :disabled="uploadingTaskId === (task._id || task.id)">
                    <el-button type="primary" size="small" :loading="uploadingTaskId === (task._id || task.id)">
                      上传文件
                    </el-button>
                  </el-upload>
                </div>
              </div>
              <div class="task-card-content">
                <div class="task-describe-wrapper">
                  <el-input :model-value="getEditingTaskDescribe(task)"
                    @update:model-value="(val) => updateEditingTask(task, 'describe', val)" type="textarea" :rows="2"
                    placeholder="请输入任务描述" size="small" class="task-describe-input" />
                  <div class="task-files" v-if="getTaskFiles(task).length > 0">
                    <div class="task-file-item" v-for="(file, idx) in getTaskFiles(task)" :key="idx">
                      <el-link @click="downloadAttachment(file)" type="primary" style="cursor: pointer;">
                        <el-icon style="margin-right: 4px;">
                          <Download />
                        </el-icon>
                        {{ file.name }}
                      </el-link>
                    </div>
                  </div>
                </div>
              </div>
            </el-card>
          </div>
        </div>

        <!-- 子层级列表（如果这个需求节点下还有子需求） -->
        <div
          v-if="isRequirement && hasChildRequirements && getFolderChildren && Object.keys(getFolderChildren).length > 0"
          class="child-requirements">
          <div class="child-requirements-header">
            <span class="child-requirements-title">子需求</span>
          </div>
          <div class="child-requirements-content">
            <RequirementSection v-for="(childValue, childKey) in getFolderChildren"
              :key="`child_${getCurrentPath()}_${String(childKey)}_${childValue?._id || childKey}`"
              :ref="(el) => setChildRef(el, String(childKey))" :node-key="String(childKey)" :node-data="childValue"
              :parent-path="getCurrentPath()" :project-id="projectId" :project-name="projectName"
              :selected-path="selectedPath" @add="handleAdd" @edit="handleEdit" @delete="handleDelete"
              @refresh="handleRefresh" @select="handleSelect" />
          </div>
        </div>
      </el-card>
    </div>

    <!-- 如果是文件夹（嵌套对象） -->
    <div v-else>
      <!-- 如果不是根文件夹，显示文件夹结构 -->
      <div class="folder-section">
        <div class="folder-header">
          <!-- 如果有_id和需求名，显示需求名，否则显示节点key -->
          <span class="folder-name">
            {{ props.nodeData.需求名 || props.nodeData.name || getDisplayName() }}
          </span>
          <el-tag v-if="props.nodeData.状态" :type="getStatusTagType(props.nodeData.状态)" size="small"
            style="margin-left: 8px">
            {{ props.nodeData.状态 }}
          </el-tag>
          <el-button type="text" @click="isExpanded = !isExpanded" class="expand-button">
            <el-icon style="margin-right: 4px">
              <ArrowUp v-if="isExpanded" />
              <ArrowDown v-else />
            </el-icon>
            {{ isExpanded ? '收起' : '展开' }}
          </el-button>
        </div>
        <div v-show="isExpanded" class="folder-content">
          <RequirementSection v-for="(childValue, childKey) in getFolderChildren"
            :key="`folder_${getCurrentPath()}_${String(childKey)}_${childValue?._id || childKey}`"
            :ref="(el) => setChildRef(el, String(childKey))" :node-key="String(childKey)" :node-data="childValue"
            :parent-path="getCurrentPath()" :project-id="projectId" :project-name="projectName"
            :project-creator="projectCreator" :selected-path="selectedPath" @add="handleAdd" @edit="handleEdit"
            @delete="handleDelete" @refresh="handleRefresh" @select="handleSelect" />
        </div>
      </div>
    </div>

    <!-- 需求 Drawer -->
    <RequirementDrawer :visible="showRequirementDrawer" :project-id="projectId" :project-name="projectName"
      :project-creator="projectCreator" :requirement="currentRequirement"
      :parent-path="currentRequirement ? undefined : getCurrentPath()" @update:visible="showRequirementDrawer = $event"
      @refresh="handleRequirementRefresh" />

    <!-- 任务 Drawer -->
    <TaskDrawer :visible="showTaskDrawer" :project-id="projectId" :requirement-id="currentTaskRequirementId"
      :requirement-name="currentTaskRequirementName" :task="currentTask"
      :parent-path="currentTask ? undefined : getCurrentPath()" @update:visible="showTaskDrawer = $event"
      @refresh="handleTaskRefresh" />
  </div>
</template>

<script setup lang="ts">
import { computed, ref, reactive } from "vue";
import { ArrowUp, ArrowDown, Download } from "@element-plus/icons-vue";
import { ElMessage } from "element-plus";
import { TaskStatus } from "@/types";
import { updateTask, uploadFile } from "@/api/project";
import type { UploadRequestOptions } from "element-plus";
import RequirementDrawer from "./RequirementDrawer.vue";
import TaskDrawer from "./TaskDrawer.vue";
import { useUserStoreHook } from "@/store/modules/user";

const userStore = useUserStoreHook();

const props = defineProps<{
  nodeKey: string;
  nodeData: any;
  parentPath?: string;
  projectId?: string;
  projectName?: string;
  projectCreator?: string;
  selectedPath?: string;
}>();

const emit = defineEmits<{
  add: [type: "requirement" | "task", data: any, parentPath: string];
  edit: [type: "requirement" | "task", data: any];
  delete: [type: "requirement" | "task", id: string, name: string];
  refresh: [];
  select: [path: string, requirement: any];
}>();

// 存储子组件的引用（用于递归收集数据）
const childRefs = ref<Record<string, any>>({});

// 设置子组件引用
const setChildRef = (el: any, key: string) => {
  if (el) {
    childRefs.value[key] = el;
  }
};

// 是否为根节点（无 parentPath）
const isRootSection = computed(() => {
  const result = !props.parentPath;
  return result;
});

// 是否为层级类型层（软件任务、硬件任务、结构任务）
const isRequirementTypeLayer = computed(() => {
  const requirementTypes = ["软件任务", "硬件任务", "结构任务"];
  return requirementTypes.includes(props.nodeKey);
});

// Drawer 控制
const showRequirementDrawer = ref(false);
const showTaskDrawer = ref(false);
const currentRequirement = ref<any>(null);
const currentTask = ref<any>(null);
const currentTaskRequirementId = ref<string>("");
const currentTaskRequirementName = ref<string>("");

// 文件夹展开/收起状态Y

const isExpanded = ref(true);
// 任务列表展开/收起状态
const isTasksExpanded = ref(true);

// 判断是否是需求（有 _id 和 需求名 字段，且不是数组）
// 修改逻辑：只要有 _id 和 需求名，就认为是需求节点，即使它有子需求
const isRequirement = computed(() => {
  const data = props.nodeData;
  if (!data || typeof data !== "object" || Array.isArray(data)) {
    return false;
  }

  const hasId = "_id" in data && typeof data._id === "string" && data._id.length > 0;
  const hasName = "需求名" in data && typeof data.需求名 === "string" && data.需求名.length > 0;

  // 只要有 _id 和 需求名，就是需求节点
  return hasId && hasName;
});

// 检查是否有子需求（用于在需求节点下额外渲染子需求）
const hasChildRequirements = computed(() => {
  // 如果当前节点不是需求节点，不应该检查子需求
  if (!isRequirement.value) {
    return false;
  }

  const data = props.nodeData;
  if (!data || typeof data !== "object" || Array.isArray(data)) {
    return false;
  }

  // 检查是否有子节点是需求（有_id和需求名）
  const foundChildRequirements: string[] = [];
  for (const key in data) {
    if (Object.prototype.hasOwnProperty.call(data, key)) {
      const value = data[key];

      // 跳过一些已知的非子节点属性
      const excludeKeys = [
        "_id", "需求名", "describe", "状态", "优先级", "project_id",
        "project_name", "creator", "attachment", "create_time", "进度",
        "task_list", "当前处理人", "指派人", "指派给", "审阅人", "测试人",
        "need_assign", "next_state", "预计工时", "已用工时", "upload_file",
        "备注", "历史记录"
      ];

      if (excludeKeys.includes(key)) {
        continue;
      }

      if (value && typeof value === "object" && !Array.isArray(value)) {
        // 检查这个子节点是否有_id和需求名（必须是真正的需求节点）
        const hasId = "_id" in value && typeof value._id === "string" && value._id.length > 0;
        const hasName = "需求名" in value && typeof value.需求名 === "string" && value.需求名.length > 0;
        if (hasId && hasName) {
          foundChildRequirements.push(key);
        }
      }
    }
  }

  // 调试日志：如果发现子需求，打印详细信息
  if (process.env.NODE_ENV === 'development' && foundChildRequirements.length > 0) {
    console.warn(`[RequirementSection] ${props.nodeKey} (需求节点) 发现子需求:`, {
      nodeKey: props.nodeKey,
      parentPath: props.parentPath,
      foundChildRequirements,
      allDataKeys: Object.keys(data),
      nodeData: data
    });
  }

  return foundChildRequirements.length > 0;
});
const getCurrentPath = () => {
  if (props.parentPath) {
    return `${props.parentPath}/${props.nodeKey}`;
  }
  return props.nodeKey;
};

// 判断一个值是否是需求节点
const isRequirementNode = (value: any): boolean => {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    return false;
  }
  const hasId = "_id" in value && typeof value._id === "string" && value._id.length > 0;
  const hasName = "需求名" in value && typeof value.需求名 === "string" && value.需求名.length > 0;
  return hasId && hasName;
};

// 获取文件夹的有效子节点
const getFolderChildren = computed(() => {
  const data = props.nodeData;

  if (!data || typeof data !== "object" || Array.isArray(data)) {
    return {};
  }

  // 元数据字段列表，这些字段不应该被当作子节点
  const metadataFields = new Set([
    '_id',
    '需求名',
    'task_list',
    'describe',
    '状态',
    '优先级',
    '当前处理人',
    'project_name',
    'project_id',
    'creator',
    'attachment',
    'create_time',
    '进度',
    'requirement_id',
    'requirement_name',
    '指派人',
    '指派给',
    '审阅人',
    '测试人',
    'need_assign',
    'next_state',
    '预计工时',
    '已用工时',
    'upload_file',
    '备注',
    '历史记录'
  ]);

  const children: Record<string, any> = {};
  for (const key in data) {
    if (Object.prototype.hasOwnProperty.call(data, key)) {
      // 跳过元数据字段
      if (metadataFields.has(key)) {
        continue;
      }

      const value = data[key];
      // 只包含对象类型的值
      if (
        value &&
        typeof value === "object" &&
        !Array.isArray(value) &&
        value !== null &&
        typeof value !== "function"
      ) {
        // 如果当前节点是需求节点，只包含真正的子需求（有_id和需求名）
        // 如果当前节点是文件夹，包含所有子对象（让子组件自己判断）
        if (isRequirement.value) {
          // 需求节点：只包含真正的子需求（必须有_id和需求名）
          const hasId = "_id" in value && typeof value._id === "string" && value._id.length > 0;
          const hasName = "需求名" in value && typeof value.需求名 === "string" && value.需求名.length > 0;
          if (hasId && hasName) {
            children[key] = value;
          }
        } else {
          // 文件夹节点：包含所有子对象（可能是需求节点，也可能是文件夹）
          children[key] = value;
        }
      }
    }
  }



  return children;
});

// 获取显示名称
const getDisplayName = () => {
  return props.nodeKey;
};

// 获取任务显示名称
const getTaskDisplayName = (taskName: string) => {
  if (!taskName) return "";
  if (typeof taskName === "string" && taskName.includes("/")) {
    return taskName.split("/").pop() || taskName;
  }
  return taskName;
};

// 状态别名映射（与 TaskStatusFlowDialog.vue 保持一致）
const statusAliasMap: Record<string, TaskStatus> = {
  待分配给部门负责人: TaskStatus.PENDING_ASSIGN_TO_DEPT_LEADER,
  待分配给部门主管: TaskStatus.PENDING_ASSIGN_TO_DEPT_LEADER,
  待指派给成员: TaskStatus.PENDING_ASSIGN_TO_MEMBER,
  待开始: TaskStatus.NOT_STARTED,
  任务未开始: TaskStatus.NOT_STARTED,
  进行中: TaskStatus.IN_PROGRESS,
  任务进行中: TaskStatus.IN_PROGRESS,
  待测试: TaskStatus.PENDING_TEST,
  测试中: TaskStatus.TESTING,
  测试完毕: TaskStatus.TEST_COMPLETED,
  待审阅: TaskStatus.PENDING_REVIEW,
  审阅中: TaskStatus.REVIEWING,
  审阅完毕: TaskStatus.REVIEW_COMPLETED,
  已取消: TaskStatus.CANCELLED,
  取消: TaskStatus.CANCELLED,
  已完成: TaskStatus.COMPLETED
};

// 标准化状态（与 TaskStatusFlowDialog.vue 保持一致）
const normalizeStatus = (status: string): TaskStatus | "" => {
  if (!status) return "";
  if (Object.values(TaskStatus).includes(status as TaskStatus)) {
    return status as TaskStatus;
  }
  return statusAliasMap[status] || "";
};

// 获取状态标签类型（与 TaskStatusFlowDialog.vue 保持一致）
const getStatusTagType = (
  status: string
): "success" | "info" | "warning" | "danger" | undefined => {
  const normalized = normalizeStatus(status);
  if (!normalized) return undefined;
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
  return map[normalized] || undefined;
};

// 处理选中事件传递
const handleSelect = (path: string, requirement: any) => {
  emit("select", path, requirement);
};

// 处理需求卡片点击（选中）
const handleRequirementClick = () => {
  if (isRequirement.value) {
    const path = getCurrentPath();
    emit("select", path, props.nodeData);
  }
};

const handleAddTask = () => {
  if (isRequirement.value && props.nodeData) {
    currentTaskRequirementId.value = props.nodeData._id || "";
    currentTaskRequirementName.value = props.nodeData.需求名 || "";
  }
  currentTask.value = null;
  showTaskDrawer.value = true;
};

const handleEditRequirement = () => {
  if (!isRequirement.value || !props.nodeData) return;
  currentRequirement.value = {
    id: props.nodeData._id,
    title: props.nodeData.需求名,
    describe: props.nodeData.describe || [],
    status: props.nodeData.状态,
    priority: props.nodeData.优先级 || "",
    projectId: props.nodeData.project_id,
    creatorId: props.nodeData.creator,
    createdAt: props.nodeData.create_time,
    attachment: props.nodeData.attachment || []
  };
  showRequirementDrawer.value = true;
};

// 编辑中的任务数据
const editingTasks = reactive<Record<string, { task_name: string; describe: string }>>({});
// 正在保存的任务ID
const savingTaskId = ref<string>("");
// 正在上传文件的任务ID
const uploadingTaskId = ref<string>("");

// 获取任务描述文本（从 describe[0].content 中获取，如果 type==="text"）
const getTaskDescribeText = (task: any): string => {
  if (!task.describe || !Array.isArray(task.describe) || task.describe.length === 0) {
    return "";
  }
  const firstItem = task.describe[0];
  if (firstItem && firstItem.type === "text" && firstItem.content) {
    return firstItem.content;
  }
  return "";
};

// 获取编辑中的任务名
const getEditingTaskName = (task: any): string => {
  const taskId = task._id || task.id;
  if (editingTasks[taskId]) {
    return editingTasks[taskId].task_name;
  }
  return task.任务名 || "";
};

// 获取编辑中的任务描述
const getEditingTaskDescribe = (task: any): string => {
  const taskId = task._id || task.id;
  if (editingTasks[taskId]) {
    return editingTasks[taskId].describe;
  }
  return getTaskDescribeText(task);
};

// 获取附件完整URL（用于下载）
const getAttachmentUrl = (path: string): string => {
  // 如果已经是完整 URL，直接返回
  if (path.startsWith("http://") || path.startsWith("https://")) {
    return path;
  }

  // 使用环境变量 VITE_GLOB_API_URL 拼接附件 URL
  const baseUrl = import.meta.env.VITE_GLOB_API_URL || "";
  if (!baseUrl) {
    return path;
  }

  // 规范化 baseUrl（去除末尾的斜杠）
  const normalizedBaseUrl = baseUrl.endsWith("/")
    ? baseUrl.slice(0, -1)
    : baseUrl;

  // 规范化 path（确保以斜杠开头）
  let normalizedPath = path;
  if (!normalizedPath.startsWith("/")) {
    normalizedPath = "/" + normalizedPath;
  }

  return normalizedBaseUrl + normalizedPath;
};

// 从路径中提取文件名
const getFileNameFromPath = (path: string): string => {
  if (!path) return "未知文件";
  const parts = path.split("/").filter(Boolean);
  const fileName = parts[parts.length - 1] || "未知文件";

  // 如果文件名包含 "-"，截取第一个 "-" 后的内容
  const dashIndex = fileName.indexOf("-");
  if (dashIndex !== -1 && dashIndex < fileName.length - 1) {
    return fileName.substring(dashIndex + 1);
  }

  return fileName;
};

// 获取任务文件列表（从 attachment 数组中获取）
const getTaskFiles = (task: any) => {
  if (!task || !task.attachment) return [];
  if (!Array.isArray(task.attachment)) return [];

  // attachment 可能是字符串数组或对象数组
  return task.attachment.map((item: any, index: number) => {
    let filePath = "";
    let fileName = `文件${index + 1}`;

    if (typeof item === "string") {
      filePath = item;
      fileName = getFileNameFromPath(item);
    } else if (item && typeof item === "object" && item.url) {
      filePath = item.url;
      fileName = item.name || getFileNameFromPath(item.url);
    } else {
      return null;
    }

    // 获取完整的下载URL
    const fullUrl = getAttachmentUrl(filePath);
    return { url: fullUrl, name: fileName, originalPath: filePath };
  }).filter((item: any) => item !== null);
};

// 下载附件
const downloadAttachment = (file: { url: string; name: string }) => {
  const link = document.createElement("a");
  link.href = file.url;
  link.download = file.name;
  link.target = "_blank";
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
};

// 更新编辑中的任务数据
const updateEditingTask = (task: any, field: 'task_name' | 'describe', value: string) => {
  const taskId = task._id || task.id;
  if (!editingTasks[taskId]) {
    editingTasks[taskId] = {
      task_name: task.任务名 || "",
      describe: getTaskDescribeText(task)
    };
  }
  editingTasks[taskId][field] = value;
};

// 保存任务
const handleSaveTask = async (task: any) => {
  const taskId = task._id || task.id;
  if (!taskId) {
    ElMessage.error("任务ID不存在");
    return;
  }

  const editingTask = editingTasks[taskId];
  if (!editingTask) {
    ElMessage.warning("没有修改内容");
    return;
  }

  savingTaskId.value = taskId;
  try {
    // 构建 describe 数组，保持原有结构，只更新第一个 type==="text" 的 content
    const describe = task.describe || [];
    const updatedDescribe = [...describe];
    if (updatedDescribe.length > 0 && updatedDescribe[0].type === "text") {
      updatedDescribe[0] = {
        ...updatedDescribe[0],
        content: editingTask.describe
      };
    } else {
      // 如果没有 describe 或第一个不是 text 类型，添加新的
      updatedDescribe.unshift({
        type: "text",
        content: editingTask.describe
      });
    }

    const response = await updateTask({
      task_id: taskId,
      task_name: editingTask.task_name,
      describe: updatedDescribe,
      priority: task.优先级 || task.priority || "",
      estimated_time: task.预计工时 || task.estimated_time || 0,
      attachment: task.attachment || [],
      default_person: task.默认负责人 || task.default_person || ""
    });

    if (response.code === 200) {
      ElMessage.success("任务保存成功");
      // 更新本地数据
      task.任务名 = editingTask.task_name;
      if (task.describe && task.describe.length > 0 && task.describe[0].type === "text") {
        task.describe[0].content = editingTask.describe;
      } else {
        task.describe = [{ type: "text", content: editingTask.describe }];
      }
      // 清除编辑状态
      delete editingTasks[taskId];
      // 触发刷新
      emit("refresh");
    } else {
      ElMessage.error(response.message || "任务保存失败");
    }
  } catch (error: any) {
    console.error("保存任务失败:", error);
    ElMessage.error(
      error?.response?.data?.message || error?.message || "任务保存失败"
    );
  } finally {
    savingTaskId.value = "";
  }
};

// 处理任务文件上传
const handleTaskUpload = async (task: any, options: UploadRequestOptions) => {
  const taskId = task._id || task.id;
  if (!taskId) {
    ElMessage.error("任务ID不存在");
    options.onError?.(new Error("任务ID不存在") as any);
    return;
  }

  const file = options.file as File;
  uploadingTaskId.value = taskId;

  try {
    const uploadRes = await uploadFile({ file });
    if (!uploadRes || uploadRes.code !== 200 || !uploadRes.url) {
      throw new Error((uploadRes as any)?.message || "文件上传失败");
    }

    // 组装新的 attachment 数组，追加文件URL
    const updatedAttachment = Array.isArray(task.attachment) ? [...task.attachment] : [];
    updatedAttachment.push(uploadRes.url);

    // 获取当前的 describe（保持原有结构）
    const currentDescribe = Array.isArray(task.describe) ? [...task.describe] : [];
    // 如果 describe 为空，至少保留一个 text 类型的描述
    if (currentDescribe.length === 0) {
      currentDescribe.push({
        type: "text",
        content: getEditingTaskDescribe(task) || ""
      });
    }

    const response = await updateTask({
      task_id: taskId,
      task_name: getEditingTaskName(task),
      describe: currentDescribe,
      priority: task.优先级 || task.priority || "",
      estimated_time: task.预计工时 || task.estimated_time || 0,
      attachment: updatedAttachment,
      default_person: task.默认负责人 || task.default_person || ""
    });

    if (response.code === 200) {
      ElMessage.success("文件上传成功");
      // 更新本地数据
      task.attachment = updatedAttachment;
      options.onSuccess?.(response as any);
      emit("refresh");
    } else {
      throw new Error(response.message || "文件上传失败");
    }
  } catch (error: any) {
    console.error("文件上传失败:", error);
    ElMessage.error(error?.message || "文件上传失败");
    options.onError?.(error as any);
  } finally {
    uploadingTaskId.value = "";
  }
};

const handleEditTask = (task: any) => {
  currentTask.value = task;
  currentTaskRequirementId.value = task.requirement_id || props.nodeData._id || "";
  currentTaskRequirementName.value = task.requirement_name || props.nodeData.需求名 || "";
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
};

// 递归获取当前显示的数据（包括编辑中的值和所有子节点）
const getCurrentData = (): any => {
  const data = JSON.parse(JSON.stringify(props.nodeData));

  // 如果是需求节点且有任务列表，合并编辑中的任务数据
  if (isRequirement.value && data.task_list && Array.isArray(data.task_list)) {
    data.task_list = data.task_list.map((task: any) => {
      const taskId = task._id || task.id;
      if (editingTasks[taskId]) {
        // 合并编辑中的任务名和描述
        const updatedTask = { ...task };
        updatedTask.任务名 = editingTasks[taskId].task_name;

        // 更新 describe 数组
        if (updatedTask.describe && Array.isArray(updatedTask.describe) && updatedTask.describe.length > 0) {
          if (updatedTask.describe[0].type === "text") {
            updatedTask.describe[0] = {
              ...updatedTask.describe[0],
              content: editingTasks[taskId].describe
            };
          } else {
            updatedTask.describe.unshift({
              type: "text",
              content: editingTasks[taskId].describe
            });
          }
        } else {
          updatedTask.describe = [{
            type: "text",
            content: editingTasks[taskId].describe
          }];
        }

        return updatedTask;
      }
      return task;
    });
  }

  // 如果有子需求（无论是否是需求节点），需要递归处理所有子节点
  if (hasChildRequirements.value) {
    const folderChildren = getFolderChildren.value;
    for (const key in folderChildren) {
      if (Object.prototype.hasOwnProperty.call(folderChildren, key)) {
        // 尝试从子组件的 ref 获取当前数据
        const childRef = childRefs.value[key];
        if (childRef && typeof childRef.getCurrentData === "function") {
          // 递归获取子组件的数据（包括编辑中的值）
          data[key] = childRef.getCurrentData();
        }
      }
    }
  }

  // 如果不是需求节点（纯文件夹），需要递归处理所有子节点
  if (!isRequirement.value && data && typeof data === "object" && !Array.isArray(data)) {
    const result: any = {};
    for (const key in data) {
      if (Object.prototype.hasOwnProperty.call(data, key)) {
        const value = data[key];
        // 尝试从子组件的 ref 获取当前数据
        const childRef = childRefs.value[key];
        if (childRef && typeof childRef.getCurrentData === "function") {
          // 递归获取子组件的数据（包括编辑中的值）
          result[key] = childRef.getCurrentData();
        } else {
          // 如果没有 ref，使用原始数据
          result[key] = value;
        }
      }
    }
    return result;
  }

  return data;
};

// 暴露方法供父组件调用
defineExpose({
  getCurrentData
});
</script>

<style scoped lang="scss">
.requirement-section {
  margin-bottom: 16px;

  &:last-child {
    margin-bottom: 0;
  }
}

.requirement-card {
  margin-bottom: 16px;

  &:last-child {
    margin-bottom: 0;
  }

  :deep(.el-card) {
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.04);
    border: 1px solid #e4e7ed;
    border-radius: 8px;
    transition: all 0.2s ease;

    &:hover {
      box-shadow: 0 4px 12px rgba(0, 0, 0, 0.08);
    }

    .el-card__header {
      padding: 16px 20px;
      background-color: #fafbfc;
      border-bottom: 1px solid #e4e7ed;
    }

    .el-card__body {
      padding: 20px;
    }
  }

  .card-header {
    display: flex;
    justify-content: space-between;
    align-items: center;

    .header-left {
      display: flex;
      align-items: center;
      flex: 1;

      .requirement-name {
        font-weight: 600;
        font-size: 16px;
        color: #303133;
        margin-right: 8px;
      }
    }

    .header-actions {
      display: flex;
      gap: 8px;
    }
  }

  .requirement-info {
    margin-bottom: 20px;
    padding-bottom: 16px;
    border-bottom: 1px solid #f0f0f0;

    .info-description {
      margin: 12px 0;
      color: #606266;
      font-size: 14px;
      line-height: 1.8;

      .description-item {
        margin-bottom: 12px;

        .description-text {
          margin: 0;
          white-space: pre-wrap;
        }

        .description-image {
          max-width: 400px;
          max-height: 300px;
          border-radius: 4px;
          box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
        }
      }
    }

    .info-progress {
      display: flex;
      align-items: center;
      margin-top: 12px;
      font-size: 14px;
      color: #606266;
    }
  }

  .task-list {

    .task-list-header {
      margin-bottom: 16px;

      h4 {
        margin: 0;
        font-size: 16px;
        font-weight: 600;
        color: #303133;
      }
    }

    .task-grid {
      display: grid;
      grid-template-columns: repeat(4, 1fr);
      gap: 12px;

      @media (max-width: 1600px) {
        grid-template-columns: repeat(3, 1fr);
      }

      @media (max-width: 1200px) {
        grid-template-columns: repeat(2, 1fr);
      }

      @media (max-width: 800px) {
        grid-template-columns: 1fr;
      }
    }

    .task-card {
      transition: all 0.2s ease;

      &:hover {
        transform: translateY(-2px);
        box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
      }

      :deep(.el-card__body) {
        padding: 12px;
      }

      .task-card-header {
        display: flex;
        justify-content: flex-start;
        align-items: center;
        margin-bottom: 16px;
        padding: 0;
        gap: 12px;

        .task-name-wrapper {
          display: inline-flex;
          align-items: center;
          gap: 0;
          padding: 8px 12px;
          background-color: #fafafa;
          border-left: 4px solid #409eff;
          border-radius: 6px;
          width: fit-content;

          .task-name-badge {
            font-size: 11px;
            color: #ffffff;
            font-weight: 600;
            background: linear-gradient(135deg, #409eff 0%, #66b1ff 100%);
            padding: 4px 10px;
            border-radius: 12px;
            white-space: nowrap;
            flex-shrink: 0;
            box-shadow: 0 2px 4px rgba(64, 158, 255, 0.2);
            letter-spacing: 0.5px;
          }

          .task-name-input {
            max-width: 200px;
            flex-shrink: 1;

            :deep(.el-input__wrapper) {
              background-color: #ffffff;
              border: 2px solid #409eff;
              border-radius: 6px;
              box-shadow: 0 2px 8px rgba(64, 158, 255, 0.15);
              transition: all 0.3s ease;

              &:hover {
                background-color: #f0f9ff;
                border-color: #66b1ff;
                box-shadow: 0 4px 12px rgba(64, 158, 255, 0.25);
                transform: translateY(-1px);
              }

              &.is-focus {
                background-color: #ffffff;
                border-color: #409eff;
                box-shadow: 0 0 0 3px rgba(64, 158, 255, 0.2);
                transform: translateY(-1px);
              }
            }

            :deep(.el-input__inner) {
              font-size: 14px;
              color: #303133;
              font-weight: 600;
            }
          }
        }

        .header-right {
          display: flex;
          align-items: center;
          gap: 8px;
          flex-shrink: 0;
          height: 100%;
        }
      }

      .task-card-content {
        margin-top: 0;
        padding: 12px;
        background: linear-gradient(135deg, #f0f9ff 0%, #e0f2fe 100%);
        border-radius: 6px;
        border: 1px solid #ebeef5;

        .task-describe-wrapper {
          display: flex;
          flex-direction: column;
          gap: 8px;

          .task-describe-badge {
            font-size: 11px;
            color: #606266;
            font-weight: 600;
            background-color: #f5f7fa;
            padding: 4px 10px;
            border-radius: 4px;
            border-left: 3px solid #909399;
            display: inline-block;
            width: fit-content;
            letter-spacing: 0.5px;
          }

          .task-describe-input {
            width: 100%;

            :deep(.el-textarea__inner) {
              background-color: #ffffff;
              border: 1px solid #dcdfe6;
              border-radius: 6px;
              font-size: 13px;
              color: #606266;
              line-height: 1.8;
              transition: all 0.3s ease;
              padding: 10px 12px;

              &:hover {
                border-color: #c0c4cc;
                background-color: #fafafa;
              }

              &:focus {
                border-color: #909399;
                background-color: #ffffff;
                box-shadow: 0 0 0 2px rgba(144, 147, 153, 0.1);
              }
            }
          }

          .task-files {
            display: flex;
            flex-wrap: wrap;
            gap: 8px;
            margin-top: 6px;

            .task-file-item {
              background-color: #f5f7fa;
              border: 1px solid #e4e7ed;
              border-radius: 4px;
              padding: 4px 8px;
              font-size: 12px;
              display: inline-flex;
              align-items: center;
              gap: 6px;

              :deep(.el-link) {
                font-size: 12px;
              }
            }
          }
        }
      }

      .task-card-content {
        .task-info-item {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 6px;
          font-size: 12px;

          &:last-child {
            margin-bottom: 0;
          }

          .task-label {
            color: #909399;
            font-weight: 500;
          }

          .task-value {
            color: #606266;
            font-weight: 500;
          }

          &.task-progress {
            flex-direction: column;
            align-items: flex-start;
            gap: 6px;

            .progress-wrapper {
              width: 100%;
              display: flex;
              align-items: center;
              gap: 6px;

              .progress-text {
                min-width: 40px;
                color: #606266;
                font-weight: 500;
                font-size: 12px;
              }

              .el-progress {
                flex: 1;
              }
            }
          }
        }
      }

      .task-card-footer {
        margin-top: 8px;
        padding-top: 8px;
        border-top: 1px solid #f0f0f0;
        text-align: right;
      }
    }
  }

  .empty-tasks {
    margin-top: 20px;
    padding: 40px 0;
  }

  .child-requirements {
    margin-top: 20px;
    padding-top: 16px;
    border-top: 2px dashed #e4e7ed;

    .child-requirements-header {
      margin-bottom: 16px;
      padding-left: 8px;

      .child-requirements-title {
        font-size: 14px;
        font-weight: 600;
        color: #606266;
        background: linear-gradient(135deg, #f0f9ff 0%, #e0f2fe 100%);
        padding: 6px 14px;
        border-radius: 6px;
        border-left: 4px solid #409eff;
        display: inline-block;
      }
    }

    .child-requirements-content {
      padding-left: 0;
    }
  }
}

.folder-section {
  margin-bottom: 16px;

  // 嵌套的文件夹才有左边距和边框

  &:last-child {
    margin-bottom: 0;
  }

  .folder-header {
    display: flex;
    align-items: center;
    padding: 10px 14px;
    background-color: #f8f9fa;
    border: 1px solid #e4e7ed;
    border-radius: 6px;
    margin-bottom: 12px;
    cursor: pointer;
    transition: all 0.2s ease;

    &:hover {
      background-color: #f0f9ff;
      border-color: #c6e2ff;
    }

    .folder-name {
      font-weight: 600;
      font-size: 15px;
      color: #303133;
      flex: 1;
    }

    .expand-button,
    .collapse-button {
      color: #606266;
      font-size: 13px;
      padding: 4px 8px;
      border-radius: 4px;
      transition: all 0.2s ease;

      &:hover {
        color: #409eff;
        background-color: #f0f9ff;
      }
    }
  }

  .folder-content {
    padding-left: 8px;
  }
}

// 移动端适配 (640px)
@media (max-width: 640px) {
  .requirement-section {
    padding: 12px;

    .section-header {
      flex-direction: column;
      align-items: flex-start;
      gap: 8px;
      margin-bottom: 12px;

      .header-actions {
        width: 100%;
        flex-direction: column;
        gap: 8px;

        .el-button {
          width: 100%;
        }
      }
    }

    .requirement-list {
      .requirement-item {
        padding: 12px;
        margin-bottom: 12px;

        .requirement-title {
          font-size: 14px;
        }

        .requirement-meta {
          flex-wrap: wrap;
          gap: 8px;
          font-size: 11px;
        }
      }
    }
  }
}
</style>
