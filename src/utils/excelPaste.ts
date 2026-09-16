import type { IDomEditor } from "@wangeditor-next/editor";
import { ElMessage } from "element-plus";
import { uploadFile } from "@/api/project";
import {
  getAttachmentUrl,
  getFileNameFromPath,
  toRelativePath
} from "@/utils/attachment";

const ALLOWED_TABLE_ATTRS = new Set([
  "colspan",
  "rowspan",
  "width",
  "height",
  "align",
  "valign",
  "border",
  "cellpadding",
  "cellspacing"
]);

const ALLOWED_STYLE_PROPS = new Set([
  "border",
  "border-top",
  "border-right",
  "border-bottom",
  "border-left",
  "width",
  "height",
  "text-align",
  "vertical-align",
  "background",
  "background-color",
  "color",
  "font-size",
  "font-weight",
  "font-style",
  "padding",
  "white-space"
]);

/** 将相对路径转为可访问的完整图片 URL */
function getImageUrl(filePath: string): string {
  if (filePath.startsWith("http://") || filePath.startsWith("https://")) {
    return filePath;
  }

  const baseUrl = import.meta.env.VITE_GLOB_API_URL || "";
  if (!baseUrl) return filePath;

  let path = filePath;
  if (!path.startsWith("/")) {
    path = `/${path}`;
  }

  const normalizedBaseUrl = baseUrl.endsWith("/") ? baseUrl.slice(0, -1) : baseUrl;
  return normalizedBaseUrl + path;
}

/** 上传图片至服务器，返回编辑器可用的完整 URL */
export async function uploadImageToServer(file: File): Promise<string> {
  try {
    const response = await uploadFile({ file });
    if (response.code === 200 && response.url) {
      return getImageUrl(response.url);
    }
    ElMessage.error("图片上传失败");
    return "";
  } catch (error: any) {
    console.error("上传图片失败:", error);
    ElMessage.error(
      error?.response?.data?.message || error?.message || "图片上传失败"
    );
    return "";
  }
}

export interface UploadedAttachment {
  href: string;
  relativePath: string;
  name: string;
}

/** 上传附件至服务器（与图片上传共用 uploadFile 接口） */
export async function uploadAttachmentToServer(
  file: File
): Promise<UploadedAttachment | null> {
  try {
    const response = await uploadFile({ file });
    if (response.code === 200 && response.url) {
      const relativePath = toRelativePath(response.url);
      return {
        href: getAttachmentUrl(relativePath),
        relativePath,
        name: file.name || getFileNameFromPath(relativePath)
      };
    }
    ElMessage.error("附件上传失败");
    return null;
  } catch (error: any) {
    console.error("上传附件失败:", error);
    ElMessage.error(
      error?.response?.data?.message || error?.message || "附件上传失败"
    );
    return null;
  }
}

/** 在当前光标处插入附件链接（支持表格单元格内） */
export function insertAttachmentNode(
  editor: IDomEditor,
  href: string,
  name: string,
  relativePath: string
) {
  editor.restoreSelection();

  const linkHtml = `<a href="${href}" rel="noopener noreferrer" data-file-path="${relativePath}">${name}</a>`;
  editor.dangerouslyInsertHtml(linkHtml);
}

/** 从剪贴板收集图片文件 */
export function collectImageFiles(clipboardData: DataTransfer): File[] {
  const files: File[] = [];
  const seen = new Set<string>();

  const pushFile = (file: File | null) => {
    if (!file || !file.type.startsWith("image/")) return;
    // 剪贴板同一张图在 files / items 中可能是不同 File 对象，用 type+size 去重
    const key = `${file.type}-${file.size}`;
    if (seen.has(key)) return;
    seen.add(key);
    files.push(file);
  };

  // items 与 files 常指向同一张图，优先 items，避免重复收集
  if (clipboardData.items?.length) {
    Array.from(clipboardData.items).forEach(item => {
      if (item.kind === "file" && item.type.startsWith("image/")) {
        pushFile(item.getAsFile());
      }
    });
    if (files.length > 0) return files;
  }

  if (clipboardData.files?.length) {
    Array.from(clipboardData.files).forEach(f => pushFile(f));
  }

  return files;
}

/** 从剪贴板收集非图片附件文件 */
export function collectAttachmentFiles(clipboardData: DataTransfer): File[] {
  const files: File[] = [];
  const seen = new Set<string>();

  const pushFile = (file: File | null) => {
    if (!file || file.type.startsWith("image/")) return;
    const key = `${file.name}-${file.size}-${file.lastModified}`;
    if (seen.has(key)) return;
    seen.add(key);
    files.push(file);
  };

  if (clipboardData.files?.length) {
    Array.from(clipboardData.files).forEach(file => pushFile(file));
  }

  if (clipboardData.items?.length) {
    Array.from(clipboardData.items).forEach(item => {
      if (item.kind === "file" && !item.type.startsWith("image/")) {
        pushFile(item.getAsFile());
      }
    });
  }

  return files;
}

