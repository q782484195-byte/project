<template>
  <el-dialog
    v-model="dialogVisible"
    :title="isEdit ? '编辑项目' : '新建项目'"
    width="760px"
    class="project-form-dialog"
    @close="handleClose"
  >
    <el-form
      ref="formRef"
      :model="projectForm"
      :rules="formRules"
      label-width="88px"
      label-position="right"
      class="project-form"
    >
      <div v-if="defaultProjectType" class="form-type-bar">
        <span class="form-type-bar__label">项目类型</span>
        <el-tag size="small" type="info" effect="plain">{{ defaultProjectType }}</el-tag>
      </div>

      <section class="form-section">
        <div class="form-section__title">基本信息</div>
        <el-form-item v-if="!defaultProjectType" label="项目类型" prop="project_type">
          <el-radio-group v-model="projectForm.project_type" :disabled="isEdit">
            <el-radio label="定制项目">定制项目</el-radio>
            <el-radio label="公模项目">公模项目</el-radio>
          </el-radio-group>
        </el-form-item>

        <el-form-item label="项目名称" prop="name">
          <el-input v-model="projectForm.name" placeholder="请输入项目名称" />
        </el-form-item>

        <el-row :gutter="16">
          <el-col :span="12">
            <el-form-item label="客户名称" prop="customer_name">
              <el-input v-model="projectForm.customer_name" placeholder="客户名称" />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="产品类型" prop="product_type">
              <el-input v-model="projectForm.product_type" placeholder="产品类型" />
            </el-form-item>
          </el-col>
        </el-row>

        <el-row v-if="isAppFeatureDevelopment" :gutter="16">
          <el-col :span="12">
            <el-form-item label="业务负责人" prop="business_owner">
              <el-input
                v-model="projectForm.business_owner"
                placeholder="业务负责人"
                :disabled="isEdit"
              />
            </el-form-item>
          </el-col>
        </el-row>

        <el-form-item v-if="!isAppFeatureDevelopment" label="项目负责人" prop="creator">
          <el-select
            v-model="projectForm.creator"
            placeholder="请选择"
            clearable
            filterable
            style="width: 100%"
            :loading="projectManagersLoading"
          >
            <el-option
              v-for="manager in projectManagers"
              :key="manager.value"
              :label="manager.label"
              :value="manager.value"
            />
          </el-select>
        </el-form-item>
      </section>

      <section class="form-section">
        <div class="form-section__title">项目属性</div>
        <el-row :gutter="16">
          <el-col :span="12">
            <el-form-item label="平台名称" prop="platform_name">
              <el-input v-model="projectForm.platform_name" placeholder="平台名称" />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item v-if="isStandardProjectForm" label="主板名称" prop="motherboard_name">
              <el-input v-model="projectForm.motherboard_name" placeholder="主板名称" />
            </el-form-item>
            <el-form-item v-else-if="isAppFeatureDevelopment" label="APP协议" prop="app_protocol">
              <el-input v-model="projectForm.app_protocol" placeholder="APP协议" />
            </el-form-item>
            <el-form-item v-else label="分辨率" prop="resolution">
              <el-input v-model="projectForm.resolution" placeholder="分辨率" />
            </el-form-item>
          </el-col>
        </el-row>

        <el-row v-if="!isFeatureDevelopmentOnly" :gutter="16">
          <el-col :span="12">
            <el-form-item label="分辨率" prop="resolution">
              <el-input v-model="projectForm.resolution" placeholder="分辨率" />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item v-if="isAppFeatureDevelopment" label="马甲包" prop="shadow_app">
              <el-input v-model="projectForm.shadow_app" placeholder="马甲包名称" />
            </el-form-item>
            <el-form-item v-else label="业务负责人" prop="business_owner">
              <el-input
                v-model="projectForm.business_owner"
                placeholder="业务负责人"
                :disabled="isEdit"
              />
            </el-form-item>
          </el-col>
        </el-row>
      </section>

      <section class="form-section">
        <div class="form-section__title">计划时间</div>
        <el-row :gutter="16">
          <el-col v-if="!isFeatureDevelopmentOnly" :span="8">
            <el-form-item label="立项时间" prop="project_initiation_date">
              <el-date-picker
                v-model="projectForm.project_initiation_date"
                type="date"
                placeholder="选择日期"
                format="YYYY-MM-DD"
                value-format="YYYY-MM-DD"
                style="width: 100%"
              />
            </el-form-item>
          </el-col>
          <el-col :span="!isFeatureDevelopmentOnly ? 8 : 12">
            <el-form-item label="开始时间" prop="startDate">
              <el-date-picker
                v-model="projectForm.startDate"
                type="date"
                placeholder="计划开始"
                format="YYYY-MM-DD"
                value-format="YYYY-MM-DD"
                style="width: 100%"
                :disabled-date="disabledStartDate"
              />
            </el-form-item>
          </el-col>
          <el-col :span="!isFeatureDevelopmentOnly ? 8 : 12">
            <el-form-item label="结束时间" prop="endDate">
              <el-date-picker
                v-model="projectForm.endDate"
                type="date"
                placeholder="计划结束"
                format="YYYY-MM-DD"
                value-format="YYYY-MM-DD"
                style="width: 100%"
                :disabled-date="disabledEndDate"
              />
            </el-form-item>
          </el-col>
        </el-row>
      </section>

      <section class="form-section">
        <div class="form-section__title">描述与附件</div>
        <el-form-item label="项目描述" prop="describe" class="form-item--block">
          <RichTextEditor ref="richTextEditorRef" v-model="projectForm.describe" />
        </el-form-item>

        <el-row :gutter="16" class="upload-row">
          <el-col :span="showProposalUpload ? 12 : 24">
            <el-form-item label="附件" class="form-item--upload">
              <el-upload
                v-model:file-list="fileList"
                multiple
                :auto-upload="false"
                :on-remove="handleFileRemove"
                :on-change="handleFileChange"
                :before-upload="handleBeforeUpload"
              >
                <el-button plain size="small">
                  <el-icon><Upload /></el-icon>
                  选择文件
                </el-button>
              </el-upload>
            </el-form-item>
          </el-col>
          <el-col v-if="showProposalUpload" :span="12">
            <el-form-item label="立项文件" prop="project_proposal" class="form-item--upload">
              <el-upload
                v-model:file-list="proposalFileList"
                multiple
                :auto-upload="false"
                :on-remove="handleProposalFileRemove"
                :on-change="handleProposalFileChange"
                :before-upload="handleBeforeUpload"
              >
                <el-button plain size="small">
                  <el-icon><Upload /></el-icon>
                  选择文件
                </el-button>
              </el-upload>
            </el-form-item>
          </el-col>
        </el-row>
      </section>
    </el-form>

    <template #footer>
      <el-button :disabled="submitting" @click="handleClose">取消</el-button>
      <el-button type="primary" :loading="submitting" @click="handleSubmit">确定</el-button>
    </template>
  </el-dialog>
