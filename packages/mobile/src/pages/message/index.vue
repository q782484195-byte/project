<template>
  <view class="message-page">
    <view class="message-page__tabs">
      <view
        v-for="tab in tabs"
        :key="tab.value"
        class="message-page__tab"
        :class="{ 'is-active': activeTab === tab.value }"
        @click="activeTab = tab.value"
      >
        <text>{{ tab.label }}</text>
        <text v-if="tab.badge" class="message-page__badge">{{ tab.badge }}</text>
      </view>
    </view>

    <view class="message-page__toolbar">
      <text class="message-page__read-all" @click="markAllRead">全部标为已读</text>
    </view>

    <view class="message-page__list" v-if="filteredMessages.length">
      <view
        v-for="item in filteredMessages"
        :key="item.id"
        class="message-page__item"
        @click="openMessage(item.id)"
      >
        <image
          class="message-page__type"
          :src="`/static/icons/${MSG_ICON_MAP[item.type]}.png`"
          mode="aspectFit"
        />
        <view class="message-page__body">
          <view class="message-page__top">
            <text class="message-page__title">{{ item.title }}</text>
            <text class="message-page__time">{{ item.time }}</text>
          </view>
          <text class="message-page__content">{{ item.content }}</text>
        </view>
        <view
          class="message-page__dot"
          :class="{ 'message-page__dot--read': item.read }"
        />
      </view>
    </view>
    <view v-else class="message-page__empty">
      <image
        class="message-page__empty-img"
        src="/static/illustrations/empty-task.png"
        mode="aspectFit"
      />
      <text class="message-page__empty-text">暂无消息</text>
    </view>
  </view>
</template>

<script setup lang="ts">
import { computed, ref } from "vue";
import { onShow } from "@dcloudio/uni-app";
import { MSG_ICON_MAP, type MobileMessage } from "@/constants/message";
import { selectPendingTasks, selectReportList } from "@/api/task";
import { unwrapList } from "@/utils/api";
import { useUserStore } from "@/stores/user";

const userStore = useUserStore();

const activeTab = ref<"all" | "task" | "system" | "mention">("all");
const messages = ref<MobileMessage[]>([]);

const unreadCount = computed(() => messages.value.filter((m) => !m.read).length);

const tabs = computed(() => [
  { label: "全部", value: "all" as const, badge: unreadCount.value || 0 },
  { label: "任务", value: "task" as const, badge: 0 },
  { label: "系统", value: "system" as const, badge: 0 },
  { label: "@我", value: "mention" as const, badge: 0 }
]);

const filteredMessages = computed(() => {
  if (activeTab.value === "all") return messages.value;
  return messages.value.filter((m) => m.category === activeTab.value);
});

function openMessage(id: string) {
  const item = messages.value.find((m) => m.id === id);
  if (item) item.read = true;
  uni.showToast({ title: `消息 ${id}`, icon: "none" });
}

function markAllRead() {
  messages.value.forEach((m) => {
    m.read = true;
  });
  uni.showToast({ title: "已全部标为已读", icon: "success" });
}

function formatMessageTime(value?: string) {
  if (!value) return "-";
  const text = String(value);
  return text.length > 16 ? text.slice(5, 16) : text;
}

async function loadMessages() {
  try {
    const [reportRes, pendingRes] = await Promise.all([
      selectReportList({ page: 1, page_size: 20 }).catch(() => null),
      selectPendingTasks({ page: 1, page_size: 10 }).catch(() => null)
    ]);

    if (!reportRes && !pendingRes) {
      throw new Error("加载消息失败");
    }

    const reportMessages: MobileMessage[] = reportRes
      ? unwrapList(reportRes).map((item, index) => ({
          id: String(item._id || `report-${index}`),
          type: "report" as const,
          title: "进度汇报",
          content: `${item.creator || "成员"} 汇报了「${item.task_name || "任务"}」：${item.message || "进度更新"}`,
          time: formatMessageTime(item.create_time),
          read: false,
          category: "task" as const
        }))
      : [];

    const pendingMessages: MobileMessage[] = pendingRes
      ? unwrapList(pendingRes).map((item, index) => ({
          id: String(item._id || item.id || `pending-${index}`),
          type: "due" as const,
          title: "待办提醒",
          content: `「${item.任务名 || item.task_name || "任务"}」待处理，状态：${item.状态 || item.status || "-"}`,
          time: formatMessageTime(item.create_time),
          read: false,
          category: "task" as const
        }))
      : [];

    messages.value = [...pendingMessages, ...reportMessages];
  } catch (error) {
    messages.value = [];
    uni.showToast({
      title: error instanceof Error ? error.message : "加载消息失败",
      icon: "none"
    });
  }
}

