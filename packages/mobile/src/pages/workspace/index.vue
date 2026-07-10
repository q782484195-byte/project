<template>
  <pm-page-layout :tabbar="true">
    <view class="workspace-hero">
      <view class="workspace-hero__top">
        <view class="workspace-hero__brand">
          <image
            class="workspace-hero__logo"
            src="/static/icons/logo.png"
            mode="aspectFit"
          />
          <text class="workspace-hero__title">工作台</text>
        </view>
        <view class="workspace-hero__actions">
          <view class="workspace-hero__search" @click="goTasks">
            <pm-icon name="search" :size="36" />
          </view>
          <view class="workspace-bell" @click="goMessage">
            <pm-icon name="bell" :size="36" />
            <view v-if="unreadCount" class="workspace-bell__dot" />
          </view>
        </view>
      </view>

      <view class="workspace-hero__card">
        <view class="workspace-hero__decor workspace-hero__decor--1" />
        <view class="workspace-hero__decor workspace-hero__decor--2" />
        <view class="workspace-hero__card-body">
          <view class="workspace-hero__card-head">
            <text class="workspace-hero__date">{{ dateLine }}</text>
            <view class="workspace-hero__user" @click="goProfile">
              <view class="workspace-hero__avatar">
                <text>{{ avatarText }}</text>
              </view>
              <text class="workspace-hero__user-name">{{ userStore.displayName }}</text>
            </view>
          </view>
          <text class="workspace-hero__slogan">{{ heroSlogan }}</text>
          <view class="workspace-hero__chips">
            <view
              v-for="chip in heroChips"
              :key="chip.key"
              class="workspace-hero__chip"
              :class="{ 'workspace-hero__chip--warn': chip.warn }"
              @click="onStatClick(chip.key)"
            >
              <text class="workspace-hero__chip-value">{{ chip.value }}</text>
              <text class="workspace-hero__chip-label">{{ chip.label }}</text>
            </view>
          </view>
        </view>
      </view>
    </view>

    <view v-if="overdueCount" class="workspace-alert" @click="filterOverdue">
      <text class="workspace-alert__text">有 {{ overdueCount }} 个任务已逾期，请尽快处理</text>
      <text class="workspace-alert__link">查看</text>
    </view>

    <view class="tab-section workspace-quick-wrap">
      <view class="tab-section__head">
        <text class="tab-section__title">快捷操作</text>
      </view>
      <view class="tab-surface workspace-quick">
        <view
          v-for="item in quickActions"
          :key="item.key"
          class="workspace-quick__item"
          @click="onQuick(item.key)"
        >
          <view class="workspace-quick__icon" :class="`workspace-quick__icon--${item.tone}`">
            <pm-icon :name="item.icon" :size="48" />
          </view>
          <text class="workspace-quick__label">{{ item.label }}</text>
        </view>
      </view>
    </view>

    <view class="tab-section workspace-section">
      <view class="tab-section__head">
        <text class="tab-section__title">我参与的项目</text>
        <text class="tab-section__more" @click="goTasks">全部</text>
      </view>
      <view v-if="projects.length" class="project-list">
        <view
          v-for="project in projects"
          :key="project.id"
          class="project-card"
          @click="goTasks"
        >
          <view class="project-card__badge">
            <text>{{ project.name.slice(0, 1) }}</text>
          </view>
          <view class="project-card__body">
            <view class="project-card__top">
              <text class="project-card__name">{{ project.name }}</text>
              <text class="project-card__pct">{{ project.progress }}%</text>
            </view>
            <view class="project-card__track">
              <view class="project-card__fill" :style="{ width: `${project.progress}%` }" />
            </view>
            <text class="project-card__meta">
              {{ project.doingCount }} 个进行中 · 截止 {{ project.dueDate }}
            </text>
          </view>
        </view>
      </view>
      <view v-else class="workspace-empty">
        <text class="workspace-empty__text">暂无参与的项目</text>
      </view>
    </view>

    <view class="tab-section workspace-section">
      <view class="tab-section__head">
        <text class="tab-section__title">今日待办</text>
        <text class="tab-section__more" @click="goTasks">更多</text>
      </view>
      <view v-if="todayTasks.length" class="tab-surface workspace-list">
        <pm-task-row
          v-for="task in todayTasks"
          :key="task.id"
          :title="task.title"
          :tags="task.tags"
          :meta="task.meta"
          :status="task.status"
          action-text="汇报"
          @click="goDetail(task.id)"
          @action="handleReport(task.id)"
        />
      </view>
      <view v-else class="workspace-empty">
        <text class="workspace-empty__text">今日暂无待办，可以休息一下</text>
      </view>
    </view>

    <view class="tab-section workspace-section workspace-section--last">
      <view class="tab-section__head">
        <text class="tab-section__title">团队动态</text>
        <text class="tab-section__more" @click="goMessage">全部</text>
      </view>
      <view class="tab-surface feed-list">
        <view v-for="feed in feeds" :key="feed.id" class="feed-item">
          <view class="feed-item__avatar">
            <text>{{ feed.avatar }}</text>
          </view>
          <view class="feed-item__body">
            <view class="feed-item__text">
              <text class="feed-item__name">{{ feed.name }}</text>
              <text> {{ feed.text }}</text>
            </view>
            <text class="feed-item__time">{{ feed.time }}</text>
          </view>
        </view>
      </view>
    </view>
  </pm-page-layout>