</template>

<style lang="scss" scoped>
.project-form-dialog {
  :deep(.el-dialog__body) {
    padding: 16px 20px 8px;
    max-height: 72vh;
    overflow-y: auto;
  }

  :deep(.el-dialog__footer) {
    padding: 12px 20px 16px;
    border-top: 1px solid var(--el-border-color-lighter);
    display: flex;
    justify-content: flex-end;
    gap: 8px;
  }
}

.project-form {
  :deep(.el-form-item) {
    margin-bottom: 12px;
  }

  :deep(.el-form-item__label) {
    color: var(--el-text-color-regular);
    padding-right: 8px;
  }

  :deep(.el-row) {
    margin-bottom: 0;
  }
}

.form-type-bar {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 12px;
  padding: 8px 12px;
  background: var(--el-fill-color-light);
  border-radius: 6px;

  &__label {
    font-size: 13px;
    color: var(--el-text-color-secondary);
  }
}

.form-section {
  & + & {
    margin-top: 4px;
    padding-top: 12px;
    border-top: 1px dashed var(--el-border-color-lighter);
  }

  &__title {
    margin-bottom: 10px;
    font-size: 13px;
    font-weight: 600;
    color: var(--el-text-color-primary);
    line-height: 1;
  }
}

.form-item--block {
  :deep(.el-form-item__content) {
    display: block;
  }
}

.form-item--upload {
  :deep(.el-upload-list) {
    margin-top: 4px;
  }

  :deep(.el-upload-list__item) {
    margin-bottom: 2px;
  }
}

.upload-row {
  :deep(.el-form-item) {
    margin-bottom: 0;
  }
}

