<template>
  <el-dialog v-model="dialogVisible" title="任务分配" width="500px" append-to-body>
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
          <div class="next-state-radio-wrap">
            <el-radio-group v-model="selectedNextState" class="next-state-radio-group">
              <el-radio-button v-for="option in nextOptions" :key="option" :label="option">
                {{ getTaskStatusText(option) }}
              </el-radio-button>
            </el-radio-group>
          </div>
        </template>
      </el-form-item>
      <template v-if="isPendingAssignToDeptLeader">
        <el-form-item label="部门" prop="department">
          <el-select v-model="form.department" placeholder="请选择部门" :loading="departmentLoading" style="width: 100%"
            clearable>
            <el-option v-for="dept in departmentOptions" :key="dept.value" :label="dept.label" :value="dept.value" />
          </el-select>
        </el-form-item>
      </template>
      <el-form-item v-if="needAssign" label="分配给" prop="personName">
        <el-tree-select v-model="form.personName" placeholder="请选择分配给" :loading="allUsersLoading" filterable
          check-strictly default-expand-all :data="allUsersTree" :props="treeSelectProps" node-key="value"
          :render-after-expand="false" style="width: 100%" clearable />
      </el-form-item>
      <template v-if="isPendingAssignToDeptLeader">
        <!-- <el-form-item label="指派时限" prop="time_limit">
          <div class="time-limit-inline">
            <el-input-number v-model="form.time_limit" :min="0" :precision="3" placeholder="请输入任务指派时限"
              class="time-limit-input" />
            <span class="time-limit-unit">时</span>
          </div>
        </el-form-item> -->
        <el-form-item label="完成期限" prop="task_assign_limit">
          <el-date-picker v-model="form.task_assign_limit" type="date" placeholder="请选择任务截止期限" format="YYYY-MM-DD"
            value-format="YYYY-MM-DD" style="width: 100%" :disabled-date="disabledPastDate" clearable />
        </el-form-item>
        <!-- <el-form-item label="超时提醒" prop="notification_recipients">
          <el-tree-select v-model="form.notification_recipients" placeholder="请选择指派超时提醒人"
            :loading="notificationRecipientsLoading" filterable check-strictly default-expand-all
            :data="notificationRecipientsTree" :props="treeSelectProps" node-key="value" :render-after-expand="false"
            style="width: 100%" clearable multiple />
        </el-form-item> -->
      </template>
      <!-- <el-form-item v-if="isFirstRoundTest" label="测试轮数" prop="testRounds">
        <el-select v-model="form.testRounds" placeholder="请选择测试轮数" style="width: 100%">
          <el-option v-for="round in testRoundOptions" :key="round" :label="`${round}轮`" :value="round" />
        </el-select>
      </el-form-item> -->
      <el-form-item v-if="isCompleted" label="完成汇报" prop="completionReport">
        <el-input v-model="form.completionReport" type="textarea" :rows="4" placeholder="请输入完成汇报内容" />
      </el-form-item>
      <el-form-item v-if="isTestFailure" label="失败汇报" prop="failureReport">
        <el-input v-model="form.failureReport" type="textarea" :rows="4" placeholder="请输入失败汇报内容" />
      </el-form-item>
      <el-form-item v-if="isCompleted" label="完成附件">
        <el-upload v-model:file-list="form.attachmentList" multiple :auto-upload="false" :on-remove="handleFileRemove"
          :on-change="handleFileChange" :before-upload="handleBeforeUpload">
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
      <el-form-item v-if="needRejectionReason" label="驳回理由" prop="rejectionReason">
        <el-input v-model="form.rejectionReason" type="textarea" :rows="3" placeholder="请输入驳回理由" />
      </el-form-item>
      <el-form-item v-if="needDevelopmentTime" label="开始时间" prop="development_start_time">
        <el-date-picker v-model="form.development_start_time" type="date" placeholder="请选择研发开始时间" format="YYYY-MM-DD"
          value-format="YYYY-MM-DD" style="width: 100%" />
      </el-form-item>
      <el-form-item v-if="needDevelopmentTime" label="结束时间" prop="development_end_time">
        <el-date-picker v-model="form.development_end_time" type="date" placeholder="请选择研发结束时间" format="YYYY-MM-DD"
          value-format="YYYY-MM-DD" :disabled-date="(time: Date) => {
            if (props.task?.task_deadline) {
              const deadline = new Date(props.task.task_deadline);
              deadline.setHours(23, 59, 59, 999);
              return time.getTime() > deadline.getTime();
            }
            return false;
          }" style="width: 100%" />
      </el-form-item>
    </el-form>
    <template #footer>
      <span class="dialog-footer">
        <el-button @click="dialogVisible = false">取消</el-button>
        <el-button type="primary" :loading="confirmLoading" :disabled="nextOptions.length === 0 ||
          (nextOptions.length > 1 && !selectedNextState)
          " @click="handleConfirm">
          确认分配
        </el-button>
      </span>
    </template>
  </el-dialog>
</template>

