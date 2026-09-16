<template>
  <el-drawer v-model="drawerVisible" :title="isEdit ? '编辑任务' : '新建任务'" size="600px" direction="rtl"
    @close="handleClose">
    <div class="task-drawer">
      <el-form ref="formRef" :model="taskForm" :rules="rules" label-width="132px" label-position="left">
        <el-form-item label="任务名称" prop="task_name">
          <el-input v-model="taskForm.task_name" placeholder="请输入任务名称" maxlength="100" show-word-limit
            :disabled="isEdit && !canEditAllFields" />
        </el-form-item>
        <el-form-item label="一级节点" prop="requirement_id">
          <el-select v-model="taskForm.requirement_id" placeholder="选择层级" clearable style="width: 100%"
            :disabled="isEdit || !taskForm.project_id || requirementsLoading" :loading="requirementsLoading"
            @change="handleRequirementChange">
            <el-option v-for="requirement in requirements" :key="requirement.id" :label="requirement.requirement_name"
              :value="requirement.id" />
          </el-select>
        </el-form-item>
        <el-form-item label="部门" prop="department" required>
          <el-select v-model="taskForm.department" placeholder="请选择部门" clearable filterable style="width: 100%"
            :loading="departmentsLoading" :disabled="isEdit && !canEditAllFields">
            <el-option v-for="dept in departmentOptions" :key="dept" :label="dept" :value="dept" />
          </el-select>
        </el-form-item>
        <el-form-item v-if="showDefaultPersonField" label="默认部门负责人" prop="default_person">
          <el-tree-select v-model="taskForm.default_person" placeholder="请选择默认部门负责人" :loading="departmentLeadersLoading"
            filterable check-strictly default-expand-all :data="departmentLeadersTree" :props="treeSelectProps"
            node-key="value" :render-after-expand="false" style="width: 100%" clearable />
        </el-form-item>
        <el-form-item label="任务描述" prop="describe">
          <RichTextEditor ref="richTextEditorRef" v-model="taskForm.describe" :disable-image-upload="true"
            :readonly="!canEditDescribeAndAttachment" />
        </el-form-item>

        <el-form-item label="选择项目" prop="project_id">
          <el-select v-model="taskForm.project_id" placeholder="选择项目" clearable style="width: 100%" :disabled="isEdit"
            :loading="projectsLoading" @change="handleProjectChange">
            <el-option v-for="project in projectOptions" :key="project.id" :label="project.name" :value="project.id" />
          </el-select>
        </el-form-item>



        <el-form-item label="优先级" prop="priority">
          <el-select v-model="taskForm.priority" placeholder="选择优先级" clearable style="width: 30%"
            :disabled="isEdit && !canEditAllFields">
            <el-option label="正常" value="正常">
              <el-tag type="warning" size="small">正常</el-tag>
            </el-option>
            <el-option label="紧急" value="紧急">
              <el-tag type="danger" size="small">紧急</el-tag>
            </el-option>
          </el-select>
        </el-form-item>

        <el-form-item label="任务完成期限" prop="task_deadline">
          <el-date-picker v-model="taskForm.task_deadline" type="date" placeholder="请选择任务完成期限" style="width: 50%"
            format="YYYY-MM-DD" value-format="YYYY-MM-DD" :disabled="isEdit && !canEditAllFields" />
        </el-form-item>

        <!-- 附件上传 -->
        <el-form-item label="任务附件">
          <el-upload v-model:file-list="fileList" multiple :auto-upload="false"
            :disabled="!canEditDescribeAndAttachment" :on-remove="handleFileRemove" :on-change="handleFileChange"
            :before-upload="handleBeforeUpload">
            <el-button type="primary">
              <el-icon>
                <Upload />
              </el-icon>
              选择文件
            </el-button>
            <template #tip>
              <div class="el-upload__tip">可以上传多个文件</div>
            </template>
          </el-upload>
        </el-form-item>
      </el-form>
    </div>

    <template #footer>
      <div class="drawer-footer">
        <div class="footer-right">
          <el-button @click="handleClose">取消</el-button>
          <el-button type="primary" :loading="submitting" @click="handleSubmit">
            {{ isEdit ? "保存" : "创建" }}
          </el-button>
        </div>
      </div>
    </template>
  </el-drawer>
