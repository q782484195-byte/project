<template>
  <div class="rich-text-editor">
    <div v-if="editor" class="editor-toolbar">
      <button type="button" @click="handleImageUpload">插入图片</button>
    </div>
    <EditorContent :editor="editor" class="editor-content" />
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, onBeforeUnmount, watch } from "vue";
import { useEditor, EditorContent } from "@tiptap/vue-3";
import StarterKit from "@tiptap/starter-kit";
import Image from "@tiptap/extension-image";
import { ElMessage } from "element-plus";
import type { DescribeContent } from "@/api/project";
import { uploadFile } from "@/api/project";

interface Props {
  modelValue: DescribeContent[];
}

interface Emits {
  (e: "update:modelValue", value: DescribeContent[]): void;
}

const props = defineProps<Props>();
const emit = defineEmits<Emits>();

// 标志位：防止循环更新导致光标位置丢失
const isInternalUpdate = ref(false);

const editor = useEditor({
  extensions: [
    StarterKit,
    Image.extend({
      addAttributes() {
        return {
          ...this.parent?.(),
          "data-file-path": {
            default: null,
            parseHTML: element => element.getAttribute("data-file-path"),
            renderHTML: attributes => {
              if (!attributes["data-file-path"]) {
                return {};
              }
              return {
                "data-file-path": attributes["data-file-path"]
              };
            }
          }
        };
      }
    }).configure({
      inline: false,
      allowBase64: true
    })
  ],
  content: "",
  onUpdate: ({ editor }) => {
    // 标记为内部更新，避免触发 watch
    isInternalUpdate.value = true;
    const html = editor.getHTML();
    const content = htmlToContent(html);
    emit("update:modelValue", content);
    // 使用 nextTick 确保在下一个事件循环中重置标志
    setTimeout(() => {
      isInternalUpdate.value = false;
    }, 0);
  }
});

const fileMap = ref<
  Map<string, { file: File; url: string; serverUrl?: string }>
>(new Map());

// 获取图片 URL（处理文件路径）
// 显示时：相对路径需要拼接 baseUrl 为完整 URL
// 提交时：完整 URL 需要转换为相对路径（在 ProjectFormDialog 中处理）
const getImageUrl = (filePath: string): string => {
  // 如果已经是完整 URL，直接返回
  if (filePath.startsWith("http://") || filePath.startsWith("https://")) {
    return filePath;
  }

  // 使用环境变量 VITE_GLOB_API_URL 拼接图片 URL
  const baseUrl = import.meta.env.VITE_GLOB_API_URL || "";

  if (!baseUrl) {
    // 如果没有 baseUrl，返回原始路径
    return filePath;
  }

  // filePath 是相对路径（如 /data/xxx.png 或 data/xxx.png）
  let path = filePath;

  // 确保 path 以 / 开头（如果 baseUrl 不以 / 结尾）
  if (!path.startsWith("/")) {
    path = "/" + path;
  }

  // 拼接 baseUrl 和 path
  // 如果 baseUrl 以 / 结尾，去掉末尾的 /
  const normalizedBaseUrl = baseUrl.endsWith("/")
    ? baseUrl.slice(0, -1)
    : baseUrl;

  // 拼接：baseUrl + path（path 已经以 / 开头）
  return normalizedBaseUrl + path;
};

// 将 DescribeContent[] 转换为 HTML
const contentToHtml = (content: DescribeContent[]): string => {
  if (!content || content.length === 0) return "";

  const htmlParts: string[] = [];
  content.forEach(item => {
    if (item.type === "text") {
      const text = item.content.replace(/\n/g, "<br/>");
      if (text.trim()) {
        htmlParts.push(`<p>${text}</p>`);
      }
    } else if (item.type === "url") {
      // URL 类型的图片，使用 getImageUrl 处理（可能包含完整 URL 或相对路径）
      // item.content 可能是相对路径（如 /data/xxx.png）或完整 URL
      // 显示时使用完整 URL，data-file-path 保存相对路径用于提交
      const relativePath =
        item.content.startsWith("http://") ||
        item.content.startsWith("https://")
          ? (() => {
              try {
                const urlObj = new URL(item.content);
                return urlObj.pathname;
              } catch (e) {
                return item.content;
              }
            })()
          : item.content;
      const imageUrl = getImageUrl(relativePath);
      htmlParts.push(
        `<p><img src="${imageUrl}" alt="图片" style="max-width: 30%;" data-file-path="${relativePath}"/></p>`
      );
    } else if (item.type === "file") {
      // 文件类型的图片
      let imageUrl = "#";
      let filePath = item.content; // 使用 content 作为文件路径

      // 首先查找 fileMap 中是否有对应的文件（新上传的文件）
      let foundInMap = false;
      fileMap.value.forEach((value, path) => {
        if (path === item.content || value.file.name === item.content) {
          imageUrl = value.url;
          filePath = path;
          foundInMap = true;
        }
      });

      // 如果 fileMap 中没有找到，说明是已存在的服务器文件，使用 VITE_GLOB_API_URL 拼接
      if (!foundInMap) {
        imageUrl = getImageUrl(filePath);
      }

      htmlParts.push(
        `<p><img src="${imageUrl}" alt="${filePath}" style="max-width: 30%;" data-file-path="${filePath}"/></p>`
      );
    }
  });
  return htmlParts.join("");
};