<script setup lang="ts">
import { ref, computed, reactive, watch, nextTick } from "vue";
import type { FormInstance, FormRules, UploadFile, UploadFiles } from "element-plus";
import { ElMessage } from "element-plus";
import { Upload } from "@element-plus/icons-vue";
import { TaskStatus } from "@/types";
import { updateTaskState, updateTask, reportTaskProgress, uploadFile, updateDevelopmentTime, updateTaskDeadline } from "@/api/project";
import {
  getNextStateUserList,
  sendNotification,
  selectNotificationPerson,
  addNotification,
  selectAllUsers,
  selectAllUsersToDepartmentMaps,
  getDepartmentNameList,
  flattenDepartmentList,
  type DepartmentListItem,
  type DepartmentSelectUser
} from "@/api/system";
import { sendWorkchatMessage } from "@/api/report";
import { useUserStoreHook } from "@/store/modules/user";

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
interface FormData {
  department: string;
  personName: string;
  rejectionReason: string;
  testRounds: number;
  completionReport: string;
  failureReport: string;
  attachmentList: UploadFile[];
  development_start_time: string;
  development_end_time: string;
  time_limit: number;
  task_assign_limit: string;
  notification_recipients: string[];
}
const form = reactive<FormData>({
  department: "",
  personName: "",
  rejectionReason: "",
  testRounds: null,
  completionReport: "",
  failureReport: "",
  attachmentList: [],
  development_start_time: "",
  development_end_time: "",
  time_limit: 0,
  task_assign_limit: "",
  notification_recipients: []
});
const rules = computed<FormRules>(() => {
  const baseRules: FormRules = {};
  // 当前状态为待分配给部门负责人时，部门必填
  if (isPendingAssignToDeptLeader.value) {
    baseRules.department = [
      { required: false, message: "请选择部门", trigger: ["blur", "change"] }
    ];
  }
  // 只有当 need_assign 为 true 时，personName 才必填
  if (needAssign.value) {
    baseRules.personName = [
      { required: true, message: "负责人不能为空", trigger: ["blur", "change"] }
    ];
  }
  // 当前状态为待分配给部门负责人时，任务指派时限、任务截止期限、指派超时提醒人必填（与批量分配取值一致）
  if (isPendingAssignToDeptLeader.value) {
    baseRules.time_limit = [
      { required: true, message: "请输入任务指派时限（小时）", trigger: "blur" },
      { type: "number", min: 0, max: 24, message: "任务指派时限必须大于0且小于24", trigger: "blur" }
    ];
    baseRules.task_assign_limit = [
      { required: true, message: "请选择任务截止期限", trigger: ["blur", "change"] }
    ];
    baseRules.notification_recipients = [
      { required: true, message: "请选择指派超时提醒人", trigger: "change" }
    ];
  }

  // 如果选择的是已完成状态，完成汇报必填
  if (isCompleted.value) {
    baseRules.completionReport = [
      { required: true, message: "请输入完成汇报内容", trigger: ["blur", "change"] }
    ];
  }
  // 如果下一状态包含"轮测试失败"，失败汇报必填
  if (isTestFailure.value) {
    baseRules.failureReport = [
      { required: true, message: "请输入失败汇报内容", trigger: ["blur", "change"] }
    ];
  }
  // 如果选择的是第一轮测试，测试轮数必填
  if (isFirstRoundTest.value) {
    baseRules.testRounds = [
      { required: true, message: "请选择测试轮数", trigger: ["blur", "change"] }
    ];
  }
  // 根据选中的状态对应的 need_reason 来决定驳回理由是否必填
  if (needRejectionReason.value) {
    baseRules.rejectionReason = [
      { required: true, message: "请输入驳回理由", trigger: ["blur", "change"] }
    ];
  }
  // 如果当前状态是"工时审核未通过"，预计工时必填
  if (needDevelopmentTime.value) {
    baseRules.development_start_time = [
      { required: true, message: "请选择开始时间", trigger: ["blur", "change"] }
    ];
    baseRules.development_end_time = [
      { required: true, message: "请选择结束时间", trigger: ["blur", "change"] },
      {
        validator: (rule, value, callback) => {
          if (!value) {
            callback();
            return;
          }
          const endTime = new Date(value).getTime();
          // 检查是否晚于开始时间
          if (form.development_start_time) {
            const startTime = new Date(form.development_start_time).getTime();
            if (endTime < startTime) {
              callback(new Error("研发结束时间必须晚于开始时间"));
              return;
            }
          }
          // 检查是否超过任务完成期限
          if (props.task?.task_deadline) {
            const deadline = new Date(props.task.task_deadline);
            deadline.setHours(23, 59, 59, 999);
            const endDate = new Date(value);
            endDate.setHours(0, 0, 0, 0);
            const deadlineDate = new Date(props.task.task_deadline);
            deadlineDate.setHours(0, 0, 0, 0);
            if (endDate.getTime() > deadlineDate.getTime()) {
              callback(new Error("开发结束日期不能超过任务完成期限"));
              return;
            }
          }
          callback();
        },
        trigger: "change"
      }
    ];
  }
  return baseRules;
});

type TreeNode = {
  label: string;
  value: string;
  disabled?: boolean;
  children?: TreeNode[];
  userInfo?: any; // 保存完整的用户信息，用于获取 workchat_username
};

const treeSelectProps = {
  label: "label",
  children: "children",
  disabled: "disabled"
} as const;

const allUsersRawData = ref<Array<Record<string, any>>>([]);
const allUsersLoading = ref(false);
const notificationRecipientsTree = ref<TreeNode[]>([]);
const notificationRecipientsLoading = ref(false);
const confirmLoading = ref(false);
const userStore = useUserStoreHook();

// 部门筛选相关（基于 selectAllUsers 返回的数据动态构建）
const departmentOptions = ref<Array<{ label: string; value: string }>>([]);
const departmentLoading = ref(false);