</template>

<script setup lang="ts">
import { computed, ref } from "vue";
import { onPullDownRefresh, onShow } from "@dcloudio/uni-app";
import PmPageLayout from "@/components/pm-page-layout/pm-page-layout.vue";
import PmTaskRow from "@/components/pm-task-row/pm-task-row.vue";
import PmIcon from "@/components/pm-icon/pm-icon.vue";
import { selectProjects } from "@/api/project";
import { getTaskStatistics, selectMyTasks, selectPendingTasks } from "@/api/task";
import { unwrapList } from "@/utils/api";
import { mapTaskToMobile, type MobileTask } from "@/utils/task-mapper";
import { useTaskNavStore } from "@/stores/task-nav";
import { useUserStore } from "@/stores/user";

const userStore = useUserStore();
const taskNavStore = useTaskNavStore();

const stats = ref([
  { key: "overdue", label: "逾期", value: 0, warn: true },
  { key: "todo", label: "待办", value: 0 },
  { key: "doing", label: "进行中", value: 0 },
  { key: "done", label: "已完成", value: 0 }
]);

const projects = ref<
  Array<{ id: string; name: string; progress: number; doingCount: number; dueDate: string }>
>([]);
const feeds = ref<Array<{ id: string; name: string; avatar: string; text: string; time: string }>>(
  []
);
const todayTasks = ref<MobileTask[]>([]);
const overdueCount = ref(0);
const unreadCount = ref(0);

const avatarText = computed(() => userStore.displayName.slice(0, 1) || "用");

const dateLine = computed(() => {
  const now = new Date();
  const week = ["日", "一", "二", "三", "四", "五", "六"][now.getDay()];
  return `${now.getFullYear()}年${now.getMonth() + 1}月${now.getDate()}日 · 周${week}`;
});

const heroSlogan = computed(() => {
  if (overdueCount.value > 0) {
    return `有 ${overdueCount.value} 项任务已逾期，建议优先处理`;
  }
  const todo = Number(stats.value.find((item) => item.key === "todo")?.value ?? 0);
  const doing = Number(stats.value.find((item) => item.key === "doing")?.value ?? 0);
  if (todo <= 0 && doing <= 0) return "今日任务已清空，状态不错";
  if (doing > 0) return `${doing} 项任务进行中，保持推进节奏`;
  return `${todo} 项待办等待处理，从最重要的一件开始`;
});

const heroChips = computed(() =>
  stats.value.map((item) => ({
    key: item.key,
    label: item.label,
    value: item.value,
    warn: item.warn
  }))
);

const quickActions = [
  { key: "create", label: "新建任务", icon: "plus", tone: "primary" },
  { key: "report", label: "进度汇报", icon: "report", tone: "success" },
  { key: "bug", label: "记录 BUG", icon: "bug", tone: "warn" },
  { key: "daily", label: "写日报", icon: "daily", tone: "info" }
];

function goDetail(id: string) {
  uni.navigateTo({ url: `/pages/tasks/detail?id=${id}` });
}

function goTasks() {
  uni.switchTab({ url: "/pages/tasks/index" });
}

function goMessage() {
  uni.switchTab({ url: "/pages/message/index" });
}

function goProfile() {
  uni.switchTab({ url: "/pages/profile/index" });
}

function handleReport(id: string) {
  uni.navigateTo({ url: `/pages/tasks/report?id=${id}` });
}

function onQuick(key: string) {
  if (key === "create") {
    uni.navigateTo({ url: "/pages/tasks/create" });
    return;
  }
  if (key === "report") {
    if (todayTasks.value.length === 1) {
      handleReport(todayTasks.value[0].id);
      return;
    }
    goTasks();
    return;
  }
  if (key === "bug") {
    if (todayTasks.value.length === 1) {
      uni.navigateTo({ url: `/pages/tasks/bug?id=${todayTasks.value[0].id}` });
      return;
    }
    goTasks();
    return;
  }
  if (key === "daily") {
    uni.navigateTo({ url: "/pages/report/daily" });
    return;
  }
}