</template>

<script setup lang="ts">
import { ref, computed, watch, reactive, nextTick } from "vue";
import { ElMessage, ElMessageBox } from "element-plus";
import { Upload } from "@element-plus/icons-vue";
import type {
  FormInstance,
  FormRules,
  UploadFile,
  UploadFiles
} from "element-plus";
import {
  createTask,
  updateTask,
  updateTaskDeadline,
  uploadFile,
  selectProjects,
  selectRequirements,
  flattenRequirementData,
  type CreateTaskParams,
  type UpdateTaskParams,
  type RequirementListItem
} from "@/api/project";
import { getDepartmentNameList, flattenDepartmentList, type DepartmentListItem } from "@/api/system";
import RichTextEditor from "@/components/RichTextEditor.vue";
import type { DescribeContent } from "@/types";
import { useUserStoreHook } from "@/store/modules/user";

interface Props {
  visible: boolean;
  requirementId?: string;
  requirementName?: string;
  projectId?: string;
  task?: any;
  projects?: any[]; // 项目列表（从搜索表单获取）
  parentPath?: string; // 父路径，用于新建任务时自动拼接路径
}

interface Emits {
  (e: "update:visible", value: boolean): void;
  (e: "refresh"): void;
}

const props = defineProps<Props>();
const emit = defineEmits<Emits>();

const formRef = ref<FormInstance>();
const richTextEditorRef = ref<InstanceType<typeof RichTextEditor>>();
const fileList = ref<UploadFile[]>([]);
const submitting = ref(false);
const deleting = ref(false);
const requirements = ref<any[]>([]);
const requirementsLoading = ref(false);
const projects = ref<Array<{ id: string; name: string }>>([]);
const projectsLoading = ref(false);
const departmentLeadersTree = ref<any[]>([]);
const departmentLeadersLoading = ref(false);
const departmentOptions = ref<string[]>([]);
const departmentsLoading = ref(false);
const treeSelectProps = {
  label: "label",
  children: "children",
  disabled: "disabled"
} as const;

// 将完整 URL 转换为相对路径（用于提交数据）
const convertToRelativePath = (url: string): string => {
  // 如果已经是相对路径，直接返回
  if (!url.startsWith("http://") && !url.startsWith("https://")) {
    return url;
  }

  try {
    const urlObj = new URL(url);
    return urlObj.pathname;
  } catch {
    return url;
  }
};

// 获取图片 URL（处理文件路径）
// 显示时：相对路径需要拼接 baseUrl 为完整 URL
const getImageUrl = (filePath: string): string => {
  // 如果已经是完整 URL，直接返回
  if (filePath.startsWith("http://") || filePath.startsWith("https://")) {
    return filePath;
  }

  // 使用环境变量 VITE_GLOB_API_URL 拼接图片 URL
  const baseUrl = import.meta.env.VITE_GLOB_API_URL || "";

  if (!baseUrl) {
    // 如果没有 baseUrl，返回原始路径
    return filePath;
  }

  // filePath 是相对路径（如 /data/xxx.png 或 data/xxx.png）
  let path = filePath;

  // 确保 path 以 / 开头（如果 baseUrl 不以 / 结尾）
  if (!path.startsWith("/")) {
    path = "/" + path;
  }

  // 拼接 baseUrl 和 path
  // 如果 baseUrl 以 / 结尾，去掉末尾的 /
  const normalizedBaseUrl = baseUrl.endsWith("/")
    ? baseUrl.slice(0, -1)
    : baseUrl;

  // 拼接：baseUrl + path（path 已经以 / 开头）
  return normalizedBaseUrl + path;
};

// 获取附件完整 URL（用于显示）
const getAttachmentUrl = (path: string): string => {
  // 如果已经是完整 URL，直接返回
  if (path.startsWith("http://") || path.startsWith("https://")) {
    return path;
  }

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
  if (!path) return "";
  const parts = path.split("/");
  return parts[parts.length - 1] || path;
};

/** 将日期统一为 YYYY-MM-DD，便于与列表字段比较 */
const normalizeDeadline = (value: string | undefined | null): string => {
  if (value === undefined || value === null) return "";
  const str = String(value).trim();
  if (!str) return "";
  if (str.includes("T")) return str.split("T")[0];
  if (str.includes(" ")) return str.split(" ")[0];
  return str.length >= 10 ? str.slice(0, 10) : str;
};

