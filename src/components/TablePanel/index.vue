<script setup lang="ts">
import { ref, nextTick, onUnmounted, watch } from "vue";
import TableToolbarActions from "@/components/TableToolbarActions/index.vue";

const props = withDefaults(
  defineProps<{
    loading?: boolean;
    showToolbar?: boolean;
  }>(),
  {
    loading: false,
    showToolbar: true
  }
);

const emit = defineEmits<{
  refresh: [];
  "fullscreen-change": [value: boolean];
}>();

const panelRef = ref<HTMLElement>();
const isFullscreen = ref(false);

async function setFullscreen(value: boolean) {
  if (isFullscreen.value === value) return;
  isFullscreen.value = value;
  await nextTick();
  emit("fullscreen-change", value);
}

function toggleFullscreen() {
  void setFullscreen(!isFullscreen.value);
}

function exitFullscreen() {
  void setFullscreen(false);
}

function handleKeydown(event: KeyboardEvent) {
  if (event.key === "Escape") {
    exitFullscreen();
  }
}

watch(isFullscreen, value => {
  if (value) {
    window.addEventListener("keydown", handleKeydown);
  } else {
    window.removeEventListener("keydown", handleKeydown);
  }
});

onUnmounted(() => {
  window.removeEventListener("keydown", handleKeydown);
});

function handleRefresh() {
  emit("refresh");
}

defineExpose({
  panelRef,
  isFullscreen,
  toggleFullscreen,
  exitFullscreen
});
</script>

<template>
  <div
    ref="panelRef"
    class="table-panel"
    :class="{ 'table-panel--fullscreen': isFullscreen }"
  >
    <div v-if="showToolbar" class="table-panel__toolbar">
      <div v-if="$slots['toolbar-extra']" class="table-panel__toolbar-extra">
        <slot name="toolbar-extra" />
      </div>
      <TableToolbarActions
        :loading="loading"
        :fullscreen="isFullscreen"
        @refresh="handleRefresh"
        @toggle-fullscreen="toggleFullscreen"
      />
    </div>
    <div class="table-panel__body">
      <slot :fullscreen="isFullscreen" />
    </div>
  </div>
</template>

<style scoped lang="scss">
.table-panel {
  display: flex;
  flex-direction: column;
  width: 100%;

  &__toolbar {
    display: flex;
    align-items: center;
    justify-content: flex-end;
    gap: 8px;
    flex-shrink: 0;
    min-height: 32px;
    margin-bottom: 8px;
    padding: 0 2px;
  }

  &__toolbar-extra {
    display: flex;
    align-items: center;
    padding-right: 8px;
    border-right: 1px solid var(--el-border-color-lighter);
    margin-right: 2px;
  }

  &__body {
    flex: 1;
    min-height: 0;
    width: 100%;
  }

  &--fullscreen {
    position: fixed;
    inset: 0;
    z-index: 2002;
    display: flex;
    flex-direction: column;
    padding: 16px;
    background: var(--el-bg-color);
    box-sizing: border-box;

    .table-panel__toolbar {
      margin-bottom: 12px;
    }

    .table-panel__body {
      flex: 1;
      min-height: 0;
      display: flex;
      flex-direction: column;
    }

    :deep(.el-table) {
      flex: 1;
      min-height: 0;
    }
  }
}
</style>
