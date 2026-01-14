<template>
  <el-dialog v-model="dialogVisible" :title="isEdit ? '编辑项目' : '新建项目'" width="900px" @close="handleClose">
    <el-form ref="formRef" :model="projectForm" :rules="rules" label-width="100px">
      <el-form-item label="项目名称" prop="name">
        <el-input v-model="projectForm.name" placeholder="请输入项目名称" />
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
              value-format="YYYY-MM-DD" style="width: 100%" />
          </el-form-item>
        </el-col>
        <el-col :span="12">
          <el-form-item label="计划结束时间" prop="endDate" class="date-form-item">
            <el-date-picker v-model="projectForm.endDate" type="date" placeholder="选择计划结束时间" format="YYYY-MM-DD"
              value-format="YYYY-MM-DD" style="width: 100%" />
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

const projectForm = reactive({
  name: "",
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
      trigger: "change"
    }
  ],
  endDate: [{ required: true, message: "请选择计划结束时间", trigger: "change" }]
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

      // 获取计划开始时间（支持多种字段名）
      // 注意：日期格式需要标准化为 YYYY-MM-DD
      let startDate =
        project.startDate ||
        (project as any).plant_start_time ||
        (project as any).start_time ||
        (project as any).start_date ||
        "";

      // 标准化日期格式：将 "2025-11-6" 转换为 "2025-11-06"
      if (startDate) {
        const dateParts = startDate.split("-");
        if (dateParts.length === 3) {
          const year = dateParts[0];
          const month = dateParts[1].padStart(2, "0");
          const day = dateParts[2].padStart(2, "0");
          startDate = `${year}-${month}-${day}`;
        }
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

    // 验证日期（只验证结束时间，开始时间隐藏但保留参数）
    if (!projectForm.endDate) {
      ElMessage.warning("请选择计划结束时间");
      submitting.value = false;
      return;
    }

    // 确保开始时间为空字符串（隐藏字段，但参数保留）
    projectForm.startDate = "";

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
        plant_start_time: projectForm.startDate,
        plant_end_time: projectForm.endDate,
        describe: describeUrls,
        attachment: allAttachmentUrls,
        project_proposal: allProposalUrls
      };

      // 调用真实 API
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
        plant_start_time: projectForm.startDate,
        plant_end_time: projectForm.endDate,
        describe: describeUrls,
        attachment: allAttachmentUrls,
        project_proposal: allProposalUrls
      };

      // 调用真实 API

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
});
</script>

<style scoped lang="scss">
.date-form-item {
  :deep(.el-form-item__label) {
    white-space: nowrap;
  }
}
</style>