onShow(() => {
  if (!userStore.isLoggedIn) {
    uni.reLaunch({ url: "/pages/login/index" });
    return;
  }
  loadMessages();
});
</script>

<style lang="scss" scoped>
@import "@/styles/tokens.scss";
@import "@/styles/mixins.scss";

.message-page {
  min-height: 100vh;
  background: $pm-bg-page;
  padding-bottom: calc(
    #{$pm-tabbar-height} + #{$pm-space-lg} + env(safe-area-inset-bottom)
  );
  box-sizing: border-box;
}

.message-page__tabs {
  display: flex;
  background: $pm-bg-card;
  border-bottom: 1rpx solid $pm-border;
  padding: 0 16rpx;
}

.message-page__tab {
  flex: 1;
  height: 80rpx;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8rpx;
  font-size: $pm-font-caption;
  color: $pm-text-secondary;
  position: relative;

  &.is-active {
    color: $pm-primary;
    font-weight: $pm-weight-semibold;

    &::after {
      content: "";
      position: absolute;
      left: 20%;
      right: 20%;
      bottom: 0;
      height: 4rpx;
      background: $pm-primary;
      border-radius: 2rpx;
    }
  }
}

.message-page__badge {
  min-width: 32rpx;
  height: 32rpx;
  padding: 0 8rpx;
  border-radius: 16rpx;
  background: $pm-danger;
  color: #fff;
  font-size: 20rpx;
  font-weight: $pm-weight-semibold;
  display: inline-flex;
  align-items: center;
  justify-content: center;
}

.message-page__toolbar {
  display: flex;
  justify-content: flex-end;
  padding: 16rpx $pm-space-lg;
  background: $pm-bg-card;
  border-bottom: 1rpx solid $pm-border;
}

.message-page__read-all {
  font-size: $pm-font-caption;
  color: $pm-primary;
  font-weight: $pm-weight-medium;
}

.message-page__list {
  background: $pm-bg-card;
}

.message-page__item {
  display: flex;
  align-items: flex-start;
  gap: 20rpx;
  padding: 28rpx $pm-space-lg;
  border-bottom: 1rpx solid $pm-border;

  &:active {
    background: $pm-bg-hover;
  }
}

.message-page__type {
  width: 72rpx;
  height: 72rpx;
  flex-shrink: 0;
  border-radius: 20rpx;
}

.message-page__body {
  flex: 1;
  min-width: 0;
}

.message-page__top {
  @include pm-flex-between;
  gap: $pm-space-md;
  margin-bottom: 8rpx;
}

.message-page__title {
  font-size: $pm-font-body;
  font-weight: $pm-weight-semibold;
  color: $pm-text-primary;
  @include pm-ellipsis;
  flex: 1;
  min-width: 0;
}

.message-page__time {
  font-size: $pm-font-mini;
  color: $pm-text-placeholder;
  flex-shrink: 0;
}

.message-page__content {
  font-size: $pm-font-caption;
  color: $pm-text-secondary;
  line-height: 1.45;
  @include pm-ellipsis;
}

.message-page__dot {
  width: 16rpx;
  height: 16rpx;
  border-radius: 50%;
  background: $pm-primary;
  margin-top: 28rpx;
  flex-shrink: 0;
}

.message-page__dot--read {
  background: transparent;
}

.message-page__empty {
  padding: 80rpx $pm-space-lg;
  display: flex;
  flex-direction: column;
  align-items: center;
}

.message-page__empty-img {
  width: 240rpx;
  height: 240rpx;
  margin-bottom: $pm-space-md;
}

.message-page__empty-text {
  font-size: $pm-font-caption;
  color: $pm-text-placeholder;
}
</style>
