<script setup lang="ts">
import { ref, reactive, onMounted, h, resolveComponent } from "vue";
import { message } from "@/utils/message";
import { ElMessageBox } from "element-plus";
import type { FormInstance, FormRules } from "element-plus";
import {
  getUserList,
  addUser,
  updateUser,
  deleteUser,
  getDepartmentNameList,
  loadUserFromExcel,
  type User,
  type DepartmentListItem,
  type UserListResponse,
  type AddUserParams
} from "@/api/system";
import { Plus as Add, Edit, Delete, Refresh, Search } from "@element-plus/icons-vue";

defineOptions({
  name: "SystemUser"
});

// 角色映射
const roleMap: Record<string, string> = {
  ProjectManager: "项目经理",
  DepartmentManager: "部门主管",
  Member: "普通成员",
  ProjectDirector: "项目总监",
  BusinessDepartmentMembers: "业务部门成员"
};

const tableRef = ref();
const formRef = ref<FormInstance>();
const queryFormRef = ref<FormInstance>();
const fileInputRef = ref<HTMLInputElement>();
const loading = ref(false);
const dialogVisible = ref(false);
const dialogTitle = ref("新增用户");
const isEdit = ref(false);

const formData = reactive<{
  id?: number;
  username: string;
  password: string;
  department: string;
  role: string; // 表单中使用字符串类型（单选）
  workchat_username: string;
}>({
  id: undefined,
  username: "",
  password: "",
  department: "",
  role: "", // 初始值为空字符串
  workchat_username: ""
});

const formRules: FormRules = {
  username: [
    { required: true, message: "请输入用户名", trigger: "blur" },
    { min: 2, max: 20, message: "用户名长度在 3 到 20 个字符", trigger: "blur" }
  ],
  password: [
    {
      required: true,
      validator: (rule, value, callback) => {
        if (!isEdit.value && !value) {
          callback(new Error("请输入密码"));
        } else if (value && value.length < 6) {
          callback(new Error("密码长度不能少于 6 个字符"));
        } else {
          callback();
        }
      },
      trigger: "blur"
    }
  ],

  department: [
    { required: true, message: "请选择部门", trigger: "change" }
  ],
  role: [
    {
      required: true,
      validator: (rule, value, callback) => {
        if (!value || value.trim() === "") {
          callback(new Error("请选择角色"));
        } else {
          callback();
        }
      },
      trigger: "change"
    }
  ]
};

// 查询表单
const queryForm = reactive({
  username: "",
  department: ""
});

// 表格数据类型（role 为数组）
interface TableUser extends Omit<User, 'role'> {
  role: string[];
}

const tableData = ref<TableUser[]>([]);
const departmentList = ref<string[]>([]);

const columns = [
  {
    label: "序号",
    type: "index",
    width: 60
  },
  {
    label: "用户名",
    prop: "username",
    minWidth: 120
  },
  // {
  //   label: "邮箱",
  //   prop: "email",
  //   minWidth: 150
  // },
  {
    label: "部门",
    prop: "department",
    minWidth: 120
  },
  {
    label: "角色",
    prop: "role",
    width: 200,
    cellRenderer: ({ row }) => {
      const roles = Array.isArray(row.role)
        ? row.role
        : row.role
          ? [row.role]
          : [];
      if (roles.length === 0) {
        return h("span", { style: { color: "#999" } }, "暂无角色");
      }
      const ElTag = resolveComponent("el-tag");
      return h(
        "div",
        { style: { display: "flex", flexWrap: "wrap", gap: "5px" } },
        roles.map((role: string) =>
          h(ElTag, { key: role }, { default: () => roleMap[role] || role })
        )
      );
    }
  },
  {
    label: "企业微信账号",
    prop: "workchat_username",
    minWidth: 120
  },
  {
    label: "操作",
    fixed: "right",
    width: 180,
    slot: "operation"
  }
];

// 加载部门列表
const loadDepartmentList = async () => {
  try {
    const response = await getDepartmentNameList();
    if (response.code === 200) {
      // 从返回的 result 数组中提取部门名称
      departmentList.value = response.result?.map(item => item["部门名"]) || [];
    }
  } catch (error) {
    console.error("加载部门列表失败:", error);
  }
};

// 加载数据
const loadData = async () => {
  loading.value = true;
  try {
    // 构建查询参数，只包含非空的值
    const queryParams: { username: string; department: string } = {
      username: "",
      department: ""
    };

    if (queryForm.username && queryForm.username.trim()) {
      queryParams.username = queryForm.username.trim();
    }

    if (queryForm.department && queryForm.department.trim()) {
      queryParams.department = queryForm.department.trim();
    }

    const response = await getUserList(queryParams);
    if (response.code === 200) {
      // 将返回的数据转换为表格需要的格式
      // 保持 role 为数组格式，以便编辑时能正确填充
      tableData.value = response.result.map(user => ({
        id: undefined,
        username: user.username,
        password: user.password,
        // email: user.email || "",
        department: user.department || "",
        role: Array.isArray(user.role) ? user.role : user.role ? [user.role] : [],
        workchat_username: user.workchat_username || ""
      }));
    } else {
      message(response.message || "获取用户列表失败", { type: "error" });
    }
  } catch (error) {
    message("获取用户列表失败", { type: "error" });
  } finally {
    loading.value = false;
  }
};

