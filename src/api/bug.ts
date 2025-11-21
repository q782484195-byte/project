import { http } from "@/utils/http";

/** 创建Bug记录参数 */
export interface CreateBugParams {
  bug_name: string;
  describe: string;
  project_id: string;
  task_id: string;
  task_name: string;
}

/** 根据项目ID查询Bug参数 */
export interface SelectBugsByProjectParams {
  project_id: string;
  page: number;
  page_size: number;
}

/** 根据任务ID查询Bug参数 */
export interface SelectBugsByTaskParams {
  task_id: string;
  page: number;
  page_size: number;
}

/** Bug记录类型 */
export interface BugRecord {
  _id?: string;
  id?: string;
  bug_name: string;
  describe: string;
  project_id: string;
  task_id: string;
  task_name: string;
  create_time?: string;
  createdAt?: string;
  updatedAt?: string;
  status?: string;
  creator?: string;
}

/** API响应类型 */
export interface ApiResponse<T> {
  code: number;
  message?: string;
  result?: T;
  data?: T;
  total_count?: number;
  total?: number;
}

/** 创建Bug记录 */
export const createBug = (params: CreateBugParams) => {
  return http.request<ApiResponse<BugRecord>>("post", "/bug/record", {
    data: params
  });
};

/** 根据项目ID查询Bug列表 */
export const selectBugsByProject = (params: SelectBugsByProjectParams) => {
  return http.request<ApiResponse<BugRecord[]>>("post", "/bug/project_select", {
    data: params
  });
};

/** 根据任务ID查询Bug列表 */
export const selectBugsByTask = (params: SelectBugsByTaskParams) => {
  return http.request<ApiResponse<BugRecord[]>>("post", "/bug/task_select", {
    data: params
  });
};