@media (max-width: 640px) {
  .project-form-dialog {
    :deep(.el-dialog) {
      width: 94% !important;
      margin: 4vh auto;
    }

    :deep(.el-dialog__body) {
      padding: 12px 14px 4px;
      max-height: none;
    }

    :deep(.el-dialog__footer) {
      flex-direction: column-reverse;
      gap: 8px;

      .el-button {
        width: 100%;
        margin: 0;
      }
    }
  }

  .project-form {
    :deep(.el-row .el-col) {
      max-width: 100%;
      flex: 0 0 100%;
    }

    :deep(.el-input),
    :deep(.el-select),
    :deep(.el-date-editor) {
      width: 100%;
    }
  }
}
</style>

<script setup lang="ts">
import { ref, computed, reactive, watch, onMounted, nextTick } from "vue";
import { ElMessage } from "element-plus";
import { Upload } from "@element-plus/icons-vue";
import type {
  FormInstance,
  FormRules,
  UploadFile,
  UploadFiles
} from "element-plus";
import type { Project } from "@/types";
import type {
  DescribeContent,
  CreateProjectParams,
  CreateAppProjectParams,
  UpdateProjectParams
} from "@/api/project";
import {
  createProject,
  createAppProject,
  updateProject,
  uploadFile
} from "@/api/project";
import { mockUsers } from "@/mock/users";
import { useProjectTypeStoreHook } from "@/store/modules/projectType";
import { useProjectTemplateStoreHook } from "@/store/modules/projectTemplate";
import { getAllProjectTemplates } from "@/mock/projectTemplates";
import { selectAllUsers, flattenDepartmentSelectUsers } from "@/api/system";
import RichTextEditor from "./RichTextEditor.vue";
import {
  APP_FEATURE_DEVELOPMENT_TYPE,
  isAppFeatureDevelopmentType,
  isFeatureDevelopmentType
} from "@/utils/projectRoute";

interface Props {
  visible: boolean;
  project?: Project | null;
  defaultProjectType?: string;
}

interface Emits {
  (e: "update:visible", value: boolean): void;
  (e: "created", project: Project): void;
  (e: "updated", project: Project): void;
}

const props = defineProps<Props>();
const emit = defineEmits<Emits>();

const projectTypeStore = useProjectTypeStoreHook();
const projectTemplateStore = useProjectTemplateStoreHook();

const formRef = ref<FormInstance>();
const richTextEditorRef = ref<InstanceType<typeof RichTextEditor>>();
const fileList = ref<UploadFile[]>([]); // 附件文件列表
const proposalFileList = ref<UploadFile[]>([]); // 立项文件列表
const submitting = ref(false); // 提交状态
const projectManagersLoading = ref(false); // 项目负责人列表加载状态
const projectManagers = ref<Array<{ label: string; value: string }>>([]); // 项目负责人列表

const projectForm = reactive({
  project_type: "",
  name: "",
  customer_name: "",
  product_type: "",
  platform_name: "",
  motherboard_name: "",
  resolution: "",
  business_owner: "",
  creator: "", // 项目负责人
  describe: [] as DescribeContent[],
  typeId: "",
  templateId: "",
  startDate: "",
  endDate: "",
  state_description: "",
  memberIds: [] as string[],
  project_proposal: [] as string[], // 用于表单验证
  project_initiation_date: "", // 立项时间（年月日）
  app_protocol: "",
  shadow_app: ""
});

const isFeatureDevelopmentOnly = computed(() =>
  isFeatureDevelopmentType(
    props.defaultProjectType || projectForm.project_type
  )
);

const isAppFeatureDevelopment = computed(() =>
  isAppFeatureDevelopmentType(
    props.defaultProjectType || projectForm.project_type
  )
);

const hideMotherboard = computed(
  () => isFeatureDevelopmentOnly.value || isAppFeatureDevelopment.value
);

const isStandardProjectForm = computed(
  () => !isFeatureDevelopmentOnly.value && !isAppFeatureDevelopment.value
);

const showProposalUpload = computed(() => isStandardProjectForm.value);

