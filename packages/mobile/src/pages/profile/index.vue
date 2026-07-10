<template>
  <view class="tab-page profile-page">
    <view class="profile-hero">
      <view class="profile-hero__safe" />
      <view class="profile-hero__decor profile-hero__decor--1" />
      <view class="profile-hero__decor profile-hero__decor--2" />
      <view class="profile-hero__body">
        <view class="profile-hero__user">
          <view class="profile-hero__avatar">
            <text>{{ avatarText }}</text>
          </view>
          <view class="profile-hero__info">
            <text class="profile-hero__name">{{ userStore.displayName }}</text>
            <text class="profile-hero__account">
              {{ userStore.user?.username || "未登录" }}
            </text>
            <view v-if="roleLabel" class="profile-hero__badge">{{ roleLabel }}</view>
          </view>
        </view>
      </view>
    </view>

    <view class="profile-stats tab-surface">
      <view
        v-for="item in weekStats"
        :key="item.key"
        class="profile-stats__item"
        @click="goTasksWithFilter(item.key)"
      >
        <text class="profile-stats__value">{{ item.value }}</text>
        <text class="profile-stats__label">{{ item.label }}</text>
      </view>
    </view>

    <view class="tab-section">
      <view class="tab-section__head">
        <text class="tab-section__title">账号与安全</text>
      </view>
      <view class="tab-surface profile-menu">
        <view class="profile-menu__item" @click="toggleNotify">
          <view class="profile-menu__left">
            <view class="profile-menu__icon profile-menu__icon--blue">铃</view>
            <text>消息通知</text>
          </view>
          <view class="profile-switch" :class="{ 'is-off': !notifyOn }" />
        </view>
        <view class="profile-menu__item" @click="toggleOverdue">
          <view class="profile-menu__left">
            <view class="profile-menu__icon profile-menu__icon--warn">逾</view>
            <text>任务逾期提醒</text>
          </view>
          <view class="profile-switch" :class="{ 'is-off': !overdueOn }" />
        </view>
        <view class="profile-menu__item" @click="onPassword">
          <view class="profile-menu__left">
            <view class="profile-menu__icon profile-menu__icon--green">密</view>
            <text>修改密码</text>
          </view>
          <text class="profile-menu__arrow">›</text>
        </view>
        <view class="profile-menu__item" @click="onClearCache">
          <view class="profile-menu__left">
            <view class="profile-menu__icon profile-menu__icon--mute">缓</view>
            <text>清除缓存</text>
          </view>
          <view class="profile-menu__right">
            <text class="profile-menu__meta">{{ cacheSize }}</text>
            <text class="profile-menu__arrow">›</text>
          </view>
        </view>
      </view>
    </view>

    <view class="tab-section">
      <view class="tab-section__head">
        <text class="tab-section__title">更多</text>
      </view>
      <view class="tab-surface profile-menu">
        <view class="profile-menu__item" @click="onAbout">
          <view class="profile-menu__left">
            <view class="profile-menu__icon profile-menu__icon--blue">关</view>
            <text>关于系统</text>
          </view>
          <view class="profile-menu__right">
            <text class="profile-menu__meta">v1.0.0</text>
            <text class="profile-menu__arrow">›</text>
          </view>
        </view>
        <view class="profile-menu__item" @click="onFeedback">
          <view class="profile-menu__left">
            <view class="profile-menu__icon profile-menu__icon--warn">馈</view>
            <text>意见反馈</text>
          </view>
          <text class="profile-menu__arrow">›</text>
        </view>
      </view>
    </view>

    <view class="profile-logout" @click="handleLogout">退出登录</view>
  </view>
</template>

<script setup lang="ts">
import { computed, ref } from "vue";
import { onShow } from "@dcloudio/uni-app";
import { getTaskStatistics, selectMyTasks } from "@/api/task";
import { unwrapList } from "@/utils/api";
import { mapTaskToMobile } from "@/utils/task-mapper";
import type { TaskListSegment } from "@/utils/task-filter";
import { useTaskNavStore } from "@/stores/task-nav";
import { useUserStore } from "@/stores/user";

