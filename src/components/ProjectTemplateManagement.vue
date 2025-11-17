<template>
  <div class="project-template-management">
    <div class="header">
      <h2>项目模板管理</h2>
      <el-button type="primary" @click="showAddDialog = true">
        <el-icon>
          <Plus />
        </el-icon>
        新增模板
      </el-button>
    </div>

    <div class="content">
      <el-table :data="templates" style="width: 100%">
        <el-table-column prop="name" label="模板名称" width="200" />
        <el-table-column prop="type.name" label="项目类型" width="150">
          <template #default="{ row }">
            {{ row.type?.name || "-" }}
          </template>
        </el-table-column>
        <el-table-column prop="description" label="描述" />
        <el-table-column prop="usageCount" label="使用次数" width="100" />
        <el-table-column prop="isActive" label="状态" width="100">
          <template #default="{ row }">
            <el-tag :type="row.isActive ? 'success' : 'danger'">
              {{ row.isActive ? "启用" : "禁用" }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column label="操作" width="250" fixed="right">
          <template #default="{ row }">
            <el-button size="small" @click="viewTemplate(row)">查看</el-button>
            <el-button size="small" @click="editTemplate(row)">编辑</el-button>
            <el-button size="small" type="primary" @click="copyTemplate(row)"
              >复制</el-button
            >
            <el-button size="small" type="danger" @click="deleteTemplate(row)"
              >删除</el-button
            >
          </template>
        </el-table-column>
      </el-table>
    </div>

    <!-- 模板详情对话框 -->
    <el-dialog v-model="showViewDialog" title="模板详情" width="80%">
      <div v-if="currentTemplate" class="template-detail">
        <div class="template-info">
          <h3>{{ currentTemplate.name }}</h3>
          <p>{{ currentTemplate.description }}</p>
          <div class="template-meta">
            <span>项目类型：{{ currentTemplate.type?.name || "-" }}</span>
            <span>使用次数：{{ currentTemplate.usageCount || 0 }}</span>
            <span>创建时间：{{ formatDate(currentTemplate.createdAt) }}</span>
          </div>
        </div>

        <div
          v-if="currentTemplate.nodes && currentTemplate.nodes.length > 0"
          class="template-tree"
        >
          <h4>模板结构</h4>
          <el-tree
            :data="templateTreeData"
            node-key="id"
            :props="{ label: 'name', children: 'children' }"
            :expand-on-click-node="false"
          >
            <template #default="{ data }">
              <div class="tree-node">
                <span class="node-label">{{ data.name }}</span>
                <span class="node-type">{{ getNodeTypeLabel(data.type) }}</span>
                <span v-if="data.estimatedDays" class="node-days"
                  >{{ data.estimatedDays }}天</span
                >
                <span v-if="data.assigneeRole" class="node-role">{{
                  data.assigneeRole
                }}</span>
              </div>
            </template>
          </el-tree>
        </div>
      </div>

      <template #footer>
        <el-button @click="showViewDialog = false">关闭</el-button>
      </template>
    </el-dialog>

    <!-- 新增/编辑模板对话框 -->
    <el-dialog
      v-model="showAddDialog"
      :title="isEdit ? '编辑模板' : '新增模板'"
      width="600px"
    >
      <el-form
        ref="formRef"
        :model="formData"
        :rules="formRules"
        label-width="100px"
      >
        <el-form-item label="模板名称" prop="name">
          <el-input v-model="formData.name" placeholder="请输入模板名称" />
        </el-form-item>
        <el-form-item label="项目类型" prop="typeId">
          <el-select v-model="formData.typeId" placeholder="请选择项目类型">
            <el-option
              v-for="type in projectTypes"
              :key="type.id"
              :label="type.name"
              :value="type.id"
            />
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
        <el-button type="primary" @click="saveTemplate">确定</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted, computed } from "vue";
import { ElMessage, ElMessageBox } from "element-plus";
import { Plus } from "@element-plus/icons-vue";
import type { FormInstance, FormRules } from "element-plus";
import type { ProjectTemplate, ProjectTemplateNode } from "@/types";
import { useProjectTemplateStoreHook } from "@/store/modules/projectTemplate";
import { useProjectTypeStoreHook } from "@/store/modules/projectType";
import { mockUsers } from "@/mock/users";

const projectTemplateStore = useProjectTemplateStoreHook();
const projectTypeStore = useProjectTypeStoreHook();

const showAddDialog = ref(false);
const showViewDialog = ref(false);
const isEdit = ref(false);
const formRef = ref<FormInstance>();

const formData = reactive({
  id: "",
  name: "",
  typeId: "",
  description: ""
});

const formRules: FormRules = {
  name: [{ required: true, message: "请输入模板名称", trigger: "blur" }],
  typeId: [{ required: true, message: "请选择项目类型", trigger: "change" }]
};