/** 清洗 style，去除 Excel / Office 冗余样式 */
function cleanStyleAttr(style: string | null): string {
  if (!style) return "";

  const cleaned = style
    .split(";")
    .map(part => part.trim())
    .filter(Boolean)
    .filter(part => {
      const prop = part.split(":")[0]?.trim().toLowerCase() || "";
      if (prop.startsWith("mso-")) return false;
      if (prop.startsWith("-ms-")) return false;
      return ALLOWED_STYLE_PROPS.has(prop);
    })
    .join("; ");

  return cleaned;
}

function isInvalidImageSrc(src: string): boolean {
  if (!src) return true;
  const lower = src.toLowerCase();
  return (
    lower.startsWith("file:") ||
    lower.includes("clipboard") ||
    lower.startsWith("cid:") ||
    src === "#"
  );
}

function unwrapOfficeWrapper(doc: Document) {
  const body = doc.body;
  // Excel 常包裹在 <!--StartFragment--> 或单一 div 中
  const fragment = body.querySelector("div, table, p, img");
  if (
    body.childNodes.length === 1 &&
    body.firstElementChild?.tagName === "DIV" &&
    !body.querySelector("table")
  ) {
    const wrapper = body.firstElementChild;
    body.innerHTML = wrapper.innerHTML;
  }
  void fragment;
}

function cleanNode(
  node: Node,
  imageQueue: string[]
): Node | null {
  if (node.nodeType === Node.TEXT_NODE) {
    return node.cloneNode(true);
  }

  if (node.nodeType !== Node.ELEMENT_NODE) return null;

  const el = node as HTMLElement;
  const tag = el.tagName.toLowerCase();

  // 移除 Office 噪声节点
  if (
    tag === "meta" ||
    tag === "link" ||
    tag === "style" ||
    tag === "script" ||
    tag === "xml" ||
    tag === "o:p" ||
    tag.startsWith("v:") ||
    tag.startsWith("w:")
  ) {
    return null;
  }

  if (tag === "img") {
    let src = el.getAttribute("src") || "";
    if (isInvalidImageSrc(src)) {
      const dataSrc = el.getAttribute("data-src") || "";
      if (!isInvalidImageSrc(dataSrc)) {
        src = dataSrc;
      } else if (imageQueue.length > 0) {
        src = imageQueue.shift()!;
      } else {
        return null;
      }
    }
    const img = document.createElement("img");
    img.setAttribute("src", src);
    img.setAttribute("alt", el.getAttribute("alt") || "image");
    img.style.maxWidth = "100%";
    return img;
  }

  if (tag === "a") {
    const href = el.getAttribute("href") || "";
    if (!href) return null;

    const link = document.createElement("a");
    link.setAttribute("href", href);
    link.setAttribute("target", el.getAttribute("target") || "_blank");
    link.setAttribute("rel", el.getAttribute("rel") || "noopener noreferrer");
    const dataPath = el.getAttribute("data-file-path");
    if (dataPath) link.setAttribute("data-file-path", dataPath);
    link.textContent = el.textContent?.trim() || getFileNameFromPath(href);
    return link;
  }

  const allowedTags = new Set([
    "table",
    "thead",
    "tbody",
    "tfoot",
    "tr",
    "td",
    "th",
    "p",
    "br",
    "span",
    "b",
    "strong",
    "i",
    "em",
    "u",
    "a",
    "ul",
    "ol",
    "li",
    "h1",
    "h2",
    "h3",
    "h4",
    "h5",
    "h6",
    "div"
  ]);

  if (!allowedTags.has(tag)) {
    const frag = document.createDocumentFragment();
    Array.from(el.childNodes).forEach(child => {
      const cleaned = cleanNode(child, imageQueue);
      if (cleaned) frag.appendChild(cleaned);
    });
    return frag.childNodes.length ? frag : null;
  }

  const clone = document.createElement(tag);

  if (tag === "table") {
    clone.setAttribute("border", el.getAttribute("border") || "1");
    clone.setAttribute("cellpadding", el.getAttribute("cellpadding") || "4");
    clone.setAttribute("cellspacing", el.getAttribute("cellspacing") || "0");
    (clone as HTMLTableElement).style.borderCollapse = "collapse";
    (clone as HTMLTableElement).style.width = "100%";
  } else {
    Array.from(el.attributes).forEach(attr => {
      const name = attr.name.toLowerCase();
      if (ALLOWED_TABLE_ATTRS.has(name)) {
        clone.setAttribute(name, attr.value);
      }
    });
  }

  const style = cleanStyleAttr(el.getAttribute("style"));
  if (style) clone.setAttribute("style", style);

  Array.from(el.childNodes).forEach(child => {
    const cleaned = cleanNode(child, imageQueue);
    if (!cleaned) return;
    if (cleaned instanceof DocumentFragment) {
      clone.appendChild(cleaned);
    } else {
      clone.appendChild(cleaned);
    }
  });

  if (
    (tag === "td" || tag === "th") &&
    !clone.innerHTML.trim() &&
    !clone.textContent?.trim()
  ) {
    clone.innerHTML = "&nbsp;";
  }

  return clone;
}

