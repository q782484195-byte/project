import type { DailyTaskValue } from "@/api/daily-task";
import { plainTextToHtml } from "@/utils/excelPaste";
import {
  extractAttachmentsFromHtml,
  mergeLegacyAttachmentsIntoHtml,
  normalizeAttachmentLinksInTable
} from "@/utils/attachment";

export interface TaskTableSheet {
  id: string;
  name: string;
  html: string;
}

export interface TaskContentData {
  sheets: TaskTableSheet[];
  otherHtml: string;
}

export interface StoredTaskTable {
  name: string;
  html: string;
}

let sheetIdCounter = 0;

export const createSheetId = () => `sheet-${Date.now()}-${++sheetIdCounter}`;

export const createEmptySheet = (): TaskTableSheet => ({
  id: createSheetId(),
  name: "表格",
  html: ""
});

export const createEmptyTaskContent = (): TaskContentData => ({
  sheets: [createEmptySheet()],
  otherHtml: ""
});

/** 从 HTML 中提取第一个 table */
export function extractFirstTableHtml(html: string): string {
  if (!html?.trim()) return "";

  const normalized = html.includes("<") ? html : plainTextToHtml(html);
  const doc = new DOMParser().parseFromString(normalized, "text/html");
  const firstTable = doc.body.querySelector("table");
  return firstTable ? firstTable.outerHTML : normalized;
}

/** @deprecated 兼容旧调用，始终只保留一个表格 */
export function extractTablesFromHtml(html: string): TaskContentData {
  return {
    sheets: [{ ...createEmptySheet(), html: extractFirstTableHtml(html) }],
    otherHtml: ""
  };
}

/** 规范化后端 value 字段 */
export function normalizeTaskValue(value: unknown): DailyTaskValue | string {
  if (value == null) return "";

  if (typeof value === "string") {
    const trimmed = value.trim();
    if (!trimmed) return "";
    if (trimmed.startsWith("{") || trimmed.startsWith("[")) {
      try {
        const parsed = JSON.parse(trimmed);
        if (parsed && typeof parsed === "object") {
          return parsed as DailyTaskValue;
        }
      } catch {
        return trimmed;
      }
    }
    return trimmed;
  }

  if (typeof value === "object") {
    return value as DailyTaskValue;
  }

  return "";
}

/** 从接口 value 解析完整编辑器 HTML（表格 + 附件链接） */
export function parseTaskEditorHtml(value: unknown): string {
  const normalized = normalizeTaskValue(value);

  if (!normalized) return "";

  if (typeof normalized === "string") {
    return normalized;
  }

  const description =
    typeof normalized.description === "string" ? normalized.description : "";
  if (description.trim()) {
    return normalizeAttachmentLinksInTable(
      mergeLegacyAttachmentsIntoHtml(description, parseTaskAttachments(value))
    );
  }

  const storedTables = normalized.tables;
  if (Array.isArray(storedTables) && storedTables.length > 0) {
    const tableHtml = String(storedTables[0]?.html || "");
    return normalizeAttachmentLinksInTable(
      mergeLegacyAttachmentsIntoHtml(tableHtml, parseTaskAttachments(value))
    );
  }

  return mergeLegacyAttachmentsIntoHtml("", parseTaskAttachments(value));
}

/** 从接口 value 解析为单个表格 HTML */
export function parseTaskTableHtml(value: unknown): string {
  return extractFirstTableHtml(parseTaskEditorHtml(value));
}

/** 从接口 value 解析任务内容（单表格） */
export function parseTaskContent(value: unknown): TaskContentData {
  return {
    sheets: [{ ...createEmptySheet(), html: parseTaskTableHtml(value) }],
    otherHtml: ""
  };
}