const formRules = computed<FormRules>(() => {
  const featureDevOnly = isFeatureDevelopmentOnly.value;
  const appDev = isAppFeatureDevelopment.value;
  const showProposal = showProposalUpload.value;

  return {
    project_type: [
      { required: true, message: "请选择项目类型", trigger: "change" }
    ],
    name: [{ required: true, message: "请输入项目名称", trigger: "blur" }],
    describe: [{ required: true, message: "请输入项目描述", trigger: "change" }],
    project_proposal: showProposal
      ? [
        {
          required: true,
          validator: (_rule: any, _value: any, callback: any) => {
            if (
              !proposalFileList.value ||
              proposalFileList.value.length === 0
            ) {
              callback(new Error("请上传立项文件"));
            } else {
              callback();
            }
          },
          trigger: "change"
        }
      ]
      : [],
    project_initiation_date: featureDevOnly
      ? []
      : [
        {
          required: true,
          message: "请选择立项时间",
          trigger: ["blur", "change"]
        }
      ],
    startDate: [
      {
        validator: (_rule: any, value: any, callback: any) => {
          if (!value) {
            callback();
            return;
          }
          if (projectForm.endDate) {
            const startTime = new Date(value).getTime();
            const endTime = new Date(projectForm.endDate).getTime();
            if (startTime > endTime) {
              callback(new Error("计划开始时间不能大于计划结束时间"));
              return;
            }
          }
          callback();
        },
        trigger: "change"
      }
    ],
    endDate: [
      { required: true, message: "请选择计划结束时间", trigger: "change" },
      {
        validator: (_rule: any, value: any, callback: any) => {
          if (!value) {
            callback(new Error("请选择计划结束时间"));
            return;
          }
          if (projectForm.startDate) {
            const startTime = new Date(projectForm.startDate).getTime();
            const endTime = new Date(value).getTime();
            if (endTime < startTime) {
              callback(new Error("计划结束时间不能小于计划开始时间"));
              return;
            }
          }
          callback();
        },
        trigger: "change"
      }
    ],
    customer_name: [
      { required: true, message: "请输入客户名称", trigger: "blur" }
    ],
    product_type: [
      { required: true, message: "请输入产品类型", trigger: "blur" }
    ],
    platform_name: appDev
      ? []
      : [{ required: true, message: "请输入平台名称", trigger: "blur" }],
    motherboard_name: hideMotherboard.value
      ? []
      : [{ required: true, message: "请输入主板名称", trigger: "blur" }],
    resolution: appDev
      ? []
      : [{ required: true, message: "请输入分辨率", trigger: "blur" }],
    business_owner: featureDevOnly
      ? []
      : [{ required: true, message: "请输入业务负责人", trigger: "blur" }],
    app_protocol: [],
    shadow_app: []
  };
});

// 禁用开始时间大于结束时间的日期
const disabledStartDate = (time: Date): boolean => {
  if (!projectForm.endDate) {
    return false;
  }
  const endTime = new Date(projectForm.endDate);
  endTime.setHours(23, 59, 59, 999);
  return time.getTime() > endTime.getTime();
};

// 禁用结束时间小于开始时间的日期
const disabledEndDate = (time: Date): boolean => {
  if (!projectForm.startDate) {
    return false;
  }
  const startTime = new Date(projectForm.startDate);
  startTime.setHours(0, 0, 0, 0);
  return time.getTime() < startTime.getTime();
};

const isEdit = computed(() => !!props.project);

const dialogVisible = computed({
  get: () => props.visible,
  set: value => emit("update:visible", value)
});

// 所有用户
const allUsers = computed(() => mockUsers);

// 项目类型列表
const projectTypes = computed(() => projectTypeStore.allProjectTypes);

// 根据选择的项目类型过滤模板
const availableTemplates = computed(() => {
  if (!projectForm.typeId) return [];
  return getAllProjectTemplates().filter(t => t.typeId === projectForm.typeId);
});

// 处理项目类型变更
const handleTypeChange = () => {
  projectForm.templateId = ""; // 清空模板选择
};

