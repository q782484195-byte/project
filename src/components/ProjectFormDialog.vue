<template>
  <el-dialog v-model="dialogVisible" :title="isEdit ? '编辑项目' : '新建项目'" width="900px" class="project-form-dialog"
    @close="handleClose">
    <el-form ref="formRef" :model="projectForm" :rules="rules" label-width="100px">
      <el-form-item label="项目名称" prop="name">
        <el-input v-model="projectForm.name" placeholder="请输入项目名称" />
      </el-form-item>

      <el-row :gutter="20">
        <el-col :span="12">
          <el-form-item label="客户名称" prop="customer_name">
            <el-input v-model="projectForm.customer_name" placeholder="请输入客户名称" :disabled="isEdit" />
          </el-form-item>
        </el-col>
        <el-col :span="12">
          <el-form-item label="产品类型" prop="product_type">
            <el-input v-model="projectForm.product_type" placeholder="请输入产品类型" :disabled="isEdit" />
          </el-form-item>
        </el-col>
      </el-row>

      <el-row :gutter="20">
        <el-col :span="12">
          <el-form-item label="平台名称" prop="platform_name">
            <el-input v-model="projectForm.platform_name" placeholder="请输入平台名称" :disabled="isEdit" />
          </el-form-item>
        </el-col>
        <el-col :span="12">
          <el-form-item label="主板名称" prop="motherboard_name">
            <el-input v-model="projectForm.motherboard_name" placeholder="请输入主板名称" :disabled="isEdit" />
          </el-form-item>
        </el-col>
      </el-row>

      <el-row :gutter="20">
        <el-col :span="12">
          <el-form-item label="分辨率" prop="resolution">
            <el-input v-model="projectForm.resolution" placeholder="请输入分辨率" :disabled="isEdit" />
          </el-form-item>
        </el-col>
        <el-col :span="12">
          <el-form-item label="业务负责人" prop="business_owner">
            <el-input v-model="projectForm.business_owner" placeholder="请输入业务负责人" :disabled="isEdit" />
          </el-form-item>
        </el-col>
      </el-row>

      <el-form-item label="项目负责人" prop="creator">
        <el-select v-model="projectForm.creator" placeholder="请选择项目负责人" clearable filterable style="width: 100%"
          :loading="projectManagersLoading">
          <el-option v-for="manager in projectManagers" :key="manager.value" :label="manager.label"
            :value="manager.value" />
        </el-select>
      </el-form-item>

      <!-- <el-form-item label="项目类型" prop="typeId">
        <el-select
          v-model="projectForm.typeId"
          placeholder="选择项目类型"
          style="width: 100%"
          @change="handleTypeChange"
        >
          <el-option
            v-for="type in projectTypes"
            :key="type.id"
            :label="type.name"
            :value="type.id"
          />
        </el-select>
      </el-form-item> -->
      <!-- 
      <el-form-item label="项目模板" prop="templateId">
        <el-select
          v-model="projectForm.templateId"
          placeholder="选择项目模板"
          style="width: 100%"
          :disabled="!projectForm.typeId"
        >
          <el-option
            v-for="template in availableTemplates"
            :key="template.id"
            :label="template.name"
            :value="template.id"
          />
        </el-select>
      </el-form-item> -->

      <el-form-item label="项目描述" prop="describe">
        <RichTextEditor ref="richTextEditorRef" v-model="projectForm.describe" />
      </el-form-item>

      <!-- 附件上传（新建和编辑都可以） -->
      <el-form-item label="附件文件">
        <el-upload v-model:file-list="fileList" multiple :auto-upload="false" :on-remove="handleFileRemove"
          :on-change="handleFileChange" :before-upload="handleBeforeUpload">
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
      <el-form-item label="立项文件" prop="project_proposal">
        <el-upload v-model:file-list="proposalFileList" multiple :auto-upload="false"
          :on-remove="handleProposalFileRemove" :on-change="handleProposalFileChange"
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
      <el-row :gutter="20">
        <el-col :span="12">
          <el-form-item label="计划开始时间" prop="startDate" class="date-form-item">
            <el-date-picker v-model="projectForm.startDate" type="date" placeholder="选择计划开始时间" format="YYYY-MM-DD"
              value-format="YYYY-MM-DD" style="width: 100%" :disabled-date="disabledStartDate" />
          </el-form-item>
        </el-col>
        <el-col :span="12">
          <el-form-item label="计划结束时间" prop="endDate" class="date-form-item">
            <el-date-picker v-model="projectForm.endDate" type="date" placeholder="选择计划结束时间" format="YYYY-MM-DD"
              value-format="YYYY-MM-DD" style="width: 100%" :disabled-date="disabledEndDate" />
          </el-form-item>
        </el-col>
      </el-row>

      <!-- <el-form-item label="团队成员">
        <el-select v-model="projectForm.memberIds" multiple placeholder="选择团队成员" style="width: 100%">
          <el-option v-for="user in allUsers" :key="user.id" :label="user.name" :value="user.id" />
        </el-select>
      </el-form-item> -->
    </el-form>

    <template #footer>
      <el-button :disabled="submitting" @click="handleClose">取消</el-button>
      <el-button type="primary" :loading="submitting" @click="handleSubmit">确定</el-button>
    </template>
  </el-dialog>
