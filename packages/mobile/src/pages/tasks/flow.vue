<template>
  <view class="wizard-page">
    <view class="flow-page__hero">
      <text class="flow-page__hero-label">当前状态</text>
      <text class="flow-page__hero-status">{{ currentStatus || "-" }}</text>
      <text class="flow-page__hero-task">{{ taskName || "加载中..." }}</text>
    </view>

    <view class="flow-page__block">
      <text class="flow-page__block-title">流转至</text>
      <view v-if="nextOptions.length" class="flow-page__chips">
        <view
          v-for="option in nextOptions"
          :key="option"
          class="flow-page__chip"
          :class="{ 'is-active': selectedNextState === option }"
          @click="selectNextState(option)"
        >
          {{ option }}
        </view>
      </view>
      <text v-else class="wizard-page__hint">当前任务无可流转的下一状态</text>
    </view>

    <view v-if="needAssign" class="flow-page__block">
      <text class="flow-page__block-title">分配给</text>
      <input
        v-model="userKeyword"
        class="flow-page__search"
        placeholder="搜索成员姓名"
      />
      <view v-for="group in filteredUserGroups" :key="group.department">
        <text class="flow-page__dept-title">{{ group.department }}</text>
        <view
          v-for="user in group.items"
          :key="user.username"
          class="flow-page__user"
          @click="selectedPerson = user.username"
        >
          <view class="flow-page__radio" :class="{ 'is-checked': selectedPerson === user.username }" />
          <text class="flow-page__user-name">{{ user.username }}</text>
        </view>
      </view>
      <text v-if="!filteredUserGroups.length" class="wizard-page__hint">暂无可选成员</text>
    </view>

    <view v-if="needDeadline" class="flow-page__block">
      <text class="flow-page__block-title">任务完成期限</text>
      <picker mode="date" :value="taskDeadline" @change="onDeadlineChange">
        <view class="form-page__picker">{{ taskDeadline || "请选择完成期限" }}</view>
      </picker>
    </view>

    <view v-if="needRejectionReason" class="flow-page__block">
      <text class="flow-page__block-title">驳回理由</text>
      <textarea
        v-model="rejectionReason"
        class="form-page__textarea"
        placeholder="请说明驳回原因"
        :maxlength="500"
      />
    </view>

    <view v-if="needCompletionReport" class="flow-page__block">
      <text class="flow-page__block-title">完成汇报</text>
      <textarea
        v-model="completionReport"
        class="form-page__textarea"
        placeholder="请填写完成说明"
        :maxlength="1000"
      />
    </view>

    <view v-if="needFailureReport" class="flow-page__block">
      <text class="flow-page__block-title">失败汇报</text>
      <textarea
        v-model="failureReport"
        class="form-page__textarea"
        placeholder="请填写测试失败说明"
        :maxlength="1000"
      />
    </view>

    <view class="wizard-page__footer">
      <view class="wizard-page__btn wizard-page__btn--ghost" @click="goBack">取消</view>
      <view
        class="wizard-page__btn wizard-page__btn--primary"
        :class="{ 'is-disabled': submitting || !nextOptions.length }"
        @click="handleSubmit"
      >
        {{ submitting ? "提交中..." : "确认流转" }}
      </view>
    </view>
  </view>
</template>

<script setup lang="ts">
import { computed, ref, watch } from "vue";
import { onLoad } from "@dcloudio/uni-app";
import { getNextStateUserList, addNotification, selectNotificationPerson, sendNotification } from "@/api/system";
import {
  getTaskInfo,
  reportTaskProgress,
  updateTaskDeadline,
  updateTaskState
} from "@/api/task";
import type { TaskListItem } from "@/api/types";
import { isApiSuccess, unwrapItem } from "@/utils/api";
import { getTaskTitle } from "@/utils/task-mapper";
import { getTaskRawStatus } from "@/utils/task-permissions";
import {
  groupUsersByDepartment,
  parseNextStateUserList,
  type UserOption
} from "@/utils/user-list";

const taskId = ref("");
const rawTask = ref<TaskListItem | null>(null);
const taskName = ref("");
const currentStatus = ref("");
const nextOptions = ref<string[]>([]);
const needAssignFlags = ref<boolean[]>([]);
const needReasonFlags = ref<boolean[]>([]);
const selectedNextState = ref("");
const selectedPerson = ref("");
const userKeyword = ref("");
const users = ref<UserOption[]>([]);
const taskDeadline = ref("");
const rejectionReason = ref("");
const completionReport = ref("");
const failureReport = ref("");
const submitting = ref(false);
const notificationRecipients = ref<string[]>([]);
const originalTaskDeadline = ref("");
const timeLimit = ref(1);

