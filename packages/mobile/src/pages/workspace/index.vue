<template>
  <pm-page-layout title="工作台" :subtitle="greeting" :tabbar="true">
    <pm-stat-bar :items="stats" />

    <view class="workspace-page__section">
      <text class="pm-section-title">待办任务</text>
      <pm-task-card
        v-for="task in tasks"
        :key="task.id"
        :title="task.title"
        :tags="task.tags"
        :rows="task.rows"
        :show-color="task.showColor"
        @click="goDetail(task.id)"
      >
        <template #actions>
          <text class="pm-link" @click.stop="goDetail(task.id)">查看</text>
          <text class="pm-link" @click.stop="handleReport(task.id)">进度汇报</text>
        </template>
      </pm-task-card>
    </view>
  </pm-page-layout>
</template>

<script setup lang="ts">
import { computed } from "vue";
import PmPageLayout from "@/components/pm-page-layout/pm-page-layout.vue";
import PmStatBar from "@/components/pm-stat-bar/pm-stat-bar.vue";
import PmTaskCard from "@/components/pm-task-card/pm-task-card.vue";
import { useUserStore } from "@/stores/user";
import { getPriorityTone, getStatusTone } from "@/utils/status";

const userStore = useUserStore();
const greeting = computed(() => `你好，${userStore.displayName}`);

const stats = [
  { key: "todo", label: "待办", value: 12 },
  { key: "doing", label: "进行中", value: 8 },
  { key: "done", label: "已完成", value: 156 }
];

const tasks = [
  {
    id: "1",
    title: "优化登录页表单校验逻辑",
    showColor: "blue",
    tags: [
      { label: "任务进行中", tone: getStatusTone("任务进行中") },
      { label: "高", tone: getPriorityTone("高") }
    ],
    rows: [
      { label: "项目", value: "智能硬件 V2.0" },
      { label: "负责人", value: "张三" },
      { label: "进度", value: "65%" }
    ]
  },
  {
    id: "2",
    title: "修复任务列表分页异常",
    showColor: "orange",
    tags: [
      { label: "待测试", tone: getStatusTone("待测试") },
      { label: "中", tone: getPriorityTone("中") }
    ],
    rows: [
      { label: "项目", value: "项目管理系统" },
      { label: "负责人", value: "李四" },
      { label: "进度", value: "90%" }
    ]
  }
];

function goDetail(id: string) {
  uni.navigateTo({ url: `/pages/tasks/detail?id=${id}` });
}

function handleReport(id: string) {
  uni.showToast({ title: `汇报任务 ${id}`, icon: "none" });
}
</script>

<style lang="scss" scoped>
@import "@/styles/global.scss";

.workspace-page__section {
  margin-top: 32rpx;
}
</style>
