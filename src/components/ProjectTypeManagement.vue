<template>
  <div class="project-type-management">
    <div class="header">
      <h2>项目类型管理</h2>
      <el-button type="primary" @click="showAddDialog = true">
        <el-icon>
          <Plus />
        </el-icon>
        新增项目类型
      </el-button>
    </div>

    <div class="content">
      <TablePanel @refresh="loadData">
      <el-table :data="projectTypes" style="width: 100%">
        <el-table-column prop="name" label="类型名称" width="200" />
        <el-table-column prop="code" label="类型代码" width="150" />
        <el-table-column prop="type" label="类型" width="150">
          <template #default="{ row }">
            {{ getTypeText(row.type) }}
          </template>
        </el-table-column>
        <el-table-column prop="description" label="描述" />
        <el-table-column
          prop="customFields.length"
          label="自定义字段数"
          width="120"
        />
        <el-table-column label="操作" width="200" fixed="right">
          <template #default="{ row }">
            <el-button size="small" @click="editProjectType(row)"
              >编辑</el-button
            >
            <el-button size="small" type="primary" @click="manageFields(row)"
              >管理字段</el-button
            >
            <el-button
              size="small"
              type="danger"
              @click="deleteProjectType(row)"
              >删除</el-button
            >
          </template>
        </el-table-column>
      </el-table>
      </TablePanel>
    </div>

    <!-- 新增/编辑项目类型对话框 -->
    <el-dialog
      v-model="showAddDialog"
      :title="isEdit ? '编辑项目类型' : '新增项目类型'"
      width="600px"
    >
      <el-form
        ref="formRef"
        :model="formData"
        :rules="formRules"
        label-width="100px"
      >
        <el-form-item label="类型名称" prop="name">
          <el-input v-model="formData.name" placeholder="请输入类型名称" />
        </el-form-item>
        <el-form-item label="类型代码" prop="code">
          <el-input v-model="formData.code" placeholder="请输入类型代码" />
        </el-form-item>
        <el-form-item label="类型" prop="type">
          <el-select v-model="formData.type" placeholder="请选择类型">
            <el-option label="软件开发" value="software" />
            <el-option label="硬件研发" value="hardware" />
            <el-option label="研发项目" value="research" />
            <el-option label="实施项目" value="implementation" />
            <el-option label="维护项目" value="maintenance" />
          </el-select>
        </el-form-item>
        <el-form-item label="描述" prop="description">
          <el-input
            v-model="formData.description"
            type="textarea"
            placeholder="请输入描述"
          />
        </el-form-item>
      </el-form>

      <template #footer>
        <el-button @click="showAddDialog = false">取消</el-button>
        <el-button type="primary" @click="saveProjectType">确定</el-button>
      </template>
    </el-dialog>

    <!-- 自定义字段管理对话框 -->
    <el-dialog v-model="showFieldsDialog" title="管理自定义字段" width="800px">
      <div class="fields-header">
        <span>项目类型：{{ currentProjectType?.name }}</span>
        <el-button type="primary" size="small" @click="addField">
          <el-icon>
            <Plus />
          </el-icon>
          添加字段
        </el-button>
      </div>

      <el-table :data="currentFields" style="width: 100%; margin-top: 20px">
        <el-table-column prop="label" label="字段标签" width="150" />
        <el-table-column prop="name" label="字段名称" width="150" />
        <el-table-column prop="type" label="字段类型" width="120" />
        <el-table-column prop="required" label="必填" width="80">
          <template #default="{ row }">
            <el-tag :type="row.required ? 'danger' : 'success'">
              {{ row.required ? "是" : "否" }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="order" label="排序" width="80" />
        <el-table-column label="操作" width="150">
          <template #default="{ row, $index }">
            <el-button size="small" @click="editField(row, $index)"
              >编辑</el-button
            >
            <el-button size="small" type="danger" @click="deleteField($index)"
              >删除</el-button
            >
          </template>
        </el-table-column>
      </el-table>

      <template #footer>
        <el-button @click="showFieldsDialog = false">取消</el-button>
        <el-button type="primary" @click="saveFields">确定</el-button>
      </template>
    </el-dialog>

    <!-- 字段编辑对话框 -->
    <el-dialog
      v-model="showFieldDialog"
      :title="isEditField ? '编辑字段' : '新增字段'"
      width="500px"
    >
      <el-form
        ref="fieldFormRef"
        :model="fieldData"
        :rules="fieldRules"
        label-width="100px"
      >
        <el-form-item label="字段标签" prop="label">
          <el-input v-model="fieldData.label" placeholder="请输入字段标签" />
        </el-form-item>
        <el-form-item label="字段名称" prop="name">
          <el-input v-model="fieldData.name" placeholder="请输入字段名称" />
        </el-form-item>
        <el-form-item label="字段类型" prop="type">
          <el-select v-model="fieldData.type" placeholder="请选择字段类型">
            <el-option label="文本" value="text" />
            <el-option label="数字" value="number" />
            <el-option label="日期" value="date" />
            <el-option label="选择" value="select" />
            <el-option label="多行文本" value="textarea" />
            <el-option label="布尔值" value="boolean" />
          </el-select>
        </el-form-item>
        <el-form-item label="是否必填" prop="required">
          <el-switch v-model="fieldData.required" />
        </el-form-item>
        <el-form-item label="默认值" prop="defaultValue">
          <el-input
            v-model="fieldData.defaultValue"
            placeholder="请输入默认值"
          />
        </el-form-item>
        <el-form-item label="排序" prop="order">
          <el-input-number v-model="fieldData.order" :min="1" />
        </el-form-item>
      </el-form>

      <template #footer>
        <el-button @click="showFieldDialog = false">取消</el-button>
        <el-button type="primary" @click="saveField">确定</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted, computed } from "vue";
