<script setup lang="ts">
import { ref, reactive, onMounted, h, resolveComponent } from "vue";
import { message } from "@/utils/message";
import { ElMessageBox } from "element-plus";
import type { FormInstance, FormRules } from "element-plus";
import {
  addDepartment,
  selectAllUsers,
  getDepartmentNameList,
  type DepartmentListItem,
  type DepartmentUserMap
} from "@/api/system";
import { Plus as Add, Refresh, Search } from "@element-plus/icons-vue";

defineOptions({
  name: "SystemDepartment"
});

const tableRef = ref();
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

const tableData = ref<DepartmentListItem[]>([]);
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
      // 如果是子行（部门人员），不显示部门名
      if (row.isChild) {
        return h("span", "");
      }
      return h("span", row["部门名"] || "");
    }
  },
  {
    label: "负责人",
    prop: "负责人",
    minWidth: 200,
    cellRenderer: ({ row }) => {
      // 如果是子行（部门人员），不显示负责人
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
      // 如果是子行（部门人员），用tag包裹显示用户名
      if (row.isChild) {
        const ElTag = resolveComponent("el-tag");
        return h(ElTag, {}, { default: () => row.username || "" });
      }
      // 如果是父行（部门），显示人数
      const managers = row["部门人员"] || [];
      if (managers.length === 0) {
        return h("span", { style: { color: "#999" } }, "暂无部门人员");
      }
      return h(
        "span",
        { style: { color: "#409eff" } },
        `${managers.length} 人`
      );
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
    const response = await getDepartmentNameList();
    if (response.code === 200) {
      let list = response.result || [];
      // 如果有查询条件，进行过滤
      if (queryForm.name) {
        list = list.filter(item => item["部门名"].includes(queryForm.name));
      }
      const usersResponse = await selectAllUsers();
      if (usersResponse.code === 200) {
        const departmentUserMaps = usersResponse.result || [];
        // 将数组转换为对象，方便查找
        const departmentUsersMap: Record<string, string[]> = {};
        departmentUserMaps.forEach(map => {
          Object.keys(map).forEach(department => {
            departmentUsersMap[department] = map[department].map(
              user => user.username
            );
          });
        });

        list = list.map(item => {
          const department = item["部门名"];
          const users = departmentUsersMap[department] || [];

          // 构建树形结构：每个部门作为父节点，部门人员作为子节点
          const children = users.map((username, index) => ({
            id: `${department}-${index}`,
            username: username,
            部门名: "",
            负责人: [],
            部门人员: [],
            isChild: true // 标记为子行
          }));

          return {
            ...item,
            id: department, // 使用部门名作为唯一标识
            部门人员: users,
            children: children.length > 0 ? children : undefined // 只有有人员时才添加children
          };
        });

        // 调试：打印数据
        console.log("部门列表数据:", list);
        list.forEach(item => {
          console.log(`部门: ${item["部门名"]}, 人员:`, item["部门人员"]);
        });
      }
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

onMounted(() => {
  loadData();
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

    <el-card shadow="never">
      <template #header>
        <div class="card-header">
          <span class="font-medium">部门管理</span>
          <div>
            <el-button v-perms="'department:add'" type="primary" :icon="Add" @click="handleAdd">
              新增
            </el-button>
            <el-button :icon="Refresh" @click="handleRefresh">刷新</el-button>
          </div>
        </div>
      </template>

      <pure-table ref="tableRef" :data="tableData" :columns="columns" :loading="loading" :pagination="pagination"
        :paginationSmall="false" :paginationBackground="true" height="600" :tree-props="{
          children: 'children',
          hasChildren: 'hasChildren',
          checkStrictly: false
        }" row-key="id" preserve-expanded-content :header-cell-style="{
          background: 'var(--el-table-row-hover-bg-color)',
          color: 'var(--el-text-color-primary)'
        }" @page-size-change="handleSizeChange" @page-current-change="handlePageChange">
        <template #operation />
      </pure-table>
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

// 隐藏没有部门人员的行的展开图标
:deep(.no-expand-row) {
  .el-table__expand-icon {
    display: none !important;
  }

  .el-table__expand-icon-cell {
    cursor: default !important;
  }
}
</style>
