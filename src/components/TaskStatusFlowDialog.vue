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
          <el-radio-group v-model="selectedNextState">
            <el-radio-button v-for="option in nextOptions" :key="option" :label="option">
              {{ getTaskStatusText(option) }}
            </el-radio-button>
          </el-radio-group>
        </template>
      </el-form-item>
      <el-form-item v-if="needAssign" label="分配给" prop="personName">
        <el-tree-select v-model="form.personName" placeholder="请选择分配给" :loading="allUsersLoading" filterable
          check-strictly default-expand-all :data="allUsersTree" :props="treeSelectProps" node-key="value"
          :render-after-expand="false" style="width: 100%" clearable />
      </el-form-item>
      <!-- <el-form-item v-if="isFirstRoundTest" label="测试轮数" prop="testRounds">
        <el-select v-model="form.testRounds" placeholder="请选择测试轮数" style="width: 100%">
          <el-option v-for="round in testRoundOptions" :key="round" :label="`${round}轮`" :value="round" />
        </el-select>
      </el-form-item> -->
      <el-form-item v-if="isCompleted" label="完成汇报" prop="completionReport">
        <el-input v-model="form.completionReport" type="textarea" :rows="4" placeholder="请输入完成汇报内容" />
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
      <el-form-item v-if="needDevelopmentTime" label="研发开始时间" prop="development_start_time">
        <el-date-picker v-model="form.development_start_time" type="date" placeholder="请选择研发开始时间" format="YYYY-MM-DD"
          value-format="YYYY-MM-DD" style="width: 100%" />
      </el-form-item>
      <el-form-item v-if="needDevelopmentTime" label="研发结束时间" prop="development_end_time">
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
import { updateTaskState, updateTask, reportTaskProgress, uploadFile, updateDevelopmentTime } from "@/api/project";
import { selectAllUsers } from "@/api/system";
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
  personName: string;
  rejectionReason: string;
  testRounds: number;
  completionReport: string;
  attachmentList: UploadFile[];
  development_start_time: string;
  development_end_time: string;
}
const form = reactive<FormData>({
  personName: "",
  rejectionReason: "",
  testRounds: null,
  completionReport: "",
  attachmentList: [],
  development_start_time: "",
  development_end_time: ""
});
const rules = computed<FormRules>(() => {
  const baseRules: FormRules = {};
  // 只有当 need_assign 为 true 时，personName 才必填
  if (needAssign.value) {
    baseRules.personName = [
      { required: true, message: "负责人不能为空", trigger: ["blur", "change"] }
    ];
  }

  // 如果选择的是已完成状态，完成汇报必填
  if (isCompleted.value) {
    baseRules.completionReport = [
      { required: true, message: "请输入完成汇报内容", trigger: ["blur", "change"] }
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
      { required: true, message: "请选择研发开始时间", trigger: ["blur", "change"] }
    ];
    baseRules.development_end_time = [
      { required: true, message: "请选择研发结束时间", trigger: ["blur", "change"] },
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
          // 检查是否超过任务截止日期
          if (props.task?.task_deadline) {
            const deadline = new Date(props.task.task_deadline);
            deadline.setHours(23, 59, 59, 999);
            const endDate = new Date(value);
            endDate.setHours(0, 0, 0, 0);
            const deadlineDate = new Date(props.task.task_deadline);
            deadlineDate.setHours(0, 0, 0, 0);
            if (endDate.getTime() > deadlineDate.getTime()) {
              callback(new Error("开发结束日期不能超过任务截止日期"));
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
const confirmLoading = ref(false);
const userStore = useUserStoreHook();

// 根据当前状态动态过滤用户列表
const allUsersTree = computed<TreeNode[]>(() => {
  if (!allUsersRawData.value.length) return [];
  return buildTreeData(allUsersRawData.value);
});

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

// 根据选中的下一状态，判断是否需要显示分配给输入框
const needAssign = computed<boolean>(() => {
  if (nextOptions.value.length === 0 || needAssignArray.value.length === 0) {
    return false;
  }

  // 如果只有一个选项，直接使用第一个 need_assign
  if (nextOptions.value.length === 1) {
    return needAssignArray.value[0] === true;
  }

  // 如果有多个选项，需要选中状态才能判断
  if (!selectedNextState.value) {
    return false;
  }

  // 根据选中的状态找到对应的 need_assign
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

// 判断当前状态是否需要填写预计工时（工时审核未通过）
const needDevelopmentTime = computed<boolean>(() => {
  const status = currentStatus.value;
  return status === "工时审核未通过";
});

const resetForm = () => {
  form.personName = "";
  form.rejectionReason = "";
  form.testRounds = 1;
  form.completionReport = "";
  form.attachmentList = [];
  form.development_start_time = "";
  form.development_end_time = "";
  selectedNextState.value = "";
};

const initForm = () => {
  form.personName = "";
  form.rejectionReason = "";
  form.testRounds = 1;
  form.completionReport = "";
  form.attachmentList = [];
  form.development_start_time = "";
  form.development_end_time = "";
  if (nextOptions.value.length === 1) {
    selectedNextState.value = nextOptions.value[0];
  } else {
    selectedNextState.value = "";
  }
  // 只有当 need_assign 为 true 时才加载用户列表
  if (needAssign.value && !allUsersRawData.value.length) {
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
    // 当选项变化时，清空驳回理由
    form.rejectionReason = "";
  }
);

// 监听选中的状态变化，清空驳回理由和完成汇报
watch(
  () => selectedNextState.value,
  () => {
    form.rejectionReason = "";
    // 如果切换状态后不是已完成，清空完成汇报和附件
    if (!isCompleted.value) {
      form.completionReport = "";
      form.attachmentList = [];
    }
    nextTick(() => {
      formRef.value?.clearValidate("rejectionReason");
      formRef.value?.clearValidate("completionReport");
    });
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

const loadAllUsers = async () => {
  allUsersLoading.value = true;
  try {
    const response = await selectAllUsers();
    if (response.code === 200 && Array.isArray(response.result)) {
      // 存储原始数据，计算属性会自动根据状态过滤
      allUsersRawData.value = response.result;
    } else {
      allUsersRawData.value = [];
      ElMessage.error("加载人员列表失败");
    }
  } catch (error: any) {
    console.error("加载人员列表失败:", error);
    ElMessage.error(
      error?.response?.data?.message || error?.message || "加载人员列表失败"
    );
    allUsersRawData.value = [];
  } finally {
    allUsersLoading.value = false;
  }
};

// 用户信息映射，用于根据 username 查找完整的用户信息
const userInfoMap = ref<Map<string, any>>(new Map());

const buildTreeData = (data: Array<Record<string, any>>): TreeNode[] => {
  if (!Array.isArray(data)) return [];
  const currentUsername = userStore.username;
  const currentUserRoles = userStore.roles || [];
  const isPendingAssignToMember = normalizedStatus.value === TaskStatus.PENDING_ASSIGN_TO_MEMBER;

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

          // 规则1：如果当前用户是部门负责人，不能分配给其他项目负责人
          if (isCurrentUserDepartmentManager && isUserProjectManager) {
            return false;
          }

          // 规则2：如果当前用户是普通成员，不能分配给项目负责人（但允许分配给自己）
          if (isCurrentUserMember) {
            // 不能分配给项目负责人
            if (isUserProjectManager) {
              return false;
            }
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
            const reportResponse = await reportTaskProgress({
              recipient: recipient,
              cc_person: personName || "",
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

      // 4. 最后调用 /task/update_state 更新状态
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
