import type { UploadFile } from "element-plus";
import type { DescribeContent } from "@/api/project";
import { uploadFile } from "@/api/project";
import type {
  AddDailyTaskParams,
  AssignerUpdateDailyTaskParams,
  CreatorUpdateDailyTaskParams
} from "@/api/daily-task";

const convertToRelativePath = (url: string): string => {
  if (!url.startsWith("http://") && !url.startsWith("https://")) {
    return url;
  }

  try {
    return new URL(url).pathname;
  } catch {
    const baseUrl = import.meta.env.VITE_GLOB_API_URL || "";
    if (baseUrl && url.startsWith(baseUrl)) {
      return url.substring(baseUrl.length);
    }
    return url;
  }
};

const IMAGE_EXT_PATTERN = /\.(jpg|jpeg|png|gif|webp|bmp|svg)(\?|$)/i;

/** 判断 describe 字符串是否为图片路径 */
export const isDailyTaskImagePath = (value: string): boolean => {
  const str = String(value || "").trim();
  if (!str) return false;
  if (str.startsWith("data:") || str.startsWith("blob:")) return false;

  if (str.startsWith("/data/")) return true;

  if (
    str.startsWith("http://") ||
    str.startsWith("https://") ||
    str.startsWith("/")
  ) {
    return IMAGE_EXT_PATTERN.test(str);
  }

  return IMAGE_EXT_PATTERN.test(str);
};

const classifyDescribeItem = (value: unknown): DescribeContent | null => {
  if (value == null) return null;

  if (typeof value === "string") {
    const content = value.trim();
    if (!content) return null;
    return {
      type: isDailyTaskImagePath(content) ? "url" : "text",
      content
    };
  }

  if (typeof value === "object" && "type" in (value as object)) {
    const item = value as DescribeContent;
    const content = String(item.content ?? "").trim();
    if (!content) return null;

    if (item.type === "url" || item.type === "file") {
      return { type: item.type, content };
    }

    return {
      type: isDailyTaskImagePath(content) ? "url" : "text",
      content
    };
  }

  return null;
};

const encodeResourcePath = (path: string): string =>
  path
    .split("/")
    .map((segment, index) => {
      if (!segment || index === 0) return segment;
      try {
        return encodeURIComponent(decodeURIComponent(segment));
      } catch {
        return encodeURIComponent(segment);
      }
    })
    .join("/");

export const getAttachmentUrl = (path: string): string => {
  const rawPath = String(path || "").trim();
  if (!rawPath) return "";

  if (rawPath.startsWith("http://") || rawPath.startsWith("https://")) {
    return rawPath;
  }

  const baseUrl = import.meta.env.VITE_GLOB_API_URL || "";
  const normalizedPath = rawPath.startsWith("/") ? rawPath : `/${rawPath}`;
  if (!baseUrl) return normalizedPath;

  const normalizedBase = baseUrl.endsWith("/")
    ? baseUrl.slice(0, -1)
    : baseUrl;
  return `${normalizedBase}${encodeResourcePath(normalizedPath)}`;
};

export const getFileNameFromPath = (path: string): string => {
  const parts = path.split("/").filter(Boolean);
  return parts[parts.length - 1] || path;
};

/** 将接口 describe 规范化为 RichTextEditor 所需格式 */
export const normalizeDailyTaskDescribeToContent = (
  describe: unknown
): DescribeContent[] => {
  if (!Array.isArray(describe) || describe.length === 0) {
    return [];
  }

  return describe
    .map(item => classifyDescribeItem(item))
    .filter((item): item is DescribeContent => item != null);
};

/** 将 RichTextEditor 内容转换为接口 describe 字符串数组 */
export const buildDailyTaskDescribeStrings = (
  describe: DescribeContent[]
): string[] => {
  const describeUrls: string[] = [];
  const seenUrls = new Set<string>();

  describe.forEach(item => {
    if (item.type === "text") {
      const text = item.content.trim();
      if (text) {
        describeUrls.push(text);
      }
      return;
    }

    if (item.type === "url" || item.type === "file") {
      if (
        item.content &&
        !item.content.startsWith("data:") &&
        !item.content.startsWith("blob:")
      ) {
        const relativePath = convertToRelativePath(item.content);
        if (!seenUrls.has(relativePath)) {
          seenUrls.add(relativePath);
          describeUrls.push(relativePath);
        }
      }
    }
  });

  return describeUrls;
};

export const isBlankDailyTaskContent = (
  describe: DescribeContent[],
  attachmentCount = 0
): boolean => {
  return (
    buildDailyTaskDescribeStrings(describe).length === 0 && attachmentCount === 0
  );
};

export const attachmentUrlsToFileList = (attachments: string[]): UploadFile[] =>
  attachments.map((attachmentPath, index) => {
    const fileName = getFileNameFromPath(attachmentPath);
    return {
      name: fileName,
      url: getAttachmentUrl(attachmentPath),
      status: "success",
      uid: Date.now() + index,
      response: attachmentPath
    } as UploadFile;
  });

const uploadAttachmentFile = async (file: File): Promise<string | null> => {
  const response = await uploadFile({ file });
  if (response.code === 200 && response.url) {
    return response.url;
  }
  return null;
};

/** 从上传组件文件列表收集附件 URL（含新上传文件） */
export const collectAttachmentUrlsFromFileList = async (
  files: UploadFile[]
): Promise<string[]> => {
  const attachmentUrls: string[] = [];

  for (const file of files) {
    if (file.raw) {
      const url = await uploadAttachmentFile(file.raw);
      if (url) {
        attachmentUrls.push(url);
      }
    } else if (file.response) {
      let url = "";
      if (typeof file.response === "string") {
        url = file.response;
      } else if (
        file.response &&
        typeof file.response === "object" &&
        "url" in file.response
      ) {
        url = String((file.response as { url?: string }).url || "");
      }
      if (url) {
        attachmentUrls.push(convertToRelativePath(url));
      }
    } else if (file.url) {
      attachmentUrls.push(convertToRelativePath(file.url));
    }
  }

  return Array.from(new Set(attachmentUrls));
};

export const buildAddDailyTaskParams = (
  describe: DescribeContent[],
  attachment: string[],
  dailyTaskName: string,
  options?: Partial<
    Pick<AddDailyTaskParams, "assigner" | "priority" | "task_deadline">
  >
): AddDailyTaskParams => ({
  daily_task_name: dailyTaskName,
  assigner: options?.assigner ?? [],
  describe: buildDailyTaskDescribeStrings(describe),
  priority: options?.priority ?? "正常",
  task_deadline: options?.task_deadline ?? "",
  attachment
});

export const buildCreatorUpdateDailyTaskParams = (
  taskId: string,
  describe: DescribeContent[],
  attachment: string[],
  dailyTaskName: string,
  options?: Partial<
    Pick<CreatorUpdateDailyTaskParams, "state" | "priority" | "task_deadline">
  >
): CreatorUpdateDailyTaskParams => ({
  task_id: taskId,
  describe: buildDailyTaskDescribeStrings(describe),
  attachment,
  daily_task_name: dailyTaskName,
  state: options?.state ?? "",
  priority: options?.priority ?? "正常",
  task_deadline: options?.task_deadline ?? ""
});

export const buildAssignerUpdateDailyTaskParams = (
  taskId: string,
  describe: DescribeContent[],
  attachment: string[]
): AssignerUpdateDailyTaskParams => ({
  task_id: taskId,
  describe: buildDailyTaskDescribeStrings(describe),
  attachment
});