/** 从任务对象读取任务完成期限（与列表列 task_deadline 一致） */
const getTaskDeadlineFromTask = (task: any): string => {
  if (!task) return "";
  return normalizeDeadline(
    task.task_deadline ||
    task.task_dead_line ||
    task.任务完成期限 ||
    ""
  );
};

/** 编辑打开时的完成期限，用于判断是否调用 update_task_deadline */
const originalTaskDeadline = ref("");

const taskForm = reactive<{
  task_name: string;
  describe: DescribeContent[];
  project_id: string;
  requirement_id: string;
  requirement_name: string;
  priority: string;
  task_deadline: string;
  department?: string;
  default_person?: string;
  file_name?: string;
  files?: string[];
}>({
  task_name: "",
  describe: [] as DescribeContent[],
  project_id: "",
  requirement_id: "",
  requirement_name: "",
  priority: "正常",
  task_deadline: "",
  department: "",
  default_person: ""
});

const rules: FormRules = {
  task_name: [
    { required: true, message: "请输入任务名称", trigger: "blur" },
    {
      min: 2,
      max: 100,
      message: "任务名称长度在 2 到 100 个字符",
      trigger: "blur"
    }
  ],
  describe: [
    { required: true, message: "请输入任务描述", trigger: "blur" },
    {
      validator: (rule: any, value: any, callback: any) => {
        if (!value || (Array.isArray(value) && value.length === 0)) {
          callback(new Error("请输入任务描述"));
        } else {
          callback();
        }
      },
      trigger: "blur"
    }
  ],
  project_id: [
    { required: true, message: "请选择项目", trigger: "change" }
  ],
  requirement_id: [
    { required: true, message: "请选择所属层级", trigger: "change" }
  ],
  department: [
    { required: true, message: "请选择部门", trigger: "change" }
  ],

  priority: [{ required: true, message: "请选择优先级", trigger: "change" }],
  task_deadline: [
    { required: true, message: "请选择任务完成期限", trigger: "change" }
  ],
  default_person: [
    { required: true, message: "请选择默认部门负责人", trigger: "change" }
  ]
};

const drawerVisible = computed({
  get: () => props.visible,
  set: value => emit("update:visible", value)
});

const isEdit = computed(() => !!props.task);

const userStore = useUserStoreHook();
const userRoles = computed(() => userStore.roles || []);
const username = computed(() => userStore.username || "");
const isAdmin = computed(() => userRoles.value.includes("Admin"));
const isProjectManager = computed(() => userRoles.value.includes("ProjectManager"));
const isProjectDirector = computed(() => userRoles.value.includes("ProjectDirector"));
const canEditAllFields = computed(() => isAdmin.value || isProjectManager.value || isProjectDirector.value);
const currentHandler = computed(() => {
  const task = props.task || {};
  return task.current_handler || task.当前处理人 || task.assignee || "";
});
const canEditDescribeAndAttachment = computed(() => {
  if (canEditAllFields.value) return true;
  if (!isEdit.value) return true;
  const handler = currentHandler.value;
  return handler && username.value && handler === username.value;
});
const showDefaultPersonField = computed(() => canEditAllFields.value);

// 项目选项（从 API 获取）
const projectOptions = computed(() => {
  return projects.value;
});

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

