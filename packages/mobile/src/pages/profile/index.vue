<template>
  <view class="tab-page profile-page">
    <pm-tab-header title="我的">
      <template #bottom>
        <view class="profile-card__user">
          <view class="profile-card__avatar">
            <text>{{ avatarText }}</text>
          </view>
          <view class="profile-card__info">
            <text class="profile-card__name">{{ userStore.displayName }}</text>
            <text v-if="profileSubline" class="profile-card__subline">{{ profileSubline }}</text>
          </view>
        </view>
        <view class="tab-stat-row profile-card__stats">
          <view
            v-for="item in weekStats"
            :key="item.key"
            class="tab-stat-card tab-stat-card--hero"
            @click="goTasksWithFilter(item.key)"
          >
            <text class="tab-stat-card__value">{{ item.value }}</text>
            <text class="tab-stat-card__label">{{ item.label }}</text>
          </view>
        </view>
      </template>
    </pm-tab-header>

    <view class="tab-section profile-section">
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
import PmTabHeader from "@/components/pm-tab-header/pm-tab-header.vue";
import { loadMyTasksForStats } from "@/utils/task-loader";
import { summarizeTaskSegments } from "@/utils/task-segments";
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

const profileSubline = computed(() => {
  const account = userStore.user?.username || "";
  const name = userStore.displayName;
  if (account && account !== name) return account;
  return roleLabel.value || "";
});

const weekStats = ref([
  { key: "todo" as TaskListSegment, label: "待办", value: 0 },
  { key: "doing" as TaskListSegment, label: "进行中", value: 0 },
  { key: "done" as TaskListSegment, label: "已完成", value: 0 }
]);

async function loadProfileStats() {
  try {
    const taskList = await loadMyTasksForStats();
    const summary = summarizeTaskSegments(taskList);
    weekStats.value = [
      { key: "todo", label: "待办", value: summary.todo },
      { key: "doing", label: "进行中", value: summary.doing },
      { key: "done", label: "已完成", value: summary.done }
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

.profile-section {
  margin-top: $pm-space-lg;
}

.profile-card__user {
  display: flex;
  align-items: center;
  gap: 24rpx;
  margin-bottom: 24rpx;
}

.profile-card__avatar {
  width: 104rpx;
  height: 104rpx;
  border-radius: 50%;
  background: rgba(255, 255, 255, 0.95);
  color: $pm-primary;
  font-size: 44rpx;
  font-weight: $pm-weight-semibold;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  border: 4rpx solid rgba(255, 255, 255, 0.35);
  box-shadow: 0 8rpx 24rpx rgba(15, 23, 42, 0.12);
}

.profile-card__info {
  flex: 1;
  min-width: 0;
}

.profile-card__name {
  display: block;
  font-size: 36rpx;
  font-weight: $pm-weight-semibold;
  color: #fff;
  line-height: 1.3;
  @include pm-ellipsis;
}

.profile-card__subline {
  display: block;
  margin-top: 10rpx;
  font-size: $pm-font-caption;
  color: rgba(255, 255, 255, 0.78);
  @include pm-ellipsis;
}

.profile-card__stats {
  margin-top: 4rpx;
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
