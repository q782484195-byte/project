<template>
  <div class="task-table-editor" :class="{ 'is-embedded': embedded }">
    <WangEditor
      v-if="!readonly"
      v-model="html"
      height="100%"
      enable-attachment
      placeholder="请粘贴或编辑表格内容，支持从 Excel 复制、上传附件"
    />
    <div
      v-else
      class="task-table-editor__render"
      v-html="html || emptyText"
      @click="handleRenderLinkClick"
    />
  </div>
</template>

<script setup lang="ts">
import WangEditor from "@/components/WangEditor/index.vue";
import { createAttachmentLinkClickHandler } from "@/utils/attachment";

withDefaults(
  defineProps<{
    readonly?: boolean;
    embedded?: boolean;
  }>(),
  {
    readonly: false,
    embedded: false
  }
);

const html = defineModel<string>({ default: "" });
const handleRenderLinkClick = createAttachmentLinkClickHandler();

const emptyText =
  '<p style="color:#909399;text-align:center;padding:24px 0;">暂无内容</p>';
</script>

<style scoped lang="scss">
.task-table-editor {
  height: 100%;
  min-height: 420px;
  display: flex;
  flex-direction: column;
  border: 1px solid var(--el-border-color);
  border-radius: 4px;
  overflow: visible;
  background: #fff;

  &.is-embedded {
    min-height: 320px;

    :deep(.wang-editor) {
      min-height: 240px;
    }

    .task-table-editor__render {
      min-height: 240px;
    }
  }

  :deep(.wang-editor) {
    border: none;
    border-radius: 0;
    height: 100%;
    min-height: 360px;
  }
}

.task-table-editor__render {
  flex: 1;
  min-height: 360px;
  overflow: auto;
  padding: 16px;
  box-sizing: border-box;
  background: #fff;

  :deep(table) {
    border-collapse: collapse;
    width: 100%;

    td,
    th {
      border: 1px solid #dcdfe6;
      padding: 6px 8px;
      min-width: 40px;
    }
  }

  :deep(a) {
    color: var(--el-color-primary);
    text-decoration: underline;
    word-break: break-all;
    cursor: pointer;
  }
}
</style>