const userStore = useUserStore();
const taskNavStore = useTaskNavStore();
const avatarText = computed(() => userStore.displayName.slice(0, 1) || "用");
const notifyOn = ref(true);
const overdueOn = ref(true);
const cacheSize = ref("-");

const roleLabel = computed(() => {
  const roles = userStore.user?.roles || [];
  if (roles.includes("ProjectManager")) return "项目负责人";
  if (roles.includes("DepartmentManager")) return "部门负责人";
  if (roles.includes("Member")) return "团队成员";
  return "";
});

const weekStats = ref([
  { key: "todo" as TaskListSegment, label: "待办", value: 0 },
  { key: "doing" as TaskListSegment, label: "进行中", value: 0 },
  { key: "done" as TaskListSegment, label: "已完成", value: 0 }
]);

async function loadProfileStats() {
  try {
    const [statisticsRes, tasksRes] = await Promise.all([
      getTaskStatistics().catch(() => null),
      selectMyTasks({ page: 1, page_size: 100 }).catch(() => null)
    ]);
    const taskList = tasksRes ? unwrapList(tasksRes).map(mapTaskToMobile) : [];
    const doing = taskList.filter((item) =>
      ["任务进行中", "进行中", "待测试", "测试中"].includes(item.status)
    ).length;
    weekStats.value = [
      {
        key: "todo",
        label: "待办",
        value: statisticsRes?.未完成任务 ?? taskList.length
      },
      { key: "doing", label: "进行中", value: doing },
      {
        key: "done",
        label: "已完成",
        value:
          statisticsRes?.已完成任务 ??
          taskList.filter((item) => item.status === "已完成").length
      }
    ];
  } catch {
    // 个人页统计失败时保持默认 0
  }
}

onShow(() => {
  if (!userStore.isLoggedIn) {
    uni.reLaunch({ url: "/pages/login/index" });
    return;
  }
  loadProfileStats();
});

function goTasksWithFilter(segment: TaskListSegment) {
  taskNavStore.navigateToTasks({ segment });
}

function toggleNotify() {
  notifyOn.value = !notifyOn.value;
}

function toggleOverdue() {
  overdueOn.value = !overdueOn.value;
}

function onPassword() {
  uni.navigateTo({ url: "/pages/profile/password" });
}

function onClearCache() {
  cacheSize.value = "0 KB";
  uni.showToast({ title: "缓存已清除", icon: "success" });
}

function onAbout() {
  uni.showToast({ title: "项目管理系统 v1.0.0", icon: "none" });
}

function onFeedback() {
  uni.showToast({ title: "请联系管理员反馈问题", icon: "none" });
}

function handleLogout() {
  uni.showModal({
    title: "退出登录",
    content: "确定退出当前账号？",
    success: (res) => {
      if (res.confirm) userStore.logout();
    }
  });
}
</script>

<style lang="scss" scoped>
@import "@/styles/tokens.scss";
@import "@/styles/mixins.scss";
@import "@/styles/tab-page.scss";

.profile-hero {
  position: relative;
  overflow: hidden;
  background: linear-gradient(135deg, $pm-primary 0%, $pm-primary-dark 100%);
  padding-bottom: 56rpx;
}

.profile-hero__safe {
  height: var(--status-bar-height, 44px);
}

.profile-hero__decor {
  position: absolute;
  border-radius: 50%;
  background: rgba(255, 255, 255, 0.08);
  pointer-events: none;
}

.profile-hero__decor--1 {
  width: 240rpx;
  height: 240rpx;
  top: -80rpx;
  right: -60rpx;
}

.profile-hero__decor--2 {
  width: 140rpx;
  height: 140rpx;
  bottom: 20rpx;
  left: -40rpx;
}

.profile-hero__body {
  position: relative;
  z-index: 1;
  padding: 16rpx $pm-space-lg 0;
}

.profile-hero__user {
  display: flex;
  align-items: center;
  gap: 28rpx;
}

