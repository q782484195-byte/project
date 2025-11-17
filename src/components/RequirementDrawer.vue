<template>
  <el-drawer
    v-model="drawerVisible"
    :title="isEdit ? '编辑需求' : '新建需求'"
    size="600px"
    direction="rtl"
    @close="handleClose"
  >
    <div class="requirement-drawer">
      <!-- 创建模式选择（仅新建时显示） -->
      <div v-if="!isEdit" class="create-mode-selector">
        <el-radio-group v-model="createMode" size="default">
          <el-radio-button label="manual">手动创建</el-radio-button>
          <el-radio-button label="import">导入JSON</el-radio-button>
        </el-radio-group>
      </div>

      <!-- 手动创建表单 -->
      <el-form
        v-if="isEdit || createMode === 'manual'"
        ref="formRef"
        :model="requirementForm"
        :rules="rules"
        label-width="100px"
        label-position="left"
      >
        <el-form-item label="需求标题" prop="title">
          <el-input
            v-model="requirementForm.title"
            placeholder="请输入需求标题"
            maxlength="100"
            show-word-limit
          />
        </el-form-item>

        <el-form-item label="需求描述" prop="describe">
          <RichTextEditor
            ref="richTextEditorRef"
            v-model="requirementForm.describe"
          />
        </el-form-item>

        <el-form-item label="优先级" prop="priority">
          <el-select
            v-model="requirementForm.priority"
            placeholder="选择优先级"
            clearable
            style="width: 100%"
          >
            <el-option label="低" value="low">
              <el-tag type="info" size="small">低</el-tag>
            </el-option>
            <el-option label="中" value="medium">
              <el-tag type="success" size="small">中</el-tag>
            </el-option>
            <el-option label="高" value="high">
              <el-tag type="warning" size="small">高</el-tag>
            </el-option>
          </el-select>
        </el-form-item>

        <!-- 合同附件上传 -->
        <el-form-item label="合同附件">
          <el-upload
            v-model:file-list="fileList"
            multiple
            :auto-upload="false"
            :on-remove="handleFileRemove"
            :on-change="handleFileChange"
            :before-upload="handleBeforeUpload"
          >
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

      <!-- 导入JSON区域 -->
      <div
        v-if="!isEdit && createMode === 'import'"
        class="import-json-section"
      >
        <el-alert type="info" :closable="false" style="margin-bottom: 20px">
          <template #title>
            <span>请选择JSON文件导入生成需求</span>
          </template>
        </el-alert>
        <el-button
          type="primary"
          size="large"
          :loading="importing"
          style="width: 100%"
          @click="handleImportJson"
        >
          <el-icon>
            <Upload />
          </el-icon>
          选择JSON文件
        </el-button>
        <div class="import-tip">
          <p>支持导入JSON格式的需求数据文件</p>
        </div>
      </div>
    </div>

    <template #footer>
      <div class="drawer-footer">
        <div class="footer-right">
          <el-button @click="handleClose">取消</el-button>
          <el-button
            v-if="isEdit || createMode === 'manual'"
            type="primary"
            :loading="submitting"
            @click="handleSubmit"
          >
            {{ isEdit ? "保存" : "创建" }}
          </el-button>
        </div>
      </div>
    </template>
  </el-drawer>
</template>

<script setup lang="ts">
import { ref, computed, watch, reactive } from "vue";
import { ElMessage, ElMessageBox } from "element-plus";
import { Upload } from "@element-plus/icons-vue";
import type {
  FormInstance,
  FormRules,
  UploadFile,
  UploadFiles
} from "element-plus";
import type { Requirement } from "@/types";
import { RequirementStatus, type RequirementPriority } from "@/types";
import { mockUsers } from "@/mock/users";
import type { DescribeContent } from "@/api/project";
import {
  createRequirement,
  updateRequirement,
  uploadFile,
  loadRequirementFromJson,
  type LoadRequirementFromJsonParams,
  type UpdateRequirementParams
} from "@/api/project";
import RichTextEditor from "./RichTextEditor.vue";

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