// 加载层级列表
const loadRequirements = async (projectId: string) => {
  if (!projectId) {
    requirements.value = [];
    return;
  }

  requirementsLoading.value = true;
  try {
    const response = await selectRequirements({
      project_id: projectId,
      page: 1,
      page_size: 100 // 获取所有需求
    });

    if (response.code === 200 && response.result) {
      // 扁平化嵌套对象结构为数组
      const flattenedResult = flattenRequirementData(response.result);
      requirements.value = flattenedResult.map(
        (item: RequirementListItem): any => {
          return {
            id: item._id,
            requirement_name: item.需求名,
            project_id: item.project_id
          };
        }
      );

      // 层级列表加载完成后，如果是新建模式且有传入的 requirementId，尝试设置
      if (!props.task && props.requirementId) {
        await nextTick();
        console.log("层级列表加载完成，尝试设置 requirementId:", {
          requirementId: props.requirementId,
          requirementName: props.requirementName,
          requirementsCount: requirements.value.length,
          requirements: requirements.value.map((r: any) => ({ id: r.id, name: r.requirement_name }))
        });

        const matchedRequirement = requirements.value.find(
          (r: any) => r.id === props.requirementId || r._id === props.requirementId || String(r.id) === String(props.requirementId)
        );

        if (matchedRequirement) {
          console.log("找到匹配的层级:", matchedRequirement);
          taskForm.requirement_id = matchedRequirement.id;
          taskForm.requirement_name = matchedRequirement.requirement_name || props.requirementName || "";
        } else {
          console.log("未找到匹配的层级，使用传入的值");
          taskForm.requirement_id = props.requirementId;
          taskForm.requirement_name = props.requirementName || "";
        }
      }
    } else {
      ElMessage.error(response.message || "加载层级列表失败");
      requirements.value = [];
    }
  } catch (error: any) {
    console.error("加载层级列表失败:", error);
    ElMessage.error(
      error?.response?.data?.message || error?.message || "加载层级列表失败"
    );
    requirements.value = [];
  } finally {
    requirementsLoading.value = false;
  }
};

// 构建部门负责人树数据
const buildDepartmentLeadersTree = (data: DepartmentListItem[]): any[] => {
  if (!Array.isArray(data)) return [];
  return data.map((item, index) => {
    const departmentName = String(item.部门名 || "未分配部门");
    const managers = item.负责人 || [];
    const children: any[] = managers
      .filter(manager => manager && String(manager).trim())
      .map(manager => ({
        label: String(manager),
        value: String(manager)
      }));
    // 使用索引确保 value 的唯一性和有效性
    return {
      label: departmentName,
      value: `dept_${index}_${departmentName.replace(/[^a-zA-Z0-9\u4e00-\u9fa5]/g, '_')}`,
      disabled: true,
      children
    };
  });
};

// 加载部门列表（新建任务选部门）
const loadDepartmentOptions = async () => {
  departmentsLoading.value = true;
  try {
    const response = await getDepartmentNameList();
    if (response.code === 200 && response.result != null) {
      departmentOptions.value = flattenDepartmentList(response.result)
        .map(item => String(item.部门名 || "").trim())
        .filter(Boolean);
    } else {
      departmentOptions.value = [];
    }
  } catch (error: any) {
    console.error("加载部门列表失败:", error);
    departmentOptions.value = [];
  } finally {
    departmentsLoading.value = false;
  }
};

// 加载部门负责人列表
const loadDepartmentLeaders = async () => {
  if (!canEditAllFields.value) {
    // 非管理员/项目负责人不拉取部门负责人列表
    departmentLeadersTree.value = [];
    return;
  }
  departmentLeadersLoading.value = true;
  try {
    const response = await getDepartmentNameList();
    if (response.code === 200 && response.result != null) {
      departmentLeadersTree.value = buildDepartmentLeadersTree(
        flattenDepartmentList(response.result)
      );
    } else {
      ElMessage.error("加载部门负责人列表失败");
      departmentLeadersTree.value = [];
    }
  } catch (error: any) {
    console.error("加载部门负责人列表失败:", error);
    ElMessage.error(
      error?.response?.data?.message || error?.message || "加载部门负责人列表失败"
    );
    departmentLeadersTree.value = [];
  } finally {
    departmentLeadersLoading.value = false;
  }
};

// 处理项目变化
const handleProjectChange = async (projectId: string) => {
  // 项目变化时，清空需求选择
  taskForm.requirement_id = "";
  taskForm.requirement_name = "";

  // 加载新项目的层级列表
  if (projectId) {
    await loadRequirements(projectId);
  } else {
    requirements.value = [];
  }
};

// 处理需求变化
const handleRequirementChange = (requirementId: string) => {
  if (requirementId) {
    const requirement = requirements.value.find(r => r.id === requirementId);
    if (requirement) {
      taskForm.requirement_name = requirement.requirement_name;
    }
  } else {
    taskForm.requirement_name = "";
  }
};