// 根据当前状态动态过滤用户列表
const allUsersTree = computed<TreeNode[]>(() => {
  if (!allUsersRawData.value.length) return [];
  // 依赖 selectedNextState 和 nextOptions，确保状态变化时重新计算
  selectedNextState.value;
  nextOptions.value;
  // 依赖部门筛选
  form.department;
  return buildTreeData(allUsersRawData.value);
});

const currentStatus = computed(
  () => props.task?.状态 || props.task?.status || ""
);

const statusAliasMap: Record<string, TaskStatus> = {
  待分配给部门负责人: TaskStatus.PENDING_ASSIGN_TO_DEPT_LEADER,
  待分配给部门主管: TaskStatus.PENDING_ASSIGN_TO_DEPT_LEADER,
  "未完成 ": TaskStatus.PENDING_ASSIGN_TO_DEPT_LEADER,
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
  // 别名优先：如「未完成 」在枚举中为 NOT_COMPLETED_K，但业务上等同「待分配给部门负责人」
  if (statusAliasMap[status]) {
    return statusAliasMap[status];
  }
  if (Object.values(TaskStatus).includes(status as TaskStatus)) {
    return status as TaskStatus;
  }
  return "";
};

const normalizedStatus = computed(() => normalizeStatus(currentStatus.value));

// 从接口返回的 next_state 字段获取下一个状态选项
const nextOptions = computed<string[]>(() => {
  // 优先使用接口返回的 next_state 字段
  if (props.task?.next_state && Array.isArray(props.task.next_state)) {
    return props.task.next_state;
  }
  return [];
});

// 从接口返回的 need_reason 字段获取是否需要驳回理由
const needReasonArray = computed<boolean[]>(() => {
  if (props.task?.need_reason && Array.isArray(props.task.need_reason)) {
    return props.task.need_reason;
  }
  return [];
});


// 从接口返回的 need_assign 字段获取是否需要分配给成员
const needAssignArray = computed<boolean[]>(() => {
  if (props.task?.need_assign && Array.isArray(props.task.need_assign)) {
    return props.task.need_assign;
  }
  return [];
});

const selectedNextState = ref<string>("");

// 当前状态是否为「待分配给部门负责人」（含别名「未完成 」；显示部门、完成期限，分配给默认 default_person）
const isPendingAssignToDeptLeader = computed<boolean>(() => {
  if (normalizedStatus.value === TaskStatus.PENDING_ASSIGN_TO_DEPT_LEADER) {
    return true;
  }
  const status = String(currentStatus.value || "");
  return (
    status === TaskStatus.NOT_COMPLETED_K ||
    status.includes("待分配给部门负责人")
  );
});

// 根据选中的下一状态，判断是否需要显示分配给输入框（与 needRejectionReason 一致：多选项时根据选中项联动）
const needAssign = computed<boolean>(() => {
  if (nextOptions.value.length === 0 || needAssignArray.value.length === 0) {
    return false;
  }
  if (nextOptions.value.length === 1) {
    return needAssignArray.value[0] === true;
  }
  // 多个下一状态选项时：根据选中的状态对应的 need_assign 决定是否显示
  if (!selectedNextState.value) {
    return false;
  }
  const selectedIndex = nextOptions.value.indexOf(selectedNextState.value);
  if (selectedIndex !== -1 && selectedIndex < needAssignArray.value.length) {
    return needAssignArray.value[selectedIndex] === true;
  }
  return false;
});

// 根据选中的下一状态，判断是否需要显示驳回理由输入框
const needRejectionReason = computed<boolean>(() => {
  if (nextOptions.value.length === 0 || needReasonArray.value.length === 0) {
    return false;
  }

  // 如果只有一个选项，直接使用第一个 need_reason
  if (nextOptions.value.length === 1) {
    return needReasonArray.value[0] === true;
  }

  // 如果有多个选项，需要选中状态才能判断
  if (!selectedNextState.value) {
    return false;
  }

  // 根据选中的状态找到对应的 need_reason
  const selectedIndex = nextOptions.value.indexOf(selectedNextState.value);
  if (selectedIndex !== -1 && selectedIndex < needReasonArray.value.length) {
    return needReasonArray.value[selectedIndex] === true;
  }

  return false;
});

// 测试轮数选项（1-8）
const testRoundOptions = [1, 2, 3, 4, 5, 6, 7, 8];

// 判断选择的状态是否是"第一轮测试"
const isFirstRoundTest = computed<boolean>(() => {
  const targetState = nextOptions.value.length > 1
    ? selectedNextState.value
    : (nextOptions.value[0] || "");

  // 检查是否是"第一轮测试"（可能是中文或英文）
  return targetState === "第1轮测试" ||
    targetState === "第1轮" ||
    targetState === "first_round_test" ||
    (targetState && targetState.includes("第1轮"));
});

// 判断选择的状态是否是"已完成"
const isCompleted = computed<boolean>(() => {
  const targetState = nextOptions.value.length > 1
    ? selectedNextState.value
    : (nextOptions.value[0] || "");

  // 检查是否是"已完成"（可能是中文或英文）
  return targetState === "已完成" ||
    targetState === TaskStatus.COMPLETED ||
    targetState === "completed" ||
    (targetState && targetState.includes("已完成"));
});