// 将 HTML 转换为 DescribeContent[]
const htmlToContent = (html: string): DescribeContent[] => {
  if (!html || html === "<p></p>") return [];

  const parser = new DOMParser();
  const doc = parser.parseFromString(html, "text/html");
  const content: DescribeContent[] = [];
  const processedImageSrcs = new Set<string>(); // 用于跟踪已处理的图片 src，避免重复

  // 先建立图片 src 到服务器 URL 的映射
  const imageMap = new Map<string, string>(); // src -> serverUrl 映射
  const allImages = doc.body.querySelectorAll("img");

  allImages.forEach(img => {
    const src = img.getAttribute("src") || "";
    if (!src || processedImageSrcs.has(src)) {
      return;
    }
    processedImageSrcs.add(src);

    const filePath = img.getAttribute("data-file-path") || "";

    // 如果 src 是 base64 或 blob，尝试从 fileMap 中获取服务器 URL
    if (src.startsWith("blob:") || src.startsWith("data:")) {
      let serverUrl = filePath;
      fileMap.value.forEach((value, key) => {
        if (value.url === src || key === filePath) {
          serverUrl = value.serverUrl || filePath || key;
        }
      });
      if (
        serverUrl &&
        !serverUrl.startsWith("blob:") &&
        !serverUrl.startsWith("data:")
      ) {
        imageMap.set(src, serverUrl);
      }
    } else if (
      src !== "#" &&
      !src.startsWith("blob:") &&
      !src.startsWith("data:")
    ) {
      // src 是完整 URL 或相对路径
      // 优先使用 data-file-path（相对路径），如果没有则从完整 URL 中提取
      if (filePath) {
        // 使用 data-file-path 中的相对路径
        imageMap.set(src, filePath);
      } else if (src.startsWith("http://") || src.startsWith("https://")) {
        // 从完整 URL 中提取相对路径
        try {
          const urlObj = new URL(src);
          imageMap.set(src, urlObj.pathname);
        } catch (e) {
          imageMap.set(src, src);
        }
      } else {
        // 已经是相对路径
        imageMap.set(src, src);
      }
    }
  });

  // 按顺序遍历所有节点
  const walkNodes = (node: Node) => {
    if (node.nodeType === Node.ELEMENT_NODE) {
      const element = node as HTMLElement;

      // 如果是图片节点
      if (element.tagName === "IMG") {
        const img = element as HTMLImageElement;
        const src = img.getAttribute("src") || "";
        const serverUrl = imageMap.get(src);
        if (serverUrl) {
          content.push({
            type: "url",
            content: serverUrl
          });
        }
      } else {
        // 递归处理子节点
        Array.from(element.childNodes).forEach(child => walkNodes(child));
      }
    } else if (node.nodeType === Node.TEXT_NODE) {
      // 处理文本节点
      const text = node.textContent || "";
      if (text.trim()) {
        content.push({
          type: "text",
          content: text.trim()
        });
      }
    }
  };

  // 遍历 body 的所有直接子节点
  Array.from(doc.body.childNodes).forEach(node => walkNodes(node));

  return content;
};