// 重置表单
const resetForm = () => {
  Object.assign(taskForm, {
    task_name: "",
    describe: [] as DescribeContent[],
    project_id: props.projectId || "",
    requirement_id: props.requirementId || "",
    requirement_name: props.requirementName || "",
    priority: "正常",
    task_deadline: "",
    department: "",
    estimated_time: 1,
    default_person: ""
  });
  originalTaskDeadline.value = "";
  formRef.value?.clearValidate();
  fileList.value = [];
};

// 监听抽屉打开与任务数据，填充表单
watch(
  () => [props.visible, props.task?._id || props.task?.id] as const,
  ([visible]) => {
    if (!visible) return;

    if (projects.value.length === 0) {
      loadProjects();
    }
    if (departmentOptions.value.length === 0) {
      loadDepartmentOptions();
    }
    if (departmentLeadersTree.value.length === 0) {
      loadDepartmentLeaders();
    }
    if (props.task) {
      // 编辑模式：填充表单
      // 处理 describe：可能是字符串数组或 DescribeContent[]
      let describeContent: DescribeContent[] = [];
      if (props.task.describe) {
        if (Array.isArray(props.task.describe)) {
          // 检查是否是 DescribeContent[] 格式
          if (
            props.task.describe.length > 0 &&
            typeof props.task.describe[0] === "object" &&
            "type" in props.task.describe[0]
          ) {
            // 已经是 DescribeContent[] 格式，但需要确保图片 URL 是完整的
            describeContent = (props.task.describe as DescribeContent[]).map(
              item => {
                if (item.type === "url" && item.content) {
                  // 如果是图片 URL，确保是完整 URL（用于显示）
                  return {
                    ...item,
                    content: getImageUrl(item.content)
                  };
                }
                return item;
              }
            );
          } else {
            // 字符串数组，转换为 DescribeContent[]，需要判断是文本还是图片URL
            describeContent = (props.task.describe as string[]).map(
              (item: string) => {
                // 判断是文本还是图片URL
                const isImage =
                  (item.startsWith("http://") ||
                    item.startsWith("https://") ||
                    item.startsWith("/")) &&
                  /\.(jpg|jpeg|png|gif|webp|bmp|svg)(\?|$)/i.test(item);

                if (isImage) {
                  // 图片 URL，转换为完整 URL（用于显示）
                  return {
                    type: "url" as const,
                    content: getImageUrl(item)
                  };
                } else {
                  return {
                    type: "text" as const,
                    content: item
                  };
                }
              }
            );
          }
        } else if (typeof props.task.describe === "string") {
          // 单个字符串，按空格分割
          if (props.task.describe.trim()) {
            const parts = props.task.describe
              .split(" ")
              .filter(p => p.trim());
            describeContent = parts.map((item: string) => {
              const isImage =
                (item.startsWith("http://") ||
                  item.startsWith("https://") ||
                  item.startsWith("/")) &&
                /\.(jpg|jpeg|png|gif|webp|bmp|svg)(\?|$)/i.test(item);

              if (isImage) {
                return {
                  type: "url" as const,
                  content: getImageUrl(item)
                };
              } else {
                return {
                  type: "text" as const,
                  content: item
                };
              }
            });
          }
        }
      } else if (props.task.description) {
        // 兼容 description 字段
        if (Array.isArray(props.task.description)) {
          describeContent = (props.task.description as string[]).map(
            (item: string) => {
              const isImage =
                (item.startsWith("http://") ||
                  item.startsWith("https://") ||
                  item.startsWith("/")) &&
                /\.(jpg|jpeg|png|gif|webp|bmp|svg)(\?|$)/i.test(item);

              if (isImage) {
                return {
                  type: "url" as const,
                  content: getImageUrl(item)
                };
              } else {
                return {
                  type: "text" as const,
                  content: item
                };
              }
            }
          );
        } else if (typeof props.task.description === "string") {
          if (props.task.description.trim()) {
            const parts = props.task.description
              .split(" ")
              .filter(p => p.trim());
            describeContent = parts.map((item: string) => {
              const isImage =
                (item.startsWith("http://") ||
                  item.startsWith("https://") ||
                  item.startsWith("/")) &&
                /\.(jpg|jpeg|png|gif|webp|bmp|svg)(\?|$)/i.test(item);

              if (isImage) {
                return {
                  type: "url" as const,
                  content: getImageUrl(item)
                };
              } else {
                return {
                  type: "text" as const,
                  content: item
                };
              }
            });
          }
        }
      }

      const deadlineFromList = getTaskDeadlineFromTask(props.task);
      originalTaskDeadline.value = deadlineFromList;

      Object.assign(taskForm, {
        task_name: props.task.task_name || props.task.title || (props.task as any).任务名 || "",
        describe: describeContent,
        project_id:
          props.task.project_id ||
          props.task.projectId ||
          (props.task as any).project?._id ||
          props.projectId ||
          "",
        requirement_id:
          props.task.requirement_id ||
          props.task.requirementId ||
          props.requirementId ||
          "",
        requirement_name:
          props.task.requirement_name || props.requirementName || "",
        priority: props.task.priority || (props.task as any).优先级 || "正常",
        task_deadline: deadlineFromList,
        estimated_time:
          props.task.estimated_time ||
          props.task.estimatedHours ||
          (props.task as any).预计工时 ||
          0,
        default_person: props.task.default_person || (props.task as any).默认部门负责人 || "",
        department: props.task.department ? String(props.task.department) : ""
      });

      const currentDepartment = taskForm.department;
      if (currentDepartment && !departmentOptions.value.includes(currentDepartment)) {
        departmentOptions.value = [...departmentOptions.value, currentDepartment];
      }

      // 填充附件列表
      const files = props.task.files || props.task.attachment || [];
      if (Array.isArray(files) && files.length > 0) {
        fileList.value = files.map((filePath: string, index: number) => {
          const fileName = getFileNameFromPath(filePath);
          const fileUrl = getAttachmentUrl(filePath);
          return {
            name: fileName,
            url: fileUrl,
            status: "success" as const,
            uid: Date.now() + index,
            response: filePath
          } as UploadFile;
        });
      } else {
        fileList.value = [];
      }

      // 编辑模式：如果任务有项目ID，加载该项目的层级列表
      if (taskForm.project_id) {
        loadRequirements(taskForm.project_id);
      }
    } else {
      // 新建模式：如果传入了项目ID和需求ID，自动填充
      resetForm();
      console.log("新建模式，props:", {
        projectId: props.projectId,
        requirementId: props.requirementId,
        requirementName: props.requirementName
      });

      if (props.projectId) {
        taskForm.project_id = props.projectId;
        // 加载该项目的层级列表（loadRequirements 内部会处理 requirementId 的设置）
        loadRequirements(props.projectId);
      } else if (props.requirementId) {
        // 如果没有项目ID但有需求ID，先设置需求信息（后续选择项目时会加载层级列表）
        taskForm.requirement_id = props.requirementId;
        taskForm.requirement_name = props.requirementName || "";
      }
    }
  },
  { immediate: true }
);

