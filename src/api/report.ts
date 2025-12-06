import { http } from "@/utils/http";

/** API响应类型 */
export interface ApiResponse<T> {
  code: number;
  message?: string;
  result?: T;
  data?: T;
  total_count?: number;
  total?: number;
}

/** 查询报告列表参数 */
export interface SelectReportsParams {
  page: number;
  page_size: number;
}

/** 查询自己的报告列表参数 */
export interface SelectSelfReportsParams {
  page: number;
  page_size: number;
}

/** 报告记录类型 */
export interface ReportRecord {
  _id?: string;
  id?: string;
  recipient?: string;
  project_id?: string;
  project_name?: string;
  message?: string;
  creator?: string;
  create_time?: string;
  createdAt?: string;
  updatedAt?: string;
  [key: string]: any;
}

/** 报告列表响应 */
export interface ReportListResponse {
  code: number;
  result?: ReportRecord[];
  data?: ReportRecord[];
  total_count?: number;
  total?: number;
  message?: string;
}

/** 创建项目报告参数 */
export interface CreateProjectReportParams {
  recipient: string;
  project_id: string;
  project_name: string;
  message: string;
}

/** 查询报告列表 */
export const selectReports = (params: SelectReportsParams) => {
  return http.request<ReportListResponse>("post", "/report/select", {
    data: {
      page: params.page,
      page_size: params.page_size
    }
  });
};

/** 查询自己的报告列表 */
export const selectSelfReports = (params: SelectSelfReportsParams) => {
  return http.request<ReportListResponse>("post", "/report/self_select", {
    data: {
      page: params.page,
      page_size: params.page_size
    }
  });
};

/** 创建项目报告 */
export const createProjectReport = (params: CreateProjectReportParams) => {
  return http.request<ApiResponse<ReportRecord>>("post", "/project_report/add", {
    data: {
      recipient: params.recipient,
      project_id: params.project_id,
      project_name: params.project_name,
      message: params.message
    }
  });
};

