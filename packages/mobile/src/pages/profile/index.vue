<template>
  <pm-page-layout :tabbar="true">
    <template #header>
      <view class="profile-head">
        <view class="profile-head__avatar">
          <text>{{ avatarText }}</text>
        </view>
        <view class="profile-head__info">
          <text class="profile-head__name">{{ userStore.displayName }}</text>
          <text class="profile-head__account">
            {{ userStore.user?.username || "未登录" }}
          </text>
        </view>
      </view>
    </template>

    <view class="profile-stats">
      <view v-for="item in weekStats" :key="item.label" class="profile-stats__item">
        <text class="profile-stats__value">{{ item.value }}</text>
        <text class="profile-stats__label">{{ item.label }}</text>
      </view>
    </view>

    <view class="profile-menu">
      <view class="profile-menu__item" @click="toggleNotify">
        <text>消息通知</text>
        <view class="profile-switch" :class="{ 'is-off': !notifyOn }" />
      </view>
      <view class="profile-menu__item" @click="toggleOverdue">
        <text>任务逾期提醒</text>
        <view class="profile-switch" :class="{ 'is-off': !overdueOn }" />
      </view>
      <view class="profile-menu__item" @click="onPassword">
        <text>修改密码</text>
        <text class="profile-menu__arrow">›</text>
      </view>
      <view class="profile-menu__item" @click="onClearCache">
        <text>清除缓存</text>
        <view class="profile-menu__right">
          <text class="profile-menu__meta">{{ cacheSize }}</text>
          <text class="profile-menu__arrow">›</text>
        </view>
      </view>
    </view>

    <view class="profile-menu">
      <view class="profile-menu__item" @click="onAbout">
        <text>关于系统</text>
        <view class="profile-menu__right">
          <text class="profile-menu__meta">v1.0.0</text>
          <text class="profile-menu__arrow">›</text>
        </view>
      </view>
      <view class="profile-menu__item" @click="onFeedback">
        <text>意见反馈</text>
        <text class="profile-menu__arrow">›</text>
      </view>
    </view>

    <view class="profile-logout" @click="handleLogout">退出登录</view>
  </pm-page-layout>
</template>

<script setup lang="ts">
import { computed, ref } from "vue";
import { onShow } from "@dcloudio/uni-app";
import PmPageLayout from "@/components/pm-page-layout/pm-page-layout.vue";
import { getTaskStatistics, selectMyTasks } from "@/api/task";
import { unwrapList } from "@/utils/api";
import { mapTaskToMobile } from "@/utils/task-mapper";
import { useUserStore } from "@/stores/user";

const userStore = useUserStore();
const avatarText = computed(() => userStore.displayName.slice(0, 1) || "用");
const notifyOn = ref(true);
const overdueOn = ref(true);
const cacheSize = ref("-");

const weekStats = ref([
  { label: "待办", value: 0 },
  { label: "进行中", value: 0 },
  { label: "已完成", value: 0 }
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
        label: "待办",
        value: statisticsRes?.未完成任务 ?? taskList.length
      },
      { label: "进行中", value: doing },
      {
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

function toggleNotify() {
  notifyOn.value = !notifyOn.value;
}

function toggleOverdue() {
  overdueOn.value = !overdueOn.value;
}

function onPassword() {
  uni.showToast({ title: "请在 PC 端修改密码", icon: "none" });
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

.profile-head {
  display: flex;
  align-items: center;
  gap: 28rpx;
  padding: 16rpx 0 8rpx;
}

.profile-head__avatar {
  width: 112rpx;
  height: 112rpx;
  border-radius: 50%;
  background: $pm-primary-light;
  color: $pm-primary;
  font-size: 44rpx;
  font-weight: $pm-weight-semibold;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  line-height: 1;
}

.profile-head__name {
  display: block;
  font-size: 36rpx;
  font-weight: $pm-weight-semibold;
  color: $pm-text-primary;
}

.profile-head__account {
  display: block;
  margin-top: 8rpx;
  font-size: $pm-font-caption;
  color: $pm-text-placeholder;
}

.profile-stats {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  background: $pm-bg-card;
  border-bottom: 1rpx solid $pm-border;
  padding: 28rpx 16rpx;
}

.profile-stats__item {
  text-align: center;
}

.profile-stats__value {
  display: block;
  font-size: 36rpx;
  font-weight: $pm-weight-semibold;
  color: $pm-text-primary;
}

.profile-stats__label {
  display: block;
  margin-top: 4rpx;
  font-size: $pm-font-mini;
  color: $pm-text-placeholder;
}

.profile-menu {
  margin-top: $pm-space-md;
  background: $pm-bg-card;
  border-top: 1rpx solid $pm-border;
  border-bottom: 1rpx solid $pm-border;
}

.profile-menu__item {
  @include pm-flex-between;
  padding: 32rpx $pm-space-lg;
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
  margin: 48rpx $pm-space-lg 0;
  margin-bottom: $pm-space-lg;
  height: 88rpx;
  line-height: 88rpx;
  text-align: center;
  border-radius: $pm-radius-xl;
  color: $pm-danger;
  background: $pm-bg-card;
  border: 1rpx solid $pm-danger-light;
  font-size: $pm-font-body;
}
</style>