// 监听 requirementId 和层级列表变化，在新建模式下自动设置
watch(
  () => ({
    requirementId: props.requirementId,
    requirementName: props.requirementName,
    projectId: props.projectId,
    requirementsLength: requirements.value.length,
    hasTask: !!props.task
  }),
  ({ requirementId, requirementName, projectId, requirementsLength, hasTask }) => {
    // 只在新建模式下处理（没有 task）
    if (!hasTask && requirementId && projectId && requirementsLength > 0) {
      // 尝试在层级列表中查找匹配的层级
      const matchedRequirement = requirements.value.find(
        (r: any) => r.id === requirementId || r._id === requirementId || String(r.id) === String(requirementId)
      );

      if (matchedRequirement) {
        // 如果找到了匹配的层级，使用层级列表中的 ID 和名称
        taskForm.requirement_id = matchedRequirement.id;
        taskForm.requirement_name = matchedRequirement.requirement_name || requirementName || "";
      } else {
        // 如果没有找到匹配的层级，使用传入的值
        taskForm.requirement_id = requirementId;
        taskForm.requirement_name = requirementName || "";
      }
    }
  },
  { immediate: false }
);

// 处理文件上传前（阻止自动上传）
const handleBeforeUpload = () => {
  return false; // 阻止自动上传，手动控制
};

// 处理文件变化
const handleFileChange = (file: UploadFile, files: UploadFiles) => {
  fileList.value = files;
};