const isPendingAssignToDeptLeader = computed(() => {
  const status = currentStatus.value;
  return status === "未完成 " || status.includes("待分配给部门负责人");
});

const selectedIndex = computed(() => {
  if (!nextOptions.value.length) return -1;
  if (nextOptions.value.length === 1) return 0;
  return nextOptions.value.indexOf(selectedNextState.value);
});

const needAssign = computed(() => {
  if (!nextOptions.value.length) return false;
  const index = selectedIndex.value;
  if (index < 0) return false;
  return needAssignFlags.value[index] === true;
});

const needRejectionReason = computed(() => {
  if (!nextOptions.value.length) return false;
  const index = selectedIndex.value;
  if (index < 0) return false;
  return needReasonFlags.value[index] === true;
});

const needDeadline = computed(() =>
  isPendingAssignToDeptLeader.value ||
  ["待分配给部门主管", "未完成 "].includes(currentStatus.value)
);

const needCompletionReport = computed(() =>
  selectedNextState.value.includes("已完成") || selectedNextState.value === "已完成"
);

const needFailureReport = computed(() =>
  selectedNextState.value.includes("测试失败")
);

const filteredUserGroups = computed(() => {
  const keyword = userKeyword.value.trim();
  const list = keyword
    ? users.value.filter((item) => item.username.includes(keyword))
    : users.value;
  return groupUsersByDepartment(list);
});

function selectNextState(state: string) {
  selectedNextState.value = state;
}

function onDeadlineChange(event: { detail: { value: string } }) {
  taskDeadline.value = event.detail.value;
}

function normalizeDeadline(value: string) {
  return value ? value.slice(0, 10) : "";
}

async function loadNotificationRecipients() {
  try {
    const res = await selectNotificationPerson();
    if (!isApiSuccess(res)) return;
    const payload = (res.result || res.data) as { recipient?: string[] } | undefined;
    if (Array.isArray(payload?.recipient)) {
      notificationRecipients.value = [...payload.recipient];
    }
  } catch {
    notificationRecipients.value = [];
  }
}

async function loadUsers(nextState: string) {
  if (!nextState) {
    users.value = [];
    return;
  }
  try {
    const res = await getNextStateUserList({ next_state: nextState });
    if (!isApiSuccess(res)) throw new Error(res.message || res.msg || "加载成员失败");
    const list = Array.isArray(res.result)
      ? res.result
      : Array.isArray(res.data)
        ? res.data
        : [];
    users.value = parseNextStateUserList(list);
  } catch {
    users.value = [];
  }
}

async function loadTask(id: string) {
  const res = await getTaskInfo(id);
  const raw = unwrapItem(res);
  if (!raw) throw new Error("未找到任务");
  rawTask.value = raw;
  taskName.value = getTaskTitle(raw);
  currentStatus.value = getTaskRawStatus(raw);
  nextOptions.value = Array.isArray(raw.next_state) ? raw.next_state : [];
  needAssignFlags.value = Array.isArray(raw.need_assign) ? raw.need_assign : [];
  needReasonFlags.value = Array.isArray(raw.need_reason) ? raw.need_reason : [];
  selectedNextState.value = nextOptions.value[0] || "";
  const deadline = normalizeDeadline(String(raw.task_deadline || raw.task_dead_line || ""));
  taskDeadline.value = deadline;
  originalTaskDeadline.value = deadline;
  timeLimit.value = 1;
  if (isPendingAssignToDeptLeader.value) {
    selectedPerson.value = String(raw.default_person || raw.默认部门负责人 || "").trim();
    await loadNotificationRecipients();
  }
  if (selectedNextState.value) {
    await loadUsers(selectedNextState.value);
  }
}

watch(selectedNextState, (state) => {
  selectedPerson.value = "";
  if (state) loadUsers(state);
});

