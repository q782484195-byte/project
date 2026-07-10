<template>
  <view class="tab-page tasks-page">
    <pm-tab-header :title="'我的任务'" :subtitle="headerSubtitle">
      <template #extra>
        <view class="tab-icon-btn tab-icon-btn--primary" @click="onCreate">
          <pm-icon name="plus" :size="36" />
        </view>
      </template>
      <template #bottom>
        <view class="tab-stat-row tasks-page__stats">
          <view
            v-for="item in statCards"
            :key="item.key"
            class="tab-stat-card"
            :class="{
              'tab-stat-card--warn': item.warn,
              'tab-stat-card--active':
                activeSegment === item.key && !overdueOnly
            }"
            @click="setSegment(item.key)"
          >
            <text class="tab-stat-card__value">{{ item.value }}</text>
            <text class="tab-stat-card__label">{{ item.label }}</text>
          </view>
        </view>
      </template>
    </pm-tab-header>

    <view class="tasks-page__filter tab-surface">
      <pm-filter-bar
        v-model="keyword"
        :chips="projectChips"
        :active-chip="activeProject"
        placeholder="搜索任务标题 / 编号"
        embedded
        @search="onSearch"
        @chip-change="onChipChange"
      />
      <view class="tasks-page__toolbar">
        <view class="tab-pill-group">
          <view
            v-for="seg in segments"
            :key="seg.value"
            class="tab-pill"
            :class="{
              'is-active': activeSegment === seg.value && !overdueOnly
            }"
            @click="setSegment(seg.value)"
          >
            {{ seg.label }}
          </view>
        </view>
        <view class="tasks-page__meta-row">
          <text>共 {{ filteredTasks.length }} 条</text>
          <text class="tasks-page__sort" @click="toggleSort">排序：{{ sortLabel }} ▾</text>
        </view>
      </view>
    </view>

    <view v-if="filteredTasks.length" class="tasks-page__list">
      <pm-task-row
        v-for="task in filteredTasks"
        :key="task.id"
        variant="card"
        :title="task.title"
        :tags="task.tags"
        :meta="task.meta"
        :status="task.status"
        action-text="汇报"
        @click="goDetail(task.id)"
        @action="goReport(task.id)"
      />
    </view>
    <view v-else class="tab-empty">
      <image
        class="tab-empty__img"
        src="/static/illustrations/empty-task.png"
        mode="aspectFit"
      />
      <text class="tab-empty__text">暂无符合条件的任务</text>
    </view>

    <view class="tasks-page__fab" @click="onCreate">
      <pm-icon name="plus" :size="44" />
    </view>
  </view>
</template>

<script setup lang="ts">
import { computed, ref } from "vue";
import { onPullDownRefresh, onShow } from "@dcloudio/uni-app";
import PmTabHeader from "@/components/pm-tab-header/pm-tab-header.vue";
import PmFilterBar from "@/components/pm-filter-bar/pm-filter-bar.vue";
import PmTaskRow from "@/components/pm-task-row/pm-task-row.vue";
import PmIcon from "@/components/pm-icon/pm-icon.vue";
import { selectMyTasks } from "@/api/task";
import { unwrapList } from "@/utils/api";
import { mapTaskToMobile, type MobileTask } from "@/utils/task-mapper";
import { getTaskSegmentLabel, type TaskListSegment } from "@/utils/task-filter";
import { useTaskNavStore } from "@/stores/task-nav";
import { useUserStore } from "@/stores/user";

const userStore = useUserStore();
const taskNavStore = useTaskNavStore();

const keyword = ref("");
const activeProject = ref("all");
const activeSegment = ref<TaskListSegment>("all");
const overdueOnly = ref(false);
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

const segments: Array<{ label: string; value: TaskListSegment }> = [
  { label: "全部", value: "all" },
  { label: "待办", value: "todo" },
  { label: "进行中", value: "doing" },
  { label: "完成", value: "done" }
];

const statCards = computed(() => {
  const todo = tasks.value.filter((t) =>
    ["待办", "任务未开始", "逾期"].includes(t.status)
  ).length;
  const doing = tasks.value.filter((t) =>
    ["任务进行中", "进行中", "待测试", "测试中", "待审阅", "审阅中"].includes(t.status)
  ).length;
  const done = tasks.value.filter((t) =>
    ["已完成", "测试完毕", "审阅完毕"].includes(t.status)
  ).length;
  return [
    { key: "todo" as TaskListSegment, label: "待办", value: todo, warn: todo > 0 },
    { key: "doing" as TaskListSegment, label: "进行中", value: doing },
    { key: "done" as TaskListSegment, label: "已完成", value: done }
  ];
});

const headerSubtitle = computed(() => {
  const total = tasks.value.length;
  const overdue = tasks.value.filter((t) => t.overdue).length;
  if (activeSegment.value !== "all" || overdueOnly.value) {
    const label = overdueOnly.value ? "逾期任务" : getTaskSegmentLabel(activeSegment.value);
    return `当前筛选：${label}，共 ${filteredTasks.value.length} 条`;
  }
  if (!total) return "加载任务列表，掌控今日节奏";
  if (overdue > 0) return `共 ${total} 项任务，${overdue} 项已逾期需优先处理`;
  return `共 ${total} 项任务，点击统计卡片可快速筛选`;
});

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
  } else if (activeSegment.value === "doing") {
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

  if (overdueOnly.value) {
    list = list.filter((t) => t.overdue);
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
  const filter = taskNavStore.consumeFilter();
  if (filter) {
    activeSegment.value = filter.segment;
    overdueOnly.value = !!filter.overdueOnly;
  }
  loadTasks();
});

function setSegment(segment: TaskListSegment) {
  activeSegment.value = segment;
  overdueOnly.value = false;
}

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

function goReport(id: string) {
  uni.navigateTo({ url: `/pages/tasks/report?id=${id}` });
}

function onCreate() {
  uni.navigateTo({ url: "/pages/tasks/create" });
}
</script>

<style lang="scss" scoped>
@import "@/styles/tokens.scss";
@import "@/styles/mixins.scss";
@import "@/styles/tab-page.scss";

.tasks-page__stats {
  margin-top: 28rpx;
}

.tasks-page__filter {
  margin: -8rpx $pm-space-lg 0;
  position: relative;
  z-index: 2;
}

.tasks-page__toolbar {
  padding: 0 $pm-space-lg $pm-space-md;
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
  padding-top: $pm-space-sm;
  padding-bottom: 120rpx;
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
  display: flex;
  align-items: center;
  justify-content: center;
  box-shadow: 0 16rpx 40rpx rgba(37, 99, 235, 0.35);
  z-index: 50;

  &:active {
    transform: scale(0.96);
  }
}
</style>
