<template>
  <el-dialog v-model="dialogVisible" title="任务流转" width="500px" append-to-body>
    <el-form ref="formRef" :model="form" :rules="rules" label-width="90px">
      <el-form-item label="当前状态">
        <el-tag :type="getStatusType(currentStatus) || undefined">
          {{ currentStatus || "-" }}
        </el-tag>
      </el-form-item>
      <el-form-item label="下一状态">
        <template v-if="nextOptions.length <= 1">
          <el-tag type="success">
            {{ nextOptions[0] ? getTaskStatusText(nextOptions[0]) : "-" }}
          </el-tag>
        </template>
        <template v-else>
          <el-radio-group v-model="selectedNextState">
            <el-radio-button v-for="option in nextOptions" :key="option" :label="option">
              {{ getStatusDescription(option) }}
            </el-radio-button>
          </el-radio-group>
        </template>
      </el-form-item>
      <el-form-item label="负责人" prop="personName">
        <el-tree-select v-model="form.personName" placeholder="请选择负责人" :loading="allUsersLoading" filterable
          check-strictly default-expand-all :data="allUsersTree" :props="treeSelectProps" node-key="value"
          :render-after-expand="false" style="width: 100%" clearable />
      </el-form-item>
    </el-form>
    <template #footer>
      <span class="dialog-footer">
        <el-button @click="dialogVisible = false">取消</el-button>
        <el-button type="primary" :loading="confirmLoading" :disabled="!nextOptions.length ||
          (nextOptions.length > 1 && !selectedNextState)
          " @click="handleConfirm">
          确认流转
        </el-button>
      </span>
    </template>
  </el-dialog>
</template>

<script setup lang="ts">
import { ref, computed, reactive, watch, nextTick } from "vue";
import type { FormInstance, FormRules } from "element-plus";
import { ElMessage } from "element-plus";
import { TaskStatus } from "@/types";
import { updateTaskState } from "@/api/project";
import { selectAllUsers } from "@/api/system";

const props = defineProps<{
  visible: boolean;
  task: any | null;
}>();

const emit = defineEmits<{
  (e: "update:visible", value: boolean): void;
  (e: "success", nextState: string, personName: string): void;
  (e: "flow-start", taskId: string): void;
  (e: "flow-end", taskId?: string): void;
}>();

const dialogVisible = computed({
  get: () => props.visible,
  set: value => emit("update:visible", value)
});

const formRef = ref<FormInstance>();
const form = reactive({
  personName: ""
});
const rules: FormRules = {
  personName: [
    { required: true, message: "负责人不能为空", trigger: ["blur", "change"] }
  ]
};

type TreeNode = {
  label: string;
  value: string;
  disabled?: boolean;
  children?: TreeNode[];
};

const treeSelectProps = {
  label: "label",
  children: "children",
  disabled: "disabled"
} as const;

const allUsersTree = ref<TreeNode[]>([]);
const allUsersLoading = ref(false);
const confirmLoading = ref(false);

const currentStatus = computed(
  () => props.task?.状态 || props.task?.status || ""
);

const statusAliasMap: Record<string, TaskStatus> = {
  待分配给部门负责人: TaskStatus.PENDING_ASSIGN_TO_DEPT_LEADER,
  待分配给部门主管: TaskStatus.PENDING_ASSIGN_TO_DEPT_LEADER,
  待指派给成员: TaskStatus.PENDING_ASSIGN_TO_MEMBER,
  待开始: TaskStatus.NOT_STARTED,
  任务未开始: TaskStatus.NOT_STARTED,
  进行中: TaskStatus.IN_PROGRESS,
  任务进行中: TaskStatus.IN_PROGRESS,
  待测试: TaskStatus.PENDING_TEST,
  测试中: TaskStatus.TESTING,
  测试完毕: TaskStatus.TEST_COMPLETED,
  待审阅: TaskStatus.PENDING_REVIEW,
  审阅中: TaskStatus.REVIEWING,
  审阅完毕: TaskStatus.REVIEW_COMPLETED,
  已取消: TaskStatus.CANCELLED,
  取消: TaskStatus.CANCELLED,
  已完成: TaskStatus.COMPLETED
};

