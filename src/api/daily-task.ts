import { http } from "@/utils/http";
import type { DescribeContent } from "@/api/project";
import {
  joinTaskContent,
  parseTaskContentFromItem
} from "@/utils/taskTableContent";

/** 个人任务内容（value 字段，可按业务扩展） */
export interface StoredTaskTable {
  name: string;
  html: string;
}

export interface DailyTaskValue {
  description?: string;
  daily_task_name?: string;
  otherHtml?: string;
  tables?: StoredTaskTable[];
  attachment?: string[];
  [key: string]: unknown;
}

/** 个人任务列表项（select 接口） */
export interface DailyTaskListItem {
  _id?: string;
  daily_task_id?: string;
  task_id?: string;
  daily_task?: boolean;
  index?: number;
  任务名?: string;
  daily_task_name?: string | number;
  describe?: DescribeContent[] | string[];
  状态?: string;
  state?: string;
  优先级?: string;
  priority?: string;
  creator?: string;
  指派人?: string[] | string;
  assigner?: string[] | string;
  assigner_fished?: boolean[];
  进度?: number;
  task_deadline?: string;
  attachment?: string[];
  assignment_time?: string;
  rejection_reason?: string;
  历史记录?: string[];
  delay?: { task_is_delay?: boolean };
  pause?: boolean;
  create_time?: string;
  update_time?: string;
  created_at?: string;
  updated_at?: string;
  [key: string]: unknown;
}

/** 个人任务详情（info 接口） */
export interface DailyTaskItem extends DailyTaskListItem {
  value?: DailyTaskValue | string;
  description?: string;
  content?: string;
  html?: string;
}

/** 通用 API 响应 */
export interface ApiResponse<T = unknown> {
  code: number;
  message?: string;
  result?: T;
  data?: T;
  total_count?: number;
  total?: number;
}

/** 列表查询参数 */
export interface SelectDailyTasksParams {
  task_name?: string;
  state?: string;
  page: number;
  page_size: number;
}

/** 列表响应 */
export interface DailyTaskListResponse {
  code: number;
  message?: string;
  result?: DailyTaskListItem[];
  total_count?: number;
}

/** 新增参数 */
export interface AddDailyTaskParams {
  daily_task_name: string;
  assigner: string[];
  describe: string[];
  priority: string;
  task_deadline: string;
  attachment: string[];
}

/** 创建人更新参数 */
export interface CreatorUpdateDailyTaskParams {
  task_id: string;
  describe: string[];
  attachment: string[];
  daily_task_name: string;
  state: string;
  priority: string;
  task_deadline: string;
}

/** 指派人更新参数 */
export interface AssignerUpdateDailyTaskParams {
  task_id: string;
  describe: string[];
  attachment: string[];
}

/** 删除参数 */
export interface DeleteDailyTaskParams {
  task_id: string;
}

/** 详情参数 */
export interface DailyTaskInfoParams {
  task_id: string;
}

/** 指派人完成任务参数 */
export interface AssignerFinishDailyTaskParams {
  task_id: string;
}

/** 指派人及完成状态（下标与 指派人、assigner_fished 对应） */
export interface DailyTaskAssignerItem {
  name: string;
  finished: boolean;
}

const isAssignerFinishedFlag = (value: unknown): boolean =>
  value === true || value === 1 || value === "true" || value === "1";

/** 从任务对象解析指派人列表 */
export const getDailyTaskAssigners = (task: DailyTaskListItem): string[] => {
  const assigner = task.指派人 ?? task.assigner;
  if (Array.isArray(assigner)) {
    return assigner.map(item => String(item).trim()).filter(Boolean);
  }
  if (typeof assigner === "string" && assigner.trim()) {
    return [assigner.trim()];
  }
  return [];
};

/** 解析指派人及完成状态列表 */
export const getDailyTaskAssignerItems = (
  task: DailyTaskListItem | null | undefined
): DailyTaskAssignerItem[] => {
  if (!task) return [];
  const assigners = getDailyTaskAssigners(task);
  const finished = task.assigner_fished;
  return assigners.map((name, index) => ({
    name,
    finished:
      Array.isArray(finished) &&
      index < finished.length &&
      isAssignerFinishedFlag(finished[index])
  }));
};

/** 判断当前用户是否为任务创建人 */
export const isDailyTaskCreator = (
  task: DailyTaskListItem,
  username: string
): boolean => {
  const current = username.trim();
  const creator = String(task.creator || "").trim();
  return Boolean(current && creator && current === creator);
};

/** 判断当前指派人是否已标记完成 */
export const hasAssignerFinishedDailyTask = (
  task: DailyTaskListItem,
  username: string
): boolean => {
  const assigners = getDailyTaskAssigners(task);
  const current = username.trim();
  const index = assigners.findIndex(name => name === current);
  if (index < 0) return false;
  const finished = task.assigner_fished;
  if (!Array.isArray(finished) || index >= finished.length) return false;
  return isAssignerFinishedFlag(finished[index]);
};

/** 判断当前用户是否为任务指派人 */
export const isDailyTaskAssigner = (
  task: DailyTaskListItem,
  username: string
): boolean => {
  const current = username.trim();
  if (!current) return false;
  return getDailyTaskAssigners(task).some(name => name === current);
};

/** 判断当前用户是否可编辑任务（创建人或 Admin） */
export const canEditDailyTask = (
  task: DailyTaskListItem,
  username: string,
  roles: string[] = []
): boolean => {
  if (roles.includes("Admin")) return true;
  return isDailyTaskCreator(task, username);
};