/**
 * 清洗 Excel 粘贴的 HTML，保留表格结构与基础样式
 */
export function cleanExcelHtml(html: string, imageUrls: string[] = []): string {
  if (!html?.trim()) return "";

  const normalized = html
    .replace(/<!--[\s\S]*?-->/g, "")
    .replace(/<!\[if[\s\S]*?endif\]>/gi, "");

  const parser = new DOMParser();
  const doc = parser.parseFromString(normalized, "text/html");
  unwrapOfficeWrapper(doc);

  const imageQueue = [...imageUrls];
  const frag = document.createDocumentFragment();

  Array.from(doc.body.childNodes).forEach(node => {
    const cleaned = cleanNode(node, imageQueue);
    if (!cleaned) return;
    if (cleaned instanceof DocumentFragment) {
      frag.appendChild(cleaned);
    } else {
      frag.appendChild(cleaned);
    }
  });

  const container = document.createElement("div");
  container.appendChild(frag);
  return container.innerHTML.trim();
}

export function insertImageNode(
  editor: IDomEditor,
  src: string,
  alt = "image"
) {
  editor.insertNode({
    type: "image",
    src,
    alt,
    href: "",
    children: [{ text: "" }]
  } as any);
}

export function shouldHandleCustomPaste(clipboardData: DataTransfer): boolean {
  const html = clipboardData.getData("text/html");
  const text = clipboardData.getData("text/plain");
  const images = collectImageFiles(clipboardData);
  const attachments = collectAttachmentFiles(clipboardData);
  return Boolean(html?.trim() || text || images.length > 0 || attachments.length > 0);
}

export interface CustomPasteOptions {
  enableAttachment?: boolean;
}

/** WangEditor customPaste：支持 Excel 表格、文本、图片、附件 */
export async function processCustomPaste(
  editor: IDomEditor,
  clipboardData: DataTransfer,
  options: CustomPasteOptions = {}
): Promise<void> {
  const imageFiles = collectImageFiles(clipboardData);
  const attachmentFiles = options.enableAttachment
    ? collectAttachmentFiles(clipboardData)
    : [];
  const html = clipboardData.getData("text/html");
  const text = clipboardData.getData("text/plain");

  const imageUrls: string[] = [];
  for (const file of imageFiles) {
    const url = await uploadImageToServer(file);
    if (url) imageUrls.push(url);
  }

  let handled = false;

  if (html?.trim()) {
    const cleanedHtml = cleanExcelHtml(html, imageUrls);
    if (cleanedHtml) {
      editor.dangerouslyInsertHtml(cleanedHtml);
      handled = true;
    } else if (text) {
      editor.insertText(text);
      handled = true;
    }

    if (imageUrls.length > 0 && !/<img[\s>]/i.test(html)) {
      for (let i = 0; i < imageFiles.length; i++) {
        const url = imageUrls[i];
        if (url) insertImageNode(editor, url, imageFiles[i].name);
      }
    }
  } else if (imageUrls.length > 0) {
    for (let i = 0; i < imageUrls.length; i++) {
      insertImageNode(editor, imageUrls[i], imageFiles[i]?.name || "image");
    }
    handled = true;
  } else if (text) {
    editor.insertText(text);
    handled = true;
  }

  for (const file of attachmentFiles) {
    const uploaded = await uploadAttachmentToServer(file);
    if (uploaded) {
      insertAttachmentNode(
        editor,
        uploaded.href,
        uploaded.name,
        uploaded.relativePath
      );
      handled = true;
    }
  }

  void handled;
}

/** 从 HTML 提取纯文本（表格列预览、搜索用） */
export function stripHtmlToText(html: string): string {
  if (!html?.trim()) return "";
  if (!html.includes("<")) return html;
  const doc = new DOMParser().parseFromString(html, "text/html");
  return (doc.body.textContent || "").replace(/\s+/g, " ").trim();
}

/** 判断富文本是否为空 */
export function isBlankHtml(html: string): boolean {
  const text = stripHtmlToText(html);
  if (text) return false;
  if (!html?.trim()) return true;
  const doc = new DOMParser().parseFromString(html, "text/html");
  return !doc.body.querySelector("img, table");
}

/** 纯文本转编辑器 HTML */
export function plainTextToHtml(text: string): string {
  if (!text?.trim()) return "";
  if (text.trim().startsWith("<")) return text;
  return text
    .split(/\n+/)
    .map(line => `<p>${line.replace(/</g, "&lt;").replace(/>/g, "&gt;")}</p>`)
    .join("");
}