// 处理文件移除
const handleFileRemove = (file: UploadFile, files: UploadFiles) => {
  fileList.value = files;
};

// 上传单个附件文件
const uploadAttachmentFile = async (file: File): Promise<string | null> => {
  try {
    const response = await uploadFile({ file });
    if (response.code === 200 && response.url) {
      return response.url;
    } else {
      ElMessage.error("附件上传失败");
      return null;
    }
  } catch (error: any) {
    console.error("上传附件失败:", error);
    ElMessage.error(
      error?.response?.data?.message || error?.message || "附件上传失败"
    );
    return null;
  }
};

const handleClose = () => {
  resetForm();
  fileList.value = [];
  drawerVisible.value = false;
};

const handleSubmit = async () => {
  if (!formRef.value) return;

  await formRef.value.validate(async valid => {
    if (valid) {
      // 验证必填字段
      if (!taskForm.requirement_id || !taskForm.requirement_name) {
        ElMessage.error("请选择所属层级");
        return;
      }

      if (
        !taskForm.describe ||
        (Array.isArray(taskForm.describe) && taskForm.describe.length === 0)
      ) {
        ElMessage.error("请输入任务描述");
        return;
      }

      submitting.value = true;
      try {
        // 获取富文本编辑器中的图片 URL（已上传的）
        const imageUrls = richTextEditorRef.value?.getImageUrls() || [];

        // 从 describe 中提取已有的图片 URL
        const existingImageUrls: string[] = [];
        taskForm.describe.forEach(item => {
          if (item.type === "url") {
            // 只添加有效的 URL（不是 base64 或 blob）
            if (
              item.content &&
              !item.content.startsWith("data:") &&
              !item.content.startsWith("blob:")
            ) {
              existingImageUrls.push(item.content);
            }
          }
        });

        // 合并所有图片 URL（去重）
        const allImageUrls = Array.from(
          new Set([...existingImageUrls, ...imageUrls])
        );

        // 将 describe 转换为 DescribeContent[] 格式（用于提交）
        const describeContents: DescribeContent[] = [];
        const seenUrls = new Set<string>(); // 用于去重（基于相对路径）

        taskForm.describe.forEach(item => {
          if (item.type === "text") {
            // 文本内容直接添加
            const text = item.content.trim();
            if (text) {
              describeContents.push({
                type: "text",
                content: text
              });
            }
          } else if (item.type === "url") {
            // 图片 URL，只添加有效的 URL（不是 base64 或 blob），并去重
            if (
              item.content &&
              !item.content.startsWith("data:") &&
              !item.content.startsWith("blob:")
            ) {
              // 转换为相对路径用于去重和提交
              const relativePath = convertToRelativePath(item.content);

              // 如果还没有添加过这个 URL（基于相对路径去重）
              if (!seenUrls.has(relativePath)) {
                seenUrls.add(relativePath);
                // 提交时使用相对路径，保持对象格式
                describeContents.push({
                  type: "url",
                  content: relativePath
                });
              }
            }
          }
        });

        // 合并富文本编辑器中的图片 URL
        allImageUrls.forEach(url => {
          const relativePath = convertToRelativePath(url);
          if (!seenUrls.has(relativePath)) {
            seenUrls.add(relativePath);
            describeContents.push({
              type: "url",
              content: relativePath
            });
          }
        });

        // 处理附件文件
        const attachmentUrls: string[] = [];

        for (const file of fileList.value) {
          if (file.raw) {
            // 新上传的文件，需要上传
            const url = await uploadAttachmentFile(file.raw);
            if (url) {
              attachmentUrls.push(url);
            }
          } else if (file.response) {
            // 已有的文件，从 response 中获取相对路径
            let url = "";
            if (typeof file.response === "string") {
              url = file.response;
            } else if (
              file.response &&
              typeof file.response === "object" &&
              "url" in file.response
            ) {
              url = (file.response as any).url || "";
            }
            if (url) {
              attachmentUrls.push(convertToRelativePath(url));
            }
          } else if (file.url) {
            // 如果 response 不存在，尝试从 url 中提取相对路径
            const url = convertToRelativePath(file.url);
            if (url) {
              attachmentUrls.push(url);
            }
          }
        }

        // 去重
        const allFiles = Array.from(new Set(attachmentUrls));

        // 根据编辑模式调用不同的接口
        let response;
        if (isEdit.value && props.task) {
          // 编辑模式：调用更新接口
          const taskId = props.task._id || props.task.id;
          if (!taskId) {
            ElMessage.error("任务ID不存在");
            submitting.value = false;
            return;
          }

          const currentDeadline = normalizeDeadline(taskForm.task_deadline);
          const deadlineChanged = currentDeadline !== originalTaskDeadline.value;

          response = await updateTask({
            task_id: taskId,
            task_name: taskForm.task_name,
            describe: describeContents,
            priority: taskForm.priority,
            default_person: taskForm.default_person,
            department: taskForm.department,
            attachment: allFiles.length > 0 ? allFiles : undefined
          });

          if (response.code === 200 && deadlineChanged) {
            const deadlineRes = await updateTaskDeadline({
              task_id: taskId,
              task_deadline: currentDeadline
            });
            if (deadlineRes.code !== 200) {
              ElMessage.error(deadlineRes.message || "任务完成期限更新失败");
              submitting.value = false;
              return;
            }
          }
        } else {
          // 新建模式：调用创建接口
          // 如果有父路径，自动拼接路径到任务名
          let taskName = taskForm.task_name;
          response = await createTask({
            task_name: taskName,
            describe: describeContents,
            requirement_id: taskForm.requirement_id,
            requirement_name: taskForm.requirement_name,
            priority: taskForm.priority,
            task_deadline: taskForm.task_deadline,
            department: taskForm.department || undefined,
            default_person: taskForm.default_person,
            attachment: allFiles.length > 0 ? allFiles : undefined
          });
        }

        if (response.code === 200) {
          ElMessage.success(isEdit.value ? "任务更新成功" : "任务创建成功");
          emit("refresh");
          handleClose();
        } else {
          ElMessage.error(
            response.message || (isEdit.value ? "任务更新失败" : "任务创建失败")
          );
        }
      } catch (error: any) {
        console.error(isEdit.value ? "更新任务失败:" : "创建任务失败:", error);
        ElMessage.error(
          error?.response?.data?.message ||
          error?.message ||
          (isEdit.value ? "任务更新失败" : "任务创建失败")
        );
      } finally {
        submitting.value = false;
      }
    }
  });
};
</script>