const templates = computed(() => projectTemplateStore.allTemplates);
const projectTypes = computed(() => projectTypeStore.allProjectTypes);
const currentTemplate = computed(() => projectTemplateStore.currentTemplate);

const templateTreeData = computed(() => {
  if (!currentTemplate.value || !currentTemplate.value.nodes) return [];

  const buildTreeData = (node: ProjectTemplateNode): any => {
    return {
      id: node.id,
      name: node.name,
      type: node.type,
      estimatedDays: node.estimatedDays,
      assigneeRole: node.assigneeRole,
      children: node.children
        ? node.children.map(child => buildTreeData(child))
        : undefined
    };
  };

  return currentTemplate.value.rootNode
    ? [buildTreeData(currentTemplate.value.rootNode)]
    : [];
});

const loadData = async () => {
  await Promise.all([
    projectTemplateStore.loadTemplates(),
    projectTypeStore.loadProjectTypes()
  ]);
};

const viewTemplate = (template: ProjectTemplate) => {
  projectTemplateStore.setCurrentTemplate(template);
  showViewDialog.value = true;
};

const editTemplate = (template: ProjectTemplate) => {
  isEdit.value = true;
  Object.assign(formData, {
    id: template.id,
    name: template.name,
    typeId: template.typeId,
    description: template.description
  });
  showAddDialog.value = true;
};

const copyTemplate = (template: ProjectTemplate) => {
  isEdit.value = false;
  Object.assign(formData, {
    id: "",
    name: `${template.name} - 副本`,
    typeId: template.typeId,
    description: template.description
  });
  showAddDialog.value = true;
};

const deleteTemplate = async (template: ProjectTemplate) => {
  try {
    await ElMessageBox.confirm(
      `确定要删除模板"${template.name}"吗？`,
      "确认删除",
      {
        confirmButtonText: "确定",
        cancelButtonText: "取消",
        type: "warning"
      }
    );

    projectTemplateStore.deleteTemplate(template.id);
    ElMessage.success("删除成功");
  } catch {
    // 用户取消删除
  }
};

const saveTemplate = async () => {
  if (!formRef.value) return;

  try {
    await formRef.value.validate();

    const type = projectTypes.value.find(t => t.id === formData.typeId);

    const templateData: ProjectTemplate = {
      id: formData.id || `template-${Date.now()}`,
      name: formData.name,
      description: formData.description,
      typeId: formData.typeId,
      type: type,
      rootNode: undefined,
      nodes: [],
      usageCount: 0,
      isActive: true,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      createdBy: "1",
      createdByUser: mockUsers[0]
    };

    if (isEdit.value) {
      projectTemplateStore.updateTemplate(templateData);
      ElMessage.success("更新成功");
    } else {
      projectTemplateStore.addTemplate(templateData);
      ElMessage.success("添加成功");
    }

    showAddDialog.value = false;
    resetForm();
  } catch (error) {
    console.error("表单验证失败:", error);
  }
};

const getNodeTypeLabel = (type: string) => {
  const typeMap: Record<string, string> = {
    phase: "阶段",
    milestone: "里程碑",
    task: "任务",
    subtask: "子任务"
  };
  return typeMap[type] || type;
};

const formatDate = (dateString: string) => {
  return new Date(dateString).toLocaleDateString();
};

const resetForm = () => {
  Object.assign(formData, {
    id: "",
    name: "",
    typeId: "",
    description: ""
  });
  isEdit.value = false;
};

onMounted(() => {
  loadData();
});
</script>

<style scoped lang="scss">
.project-template-management {
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

.template-detail {
  max-height: 600px;
  overflow-y: auto;
}

.template-info {
  margin-bottom: 20px;
  padding: 20px;
  background: #f5f5f5;
  border-radius: 8px;

  h3 {
    margin: 0 0 10px 0;
    color: #333;
  }

  p {
    margin: 0 0 15px 0;
    color: #666;
  }
}

.template-meta {
  display: flex;
  gap: 20px;
  font-size: 14px;
  color: #888;
}

.template-tree {
  margin-top: 20px;

  h4 {
    margin: 0 0 15px 0;
    color: #333;
  }
}

.tree-node {
  display: flex;
  align-items: center;
  gap: 10px;
  width: 100%;
}

.node-label {
  font-weight: 500;
}

.node-type {
  background: #e1f5fe;
  color: #0277bd;
  padding: 2px 8px;
  border-radius: 4px;
  font-size: 12px;
}

.node-days {
  background: #f3e5f5;
  color: #7b1fa2;
  padding: 2px 8px;
  border-radius: 4px;
  font-size: 12px;
}

.node-role {
  background: #e8f5e8;
  color: #2e7d32;
  padding: 2px 8px;
  border-radius: 4px;
  font-size: 12px;
}
</style>
