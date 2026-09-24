<template>
  <div class="app-version-page" ref="pageRef">
    <el-card class="search-card mb-20">
      <el-form :model="searchForm" :inline="true" class="search-form" @submit.prevent>
        <el-form-item label="记录 ID">
          <el-input v-model="searchForm.version_id" clearable placeholder="请输入 _id" style="width: 220px"
            @keyup.enter="handleSearch" />
        </el-form-item>
        <el-form-item label="特征码">
          <el-input v-model="searchForm.feature_code" clearable placeholder="请输入数字特征码" style="width: 220px"
            @input="onSearchFeatureCodeInput" @keyup.enter="handleSearch" />
        </el-form-item>
        <el-form-item>
          <el-button type="primary" @click="handleSearch">搜索</el-button>
          <el-button @click="handleSearchReset">重置</el-button>
        </el-form-item>
      </el-form>
    </el-card>

    <el-card v-loading="loading" ref="tableCardRef" shadow="never">
      <TablePanel :loading="loading" @refresh="loadList" @fullscreen-change="calculateTableHeight">
        <template #toolbar-extra>
          <el-button type="primary" @click="openUploadDialog">
            <el-icon>
              <Upload />
            </el-icon>
            上传版本
          </el-button>
        </template>

        <el-table v-if="total > 0" :data="tableData" :style="{ width: '100%' }" :height="tableHeight">
          <el-table-column label="序号" width="80" align="center">
            <template #default="{ $index }">
              {{ (currentPage - 1) * pageSize + $index + 1 }}
            </template>
          </el-table-column>
          <el-table-column label="版本号" min-width="120" show-overflow-tooltip>
            <template #default="{ row }">
              {{ formatAppVersionField(row, "version") }}
            </template>
          </el-table-column>
          <el-table-column label="特征码" width="100" align="center">
            <template #default="{ row }">
              {{ formatAppVersionField(row, "feature_code") }}
            </template>
          </el-table-column>
          <el-table-column label="版本描述" min-width="160" show-overflow-tooltip>
            <template #default="{ row }">
              {{ formatAppVersionField(row, "description") }}
            </template>
          </el-table-column>
          <el-table-column label="强制升级" width="100" align="center">
            <template #default="{ row }">
              <el-tag :type="row.force_update ? 'danger' : 'info'" size="small">
                {{ formatAppVersionField(row, "force_update") }}
              </el-tag>
            </template>
          </el-table-column>
          <el-table-column label="安装包" min-width="200" show-overflow-tooltip>
            <template #default="{ row }">
              <el-link v-if="row.file_path" type="primary" :href="getAppFileUrl(row.file_path)" target="_blank"
                :underline="false">
                {{ getAppFileName(row.file_path) }}
              </el-link>
              <span v-else>-</span>
            </template>
          </el-table-column>
          <el-table-column label="上传时间" width="170" show-overflow-tooltip>
            <template #default="{ row }">
              {{ formatAppVersionField(row, "upload_date") }}
            </template>
          </el-table-column>
          <el-table-column label="操作" width="140" fixed="right" align="center">
            <template #default="{ row }">
              <el-button type="primary" link @click="openEditDialog(row)">
                编辑
              </el-button>
              <el-button type="danger" link @click="handleDelete(row)">
                删除
              </el-button>
            </template>
          </el-table-column>
        </el-table>

        <el-empty v-else-if="!loading" description="暂无数据" :image-size="100" />

        <div v-if="total > 0" class="pagination-container">
          <el-pagination v-model:current-page="currentPage" v-model:page-size="pageSize" :page-sizes="[10, 20, 50, 100]"
            :total="total" layout="total, sizes, prev, pager, next, jumper" @size-change="handleSizeChange"
            @current-change="handlePageChange" />
        </div>
      </TablePanel>
    </el-card>

    <el-dialog v-model="uploadDialogVisible" :title="dialogTitle" width="560px" :close-on-click-modal="false"
      destroy-on-close @closed="resetUploadForm">
      <el-form ref="uploadFormRef" :model="uploadForm" :rules="uploadRules" label-width="100px" @submit.prevent>
        <el-form-item label="特征码" prop="feature_code" required>
          <el-input v-model="uploadForm.feature_code" clearable placeholder="请输入数字特征码"
            @input="onUploadFeatureCodeInput" />
        </el-form-item>
        <el-form-item label="版本号" prop="version">
          <el-input v-model="uploadForm.version" clearable placeholder="请输入版本号" />
        </el-form-item>
        <el-form-item label="版本描述" prop="description">
          <el-input v-model="uploadForm.description" type="textarea" :rows="3" maxlength="500" show-word-limit
            placeholder="选填" />
        </el-form-item>
        <el-form-item label="强制升级" prop="force_update">
          <el-switch v-model="uploadForm.force_update" />
        </el-form-item>
        <el-form-item label="安装包" prop="packageFile">
          <el-upload :file-list="packageFileList" :limit="1" :auto-upload="false" accept=".apk,.ipa,.aab,.zip"
            :on-change="handlePackageChange" :on-remove="handlePackageRemove" :on-exceed="handlePackageExceed">
            <el-button type="primary">选择安装包</el-button>
            <template #tip>
              <div class="el-upload__tip">
                {{ isEditMode ? "不选择则保留原安装包" : "支持 apk、ipa、aab、zip 等安装包格式" }}
              </div>
            </template>
          </el-upload>
          <div v-if="isEditMode && editingFilePath" class="current-package-tip">
            当前文件：{{ getAppFileName(editingFilePath) }}
          </div>
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="uploadDialogVisible = false">取消</el-button>
        <el-button type="primary" :loading="uploading" @click="handleDialogSubmit">
          确定
        </el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, computed, onMounted, onUnmounted, nextTick } from "vue";