</template>

<style lang="scss" scoped>
// 移动端适配
@media (max-width: 640px) {
  .project-form-dialog {
    :deep(.el-form) {
      .el-form-item {
        margin-bottom: 18px;
      }

      .el-row {
        margin-left: 0 !important;
        margin-right: 0 !important;

        .el-col {
          padding-left: 0 !important;
          padding-right: 0 !important;
          width: 100% !important;
          margin-bottom: 18px;
        }
      }

      .el-form-item__label {
        font-size: 14px;
        margin-bottom: 8px;
      }

      .el-input,
      .el-select,
      .el-date-picker {
        width: 100%;
      }
    }
  }
}

.date-form-item {
  :deep(.el-form-item__label) {
    white-space: nowrap;
  }
}

.project-form-dialog {
  :deep(.el-dialog__footer) {
    padding: 16px 20px;
    border-top: 1px solid #ebeef5;
    display: flex;
    justify-content: flex-end;
    gap: 12px;
    background-color: #fff;
    border-radius: 0 0 4px 4px;

    .el-button {
      min-width: 80px;
      padding: 8px 20px;
      font-size: 14px;
    }
  }

  :deep(.el-dialog__body) {
    padding: 20px;
    overflow-y: auto;
  }
}

// 移动端适配
@media (max-width: 640px) {
  .project-form-dialog {
    :deep(.el-dialog) {
      width: 95% !important;
      margin: 5vh auto;
    }

    :deep(.el-dialog__footer) {
      padding: 12px 16px;
      flex-direction: column-reverse;
      gap: 8px;

      .el-button {
        width: 100%;
        min-width: auto;
        margin: 0;
      }
    }

    :deep(.el-dialog__body) {
      padding: 16px;
    }
  }
}
</style>

<script setup lang="ts">
import { ref, computed, reactive, watch, onMounted } from "vue";
import { ElMessage } from "element-plus";
import { Upload } from "@element-plus/icons-vue";
import type {
  FormInstance,
  FormRules,
  UploadFile,
  UploadFiles
} from "element-plus";
import type { Project } from "@/types";
import type { DescribeContent, CreateProjectParams } from "@/api/project";
import { mockUsers } from "@/mock/users";
import { useProjectTypeStoreHook } from "@/store/modules/projectType";
import { useProjectTemplateStoreHook } from "@/store/modules/projectTemplate";
import { getAllProjectTemplates } from "@/mock/projectTemplates";
import { createProject, updateProject, uploadFile } from "@/api/project";
import type { UpdateProjectParams } from "@/api/project";
import { selectAllUsers } from "@/api/system";
import RichTextEditor from "./RichTextEditor.vue";

interface Props {
  visible: boolean;
  project?: Project | null;
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
  memberIds: [] as string[],
  project_proposal: [] as string[] // 用于表单验证
});