// 处理图片上传
const handleImageUpload = async () => {
  const input = document.createElement("input");
  input.setAttribute("type", "file");
  input.setAttribute("accept", "image/*");
  input.click();

  input.onchange = async () => {
    const file = input.files?.[0];
    if (file && editor.value) {
      try {
        // 先显示 base64 预览
        const reader = new FileReader();
        reader.onload = async () => {
          const base64Url = reader.result as string;

          // 调用上传接口
          const response = await uploadFile({ file });

          if (response.code === 200 && response.url) {
            // 上传成功，服务器返回的是相对路径（如 /data/xxx.png）
            const relativePath = response.url;
            // 转换为完整 URL 用于显示
            const fullImageUrl = getImageUrl(relativePath);

            // 保存文件映射，使用相对路径作为 key（用于提交时识别）
            fileMap.value.set(relativePath, {
              file,
              url: base64Url,
              serverUrl: relativePath
            });

            // 插入图片到编辑器
            // src 使用完整 URL 用于显示
            // data-file-path 保存相对路径用于提交
            editor.value
              ?.chain()
              .focus()
              .setImage({
                src: fullImageUrl,
                alt: file.name,
                "data-file-path": relativePath
              } as any)
              .run();

            ElMessage.success("图片上传成功");
          } else {
            ElMessage.error("图片上传失败");
          }
        };
        reader.readAsDataURL(file);
      } catch (error: any) {
        console.error("上传图片失败:", error);
        ElMessage.error(
          error?.response?.data?.message || error?.message || "图片上传失败"
        );
      }
    }
  };
};

// 监听外部值变化（只在外部真正改变时更新，避免用户输入时触发）
watch(
  () => props.modelValue,
  newVal => {
    if (!editor.value || isInternalUpdate.value) {
      // 如果是内部更新（用户输入），不更新编辑器内容，避免光标位置丢失
      return;
    }

    const currentHtml = editor.value.getHTML();
    const expectedHtml = contentToHtml(newVal);

    // 只有当内容真正不同时才更新（通常是外部设置或初始化）
    if (currentHtml !== expectedHtml) {
      // 保存当前光标位置
      const { from, to } = editor.value.state.selection;

      // 更新内容（不触发事务，避免触发 onUpdate）
      editor.value.commands.setContent(expectedHtml, { emitUpdate: false });

      // 尝试恢复光标位置（如果位置仍然有效）
      try {
        const docSize = editor.value.state.doc.content.size;
        const safeFrom = Math.min(from, docSize);
        const safeTo = Math.min(to, docSize);
        editor.value.commands.setTextSelection({ from: safeFrom, to: safeTo });
      } catch (e) {
        // 如果恢复失败，光标会保持在文档末尾，这是默认行为
      }
    }
  },
  { deep: true }
);

// 初始化编辑器内容
watch(
  () => editor.value,
  newEditor => {
    if (newEditor && props.modelValue && props.modelValue.length > 0) {
      const html = contentToHtml(props.modelValue);
      newEditor.commands.setContent(html);
    }
  }
);

// 获取已上传的图片 URL 列表（用于表单提交）
const getImageUrls = (): string[] => {
  const urls: string[] = [];
  fileMap.value.forEach(value => {
    if (value.serverUrl) {
      urls.push(value.serverUrl);
    }
  });
  return urls;
};

defineExpose({
  getImageUrls
});

onBeforeUnmount(() => {
  // 清理文件URL
  fileMap.value.forEach(value => {
    if (value.url.startsWith("blob:")) {
      URL.revokeObjectURL(value.url);
    }
  });
  fileMap.value.clear();

  // 销毁编辑器
  if (editor.value) {
    editor.value.destroy();
  }
});
</script>

<style scoped lang="scss">
.rich-text-editor {
  width: 100%;
  border: 1px solid #dcdfe6;
  border-radius: 4px;
  overflow: hidden;

  .editor-toolbar {
    padding: 8px;
    background: #f5f7fa;
    border-bottom: 1px solid #dcdfe6;
    display: flex;
    gap: 8px;
    flex-wrap: wrap;

    button {
      padding: 6px 12px;
      border: 1px solid #dcdfe6;
      border-radius: 4px;
      background: white;
      cursor: pointer;
      font-size: 14px;

      &:hover {
        background: #f5f7fa;
      }

      &.is-active {
        background: #409eff;
        color: white;
        border-color: #409eff;
      }
    }
  }

  .editor-content {
    min-height: 300px;
    padding: 12px;

    :deep(.ProseMirror) {
      outline: none;
      min-height: 300px;

      p {
        margin: 0.5em 0;
      }

      img {
        max-width: 30%;
        height: auto;
        display: block;
        margin: 10px 0;
      }

      h1,
      h2,
      h3,
      h4,
      h5,
      h6 {
        margin: 1em 0 0.5em 0;
      }

      ul,
      ol {
        margin: 0.5em 0;
        padding-left: 1.5em;
      }
    }
  }
}
</style>
