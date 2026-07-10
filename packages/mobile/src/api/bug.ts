import { http } from "@/utils/http";
import type { ApiResponse } from "@/api/types";

export interface BugRecord {
  _id?: string;
  id?: string;
  bug_name: string;
  describe: string;
  project_id?: string;
  task_id?: string;
  task_name?: string;
  creator?: string;
  create_time?: string;
  [key: string]: unknown;
}

export function createBug(params: {
  bug_name: string;
  describe: string;
  project_id: string;
  task_id: string;
  task_name: string;
}) {
  return http.post<ApiResponse<BugRecord>>("/bug/record", params);
}

export function selectBugsByTask(params: {
  task_id: string;
  page?: number;
  page_size?: number;
}) {
  return http.post<ApiResponse<BugRecord[]>>("/bug/task_select", {
    task_id: params.task_id,
    page: params.page || 1,
    page_size: params.page_size || 20
  });
}
