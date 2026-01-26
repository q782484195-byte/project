<template>
  <div class="profile-page">
    <el-card class="profile-card">
      <template #header>
        <div class="card-header">
          <span class="card-title">
            <el-icon>
              <User />
            </el-icon>
            个人资料
          </span>
        </div>
      </template>

      <el-row :gutter="20">
        <!-- 左侧：用户信息 -->
        <el-col :xs="24" :sm="24" :md="8" :lg="8" :xl="8">
          <div class="user-info-section">
            <div class="avatar-container">
              <el-avatar :size="120" :src="userStore.avatar" class="user-avatar">
                {{ (userStore.username || userStore.nickname || "用户").charAt(0) }}
              </el-avatar>
            </div>
            <div class="user-details">
              <h3 class="username">{{ userStore.username || userStore.nickname || "用户" }}</h3>
              <p class="user-role">
                <el-tag v-for="role in userStore.roles" :key="role" type="primary" size="small" class="role-tag">
                  {{ getRoleName(role) }}
                </el-tag>
              </p>
            </div>
          </div>
        </el-col>

        <!-- 右侧：表单 -->
        <el-col :xs="24" :sm="24" :md="16" :lg="16" :xl="16">
          <el-tabs v-model="activeTab" class="profile-tabs">
            <!-- 基本信息 -->
            <!-- <el-tab-pane label="基本信息" name="info">
              <el-form ref="infoFormRef" :model="infoForm" label-width="100px" class="profile-form">
                <el-form-item label="用户名">
                  <el-input v-model="infoForm.username" disabled />
                </el-form-item>
                <el-form-item label="昵称">
                  <el-input v-model="infoForm.nickname" placeholder="请输入昵称" />
                </el-form-item>
                <el-form-item>
                  <el-button type="primary" @click="handleUpdateInfo" :loading="infoLoading">
                    保存信息
                  </el-button>
                </el-form-item>
              </el-form>
            </el-tab-pane> -->

            <!-- 修改密码 -->
            <el-tab-pane label="修改密码" name="password">
              <el-form ref="passwordFormRef" :model="passwordForm" :rules="passwordRules" label-width="100px"
                class="profile-form">
                <el-form-item label="旧密码" prop="oldPassword">
                  <el-input v-model="passwordForm.oldPassword" type="password" placeholder="请输入旧密码" show-password
                    autocomplete="off" />
                </el-form-item>
                <el-form-item label="新密码" prop="newPassword">
                  <el-input v-model="passwordForm.newPassword" type="password" placeholder="请输入新密码（至少6个字符）"
                    show-password autocomplete="off" />
                </el-form-item>
                <el-form-item label="确认密码" prop="confirmPassword">
                  <el-input v-model="passwordForm.confirmPassword" type="password" placeholder="请再次输入新密码" show-password
                    autocomplete="off" />
                </el-form-item>
                <el-form-item>
                  <el-button type="primary" @click="handleUpdatePassword" :loading="passwordLoading">
                    修改密码
                  </el-button>
                  <el-button @click="resetPasswordForm">重置</el-button>
                </el-form-item>
              </el-form>
            </el-tab-pane>
          </el-tabs>
        </el-col>
      </el-row>
    </el-card>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted } from "vue";
import { ElMessage, ElMessageBox, type FormInstance, type FormRules } from "element-plus";
import { User } from "@element-plus/icons-vue";
import { useUserStoreHook } from "@/store/modules/user";
import { updatePassword } from "@/api/user";
import { message } from "@/utils/message";

defineOptions({
  name: "Profile"
});

const userStore = useUserStoreHook();

const activeTab = ref("password");
const infoFormRef = ref<FormInstance>();
const passwordFormRef = ref<FormInstance>();
const infoLoading = ref(false);
const passwordLoading = ref(false);

// 基本信息表单
const infoForm = reactive({
  username: userStore.username || "",
  nickname: userStore.nickname || ""
});

// 密码表单
const passwordForm = reactive({
  oldPassword: "",
  newPassword: "",
  confirmPassword: ""
});

// 密码验证规则
const validateConfirmPassword = (rule: any, value: string, callback: any) => {
  if (value !== passwordForm.newPassword) {
    callback(new Error("两次输入的密码不一致"));
  } else {
    callback();
  }
};

const passwordRules: FormRules = {
  oldPassword: [
    { required: true, message: "请输入旧密码", trigger: "blur" }
  ],
  newPassword: [
    { required: true, message: "请输入新密码", trigger: "blur" },
    { min: 6, message: "密码长度不能少于 6 个字符", trigger: "blur" }
  ],
  confirmPassword: [
    { required: true, message: "请再次输入新密码", trigger: "blur" },
    { validator: validateConfirmPassword, trigger: "blur" }
  ]
};