const rules: FormRules = {
  name: [{ required: true, message: "请输入项目名称", trigger: "blur" }],
  describe: [{ required: true, message: "请输入项目描述", trigger: "change" }],
  project_proposal: [
    {
      required: true,
      validator: (rule: any, value: any, callback: any) => {
        if (!proposalFileList.value || proposalFileList.value.length === 0) {
          callback(new Error("请上传立项文件"));
        } else {
          callback();
        }
      },
      trigger: "change",
    }
  ],
  startDate: [
    {
      validator: (rule: any, value: any, callback: any) => {
        if (!value) {
          callback();
          return;
        }
        // 如果结束时间已选择，检查开始时间是否大于结束时间
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
      validator: (rule: any, value: any, callback: any) => {
        if (!value) {
          callback(new Error("请选择计划结束时间"));
          return;
        }
        // 如果开始时间已选择，检查结束时间是否小于开始时间
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
  customer_name: [{ required: true, message: "请输入客户名称", trigger: "blur" }],
  product_type: [{ required: true, message: "请输入产品类型", trigger: "blur" }],
  platform_name: [{ required: true, message: "请输入平台名称", trigger: "blur" }],
  motherboard_name: [{ required: true, message: "请输入主板名称", trigger: "blur" }],
  resolution: [{ required: true, message: "请输入分辨率", trigger: "blur" }],
  business_owner: [{ required: true, message: "请输入业务负责人", trigger: "blur" }],
};

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
    if (response.code === 200 && Array.isArray(response.result)) {
      // 提取所有项目负责人（角色为ProjectManager的用户）
      const managers: Array<{ label: string; value: string }> = [];

      response.result.forEach((deptData: any) => {
        const members = Object.values(deptData)[0] || [];
        if (Array.isArray(members)) {
          members.forEach((user: any) => {
            const userRoles = Array.isArray(user.role) ? user.role : user.role ? [user.role] : [];
            // 检查是否是项目负责人
            if (userRoles.includes("ProjectManager") || userRoles.includes("ProjectDirector")) {
              const username = user.username || user.nickname || "";
              if (username && !managers.find(m => m.value === username)) {
                managers.push({
                  label: username,
                  value: username
                });
              }
            }
          });
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

// 监听项目变化，填充表单
watch(
  () => props.project,
  project => {
    if (project) {
      // 处理 describe：可能是字符串数组或 DescribeContent[]
      let describeContent: DescribeContent[] = [];
      if (project.describe && project.describe.length > 0) {
        describeContent = convertStringArrayToDescribe(project.describe);
      } else if (project.description) {
        describeContent = [
          { type: "text" as const, content: project.description }
        ];
      }

      // 获取计划开始时间（只使用 plant_start_time）
      // 注意：日期格式需要标准化为 YYYY-MM-DD
      // 如果没有值，保持为空字符串，不自动填入
      let startDate = (project as any).plant_start_time || "";

      // 标准化日期格式：将 "2025-11-6" 转换为 "2025-11-06"
      // 只有当 startDate 有值且不为空时才进行格式化
      if (startDate && startDate.trim() !== "") {
        const dateParts = startDate.split("-");
        if (dateParts.length === 3) {
          const year = dateParts[0];
          const month = dateParts[1].padStart(2, "0");
          const day = dateParts[2].padStart(2, "0");
          startDate = `${year}-${month}-${day}`;
        }
      } else {
        // 如果没有值，保持为空字符串
        startDate = "";
      }

      // 获取计划结束时间（支持多种字段名）
      // 注意：日期格式需要标准化为 YYYY-MM-DD
      let endDate =
        project.endDate ||
        (project as any).plant_end_time ||
        (project as any).completion_time ||
        (project as any).end_date ||
        "";

      // 标准化日期格式：将 "2025-12-6" 转换为 "2025-12-06"
      if (endDate) {
        const dateParts = endDate.split("-");
        if (dateParts.length === 3) {
          const year = dateParts[0];
          const month = dateParts[1].padStart(2, "0");
          const day = dateParts[2].padStart(2, "0");
          endDate = `${year}-${month}-${day}`;
        }
      }

      Object.assign(projectForm, {
        name: project.name,
        customer_name: (project as any).customer_name || "",
        product_type: (project as any).product_type || "",
        platform_name: (project as any).platform_name || "",
        motherboard_name: (project as any).motherboard_name || "",
        resolution: (project as any).resolution || "",
        business_owner: (project as any).business_owner || "",
        creator: project.creator || "", // 项目负责人
        describe: describeContent,
        typeId: project.typeId || "",
        templateId: project.templateId || "",
        startDate: startDate,
        endDate: endDate,
        memberIds: project.members?.map(member => member.id) || []
      });

      // 填充附件列表（编辑模式下）
      // 支持多种字段名：attachment
      const attachmentList =
        project.attachment ||
        (project as any).attachment ||
        [];

      if (attachmentList && attachmentList.length > 0) {
        fileList.value = attachmentList.map((attachmentPath: string, index: number) => {
          const fileName = getFileNameFromPath(attachmentPath);
          const fileUrl = getAttachmentUrl(attachmentPath);
          return {
            name: fileName,
            url: fileUrl,
            status: "success" as const,
            uid: Date.now() + index, // 生成唯一ID
            response: attachmentPath // 保存原始路径，用于后续处理
          } as UploadFile;
        });
      } else {
        fileList.value = [];
      }

      // 填充立项文件列表（编辑模式下）
      // 支持多种字段名：project_proposal
      const proposalList =
        project.project_proposal ||
        (project as any).project_proposal ||
        [];

      if (proposalList && proposalList.length > 0) {
        proposalFileList.value = proposalList.map((proposalPath: string, index: number) => {
          const fileName = getFileNameFromPath(proposalPath);
          const fileUrl = getAttachmentUrl(proposalPath);
          return {
            name: fileName,
            url: fileUrl,
            status: "success" as const,
            uid: Date.now() + 10000 + index, // 生成唯一ID（与附件文件区分）
            response: proposalPath // 保存原始路径，用于后续处理
          } as UploadFile;
        });
      } else {
        proposalFileList.value = [];
      }
    } else {
      // 清空附件列表和立项文件列表
      fileList.value = [];
      proposalFileList.value = [];
    }
  },
  { immediate: true }
);

const handleClose = () => {
  if (formRef.value) {
    formRef.value.resetFields();
  }
  // 重置表单
  Object.assign(projectForm, {
    name: "",
    customer_name: "",
    product_type: "",
    platform_name: "",
    motherboard_name: "",
    resolution: "",
    business_owner: "",
    creator: "",
    describe: [],
    typeId: "",
    templateId: "",
    startDate: "",
    endDate: "",
    memberIds: [],
    project_proposal: []
  });
  fileList.value = [];
  proposalFileList.value = [];
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

    // 验证立项文件
    if (!proposalFileList.value || proposalFileList.value.length === 0) {
      ElMessage.warning("请上传立项文件");
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
        project_proposal: allProposalUrls
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
      // 新建模式 - 使用新的参数格式
      const submitData: CreateProjectParams = {
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
        project_proposal: allProposalUrls
      };

      try {
        const response = await createProject(submitData);

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
