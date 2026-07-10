<template>
  <view class="tasks-page">
    <pm-filter-bar
      v-model="keyword"
      :chips="projectChips"
      :active-chip="activeProject"
      placeholder="搜索任务标题 / 编号"
      @search="onSearch"
      @chip-change="onChipChange"
    />

    <view class="tasks-page__toolbar">
      <view class="tasks-page__segment">
        <view
          v-for="seg in segments"
          :key="seg.value"
          class="tasks-page__seg"
          :class="{ 'is-active': activeSegment === seg.value }"
          @click="activeSegment = seg.value"
        >
          {{ seg.label }}
        </view>
      </view>
      <view class="tasks-page__meta-row">
        <text>共 {{ filteredTasks.length }} 条</text>
        <text class="tasks-page__sort" @click="toggleSort">排序：{{ sortLabel }} ▾</text>
      </view>
    </view>

    <view v-if="filteredTasks.length" class="tasks-page__list">
      <pm-task-row
        v-for="task in filteredTasks"
        :key="task.id"
        :title="task.title"
        :tags="task.tags"
        :meta="task.meta"
        :status="task.status"
        @click="goDetail(task.id)"
      />
    </view>
    <view v-else class="tasks-page__empty">
      <image
        class="tasks-page__empty-img"
        src="/static/illustrations/empty-task.png"
        mode="aspectFit"
      />
      <text class="tasks-page__empty-text">暂无符合条件的任务</text>
    </view>

    <view class="tasks-page__fab" @click="onCreate">+</view>
  </view>
</template>

<script setup lang="ts">
import { computed, ref } from "vue";
import { onPullDownRefresh, onShow } from "@dcloudio/uni-app";
import PmFilterBar from "@/components/pm-filter-bar/pm-filter-bar.vue";
import PmTaskRow from "@/components/pm-task-row/pm-task-row.vue";
import { selectMyTasks } from "@/api/task";
import { unwrapList } from "@/utils/api";
import { mapTaskToMobile, type MobileTask } from "@/utils/task-mapper";
import { useUserStore } from "@/stores/user";

const userStore = useUserStore();

const keyword = ref("");
const activeProject = ref("all");
const activeSegment = ref("all");
const sortBy = ref<"updated" | "due">("updated");
const loading = ref(false);
const tasks = ref<MobileTask[]>([]);

const projectChips = computed(() => {
  const map = new Map<string, string>();
  tasks.value.forEach((task) => {
    if (task.projectId) map.set(task.projectId, task.project);
  });
  return [
    { label: "全部项目", value: "all" },
    ...Array.from(map.entries()).map(([value, label]) => ({ label, value }))
  ];
});

const segments = [
  { label: "全部", value: "all" },
  { label: "待办", value: "todo" },
  { label: "进行中", value: "doing" },
  { label: "完成", value: "done" }
];

const sortLabel = computed(() =>
  sortBy.value === "updated" ? "最近更新" : "截止日期"
);

const filteredTasks = computed(() => {
  let list = [...tasks.value];

  if (activeProject.value !== "all") {
    list = list.filter((t) => t.projectId === activeProject.value);
  }

  if (keyword.value.trim()) {
    const kw = keyword.value.trim();
    list = list.filter((t) => t.title.includes(kw) || t.id.includes(kw));
  }

  if (activeSegment.value === "todo") {
    list = list.filter((t) => ["待办", "任务未开始", "逾期"].includes(t.status));
  } else   if (activeSegment.value === "doing") {
    list = list.filter((t) =>
      ["任务进行中", "进行中", "待测试", "测试中", "待审阅", "审阅中"].includes(
        t.status
      )
    );
  } else if (activeSegment.value === "done") {
    list = list.filter((t) =>
      ["已完成", "测试完毕", "审阅完毕"].includes(t.status)
    );
  }

  if (sortBy.value === "due") {
    list.sort((a, b) => a.dueDate.localeCompare(b.dueDate));
  }

  return list;
});

async function loadTasks() {
  loading.value = true;
  try {
    const response = await selectMyTasks({ page: 1, page_size: 100 });
    tasks.value = unwrapList(response).map(mapTaskToMobile);
  } catch (error) {
    tasks.value = [];
    uni.showToast({
      title: error instanceof Error ? error.message : "加载任务失败",
      icon: "none"
    });
  } finally {
    loading.value = false;
    uni.stopPullDownRefresh();
  }
}

onShow(() => {
  if (!userStore.isLoggedIn) {
    uni.reLaunch({ url: "/pages/login/index" });
    return;
  }
  loadTasks();
});

onPullDownRefresh(() => {
  loadTasks();
});

function onChipChange(value: string) {
  activeProject.value = value;
}

function onSearch() {
  uni.showToast({ title: "已筛选", icon: "none" });
}

function toggleSort() {
  sortBy.value = sortBy.value === "updated" ? "due" : "updated";
}

function goDetail(id: string) {
  uni.navigateTo({ url: `/pages/tasks/detail?id=${id}` });
}

function onCreate() {
  uni.showToast({ title: "请在 PC 端创建任务", icon: "none" });
}
</script>

<style lang="scss" scoped>
@import "@/styles/tokens.scss";
@import "@/styles/mixins.scss";

.tasks-page {
  min-height: 100vh;
  background: $pm-bg-page;
  padding-bottom: calc(#{$pm-tabbar-height} + 140rpx + env(safe-area-inset-bottom));
  position: relative;
  box-sizing: border-box;
}

.tasks-page__toolbar {
  background: $pm-bg-card;
  padding: $pm-space-md $pm-space-lg $pm-space-sm;
  border-bottom: 1rpx solid $pm-border;
}

.tasks-page__segment {
  display: flex;
  padding: 6rpx;
  background: $pm-bg-muted;
  border-radius: 20rpx;
}

.tasks-page__seg {
  flex: 1;
  height: 64rpx;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: $pm-font-caption;
  color: $pm-text-secondary;
  border-radius: 16rpx;

  &.is-active {
    background: $pm-bg-card;
    color: $pm-primary;
    font-weight: $pm-weight-semibold;
    box-shadow: 0 2rpx 8rpx rgba(15, 23, 42, 0.06);
  }
}

.tasks-page__meta-row {
  @include pm-flex-between;
  margin-top: $pm-space-md;
  font-size: $pm-font-mini;
  color: $pm-text-placeholder;
}

.tasks-page__sort {
  color: $pm-text-secondary;
}

.tasks-page__list {
  background: $pm-bg-card;
}

.tasks-page__empty {
  padding: 80rpx $pm-space-lg;
  display: flex;
  flex-direction: column;
  align-items: center;
}

.tasks-page__empty-img {
  width: 240rpx;
  height: 240rpx;
  margin-bottom: $pm-space-md;
}

.tasks-page__empty-text {
  font-size: $pm-font-caption;
  color: $pm-text-placeholder;
}

.tasks-page__fab {
  position: fixed;
  right: $pm-space-lg;
  bottom: calc(#{$pm-tabbar-height} + 32rpx + env(safe-area-inset-bottom));
  width: 104rpx;
  height: 104rpx;
  border-radius: 50%;
  background: $pm-primary;
  color: #fff;
  font-size: 56rpx;
  font-weight: 300;
  line-height: 104rpx;
  text-align: center;
  box-shadow: 0 16rpx 40rpx rgba(37, 99, 235, 0.35);
  z-index: 50;
}
</style>