<style scoped lang="scss">
.task-drawer {
  padding: 0;
  height: 100%;
  overflow-y: auto;
  overflow-x: hidden;
  width: 100%;
  box-sizing: border-box;

  :deep(.el-form) {
    width: 100%;
    box-sizing: border-box;

    .el-form-item {
      margin-bottom: 22px;
      width: 100%;
      box-sizing: border-box;

      .el-form-item__label {
        font-weight: 500;
        color: #606266;
        white-space: nowrap;
      }

      .el-form-item__content {
        width: 100%;
        box-sizing: border-box;
      }
    }
  }
}

.drawer-footer {
  display: flex;
  justify-content: flex-end;
  align-items: center;
  gap: 12px;
  padding: 20px 0;
  border-top: 1px solid rgba(0, 0, 0, 0.06);
  margin-top: auto;
  width: 100%;
  box-sizing: border-box;

  .footer-right {
    display: flex;
    gap: 12px;
  }
}

:deep(.el-drawer) {
  .el-drawer__body {
    display: flex;
    flex-direction: column;
    padding: 24px;
    height: 100%;
    overflow: hidden;
    box-sizing: border-box;
  }

  .el-drawer__header {
    margin-bottom: 0;
    padding-bottom: 20px;
    border-bottom: 1px solid rgba(0, 0, 0, 0.06);

    .el-drawer__title {
      font-size: 18px;
      font-weight: 600;
      color: #303133;
      width: 100%;
      box-sizing: border-box;
    }
  }

  .el-drawer__footer {
    padding: 0 24px 24px;
    border-top: 1px solid rgba(0, 0, 0, 0.06);
    width: 100%;
    box-sizing: border-box;
  }
}

:deep(.el-input),
:deep(.el-select),
:deep(.el-textarea) {
  width: 100%;
}

:deep(.el-upload) {
  width: 100%;

  .el-upload-list {
    margin-top: 10px;
  }
}
</style>