.profile-hero__avatar {
  width: 120rpx;
  height: 120rpx;
  border-radius: 50%;
  background: rgba(255, 255, 255, 0.95);
  color: $pm-primary;
  font-size: 48rpx;
  font-weight: $pm-weight-semibold;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  border: 4rpx solid rgba(255, 255, 255, 0.35);
  box-shadow: 0 8rpx 24rpx rgba(15, 23, 42, 0.12);
}

.profile-hero__name {
  display: block;
  font-size: 40rpx;
  font-weight: $pm-weight-semibold;
  color: #fff;
  line-height: 1.3;
}

.profile-hero__account {
  display: block;
  margin-top: 8rpx;
  font-size: $pm-font-caption;
  color: rgba(255, 255, 255, 0.78);
}

.profile-hero__badge {
  display: inline-block;
  margin-top: 14rpx;
  padding: 6rpx 18rpx;
  border-radius: $pm-radius-full;
  background: rgba(255, 255, 255, 0.18);
  color: rgba(255, 255, 255, 0.95);
  font-size: 22rpx;
}

.profile-stats {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  margin: -36rpx $pm-space-lg 0;
  position: relative;
  z-index: 2;
  padding: 28rpx 12rpx;
}

.profile-stats__item {
  text-align: center;

  &:active {
    opacity: 0.75;
  }
}

.profile-stats__value {
  display: block;
  font-size: 40rpx;
  font-weight: $pm-weight-semibold;
  color: $pm-text-primary;
}

.profile-stats__label {
  display: block;
  margin-top: 6rpx;
  font-size: $pm-font-mini;
  color: $pm-text-placeholder;
}

.profile-menu__item {
  @include pm-flex-between;
  padding: 28rpx $pm-space-lg;
  font-size: $pm-font-body;
  color: $pm-text-primary;
  border-bottom: 1rpx solid $pm-border;

  &:last-child {
    border-bottom: none;
  }

  &:active {
    background: $pm-bg-hover;
  }
}

.profile-menu__left {
  display: flex;
  align-items: center;
  gap: 20rpx;
}

.profile-menu__icon {
  width: 56rpx;
  height: 56rpx;
  border-radius: 16rpx;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 24rpx;
  font-weight: $pm-weight-semibold;
  flex-shrink: 0;
}

.profile-menu__icon--blue {
  background: $pm-primary-light;
  color: $pm-primary;
}

.profile-menu__icon--warn {
  background: $pm-warning-light;
  color: $pm-warning;
}

.profile-menu__icon--green {
  background: $pm-success-light;
  color: $pm-success;
}

.profile-menu__icon--mute {
  background: $pm-bg-muted;
  color: $pm-text-secondary;
}

.profile-menu__right {
  display: flex;
  align-items: center;
  gap: 8rpx;
}

.profile-menu__meta {
  font-size: $pm-font-caption;
  color: $pm-text-placeholder;
}

.profile-menu__arrow {
  color: $pm-text-placeholder;
  font-size: $pm-font-title;
}

.profile-switch {
  width: 84rpx;
  height: 48rpx;
  border-radius: 24rpx;
  background: $pm-primary;
  position: relative;
  flex-shrink: 0;

  &::after {
    content: "";
    position: absolute;
    top: 4rpx;
    right: 4rpx;
    width: 40rpx;
    height: 40rpx;
    border-radius: 50%;
    background: #fff;
    transition: all 0.2s ease;
  }

  &.is-off {
    background: #cbd5e1;

    &::after {
      right: auto;
      left: 4rpx;
    }
  }
}

.profile-logout {
  margin: $pm-space-xl $pm-space-lg $pm-space-lg;
  height: 92rpx;
  line-height: 92rpx;
  text-align: center;
  border-radius: $pm-radius-xl;
  color: $pm-danger;
  background: $pm-bg-card;
  border: 1rpx solid $pm-danger-light;
  font-size: $pm-font-body;
  font-weight: $pm-weight-medium;
  box-shadow: 0 6rpx 20rpx rgba(15, 23, 42, 0.04);

  &:active {
    background: $pm-danger-light;
  }
}
</style>
