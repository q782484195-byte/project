import { http } from "@/utils/http";
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

/** 个人任务列表项（select 接口，不含 value） */
export interface DailyTaskListItem {
  _id?: string;
  daily_task_id?: string;
  daily_task_name?: string | number;
  state?: string;
  creator?: string;
  create_time?: string;
  update_time?: string;
  created_at?: string;
  updated_at?: string;
  [key: string]: unknown;
}

/** 个人任务详情（info 接口，含 value） */
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
  value: DailyTaskValue;
}

/** 更新参数 */
export interface UpdateDailyTaskParams {
  daily_task_id: string;
  value: DailyTaskValue;
}

/** 删除参数 */
export interface DeleteDailyTaskParams {
  daily_task_id: string;
}

/** 详情参数 */
export interface DailyTaskInfoParams {
  daily_task_id: string;
}

export const getDailyTaskId = (task: DailyTaskListItem): string =>
  String(task.daily_task_id || task._id || "");

/** 格式化任务名称（兼容后端返回 number / 0 / 空值） */
export const formatDailyTaskName = (name: unknown): string => {
  if (name == null || name === "") return "未命名任务";
  const text = String(name).trim();
  if (!text || text === "0") return "未命名任务";
  return text;
};

/** @alias formatDailyTaskName */
export const getDailyTaskName = (task: DailyTaskListItem): string =>
  formatDailyTaskName(task.daily_task_name);

/** 详情内容摘要（value 仅 info 接口返回） */
export const getDailyTaskDescription = (task: DailyTaskItem): string => {
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

/** 更新个人任务 */
export const updateDailyTask = (params: UpdateDailyTaskParams) => {
  return http.request<ApiResponse<DailyTaskItem>>("post", "/daily_task/update", {
    data: params
  });
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
      page: params.page,
      page_size: params.page_size
    }
  });
};

/** 查询个人任务详情 */
export const getDailyTaskInfo = (params: DailyTaskInfoParams) => {
  return http.request<ApiResponse<DailyTaskItem>>("post", "/daily_task/info", {
    data: params
  });
};
