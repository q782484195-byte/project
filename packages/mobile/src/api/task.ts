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
