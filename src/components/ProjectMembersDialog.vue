<template>
  <el-dialog
    v-model="dialogVisible"
    title="管理项目成员"
    width="600px"
    @close="handleClose"
  >
    <div v-if="project">
      <div class="current-members">
        <h4>当前成员</h4>
        <div class="member-list">
          <div
            v-for="member in currentMembers"
            :key="member.id"
            class="member-item"
          >
            <el-avatar :src="member.avatar">{{
              member.name.charAt(0)
            }}</el-avatar>
            <div class="member-info">
              <div class="member-name">{{ member.name }}</div>
              <div v-if="member.role" class="member-role">
                {{ getRoleText(member.role) }}
              </div>
            </div>
            <el-button
              type="text"
              size="small"
              @click="removeMember(member.id)"
            >
              移除
            </el-button>
          </div>
        </div>
      </div>

      <el-divider />

      <div class="add-members">
        <h4>添加成员</h4>
        <el-select
          v-model="selectedMembers"
          multiple
          placeholder="选择要添加的成员"
          style="width: 100%; margin-bottom: 16px"
        >
          <el-option
            v-for="user in availableUsers"
            :key="user.id"
            :label="user.name"
            :value="user.id"
          >
            <div style="display: flex; align-items: center; gap: 8px">
              <el-avatar :size="24" :src="user.avatar">{{
                user.name.charAt(0)
              }}</el-avatar>
              <span>{{ user.name }}</span>
              <span v-if="user.role" style="color: #909399; font-size: 12px">{{
                getRoleText(user.role)
              }}</span>
            </div>
          </el-option>
        </el-select>
        <el-button
          type="primary"
          :disabled="selectedMembers.length === 0"
          @click="addMembers"
        >
          添加选中成员
        </el-button>
      </div>
    </div>

    <template #footer>
      <el-button @click="handleClose">关闭</el-button>
      <el-button type="primary" @click="handleSave">保存</el-button>
    </template>
  </el-dialog>
</template>

<script setup lang="ts">
import { ref, computed, watch } from "vue";
import { ElMessage } from "element-plus";
import type { Project } from "@/types";
import { mockUsers } from "@/mock/users";

interface Props {
  visible: boolean;
  project: Project | null;
}

interface Emits {
  (e: "update:visible", value: boolean): void;
  (e: "updated", project: Project): void;
}

const props = defineProps<Props>();
const emit = defineEmits<Emits>();

const selectedMembers = ref<string[]>([]);
const currentMembers = ref<
  Array<{ id: string; name: string; avatar?: string; role?: string }>
>([]);

const dialogVisible = computed({
  get: () => props.visible,
  set: value => {
    if (value && props.project) {
      currentMembers.value = [...(props.project.members || [])];
    }
    emit("update:visible", value);
  }
});

// 监听 project 变化
watch(
  () => props.project,
  project => {
    if (project && props.visible) {
      currentMembers.value = [...(project.members || [])];
    }
  },
  { immediate: true }
);

// 可选择的用户（排除已经是成员的用户）
const availableUsers = computed(() => {
  const memberIds = currentMembers.value.map(member => member.id);
  return mockUsers.filter(user => !memberIds.includes(user.id));
});

const addMembers = () => {
  const usersToAdd = mockUsers
    .filter(user => selectedMembers.value.includes(user.id))
    .map(user => ({
      id: user.id,
      name: user.name,
      avatar: user.avatar,
      role: user.role
    }));
  currentMembers.value.push(...usersToAdd);
  selectedMembers.value = [];
  ElMessage.success(`已添加 ${usersToAdd.length} 名成员`);
};

const removeMember = (memberId: string) => {
  const index = currentMembers.value.findIndex(
    member => member.id === memberId
  );
  if (index > -1) {
    const member = currentMembers.value[index];
    currentMembers.value.splice(index, 1);
    ElMessage.success(`已移除成员：${member.name}`);
  }
};

const handleClose = () => {
  selectedMembers.value = [];
  dialogVisible.value = false;
};

const handleSave = () => {
  if (props.project) {
    const updatedProject: Project = {
      ...props.project,
      members: currentMembers.value,
      updatedAt: new Date().toISOString()
    };
    emit("updated", updatedProject);
    ElMessage.success("项目成员更新成功");
    handleClose();
  }
};

const getRoleText = (role: string) => {
  const roleMap: Record<string, string> = {
    project_manager: "项目经理",
    ui_designer: "UI设计师",
    frontend_developer: "前端开发",
    backend_developer: "后端开发",
    tester: "测试工程师"
  };
  return roleMap[role] || role;
};
</script>

<style scoped lang="scss">
.current-members {
  margin-bottom: 20px;

  h4 {
    margin: 0 0 16px 0;
    color: #303133;
  }

  .member-list {
    .member-item {
      display: flex;
      align-items: center;
      gap: 12px;
      padding: 12px;
      border: 1px solid #e4e7ed;
      border-radius: 6px;
      margin-bottom: 8px;

      .member-info {
        flex: 1;

        .member-name {
          font-weight: 500;
          color: #303133;
          margin-bottom: 4px;
        }

        .member-role {
          font-size: 12px;
          color: #909399;
        }
      }
    }
  }
}

.add-members {
  h4 {
    margin: 0 0 16px 0;
    color: #303133;
  }
}
</style>
