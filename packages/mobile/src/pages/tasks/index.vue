<template>
  <view class="tasks-page">
    <pm-filter-bar
      v-model="keyword"
      :chips="projectChips"
      :active-chip="activeProject"
      @search="loadTasks"
      @chip-change="onChipChange"
    />

    <view class="tasks-page__list">
      <pm-task-card
        v-for="task in filteredTasks"
        :key="task.id"
        :title="task.title"
        :tags="task.tags"
        :rows="task.rows"
        @click="goDetail(task.id)"
      />
    </view>
  </view>
</template>

<script setup lang="ts">
import { computed, ref } from "vue";
import PmFilterBar from "@/components/pm-filter-bar/pm-filter-bar.vue";
import PmTaskCard from "@/components/pm-task-card/pm-task-card.vue";
import { getPriorityTone, getStatusTone } from "@/utils/status";

const keyword = ref("");
const activeProject = ref("all");

const projectChips = [
  { label: "全部", value: "all" },
  { label: "智能硬件 V2.0", value: "p1" },
  { label: "项目管理系统", value: "p2" }
];

const tasks = ref([
  {
    id: "1",
    project: "p1",
    title: "优化登录页表单校验逻辑",
    tags: [
      { label: "任务进行中", tone: getStatusTone("任务进行中") },
      { label: "高", tone: getPriorityTone("高") }
    ],
    rows: [
      { label: "项目", value: "智能硬件 V2.0" },
      { label: "进度", value: "65%" }
    ]
  },
  {
    id: "2",
    project: "p2",
    title: "修复任务列表分页异常",
    tags: [
      { label: "待测试", tone: getStatusTone("待测试") },
      { label: "中", tone: getPriorityTone("中") }
    ],
    rows: [
      { label: "项目", value: "项目管理系统" },
      { label: "进度", value: "90%" }
    ]
  }
]);

const filteredTasks = computed(() => {
  return tasks.value.filter((task) => {
    const matchProject =
      activeProject.value === "all" || task.project === activeProject.value;
    const matchKeyword =
      !keyword.value || task.title.includes(keyword.value.trim());
    return matchProject && matchKeyword;
  });
});

function onChipChange(value: string) {
  activeProject.value = value;
}

function loadTasks() {
  uni.showToast({ title: "搜索", icon: "none" });
}

function goDetail(id: string) {
  uni.navigateTo({ url: `/pages/tasks/detail?id=${id}` });
}
</script>

<style lang="scss" scoped>
@import "@/styles/global.scss";

.tasks-page {
  padding: 24rpx;
}

.tasks-page__list {
  margin-top: 24rpx;
}
</style>