export const getDailyTaskId = (task: DailyTaskListItem): string =>
  String(task._id || task.daily_task_id || task.task_id || "");

/** 将指派人/负责人字段格式化为展示文本（兼容 string | string[]） */
export const formatTaskAssigneeText = (
  value: string | string[] | null | undefined,
  separator = "、"
): string => {
  if (Array.isArray(value)) {
    const names = value.map(item => String(item).trim()).filter(Boolean);
    return names.length ? names.join(separator) : "-";
  }
  const text = String(value ?? "").trim();
  return text || "-";
};

/** 从任务行解析负责人展示文本 */
export const getTaskAssigneeText = (
  task: {
    指派人?: string | string[];
    assignee?: string | string[];
  } | null | undefined
): string => formatTaskAssigneeText(task?.指派人 ?? task?.assignee);

/** 格式化任务名称（兼容后端返回 number / 0 / 空值） */
export const formatDailyTaskName = (name: unknown): string => {
  if (name == null || name === "") return "未命名任务";
  const text = String(name).trim();
  if (!text || text === "0") return "未命名任务";
  return text;
};

/** 获取任务名称 */
export const getDailyTaskName = (task: DailyTaskListItem): string =>
  formatDailyTaskName(task.任务名 ?? task.daily_task_name);

/** 获取任务状态 */
export const getDailyTaskState = (task: DailyTaskListItem): string =>
  String(task.状态 ?? task.state ?? "");

/** 获取任务优先级 */
export const getDailyTaskPriority = (task: DailyTaskListItem): string =>
  String(task.优先级 ?? task.priority ?? "");

/** 获取任务进度 */
export const getDailyTaskProgress = (task: DailyTaskListItem): number => {
  const progress = task.进度;
  if (typeof progress === "number") return progress;
  const parsed = Number(progress);
  return Number.isFinite(parsed) ? parsed : 0;
};

/** 详情内容摘要 */
export const getDailyTaskDescription = (task: DailyTaskItem): string => {
  if (Array.isArray(task.describe) && task.describe.length > 0) {
    return task.describe
      .map(item =>
        typeof item === "string" ? item : String(item.content ?? "")
      )
      .filter(Boolean)
      .join("\n");
  }
  if (task.value == null && !task.description && !task.content && !task.html) {
    return "";
  }
  return joinTaskContent(parseTaskContentFromItem(task));
};

/** 从列表响应中提取任务数组（select 无 value） */
export const unwrapDailyTaskList = (response: {
  code?: number;
  result?: DailyTaskListItem[];
  data?: DailyTaskListItem[] | { list?: DailyTaskListItem[]; records?: DailyTaskListItem[] };
  total_count?: number;
  total?: number;
}): { list: DailyTaskListItem[]; total: number } => {
  let list: DailyTaskListItem[] = [];

  if (Array.isArray(response.result)) {
    list = response.result;
  } else if (Array.isArray(response.data)) {
    list = response.data;
  } else if (response.data && typeof response.data === "object") {
    const data = response.data as {
      list?: DailyTaskListItem[];
      records?: DailyTaskListItem[];
    };
    list = data.list || data.records || [];
  }

  const total = response.total_count ?? response.total ?? list.length;

  return { list, total };
};

/** 从详情响应中提取任务对象 */
export const unwrapDailyTaskInfo = (
  response: ApiResponse<DailyTaskItem> & { result?: DailyTaskItem; data?: DailyTaskItem }
): DailyTaskItem | null => {
  return response.result || response.data || null;
};

/** 新增个人任务 */
export const addDailyTask = (params: AddDailyTaskParams) => {
  return http.request<ApiResponse<DailyTaskItem>>("post", "/daily_task/add", {
    data: params
  });
};

/** 创建人更新个人任务 */
export const creatorUpdateDailyTask = (params: CreatorUpdateDailyTaskParams) => {
  return http.request<ApiResponse<DailyTaskItem>>(
    "post",
    "/daily_task/creator_update",
    { data: params }
  );
};

/** 指派人更新个人任务 */
export const assignerUpdateDailyTask = (
  params: AssignerUpdateDailyTaskParams
) => {
  return http.request<ApiResponse<DailyTaskItem>>(
    "post",
    "/daily_task/assigner_update",
    { data: params }
  );
};

/** 删除个人任务 */
export const deleteDailyTask = (params: DeleteDailyTaskParams) => {
  return http.request<ApiResponse<unknown>>("post", "/daily_task/delete", {
    data: params
  });
};

/** 分页查询个人任务列表 */
export const selectDailyTasks = (params: SelectDailyTasksParams) => {
  return http.request<DailyTaskListResponse>("post", "/daily_task/select", {
    data: {
      task_name: params.task_name ?? "",
      state: params.state ?? "",
      page: params.page,
      page_size: params.page_size
    }
  });
};

/** 查询个人任务详情 */
export const getDailyTaskInfo = (params: DailyTaskInfoParams) => {
  return http.request<ApiResponse<DailyTaskItem>>("get", "/daily_task/info", {
    params
  });
};

/** 指派人完成任务 */
export const assignerFinishDailyTask = (
  params: AssignerFinishDailyTaskParams
) => {
  return http.request<ApiResponse<DailyTaskItem>>(
    "post",
    "/daily_task/assigner_fish",
    { data: params }
  );
};