const normalizeStatus = (status: string): TaskStatus | "" => {
  if (!status) return "";
  if (Object.values(TaskStatus).includes(status as TaskStatus)) {
    return status as TaskStatus;
  }
  return statusAliasMap[status] || "";
};

const normalizedStatus = computed(() => normalizeStatus(currentStatus.value));

const statusFlowTransitions: Record<TaskStatus, TaskStatus[]> = {
  [TaskStatus.PENDING_ASSIGN_TO_DEPT_LEADER]: [
    TaskStatus.PENDING_ASSIGN_TO_MEMBER
  ],
  [TaskStatus.PENDING_ASSIGN_TO_MEMBER]: [TaskStatus.NOT_STARTED],
  [TaskStatus.NOT_STARTED]: [TaskStatus.IN_PROGRESS],
  [TaskStatus.IN_PROGRESS]: [
    TaskStatus.PENDING_TEST,
    TaskStatus.PENDING_REVIEW
  ],
  [TaskStatus.PENDING_TEST]: [TaskStatus.TESTING],
  [TaskStatus.TESTING]: [TaskStatus.TEST_COMPLETED],
  [TaskStatus.TEST_COMPLETED]: [TaskStatus.COMPLETED],
  [TaskStatus.PENDING_REVIEW]: [TaskStatus.REVIEWING],
  [TaskStatus.REVIEWING]: [TaskStatus.REVIEW_COMPLETED],
  [TaskStatus.REVIEW_COMPLETED]: [TaskStatus.COMPLETED],
  [TaskStatus.CANCELLED]: [],
  [TaskStatus.COMPLETED]: []
};

const nextOptions = computed<TaskStatus[]>(() => {
  if (!normalizedStatus.value) return [];
  return statusFlowTransitions[normalizedStatus.value as TaskStatus] || [];
});
const selectedNextState = ref<TaskStatus | "">("");

const resetForm = () => {
  form.personName = "";
  selectedNextState.value = "";
};

const initForm = () => {
  form.personName = "";
  if (nextOptions.value.length === 1) {
    selectedNextState.value = nextOptions.value[0];
  } else {
    selectedNextState.value = "";
  }
  if (!allUsersTree.value.length) {
    loadAllUsers();
  }
  nextTick(() => {
    formRef.value?.clearValidate();
  });
};

watch(
  () => dialogVisible.value,
  val => {
    if (val) {
      initForm();
    } else {
      resetForm();
    }
  }
);

watch(
  () => nextOptions.value,
  val => {
    if (val.length === 1) {
      selectedNextState.value = val[0];
    } else {
      selectedNextState.value = "";
    }
  }
);

const loadAllUsers = async () => {
  allUsersLoading.value = true;
  try {
    const response = await selectAllUsers();
    if (response.code === 200 && Array.isArray(response.result)) {
      allUsersTree.value = buildTreeData(response.result);
    } else {
      allUsersTree.value = [];
      ElMessage.error("加载人员列表失败");
    }
  } catch (error: any) {
    console.error("加载人员列表失败:", error);
    ElMessage.error(
      error?.response?.data?.message || error?.message || "加载人员列表失败"
    );
    allUsersTree.value = [];
  } finally {
    allUsersLoading.value = false;
  }
};

const buildTreeData = (data: Array<Record<string, any>>): TreeNode[] => {
  if (!Array.isArray(data)) return [];
  return data.map(item => {
    const [departmentName, members] = Object.entries(item)[0] || ["未分配部门", []];
    const children: TreeNode[] = Array.isArray(members)
      ? members
        .filter(user => !!user)
        .map(user => ({
          label: user.username || user.nickname || "未知用户",
          value: user.username || user.nickname || `${departmentName}-${Math.random()}`
        }))
      : [];
    return {
      label: departmentName,
      value: `dept_${departmentName}`,
      disabled: true,
      children
    };
  });
};

