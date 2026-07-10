<template>
  <view class="task-detail-page">
    <view class="task-detail-page__head">
      <text class="task-detail-page__title">{{ task.title }}</text>
      <view class="task-detail-page__tags">
        <pm-status-tag :label="statusLabel" :tone="getStatusTone(task.status)" />
        <pm-status-tag :label="task.priority" :tone="getPriorityTone(task.priority)" />
        <pm-status-tag label="前端" tone="info" />
      </view>
    </view>

    <view class="task-detail-page__panel">
      <view v-for="row in infoRows" :key="row.label" class="task-detail-page__row">
        <text class="task-detail-page__label">{{ row.label }}</text>
        <view v-if="row.progress != null" class="task-detail-page__progress">
          <view class="task-detail-page__track">
            <view
              class="task-detail-page__fill"
              :style="{ width: `${row.progress}%` }"
            />
          </view>
          <text class="task-detail-page__value">{{ row.progress }}%</text>
        </view>
        <text v-else class="task-detail-page__value">{{ row.value }}</text>
      </view>
    </view>

    <view class="task-detail-page__panel">
      <text class="task-detail-page__panel-title">任务描述</text>
      <text class="task-detail-page__desc">{{ task.description }}</text>
    </view>

    <view class="task-detail-page__panel">
      <text class="task-detail-page__panel-title">附件（{{ attachments.length }}）</text>
      <view
        v-for="file in attachments"
        :key="file.id"
        class="attach-row"
        @click="onAttach(file.name)"
      >
        <view class="attach-row__icon">
          <pm-icon name="attach" :size="56" />
        </view>
        <view class="attach-row__body">
          <text class="attach-row__name">{{ file.name }}</text>
          <text class="attach-row__size">{{ file.size }}</text>
        </view>
        <text class="attach-row__ext">{{ file.ext }}</text>
      </view>
    </view>

    <view class="task-detail-page__panel">
      <text class="task-detail-page__panel-title">动态</text>
      <view class="timeline">
        <view v-for="item in timeline" :key="item.id" class="timeline__item">
          <view
            class="timeline__dot"
            :class="{ 'timeline__dot--mute': !item.active }"
          />
          <view class="timeline__content">
            <text class="timeline__text">{{ item.text }}</text>
            <text class="timeline__time">{{ item.time }}</text>
          </view>
        </view>
      </view>
    </view>

    <view class="task-detail-page__comment" @click="onComment">
      写评论或 @同事…
    </view>

    <view class="task-detail-page__footer">
      <pm-action-bar
        secondary-text="记录 BUG"
        primary-text="进度汇报"
        @secondary="handleBug"
        @primary="handleReport"
      />
    </view>
  </view>
</template>

<script setup lang="ts">
import { computed, ref } from "vue";
import { onLoad } from "@dcloudio/uni-app";
import PmStatusTag from "@/components/pm-status-tag/pm-status-tag.vue";
import PmActionBar from "@/components/pm-action-bar/pm-action-bar.vue";
import PmIcon from "@/components/pm-icon/pm-icon.vue";
import { getTaskInfo, selectReportList } from "@/api/task";
import { unwrapItem, unwrapList } from "@/utils/api";
import { getPriorityTone, getStatusTone } from "@/utils/status";
import {
  getTaskDescription,
  mapTaskToMobile,
  type MobileTask
} from "@/utils/task-mapper";

const taskId = ref("");
const task = ref<MobileTask>({
  id: "",
  title: "加载中...",
  status: "待办",
  priority: "中",
  project: "-",
  projectId: "",
  progress: 0,
  dueDate: "-",
  assignee: "-",
  description: "",
  tags: [],
  meta: "-"
});
const attachments = ref<Array<{ id: string; name: string; size: string; ext: string }>>([]);
const timeline = ref<Array<{ id: string; text: string; time: string; active?: boolean }>>([]);
const loading = ref(false);

const statusLabel = computed(() =>
  task.value.status === "任务进行中" ? "进行中" : task.value.status
);

