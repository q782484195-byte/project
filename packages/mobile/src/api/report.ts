import { http } from "@/utils/http";
import type { ApiResponse } from "@/api/types";

export interface ProjectReportRecord {
  _id?: string;
  recipient?: string;
  project_id?: string;
  project_name?: string;
  message?: string;
  creator?: string;
  create_time?: string;
  [key: string]: unknown;
}

export function createProjectReport(params: {
  recipient: string;
  project_id: string;
  project_name: string;
  message: string;
}) {
  return http.post<ApiResponse<ProjectReportRecord>>("/project_report/add", params);
}

export function selectSelfReports(params?: { page?: number; page_size?: number }) {
  return http.post<ApiResponse<ProjectReportRecord[]>>("/report/self_select", {
    page: params?.page || 1,
    page_size: params?.page_size || 20
  });
}