async function handleSubmit() {
  if (!rawTask.value || !taskId.value || submitting.value) return;
  if (!selectedNextState.value) {
    uni.showToast({ title: "请选择下一状态", icon: "none" });
    return;
  }
  if (needAssign.value && !selectedPerson.value.trim()) {
    uni.showToast({ title: "请选择分配成员", icon: "none" });
    return;
  }
  if (needRejectionReason.value && !rejectionReason.value.trim()) {
    uni.showToast({ title: "请填写驳回理由", icon: "none" });
    return;
  }
  if (needCompletionReport.value && !completionReport.value.trim()) {
    uni.showToast({ title: "请填写完成汇报", icon: "none" });
    return;
  }
  if (needFailureReport.value && !failureReport.value.trim()) {
    uni.showToast({ title: "请填写失败汇报", icon: "none" });
    return;
  }
  if (needDeadline.value && !taskDeadline.value) {
    uni.showToast({ title: "请选择完成期限", icon: "none" });
    return;
  }

  submitting.value = true;
  try {
    const task = rawTask.value;
    const currentState = getTaskRawStatus(task);
    const personName = needAssign.value ? selectedPerson.value.trim() : "";

    if (isPendingAssignToDeptLeader.value) {
      const recipients = notificationRecipients.value.length
        ? notificationRecipients.value
        : personName
          ? [personName]
          : [];
      if (!recipients.length) {
        uni.showToast({ title: "无法获取超时提醒人", icon: "none" });
        return;
      }

      const notificationRes = await sendNotification({ recipient: recipients });
      if (!isApiSuccess(notificationRes)) {
        throw new Error(notificationRes.message || notificationRes.msg || "更新超时消息接收人失败");
      }

      try {
        const addNotifRes = await addNotification({
          task_id: taskId.value,
          task_name: taskName.value,
          deadline: timeLimit.value,
          recipient: recipients
        });
        if (!isApiSuccess(addNotifRes)) {
          console.warn(addNotifRes.message || addNotifRes.msg || "新增超时消息接收人失败");
        }
      } catch (error) {
        console.warn("新增超时消息接收人失败", error);
      }

      const normalizedDeadline = normalizeDeadline(taskDeadline.value);
      if (normalizedDeadline && normalizedDeadline !== originalTaskDeadline.value) {
        const deadlineRes = await updateTaskDeadline({
          task_id: taskId.value,
          task_deadline: normalizedDeadline
        });
        if (!isApiSuccess(deadlineRes)) {
          throw new Error(deadlineRes.message || deadlineRes.msg || "更新期限失败");
        }
      }
    } else if (needDeadline.value && taskDeadline.value) {
      const deadlineRes = await updateTaskDeadline({
        task_id: taskId.value,
        task_deadline: taskDeadline.value
      });
      if (!isApiSuccess(deadlineRes)) {
        throw new Error(deadlineRes.message || deadlineRes.msg || "更新期限失败");
      }
    }

    if (needCompletionReport.value) {
      const reportRes = await reportTaskProgress({
        recipient: String(task.creator || personName || ""),
        cc_person: String(task.指派人 || ""),
        task_id: taskId.value,
        task_name: taskName.value,
        progress: 100,
        message: completionReport.value.trim(),
        use_time: 1,
        state: currentState
      });
      if (!isApiSuccess(reportRes)) {
        throw new Error(reportRes.message || reportRes.msg || "完成汇报失败");
      }
    }

    if (needFailureReport.value) {
      const reportRes = await reportTaskProgress({
        recipient: String(task.creator || personName || ""),
        cc_person: String(task.指派人 || task.当前处理人 || ""),
        task_id: taskId.value,
        task_name: taskName.value,
        progress: Number(task.进度 ?? task.progress ?? 0) || 0,
        message: failureReport.value.trim(),
        use_time: 1,
        state: currentState
      });
      if (!isApiSuccess(reportRes)) {
        throw new Error(reportRes.message || reportRes.msg || "失败汇报提交失败");
      }
    }

    const stateRes = await updateTaskState({
      task_id: taskId.value,
      current_state: currentState,
      next_state: selectedNextState.value,
      person_name: personName,
      rejection_reason: needRejectionReason.value ? rejectionReason.value.trim() : ""
    });
    if (!isApiSuccess(stateRes)) {
      throw new Error(stateRes.message || stateRes.msg || "状态更新失败");
    }

    uni.showToast({ title: "流转成功", icon: "success" });
    setTimeout(() => uni.navigateBack(), 800);
  } catch (error) {
    uni.showToast({
      title: error instanceof Error ? error.message : "流转失败",
      icon: "none"
    });
  } finally {
    submitting.value = false;
  }
}

function goBack() {
  uni.navigateBack();
}

onLoad((query) => {
  if (query?.id) {
    taskId.value = String(query.id);
    loadTask(taskId.value).catch((error) => {
      uni.showToast({
        title: error instanceof Error ? error.message : "加载失败",
        icon: "none"
      });
    });
  }
});
</script>

<style lang="scss" scoped>
@import "@/styles/wizard-page.scss";
@import "@/styles/form-page.scss";
</style>
