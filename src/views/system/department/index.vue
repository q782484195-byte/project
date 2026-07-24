<script setup lang="ts">
import { ref, reactive, onMounted, onUnmounted, nextTick, h, resolveComponent } from "vue";
import { message } from "@/utils/message";
import { ElMessageBox } from "element-plus";
import type { FormInstance, FormRules } from "element-plus";
import {
  addDepartment,
  selectAllUsers,
  parseDepartmentSelectMap,
  formatDepartmentGroupLabel,
  DEFAULT_DEPARTMENT_GROUP,
  type DepartmentListItem,
  type DepartmentSelectUser
} from "@/api/system";
import { Plus as Add, Search } from "@element-plus/icons-vue";
import TablePanel from "@/components/TablePanel/index.vue";
import { TABLE_PANEL_TOOLBAR_HEIGHT } from "@/components/TablePanel/constants";

defineOptions({
  name: "SystemDepartment"
});

const roleMap: Record<string, string> = {
  ProjectManager: "项目经理",
  DepartmentManager: "部门主管",
  Member: "普通成员",
  ProjectDirector: "项目总监",
  BusinessDepartmentMembers: "业务部门成员"
};

const renderRoleTags = (roles: string[]) => {
  if (!roles.length) {
    return h("span", { style: { color: "#999" } }, "暂无角色");
  }
  const ElTag = resolveComponent("el-tag");
  return h(
    "div",
    { class: "member-role-list" },
    roles.map(role =>
      h(
        ElTag,
        { key: role, size: "small", effect: "plain" },
        { default: () => roleMap[role] || role }
      )
    )
  );
};

const tableRef = ref();
const tableCardRef = ref<InstanceType<typeof import("element-plus").ElCard>>();
const tableHeight = ref(400);
const formRef = ref<FormInstance>();
const queryFormRef = ref<FormInstance>();
const loading = ref(false);
const dialogVisible = ref(false);
const dialogTitle = ref("新增部门");
const isEdit = ref(false);
const queryFormVisible = ref(false);

interface DepartmentForm {
  department: string;
}

const formData = reactive<DepartmentForm>({
  department: ""
});

const formRules: FormRules = {
  department: [
    { required: true, message: "请输入部门名称", trigger: "blur" },
    {
      min: 2,
      max: 50,
      message: "部门名称长度在 2 到 50 个字符",
      trigger: "blur"
    }
  ]
};

// 查询表单
const queryForm = reactive({
  name: "",
  status: undefined as number | undefined
});

const tableData = ref<(DepartmentListItem & {
  id?: string;
  isGroup?: boolean;
  isChild?: boolean;
  username?: string;
  role?: string[];
  部门人员?: string[];
  children?: any[];
})[]>([]);
const pagination = reactive({
  page: 1,
  pageSize: 10,
  total: 0
});

const columns = [
  {
    label: "部门名称",
    prop: "部门名",
    minWidth: 150,
    cellRenderer: ({ row }) => {
      if (row.isGroup) {
        return h(
          "span",
          { style: { fontWeight: 600, color: "var(--el-color-primary)" } },
          row["部门名"] || ""
        );
      }
      // 人员行：在名称列展示
      if (row.isChild) {
        const name = row.username || "";
        const initial = name.slice(0, 1);
        return h("div", { class: "member-name" }, [
          h("span", { class: "member-name__avatar" }, initial),
          h("span", { class: "member-name__text" }, name)
        ]);
      }
      return h("span", row["部门名"] || "");
    }
  },
  {
    label: "负责人",
    prop: "负责人",
    minWidth: 200,
    cellRenderer: ({ row }) => {
      if (row.isGroup) {
        return h("span", "");
      }
      if (row.isChild) {
        return h("span", "");
      }
      const managers = row["负责人"] || [];
      if (managers.length === 0) {
        return h("span", { style: { color: "#999" } }, "暂无负责人");
      }
      const ElTag = resolveComponent("el-tag");
      return h(
        "div",
        { style: { display: "flex", flexWrap: "wrap", gap: "5px" } },
        managers.map((manager: string, index: number) =>
          h(ElTag, { key: index }, { default: () => manager })
        )
      );
    }
  },
  {
    label: "部门人员",
    prop: "部门人员",
    minWidth: 150,
    cellRenderer: ({ row }) => {
      if (row.isGroup) {
        return h("span", "");
      }
      if (row.isChild) {
        return h("span", "");
      }
      const members = row["部门人员"] || [];
      if (members.length === 0) {
        return h("span", { style: { color: "#999" } }, "暂无部门人员");
      }
      return h(
        "span",
        { class: "member-count" },
        `${members.length} 人`
      );
    }
  },
  {
    label: "角色",
    prop: "role",
    minWidth: 160,
    cellRenderer: ({ row }) => {
      if (row.isGroup || !row.isChild) {
        return h("span", "");
      }
      const roles = Array.isArray(row.role)
        ? row.role
        : row.role
          ? [row.role]
          : [];
      return renderRoleTags(roles);
    }
  }
  // {
  //   label: "操作",
  //   fixed: "right",
  //   width: 180,
  //   slot: "operation"
  // }
];