// 判断下一状态是否包含"轮测试失败"
const isTestFailure = computed<boolean>(() => {
  const targetState = nextOptions.value.length > 1
    ? selectedNextState.value
    : (nextOptions.value[0] || "");

  // 检查是否包含"轮测试失败"
  return targetState && targetState.includes("轮测试失败");
});

// 判断当前状态是否需要填写预计工时（工时审核未通过）
const needDevelopmentTime = computed<boolean>(() => {
  const status = currentStatus.value;
  return status === "测试任务待指派" || status === "研发任务待指派" || status === "项目测试任务待指派"
});

// 禁用过去的日期（与 index 批量分配一致）
const disabledPastDate = (time: Date): boolean => {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  return time.getTime() < today.getTime();
};

/** 将日期统一为 YYYY-MM-DD，便于与列表字段比较 */
const normalizeDeadline = (value: string | undefined | null): string => {
  if (value === undefined || value === null) return "";
  const str = String(value).trim();
  if (!str) return "";
  if (str.includes("T")) return str.split("T")[0];
  if (str.includes(" ")) return str.split(" ")[0];
  return str.length >= 10 ? str.slice(0, 10) : str;
};

/** 从任务对象读取任务完成期限（与列表列 task_deadline 一致） */
const getTaskDeadlineFromTask = (task: any): string => {
  if (!task) return "";
  return normalizeDeadline(
    task.task_deadline ||
    task.task_dead_line ||
    task.任务完成期限 ||
    ""
  );
};

/** 打开弹窗时的完成期限，未改动则不调用 update_task_deadline */
const originalTaskDeadline = ref("");

const resetForm = () => {
  form.department = "";
  form.personName = "";
  form.rejectionReason = "";
  form.testRounds = 1;
  form.completionReport = "";
  form.failureReport = "";
  form.attachmentList = [];
  form.development_start_time = "";
  form.development_end_time = "";
  form.time_limit = 0;
  form.task_assign_limit = "";
  form.notification_recipients = [];
  selectedNextState.value = "";
  originalTaskDeadline.value = "";
};

const initForm = async () => {
  form.department = "";
  form.rejectionReason = "";
  form.testRounds = 1;
  form.completionReport = "";
  form.failureReport = "";
  form.attachmentList = [];
  form.development_start_time = "";
  form.development_end_time = "";
  // 当前状态为「待分配给部门负责人」时，与批量分配取值一致：时限默认 1 时
  form.time_limit = isPendingAssignToDeptLeader.value ? 1 : 0;
  const deadlineFromList = isPendingAssignToDeptLeader.value
    ? getTaskDeadlineFromTask(props.task)
    : "";
  form.task_assign_limit = deadlineFromList;
  originalTaskDeadline.value = deadlineFromList;
  form.notification_recipients = [];
  if (nextOptions.value.length === 1) {
    selectedNextState.value = nextOptions.value[0];
  } else {
    selectedNextState.value = "";
  }
  // 当前状态为「待分配给部门负责人」时，分配给默认填任务的 default_person（仅作为初始值，选择部门后会根据部门负责人覆盖）
  form.personName = isPendingAssignToDeptLeader.value && props.task?.default_person
    ? String(props.task.default_person).trim()
    : "";
  // 当前状态为「待分配给部门负责人」时，加载全部门人员供超时提醒选择（与 index 批量分配一致）
  if (isPendingAssignToDeptLeader.value) {
    await loadNotificationRecipientsTree();
    try {
      const response = await selectNotificationPerson();
      if (response.code === 200 && response.result?.recipient && Array.isArray(response.result.recipient)) {
        form.notification_recipients = [...response.result.recipient];
      }
    } catch {
      // 不显示错误，使用空数组
    }
  }
  // 根据下一状态加载用户列表（包含部门信息）
  loadUsersByNextState();
  nextTick(() => {
    formRef.value?.clearValidate();
  });
};