const infoRows = computed(() => [
  { label: "所属项目", value: task.value.project },
  { label: "当前处理人", value: task.value.assignee },
  { label: "协作人", value: task.value.collaborators || "-" },
  { label: "计划完成", value: formatDueDate(task.value.dueDate) },
  { label: "进度", progress: task.value.progress }
]);

function formatDueDate(due: string) {
  if (!due || due === "-") return "-";
  if (due.length === 5 && /^\d{2}-\d{2}$/.test(due)) {
    const year = new Date().getFullYear();
    return `${year}-${due}`;
  }
  return due;
}

function mapAttachments(raw: unknown[] = []) {
  return raw.map((item, index) => {
    const name =
      typeof item === "string"
        ? item.split("/").pop() || `附件${index + 1}`
        : String((item as { name?: string }).name || `附件${index + 1}`);
    const ext = name.includes(".") ? name.split(".").pop()?.toUpperCase() || "FILE" : "FILE";
    return {
      id: `attach-${index}`,
      name,
      size: "-",
      ext
    };
  });
}

async function loadTaskDetail(id: string) {
  loading.value = true;
  try {
    const infoRes = await getTaskInfo(id);
    const raw = unwrapItem(infoRes);
    if (!raw) throw new Error("未找到任务详情");

    task.value = mapTaskToMobile({
      ...raw,
      description: getTaskDescription(raw)
    });
    attachments.value = mapAttachments(
      Array.isArray(raw.attachment) ? raw.attachment : []
    );

    // 汇报失败不影响详情主体展示
    try {
      const reportRes = await selectReportList({
        task_id: id,
        page: 1,
        page_size: 20
      });
      timeline.value = unwrapList(reportRes).map((item, index) => ({
        id: String(item._id || `report-${index}`),
        text: `${item.creator || "成员"} 汇报：${item.message || "进度更新"}（${item.progress ?? 0}%）`,
        time: String(item.create_time || "-"),
        active: index === 0
      }));
    } catch {
      timeline.value = [];
    }

    if (!timeline.value.length && Array.isArray(raw.历史记录)) {
      timeline.value = raw.历史记录.map((text, index) => ({
        id: `history-${index}`,
        text,
        time: "-",
        active: index === 0
      }));
    }
  } catch (error) {
    uni.showToast({
      title: error instanceof Error ? error.message : "加载任务详情失败",
      icon: "none"
    });
  } finally {
    loading.value = false;
  }
}

onLoad((query) => {
  if (query?.id) {
    taskId.value = String(query.id);
    loadTaskDetail(taskId.value);
  }
});

function handleBug() {
  uni.showToast({ title: "请在 PC 端记录 BUG", icon: "none" });
}

function handleReport() {
  uni.showToast({ title: "请在 PC 端提交进度汇报", icon: "none" });
}

function onComment() {
  uni.showToast({ title: "请在 PC 端评论", icon: "none" });
}

function onAttach(name: string) {
  uni.showToast({ title: name, icon: "none" });
}
</script>

<style lang="scss" scoped>
@import "@/styles/tokens.scss";
@import "@/styles/mixins.scss";

.task-detail-page {
  @include pm-page;
  padding-bottom: calc(
    #{$pm-action-bar-height} + #{$pm-space-2xl} + env(safe-area-inset-bottom)
  );
}

.task-detail-page__head {
  padding: $pm-space-lg;
  background: $pm-bg-card;
  border-bottom: 1rpx solid $pm-border;
}

.task-detail-page__title {
  display: block;
  font-size: 40rpx;
  font-weight: $pm-weight-semibold;
  line-height: 1.35;
  color: $pm-text-primary;
  margin-bottom: 20rpx;
}

.task-detail-page__tags {
  display: flex;
  flex-wrap: wrap;
  gap: $pm-space-sm;
}

.task-detail-page__panel {
  margin-top: $pm-space-md;
  background: $pm-bg-card;
  border-top: 1rpx solid $pm-border;
  border-bottom: 1rpx solid $pm-border;
  padding: 8rpx $pm-space-lg;
}

