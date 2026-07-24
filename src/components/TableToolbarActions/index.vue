<script setup lang="ts">
import RefreshIcon from "@/assets/table-bar/refresh.svg?component";
import Fullscreen from "~icons/ri/fullscreen-fill";
import ExitFullscreen from "~icons/ri/fullscreen-exit-fill";
import { IconifyIconOffline } from "@/components/ReIcon";

defineProps<{
  loading?: boolean;
  fullscreen?: boolean;
}>();

const emit = defineEmits<{
  refresh: [];
  "toggle-fullscreen": [];
}>();
</script>

<template>
  <div class="table-toolbar-actions">
    <RefreshIcon
      class="table-toolbar-actions__icon"
      :class="{ 'is-loading': loading }"
      v-tippy="'刷新'"
      @click="emit('refresh')"
    />
    <IconifyIconOffline
      class="table-toolbar-actions__icon"
      :icon="fullscreen ? ExitFullscreen : Fullscreen"
      v-tippy="fullscreen ? '退出全屏' : '全屏'"
      @click="emit('toggle-fullscreen')"
    />
  </div>
</template>

<style scoped lang="scss">
.table-toolbar-actions {
  display: inline-flex;
  align-items: center;
  gap: 10px;
  padding: 2px 4px;

  &__icon {
    width: 16px;
    height: 16px;
    color: var(--el-text-color-regular);
    cursor: pointer;
    outline: none;
    transition: color 0.15s ease;

    &:hover {
      color: var(--el-color-primary);
    }

    &.is-loading {
      animation: table-toolbar-spin 0.8s linear infinite;
    }
  }
}

@keyframes table-toolbar-spin {
  from {
    transform: rotate(0deg);
  }

  to {
    transform: rotate(360deg);
  }
}
</style>