// 加载数据
const loadData = async () => {
  loading.value = true;
  try {
    const response = await selectAllUsers();
    if (response.code === 200) {
      const rawResult = response.result ?? response.data;
      const deptMap = parseDepartmentSelectMap(rawResult);
      const list: typeof tableData.value = [];

      Object.entries(deptMap).forEach(([departmentName, groups]) => {
        if (queryForm.name && !departmentName.includes(queryForm.name)) {
          return;
        }

        const groupKeys = Object.keys(groups);
        const hasMultipleGroups =
          groupKeys.length > 1 ||
          (groupKeys.length === 1 && groupKeys[0] !== DEFAULT_DEPARTMENT_GROUP);

        const allUsers = groupKeys.flatMap(key => groups[key] || []);
        const managers = allUsers
          .filter(user => {
            const roles = Array.isArray(user.role) ? user.role : [];
            return roles.includes("DepartmentManager");
          })
          .map(user => user.username);

        const buildUserChildren = (
          users: DepartmentSelectUser[],
          parentId: string
        ) =>
          users.map((user, index) => ({
            id: `${parentId}-user-${index}`,
            username: user.username,
            role: Array.isArray(user.role) ? user.role : user.role ? [user.role] : [],
            部门名: "",
            负责人: [],
            isChild: true
          }));

        if (!hasMultipleGroups) {
          const users =
            groups[DEFAULT_DEPARTMENT_GROUP] || groups[groupKeys[0]] || [];
          const children = buildUserChildren(users, departmentName);
          list.push({
            部门名: departmentName,
            负责人: managers,
            id: departmentName,
            部门人员: users.map(user => user.username),
            children: children.length > 0 ? children : undefined
          });
          return;
        }

        const groupChildren = groupKeys.map(groupKey => {
          const users = groups[groupKey] || [];
          const userChildren = buildUserChildren(
            users,
            `${departmentName}-${groupKey}`
          );
          return {
            部门名: formatDepartmentGroupLabel(groupKey),
            负责人: [],
            id: `${departmentName}-group-${groupKey}`,
            isGroup: true,
            部门人员: users.map(user => user.username),
            children: userChildren.length > 0 ? userChildren : undefined
          };
        });

        list.push({
          部门名: departmentName,
          负责人: managers,
          id: departmentName,
          部门人员: allUsers.map(user => user.username),
          children: groupChildren
        });
      });

      tableData.value = list;
      pagination.total = list.length;
    } else {
      message("获取部门列表失败", { type: "error" });
    }
  } catch (error) {
    message("获取部门列表失败", { type: "error" });
  } finally {
    loading.value = false;
  }
};

// 打开新增对话框
const handleAdd = () => {
  dialogTitle.value = "新增部门";
  isEdit.value = false;
  resetForm();
  dialogVisible.value = true;
};