.task-detail-page__panel-title {
  display: block;
  font-size: $pm-font-caption;
  font-weight: $pm-weight-semibold;
  color: $pm-text-secondary;
  padding: 24rpx 0 8rpx;
}

.task-detail-page__row {
  @include pm-flex-between;
  align-items: center;
  gap: $pm-space-md;
  padding: 24rpx 0;
  border-bottom: 1rpx solid $pm-border;

  &:last-child {
    border-bottom: none;
  }
}

.task-detail-page__label {
  font-size: 28rpx;
  color: $pm-text-secondary;
  flex-shrink: 0;
}

.task-detail-page__value {
  font-size: 28rpx;
  color: $pm-text-primary;
  font-weight: $pm-weight-medium;
  text-align: right;
}

.task-detail-page__progress {
  display: flex;
  align-items: center;
  gap: 16rpx;
}

.task-detail-page__track {
  width: 144rpx;
  height: 8rpx;
  border-radius: 4rpx;
  background: $pm-bg-muted;
  overflow: hidden;
}

.task-detail-page__fill {
  height: 100%;
  background: $pm-primary;
  border-radius: 4rpx;
}

.task-detail-page__desc {
  display: block;
  padding: 8rpx 0 28rpx;
  font-size: 28rpx;
  line-height: 1.6;
  color: $pm-text-primary;
}

.attach-row {
  display: flex;
  align-items: center;
  gap: 20rpx;
  padding: 20rpx 0;
  border-bottom: 1rpx solid $pm-border;

  &:last-child {
    border-bottom: none;
  }
}

.attach-row__body {
  flex: 1;
  min-width: 0;
}

.attach-row__name {
  display: block;
  font-size: $pm-font-caption;
  color: $pm-text-primary;
  @include pm-ellipsis;
}

.attach-row__size {
  display: block;
  margin-top: 4rpx;
  font-size: $pm-font-mini;
  color: $pm-text-placeholder;
}

.attach-row__ext {
  font-size: $pm-font-mini;
  color: $pm-text-secondary;
  font-weight: $pm-weight-semibold;
}

.timeline {
  padding: 8rpx 0 24rpx;
}

.timeline__item {
  display: flex;
  gap: 24rpx;
  position: relative;
  padding-bottom: 28rpx;

  &:last-child {
    padding-bottom: 0;
  }

  &:not(:last-child)::before {
    content: "";
    position: absolute;
    left: 10rpx;
    top: 28rpx;
    bottom: 0;
    width: 2rpx;
    background: $pm-border;
  }
}

.timeline__dot {
  width: 22rpx;
  height: 22rpx;
  border-radius: 50%;
  background: $pm-primary;
  margin-top: 6rpx;
  flex-shrink: 0;
  z-index: 1;
}

.timeline__dot--mute {
  background: $pm-text-placeholder;
}

.timeline__content {
  flex: 1;
  min-width: 0;
}

.timeline__text {
  display: block;
  font-size: $pm-font-caption;
  color: $pm-text-primary;
  line-height: 1.45;
}

.timeline__time {
  display: block;
  margin-top: 4rpx;
  font-size: $pm-font-mini;
  color: $pm-text-placeholder;
}

.task-detail-page__comment {
  margin: $pm-space-md $pm-space-lg 0;
  padding: 24rpx;
  background: $pm-bg-card;
  border: 1rpx solid $pm-border;
  border-radius: $pm-radius-xl;
  color: $pm-text-placeholder;
  font-size: 28rpx;
}

.task-detail-page__footer {
  position: fixed;
  left: 0;
  right: 0;
  bottom: 0;
  z-index: 100;
  background: $pm-bg-card;
  border-top: 1rpx solid $pm-border;
  padding: $pm-space-md $pm-space-lg;
  padding-bottom: calc(#{$pm-space-md} + env(safe-area-inset-bottom));
}
</style>