// 加载项目负责人列表
const loadProjectManagers = async () => {
  projectManagersLoading.value = true;
  try {
    const response = await selectAllUsers();
    const rawResult = response.result ?? response.data;
    if (response.code === 200 && rawResult != null) {
      const managers: Array<{ label: string; value: string }> = [];

      flattenDepartmentSelectUsers(rawResult).forEach(user => {
        const userRoles = Array.isArray(user.role)
          ? user.role
          : user.role
            ? [user.role]
            : [];
        if (
          userRoles.includes("ProjectManager") ||
          userRoles.includes("ProjectDirector")
        ) {
          const username = user.username || "";
          if (username && !managers.find(item => item.value === username)) {
            managers.push({
              label: username,
              value: username
            });
          }
        }
      });

      projectManagers.value = managers;
    } else {
      projectManagers.value = [];
      ElMessage.error("加载项目负责人列表失败");
    }
  } catch (error: any) {
    console.error("加载项目负责人列表失败:", error);
    ElMessage.error(
      error?.response?.data?.message || error?.message || "加载项目负责人列表失败"
    );
    projectManagers.value = [];
  } finally {
    projectManagersLoading.value = false;
  }
};

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

// 处理立项文件变化
const handleProposalFileChange = (file: UploadFile, files: UploadFiles) => {
  proposalFileList.value = files;
  // 更新表单验证字段
  projectForm.project_proposal = files.map(f => f.name || "");
  // 触发表单验证
  formRef.value?.validateField("project_proposal");
};

