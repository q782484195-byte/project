<template>
  <pm-page-layout :title="userStore.displayName" :subtitle="profileSubtitle" :tabbar="true">
    <view class="profile-page__avatar">
      <text class="profile-page__avatar-text">{{ avatarText }}</text>
    </view>

    <view class="profile-page__menu">
      <view
        v-for="item in menus"
        :key="item.label"
        class="profile-page__item"
        :class="{ 'profile-page__item--danger': item.key === 'logout' }"
        @click="handleMenu(item.key)"
      >
        <text>{{ item.label }}</text>
        <text class="profile-page__arrow">›</text>
      </view>
    </view>
  </pm-page-layout>
</template>

<script setup lang="ts">
import { computed } from "vue";
import PmPageLayout from "@/components/pm-page-layout/pm-page-layout.vue";
import { useUserStore } from "@/stores/user";

const userStore = useUserStore();

const profileSubtitle = computed(() => userStore.user?.username || "移动端用户");
const avatarText = computed(() => userStore.displayName.slice(0, 1));

const menus = [
  { key: "tasks", label: "我的任务" },
  { key: "message", label: "消息通知" },
  { key: "about", label: "关于系统" },
  { key: "logout", label: "退出登录" }
];

function handleMenu(key: string) {
  if (key === "logout") {
    userStore.logout();
    return;
  }
  if (key === "tasks") {
    uni.switchTab({ url: "/pages/tasks/index" });
    return;
  }
  if (key === "message") {
    uni.switchTab({ url: "/pages/message/index" });
    return;
  }
  uni.showToast({ title: "项目管理系统 v1.0", icon: "none" });
}
</script>

<style lang="scss" scoped>
@import "@/styles/tokens.scss";
@import "@/styles/mixins.scss";

.profile-page__avatar {
  width: 120rpx;
  height: 120rpx;
  border-radius: 60rpx;
  background: $pm-primary-light;
  margin-bottom: $pm-space-xl;
  display: flex;
  align-items: center;
  justify-content: center;
}

.profile-page__avatar-text {
  font-size: 48rpx;
  font-weight: $pm-weight-semibold;
  color: $pm-primary;
}

.profile-page__menu {
  @include pm-card;
  overflow: hidden;
}

.profile-page__item {
  @include pm-flex-between;
  padding: $pm-space-lg;
  font-size: $pm-font-body;
  border-bottom: 1rpx solid $pm-border;

  &:last-child {
    border-bottom: none;
  }
}

.profile-page__item--danger {
  color: $pm-danger;
}

.profile-page__arrow {
  color: $pm-text-placeholder;
  font-size: $pm-font-title;
}
</style>