interface Props {
  visible: boolean;
  projectId?: string;
  projectName?: string;
  requirement?: Requirement | null;
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
const importing = ref(false);
const createMode = ref<"manual" | "import">("manual"); // 创建模式：manual-手动创建，import-导入JSON

const requirementForm = reactive<
  Partial<Requirement> & {
    describe: DescribeContent[];
  }
>({
  title: "",
  describe: [] as DescribeContent[],
  status: RequirementStatus.DRAFT,
  priority: "medium" as RequirementPriority,
  category: "",
  assigneeId: "",
  tags: [],
  acceptanceCriteria: "",
  estimatedHours: 0,
  actualHours: 0,
  startDate: "",
  endDate: ""
});

const rules: FormRules = {
  title: [
    { required: true, message: "请输入需求标题", trigger: "blur" },
    { min: 2, max: 100, message: "标题长度在 2 到 100 个字符", trigger: "blur" }
  ],
  priority: [{ required: true, message: "请选择优先级", trigger: "change" }],
  describe: [{ required: true, message: "请输入需求描述", trigger: "change" }]
};

const drawerVisible = computed({
  get: () => props.visible,
  set: value => emit("update:visible", value)
});

const isEdit = computed(() => !!props.requirement);

// 重置表单
const resetForm = () => {
  Object.assign(requirementForm, {
    title: "",
    describe: [] as DescribeContent[],
    status: RequirementStatus.DRAFT,
    priority: "",
    category: "",
    assigneeId: "",
    tags: [],
    acceptanceCriteria: "",
    estimatedHours: 0,
    actualHours: 0,
    startDate: "",
    endDate: ""
  });
  formRef.value?.clearValidate();
  createMode.value = "manual"; // 重置为手动创建模式
};

// 监听需求变化，填充表单
watch(
  () => props.requirement,
  requirement => {
    if (requirement) {
      // 从 requirement 中获取 describe 字段（可能是 DescribeContent[] 格式）
      const describeData = (requirement as any).describe;
      let describeContent: DescribeContent[] = [];

      if (
        describeData &&
        Array.isArray(describeData) &&
        describeData.length > 0
      ) {
        // 如果已经是 DescribeContent[] 格式，直接使用
        if (
          describeData[0] &&
          typeof describeData[0] === "object" &&
          "type" in describeData[0]
        ) {
          describeContent = describeData as DescribeContent[];
        } else {
          // 如果是字符串数组，转换为 DescribeContent[] 格式
          describeContent = (describeData as string[]).map(item => {
            // 判断是文本还是图片URL
            const isImage =
              (item.startsWith("http://") ||
                item.startsWith("https://") ||
                item.startsWith("/")) &&
              /\.(jpg|jpeg|png|gif|webp|bmp|svg)(\?|$)/i.test(item);
            return {
              type: isImage ? "url" : "text",
              content: item
            } as DescribeContent;
          });
        }
      }

      // 处理优先级：如果为空字符串或 undefined，保持为空字符串
      // requirement.priority 可能是 RequirementPriority 类型，也可能是空字符串
      const priorityValue =
        (requirement.priority as any) === "" || !requirement.priority
          ? ""
          : requirement.priority || "";

      Object.assign(requirementForm, {
        title: requirement.title || "",
        describe: describeContent, // 使用从 requirement 中获取的 describe 数据
        priority: priorityValue,
        category: requirement.category || "",
        assigneeId: requirement.assigneeId || ""
      });

      // 填充附件列表（编辑模式下）
      // 注意：Requirement 接口可能没有 attachment 字段，需要从 API 返回的数据中获取
      // 这里假设 requirement 可能有 attachment 属性（字符串数组）
      const attachment = (requirement as any).attachment;
      if (attachment && Array.isArray(attachment) && attachment.length > 0) {
        fileList.value = attachment.map(
          (attachmentPath: string, index: number) => {
            const fileName = getFileNameFromPath(attachmentPath);
            const fileUrl = getAttachmentUrl(attachmentPath);
            return {
              name: fileName,
              url: fileUrl,
              status: "success" as const,
              uid: Date.now() + index, // 生成唯一ID
              response: attachmentPath // 保存原始路径，用于后续处理
            } as UploadFile;
          }
        );
      } else {
        fileList.value = [];
      }
    } else {
      resetForm();
      fileList.value = [];
    }
  },
  { immediate: true }
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

// 获取附件文件名（从路径中提取）
const getFileNameFromPath = (path: string): string => {
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
      // 新建模式需要验证项目信息
      if (!isEdit.value) {
        if (!props.projectId || !props.projectName) {
          ElMessage.error("项目信息不完整");
          return;
        }
      }

      if (!requirementForm.describe || requirementForm.describe.length === 0) {
        ElMessage.error("请输入需求描述");
        return;
      }

      submitting.value = true;
      try {
        // 获取富文本编辑器中的图片 URL（已上传的）
        const imageUrls = richTextEditorRef.value?.getImageUrls() || [];

        // 从 describe 中提取已有的图片 URL
        const existingImageUrls: string[] = [];
        requirementForm.describe.forEach(item => {
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

        // 将 describe 转换为 URL 字符串数组（用于提交）
        // requirementForm.describe 已经包含了所有内容（文本和图片），直接转换即可
        const describeUrls: string[] = [];
        const seenUrls = new Set<string>(); // 用于去重（基于相对路径）

        requirementForm.describe.forEach(item => {
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

        // 合并富文本编辑器中的图片 URL
        allImageUrls.forEach(url => {
          const relativePath = convertToRelativePath(url);
          if (!seenUrls.has(relativePath)) {
            seenUrls.add(relativePath);
            describeUrls.push(relativePath);
          }
        });

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

        // 将优先级映射为中文（如果需要）
        const priorityMap: Record<string, string> = {
          low: "低",
          medium: "中",
          high: "高"
        };
        const priorityValue =
          priorityMap[requirementForm.priority as string] ||
          requirementForm.priority;

        let response;
        if (isEdit.value && props.requirement?.id) {
          // 编辑模式：调用更新接口
          response = await updateRequirement({
            requirement_id: props.requirement.id,
            requirement_name: requirementForm.title || "",
            priority: priorityValue as string,
            describe: describeUrls,
            attachment: allAttachmentUrls
          });

          if (response.code === 200) {
            ElMessage.success("需求更新成功");
            emit("refresh");
            handleClose();
          } else {
            ElMessage.error(response.message || "需求更新失败");
          }
        } else {
          // 新建模式：调用创建接口
          if (!props.projectId || !props.projectName) {
            ElMessage.error("项目信息不完整");
            submitting.value = false;
            return;
          }

          response = await createRequirement({
            requirement_name: requirementForm.title || "",
            priority: priorityValue as string,
            project_name: props.projectName || "",
            project_id: props.projectId || "",
            describe: describeUrls,
            attachment: allAttachmentUrls
          });

          if (response.code === 200) {
            ElMessage.success("需求创建成功");
            emit("refresh");
            handleClose();
          } else {
            ElMessage.error(response.message || "需求创建失败");
          }
        }
      } catch (error: any) {
        console.error(isEdit.value ? "更新需求失败:" : "创建需求失败:", error);
        ElMessage.error(
          error?.response?.data?.message ||
            error?.message ||
            (isEdit.value ? "需求更新失败" : "需求创建失败")
        );
      } finally {
        submitting.value = false;
      }
    }
  });
};

// 导入JSON生成需求
const handleImportJson = () => {
  // 创建文件输入元素
  const input = document.createElement("input");
  input.type = "file";
  input.accept = ".json";
  input.onchange = async (event: Event) => {
    const target = event.target as HTMLInputElement;
    const file = target.files?.[0];
    if (!file) return;

    importing.value = true;
    try {
      // 读取JSON文件内容
      const text = await file.text();
      let jsonData: Record<string, any>;

      try {
        jsonData = JSON.parse(text);
      } catch (parseError) {
        ElMessage.error("JSON文件格式错误，请检查文件内容");
        importing.value = false;
        return;
      }

      // 验证必填字段
      if (!props.projectId || !props.projectName) {
        ElMessage.error("项目信息不完整");
        importing.value = false;
        return;
      }

      // 调用导入接口
      const response = await loadRequirementFromJson({
        project_id: props.projectId,
        project_name: props.projectName,
        json_data: jsonData
      });

      if (response.code === 200) {
        ElMessage.success("需求导入成功");
        emit("refresh");
        handleClose();
      } else {
        ElMessage.error(response.message || "需求导入失败");
      }
    } catch (error: any) {
      console.error("导入JSON失败:", error);
      ElMessage.error(
        error?.response?.data?.message || error?.message || "导入JSON失败"
      );
    } finally {
      importing.value = false;
    }
  };
  input.click();
};
</script>

<style scoped lang="scss">
.requirement-drawer {
  padding: 0;
  height: 100%;
  overflow-y: auto;
  overflow-x: hidden;
  width: 100%;
  box-sizing: border-box;

  .create-mode-selector {
    margin-bottom: 24px;
    padding-bottom: 20px;
    border-bottom: 1px solid rgba(0, 0, 0, 0.06);

    :deep(.el-radio-group) {
      width: 100%;
      display: flex;
      gap: 0;

      .el-radio-button {
        flex: 1;

        .el-radio-button__inner {
          width: 100%;
          text-align: center;
        }
      }
    }
  }

  .import-json-section {
    padding: 40px 20px;
    text-align: center;

    .import-tip {
      margin-top: 20px;
      color: #909399;
      font-size: 14px;

      p {
        margin: 8px 0;
      }
    }
  }

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
    overflow-y: auto;
    overflow-x: hidden;
    width: 100%;
    box-sizing: border-box;
  }

  .el-drawer__header {
    margin-bottom: 0;
    padding: 20px 24px;
    border-bottom: 1px solid rgba(0, 0, 0, 0.06);
    font-size: 18px;
    font-weight: 600;
    color: #303133;
    width: 100%;
    box-sizing: border-box;
  }

  .el-drawer__footer {
    padding: 0 24px 24px;
    border-top: 1px solid rgba(0, 0, 0, 0.06);
    width: 100%;
    box-sizing: border-box;
  }
}

:deep(.el-input),
:deep(.el-textarea),
:deep(.el-select),
:deep(.el-date-picker),
:deep(.el-input-number) {
  width: 100%;
  box-sizing: border-box;

  .el-input__inner,
  .el-textarea__inner {
    transition: all 0.2s;
    width: 100%;
    box-sizing: border-box;

    &:focus {
      border-color: #409eff;
    }
  }
}

:deep(.el-select) {
  .el-select__wrapper {
    width: 100%;
    box-sizing: border-box;
  }
}

:deep(.el-date-editor) {
  width: 100% !important;
  box-sizing: border-box;
}

:deep(.el-row) {
  margin-left: 0 !important;
  margin-right: 0 !important;
  width: 100%;
  box-sizing: border-box;
}

:deep(.el-col) {
  padding-left: 10px !important;
  padding-right: 10px !important;
  box-sizing: border-box;
}

:deep(.el-select-dropdown) {
  .el-select-dropdown__item {
    padding: 8px 12px;

    &:hover {
      background-color: #f5f7fa;
    }
  }
}
</style>