// 保存
const handleSave = async () => {
  if (!formRef.value) return;
  await formRef.value.validate(async valid => {
    if (valid) {
      try {
        const response = await addDepartment(formData.department);
        if (response.code === 200) {
          message("新增成功", { type: "success" });
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
  formData.department = "";
  formRef.value?.resetFields();
};

// 查询
const handleQuery = () => {
  pagination.page = 1;
  loadData();
};

// 重置查询
const handleReset = () => {
  queryFormRef.value?.resetFields();
  queryForm.name = "";
  queryForm.status = undefined;
  pagination.page = 1;
  loadData();
};

// 刷新
const handleRefresh = () => {
  loadData();
};

// 分页变化
const handlePageChange = (page: number) => {
  pagination.page = page;
  loadData();
};

const handleSizeChange = (size: number) => {
  pagination.pageSize = size;
  pagination.page = 1;
  loadData();
};

// 计算表格高度，占满剩余视口
const calculateTableHeight = () => {
  nextTick(() => {
    if (!tableCardRef.value?.$el) return;
    const viewportHeight = window.innerHeight;
    const cardRect = tableCardRef.value.$el.getBoundingClientRect();
    const cardTopToViewportBottom = viewportHeight - cardRect.top;
    const cardHeaderHeight = 56;
    const cardPadding = 40;
    const paginationHeight = 52;
    const bottomPadding = 20;
    const availableHeight =
      cardTopToViewportBottom -
      cardHeaderHeight -
      cardPadding -
      paginationHeight -
      bottomPadding -
      TABLE_PANEL_TOOLBAR_HEIGHT;
    tableHeight.value = Math.max(300, availableHeight);
  });
};

const handleResize = () => {
  calculateTableHeight();
};

onMounted(() => {
  loadData();
  calculateTableHeight();
  window.addEventListener("resize", handleResize);
});

onUnmounted(() => {
  window.removeEventListener("resize", handleResize);
});
</script>

<template>
  <div class="department-management">
    <!-- 查询表单 -->
    <!-- <el-card shadow="never">
      <el-form ref="queryFormRef" :model="queryForm" :inline="true" class="query-form">
        <el-form-item label="部门名称" prop="name">
          <el-input v-model="queryForm.name" placeholder="请输入部门名称" clearable class="query-input"
            @keyup.enter="handleQuery" />
        </el-form-item>
        <el-form-item>
          <el-button type="primary" :icon="Search" @click="handleQuery">
            查询
          </el-button>
          <el-button @click="handleReset">重置</el-button>
        </el-form-item>
      </el-form>
    </el-card> -->

    <el-card ref="tableCardRef" shadow="never">
      <template #header>
        <div class="card-header">
          <span class="font-medium">部门管理</span>
          <div>
            <el-button v-perms="'department:add'" type="primary" :icon="Add" @click="handleAdd">
              新增
            </el-button>
          </div>
        </div>
      </template>

      <TablePanel :loading="loading" @refresh="handleRefresh" @fullscreen-change="calculateTableHeight">
      <pure-table ref="tableRef" :data="tableData" :columns="columns" :loading="loading" :pagination="pagination"
        :paginationSmall="false" :paginationBackground="true" :height="tableHeight" :tree-props="{
          children: 'children',
          hasChildren: 'hasChildren',
          checkStrictly: false
        }" row-key="id" preserve-expanded-content :header-cell-style="{
          background: 'var(--el-table-row-hover-bg-color)',
          color: 'var(--el-text-color-primary)'
        }" @page-size-change="handleSizeChange" @page-current-change="handlePageChange">
        <template #operation />
      </pure-table>
      </TablePanel>
    </el-card>

    <!-- 新增/编辑对话框 -->
    <el-dialog v-model="dialogVisible" :title="dialogTitle" width="600px" :close-on-click-modal="false">
      <el-form ref="formRef" :model="formData" :rules="formRules" label-width="100px">
        <el-form-item label="部门名称" prop="department">
          <el-input v-model="formData.department" placeholder="请输入部门名称" clearable />
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
.department-management {
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

  :deep(.member-name) {
    display: inline-flex;
    align-items: center;
    gap: 8px;
    padding: 2px 0;
  }

  :deep(.member-name__avatar) {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    width: 24px;
    height: 24px;
    border-radius: 50%;
    background: var(--el-color-primary-light-8);
    color: var(--el-color-primary);
    font-size: 12px;
    font-weight: 600;
    flex-shrink: 0;
  }

  :deep(.member-name__text) {
    color: var(--el-text-color-regular);
    font-size: 13px;
    line-height: 1.4;
  }

  :deep(.member-count) {
    color: var(--el-color-primary);
    font-weight: 500;
  }

  :deep(.member-role-list) {
    display: flex;
    flex-wrap: wrap;
    gap: 4px;
  }
}

// 隐藏没有部门人员的行的展开图标
:deep(.no-expand-row) {
  .el-table__expand-icon {
    display: none !important;
  }

  .el-table__expand-icon-cell {
    cursor: default !important;
  }
}

// 移动端适配 (640px)
@media (max-width: 640px) {
  .department-management {
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