import { ElMessage, ElMessageBox } from "element-plus";
import { Plus } from "@element-plus/icons-vue";
import type { FormInstance, FormRules } from "element-plus";
import type { ProjectTypeConfig, ProjectTypeField } from "@/types";
import { useProjectTypeStoreHook } from "@/store/modules/projectType";
import TablePanel from "@/components/TablePanel/index.vue";
import { ProjectType } from "@/types";

const projectTypeStore = useProjectTypeStoreHook();

const showAddDialog = ref(false);
const showFieldsDialog = ref(false);
const showFieldDialog = ref(false);
const isEdit = ref(false);
const isEditField = ref(false);
const currentFieldIndex = ref(-1);
const formRef = ref<FormInstance>();
const fieldFormRef = ref<FormInstance>();

const formData = reactive({
  id: "",
  name: "",
  code: "",
  type: "",
  description: ""
});

const fieldData = reactive({
  id: "",
  label: "",
  name: "",
  type: "",
  required: false,
  defaultValue: "",
  order: 1
});

const formRules: FormRules = {
  name: [{ required: true, message: "请输入类型名称", trigger: "blur" }],
  code: [{ required: true, message: "请输入类型代码", trigger: "blur" }],
  type: [{ required: true, message: "请选择类型", trigger: "change" }]
};

const fieldRules: FormRules = {
  label: [{ required: true, message: "请输入字段标签", trigger: "blur" }],
  name: [{ required: true, message: "请输入字段名称", trigger: "blur" }],
  type: [{ required: true, message: "请选择字段类型", trigger: "change" }]
};

const projectTypes = computed(() => projectTypeStore.allProjectTypes);
const currentProjectType = computed(() => projectTypeStore.currentProjectType);
const currentFields = computed(
  () => currentProjectType.value?.customFields || []
);

const getTypeText = (type: ProjectType) => {
  const typeMap: Record<ProjectType, string> = {
    [ProjectType.SOFTWARE]: "软件开发",
    [ProjectType.HARDWARE]: "硬件研发",
    [ProjectType.RESEARCH]: "研发项目",
    [ProjectType.IMPLEMENTATION]: "实施项目",
    [ProjectType.MAINTENANCE]: "维护项目"
  };
  return typeMap[type] || type;
};

const loadData = async () => {
  await projectTypeStore.loadProjectTypes();
};

const editProjectType = (projectType: ProjectTypeConfig) => {
  isEdit.value = true;
  Object.assign(formData, {
    id: projectType.id,
    name: projectType.name,
    code: projectType.code,
    type: projectType.type,
    description: projectType.description
  });
  showAddDialog.value = true;
};