// 处理立项文件移除
const handleProposalFileRemove = (file: UploadFile, files: UploadFiles) => {
  proposalFileList.value = files;
  // 更新表单验证字段
  projectForm.project_proposal = files.map(f => f.name || "");
  // 触发表单验证
  formRef.value?.validateField("project_proposal");
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

// 获取附件文件名（从路径中提取）
const getFileNameFromPath = (path: string): string => {
  // 处理路径，如 "/prj_att/690c147bfca7b408fbad32dd/file.xlsx" -> "file.xlsx"
  // 或者 "/prj_att/.../file1/file2.xlsx" -> "file2.xlsx"
  const parts = path.split("/").filter(p => p);
  return parts[parts.length - 1] || path;
};

// 获取附件完整URL
const getAttachmentUrl = (path: string): string => {
  const baseUrl = import.meta.env.VITE_GLOB_API_URL || "";
  if (!baseUrl) return path;
  // 如果路径已经是完整URL，直接返回
  if (path.startsWith("http://") || path.startsWith("https://")) {
    return path;
  }
  // 拼接基础URL
  return `${baseUrl}${path.startsWith("/") ? path : "/" + path}`;
};

// 将完整 URL 转换为相对路径（用于提交数据）
const convertToRelativePath = (url: string): string => {
  // 如果已经是相对路径，直接返回
  if (!url.startsWith("http://") && !url.startsWith("https://")) {
    return url;
  }

  try {
    const urlObj = new URL(url);
    return urlObj.pathname;
  } catch (e) {
    // 如果 URL 解析失败，尝试从完整 URL 中提取路径
    const baseUrl = import.meta.env.VITE_GLOB_API_URL || "";
    if (baseUrl && url.startsWith(baseUrl)) {
      return url.substring(baseUrl.length);
    }
    return url;
  }
};

// 将字符串数组转换为 DescribeContent[]
const convertStringArrayToDescribe = (
  arr: string[] | DescribeContent[]
): DescribeContent[] => {
  if (!arr || arr.length === 0) return [];

  // 如果已经是 DescribeContent[] 格式，直接返回
  if (arr.length > 0 && typeof arr[0] === "object" && "type" in arr[0]) {
    return arr as DescribeContent[];
  }

  // 如果是字符串数组，转换为 DescribeContent[]
  return (arr as string[]).map(str => {
    // 判断是否是图片 URL（以 http://、https:// 或 / 开头，且包含图片扩展名）
    const isImageUrl =
      (str.startsWith("http://") ||
        str.startsWith("https://") ||
        str.startsWith("/")) &&
      /\.(jpg|jpeg|png|gif|webp|bmp|svg)(\?|$)/i.test(str);

    if (isImageUrl) {
      return { type: "url" as const, content: str };
    } else {
      return { type: "text" as const, content: str };
    }
  });
};

const getEmptyProjectForm = () => ({
  project_type: "",
  name: "",
  customer_name: "",
  product_type: "",
  platform_name: "",
  motherboard_name: "",
  resolution: "",
  business_owner: "",
  creator: "",
  describe: [] as DescribeContent[],
  typeId: "",
  templateId: "",
  startDate: "",
  endDate: "",
  state_description: "",
  memberIds: [] as string[],
  project_proposal: [] as string[],
  project_initiation_date: "",
  app_protocol: "",
  shadow_app: ""
});

const resetProjectForm = () => {
  Object.assign(projectForm, getEmptyProjectForm());
  if (props.defaultProjectType) {
    projectForm.project_type = props.defaultProjectType;
  }
  fileList.value = [];
  proposalFileList.value = [];
};

const normalizeDate = (value?: string) => {
  if (!value || value.trim() === "") return "";
  const dateParts = value.split("-");
  if (dateParts.length === 3) {
    return `${dateParts[0]}-${dateParts[1].padStart(2, "0")}-${dateParts[2].padStart(2, "0")}`;
  }
  return value;
};

const fillFormFromProject = (project: Project) => {
  let describeContent: DescribeContent[] = [];
  if (project.describe && project.describe.length > 0) {
    describeContent = convertStringArrayToDescribe(project.describe);
  } else if (project.description) {
    describeContent = [{ type: "text" as const, content: project.description }];
  }

  const startDate = normalizeDate((project as any).plant_start_time || "");
  const endDate = normalizeDate(
    project.endDate ||
    (project as any).plant_end_time ||
    (project as any).completion_time ||
    (project as any).end_date ||
    ""
  );
  const initiationDateNorm = normalizeDate(
    (project as any).project_initiation_date || ""
  );

  Object.assign(projectForm, {
    project_type: (project as any).project_type || "",
    name: project.name,
    customer_name: (project as any).customer_name || "",
    product_type: (project as any).product_type || "",
    platform_name: (project as any).platform_name || "",
    motherboard_name: (project as any).motherboard_name || "",
    resolution: (project as any).resolution || "",
    business_owner: (project as any).business_owner || "",
    creator: project.creator || "",
    describe: describeContent,
    typeId: project.typeId || "",
    templateId: project.templateId || "",
    startDate,
    endDate,
    state_description: (project as any).state_description || "",
    memberIds: project.members?.map(member => member.id) || [],
    project_initiation_date: initiationDateNorm,
    app_protocol: (project as any).app_protocol || "",
    shadow_app: (project as any).shadow_app || ""
  });

  const attachmentList = project.attachment || (project as any).attachment || [];
  if (attachmentList && attachmentList.length > 0) {
    fileList.value = attachmentList.map((attachmentPath: string, index: number) => {
      const fileName = getFileNameFromPath(attachmentPath);
      const fileUrl = getAttachmentUrl(attachmentPath);
      return {
        name: fileName,
        url: fileUrl,
        status: "success" as const,
        uid: Date.now() + index,
        response: attachmentPath
      } as UploadFile;
    });
  } else {
    fileList.value = [];
  }

  const proposalList =
    project.project_proposal || (project as any).project_proposal || [];
  const projectType =
    (project as any).project_type || props.defaultProjectType || "";
  if (
    !isAppFeatureDevelopmentType(projectType) &&
    proposalList &&
    proposalList.length > 0
  ) {
    proposalFileList.value = proposalList.map(
      (proposalPath: string, index: number) => {
        const fileName = getFileNameFromPath(proposalPath);
        const fileUrl = getAttachmentUrl(proposalPath);
        return {
          name: fileName,
          url: fileUrl,
          status: "success" as const,
          uid: Date.now() + 10000 + index,
          response: proposalPath
        } as UploadFile;
      }
    );
    projectForm.project_proposal = proposalList.map(
      (path: string) => getFileNameFromPath(path) || path
    );
  } else {
    proposalFileList.value = [];
    projectForm.project_proposal = [];
  }
};

// 弹窗每次打开都重新回填；取消后再次编辑同一项目时 project 引用不变，不能只监听 project
watch(
  [() => props.visible, () => props.project],
  ([visible, project]) => {
    if (!visible) return;
    if (project) {
      fillFormFromProject(project);
    } else {
      resetProjectForm();
    }
    nextTick(() => {
      formRef.value?.clearValidate();
    });
  }
);

const handleClose = () => {
  if (formRef.value) {
    formRef.value.resetFields();
  }
  resetProjectForm();
  dialogVisible.value = false;
};

const handleSubmit = async () => {
  if (!formRef.value) return;

  // 防止重复提交
  if (submitting.value) return;

  submitting.value = true;

  try {
    await formRef.value.validate();

    // 验证描述内容
    if (!projectForm.describe || projectForm.describe.length === 0) {
      ElMessage.warning("请输入项目描述");
      submitting.value = false;
      return;
    }

    // 验证日期（只验证结束时间）
    if (!projectForm.endDate) {
      ElMessage.warning("请选择计划结束时间");
      submitting.value = false;
      return;
    }

    // 验证立项文件（仅定制/公模项目）
    if (
      showProposalUpload.value &&
      (!proposalFileList.value || proposalFileList.value.length === 0)
    ) {
      ElMessage.warning("请上传立项文件");
      submitting.value = false;
      return;
    }

    // 验证立项时间
    if (!isFeatureDevelopmentOnly.value && !projectForm.project_initiation_date) {
      ElMessage.warning("请选择立项时间");
      submitting.value = false;
      return;
    }

    // 处理附件文件
    // fileList 中包含了所有附件（已有的和新上传的）
    // - 新上传的文件：有 raw 属性，需要上传
    // - 已有的文件：有 response 属性（保存的是相对路径），直接使用
    const attachmentUrls: string[] = [];

    for (const file of fileList.value) {
      if (file.raw) {
        // 新上传的文件，需要上传
        const url = await uploadAttachmentFile(file.raw);
        if (url) {
          // 上传接口返回的已经是相对路径，直接使用
          attachmentUrls.push(url);
        }
      } else if (file.response) {
        // 已有的文件，从 response 中获取相对路径
        // response 保存的是相对路径（在填充 fileList 时设置的）
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
          // 确保是相对路径
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

    // 去重（都使用相对路径）
    const allAttachmentUrls = Array.from(new Set(attachmentUrls));

    // 处理立项文件
    const proposalUrls: string[] = [];
    if (showProposalUpload.value) {
      for (const file of proposalFileList.value) {
        if (file.raw) {
          // 新上传的文件，需要上传
          const url = await uploadAttachmentFile(file.raw);
          if (url) {
            // 上传接口返回的已经是相对路径，直接使用
            proposalUrls.push(url);
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
            // 确保是相对路径
            proposalUrls.push(convertToRelativePath(url));
          }
        } else if (file.url) {
          // 如果 response 不存在，尝试从 url 中提取相对路径
          const url = convertToRelativePath(file.url);
          if (url) {
            proposalUrls.push(url);
          }
        }
      }
    }
    // 去重（都使用相对路径）
    const allProposalUrls = Array.from(new Set(proposalUrls));

    // 将 describe 转换为 URL 字符串数组（用于提交）
    // projectForm.describe 已经包含了所有内容（文本和图片），直接转换即可
    // 注意：提交时使用相对路径，显示时保持完整 URL
    const describeUrls: string[] = [];
    const seenUrls = new Set<string>(); // 用于去重（基于相对路径）

    projectForm.describe.forEach(item => {
      if (item.type === "text") {
        // 文本内容直接添加
        const text = item.content.trim();
        if (text) {
          describeUrls.push(text);
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
            // 提交时使用相对路径
            describeUrls.push(relativePath);
          }
        }
      }
    });

    if (isEdit.value && props.project) {

      // 编辑模式 - 使用新的参数格式
      const submitData: UpdateProjectParams = {
        project_id: props.project.id,
        project_type: projectForm.project_type,
        project_name: projectForm.name,
        customer_name: projectForm.customer_name,
        product_type: projectForm.product_type,
        platform_name: projectForm.platform_name,
        motherboard_name: projectForm.motherboard_name,
        resolution: projectForm.resolution,
        state_description: projectForm.state_description || '',
        business_owner: projectForm.business_owner,
        creator: projectForm.creator,
        plant_start_time: projectForm.startDate,
        plant_end_time: projectForm.endDate,
        describe: describeUrls,
        attachment: allAttachmentUrls,
        project_proposal: allProposalUrls,
        project_initiation_date: projectForm.project_initiation_date || ""
      };
      try {
        const response = await updateProject(submitData);

        if (response.code === 200) {
          ElMessage.success("项目更新成功");

          // 创建本地项目对象用于更新列表
          const members = mockUsers
            .filter(user => projectForm.memberIds.includes(user.id))
            .map(user => ({
              id: user.id,
              name: user.name,
              avatar: user.avatar,
              role: user.role
            }));

          const projectType = projectForm.typeId
            ? projectTypes.value.find(t => t.id === projectForm.typeId)
            : undefined;
          const projectTemplate = projectForm.templateId
            ? getAllProjectTemplates().find(
              t => t.id === projectForm.templateId
            )
            : undefined;

          const updatedProject: Project = {
            ...props.project,
            ...projectForm,
            description: describeUrls
              .filter(url => !url.startsWith("http") && !url.startsWith("/"))
              .join("\n"),
            describe: projectForm.describe, // 保持原有的 describe 格式用于显示
            attachment: allAttachmentUrls,
            members,
            type: projectType,
            template: projectTemplate,
            updatedAt: new Date().toISOString()
          };
          emit("updated", updatedProject);
          handleClose();
        } else {
          ElMessage.error(response.message || "项目更新失败");
        }
      } catch (error: any) {
        console.error("更新项目失败:", error);
        ElMessage.error(
          error?.response?.data?.message || error?.message || "项目更新失败"
        );
      }
    } else {
      // 新建模式
      try {
        let response;

        if (isAppFeatureDevelopment.value) {
          const submitData: CreateAppProjectParams = {
            project_type: APP_FEATURE_DEVELOPMENT_TYPE,
            project_name: projectForm.name,
            customer_name: projectForm.customer_name,
            product_type: projectForm.product_type,
            platform_name: projectForm.platform_name,
            resolution: projectForm.resolution,
            app_protocol: projectForm.app_protocol,
            shadow_app: projectForm.shadow_app,
            business_owner: projectForm.business_owner,
            project_initiation_date: projectForm.project_initiation_date || "",
            plant_start_time: projectForm.startDate,
            plant_end_time: projectForm.endDate,
            describe: describeUrls,
            attachment: allAttachmentUrls
          };
          response = await createAppProject(submitData);
        } else {
          const submitData: CreateProjectParams = {
            project_type: projectForm.project_type,
            project_name: projectForm.name,
            customer_name: projectForm.customer_name,
            product_type: projectForm.product_type,
            platform_name: projectForm.platform_name,
            motherboard_name: projectForm.motherboard_name,
            resolution: projectForm.resolution,
            business_owner: projectForm.business_owner,
            creator: projectForm.creator,
            plant_start_time: projectForm.startDate,
            plant_end_time: projectForm.endDate,
            describe: describeUrls,
            attachment: allAttachmentUrls,
            project_proposal: allProposalUrls,
            project_initiation_date: projectForm.project_initiation_date || ""
          };
          response = await createProject(submitData);
        }

        if (response.code === 200) {
          ElMessage.success("项目创建成功");

          // 创建本地项目对象用于更新列表
          const members = mockUsers
            .filter(user => projectForm.memberIds.includes(user.id))
            .map(user => ({
              id: user.id,
              name: user.name,
              avatar: user.avatar,
              role: user.role
            }));

          const projectType = projectForm.typeId
            ? projectTypes.value.find(t => t.id === projectForm.typeId)
            : undefined;
          const projectTemplate = projectForm.templateId
            ? getAllProjectTemplates().find(
              t => t.id === projectForm.templateId
            )
            : undefined;

          const newProject: Project = {
            id: response.data?.id || Date.now().toString(),
            name: projectForm.name,
            description: describeUrls
              .filter(url => !url.startsWith("http") && !url.startsWith("/"))
              .join("\n"),
            describe: projectForm.describe, // 保持原有的 describe 格式用于显示
            attachment: allAttachmentUrls,
            status: "进行中",
            members,
            type: projectType,
            template: projectTemplate,
            typeId: projectForm.typeId,
            templateId: projectForm.templateId,
            startDate: projectForm.startDate,
            endDate: projectForm.endDate,
            progress: 0,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
          };

          emit("created", newProject);
          handleClose();
        } else {
          ElMessage.error(response.message || "项目创建失败");
        }
      } catch (error: any) {
        console.error("创建项目失败:", error);
        ElMessage.error(
          error?.response?.data?.message || error?.message || "项目创建失败"
        );
      }
    }
  } catch (error) {
    console.error("表单验证失败:", error);
  } finally {
    submitting.value = false;
  }
};

onMounted(() => {
  // 加载项目类型和模板数据
  projectTypeStore.loadProjectTypes();
  projectTemplateStore.loadTemplates();
  // 加载项目负责人列表
  loadProjectManagers();
});
</script>