// 打开新增对话框
const handleAdd = () => {
  dialogTitle.value = "新增用户";
  isEdit.value = false;
  resetForm();
  dialogVisible.value = true;
};

// 批量导入
const handleBatchImport = () => {
  fileInputRef.value?.click();
};

const handleFileChange = async (event: Event) => {
  const target = event.target as HTMLInputElement;
  const file = target.files?.[0];
  if (file) {
    // 检查文件类型
    if (!file.name.endsWith('.xlsx') && !file.name.endsWith('.xls')) {
      message('请选择Excel文件', { type: 'error' });
      return;
    }
    try {
      const response = await loadUserFromExcel({ file });
      if (response.code === 200) {
        message('批量导入成功', { type: 'success' });
        loadData(); // 刷新列表
      } else {
        message(response.message || '批量导入失败', { type: 'error' });
      }
    } catch (error) {
      message('批量导入失败', { type: 'error' });
    }
  }
  // 重置input
  target.value = '';
};

// 打开编辑对话框
const handleEdit = (row: TableUser) => {
  dialogTitle.value = "编辑用户";
  isEdit.value = true;
  // 处理编辑时的数据格式：role 数组转换为字符串（单选），department 需要转换为字符串
  const editData = {
    ...row,
    password: "",
    department: row.department
      ? Array.isArray(row.department)
        ? row.department[0]
        : row.department
      : "",
    // 将 role 数组转换为字符串（取第一个，因为表单是单选）
    role: row.role && Array.isArray(row.role) && row.role.length > 0
      ? row.role[0]
      : row.role
        ? (typeof row.role === "string" ? row.role : String(row.role))
        : "",
    workchat_username: row.workchat_username || ""
  };
  Object.assign(formData, editData);
  dialogVisible.value = true;
};

// 删除
const handleDelete = async (row: TableUser) => {
  if (!row.username) {
    message("无法获取用户名", { type: "error" });
    return;
  }
  try {
    await ElMessageBox.confirm(
      `确定要删除用户 "${row.username}" 吗？`,
      "提示",
      {
        confirmButtonText: "确定",
        cancelButtonText: "取消",
        type: "warning"
      }
    );
    const response = await deleteUser(row.username);
    if (response.code === 200) {
      message("删除成功", { type: "success" });
      loadData();
    } else {
      message(response.message || "删除失败", { type: "error" });
    }
  } catch (error) {
    if (error !== "cancel") {
      message("删除失败", { type: "error" });
    }
  }
};

// 保存
const handleSave = async () => {
  if (!formRef.value) return;
  await formRef.value.validate(async valid => {
    if (valid) {
      try {
        let response;
        if (isEdit.value) {
          // 编辑时，如果密码为空则不传密码
          // 将 role 字符串转换为数组格式
          const submitData: any = {
            username: formData.username,
            role: formData.role ? [formData.role] : [],
            department: formData.department || "",
            workchat_username: formData.workchat_username || ""
          };
          // 如果密码不为空，则包含密码
          if (formData.password) {
            submitData.password = formData.password;
          }
          response = await updateUser(submitData as any);
        } else {
          // 新增用户：按照 API 要求的格式构建参数
          // 将 role 字符串转换为数组格式
          const submitData = {
            username: formData.username,
            password: formData.password,
            role: formData.role ? [formData.role] : [],
            department: formData.department || "",
            workchat_username: formData.workchat_username || ""
          };
          response = await addUser(submitData);
        }
        if (response.code === 200) {
          message(isEdit.value ? "编辑成功" : "新增成功", { type: "success" });
          dialogVisible.value = false;
          loadData();
        } else {
          message(response.message || "操作失败", { type: "error" });
        }
      } catch (error) {
        message("操作失败", { type: "error" });
      }
    }
  });
};

// 重置表单
const resetForm = () => {
  formData.id = undefined;
  formData.username = "";
  formData.password = "";
  formData.department = "";
  formData.role = ""; // 重置为空字符串
  formData.workchat_username = "";
  formRef.value?.resetFields();
};

// 查询
const handleQuery = () => {
  loadData();
};

// 重置查询
const handleReset = () => {
  queryFormRef.value?.resetFields();
  queryForm.username = "";
  queryForm.department = undefined;
  loadData();
};

// 刷新
const handleRefresh = () => {
  loadData();
};

onMounted(() => {
  loadDepartmentList();
  loadData();
});
</script>

