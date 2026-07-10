<template>
  <view class="wizard-page">
    <view class="flow-page__hero">
      <text class="flow-page__hero-label">任务转让</text>
      <text class="flow-page__hero-status">{{ taskName || "加载中..." }}</text>
      <text class="flow-page__hero-task">当前处理人：{{ currentHandler || "-" }}</text>
    </view>

    <view class="flow-page__block">
      <text class="flow-page__block-title">选择新负责人</text>
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
      <text v-if="!filteredUserGroups.length && !loading" class="wizard-page__hint">暂无可选成员</text>
    </view>

    <view class="wizard-page__footer">
      <view class="wizard-page__btn wizard-page__btn--ghost" @click="goBack">取消</view>
      <view
        class="wizard-page__btn wizard-page__btn--primary"
        :class="{ 'is-disabled': submitting }"
        @click="handleSubmit"
      >
        {{ submitting ? "提交中..." : "确认转让" }}
      </view>
    </view>
  </view>
</template>

<script setup lang="ts">
import { computed, ref } from "vue";
import { onLoad } from "@dcloudio/uni-app";
import { getNextStateUserList } from "@/api/system";
import { getTaskInfo, updateTaskTransfer } from "@/api/task";
import { isApiSuccess, unwrapItem } from "@/utils/api";
import { getTaskHandler, getTaskRawStatus } from "@/utils/task-permissions";
import { getTaskTitle } from "@/utils/task-mapper";
import {
  groupUsersByDepartment,
  parseNextStateUserList,
  type UserOption
} from "@/utils/user-list";

const taskId = ref("");
const taskName = ref("");
const currentHandler = ref("");
const currentStatus = ref("");
const selectedPerson = ref("");
const userKeyword = ref("");
const users = ref<UserOption[]>([]);
const loading = ref(false);
const submitting = ref(false);

const filteredUserGroups = computed(() => {
  const keyword = userKeyword.value.trim();
  const list = keyword
    ? users.value.filter((item) => item.username.includes(keyword))
    : users.value;
  return groupUsersByDepartment(list);
});

async function loadTask(id: string) {
  const res = await getTaskInfo(id);
  const raw = unwrapItem(res);
  if (!raw) throw new Error("未找到任务");
  taskName.value = getTaskTitle(raw);
  currentHandler.value = getTaskHandler(raw);
  currentStatus.value = getTaskRawStatus(raw);
  await loadUsers(currentStatus.value);
}

async function loadUsers(status: string) {
  loading.value = true;
  try {
    const res = await getNextStateUserList({ next_state: status });
    if (!isApiSuccess(res)) throw new Error(res.message || res.msg || "加载成员失败");
    const list = Array.isArray(res.result)
      ? res.result
      : Array.isArray(res.data)
        ? res.data
        : [];
    users.value = parseNextStateUserList(list);
  } catch {
    users.value = [];
  } finally {
    loading.value = false;
  }
}

async function handleSubmit() {
  if (!taskId.value || submitting.value) return;
  if (!selectedPerson.value.trim()) {
    uni.showToast({ title: "请选择新负责人", icon: "none" });
    return;
  }

  submitting.value = true;
  try {
    const res = await updateTaskTransfer({
      task_id: taskId.value,
      person_name: selectedPerson.value.trim()
    });
    if (!isApiSuccess(res)) {
      throw new Error(res.message || res.msg || "转让失败");
    }
    uni.showToast({ title: "转让成功", icon: "success" });
    setTimeout(() => uni.navigateBack(), 800);
  } catch (error) {
    uni.showToast({
      title: error instanceof Error ? error.message : "转让失败",
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