import type { FormInstance, FormRules, UploadFile, UploadFiles } from "element-plus";
import { ElMessageBox } from "element-plus";
import { Upload } from "@element-plus/icons-vue";
import { message } from "@/utils/message";
import TablePanel from "@/components/TablePanel/index.vue";
import { TABLE_PANEL_TOOLBAR_HEIGHT } from "@/components/TablePanel/constants";
import {
  selectAppVersions,
  unwrapAppVersionList,
  formatAppVersionField,
  uploadAppVersion,
  updateAppVersion,
  deleteAppVersion,
  type AppVersionListItem
} from "@/api/app";
import {
  getAttachmentUrl as getAppFileUrl,
  getFileNameFromPath as getAppFileName
} from "@/utils/attachment";

defineOptions({
  name: "AppVersionControlIndex"
});

const pageRef = ref<HTMLElement>();
const tableCardRef = ref<InstanceType<typeof import("element-plus").ElCard>>();
const tableHeight = ref(400);
const loading = ref(false);
const tableData = ref<AppVersionListItem[]>([]);
const currentPage = ref(1);
const pageSize = ref(20);
const total = ref(0);

const searchForm = reactive({
  version_id: "",
  feature_code: ""
});

const uploadDialogVisible = ref(false);
const dialogMode = ref<"create" | "edit">("create");
const editingVersionId = ref("");
const editingFilePath = ref("");
const isEditMode = computed(() => dialogMode.value === "edit");
const dialogTitle = computed(() =>
  isEditMode.value ? "编辑 APP 版本" : "上传 APP 版本"
);
const uploading = ref(false);
const uploadFormRef = ref<FormInstance>();
const packageFileList = ref<UploadFile[]>([]);
const uploadForm = reactive({
  feature_code: "",
  version: "",
  description: "",
  force_update: false,
  packageFile: null as File | null
});

const FEATURE_CODE_PATTERN = /^\d+$/;

const sanitizeFeatureCode = (value: string) => value.replace(/\D/g, "");

const onSearchFeatureCodeInput = (value: string) => {
  searchForm.feature_code = sanitizeFeatureCode(value);
};

const onUploadFeatureCodeInput = (value: string) => {
  uploadForm.feature_code = sanitizeFeatureCode(value);
};

const validateFeatureCode = (
  _rule: unknown,
  value: unknown,
  callback: (error?: Error) => void
) => {
  const code = String(value ?? "").trim();
  if (!code) {
    callback(new Error("请输入特征码"));
    return;
  }
  if (!FEATURE_CODE_PATTERN.test(code)) {
    callback(new Error("特征码必须为数字"));
    return;
  }
  callback();
};

const validatePackageFile = (
  _rule: unknown,
  _value: unknown,
  callback: (error?: Error) => void
) => {
  if (isEditMode.value) {
    callback();
    return;
  }
  if (!uploadForm.packageFile) {
    callback(new Error("请选择 APP 安装包"));
    return;
  }
  callback();
};

const uploadRules: FormRules = {
  feature_code: [{ validator: validateFeatureCode, trigger: "blur" }],
  version: [{ required: true, message: "请输入版本号", trigger: "blur" }],
  packageFile: [{ validator: validatePackageFile, trigger: "change" }]
};

const openUploadDialog = () => {
  dialogMode.value = "create";
  editingVersionId.value = "";
  editingFilePath.value = "";
  uploadDialogVisible.value = true;
};

const openEditDialog = (row: AppVersionListItem) => {
  dialogMode.value = "edit";
  editingVersionId.value = row._id;
  editingFilePath.value = row.file_path || "";
  uploadForm.feature_code = String(row.feature_code ?? "");
  uploadForm.version = row.version || "";
  uploadForm.description = row.description || "";
  uploadForm.force_update = Boolean(row.force_update);
  uploadForm.packageFile = null;
  packageFileList.value = [];
  uploadDialogVisible.value = true;
  nextTick(() => uploadFormRef.value?.clearValidate());
};

const resetUploadForm = () => {
  dialogMode.value = "create";
  editingVersionId.value = "";
  editingFilePath.value = "";
  uploadForm.feature_code = "";
  uploadForm.version = "";
  uploadForm.description = "";
  uploadForm.force_update = false;
  uploadForm.packageFile = null;
  packageFileList.value = [];
  uploadFormRef.value?.clearValidate();
};

