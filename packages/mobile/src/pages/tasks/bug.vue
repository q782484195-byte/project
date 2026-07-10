<template>
  <view class="form-page">
    <view class="form-page__card">
      <view class="form-page__readonly">
        <text class="form-page__label">关联任务</text>
        <text class="form-page__value">{{ taskName || "加载中..." }}</text>
      </view>
      <view class="form-page__field">
        <text class="form-page__label">BUG 名称</text>
        <input
          v-model="bugName"
          class="form-page__input"
          placeholder="请输入 BUG 名称"
          :maxlength="100"
        />
      </view>
      <view class="form-page__field">
        <text class="form-page__label">BUG 描述</text>
        <textarea
          v-model="describe"
          class="form-page__textarea"
          placeholder="请描述问题现象、复现步骤等"
          :maxlength="1000"
        />
      </view>
    </view>

    <view
      class="form-page__submit"
      :class="{ 'is-loading': submitting }"
      @click="handleSubmit"
    >
      {{ submitting ? "提交中..." : "提交 BUG" }}
    </view>

    <view v-if="bugs.length" class="form-page__list">
      <text class="form-page__list-title">历史 BUG（{{ bugs.length }}）</text>
      <view v-for="item in bugs" :key="item.id" class="form-page__list-item">
        <text class="form-page__list-name">{{ item.name }}</text>
        <text class="form-page__list-desc">{{ item.describe }}</text>
        <text class="form-page__list-meta">{{ item.meta }}</text>
      </view>
    </view>
  </view>
</template>

<script setup lang="ts">
import { ref } from "vue";
import { onLoad } from "@dcloudio/uni-app";
import { createBug, selectBugsByTask } from "@/api/bug";
import { getTaskInfo } from "@/api/task";
import { isApiSuccess, unwrapItem, unwrapList } from "@/utils/api";
import { getTaskId, getTaskTitle } from "@/utils/task-mapper";
import type { TaskListItem } from "@/api/types";

const taskId = ref("");
const projectId = ref("");
const taskName = ref("");
const bugName = ref("");
const describe = ref("");
const submitting = ref(false);
const bugs = ref<Array<{ id: string; name: string; describe: string; meta: string }>>([]);

async function loadBugs(id: string) {
  try {
    const res = await selectBugsByTask({ task_id: id, page: 1, page_size: 20 });
    bugs.value = unwrapList(res).map((item, index) => ({
      id: String(item._id || item.id || `bug-${index}`),
      name: item.bug_name || "未命名 BUG",
      describe: item.describe || "-",
      meta: `${item.creator || "未知"} · ${item.create_time || "-"}`
    }));
  } catch {
    bugs.value = [];
  }
}

async function loadTask(id: string) {
  try {
    const res = await getTaskInfo(id);
    const raw = unwrapItem(res) as TaskListItem | null;
    if (!raw) throw new Error("未找到任务");
    taskId.value = getTaskId(raw);
    projectId.value = String(raw.project_id || "");
    if (!projectId.value) {
      uni.showToast({ title: "任务缺少项目信息", icon: "none" });
    }
    taskName.value = getTaskTitle(raw);
    await loadBugs(taskId.value);
  } catch (error) {
    uni.showToast({
      title: error instanceof Error ? error.message : "加载任务失败",
      icon: "none"
    });
  }
}

async function handleSubmit() {
  if (!taskId.value) {
    uni.showToast({ title: "任务信息不完整", icon: "none" });
    return;
  }
  if (!projectId.value) {
    uni.showToast({ title: "任务缺少项目信息，无法记录 BUG", icon: "none" });
    return;
  }
  if (!bugName.value.trim()) {
    uni.showToast({ title: "请输入 BUG 名称", icon: "none" });
    return;
  }
  if (!describe.value.trim()) {
    uni.showToast({ title: "请输入 BUG 描述", icon: "none" });
    return;
  }

  submitting.value = true;
  try {
    const res = await createBug({
      bug_name: bugName.value.trim(),
      describe: describe.value.trim(),
      project_id: projectId.value,
      task_id: taskId.value,
      task_name: taskName.value
    });
    if (!isApiSuccess(res)) {
      throw new Error(res.message || res.msg || "提交失败");
    }
    uni.showToast({ title: "BUG 记录成功", icon: "success" });
    bugName.value = "";
    describe.value = "";
    await loadBugs(taskId.value);
  } catch (error) {
    uni.showToast({
      title: error instanceof Error ? error.message : "提交失败",
      icon: "none"
    });
  } finally {
    submitting.value = false;
  }
}

onLoad((query) => {
  if (query?.id) {
    loadTask(String(query.id));
  }
});
</script>

<style lang="scss" scoped>
@import "@/styles/form-page.scss";
</style>
