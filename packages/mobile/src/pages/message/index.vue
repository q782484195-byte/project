<template>
  <view class="tab-page message-page">
    <pm-tab-header title="消息中心" :subtitle="headerSubtitle">
      <template #extra>
        <view class="tab-icon-btn" @click="markAllRead">
          <text class="message-page__read-btn">已读</text>
        </view>
      </template>
      <template #bottom>
        <scroll-view scroll-x class="message-page__tabs" :show-scrollbar="false">
          <view class="message-page__tabs-inner">
            <view
              v-for="tab in tabs"
              :key="tab.value"
              class="message-page__tab"
              :class="{ 'is-active': activeTab === tab.value }"
              @click="activeTab = tab.value"
            >
              <text>{{ tab.label }}</text>
              <text v-if="tab.badge" class="tab-pill__badge">{{ tab.badge }}</text>
            </view>
          </view>
        </scroll-view>
      </template>
    </pm-tab-header>

    <view v-if="filteredMessages.length" class="message-page__list">
      <view
        v-for="item in filteredMessages"
        :key="item.id"
        class="message-card"
        :class="{ 'message-card--unread': !item.read }"
        @click="openMessage(item.id)"
      >
        <view class="message-card__icon" :class="`message-card__icon--${item.type}`">
          <image
            class="message-card__icon-img"
            :src="`/static/icons/${MSG_ICON_MAP[item.type]}.png`"
            mode="aspectFit"
          />
        </view>
        <view class="message-card__body">
          <view class="message-card__top">
            <text class="message-card__title">{{ item.title }}</text>
            <text class="message-card__time">{{ item.time }}</text>
          </view>
          <text class="message-card__content">{{ item.content }}</text>
          <view class="message-card__footer">
            <text class="message-card__tag">{{ categoryLabel(item.category) }}</text>
            <text v-if="item.taskId" class="message-card__link">查看任务 ›</text>
          </view>
        </view>
        <view v-if="!item.read" class="message-card__dot" />
      </view>
    </view>
    <view v-else class="tab-empty">
      <image
        class="tab-empty__img"
        src="/static/illustrations/empty-task.png"
        mode="aspectFit"
      />
      <text class="tab-empty__text">暂无消息，有新动态会出现在这里</text>
    </view>
  </view>
</template>

<script setup lang="ts">
import { computed, ref } from "vue";
import { onShow } from "@dcloudio/uni-app";
import PmTabHeader from "@/components/pm-tab-header/pm-tab-header.vue";
import { MSG_ICON_MAP, type MobileMessage } from "@/constants/message";
import { selectPendingTasks, selectReportList } from "@/api/task";
import { unwrapList } from "@/utils/api";
import { useUserStore } from "@/stores/user";

const userStore = useUserStore();

const activeTab = ref<"all" | "task" | "system" | "mention">("all");
const messages = ref<MobileMessage[]>([]);

const unreadCount = computed(() => messages.value.filter((m) => !m.read).length);

const headerSubtitle = computed(() => {
  if (!messages.value.length) return "任务汇报与待办提醒将汇总在此";
  if (unreadCount.value > 0) return `${unreadCount.value} 条未读消息，点击查看详情`;
  return "所有消息已读，继续保持";
});

const tabs = computed(() => [
  {
    label: "全部",
    value: "all" as const,
    badge: unreadCount.value || 0
  },
  {
    label: "任务",
    value: "task" as const,
    badge: messages.value.filter((m) => m.category === "task" && !m.read).length
  },
  {
    label: "系统",
    value: "system" as const,
    badge: messages.value.filter((m) => m.category === "system" && !m.read).length
  },
  {
    label: "@我",
    value: "mention" as const,
    badge: messages.value.filter((m) => m.category === "mention" && !m.read).length
  }
]);

const filteredMessages = computed(() => {
  if (activeTab.value === "all") return messages.value;
  return messages.value.filter((m) => m.category === activeTab.value);
});

function categoryLabel(category: MobileMessage["category"]) {
  if (category === "task") return "任务";
  if (category === "system") return "系统";
  if (category === "mention") return "@我";
  return "全部";
}

