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
  type User,
  type DepartmentListItem,
  type UserListResponse,
  type AddUserParams
} from "@/api/system";
import Add from "~icons/ep/plus";
import Edit from "~icons/ep/edit";
import Delete from "~icons/ep/delete";
import Refresh from "~icons/ep/refresh";
import Search from "~icons/ep/search";

defineOptions({
  name: "SystemUser"
});

// 角色映射
const roleMap: Record<string, string> = {
  Admin: "管理员",
  ProjectManager: "项目经理",
  DepartmentManager: "部门主管",
  Member: "普通成员"
};

const tableRef = ref();
const formRef = ref<FormInstance>();
const queryFormRef = ref<FormInstance>();
const loading = ref(false);
const dialogVisible = ref(false);
const dialogTitle = ref("新增用户");
const isEdit = ref(false);

const formData = reactive<{
  id?: number;
  username: string;
  password: string;
  departmentName: string;
  role: string[];
  workchat_name: string;
}>({
  id: undefined,
  username: "",
  password: "",
  departmentName: "",
  role: [],
  workchat_name: ""
});

const formRules: FormRules = {
  username: [
    { required: true, message: "请输入用户名", trigger: "blur" },
    { min: 3, max: 20, message: "用户名长度在 3 到 20 个字符", trigger: "blur" }
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

  departmentName: [
    { required: true, message: "请选择部门", trigger: "change" }
  ],
  role: [
    {
      required: true,
      validator: (rule, value, callback) => {
        if (!value || (Array.isArray(value) && value.length === 0)) {
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

const tableData = ref<User[]>([]);
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
    prop: "departmentName",
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
      tableData.value = response.result.map(user => ({
        id: undefined,
        username: user.username,
        password: user.password,
        // email: user.email || "",
        departmentName: user.department || "",
        role: user.role?.[0] || ""
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

// 打开编辑对话框
const handleEdit = (row: User) => {
  dialogTitle.value = "编辑用户";
  isEdit.value = true;
  // 处理编辑时的数据格式：role 需要转换为数组，departmentName 需要转换为字符串
  const editData = {
    ...row,
    password: "",
    departmentName: row.departmentName
      ? Array.isArray(row.departmentName)
        ? row.departmentName[0]
        : row.departmentName
      : "",
    role: row.role ? (Array.isArray(row.role) ? row.role : [row.role]) : []
  };
  Object.assign(formData, editData);
  dialogVisible.value = true;
};

// 删除
const handleDelete = async (row: User) => {
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
          const submitData: any = { ...formData };
          if (!submitData.password) {
            delete submitData.password;
          }
          // 编辑时保持数组格式，但类型可能需要转换
          response = await updateUser(submitData as any);
        } else {
          // 新增用户：按照 API 要求的格式构建参数
          const submitData = {
            username: formData.username,
            password: formData.password,
            role: Array.isArray(formData.role) ? formData.role : [],
            department: formData.departmentName || "",
            workchat_name: formData.workchat_name || ""
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
  formData.departmentName = "";
  formData.role = [];
  formData.workchat_name = "";
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
        <el-form-item label="部门" prop="departmentName">
          <el-select v-model="formData.departmentName" placeholder="请选择部门" clearable style="width: 100%">
            <el-option v-for="dept in departmentList" :key="dept" :label="dept" :value="dept" />
          </el-select>
        </el-form-item>
        <el-form-item label="角色" prop="role">
          <el-select v-model="formData.role" placeholder="请选择角色" clearable multiple style="width: 100%">
            <el-option v-for="(label, value) in roleMap" :key="value" :label="label" :value="value" />
          </el-select>
        </el-form-item>
        <el-form-item label="企业微信名" prop="workchat_name">
          <el-input v-model="formData.workchat_name" placeholder="请输入企业微信名" clearable />
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
</style>