function formatProjectDueDate(value?: string) {
  if (!value) return "-";
  const text = String(value).trim();
  return text.length >= 10 ? text.slice(5, 10) : text;
}

function mapDynamicFeeds(
  dynamicList: Array<{ task_name?: string; history?: string }> = []
) {
  return dynamicList.slice(0, 5).map((item, index) => {
    const history = item.history || "";
    const time = history.slice(0, 19);
    const content = history.length > 19 ? history.slice(19).trim() : history;
    const text = item.task_name ? `「${item.task_name}」${content}` : content;
    return {
      id: `feed-${index}`,
      name: "系统",
      avatar: "动",
      text: text || "任务动态更新",
      time: time || "-"
    };
  });
}

async function loadWorkspace() {
  try {
    // 各接口独立容错，避免一个失败导致整页空白
    const [statisticsRes, tasksRes, pendingRes, projectsRes] = await Promise.all([
      getTaskStatistics().catch(() => null),
      selectMyTasks({ page: 1, page_size: 20 }),
      selectPendingTasks({ page: 1, page_size: 10 }).catch(() => null),
      selectProjects({ page: 1, page_size: 6 }).catch(() => null)
    ]);

    const taskList = unwrapList(tasksRes).map(mapTaskToMobile);
    todayTasks.value = taskList.slice(0, 3);
    overdueCount.value = taskList.filter((item) => item.overdue).length;

    const pendingList = pendingRes ? unwrapList(pendingRes) : [];
    unreadCount.value = pendingList.length;

    const doingCount = taskList.filter((item) =>
      ["任务进行中", "进行中", "待测试", "测试中"].includes(item.status)
    ).length;
    const todoCount =
      statisticsRes?.未完成任务 ??
      taskList.filter((item) =>
        ["待办", "任务未开始", "逾期"].includes(item.status)
      ).length;

    stats.value = [
      { key: "overdue", label: "逾期", value: overdueCount.value, warn: true },
      { key: "todo", label: "待办", value: todoCount },
      { key: "doing", label: "进行中", value: doingCount },
      {
        key: "done",
        label: "已完成",
        value:
          statisticsRes?.已完成任务 ??
          taskList.filter((item) => item.status === "已完成").length
      }
    ];

    projects.value = projectsRes
      ? unwrapList(projectsRes).map((item) => ({
          id: item._id,
          name: item.project_name,
          progress:
            item.state === "已完成" ? 100 : item.state === "进行中" ? 60 : 20,
          doingCount: item.state === "进行中" ? 1 : 0,
          dueDate: formatProjectDueDate(item.plant_end_time)
        }))
      : [];

    if (pendingRes && Array.isArray(pendingRes.dynamic) && pendingRes.dynamic.length) {
      feeds.value = mapDynamicFeeds(pendingRes.dynamic);
    } else {
      feeds.value = taskList.slice(0, 3).map((task, index) => ({
        id: `task-feed-${index}`,
        name: task.assignee === "-" ? "系统" : task.assignee,
        avatar: (task.assignee === "-" ? "任" : task.assignee).slice(0, 1),
        text: `任务「${task.title}」状态为 ${task.status}`,
        time: task.dueDate
      }));
    }
  } catch (error) {
    uni.showToast({
      title: error instanceof Error ? error.message : "加载工作台失败",
      icon: "none"
    });
  } finally {
    uni.stopPullDownRefresh();
  }
}

onShow(() => {
  if (!userStore.isLoggedIn) {
    uni.reLaunch({ url: "/pages/login/index" });
    return;
  }
  loadWorkspace();
});

onPullDownRefresh(() => {
  loadWorkspace();
});

function onStatClick(key: string) {
  const filterMap: Record<
    string,
    { segment: "todo" | "doing" | "done"; overdueOnly?: boolean }
  > = {
    overdue: { segment: "todo", overdueOnly: true },
    todo: { segment: "todo" },
    doing: { segment: "doing" },
    done: { segment: "done" }
  };
  const filter = filterMap[key];
  if (filter) {
    taskNavStore.navigateToTasks(filter);
  }
}

function filterOverdue() {
  taskNavStore.navigateToTasks({ segment: "todo", overdueOnly: true });
}
</script>

<style lang="scss" scoped>
@import "@/styles/tokens.scss";
@import "@/styles/mixins.scss";
@import "@/styles/tab-page.scss";