const deleteProjectType = async (projectType: ProjectTypeConfig) => {
  try {
    await ElMessageBox.confirm(
      `确定要删除项目类型"${projectType.name}"吗？`,
      "确认删除",
      {
        confirmButtonText: "确定",
        cancelButtonText: "取消",
        type: "warning"
      }
    );

    projectTypeStore.deleteProjectType(projectType.id);
    ElMessage.success("删除成功");
  } catch {
    // 用户取消删除
  }
};

const saveProjectType = async () => {
  if (!formRef.value) return;

  try {
    await formRef.value.validate();

    const projectTypeData: ProjectTypeConfig = {
      id: formData.id || `type-${Date.now()}`,
      name: formData.name,
      code: formData.code,
      type: formData.type as ProjectType,
      description: formData.description,
      customFields: [],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    if (isEdit.value) {
      projectTypeStore.updateProjectType(projectTypeData);
      ElMessage.success("更新成功");
    } else {
      projectTypeStore.addProjectType(projectTypeData);
      ElMessage.success("添加成功");
    }

    showAddDialog.value = false;
    resetForm();
  } catch (error) {
    console.error("表单验证失败:", error);
  }
};

const manageFields = (projectType: ProjectTypeConfig) => {
  projectTypeStore.setCurrentProjectType(projectType);
  showFieldsDialog.value = true;
};

const addField = () => {
  isEditField.value = false;
  Object.assign(fieldData, {
    id: "",
    label: "",
    name: "",
    type: "",
    required: false,
    defaultValue: "",
    order: currentFields.value.length + 1
  });
  showFieldDialog.value = true;
};

const editField = (field: ProjectTypeField, index: number) => {
  isEditField.value = true;
  currentFieldIndex.value = index;
  Object.assign(fieldData, {
    id: field.id,
    label: field.label,
    name: field.name,
    type: field.type,
    required: field.required,
    defaultValue: field.defaultValue || "",
    order: field.order
  });
  showFieldDialog.value = true;
};

const deleteField = (index: number) => {
  if (currentProjectType.value) {
    const fields = [...currentProjectType.value.customFields];
    fields.splice(index, 1);
    const updated = {
      ...currentProjectType.value,
      customFields: fields
    };
    projectTypeStore.updateProjectType(updated);
    ElMessage.success("删除成功");
  }
};

const saveField = async () => {
  if (!fieldFormRef.value) return;

  try {
    await fieldFormRef.value.validate();

    if (!currentProjectType.value) return;

    const field: ProjectTypeField = {
      id: fieldData.id || `field-${Date.now()}`,
      name: fieldData.name,
      label: fieldData.label,
      type: fieldData.type as any,
      required: fieldData.required,
      defaultValue: fieldData.defaultValue,
      order: fieldData.order
    };

    const fields = [...currentProjectType.value.customFields];

    if (isEditField.value) {
      fields[currentFieldIndex.value] = field;
    } else {
      fields.push(field);
    }

    const updated = {
      ...currentProjectType.value,
      customFields: fields
    };
    projectTypeStore.updateProjectType(updated);

    ElMessage.success(isEditField.value ? "更新成功" : "添加成功");
    showFieldDialog.value = false;
    resetFieldForm();
  } catch (error) {
    console.error("表单验证失败:", error);
  }
};

const saveFields = () => {
  showFieldsDialog.value = false;
  ElMessage.success("保存成功");
};

const resetForm = () => {
  Object.assign(formData, {
    id: "",
    name: "",
    code: "",
    type: "",
    description: ""
  });
  isEdit.value = false;
};

const resetFieldForm = () => {
  Object.assign(fieldData, {
    id: "",
    label: "",
    name: "",
    type: "",
    required: false,
    defaultValue: "",
    order: 1
  });
  isEditField.value = false;
  currentFieldIndex.value = -1;
};

onMounted(() => {
  loadData();
});
</script>

<style scoped lang="scss">
.project-type-management {
  padding: 20px;
}

.header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
}

.content {
  background: white;
  padding: 20px;
  border-radius: 8px;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
}

.fields-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}
</style>
