/** 拼接附件完整访问地址 */
export function getAttachmentUrl(path: string): string {
  if (!path) return "";
  if (path.startsWith("http://") || path.startsWith("https://")) {
    return path;
  }

  const baseUrl = import.meta.env.VITE_GLOB_API_URL || "";
  if (!baseUrl) return path;

  const normalizedBaseUrl = baseUrl.endsWith("/")
    ? baseUrl.slice(0, -1)
    : baseUrl;
  const normalizedPath = path.startsWith("/") ? path : `/${path}`;

  return normalizedBaseUrl + normalizedPath;
}

/** 转为后端存储用的相对路径 */
export function toRelativePath(url: string): string {
  if (!url) return "";
  if (!url.startsWith("http://") && !url.startsWith("https://")) {
    return url.startsWith("/") ? url : `/${url}`;
  }

  const baseUrl = (import.meta.env.VITE_GLOB_API_URL || "").replace(/\/$/, "");
  if (baseUrl && url.startsWith(baseUrl)) {
    const relative = url.slice(baseUrl.length);
    return relative.startsWith("/") ? relative : `/${relative}`;
  }

  return url;
}

/** 从路径中提取文件名 */
export function getFileNameFromPath(path: string): string {
  if (!path) return "未知文件";
  const parts = path.split("/");
  return parts[parts.length - 1] || "未知文件";
}

/** 从链接元素解析附件相对路径 */
export function resolveAttachmentPathFromAnchor(
  anchor: HTMLAnchorElement
): string {
  const dataPath = anchor.getAttribute("data-file-path");
  if (dataPath) return dataPath;

  const href = anchor.getAttribute("href") || "";
  return href ? toRelativePath(href) : "";
}

/** 附件链接点击：阻止跳转并触发下载 */
export function createAttachmentLinkClickHandler(
  root?: Element | null
): (event: MouseEvent) => void {
  return (event: MouseEvent) => {
    const anchor = (event.target as HTMLElement).closest(
      "a[href]"
    ) as HTMLAnchorElement | null;
    if (!anchor) return;
    if (root && !root.contains(anchor)) return;

    event.preventDefault();
    event.stopPropagation();

    const path = resolveAttachmentPathFromAnchor(anchor);
    if (path) downloadAttachment(path);
  };
}

/** 下载或打开附件 */
export function downloadAttachment(path: string): void {
  const url = getAttachmentUrl(path);
  if (!url) return;

  const link = document.createElement("a");
  link.href = url;
  link.download = getFileNameFromPath(path);
  link.target = "_blank";
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

/** 生成表格单元格内的附件链接 HTML（行内，不含 p 包裹） */
export function buildAttachmentLinkHtml(path: string, fileName?: string): string {
  const relativePath = toRelativePath(path);
  const href = getAttachmentUrl(relativePath);
  const name = fileName || getFileNameFromPath(relativePath);
  return `<a href="${href}" rel="noopener noreferrer" data-file-path="${relativePath}">${name}</a>`;
}

/** 从编辑器 HTML 中提取附件路径 */
export function extractAttachmentsFromHtml(html: string): string[] {
  if (!html?.trim()) return [];

  const doc = new DOMParser().parseFromString(html, "text/html");
  const links = Array.from(doc.body.querySelectorAll("a[href]"));
  const result: string[] = [];

  links.forEach(link => {
    const dataPath = link.getAttribute("data-file-path");
    const href = link.getAttribute("href") || "";
    const path = dataPath || toRelativePath(href);
    if (path && !result.includes(path)) {
      result.push(path);
    }
  });

  return result;
}

/** 将附件链接插入表格内（优先最后一个单元格） */
export function insertLinksIntoTable(html: string, linkHtmlList: string[]): string {
  if (!linkHtmlList.length) return html;

  const combined = linkHtmlList.join("<br>");
  if (!html.trim()) {
    return `<table border="1" cellpadding="4" cellspacing="0" style="border-collapse:collapse;width:100%"><tbody><tr><td>${combined}</td></tr></tbody></table>`;
  }

  const doc = new DOMParser().parseFromString(html, "text/html");
  const table = doc.body.querySelector("table");
  if (!table) {
    return `${html}<table border="1" cellpadding="4" cellspacing="0" style="border-collapse:collapse;width:100%"><tbody><tr><td>${combined}</td></tr></tbody></table>`;
  }

  const rows = Array.from(table.querySelectorAll("tr"));
  const lastRow = rows[rows.length - 1];
  const cell =
    lastRow?.querySelector("td:last-child, th:last-child") ||
    table.querySelector("td, th");

  if (cell) {
    const current = cell.innerHTML.trim();
    cell.innerHTML = current ? `${current}<br>${combined}` : combined;
  }

  return doc.body.innerHTML.trim();
}

/** 将表格外部的附件链接移入表格 */
export function normalizeAttachmentLinksInTable(html: string): string {
  if (!html?.trim()) return html;

  const doc = new DOMParser().parseFromString(html, "text/html");
  const orphanLinks = Array.from(doc.body.querySelectorAll("a[href]")).filter(
    link => !link.closest("table")
  );

  if (!orphanLinks.length) return html;

  const linkHtmlList = orphanLinks.map(link => link.outerHTML);
  orphanLinks.forEach(link => {
    const parent = link.parentElement;
    link.remove();
    if (parent?.tagName === "P" && !parent.textContent?.trim() && !parent.querySelector("img")) {
      parent.remove();
    }
  });

  return insertLinksIntoTable(doc.body.innerHTML.trim(), linkHtmlList);
}

/** 将旧版独立 attachment 数组合并进表格 HTML */
export function mergeLegacyAttachmentsIntoHtml(
  html: string,
  attachments: string[]
): string {
  if (!attachments.length) return html;

  const existing = new Set(extractAttachmentsFromHtml(html));
  const linkHtmlList = attachments
    .filter(path => {
      const relative = toRelativePath(path);
      return !existing.has(relative) && !existing.has(path);
    })
    .map(path => buildAttachmentLinkHtml(path));

  return insertLinksIntoTable(html, linkHtmlList);
}
