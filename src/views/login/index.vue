<script setup lang="ts">
import { useRouter } from "vue-router";
import { message } from "@/utils/message";
import { loginRules } from "./utils/rule";
import { ref, reactive, toRaw, onMounted, Teleport } from "vue";
import { debounce } from "@pureadmin/utils";
import { useNav } from "@/layout/hooks/useNav";
import { useEventListener, onClickOutside } from "@vueuse/core";
import type { FormInstance } from "element-plus";
import { useLayout } from "@/layout/hooks/useLayout";
import { useUserStoreHook } from "@/store/modules/user";
import { initRouter, getTopMenu } from "@/router/utils";
import { bg, avatar, illustration } from "./utils/static";
import { useRenderIcon } from "@/components/ReIcon/src/hooks";
import { useDataThemeChange } from "@/layout/hooks/useDataThemeChange";
import {
  getSavedAccounts,
  saveAccount,
  getAccountPassword,
  removeAccount,
  type SavedAccount
} from "./utils/accountStorage";

import dayIcon from "@/assets/svg/day.svg?component";
import darkIcon from "@/assets/svg/dark.svg?component";
import Lock from "~icons/ri/lock-fill";
import User from "~icons/ri/user-3-fill";
import Close from "~icons/ri/close-line";

defineOptions({
  name: "Login"
});

const router = useRouter();
const loading = ref(false);
const disabled = ref(false);
const ruleFormRef = ref<FormInstance>();
const savedAccounts = ref<SavedAccount[]>([]);
const showAccountDropdown = ref(false);
const accountDropdownRef = ref<HTMLElement>();
const dropdownPosition = ref({ top: 0, left: 0, width: 0 });

const { initStorage } = useLayout();
initStorage();

const { dataTheme, overallStyle, dataThemeChange } = useDataThemeChange();
// 确保 overallStyle.value 有值后再调用
const overallStyleValue = overallStyle.value ?? "light";
dataThemeChange(overallStyleValue);
const { title } = useNav();

const ruleForm = reactive({
  username: "",
  password: ""
});

// 加载已保存的账号
const loadSavedAccounts = () => {
  savedAccounts.value = getSavedAccounts();
  // 如果有保存的账号，自动填充第一个
  if (savedAccounts.value.length > 0) {
    const firstAccount = savedAccounts.value[0];
    ruleForm.username = firstAccount.username;
    ruleForm.password = firstAccount.password;
  }
};

// 选择账号
const selectAccount = (account: SavedAccount) => {
  ruleForm.username = account.username;
  ruleForm.password = account.password;
  showAccountDropdown.value = false;
};

// 删除账号
const deleteAccount = (username: string, event: Event) => {
  event.stopPropagation();
  removeAccount(username);
  loadSavedAccounts();
  // 如果删除的是当前账号，清空表单
  if (ruleForm.username === username) {
    ruleForm.username = "";
    ruleForm.password = "";
  }
};

// 用户名输入框焦点事件
const handleUsernameFocus = () => {
  if (savedAccounts.value.length > 0) {
    // 计算输入框的位置，用于固定定位下拉框
    if (accountDropdownRef.value) {
      const rect = accountDropdownRef.value.getBoundingClientRect();
      dropdownPosition.value = {
        top: rect.bottom + window.scrollY + 4,
        left: rect.left + window.scrollX,
        width: rect.width
      };
    }
    showAccountDropdown.value = true;
  }
};

onMounted(() => {
  loadSavedAccounts();
});

// 点击外部关闭下拉框
onClickOutside(accountDropdownRef, () => {
  showAccountDropdown.value = false;
});

const onLogin = async (formEl: FormInstance | undefined) => {
  if (!formEl) return;
  await formEl.validate(valid => {
    if (valid) {
      loading.value = true;
      useUserStoreHook()
        .loginByUsername({
          username: ruleForm.username,
          password: ruleForm.password
        })
        .then(res => {
          if (res.success) {
            // 登录成功后保存账号和密码
            saveAccount(ruleForm.username, ruleForm.password);
            loadSavedAccounts();
            // 获取后端路由
            return initRouter().then(async () => {
              disabled.value = true;
              try {
                const topMenu = await getTopMenu(true);
                if (topMenu && topMenu.path) {
                  router
                    .push(topMenu.path)
                    .then(() => {
                      message("登录成功", { type: "success" });
                    })
                    .finally(() => (disabled.value = false));
                } else {
                  disabled.value = false;
                  message("登录成功", { type: "success" });
                }
              } catch (error) {
                console.error("获取顶部菜单失败:", error);
                disabled.value = false;
                message("登录成功", { type: "success" });
              }
            });
          } else {
            // 显示后端返回的错误信息，如果没有则显示默认提示
            const errorMsg = (res as any)?.message || "登录失败";
            message(errorMsg, { type: "error" });
          }
        })
        .finally(() => (loading.value = false));
    }
  });
};

