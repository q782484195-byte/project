<template>
  <view class="wizard-page">
    <view class="wizard-page__steps">
      <template v-for="(step, index) in steps" :key="step.key">
        <view
          class="wizard-page__step"
          :class="{ 'is-active': currentStep === index, 'is-done': currentStep > index }"
        >
          <view class="wizard-page__step-dot">{{ index + 1 }}</view>
          <text class="wizard-page__step-label">{{ step.label }}</text>
        </view>
        <view v-if="index < steps.length - 1" class="wizard-page__line" />
      </template>
    </view>

    <view class="wizard-page__body">
      <template v-if="currentStep === 0">
        <text class="wizard-page__section-title">选择项目</text>
        <text class="wizard-page__hint">先选定项目，再选择所属需求层级</text>
        <view class="wizard-page__cards">
          <view
            v-for="project in projects"
            :key="project.id"
            class="wizard-page__card"
            :class="{ 'is-selected': selectedProjectId === project.id }"
            @click="selectProject(project.id)"
          >
            <text class="wizard-page__card-title">{{ project.name }}</text>
            <text class="wizard-page__card-meta">{{ project.state }} · 负责人 {{ project.creator || "-" }}</text>
          </view>
        </view>
      </template>

      <template v-else-if="currentStep === 1">
        <text class="wizard-page__section-title">选择需求层级</text>
        <text class="wizard-page__hint">任务将挂载在所选层级下</text>
        <view v-if="requirements.length" class="wizard-page__cards">
          <view
            v-for="item in requirements"
            :key="item.id"
            class="wizard-page__card"
            :class="{ 'is-selected': selectedRequirementId === item.id }"
            @click="selectRequirement(item.id)"
          >
            <text class="wizard-page__card-title">{{ item.name }}</text>
            <text class="wizard-page__card-meta">{{ item.state }} · {{ item.priority }}</text>
          </view>
        </view>
        <view v-else class="wizard-page__card">
          <text class="wizard-page__card-meta">该项目下暂无可用层级</text>
        </view>
      </template>

      <template v-else>
        <text class="wizard-page__section-title">填写任务信息</text>
        <view class="form-page__card">
          <view class="form-page__readonly">
            <text class="form-page__label">所属层级</text>
            <text class="form-page__value">{{ selectedRequirement?.name || "-" }}</text>
          </view>
          <view class="form-page__field">
            <text class="form-page__label">任务名称</text>
            <input v-model="taskName" class="form-page__input" placeholder="请输入任务名称" :maxlength="100" />
          </view>
          <view class="form-page__field">
            <text class="form-page__label">优先级</text>
            <picker :range="priorityOptions" :value="priorityIndex" @change="onPriorityChange">
              <view class="form-page__picker">{{ priorityOptions[priorityIndex] }}</view>
            </picker>
          </view>
          <view class="form-page__field">
            <text class="form-page__label">完成期限</text>
            <picker mode="date" :value="deadline" @change="onDeadlineChange">
              <view class="form-page__picker">{{ deadline || "请选择日期" }}</view>
            </picker>
          </view>
          <view class="form-page__field">
            <text class="form-page__label">任务描述</text>
            <textarea
              v-model="description"
              class="form-page__textarea"
              placeholder="请输入任务背景、目标或验收标准"
              :maxlength="1000"
            />
          </view>
        </view>
      </template>
    </view>

    <view class="wizard-page__footer">
      <view
        v-if="currentStep > 0"
        class="wizard-page__btn wizard-page__btn--ghost"
        @click="prevStep"
      >
        上一步
      </view>
      <view
        class="wizard-page__btn wizard-page__btn--primary"
        :class="{ 'is-disabled': !canNext || submitting }"
        @click="currentStep < 2 ? nextStep() : handleSubmit()"
      >
        {{ submitting ? "提交中..." : currentStep < 2 ? "下一步" : "创建任务" }}
      </view>
    </view>
  </view>
</template>

