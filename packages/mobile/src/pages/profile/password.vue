<template>
  <view class="form-page">
    <view class="form-page__card">
      <view class="form-page__readonly">
        <text class="form-page__label">当前账号</text>
        <text class="form-page__value">{{ userStore.user?.username || "-" }}</text>
      </view>
      <view class="form-page__field">
        <text class="form-page__label">原密码</text>
        <input
          v-model="oldPassword"
          class="form-page__input"
          password
          placeholder="请输入原密码"
        />
      </view>
      <view class="form-page__field">
        <text class="form-page__label">新密码</text>
        <input
          v-model="newPassword"
          class="form-page__input"
          password
          placeholder="请输入新密码"
        />
      </view>
      <view class="form-page__field">
        <text class="form-page__label">确认新密码</text>
        <input
          v-model="confirmPassword"
          class="form-page__input"
          password
          placeholder="请再次输入新密码"
        />
      </view>
    </view>

    <view
      class="form-page__submit"
      :class="{ 'is-loading': submitting }"
      @click="handleSubmit"
    >
      {{ submitting ? "提交中..." : "确认修改" }}
    </view>
  </view>
</template>

<script setup lang="ts">
import { ref } from "vue";
import { onShow } from "@dcloudio/uni-app";
import { updatePasswordApi } from "@/api/user";
import type { ApiResponse } from "@/api/types";
import { isApiSuccess } from "@/utils/api";
import { useUserStore } from "@/stores/user";

const userStore = useUserStore();
const oldPassword = ref("");
const newPassword = ref("");
const confirmPassword = ref("");
const submitting = ref(false);

async function handleSubmit() {
  if (!oldPassword.value.trim()) {
    uni.showToast({ title: "请输入原密码", icon: "none" });
    return;
  }
  if (!newPassword.value.trim()) {
    uni.showToast({ title: "请输入新密码", icon: "none" });
    return;
  }
  if (newPassword.value.length < 6) {
    uni.showToast({ title: "新密码至少 6 位", icon: "none" });
    return;
  }
  if (newPassword.value !== confirmPassword.value) {
    uni.showToast({ title: "两次输入的新密码不一致", icon: "none" });
    return;
  }

  submitting.value = true;
  try {
    const res = (await updatePasswordApi({
      old_password: oldPassword.value,
      new_password: newPassword.value
    })) as ApiResponse;
    if (!isApiSuccess(res)) {
      throw new Error((res as { message?: string }).message || "修改失败");
    }
    uni.showModal({
      title: "修改成功",
      content: "密码已更新，请重新登录",
      showCancel: false,
      success: () => userStore.logout()
    });
  } catch (error) {
    uni.showToast({
      title: error instanceof Error ? error.message : "修改失败",
      icon: "none"
    });
  } finally {
    submitting.value = false;
  }
}

onShow(() => {
  if (!userStore.isLoggedIn) {
    uni.reLaunch({ url: "/pages/login/index" });
  }
});
</script>

<style lang="scss" scoped>
@import "@/styles/form-page.scss";
</style>