const immediateDebounce: any = debounce(
  formRef => onLogin(formRef),
  1000,
  true
);

useEventListener(document, "keydown", ({ code }) => {
  if (
    ["Enter", "NumpadEnter"].includes(code) &&
    !disabled.value &&
    !loading.value
  )
    immediateDebounce(ruleFormRef.value);
});
</script>

<template>
  <div class="select-none">
    <img :src="bg" class="wave" />
    <div class="flex-c absolute right-5 top-3">
      <!-- 主题 -->
      <el-switch v-model="dataTheme" inline-prompt :active-icon="dayIcon" :inactive-icon="darkIcon"
        @change="dataThemeChange" />
    </div>
    <div class="login-container">
      <div class="img">
        <component :is="toRaw(illustration)" />
      </div>
      <div class="login-box">
        <div class="login-form">
          <avatar class="avatar" />
          <Motion>
            <h2 class="outline-hidden">{{ title }}</h2>
          </Motion>

          <el-form ref="ruleFormRef" :model="ruleForm" :rules="loginRules" size="large">
            <Motion :delay="100">
              <el-form-item :rules="[
                {
                  required: true,
                  message: '请输入账号',
                  trigger: 'blur'
                }
              ]" prop="username" class="account-form-item">
                <div ref="accountDropdownRef" class="relative">
                  <el-input v-model="ruleForm.username" clearable placeholder="账号" :prefix-icon="useRenderIcon(User)"
                    @focus="handleUsernameFocus" @click.stop />
                </div>
                <Teleport to="body">
                  <div v-if="showAccountDropdown && savedAccounts.length > 0" class="account-dropdown" :style="{
                    top: dropdownPosition.top + 'px',
                    left: dropdownPosition.left + 'px',
                    width: dropdownPosition.width + 'px'
                  }" @click.stop>
                    <div v-for="account in savedAccounts" :key="account.username" class="account-item"
                      @click="selectAccount(account)">
                      <span class="account-username">{{
                        account.username
                      }}</span>
                      <el-icon class="delete-icon" @click="deleteAccount(account.username, $event)">
                        <Close />
                      </el-icon>
                    </div>
                  </div>
                </Teleport>
              </el-form-item>
            </Motion>

            <Motion :delay="150">
              <el-form-item prop="password">
                <el-input v-model="ruleForm.password" clearable show-password placeholder="密码"
                  :prefix-icon="useRenderIcon(Lock)" />
              </el-form-item>
            </Motion>

            <Motion :delay="250">
              <el-button class="w-full mt-4!" size="default" type="primary" :loading="loading" :disabled="disabled"
                @click="onLogin(ruleFormRef)">
                登录
              </el-button>
            </Motion>
          </el-form>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
@import url("@/style/login.css");
</style>

<style lang="scss" scoped>
:deep(.el-input-group__append, .el-input-group__prepend) {
  padding: 0;
}

.account-form-item {
  position: relative;
}

.relative {
  width: 100%;
  position: relative;
}

.account-dropdown {
  position: fixed;
  background: var(--el-bg-color);
  border: 1px solid var(--el-border-color);
  border-radius: 4px;
  box-shadow: 0 2px 12px 0 rgba(0, 0, 0, 0.1);
  z-index: 9999;
  max-height: 200px;
  overflow-y: auto;

  .account-item {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 10px 12px;
    cursor: pointer;
    transition: background-color 0.2s;

    &:hover {
      background-color: var(--el-fill-color-light);
    }

    .account-username {
      flex: 1;
      font-size: 14px;
    }

    .delete-icon {
      padding: 4px;
      color: var(--el-text-color-secondary);
      transition: color 0.2s;

      &:hover {
        color: var(--el-color-danger);
      }
    }
  }
}
</style>