function openMessage(id: string) {
  const item = messages.value.find((m) => m.id === id);
  if (item) item.read = true;
  if (item?.taskId) {
    uni.navigateTo({ url: `/pages/tasks/detail?id=${item.taskId}` });
    return;
  }
  uni.showToast({ title: "暂无关联任务", icon: "none" });
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
          category: "task" as const,
          taskId: String(item.task_id || "")
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
          category: "task" as const,
          taskId: String(item._id || item.id || "")
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
@import "@/styles/tab-page.scss";

.message-page__read-btn {
  font-size: 24rpx;
  font-weight: $pm-weight-medium;
  color: $pm-primary;
}

.message-page__tabs {
  margin-top: 24rpx;
  white-space: nowrap;
  width: 100%;
}

.message-page__tabs-inner {
  display: inline-flex;
  gap: 12rpx;
  padding-bottom: 4rpx;
}

.message-page__tab {
  display: inline-flex;
  align-items: center;
  gap: 8rpx;
  height: 64rpx;
  padding: 0 28rpx;
  border-radius: $pm-radius-full;
  font-size: $pm-font-caption;
  color: $pm-text-secondary;
  background: rgba(255, 255, 255, 0.72);
  border: 1rpx solid rgba(37, 99, 235, 0.08);

  &.is-active {
    color: $pm-primary;
    background: #fff;
    border-color: rgba(37, 99, 235, 0.22);
    font-weight: $pm-weight-semibold;
    box-shadow: 0 4rpx 12rpx rgba(37, 99, 235, 0.1);
  }
}

.message-page__list {
  padding: $pm-space-lg;
  display: flex;
  flex-direction: column;
  gap: $pm-space-sm;
}

.message-card {
  display: flex;
  align-items: flex-start;
  gap: 20rpx;
  padding: 28rpx;
  background: $pm-bg-card;
  border: 1rpx solid $pm-border;
  border-radius: $pm-radius-xl;
  box-shadow: 0 6rpx 20rpx rgba(15, 23, 42, 0.04);
  position: relative;

  &:active {
    background: $pm-bg-hover;
  }

  &--unread {
    border-color: rgba(37, 99, 235, 0.16);
    background: linear-gradient(135deg, #fff 0%, #f8fbff 100%);
  }
}

.message-card__icon {
  width: 80rpx;
  height: 80rpx;
  border-radius: 22rpx;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.message-card__icon--report {
  background: $pm-success-light;
}

.message-card__icon--due {
  background: $pm-warning-light;
}

.message-card__icon--assign {
  background: $pm-primary-light;
}

.message-card__icon--status {
  background: $pm-info-light;
}

.message-card__icon--mention {
  background: #f5f3ff;
}

.message-card__icon-img {
  width: 44rpx;
  height: 44rpx;
}

.message-card__body {
  flex: 1;
  min-width: 0;
}

.message-card__top {
  @include pm-flex-between;
  gap: $pm-space-md;
  margin-bottom: 10rpx;
}

.message-card__title {
  font-size: $pm-font-body;
  font-weight: $pm-weight-semibold;
  color: $pm-text-primary;
  @include pm-ellipsis;
  flex: 1;
  min-width: 0;
}

.message-card__time {
  font-size: $pm-font-mini;
  color: $pm-text-placeholder;
  flex-shrink: 0;
}

.message-card__content {
  display: block;
  font-size: $pm-font-caption;
  color: $pm-text-secondary;
  line-height: 1.5;
  @include pm-ellipsis-multi(2);
}

.message-card__footer {
  @include pm-flex-between;
  margin-top: 16rpx;
  gap: $pm-space-sm;
}

.message-card__tag {
  font-size: 22rpx;
  color: $pm-text-placeholder;
  padding: 4rpx 14rpx;
  border-radius: $pm-radius-full;
  background: $pm-bg-muted;
}

.message-card__link {
  font-size: $pm-font-mini;
  color: $pm-primary;
  font-weight: $pm-weight-medium;
}

.message-card__dot {
  position: absolute;
  top: 28rpx;
  right: 28rpx;
  width: 14rpx;
  height: 14rpx;
  border-radius: 50%;
  background: $pm-primary;
}
</style>
