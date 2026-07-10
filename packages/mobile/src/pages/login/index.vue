<template>
  <view class="login-page">
    <view class="login-page__hero">
      <image class="login-page__logo" src="/static/icons/logo.png" mode="aspectFit" />
      <view class="login-page__brand">
        <text>项目</text>
        <text class="login-page__brand-accent">管理</text>
      </view>
      <text class="login-page__desc">任务、进度、协作，一个入口搞定</text>
    </view>

    <view class="login-page__field">
      <text class="login-page__label">账号</text>
      <input
        v-model="username"
        class="login-page__input"
        placeholder="手机号 / 工号 / 邮箱"
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

    <view class="login-page__row">
      <view class="login-page__check" @click="remember = !remember">
        <view class="login-page__check-box" :class="{ 'is-on': remember }" />
        <text>记住账号</text>
      </view>
      <text class="login-page__link" @click="onForgot">忘记密码？</text>
    </view>

    <view
      class="login-page__submit"
      :class="{ 'is-loading': loading }"
      @click="handleLogin"
    >
      {{ loading ? "登录中..." : "登录" }}
    </view>

    <view class="login-page__divider">
      <view class="login-page__divider-line" />
      <text>其他方式</text>
      <view class="login-page__divider-line" />
    </view>
    <view class="login-page__sso" @click="onSso">
      <view class="login-page__sso-dot" />
      <text>企业微信快捷登录</text>
    </view>
  </view>
</template>

<script setup lang="ts">
import { onMounted, ref } from "vue";
import { useUserStore } from "@/stores/user";

const userStore = useUserStore();
const username = ref("");
const password = ref("");
const remember = ref(true);
const loading = ref(false);

onMounted(() => {
  if (userStore.isLoggedIn) {
    uni.switchTab({ url: "/pages/workspace/index" });
    return;
  }
  const saved = uni.getStorageSync("pm_remember_username");
  if (saved) username.value = String(saved);
});

async function handleLogin() {
  if (!username.value.trim() || !password.value.trim()) {
    uni.showToast({ title: "请输入账号和密码", icon: "none" });
    return;
  }

  loading.value = true;
  try {
    if (remember.value) {
      uni.setStorageSync("pm_remember_username", username.value.trim());
    } else {
      uni.removeStorageSync("pm_remember_username");
    }
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

function onForgot() {
  uni.showToast({ title: "请联系管理员重置密码", icon: "none" });
}

function onSso() {
  uni.showToast({ title: "企业微信登录暂未开放", icon: "none" });
}
</script>

<style lang="scss" scoped>
@import "@/styles/tokens.scss";
@import "@/styles/mixins.scss";

.login-page {
  @include pm-page;
  min-height: 100vh;
  padding: 0 $pm-space-2xl;
  padding-top: calc(120rpx + var(--status-bar-height, 20px));
  padding-bottom: calc(#{$pm-space-2xl} + env(safe-area-inset-bottom));
  background: $pm-bg-page;
  box-sizing: border-box;
}

.login-page__hero {
  margin-bottom: 80rpx;
}

.login-page__logo {
  width: 96rpx;
  height: 96rpx;
  margin-bottom: $pm-space-lg;
  border-radius: $pm-radius-xl;
}

.login-page__brand {
  display: flex;
  flex-direction: row;
  font-size: 56rpx;
  font-weight: 700;
  color: $pm-text-primary;
  letter-spacing: -1rpx;
  line-height: 1.2;
}

.login-page__brand-accent {
  color: $pm-primary;
}

.login-page__desc {
  display: block;
  margin-top: $pm-space-sm;
  font-size: 28rpx;
  color: $pm-text-secondary;
}

.login-page__field + .login-page__field {
  margin-top: $pm-space-lg;
}

.login-page__label {
  display: block;
  margin-bottom: $pm-space-sm;
  font-size: $pm-font-caption;
  color: $pm-text-secondary;
}

.login-page__input {
  height: $pm-input-height;
  padding: 0 $pm-space-lg;
  background: $pm-bg-muted;
  border-radius: 20rpx;
  font-size: $pm-font-body;
  color: $pm-text-primary;
}

.login-page__placeholder {
  color: $pm-text-placeholder;
}

.login-page__row {
  @include pm-flex-between;
  margin-top: $pm-space-md;
  font-size: $pm-font-caption;
  color: $pm-text-secondary;
}

.login-page__check {
  display: flex;
  align-items: center;
  gap: 12rpx;
}

.login-page__check-box {
  width: 32rpx;
  height: 32rpx;
  border-radius: 8rpx;
  border: 3rpx solid $pm-border;
  background: $pm-bg-card;

  &.is-on {
    border-color: $pm-primary;
    background: $pm-primary;
    position: relative;

    &::after {
      content: "";
      position: absolute;
      left: 8rpx;
      top: 2rpx;
      width: 10rpx;
      height: 18rpx;
      border: solid #fff;
      border-width: 0 3rpx 3rpx 0;
      transform: rotate(45deg);
    }
  }
}

.login-page__link {
  color: $pm-primary;
}

.login-page__submit {
  margin-top: $pm-space-xl;
  height: $pm-btn-height;
  line-height: $pm-btn-height;
  text-align: center;
  border-radius: $pm-radius-xl;
  background: $pm-primary;
  color: #fff;
  font-size: $pm-font-body;
  font-weight: $pm-weight-medium;

  &.is-loading {
    opacity: 0.7;
  }
}

.login-page__divider {
  display: flex;
  align-items: center;
  gap: $pm-space-md;
  margin: 56rpx 0 $pm-space-lg;
  font-size: $pm-font-mini;
  color: $pm-text-placeholder;
}

.login-page__divider-line {
  flex: 1;
  height: 1rpx;
  background: $pm-border;
}

.login-page__sso {
  height: 88rpx;
  border-radius: $pm-radius-xl;
  border: 1rpx solid $pm-border;
  background: $pm-bg-card;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: $pm-space-sm;
  font-size: 28rpx;
  color: $pm-text-primary;
}

.login-page__sso-dot {
  width: 36rpx;
  height: 36rpx;
  border-radius: 8rpx;
  background: #07c160;
}
</style>