const handlePackageChange = (file: UploadFile, files: UploadFiles) => {
  packageFileList.value = files.slice(-1);
  uploadForm.packageFile = (packageFileList.value[0]?.raw as File) || null;
  uploadFormRef.value?.validateField("packageFile");
};

const handlePackageRemove = () => {
  packageFileList.value = [];
  uploadForm.packageFile = null;
  uploadFormRef.value?.validateField("packageFile");
};

const handlePackageExceed = () => {
  message("仅支持上传一个安装包文件", { type: "warning" });
};

const handleDialogSubmit = async () => {
  if (!uploadFormRef.value) return;
  const valid = await uploadFormRef.value.validate().catch(() => false);
  if (!valid) return;
  if (!isEditMode.value && !uploadForm.packageFile) return;

  uploading.value = true;
  try {
    const payload = {
      version: uploadForm.version.trim(),
      feature_code: uploadForm.feature_code.trim(),
      description: uploadForm.description.trim(),
      force_update: uploadForm.force_update
    };

    const response = isEditMode.value
      ? await updateAppVersion({
          version_id: editingVersionId.value,
          ...payload,
          file: uploadForm.packageFile || undefined
        })
      : await uploadAppVersion({
          file: uploadForm.packageFile as File,
          ...payload
        });

    if (response.code !== 200) {
      message(response.message || (isEditMode.value ? "更新失败" : "上传失败"), {
        type: "error"
      });
      return;
    }
    message(isEditMode.value ? "更新成功" : "上传成功", { type: "success" });
    uploadDialogVisible.value = false;
    loadList();
  } catch (error: unknown) {
    const err = error as { message?: string };
    message(
      err?.message || (isEditMode.value ? "更新失败" : "上传失败"),
      { type: "error" }
    );
  } finally {
    uploading.value = false;
  }
};

const handleDelete = async (row: AppVersionListItem) => {
  if (!row._id) return;
  try {
    await ElMessageBox.confirm(
      `确定删除版本「${row.version || row._id}」吗？此操作不可恢复。`,
      "删除确认",
      {
        type: "warning",
        confirmButtonText: "删除",
        cancelButtonText: "取消"
      }
    );
  } catch {
    return;
  }

  try {
    const response = await deleteAppVersion({ version_id: row._id });
    if (response.code !== 200) {
      message(response.message || "删除失败", { type: "error" });
      return;
    }
    message("删除成功", { type: "success" });
    loadList();
  } catch (error: unknown) {
    const err = error as { message?: string };
    message(err?.message || "删除失败", { type: "error" });
  }
};

const calculateTableHeight = () => {
  nextTick(() => {
    const cardEl = tableCardRef.value?.$el as HTMLElement | undefined;
    if (!cardEl) return;
    const rect = cardEl.getBoundingClientRect();
    const paginationHeight = 56;
    const padding = 24;
    tableHeight.value = Math.max(
      280,
      window.innerHeight -
      rect.top -
      TABLE_PANEL_TOOLBAR_HEIGHT -
      paginationHeight -
      padding
    );
  });
};

const loadList = async () => {
  const code = searchForm.feature_code.trim();
  if (code && !FEATURE_CODE_PATTERN.test(code)) {
    message("特征码必须为数字", { type: "warning" });
    return;
  }

  loading.value = true;
  try {
    const response = await selectAppVersions({
      version_id: searchForm.version_id.trim(),
      feature_code: searchForm.feature_code.trim(),
      page: currentPage.value,
      page_size: pageSize.value
    });
    if (response.code !== 200) {
      message(response.message || "加载失败", { type: "error" });
      tableData.value = [];
      total.value = 0;
      return;
    }
    const { list, total: count } = unwrapAppVersionList(response);
    tableData.value = list;
    total.value = count;
  } catch (error: unknown) {
    const err = error as { message?: string };
    message(err?.message || "加载失败", { type: "error" });
    tableData.value = [];
    total.value = 0;
  } finally {
    loading.value = false;
    calculateTableHeight();
  }
};

const handleSearch = () => {
  currentPage.value = 1;
  loadList();
};

const handleSearchReset = () => {
  searchForm.version_id = "";
  searchForm.feature_code = "";
  currentPage.value = 1;
  loadList();
};

const handleSizeChange = () => {
  currentPage.value = 1;
  loadList();
};

const handlePageChange = () => {
  loadList();
};

const onResize = () => calculateTableHeight();

onMounted(() => {
  loadList();
  window.addEventListener("resize", onResize);
});

onUnmounted(() => {
  window.removeEventListener("resize", onResize);
});
</script>

<style scoped>
.app-version-page {
  padding: 0;
}

.search-card {
  margin-bottom: 16px;
}

.mb-20 {
  margin-bottom: 20px;
}

.pagination-container {
  display: flex;
  justify-content: flex-end;
  margin-top: 16px;
}

.current-package-tip {
  margin-top: 8px;
  font-size: 12px;
  color: var(--el-text-color-secondary);
}
</style>