const handleConfirm = () => {
  if (!props.task) return;
  formRef.value?.validate(async valid => {
    if (!valid) return;
    const taskId = props.task._id || props.task.id;
    const currentState = currentStatus.value;
    const options = nextOptions.value;
    const targetState =
      options.length > 1 ? selectedNextState.value : options[0] || "";
    if (options.length > 1 && !targetState) {
      ElMessage.warning("请选择下一步流程");
      return;
    }
    if (!taskId || !targetState) {
      ElMessage.error("任务信息不完整");
      return;
    }
    confirmLoading.value = true;
    emit("flow-start", taskId);
    try {
      const response = await updateTaskState({
        task_id: taskId,
        current_state: currentState,
        next_state: targetState,
        person_name: form.personName.trim()
      });
      if (response.code === 200) {
        ElMessage.success("状态更新成功");
        emit("success", targetState, form.personName.trim());
        dialogVisible.value = false;
      } else {
        ElMessage.error(response.message || "状态更新失败");
      }
    } catch (error: any) {
      console.error("更新任务状态失败:", error);
      ElMessage.error(
        error?.response?.data?.message || error?.message || "状态更新失败"
      );
    } finally {
      confirmLoading.value = false;
      emit("flow-end", taskId);
    }
  });
};

const getStatusType = (
  status: string
): "success" | "info" | "warning" | "danger" | undefined => {
  const normalized = normalizeStatus(status);
  if (!normalized) return undefined;
  const map: Record<string, "success" | "info" | "warning" | "danger"> = {
    [TaskStatus.PENDING_ASSIGN_TO_DEPT_LEADER]: "warning",
    [TaskStatus.PENDING_ASSIGN_TO_MEMBER]: "warning",
    [TaskStatus.NOT_STARTED]: "info",
    [TaskStatus.IN_PROGRESS]: "warning",
    [TaskStatus.PENDING_TEST]: "info",
    [TaskStatus.TESTING]: "warning",
    [TaskStatus.TEST_COMPLETED]: "success",
    [TaskStatus.PENDING_REVIEW]: "info",
    [TaskStatus.REVIEWING]: "warning",
    [TaskStatus.REVIEW_COMPLETED]: "success",
    [TaskStatus.CANCELLED]: "danger",
    [TaskStatus.COMPLETED]: "success"
  };
  return map[normalized] || undefined;
};

const getStatusDescription = (status: TaskStatus): string => {
  const map: Partial<Record<TaskStatus, string>> = {
    [TaskStatus.PENDING_TEST]: "测试流程（待测试 → 测试中 → 测试完毕 → 已完成）",
    [TaskStatus.PENDING_REVIEW]:
      "审阅流程（待审阅 → 审阅中 → 审阅完毕 → 已完成）"
  };
  return map[status] || getTaskStatusText(status);
};

const getTaskStatusText = (status: TaskStatus): string => {
  const textMap: Partial<Record<TaskStatus, string>> = {
    [TaskStatus.PENDING_ASSIGN_TO_DEPT_LEADER]: "待分配给部门负责人",
    [TaskStatus.PENDING_ASSIGN_TO_MEMBER]: "待指派给成员",
    [TaskStatus.NOT_STARTED]: "任务未开始",
    [TaskStatus.IN_PROGRESS]: "任务进行中",
    [TaskStatus.PENDING_TEST]: "待测试",
    [TaskStatus.TESTING]: "测试中",
    [TaskStatus.TEST_COMPLETED]: "测试完毕",
    [TaskStatus.PENDING_REVIEW]: "待审阅",
    [TaskStatus.REVIEWING]: "审阅中",
    [TaskStatus.REVIEW_COMPLETED]: "审阅完毕",
    [TaskStatus.CANCELLED]: "已取消",
    [TaskStatus.COMPLETED]: "已完成"
  };
  return textMap[status] || status;
};
</script>