// 角色名称映射
const roleMap: Record<string, string> = {
  Admin: "管理员",
  ProjectManager: "项目经理",
  DepartmentManager: "部门主管",
  Member: "普通成员",
  ProjectDirector: "项目总监",
  BusinessDepartmentMembers: "业务部门成员"
};

const getRoleName = (role: string) => {
  return roleMap[role] || role;
};

// 更新基本信息
const handleUpdateInfo = async () => {
  // 这里可以添加更新用户信息的API调用
  // 目前只是示例，实际需要根据后端API实现
  infoLoading.value = true;
  try {
    // const response = await updateUserInfo(infoForm);
    // if (response.code === 200) {
    //   userStore.SET_NICKNAME(infoForm.nickname);
    //   message("更新成功", { type: "success" });
    // }
    message("功能开发中，敬请期待", { type: "info" });
  } catch (error) {
    console.error("更新信息失败:", error);
  } finally {
    infoLoading.value = false;
  }
};

// 修改密码
const handleUpdatePassword = async () => {
  if (!passwordFormRef.value) return;

  await passwordFormRef.value.validate(async (valid) => {
    if (valid) {
      passwordLoading.value = true;
      try {
        const response = await updatePassword({
          old_password: passwordForm.oldPassword,
          new_password: passwordForm.newPassword
        });

        if (response?.code === 200) {
          ElMessageBox.confirm("密码修改成功，请重新登录", "提示", {
            confirmButtonText: "确定",
            showCancelButton: false,
            type: "success"
          }).then(() => {
            // 退出登录
            userStore.logOut();
          });
        } else {
          message(response?.message || "密码修改失败", { type: "error" });
        }
      } catch (error: any) {
        console.error("修改密码失败:", error);
        message(error?.response?.data?.message || "密码修改失败，请检查旧密码是否正确", {
          type: "error"
        });
      } finally {
        passwordLoading.value = false;
      }
    }
  });
};

// 重置密码表单
const resetPasswordForm = () => {
  if (passwordFormRef.value) {
    passwordFormRef.value.resetFields();
  }
  passwordForm.oldPassword = "";
  passwordForm.newPassword = "";
  passwordForm.confirmPassword = "";
};

onMounted(() => {
  // 初始化表单数据
  infoForm.username = userStore.username || "";
  infoForm.nickname = userStore.nickname || userStore.username || "";
});
</script>

<style lang="scss" scoped>
.profile-page {
  padding: 20px;
  min-height: calc(100vh - 84px);
  background-color: #f5f7fa;
}

.profile-card {
  max-width: 1200px;
  margin: 0 auto;
  border-radius: 8px;
  box-shadow: 0 2px 12px 0 rgba(0, 0, 0, 0.1);

  .card-header {
    display: flex;
    justify-content: space-between;
    align-items: center;

    .card-title {
      display: flex;
      align-items: center;
      gap: 8px;
      font-size: 18px;
      font-weight: 600;
      color: #303133;
    }
  }
}

.user-info-section {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 20px;
  border-right: 1px solid #ebeef5;

  .avatar-container {
    margin-bottom: 20px;

    .user-avatar {
      border: 4px solid #409eff;
      box-shadow: 0 2px 12px 0 rgba(64, 158, 255, 0.2);
    }
  }

  .user-details {
    text-align: center;

    .username {
      margin: 0 0 12px 0;
      font-size: 24px;
      font-weight: 600;
      color: #303133;
    }

    .user-role {
      margin: 0;
      display: flex;
      flex-wrap: wrap;
      justify-content: center;
      gap: 8px;

      .role-tag {
        margin: 0;
      }
    }
  }
}

.profile-tabs {
  :deep(.el-tabs__header) {
    margin-bottom: 24px;
  }

  :deep(.el-tabs__item) {
    font-size: 16px;
    padding: 0 24px;
  }
}

.profile-form {
  max-width: 600px;
  padding: 20px 0;

  :deep(.el-form-item__label) {
    font-weight: 500;
  }

  :deep(.el-input) {
    max-width: 400px;
  }
}

@media (max-width: 768px) {
  .user-info-section {
    border-right: none;
    border-bottom: 1px solid #ebeef5;
    padding-bottom: 30px;
    margin-bottom: 20px;
  }

  .profile-form {
    :deep(.el-input) {
      max-width: 100%;
    }
  }
}
</style>
