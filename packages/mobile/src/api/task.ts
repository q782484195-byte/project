import { http } from "@/utils/http";
import type {
  ApiResponse,
  ReportListItem,
  TaskListItem,
  TaskStatisticsResponse
} from "@/api/types";

export function selectMyTasks(params: {
  state?: string;
  page?: number;
  page_size?: number;
}) {
  return http.post<ApiResponse<TaskListItem[]>>("/task/user_select", {
    state: params.state || "",
    page: params.page || 1,
    page_size: params.page_size || 50
  });
}

export function selectPendingTasks(params: { page?: number; page_size?: number }) {
  return http.post<ApiResponse<TaskListItem[]>>("/task/pending", {
    page: params.page || 1,
    page_size: params.page_size || 20
  });
}

export function getTaskInfo(taskId: string) {
  return http.post<ApiResponse<TaskListItem>>("/task/info", {
    task_id: taskId
  });
}

export function getTaskStatistics() {
  return http.get<TaskStatisticsResponse>("/task/statistics");
}

export function selectReportList(params: {
  page?: number;
  page_size?: number;
  task_id?: string;
}) {
  return http.post<ApiResponse<ReportListItem[]>>("/task/select_report", {
    page: params.page || 1,
    page_size: params.page_size || 20,
    task_id: params.task_id || ""
  });
}

export function reportTaskProgress(params: {
  recipient: string;
  cc_person: string;
  task_id: string;
  task_name: string;
  progress: number;
  message: string;
  use_time: number;
  state: string;
}) {
  return http.post<ApiResponse<unknown>>("/task/report", params);
}

export function createTask(params: {
  task_name: string;
  describe: Array<{ type: string; content: string }>;
  requirement_id: string;
  requirement_name: string;
  priority: string;
  task_deadline: string;
  default_person?: string;
  attachment?: string[];
}) {
  return http.post<ApiResponse<unknown>>("/task/add", params);
}

export function updateTaskState(params: {
  task_id: string;
  current_state: string;
  next_state: string;
  person_name: string;
  rejection_reason?: string;
  test_rounds?: number;
}) {
  return http.post<ApiResponse<unknown>>("/task/update_state", params);
}

export function updateTaskTransfer(params: {
  task_id: string;
  person_name: string;
}) {
  return http.post<ApiResponse<unknown>>("/task/transfer", params);
}

export function updateTaskDeadline(params: {
  task_id: string;
  task_deadline: string;
}) {
  return http.post<ApiResponse<unknown>>("/task/update_task_deadline", params);
}

export function bulkAssignment(params: {
  hour?: number;
  task_json: Record<
    string,
    {
      task_name: string;
      state: string;
      current_assignee: string;
      default_person?: string;
    }
  >;
  task_deadline: string;
}) {
  return http.post<ApiResponse<unknown>>("/task/bulk_assignment", {
    task_json: params.task_json,
    hour: params.hour ?? 1,
    task_deadline: params.task_deadline
  });
}
