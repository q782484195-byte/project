<template>
  <view class="login-page">
    <view class="login-page__hero">
      <view class="login-page__logo" />
      <text class="login-page__title">项目管理系统</text>
      <text class="login-page__desc">移动端统一入口</text>
    </view>

    <view class="login-page__form">
      <view class="login-page__field">
        <text class="login-page__label">账号</text>
        <input
          v-model="username"
          class="login-page__input"
          placeholder="请输入账号"
          placeholder-class="login-page__placeholder"
        />
      </view>
      <view class="login-page__field">
        <text class="login-page__label">密码</text>
        <input
          v-model="password"
          class="login-page__input"
          password
          placeholder="请输入密码"
          placeholder-class="login-page__placeholder"
        />
      </view>
      <view class="login-page__submit" :class="{ 'is-loading': loading }" @click="handleLogin">
        {{ loading ? "登录中..." : "登录" }}
      </view>
      <!-- #ifdef APP-PLUS -->
      <text class="login-page__api-hint">API: {{ apiUrl }}</text>
      <!-- #endif -->
    </view>
  </view>
</template>

<script setup lang="ts">
import { ref } from "vue";
import { LOGIN_API } from "@/config/api";
import { useUserStore } from "@/stores/user";

const userStore = useUserStore();
const username = ref("");
const password = ref("");
const loading = ref(false);
const apiUrl = LOGIN_API;

async function handleLogin() {
  if (!username.value.trim() || !password.value.trim()) {
    uni.showToast({ title: "请输入账号和密码", icon: "none" });
    return;
  }

  loading.value = true;
  try {
    await userStore.login(username.value.trim(), password.value);
    uni.showToast({ title: "登录成功", icon: "success" });
    setTimeout(() => {
      uni.switchTab({ url: "/pages/workspace/index" });
    }, 300);
  } catch (error) {
    uni.showToast({
      title: error instanceof Error ? error.message : "登录失败",
      icon: "none"
    });
  } finally {
    loading.value = false;
  }
}
</script>

<style lang="scss" scoped>
@import "@/styles/tokens.scss";
@import "@/styles/mixins.scss";

.login-page {
  @include pm-page;
  min-height: 100vh;
  padding: $pm-space-2xl $pm-space-xl;
  background: $pm-bg-page;
}

.login-page__hero {
  margin-top: 120rpx;
  margin-bottom: 80rpx;
  text-align: center;
}

.login-page__logo {
  width: 112rpx;
  height: 112rpx;
  margin: 0 auto $pm-space-lg;
  border-radius: $pm-radius-xl;
  background: $pm-primary;
}

.login-page__title {
  display: block;
  font-size: $pm-font-display;
  font-weight: $pm-weight-semibold;
  color: $pm-text-primary;
}

.login-page__desc {
  display: block;
  margin-top: $pm-space-xs;
  font-size: $pm-font-caption;
  color: $pm-text-secondary;
}

.login-page__form {
  background: $pm-bg-card;
  border-radius: $pm-radius-xl;
  padding: $pm-space-xl;
  border: 1rpx solid $pm-border;
}

.login-page__field + .login-page__field {
  margin-top: $pm-space-lg;
}

.login-page__label {
  display: block;
  margin-bottom: $pm-space-xs;
  font-size: $pm-font-caption;
  color: $pm-text-secondary;
}

.login-page__input {
  height: $pm-input-height;
  padding: 0 $pm-space-lg;
  background: $pm-bg-page;
  border-radius: $pm-radius-md;
  font-size: $pm-font-body;
  color: $pm-text-primary;
}

.login-page__placeholder {
  color: $pm-text-placeholder;
}

.login-page__submit {
  margin-top: $pm-space-xl;
  height: $pm-btn-height;
  line-height: $pm-btn-height;
  text-align: center;
  border-radius: $pm-radius-md;
  background: $pm-primary;
  color: #fff;
  font-size: $pm-font-body;
  font-weight: $pm-weight-medium;

  &.is-loading {
    opacity: 0.7;
  }
}

.login-page__api-hint {
  display: block;
  margin-top: $pm-space-lg;
  font-size: $pm-font-mini;
  color: $pm-text-secondary;
  text-align: center;
  word-break: break-all;
}
</style>