/** 从 info 详情解析完整编辑器 HTML */
export function parseTaskEditorHtmlFromItem(item: {
  value?: unknown;
  describe?: unknown;
  daily_task_name?: string | number;
  description?: string;
  content?: string;
  html?: string;
  attachment?: unknown;
}): string {
  if (item.value != null && item.value !== "") {
    const html = parseTaskEditorHtml(item.value);
    if (html.trim()) return html;
  }

  if (Array.isArray(item.describe) && item.describe.length > 0) {
    const describeHtml = item.describe
      .map(part => String(part).trim())
      .filter(Boolean)
      .join("");
    if (describeHtml) {
      return normalizeAttachmentLinksInTable(
        mergeLegacyAttachmentsIntoHtml(
          describeHtml,
          parseTaskAttachmentsFromItem(item)
        )
      );
    }
  }

  const fallback = String(item.description || item.content || item.html || "");
  return normalizeAttachmentLinksInTable(
    mergeLegacyAttachmentsIntoHtml(fallback, parseTaskAttachmentsFromItem(item))
  );
}

/** 从 info 详情解析为单个表格 HTML */
export function parseTaskTableHtmlFromItem(item: {
  value?: unknown;
  daily_task_name?: string | number;
  description?: string;
  content?: string;
  html?: string;
  attachment?: unknown;
}): string {
  return extractFirstTableHtml(parseTaskEditorHtmlFromItem(item));
}

/** 从 info 详情解析（value 仅 info 接口返回） */
export function parseTaskContentFromItem(item: {
  value?: unknown;
  daily_task_name?: string | number;
  description?: string;
  content?: string;
  html?: string;
}): TaskContentData {
  if (item.value != null && item.value !== "") {
    const html = parseTaskTableHtml(item.value);
    if (html.trim()) {
      return { sheets: [{ ...createEmptySheet(), html }], otherHtml: "" };
    }
  }

  const fallback = item.description || item.content || item.html || "";
  if (fallback) {
    return parseTaskContent(fallback);
  }

  return createEmptyTaskContent();
}

/** 合并为存储用 HTML（单表格） */
export function joinTaskContent(data: TaskContentData): string {
  return String(data.sheets[0]?.html || "").trim();
}

/** 从 value 解析附件列表 */
export function parseTaskAttachments(value: unknown): string[] {
  const normalized = normalizeTaskValue(value);
  if (!normalized || typeof normalized === "string") return [];

  const attachment = normalized.attachment;
  if (!Array.isArray(attachment)) return [];

  return attachment.map(item => String(item).trim()).filter(Boolean);
}

/** 从 info 详情解析附件 */
export function parseTaskAttachmentsFromItem(item: {
  value?: unknown;
  attachment?: unknown;
}): string[] {
  if (item.value != null && item.value !== "") {
    const fromValue = parseTaskAttachments(item.value);
    if (fromValue.length > 0) return fromValue;
  }

  if (Array.isArray(item.attachment)) {
    return item.attachment.map(url => String(url).trim()).filter(Boolean);
  }

  return [];
}

/** @deprecated 兼容旧表格编辑器提交逻辑 */
export function buildTaskValue(html: string, dailyTaskName: string): DailyTaskValue {
  const fullHtml = html.trim();
  const tableHtml = extractFirstTableHtml(fullHtml);
  const attachments = extractAttachmentsFromHtml(fullHtml);

  return {
    daily_task_name: dailyTaskName,
    description: fullHtml,
    tables: [
      {
        name: dailyTaskName,
        html: tableHtml
      }
    ],
    attachment: attachments
  };
}

/** @deprecated 兼容旧调用 */
export function buildTaskValueFromContent(
  data: TaskContentData,
  dailyTaskName: string
): DailyTaskValue {
  return buildTaskValue(joinTaskContent(data), dailyTaskName);
}

/** 判断编辑器内容是否为空 */
export function isBlankTableHtml(html: string): boolean {
  if (!html.trim()) return true;

  const doc = new DOMParser().parseFromString(html, "text/html");
  if (doc.body.querySelector("a[href]")) return false;

  const table = doc.body.querySelector("table");
  if (table) {
    const tableText = (table.textContent || "").replace(/\s+/g, "").trim();
    if (tableText) return false;
  }

  const text = (doc.body.textContent || "").replace(/\s+/g, "").trim();
  if (text) return false;

  return !doc.body.querySelector("table, img");
}

/** @deprecated 兼容旧调用 */
export function isBlankTaskContent(data: TaskContentData): boolean {
  return isBlankTableHtml(joinTaskContent(data));
}
