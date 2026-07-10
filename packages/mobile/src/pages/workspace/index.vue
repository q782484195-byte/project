<template>
  <pm-page-layout :title="greeting" :subtitle="dateLine" :tabbar="true">
    <template #extra>
      <view class="workspace-bell" @click="goMessage">
        <pm-icon name="bell" :size="56" />
        <view v-if="unreadCount" class="workspace-bell__dot" />
      </view>
    </template>

    <view v-if="overdueCount" class="workspace-alert" @click="filterOverdue">
      <text class="workspace-alert__text">有 {{ overdueCount }} 个任务已逾期，请尽快处理</text>
      <text class="workspace-alert__link">查看</text>
    </view>

    <pm-stat-bar :items="stats" @click="onStatClick" />

    <view class="workspace-quick">
      <view
        v-for="item in quickActions"
        :key="item.key"
        class="workspace-quick__item"
        @click="onQuick(item.key)"
      >
        <pm-icon :name="item.icon" :size="88" />
        <text class="workspace-quick__label">{{ item.label }}</text>
      </view>
    </view>

    <view class="workspace-section">
      <view class="pm-section-head">
        <text class="pm-section-title">我参与的项目</text>
        <text class="pm-section-more" @click="goTasks">全部</text>
      </view>
      <view
        v-for="project in projects"
        :key="project.id"
        class="project-card"
        @click="goTasks"
      >
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

    <view class="workspace-section">
      <view class="pm-section-head">
        <text class="pm-section-title">今日待办</text>
        <text class="pm-section-more" @click="goTasks">更多</text>
      </view>
      <view class="workspace-list">
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
    </view>

    <view class="workspace-section workspace-section--last">
      <view class="pm-section-head">
        <text class="pm-section-title">团队动态</text>
        <text class="pm-section-more" @click="goMessage">全部</text>
      </view>
      <view class="feed-list">
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
import PmStatBar from "@/components/pm-stat-bar/pm-stat-bar.vue";
import PmTaskRow from "@/components/pm-task-row/pm-task-row.vue";
import PmIcon from "@/components/pm-icon/pm-icon.vue";
import { selectProjects } from "@/api/project";
import { getTaskStatistics, selectMyTasks, selectPendingTasks } from "@/api/task";
import { unwrapList } from "@/utils/api";
import { mapTaskToMobile, type MobileTask } from "@/utils/task-mapper";
import { useUserStore } from "@/stores/user";

const userStore = useUserStore();

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

const greeting = computed(() => `你好，${userStore.displayName}`);
const dateLine = computed(() => {
  const now = new Date();
  const week = ["日", "一", "二", "三", "四", "五", "六"][now.getDay()];
  return `${now.getMonth() + 1}月${now.getDate()}日 周${week}`;
});

const quickActions = [
  { key: "report", label: "进度汇报", icon: "report" },
  { key: "bug", label: "记录 BUG", icon: "bug" },
  { key: "daily", label: "写日报", icon: "daily" },
  { key: "scan", label: "扫码加入", icon: "scan" }
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

function handleReport(id: string) {
  uni.showToast({ title: `汇报任务 ${id}`, icon: "none" });
}

function onQuick(key: string) {
  const map: Record<string, string> = {
    report: "进度汇报",
    bug: "记录 BUG",
    daily: "写日报",
    scan: "扫码加入"
  };
  uni.showToast({ title: map[key], icon: "none" });
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
  uni.showToast({ title: `筛选：${key}`, icon: "none" });
}

function filterOverdue() {
  uni.switchTab({ url: "/pages/tasks/index" });
}
</script>

<style lang="scss" scoped>
@import "@/styles/tokens.scss";
@import "@/styles/mixins.scss";

.workspace-bell {
  position: relative;
  width: 72rpx;
  height: 72rpx;
  display: flex;
  align-items: center;
  justify-content: center;
}

.workspace-bell__dot {
  position: absolute;
  top: 12rpx;
  right: 12rpx;
  width: 12rpx;
  height: 12rpx;
  border-radius: 50%;
  background: $pm-danger;
}

.workspace-alert {
  margin: $pm-space-md $pm-space-lg;
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

.workspace-quick {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: $pm-space-sm;
  padding: $pm-space-lg;
  background: $pm-bg-card;
  border-bottom: 1rpx solid $pm-border;
}

.workspace-quick__item {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 12rpx;
}

.workspace-quick__label {
  font-size: $pm-font-mini;
  color: $pm-text-secondary;
}

.workspace-section {
  margin-top: $pm-space-lg;
}

.workspace-section--last {
  margin-bottom: $pm-space-lg;
}

.workspace-list {
  background: $pm-bg-card;
  border-top: 1rpx solid $pm-border;
}

.project-card {
  margin: 0 $pm-space-lg $pm-space-sm;
  padding: 24rpx 28rpx;
  background: $pm-bg-card;
  border: 1rpx solid $pm-border;
  border-radius: $pm-radius-xl;
}

.project-card__top {
  @include pm-flex-between;
  margin-bottom: 16rpx;
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

.feed-list {
  background: $pm-bg-card;
  border-top: 1rpx solid $pm-border;
}

.feed-item {
  display: flex;
  gap: 20rpx;
  padding: 24rpx $pm-space-lg;
  border-bottom: 1rpx solid $pm-border;
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