<script setup lang="ts">
import { computed, ref } from "vue";
import { onShow } from "@dcloudio/uni-app";
import { selectProjects } from "@/api/project";
import { selectRequirements } from "@/api/requirement";
import { createTask } from "@/api/task";
import { isApiSuccess, unwrapList } from "@/utils/api";
import {
  flattenRequirementData,
  mapRequirementOptions
} from "@/utils/requirement";
import { useUserStore } from "@/stores/user";

const userStore = useUserStore();

const steps = [
  { key: "project", label: "选项目" },
  { key: "requirement", label: "选层级" },
  { key: "form", label: "填信息" }
];

const currentStep = ref(0);
const submitting = ref(false);

const projects = ref<
  Array<{ id: string; name: string; state: string; creator: string }>
>([]);
const requirements = ref<
  Array<{ id: string; name: string; state: string; priority: string }>
>([]);

const selectedProjectId = ref("");
const selectedRequirementId = ref("");
const taskName = ref("");
const priorityOptions = ["正常", "紧急"];
const priorityIndex = ref(0);
const deadline = ref("");
const description = ref("");

const selectedRequirement = computed(() =>
  requirements.value.find((item) => item.id === selectedRequirementId.value)
);

const canNext = computed(() => {
  if (currentStep.value === 0) return !!selectedProjectId.value;
  if (currentStep.value === 1) return !!selectedRequirementId.value;
  return !!taskName.value.trim() && !!deadline.value && !!description.value.trim();
});

async function loadProjects() {
  const res = await selectProjects({ page: 1, page_size: 100 });
  projects.value = unwrapList(res).map((item) => ({
    id: item._id,
    name: item.project_name,
    state: item.state || "-",
    creator: String(item.creator || "")
  }));
}

async function loadRequirements(projectId: string) {
  try {
    const res = await selectRequirements({ project_id: projectId, page: 1, page_size: 100 });
    if (!isApiSuccess(res)) throw new Error(res.message || res.msg || "加载层级失败");
    const payload = res.result ?? res.data;
    requirements.value = mapRequirementOptions(flattenRequirementData(payload));
  } catch {
    requirements.value = [];
  }
  if (
    selectedRequirementId.value &&
    !requirements.value.some((item) => item.id === selectedRequirementId.value)
  ) {
    selectedRequirementId.value = "";
  }
}

function selectProject(id: string) {
  selectedProjectId.value = id;
}

function selectRequirement(id: string) {
  selectedRequirementId.value = id;
}

function onPriorityChange(event: { detail: { value: string | number } }) {
  priorityIndex.value = Number(event.detail.value) || 0;
}

function onDeadlineChange(event: { detail: { value: string } }) {
  deadline.value = event.detail.value;
}

async function nextStep() {
  if (!canNext.value || submitting.value) {
    uni.showToast({ title: "请先完成当前步骤", icon: "none" });
    return;
  }
  if (currentStep.value === 0) {
    await loadRequirements(selectedProjectId.value);
  }
  currentStep.value += 1;
}

function prevStep() {
  if (currentStep.value > 0) currentStep.value -= 1;
}

async function handleSubmit() {
  if (!canNext.value || submitting.value) return;
  const requirement = selectedRequirement.value;
  if (!requirement) {
    uni.showToast({ title: "请选择需求层级", icon: "none" });
    return;
  }

  submitting.value = true;
  try {
    const res = await createTask({
      task_name: taskName.value.trim(),
      describe: [{ type: "text", content: description.value.trim() }],
      requirement_id: requirement.id,
      requirement_name: requirement.name,
      priority: priorityOptions[priorityIndex.value],
      task_deadline: deadline.value,
      default_person: "",
      attachment: []
    });
    if (!isApiSuccess(res)) {
      throw new Error(res.message || res.msg || "创建失败");
    }
    uni.showToast({ title: "任务创建成功", icon: "success" });
    setTimeout(() => uni.navigateBack(), 800);
  } catch (error) {
    uni.showToast({
      title: error instanceof Error ? error.message : "创建失败",
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
  loadProjects().catch(() => {
    projects.value = [];
  });
});
</script>

<style lang="scss" scoped>
@import "@/styles/wizard-page.scss";
@import "@/styles/form-page.scss";
</style>
