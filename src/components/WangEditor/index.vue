<template>
  <div class="wang-editor" :class="{
    'is-readonly': readonly,
    'is-auto-height': !height,
    'is-fill': height === '100%'
  }" :style="height && height !== '100%' ? { '--editor-height': height } : undefined">
    <Toolbar v-if="editorRef && !readonly" class="wang-editor-toolbar" :editor="editorRef"
      :default-config="toolbarConfig" mode="default" />
    <Editor v-model="html" class="wang-editor-body" :default-config="editorConfig" mode="default"
      @on-created="handleCreated" />
  </div>
</template>

<script setup lang="ts">
import "@wangeditor-next/editor/dist/css/style.css";
import { shallowRef, computed, watch, onBeforeUnmount } from "vue";
import { Editor, Toolbar } from "@wangeditor-next/editor-for-vue";
import type { IDomEditor, IEditorConfig, IToolbarConfig } from "@wangeditor-next/editor";
import {
  processCustomPaste,
  shouldHandleCustomPaste,
  uploadImageToServer
} from "@/utils/excelPaste";
import {
  registerUploadAttachmentMenu,
  UPLOAD_ATTACHMENT_MENU_KEY
} from "@/utils/wangEditorAttachmentMenu";
import { createAttachmentLinkClickHandler } from "@/utils/attachment";

registerUploadAttachmentMenu();

interface Props {
  readonly?: boolean;
  placeholder?: string;
  height?: string;
  enableAttachment?: boolean;
}

const props = withDefaults(defineProps<Props>(), {
  readonly: false,
  placeholder: "请输入内容，支持从 Excel 粘贴表格、文本及图片",
  enableAttachment: false
});

const html = defineModel<string>({ default: "" });

const editorRef = shallowRef<IDomEditor>();
let attachmentLinkClickHandler: ((event: MouseEvent) => void) | null = null;

const toolbarConfig = computed<Partial<IToolbarConfig>>(() => {
  const config: Partial<IToolbarConfig> = {
    excludeKeys: ["group-video", "fullScreen"]
  };

  if (props.enableAttachment) {
    config.insertKeys = {
      index: 22,
      keys: [UPLOAD_ATTACHMENT_MENU_KEY]
    };
  }

  return config;
});

const editorConfig = computed<Partial<IEditorConfig>>(() => ({
  placeholder: props.placeholder,
  readOnly: props.readonly,
  hoverbarKeys: props.enableAttachment
    ? {
        link: {
          menuKeys: []
        }
      }
    : undefined,
  MENU_CONF: {
    insertTableCol: {
      insertPosition: "after"
    },
    uploadImage: {
      async customUpload(file: File, insertFn: (url: string, alt: string, href: string) => void) {
        const url = await uploadImageToServer(file);
        if (url) {
          insertFn(url, file.name, url);
        }
      }
    }
  },
  customPaste: (editor: IDomEditor, event: ClipboardEvent) => {
    const clipboardData = event.clipboardData;
    if (!clipboardData || !shouldHandleCustomPaste(clipboardData)) {
      return true;
    }
    event.preventDefault();
    void processCustomPaste(editor, clipboardData, {
      enableAttachment: props.enableAttachment
    });
    return false;
  }
}));

const bindAttachmentLinkDownload = (editor: IDomEditor) => {
  if (!props.enableAttachment) return;

  const container = editor.getEditableContainer();
  if (!container) return;

  attachmentLinkClickHandler = createAttachmentLinkClickHandler(container);
  container.addEventListener("click", attachmentLinkClickHandler);
};

const unbindAttachmentLinkDownload = (editor?: IDomEditor | null) => {
  if (!attachmentLinkClickHandler) return;

  const container = editor?.getEditableContainer();
  container?.removeEventListener("click", attachmentLinkClickHandler);
  attachmentLinkClickHandler = null;
};

const handleCreated = (editor: IDomEditor) => {
  editorRef.value = editor;
  bindAttachmentLinkDownload(editor);
};

watch(
  () => props.readonly,
  val => {
    const editor = editorRef.value;
    if (!editor) return;
    if (val) editor.disable();
    else editor.enable();
  }
);

onBeforeUnmount(() => {
  const editor = editorRef.value;
  unbindAttachmentLinkDownload(editor);
  if (editor) editor.destroy();
});
</script>

<style scoped lang="scss">
@mixin editor-menu-tooltip-above {
  .w-e-bar,
  .w-e-bar-item {
    overflow: visible;
  }

  .w-e-bar-item button {
    overflow: visible;
  }

  .w-e-menu-tooltip-v5:not(.tooltip-right) {
    &:before,
    &:after {
      z-index: 100;
    }

    &:before {
      top: auto;
      bottom: calc(100% + 8px);
      left: 50%;
      transform: translateX(-50%);
    }

    &:after {
      top: auto;
      bottom: calc(100% + 3px);
      left: 50%;
      margin-left: -5px;
      border-color: var(--w-e-toolbar-active-color, #333) transparent transparent transparent;
    }
  }
}

.wang-editor {
  width: 100%;
  border: 1px solid var(--el-border-color);
  border-radius: 4px;
  overflow: visible;
  z-index: 0;

  &.is-readonly {
    background: var(--el-fill-color-light);

    .wang-editor-body {
      :deep(.w-e-text-container) {
        background: var(--el-fill-color-light);
      }
    }
  }
}

.wang-editor-toolbar {
  position: relative;
  z-index: 2;
  border-bottom: 1px solid var(--el-border-color);
  overflow: visible;

  :deep() {
    @include editor-menu-tooltip-above;
  }
}

.wang-editor-body {
  height: var(--editor-height);
  overflow: hidden;
  border-radius: 0 0 4px 4px;

  :deep(.w-e-text-container) {
    overflow: visible;
    min-height: var(--editor-height);

    [data-slate-editor] {
      padding: 16px;
      box-sizing: border-box;
    }

    .w-e-textarea-placeholder {
      top: 16px;
      left: 16px;
    }
  }

  :deep(.w-e-hover-bar) {
    overflow: visible;
    z-index: 20;

    @include editor-menu-tooltip-above;
  }

  :deep(table) {
    border-collapse: collapse;
    width: 100%;
    margin: 8px 0;

    td,
    th {
      border: 1px solid #dcdfe6;
      padding: 6px 8px;
      min-width: 40px;
    }

    a {
      color: var(--el-color-primary);
      text-decoration: underline;
      word-break: break-all;
      cursor: pointer;
    }
  }

  :deep(img) {
    max-width: 100%;
    height: auto;
  }

  :deep(a) {
    color: var(--el-color-primary);
    text-decoration: underline;
    word-break: break-all;
    cursor: pointer;
  }
}

.wang-editor.is-auto-height {
  .wang-editor-body {
    height: auto;
    overflow-y: visible;

    :deep(.w-e-text-container) {
      min-height: 280px;
    }
  }
}

.wang-editor.is-fill {
  height: 100%;
  display: flex;
  flex-direction: column;

  .wang-editor-body {
    flex: 1;
    min-height: 0;
    height: auto;
    overflow: hidden;

    :deep(.w-e-text-container) {
      height: 100%;
      min-height: 0;
    }
  }
}
</style>