<template>
  <div class="user-management">
    <input ref="fileInputRef" type="file" accept=".xlsx,.xls" @change="handleFileChange" style="display: none;" />
    <!-- 查询表单 -->
    <el-card shadow="never">
      <el-form ref="queryFormRef" :model="queryForm" :inline="true" class="query-form">
        <el-form-item label="用户名" prop="username">
          <el-input v-model="queryForm.username" placeholder="请输入用户名" clearable class="query-input"
            @keyup.enter="handleQuery" />
        </el-form-item>
        <el-form-item label="部门" prop="department">
          <el-select v-model="queryForm.department" placeholder="请选择部门" clearable class="query-select">
            <el-option v-for="dept in departmentList" :key="dept" :label="dept" :value="dept" />
          </el-select>
        </el-form-item>
        <!-- <el-form-item label="状态" prop="status">
          <el-select v-model="queryForm.status" placeholder="请选择状态" clearable class="query-select">
            <el-option label="启用" :value="1" />
            <el-option label="禁用" :value="0" />
          </el-select>
        </el-form-item> -->
        <el-form-item>
          <el-button type="primary" :icon="Search" @click="handleQuery">
            查询
          </el-button>
          <el-button @click="handleReset">重置</el-button>
        </el-form-item>
      </el-form>
    </el-card>

    <el-card shadow="never">
      <template #header>
        <div class="card-header">
          <span class="font-medium">用户管理</span>
          <div>
            <el-button v-perms="'admin:add_user'" type="primary" :icon="Add" @click="handleBatchImport">
              从Excel导入
            </el-button>
            <el-button v-perms="'admin:add_user'" type="primary" :icon="Add" @click="handleAdd">
              新增
            </el-button>
            <el-button :icon="Refresh" @click="handleRefresh">刷新</el-button>
          </div>
        </div>
      </template>

      <pure-table ref="tableRef" :data="tableData" :columns="columns" :loading="loading" height="600"
        :header-cell-style="{
          background: 'var(--el-table-row-hover-bg-color)',
          color: 'var(--el-text-color-primary)'
        }">
        <template #operation="{ row }">
          <el-button v-perms="'admin:update_user'" type="primary" link :icon="Edit" @click="handleEdit(row)">
            编辑
          </el-button>
          <el-button v-perms="'admin:delete_user'" type="danger" link :icon="Delete" @click="handleDelete(row)">
            删除
          </el-button>
        </template>
      </pure-table>
    </el-card>

    <!-- 新增/编辑对话框 -->
    <el-dialog v-model="dialogVisible" :title="dialogTitle" width="600px" :close-on-click-modal="false">
      <el-form ref="formRef" :model="formData" :rules="formRules" label-width="100px">
        <el-form-item label="用户名" prop="username">
          <el-input v-model="formData.username" placeholder="请输入用户名" clearable :disabled="isEdit" />
        </el-form-item>
        <el-form-item label="密码" prop="password">
          <el-input v-model="formData.password" type="password" :placeholder="isEdit ? '不修改请留空' : '请输入密码'" clearable
            show-password />
        </el-form-item>
        <el-form-item label="部门" prop="department">
          <el-select v-model="formData.department" placeholder="请选择部门" clearable style="width: 100%">
            <el-option v-for="dept in departmentList" :key="dept" :label="dept" :value="dept" />
          </el-select>
        </el-form-item>
        <el-form-item label="角色" prop="role">
          <el-select v-model="formData.role" placeholder="请选择角色" clearable style="width: 100%">
            <el-option v-for="(label, value) in roleMap" :key="value" :label="label" :value="value" />
          </el-select>
        </el-form-item>
        <el-form-item label="企业微信账号" prop="workchat_username">
          <el-input v-model="formData.workchat_username" placeholder="请输入企业微信账号" clearable />
        </el-form-item>
      </el-form>
      <template #footer>
        <div class="dialog-footer">
          <el-button @click="dialogVisible = false">取消</el-button>
          <el-button type="primary" @click="handleSave">确定</el-button>
        </div>
      </template>
    </el-dialog>
  </div>
</template>

<style lang="scss" scoped>
.user-management {
  padding: 20px;

  .card-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
  }

  .query-form {
    padding: 0;

    .query-input {
      width: 200px;
    }

    .query-select {
      width: 200px;
    }
  }

  .el-card {
    margin-bottom: 20px;

    &:last-child {
      margin-bottom: 0;
    }
  }
}

// 移动端适配 (640px)
@media (max-width: 640px) {
  .user-management-page {
    padding: 12px;

    .page-header {
      flex-direction: column;
      align-items: flex-start;
      gap: 12px;
      margin-bottom: 16px;

      h2 {
        font-size: 18px;
      }

      .header-actions {
        width: 100%;
        flex-direction: column;
        gap: 8px;

        .el-button {
          width: 100%;
        }
      }
    }

    .search-card {
      margin-bottom: 12px;

      :deep(.el-card__body) {
        padding: 12px;
      }
    }

    .search-form {
      :deep(.el-form-item) {
        width: 100%;
        margin-right: 0;
        margin-bottom: 12px;
      }

      .el-input,
      .el-select {
        width: 100% !important;
      }

      .el-button {
        width: 100%;
        margin-bottom: 8px;
      }
    }

    :deep(.el-table) {
      .el-table__body-wrapper {
        overflow-x: auto;
        -webkit-overflow-scrolling: touch;
      }

      .el-table__header-wrapper {
        overflow-x: auto;
      }

      .el-table__cell {
        padding: 8px 4px;
        font-size: 12px;
      }
    }
  }
}
</style>
