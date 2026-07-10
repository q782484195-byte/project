<template>
  <view class="form-page">
    <view class="form-page__card">
      <view class="form-page__readonly">
        <text class="form-page__label">任务</text>
        <text class="form-page__value">{{ taskName || "加载中..." }}</text>
      </view>
      <view class="form-page__readonly">
        <text class="form-page__label">接收人</text>
        <text class="form-page__value">{{ recipient || "-" }}</text>
      </view>

      <view class="form-page__field">
        <text class="form-page__label">进度（%）</text>
        <input
          v-model="progressText"
          class="form-page__input"
          type="number"
          placeholder="0-100"
        />
      </view>
      <view class="form-page__field">
        <text class="form-page__label">本次用时（小时）</text>
        <input
          v-model="useTimeText"
          class="form-page__input"
          type="digit"
          placeholder="请输入本次用时"
        />
      </view>
      <view class="form-page__field">
        <text class="form-page__label">汇报内容</text>
        <textarea
          v-model="message"
          class="form-page__textarea"
          placeholder="请输入本次进度说明"
          :maxlength="500"
        />
      </view>
    </view>

    <view
      class="form-page__submit"
      :class="{ 'is-loading': submitting }"
      @click="handleSubmit"
    >
      {{ submitting ? "提交中..." : "提交汇报" }}
    </view>
  </view>
</template>

<script setup lang="ts">
import { ref } from "vue";
import { onLoad } from "@dcloudio/uni-app";
import { getTaskInfo, reportTaskProgress } from "@/api/task";
import { getTaskTitle } from "@/utils/task-mapper";
import { isApiSuccess, unwrapItem } from "@/utils/api";

const taskId = ref("");
const taskName = ref("");
const recipient = ref("");
const ccPerson = ref("");
const state = ref("");
const progressText = ref("0");
const useTimeText = ref("1");
const message = ref("");
const submitting = ref(false);

async function loadTask(id: string) {
  try {
    const res = await getTaskInfo(id);
    const raw = unwrapItem(res);
    if (!raw) throw new Error("未找到任务");
    taskName.value = getTaskTitle(raw);
    recipient.value = String(raw.creator || "");
    ccPerson.value = String(raw.指派人 || raw.assignee || raw.default_person || "");
    state.value = String(raw.状态 || raw.status || "");
    progressText.value = String(Number(raw.进度 ?? raw.progress ?? 0) || 0);
  } catch (error) {
    uni.showToast({
      title: error instanceof Error ? error.message : "加载任务失败",
      icon: "none"
    });
  }
}

async function handleSubmit() {
  if (!taskId.value) return;
  const progress = Number(progressText.value);
  const useTime = Number(useTimeText.value);
  if (Number.isNaN(progress) || progress < 0 || progress > 100) {
    uni.showToast({ title: "进度需在 0-100 之间", icon: "none" });
    return;
  }
  if (Number.isNaN(useTime) || useTime < 0) {
    uni.showToast({ title: "请输入有效的用时", icon: "none" });
    return;
  }
  if (!message.value.trim()) {
    uni.showToast({ title: "请输入汇报内容", icon: "none" });
    return;
  }
  if (!recipient.value) {
    uni.showToast({ title: "接收人信息缺失", icon: "none" });
    return;
  }

  submitting.value = true;
  try {
    const res = await reportTaskProgress({
      recipient: recipient.value,
      cc_person: ccPerson.value,
      task_id: taskId.value,
      task_name: taskName.value,
      progress,
      message: message.value.trim(),
      use_time: useTime,
      state: state.value
    });
    if (!isApiSuccess(res)) {
      throw new Error(res.message || res.msg || "汇报失败");
    }
    uni.showToast({ title: "汇报成功", icon: "success" });
    setTimeout(() => uni.navigateBack(), 800);
  } catch (error) {
    uni.showToast({
      title: error instanceof Error ? error.message : "汇报失败",
      icon: "none"
    });
  } finally {
    submitting.value = false;
  }
}

onLoad((query) => {
  if (query?.id) {
    taskId.value = String(query.id);
    loadTask(taskId.value);
  }
});
</script>

<style lang="scss" scoped>
@import "@/styles/form-page.scss";
</style>