watch(
  () => dialogVisible.value,
  async val => {
    if (val) {
      await initForm();
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
    // 当选项变化时，清空驳回理由
    form.rejectionReason = "";
  }
);

// 监听选中的状态变化，清空驳回理由和完成汇报；多选项时切换状态需重新加载用户列表
watch(
  () => selectedNextState.value,
  (newState) => {
    form.rejectionReason = "";
    // 如果切换状态后不是已完成，清空完成汇报和附件
    if (!isCompleted.value) {
      form.completionReport = "";
      form.attachmentList = [];
    }
    // 如果切换状态后不是测试失败，清空失败汇报
    if (!isTestFailure.value) {
      form.failureReport = "";
    }
    // 多选项时，切换下一状态需重新调用 getNextStateUserList 获取对应的部门和用户
    if (nextOptions.value.length > 1 && newState) {
      loadUsersByNextState();
    }
    nextTick(() => {
      formRef.value?.clearValidate("rejectionReason");
      formRef.value?.clearValidate("completionReport");
      formRef.value?.clearValidate("failureReport");
      formRef.value?.clearValidate("recipient");
      formRef.value?.clearValidate("deadline");
    });
  }
);

// 监听部门变化：选择部门后，自动将该部门的负责人填入「分配给」字段；
// 如果新部门下没有可选负责人，则清空「分配给」
watch(
  () => form.department,
  (dept) => {
    if (!dept || !isPendingAssignToDeptLeader.value) return;
    // 如果当前分配给已经是该部门下的 ProjectManager 或 DepartmentManager，则不覆盖
    if (form.personName) {
      for (const item of allUsersRawData.value) {
        const [department, members] = Object.entries(item)[0] || ["", []];
        if (String(department) !== String(dept)) continue;
        if (!Array.isArray(members)) continue;
        const currentUser = members.find((user: any) => {
          const name = user.username || user.nickname;
          const roles = Array.isArray(user.role) ? user.role : user.role ? [user.role] : [];
          return name === form.personName && (roles.includes("ProjectManager") || roles.includes("DepartmentManager"));
        });
        if (currentUser) {
          nextTick(() => {
            formRef.value?.clearValidate("personName");
          });
          return;
        }
      }
    }
    // 走到这里说明当前「分配给」要么为空，要么不是本部门的负责人，先清空
    form.personName = "";
    // 从该部门下找到第一个 DepartmentManager 作为默认部门负责人
    let defaultLeader: string | null = null;
    for (const item of allUsersRawData.value) {
      const [department, members] = Object.entries(item)[0] || ["", []];
      if (String(department) !== String(dept)) continue;
      if (!Array.isArray(members)) continue;
      const target = members.find((user: any) => {
        const roles = Array.isArray(user.role) ? user.role : user.role ? [user.role] : [];
        return roles.includes("DepartmentManager");
      });
      if (target) {
        defaultLeader = target.username || target.nickname || null;
        break;
      }
    }
    if (defaultLeader) {
      form.personName = defaultLeader;
      nextTick(() => {
        formRef.value?.clearValidate("personName");
      });
    }
  }
);

// 监听「分配给」变化：如果当前状态为待分配给部门负责人，且部门未选择，则根据负责人反推部门
watch(
  () => form.personName,
  (name) => {
    if (!name || !isPendingAssignToDeptLeader.value) return;
    if (form.department) return;
    for (const item of allUsersRawData.value) {
      const [department, members] = Object.entries(item)[0] || ["", []];
      if (!Array.isArray(members)) continue;
      const target = members.find((user: any) => {
        const userName = user.username || user.nickname;
        const roles = Array.isArray(user.role) ? user.role : user.role ? [user.role] : [];
        return userName === name && (roles.includes("ProjectManager") || roles.includes("DepartmentManager"));
      });
      if (target) {
        form.department = String(department);
        nextTick(() => {
          formRef.value?.clearValidate("department");
        });
        break;
      }
    }
  }
);

// 文件上传处理
const handleFileChange = (file: UploadFile, fileList: UploadFiles) => {
  form.attachmentList = fileList;
};

const handleFileRemove = (file: UploadFile, fileList: UploadFiles) => {
  form.attachmentList = fileList;
};

const handleBeforeUpload = (file: File) => {
  // 可以在这里添加文件大小和类型验证
  const isValidSize = file.size / 1024 / 1024 < 50; // 50MB
  if (!isValidSize) {
    ElMessage.error("文件大小不能超过 50MB");
    return false;
  }
  return true;
};

/** 构建全部门人员树（用于超时提醒人选择，与 tasks/index 批量分配一致） */
const buildNotificationRecipientsTree = (
  departmentList: DepartmentListItem[],
  userMaps: Array<Record<string, DepartmentSelectUser[]>>
): TreeNode[] => {
  if (!Array.isArray(departmentList)) return [];

  const departmentUsersMap: Record<string, string[]> = {};
  if (Array.isArray(userMaps)) {
    userMaps.forEach(map => {
      Object.entries(map).forEach(([department, users]) => {
        if (!Array.isArray(users)) return;
        const names = users.map(user => user.username).filter(Boolean);
        if (!departmentUsersMap[department]) {
          departmentUsersMap[department] = [];
        }
        names.forEach(name => {
          if (!departmentUsersMap[department].includes(name)) {
            departmentUsersMap[department].push(name);
          }
        });
      });
    });
  }

  return departmentList.map((item, index) => {
    const departmentName = String(item.部门名 || "未分配部门");
    const users = departmentUsersMap[departmentName] || [];
    const allUsers = users.length > 0 ? users : (item.负责人 || []);

    const children: TreeNode[] = allUsers
      .filter(user => user && String(user).trim())
      .map(user => ({
        label: String(user),
        value: String(user)
      }));

    return {
      label: departmentName,
      value: `dept_${index}_${departmentName.replace(/[^a-zA-Z0-9\u4e00-\u9fa5]/g, "_")}`,
      disabled: true,
      children
    };
  });
};

/** 加载全部门人员（超时提醒人可选所有部门成员） */
const loadNotificationRecipientsTree = async () => {
  if (notificationRecipientsTree.value.length) return;

  notificationRecipientsLoading.value = true;
  try {
    const departmentResponse = await getDepartmentNameList();
    if (departmentResponse.code !== 200 || departmentResponse.result == null) {
      ElMessage.error("加载部门列表失败");
      notificationRecipientsTree.value = [];
      return;
    }

    const departmentList = flattenDepartmentList(departmentResponse.result);
    const usersResponse = await selectAllUsers();
    const usersRaw = usersResponse.result ?? usersResponse.data;
    if (usersResponse.code === 200 && usersRaw != null) {
      notificationRecipientsTree.value = buildNotificationRecipientsTree(
        departmentList,
        selectAllUsersToDepartmentMaps(usersRaw)
      );
    } else {
      notificationRecipientsTree.value = buildNotificationRecipientsTree(
        departmentList,
        []
      );
    }
  } catch (error: any) {
    console.error("加载超时提醒人员列表失败:", error);
    ElMessage.error(
      error?.response?.data?.message || error?.message || "加载超时提醒人员列表失败"
    );
    notificationRecipientsTree.value = [];
  } finally {
    notificationRecipientsLoading.value = false;
  }
};

/** 根据下一状态获取后台返回的部门和用户列表 */
const loadUsersByNextState = async () => {
  const effectiveNextState = nextOptions.value.length > 1
    ? selectedNextState.value
    : (nextOptions.value[0] || "");
  if (!effectiveNextState) {
    allUsersRawData.value = [];
    departmentOptions.value = [];
    return;
  }
  allUsersLoading.value = true;
  departmentLoading.value = true;
  try {
    const response = await getNextStateUserList({ next_state: effectiveNextState }) as { code: number; result?: any[]; data?: any[] };
    const list = Array.isArray(response.result) ? response.result : Array.isArray(response.data) ? response.data : [];
    if (response.code === 200) {
      allUsersRawData.value = list;
      buildDepartmentOptions(list);
    } else {
      allUsersRawData.value = [];
      departmentOptions.value = [];
      ElMessage.error("加载人员列表失败");
    }
  } catch (error: any) {
    console.error("加载人员列表失败:", error);
    ElMessage.error(
      error?.response?.data?.message || error?.message || "加载人员列表失败"
    );
    allUsersRawData.value = [];
    departmentOptions.value = [];
  } finally {
    allUsersLoading.value = false;
    departmentLoading.value = false;
  }
};

// 基于 selectAllUsers 的返回结果构建部门下拉选项
const buildDepartmentOptions = (data: Array<Record<string, any>>) => {
  const options: Array<{ label: string; value: string }> = [];
  data.forEach((item) => {
    const [department] = Object.entries(item)[0] || ["", []];
    if (department) {
      const deptName = String(department);
      if (!options.find(o => o.value === deptName)) {
        options.push({ label: deptName, value: deptName });
      }
    }
  });
  departmentOptions.value = options;
};

// 用户信息映射，用于根据 username 查找完整的用户信息
const userInfoMap = ref<Map<string, any>>(new Map());

const buildTreeData = (data: Array<Record<string, any>>): TreeNode[] => {
  if (!Array.isArray(data)) return [];
  const currentUsername = userStore.username;
  const currentUserRoles = userStore.roles || [];
  const isPendingAssignToMember = normalizedStatus.value === TaskStatus.PENDING_ASSIGN_TO_MEMBER;
  const selectedDeptName = form.department;
  const isPendingAssignToDeptLeaderState = normalizedStatus.value === TaskStatus.PENDING_ASSIGN_TO_DEPT_LEADER;

  // 获取下一状态
  const targetNextState = nextOptions.value.length > 1
    ? selectedNextState.value
    : (nextOptions.value[0] || "");

  // 判断下一状态是否是"待验收"
  const isPendingAcceptance = targetNextState === "待验收" ||
    targetNextState === "PENDING_ACCEPTANCE" ||
    (targetNextState && (
      targetNextState.includes("待验收") ||
      targetNextState.includes("验收")
    ));

  // 判断当前用户的角色类型
  const isCurrentUserDepartmentManager = currentUserRoles.includes("DepartmentManager");
  const isCurrentUserMember = currentUserRoles.includes("Member");

  // 清空之前的映射
  userInfoMap.value.clear();

  return data.map(item => {
    const [department, members] = Object.entries(item)[0] || ["未分配部门", []];
    const children: TreeNode[] = Array.isArray(members)
      ? members
        .filter(user => {
          if (!user) return false;

          const userValue = user.username || user.nickname;
          const userRoles = Array.isArray(user.role) ? user.role : user.role ? [user.role] : [];
          const isUserProjectManager = userRoles.includes("ProjectManager");
          const isUserDepartmentManager = userRoles.includes("DepartmentManager");

          // 如果下一状态是"待验收"，可以分配给部门负责人（ProjectManager）
          // 这个规则优先于其他过滤规则
          if (isPendingAcceptance && isUserProjectManager) {
            return true;
          }

          // 部门筛选：在「待分配给部门负责人」状态下，若选择了部门，保留该部门下 ProjectManager 或 DepartmentManager
          if (isPendingAssignToDeptLeaderState && selectedDeptName) {
            if (department !== selectedDeptName) return false;
            const isDeptLeader = userRoles.includes("ProjectManager") || userRoles.includes("DepartmentManager");
            if (!isDeptLeader) return false;
          }
          // 规则1：如果当前用户是部门负责人，不能分配给其他项目负责人
          // 但如果下一状态是"待验收"，允许分配（已在上面处理）
          if (isCurrentUserDepartmentManager && isUserProjectManager && !isPendingAcceptance) {
            return false;
          }

          // 规则2：如果当前用户是普通成员，不能分配给项目负责人（但允许分配给自己）
          // 但如果下一状态是"待验收"，允许分配（已在上面处理）
          if (isCurrentUserMember && isUserProjectManager && !isPendingAcceptance) {
            return false;
          }

          // 如果当前状态是"待指派给成员"，允许分配
          if (isPendingAssignToMember) {
            // 普通成员不能分配给项目负责人，已在上面处理
            // 其他角色可以分配
            return true;
          }

          // 其他状态：允许分配给当前用户
          return true;
        })
        .map(user => {
          const username = user.username || user.nickname || "未知用户";
          const value = username || `${department}-${Math.random()}`;
          // 保存用户信息到映射中
          userInfoMap.value.set(value, user);
          return {
            label: username,
            value: value,
            userInfo: user // 保存完整的用户信息
          };
        })
      : [];
    return {
      label: department,
      value: `dept_${department}`,
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
      // 如果当前状态是"工时审核未通过"，先提交预计工时
      if (needDevelopmentTime.value) {
        if (!form.development_start_time || !form.development_end_time) {
          ElMessage.error("请填写研发开始时间和结束时间");
          confirmLoading.value = false;
          return;
        }
        const developmentTimeResponse = await updateDevelopmentTime({
          task_id: taskId,
          development_start_time: form.development_start_time,
          development_end_time: form.development_end_time
        });
        if (developmentTimeResponse.code !== 200) {
          ElMessage.error(developmentTimeResponse.message || "预计工时提交失败");
          confirmLoading.value = false;
          return;
        }
      }

      // 如果 need_assign 为 false，可以不传 person_name 或传空字符串
      const personName = needAssign.value ? form.personName.trim() : "";

      // 从用户信息映射中获取选中成员的完整信息
      const selectedUser = userInfoMap.value.get(personName);

      // 即使 workchat_username 为空也发送消息
      // const workchatUsername = selectedUser?.workchat_username || '';

      // const res = await sendWorkchatMessage({
      //   workchat_username: workchatUsername,
      //   current_state: currentState,
      //   next_state: targetState,
      //   task_id: taskId,
      //   task_name: props.task.任务名
      // });
      // if (res.code !== 200) {
      //   ElMessage.error(res.message || "发送消息失败");
      //   return;
      // }
      // 根据选中的状态对应的 need_reason 来决定是否传递驳回理由
      const selectedIndex = options.length > 1
        ? options.indexOf(targetState)
        : 0;
      const needReason = needReasonArray.value[selectedIndex] === true;
      const rejectionReason = needReason ? form.rejectionReason.trim() : "";

      // 如果选择的是已完成，需要先上传附件并更新任务，然后进行汇报
      if (isCompleted.value) {
        // 1. 上传附件
        let attachmentUrls: string[] = [];
        if (form.attachmentList.length > 0) {
          try {
            // 上传所有附件
            const uploadPromises = form.attachmentList
              .filter(file => file.raw)
              .map(file => uploadFile({ file: file.raw as File }));

            const uploadResults = await Promise.all(uploadPromises);
            attachmentUrls = uploadResults
              .filter(result => result.code === 200 && result.url)
              .map(result => result.url);

            if (uploadResults.some(result => result.code !== 200)) {
              ElMessage.warning("部分文件上传失败，请重试");
              return;
            }
          } catch (uploadError: any) {
            console.error("上传附件失败:", uploadError);
            ElMessage.error("上传附件失败，请重试");
            return;
          }
        }

        // 2. 如果有附件，调用 /task/update 更新附件（合并现有附件）
        if (attachmentUrls.length > 0) {
          try {
            const taskName = props.task?.任务名 || props.task?.task_name || props.task?.title || "";
            // 合并现有附件和新上传的附件
            const existingAttachments = props.task?.attachment || [];
            const allAttachments = Array.isArray(existingAttachments)
              ? [...existingAttachments, ...attachmentUrls]
              : attachmentUrls;

            const updateResponse = await updateTask({
              task_id: taskId,
              task_name: taskName,
              describe: props.task?.describe || [],
              priority: props.task?.优先级 || props.task?.priority || "",
              task_deadline: props.task?.task_deadline || "",
              default_person: props.task?.default_person || "",
              attachment: allAttachments
            });

            if (updateResponse.code !== 200) {
              ElMessage.error(updateResponse.message || "更新附件失败");
              return;
            }
          } catch (updateError: any) {
            console.error("更新附件失败:", updateError);
            ElMessage.error("更新附件失败，请重试");
            return;
          }
        }

        // 3. 调用 /task/report 进行汇报
        if (form.completionReport.trim()) {
          try {
            const taskName = props.task?.任务名 || props.task?.task_name || props.task?.title || "";
            const recipient = props.task?.creator || personName || userStore.username || "";
            const assignee = props.task?.指派人 || "";
            const reportResponse = await reportTaskProgress({
              recipient: recipient,
              cc_person: assignee,
              task_id: taskId,
              task_name: taskName,
              progress: 100,
              message: form.completionReport.trim(),
              use_time: 1,
              state: currentState
            });

            if (reportResponse.code !== 200) {
              ElMessage.error(reportResponse.message || "提交汇报失败");
              return;
            }
          } catch (reportError: any) {
            console.error("提交汇报失败:", reportError);
            ElMessage.error("提交汇报失败，请重试");
            return;
          }
        }
      }

      // 如果下一状态包含"轮测试失败"，需要调用汇报接口
      if (isTestFailure.value && form.failureReport.trim()) {
        try {
          const taskName = props.task?.任务名 || props.task?.task_name || props.task?.title || "";
          const recipient = props.task?.creator || personName || userStore.username || "";
          const assignee = props.task?.指派人 || props.task?.当前处理人 || props.task?.assignee || "";
          const reportResponse = await reportTaskProgress({
            recipient: recipient,
            cc_person: assignee,
            task_id: taskId,
            task_name: taskName,
            progress: props.task?.进度 || props.task?.progress || 0,
            message: form.failureReport.trim(),
            use_time: 1,
            state: currentState
          });

          if (reportResponse.code !== 200) {
            ElMessage.error(reportResponse.message || "提交失败汇报失败");
            return;
          }
        } catch (reportError: any) {
          console.error("提交失败汇报失败:", reportError);
          ElMessage.error("提交失败汇报失败，请重试");
          return;
        }
      }

      // 如果选择的是第一轮测试，需要传递测试轮数
      const requestData: any = {
        task_id: taskId,
        current_state: currentState,
        next_state: targetState,
        person_name: personName || "",
        rejection_reason: rejectionReason
      };

      // 如果选择的是第一轮测试，添加测试轮数
      if (isFirstRoundTest.value && form.testRounds) {
        requestData.test_rounds = form.testRounds;
      }

      // 当前状态为「待分配给部门负责人」时，与 index 批量分配一致：先调 sendNotification，再调 bulkAssignment，不放在 update_task_state 里传
      if (isPendingAssignToDeptLeader.value) {
        // 1. 先调用更新超时消息接收人接口（与 index handleBatchAssignSubmit 一致）
        try {
          const notificationResponse = await sendNotification({
            recipient: Array.isArray(form.notification_recipients)
              ? form.notification_recipients
              : [form.notification_recipients]
          });
          if (notificationResponse.code !== 200) {
            ElMessage.error(notificationResponse.message || "更新超时消息接收人失败");
            confirmLoading.value = false;
            return;
          }
        } catch (notificationError: any) {
          console.error("更新超时消息接收人失败:", notificationError);
          ElMessage.error(
            notificationError?.response?.data?.message || notificationError?.message || "更新超时消息接收人失败"
          );
          confirmLoading.value = false;
          return;
        }

        // 1.5 调用 addNotification 新增超时消息接收人（失败时暴露错误但不阻塞后续流程）
        try {
          const taskName = props.task?.任务名 || props.task?.task_name || props.task?.title || "";
          const recipients = Array.isArray(form.notification_recipients)
            ? form.notification_recipients
            : form.notification_recipients
              ? [form.notification_recipients]
              : [];
          const deadline = form.time_limit
          const addNotifRes = await addNotification({
            task_id: String(taskId),
            task_name: taskName,
            deadline,
            recipient: recipients
          });
          if (addNotifRes.code !== 200) {
            ElMessage.error(addNotifRes.message || "新增超时消息接收人失败");
          }
        } catch (addNotifError: any) {
          console.error("新增超时消息接收人失败:", addNotifError);
          ElMessage.error(
            addNotifError?.response?.data?.message || addNotifError?.message || "新增超时消息接收人失败"
          );
          // 不 return，继续后续流程
        }

        // 2. 完成期限有改动时才调用单独接口
        const taskIdStr = String(taskId);
        const currentDeadline = normalizeDeadline(form.task_assign_limit);
        const deadlineChanged = currentDeadline !== originalTaskDeadline.value;
        if (taskIdStr && taskIdStr !== "0" && deadlineChanged && currentDeadline) {
          try {
            const res = await updateTaskDeadline({
              task_id: taskId,
              task_deadline: currentDeadline
            });
            if (res.code !== 200) {
              ElMessage.error(res.message || "设置任务完成期限失败");
              confirmLoading.value = false;
              return;
            }
          } catch (error: any) {
            console.error("设置任务完成期限失败:", error);
            ElMessage.error(
              error?.response?.data?.message || error?.message || "设置任务完成期限失败"
            );
            confirmLoading.value = false;
            return;
          }
        }
      }

      // 4. 最后调用 /task/update_state 更新状态（不在此请求中传时限、截止期限、提醒人）
      const response = await updateTaskState(requestData);
      if (response.code === 200) {
        ElMessage.success(response.message || "状态更新成功");
        emit("success", targetState, personName);
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

const getTaskStatusText = (status: string): string => {
  // 如果状态已经是中文，直接返回
  if (status && typeof status === "string") {
    // 检查是否是已知的中文状态
    const chineseStatuses = [
      "待分配给部门负责人",
      "待指派给成员",
      "任务未开始",
      "任务进行中",
      "待测试",
      "测试中",
      "测试完毕",
      "待审阅",
      "审阅中",
      "审阅完毕",
      "已取消",
      "已完成"
    ];
    if (chineseStatuses.includes(status)) {
      return status;
    }

    // 如果是 TaskStatus 枚举值，转换为中文
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
    return textMap[status as TaskStatus] || status;
  }
  return status || "";
};
</script>

<style scoped lang="scss">
/* 指派时限：输入框与「时」同一行 */
.time-limit-inline {
  display: flex;
  align-items: center;
  gap: 8px;
  width: 100%;
  min-width: 0;
}

.time-limit-input {
  flex: 1;
  min-width: 0;
}

.time-limit-unit {
  flex-shrink: 0;
  color: #606266;
}

/* 下一状态多选：桌面端保持横向 */
.next-state-radio-wrap {
  width: 100%;
}

.next-state-radio-group {
  flex-wrap: wrap;
}

/* 移动端适配 */
@media (max-width: 768px) {
  .next-state-radio-wrap {
    :deep(.el-radio-group) {
      display: flex;
      flex-wrap: wrap;
      gap: 8px;
    }

    :deep(.el-radio-button) {
      margin-right: 0;

      .el-radio-button__inner {
        padding: 8px 14px;
        font-size: 13px;
      }
    }
  }

  .time-limit-inline {
    gap: 6px;
  }

  .time-limit-unit {
    font-size: 14px;
  }
}
</style>
