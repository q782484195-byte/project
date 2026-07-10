<template>
  <view class="form-page">
    <view class="form-page__card">
      <view class="form-page__field">
        <text class="form-page__label">选择项目</text>
        <picker :range="projectNames" :value="projectIndex" @change="onProjectChange">
          <view class="form-page__picker">
            {{ selectedProject?.name || "请选择项目" }}
          </view>
        </picker>
      </view>
      <view v-if="selectedProject" class="form-page__readonly">
        <text class="form-page__label">汇报接收人</text>
        <text class="form-page__value">{{ selectedProject.recipient || "-" }}</text>
      </view>
      <view class="form-page__field">
        <text class="form-page__label">日报内容</text>
        <textarea
          v-model="message"
          class="form-page__textarea"
          placeholder="请输入今日工作内容与进展"
          :maxlength="2000"
        />
      </view>
    </view>

    <view
      class="form-page__submit"
      :class="{ 'is-loading': submitting }"
      @click="handleSubmit"
    >
      {{ submitting ? "提交中..." : "提交日报" }}
    </view>

    <view v-if="history.length" class="form-page__list">
      <text class="form-page__list-title">我的历史日报</text>
      <view v-for="item in history" :key="item.id" class="form-page__list-item">
        <text class="form-page__list-name">{{ item.projectName }}</text>
        <text class="form-page__list-desc">{{ item.message }}</text>
        <text class="form-page__list-meta">{{ item.time }}</text>
      </view>
    </view>
  </view>
</template>

<script setup lang="ts">
import { computed, ref } from "vue";
import { onShow } from "@dcloudio/uni-app";
import { selectProjects } from "@/api/project";
import { createProjectReport, selectSelfReports } from "@/api/report";
import { isApiSuccess, unwrapList } from "@/utils/api";
import { useUserStore } from "@/stores/user";

interface ProjectOption {
  id: string;
  name: string;
  recipient: string;
}

const userStore = useUserStore();
const projects = ref<ProjectOption[]>([]);
const projectIndex = ref(0);
const message = ref("");
const submitting = ref(false);
const history = ref<
  Array<{ id: string; projectName: string; message: string; time: string }>
>([]);

const projectNames = computed(() => projects.value.map((item) => item.name));
const selectedProject = computed(() => projects.value[projectIndex.value] || null);

function onProjectChange(event: { detail: { value: string | number } }) {
  projectIndex.value = Number(event.detail.value) || 0;
}

async function loadProjects() {
  try {
    const res = await selectProjects({ page: 1, page_size: 100 });
    projects.value = unwrapList(res).map((item) => ({
      id: item._id,
      name: item.project_name,
      recipient: String(item.creator || "")
    }));
  } catch {
    projects.value = [];
  }
}

async function loadHistory() {
  try {
    const res = await selectSelfReports({ page: 1, page_size: 10 });
    history.value = unwrapList(res).map((item, index) => ({
      id: String(item._id || item.id || `report-${index}`),
      projectName: String(item.project_name || "项目汇报"),
      message: String(item.message || "-"),
      time: String(item.create_time || "-")
    }));
  } catch {
    history.value = [];
  }
}

async function handleSubmit() {
  const project = selectedProject.value;
  if (!project) {
    uni.showToast({ title: "请选择项目", icon: "none" });
    return;
  }
  if (!message.value.trim()) {
    uni.showToast({ title: "请输入日报内容", icon: "none" });
    return;
  }
  if (!project.recipient) {
    uni.showToast({ title: "项目接收人信息缺失", icon: "none" });
    return;
  }

  submitting.value = true;
  try {
    const res = await createProjectReport({
      recipient: project.recipient,
      project_id: project.id,
      project_name: project.name,
      message: message.value.trim()
    });
    if (!isApiSuccess(res)) {
      throw new Error(res.message || res.msg || "提交失败");
    }
    uni.showToast({ title: "日报提交成功", icon: "success" });
    message.value = "";
    await loadHistory();
  } catch (error) {
    uni.showToast({
      title: error instanceof Error ? error.message : "提交失败",
      icon: "none"
    });
  } finally {
    submitting.value = false;
  }
}

onShow(() => {
  if (!userStore.isLoggedIn) {
    uni.reLaunch({ url: "/pages/login/index" });
    return;
  }
  loadProjects();
  loadHistory();
});
</script>

<style lang="scss" scoped>
@import "@/styles/form-page.scss";
</style>
