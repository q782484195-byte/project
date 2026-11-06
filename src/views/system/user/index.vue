<script setup lang="ts">
import { ref, reactive, onMounted, onUnmounted, nextTick, h, resolveComponent, watch } from "vue";
import { message } from "@/utils/message";
import { ElMessageBox } from "element-plus";
import type { FormInstance, FormRules } from "element-plus";
import {
  getUserList,
  addUser,
  updateUser,
  deleteUser,
  selectAllUsers,
  loadUserFromExcel,
  getDepartmentNames,
  getDepartmentNamesByCompany,
  getDepartmentGroupOptionsByCompany,
  parseSelectAllUsersCompanyMap,
  getCompanyList,
  parseCompanyList,
  DEFAULT_DEPARTMENT_GROUP,
  type User,
  type UserListResponse,
  type AddUserParams
} from "@/api/system";
import { Plus as Add, Edit, Delete, Search } from "@element-plus/icons-vue";
import TablePanel from "@/components/TablePanel/index.vue";
import { TABLE_PANEL_TOOLBAR_HEIGHT } from "@/components/TablePanel/constants";

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
const tableCardRef = ref<InstanceType<typeof import("element-plus").ElCard>>();
const tableHeight = ref(400);
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
  company: string;
  role: string; // 表单中使用字符串类型（单选）
  group: string;
  workchat_username: string;
}>({
  id: undefined,
  username: "",
  password: "",
  department: "",
  company: "",
  role: "", // 初始值为空字符串
  group: "",
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
  company: [
    { required: true, message: "请选择公司", trigger: "change" }
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
  department: "",
  company: ""
});

// 表格数据类型（role 为数组）
interface TableUser extends Omit<User, 'role'> {
  role: string[];
}

const tableData = ref<TableUser[]>([]);
/** 查询区部门（未选公司时为全部部门） */
const departmentList = ref<string[]>([]);
/** 新增/编辑表单：当前公司下的部门 */
const formDepartmentList = ref<string[]>([]);
const companyList = ref<string[]>([]);
const companyListLoading = ref(false);
const departmentGroupList = ref<Array<{ value: string; label: string }>>([]);
const departmentSelectRaw = ref<unknown>(null);
const departmentDataReady = ref(false);
const isFormInitializing = ref(false);

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
  {
    label: "公司",
    prop: "company",
    minWidth: 120,
    cellRenderer: ({ row }) => {
      const text = row.company;
      if (!text) {
        return h("span", { style: { color: "#999" } }, "—");
      }
      return h("span", text);
    }
  },
  {
    label: "部门",
    prop: "department",
    minWidth: 120
  },
  {
    label: "部门分组",
    prop: "group",
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

const refreshQueryDepartmentList = () => {
  const raw = departmentSelectRaw.value;
  const company = queryForm.company?.trim();
  if (company) {
    departmentList.value = getDepartmentNamesByCompany(raw, company);
  } else {
    const companyMap = parseSelectAllUsersCompanyMap(raw);
    if (companyMap) {
      const names = new Set<string>();
      Object.values(companyMap).forEach(deptMap => {
        Object.keys(deptMap).forEach(name => names.add(name));
      });
      departmentList.value = Array.from(names);
    } else {
      departmentList.value = getDepartmentNames(raw);
    }
  }
  if (
    queryForm.department &&
    !departmentList.value.includes(queryForm.department)
  ) {
    queryForm.department = "";
  }
};

const syncFormDepartmentOptions = () => {
  const company = formData.company?.trim();
  formDepartmentList.value = company
    ? getDepartmentNamesByCompany(departmentSelectRaw.value, company)
    : [];
  if (isFormInitializing.value) {
    updateDepartmentGroupOptions(formData.department);
    return;
  }
  if (
    formData.department &&
    !formDepartmentList.value.includes(formData.department)
  ) {
    formData.department = "";
    formData.group = "";
  }
  updateDepartmentGroupOptions(formData.department);
};

const updateDepartmentGroupOptions = (department?: string) => {
  departmentGroupList.value = getDepartmentGroupOptionsByCompany(
    departmentSelectRaw.value,
    formData.company,
    department
  );
};

const loadDepartmentList = async () => {
  try {
    const response = await selectAllUsers();
    const raw = response.result ?? response.data;
    if (response.code === 200 && raw != null) {
      departmentSelectRaw.value = raw;
      refreshQueryDepartmentList();
      syncFormDepartmentOptions();
      departmentDataReady.value = true;
    }
  } catch (error) {
    console.error("加载部门列表失败:", error);
  }
};

const loadCompanyList = async () => {
  companyListLoading.value = true;
  try {
    const response = await getCompanyList();
    if (response.code === 200) {
      companyList.value = parseCompanyList(response);
    } else {
      message(response.message || "获取公司列表失败", { type: "error" });
    }
  } catch (error) {
    message("获取公司列表失败", { type: "error" });
  } finally {
    companyListLoading.value = false;
  }
};

watch(
  () => formData.company,
  () => {
    syncFormDepartmentOptions();
  }
);

watch(
  () => queryForm.company,
  () => {
    refreshQueryDepartmentList();
  }
);

watch(
  () => formData.department,
  department => {
    updateDepartmentGroupOptions(department);
  }
);

const handleDepartmentChange = () => {
  if (isFormInitializing.value) return;
  formData.group = "";
};

const queryDepartmentGroup = (
  queryString: string,
  cb: (results: Array<{ value: string }>) => void
) => {
  const keyword = queryString.trim().toLowerCase();
  const results = departmentGroupList.value
    .filter(item => item.value !== DEFAULT_DEPARTMENT_GROUP)
    .filter(item => {
      if (!keyword) return true;
      return (
        item.label.toLowerCase().includes(keyword) ||
        item.value.toLowerCase().includes(keyword)
      );
    })
    .map(item => ({ value: item.label }));
  cb(results);
};

const handleDepartmentGroupSelect = (item: { value: string }) => {
  const matched = departmentGroupList.value.find(
    groupItem => groupItem.label === item.value
  );
  if (matched?.value === DEFAULT_DEPARTMENT_GROUP) {
    formData.group = "";
    return;
  }
  formData.group = matched?.value ?? item.value;
};

const normalizeUserGroupValue = (group?: string) => {
  if (!group || group === DEFAULT_DEPARTMENT_GROUP) {
    return "";
  }
  return group;
};

// 加载数据
const loadData = async () => {
  loading.value = true;
  try {
    // 构建查询参数，只包含非空的值
    const queryParams: { username: string; department: string; company: string } = {
      username: "",
      department: "",
      company: ""
    };

    if (queryForm.username && queryForm.username.trim()) {
      queryParams.username = queryForm.username.trim();
    }

    if (queryForm.department && queryForm.department.trim()) {
      queryParams.department = queryForm.department.trim();
    }

    if (queryForm.company && queryForm.company.trim()) {
      queryParams.company = queryForm.company.trim();
    }

    const response = await getUserList(queryParams);
    if (response.code === 200) {
      // 将返回的数据转换为表格需要的格式
      // 保持 role 为数组格式，以便编辑时能正确填充
      tableData.value = response.result.map(user => ({
        id: undefined,
        username: user.username,
        password: user.password,
        company: user.company || "",
        department: user.department || "",
        group: user.group || "",
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
  loadCompanyList();
  syncFormDepartmentOptions();
  isFormInitializing.value = true;
  dialogVisible.value = true;
  nextTick(() => {
    isFormInitializing.value = false;
  });
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
const handleEdit = async (row: TableUser) => {
  if (!departmentDataReady.value) {
    await loadDepartmentList();
  }
  dialogTitle.value = "编辑用户";
  isEdit.value = true;
  await loadCompanyList();
  const groupValue = normalizeUserGroupValue(row.group);
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
    group: groupValue,
    workchat_username: row.workchat_username || "",
    company: row.company || ""
  };
  isFormInitializing.value = true;
  Object.assign(formData, editData);
  syncFormDepartmentOptions();
  dialogVisible.value = true;
  nextTick(() => {
    formData.group = groupValue;
    isFormInitializing.value = false;
  });
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
            company: formData.company || "",
            group:
              formData.group && formData.group !== DEFAULT_DEPARTMENT_GROUP
                ? formData.group
                : "",
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
          const submitData: AddUserParams = {
            username: formData.username,
            password: formData.password,
            role: formData.role ? [formData.role] : [],
            department: formData.department || "",
            company: formData.company || "",
            group:
              formData.group && formData.group !== DEFAULT_DEPARTMENT_GROUP
                ? formData.group
                : "",
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
  formData.company = "";
  formData.role = ""; // 重置为空字符串
  formData.group = "";
  formData.workchat_username = "";
  formRef.value?.resetFields();
  syncFormDepartmentOptions();
};

// 查询
const handleQuery = () => {
  loadData();
};

// 重置查询
const handleReset = () => {
  queryFormRef.value?.resetFields();
  queryForm.username = "";
  queryForm.department = "";
  queryForm.company = "";
  loadData();
};

// 刷新
const handleRefresh = () => {
  loadData();
};

// 计算表格高度，占满剩余视口
const calculateTableHeight = () => {
  nextTick(() => {
    if (!tableCardRef.value?.$el) return;
    const viewportHeight = window.innerHeight;
    const cardRect = tableCardRef.value.$el.getBoundingClientRect();
    const cardTopToViewportBottom = viewportHeight - cardRect.top;
    const cardHeaderHeight = 100;
    const cardPadding = 40;
    const bottomPadding = 20;
    const availableHeight =
      cardTopToViewportBottom - cardHeaderHeight - cardPadding - bottomPadding - TABLE_PANEL_TOOLBAR_HEIGHT;
    tableHeight.value = Math.max(300, availableHeight);
  });
};

const handleResize = () => {
  calculateTableHeight();
};

onMounted(() => {
  loadDepartmentList();
  loadCompanyList();
  loadData();
  calculateTableHeight();
  window.addEventListener("resize", handleResize);
});

onUnmounted(() => {
  window.removeEventListener("resize", handleResize);
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
        <el-form-item label="公司" prop="company">
          <el-select v-model="queryForm.company" placeholder="请选择公司" clearable filterable class="query-select"
            :loading="companyListLoading">
            <el-option v-for="name in companyList" :key="name" :label="name" :value="name" />
          </el-select>
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

    <el-card ref="tableCardRef" shadow="never">
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
          </div>
        </div>
      </template>

      <TablePanel :loading="loading" @refresh="handleRefresh" @fullscreen-change="calculateTableHeight">
      <pure-table ref="tableRef" :data="tableData" :columns="columns" :loading="loading" :height="tableHeight">
        <template #operation="{ row }">
          <el-button v-perms="'admin:update_user'" type="primary" link :icon="Edit" @click="handleEdit(row)">
            编辑
          </el-button>
          <el-button v-perms="'admin:delete_user'" type="danger" link :icon="Delete" @click="handleDelete(row)">
            删除
          </el-button>
        </template>
      </pure-table>
      </TablePanel>
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
        <el-form-item label="公司" prop="company">
          <el-select v-model="formData.company" placeholder="请选择公司" clearable style="width: 100%"
            :loading="companyListLoading">
            <el-option v-for="name in companyList" :key="name" :label="name" :value="name" />
          </el-select>
        </el-form-item>
        <el-form-item label="部门" prop="department">
          <el-select
            v-model="formData.department"
            :placeholder="
              !formData.company
                ? '请先选择公司'
                : formDepartmentList.length === 0
                  ? '该公司暂无部门'
                  : '请选择部门'
            "
            clearable
            style="width: 100%"
            :disabled="!formData.company || formDepartmentList.length === 0"
            @change="handleDepartmentChange"
          >
            <el-option v-for="dept in formDepartmentList" :key="dept" :label="dept" :value="dept" />
          </el-select>
        </el-form-item>
        <el-form-item label="部门分组" prop="group">
          <el-autocomplete v-model="formData.group" :fetch-suggestions="queryDepartmentGroup"
            placeholder="请输入部门分组（选填）" clearable style="width: 100%" :disabled="!formData.department"
            :trigger-on-focus="true" @select="handleDepartmentGroupSelect" />
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
  height: 100%;

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
  .user-management {
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