.workspace-hero {
  padding: calc(var(--status-bar-height, 44px) + 32rpx) $pm-space-lg $pm-space-md;
  background: linear-gradient(180deg, #dbeafe 0%, #eff6ff 48%, $pm-bg-page 100%);
}

.workspace-hero__top {
  @include pm-flex-between;
  align-items: center;
  margin-bottom: 28rpx;
}

.workspace-hero__brand {
  display: flex;
  align-items: center;
  gap: 12rpx;
}

.workspace-hero__logo {
  width: 48rpx;
  height: 48rpx;
  border-radius: 12rpx;
}

.workspace-hero__title {
  font-size: $pm-font-title;
  font-weight: $pm-weight-semibold;
  color: $pm-text-primary;
  letter-spacing: 1rpx;
}

.workspace-hero__actions {
  display: flex;
  align-items: center;
  gap: 12rpx;
}

.workspace-hero__search,
.workspace-bell {
  position: relative;
  width: 68rpx;
  height: 68rpx;
  border-radius: 20rpx;
  background: rgba(255, 255, 255, 0.85);
  border: 1rpx solid rgba(37, 99, 235, 0.08);
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  color: $pm-text-secondary;
}

.workspace-bell__dot {
  position: absolute;
  top: 12rpx;
  right: 12rpx;
  width: 12rpx;
  height: 12rpx;
  border-radius: 50%;
  background: $pm-danger;
  border: 2rpx solid #fff;
}

.workspace-hero__card {
  position: relative;
  overflow: hidden;
  border-radius: 28rpx;
  background: linear-gradient(135deg, $pm-primary 0%, $pm-primary-dark 100%);
  box-shadow: 0 16rpx 40rpx rgba(37, 99, 235, 0.22);
}

.workspace-hero__decor {
  position: absolute;
  border-radius: 50%;
  background: rgba(255, 255, 255, 0.08);
  pointer-events: none;
}

.workspace-hero__decor--1 {
  width: 200rpx;
  height: 200rpx;
  top: -60rpx;
  right: -40rpx;
}

.workspace-hero__decor--2 {
  width: 120rpx;
  height: 120rpx;
  bottom: -30rpx;
  left: 40rpx;
}

.workspace-hero__card-body {
  position: relative;
  z-index: 1;
  padding: 28rpx 28rpx 24rpx;
}

.workspace-hero__card-head {
  @include pm-flex-between;
  align-items: center;
  gap: $pm-space-md;
  margin-bottom: 20rpx;
}

.workspace-hero__date {
  font-size: $pm-font-mini;
  color: rgba(255, 255, 255, 0.82);
  letter-spacing: 0.5rpx;
}

.workspace-hero__user {
  display: flex;
  align-items: center;
  gap: 10rpx;
  max-width: 45%;
  padding: 6rpx 14rpx 6rpx 6rpx;
  border-radius: $pm-radius-full;
  background: rgba(255, 255, 255, 0.14);
}

.workspace-hero__avatar {
  width: 44rpx;
  height: 44rpx;
  border-radius: 50%;
  background: rgba(255, 255, 255, 0.92);
  color: $pm-primary;
  font-size: 22rpx;
  font-weight: $pm-weight-semibold;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.workspace-hero__user-name {
  font-size: 22rpx;
  color: rgba(255, 255, 255, 0.95);
  @include pm-ellipsis;
}

.workspace-hero__slogan {
  display: block;
  font-size: $pm-font-body;
  font-weight: $pm-weight-medium;
  color: #fff;
  line-height: 1.5;
  margin-bottom: 24rpx;
}

.workspace-hero__chips {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 12rpx;
}

.workspace-hero__chip {
  padding: 16rpx 8rpx;
  border-radius: 16rpx;
  background: rgba(255, 255, 255, 0.14);
  text-align: center;

  &:active {
    background: rgba(255, 255, 255, 0.22);
  }
}

.workspace-hero__chip--warn .workspace-hero__chip-value {
  color: #fecaca;
}

.workspace-hero__chip-value {
  display: block;
  font-size: 30rpx;
  font-weight: $pm-weight-semibold;
  color: #fff;
  line-height: 1.2;
}

.workspace-hero__chip-label {
  display: block;
  margin-top: 4rpx;
  font-size: 20rpx;
  color: rgba(255, 255, 255, 0.75);
}

.workspace-alert {
  margin: $pm-space-md $pm-space-lg 0;
  padding: 20rpx 24rpx;
  border-radius: 20rpx;
  background: $pm-warning-light;
  @include pm-flex-between;
  gap: $pm-space-sm;
}

.workspace-alert__text {
  flex: 1;
  font-size: $pm-font-caption;
  color: $pm-warning;
  line-height: 1.4;
}

.workspace-alert__link {
  flex-shrink: 0;
  font-size: $pm-font-caption;
  font-weight: $pm-weight-semibold;
  color: $pm-warning;
}

.workspace-quick-wrap {
  margin-top: $pm-space-md;
}

.workspace-quick {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: $pm-space-sm;
  padding: 28rpx 20rpx;
}

.workspace-quick__item {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 12rpx;

  &:active {
    opacity: 0.75;
  }
}

.workspace-quick__icon {
  width: 88rpx;
  height: 88rpx;
  border-radius: 24rpx;
  display: flex;
  align-items: center;
  justify-content: center;
}

.workspace-quick__icon--primary {
  background: $pm-primary-light;
  color: $pm-primary;
}

.workspace-quick__icon--warn {
  background: $pm-warning-light;
  color: $pm-warning;
}

.workspace-quick__icon--success {
  background: $pm-success-light;
  color: $pm-success;
}

.workspace-quick__icon--mute {
  background: $pm-info-light;
  color: $pm-info;
}

.workspace-quick__label {
  font-size: $pm-font-mini;
  color: $pm-text-secondary;
}

.workspace-empty {
  margin: 0 $pm-space-lg;
  padding: 40rpx 24rpx;
  background: $pm-bg-card;
  border: 1rpx dashed $pm-border;
  border-radius: $pm-radius-xl;
  text-align: center;
}

.workspace-empty__text {
  font-size: $pm-font-caption;
  color: $pm-text-placeholder;
}

.workspace-quick__icon--info {
  background: $pm-info-light;
  color: $pm-info;
}

.workspace-section {
  margin-top: 0;
}

.workspace-section--last {
  margin-bottom: $pm-space-lg;
}

.workspace-list,
.feed-list {
  overflow: hidden;
}

.project-list {
  padding: 0 $pm-space-lg;
}

.project-card {
  display: flex;
  align-items: flex-start;
  gap: 20rpx;
  margin-bottom: $pm-space-sm;
  padding: 24rpx 28rpx;
  background: $pm-bg-card;
  border: 1rpx solid $pm-border;
  border-radius: $pm-radius-xl;
  box-shadow: 0 4rpx 16rpx rgba(15, 23, 42, 0.04);

  &:active {
    background: $pm-bg-hover;
  }
}

.project-card__badge {
  width: 64rpx;
  height: 64rpx;
  border-radius: 16rpx;
  background: linear-gradient(135deg, $pm-primary 0%, $pm-primary-dark 100%);
  color: #fff;
  font-size: 28rpx;
  font-weight: $pm-weight-semibold;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.project-card__body {
  flex: 1;
  min-width: 0;
}

.project-card__top {
  @include pm-flex-between;
  margin-bottom: 16rpx;
  gap: $pm-space-sm;
}

.project-card__name {
  font-size: 28rpx;
  font-weight: $pm-weight-semibold;
  color: $pm-text-primary;
}

.project-card__pct {
  font-size: $pm-font-caption;
  font-weight: $pm-weight-semibold;
  color: $pm-primary;
}

.project-card__track {
  height: 12rpx;
  border-radius: 6rpx;
  background: $pm-bg-muted;
  overflow: hidden;
}

.project-card__fill {
  height: 100%;
  background: $pm-primary;
  border-radius: 6rpx;
}

.project-card__meta {
  display: block;
  margin-top: 16rpx;
  font-size: $pm-font-mini;
  color: $pm-text-placeholder;
}

.feed-item {
  display: flex;
  gap: 20rpx;
  padding: 24rpx $pm-space-lg;
  border-bottom: 1rpx solid $pm-border;

  &:last-child {
    border-bottom: none;
  }
}

.feed-item__avatar {
  width: 64rpx;
  height: 64rpx;
  border-radius: 50%;
  background: $pm-primary-light;
  color: $pm-primary;
  font-size: $pm-font-caption;
  font-weight: $pm-weight-semibold;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.feed-item__body {
  flex: 1;
  min-width: 0;
}

.feed-item__text {
  font-size: $pm-font-caption;
  color: $pm-text-primary;
  line-height: 1.45;
}

.feed-item__name {
  font-weight: $pm-weight-semibold;
  color: $pm-text-primary;
}

.feed-item__time {
  display: block;
  margin-top: 8rpx;
  font-size: $pm-font-mini;
  color: $pm-text-placeholder;
}
</style>
