import { http } from "@/utils/http";
import type { ApiResponse } from "@/api/types";

export interface RequirementItem {
  _id: string;
  需求名: string;
  状态?: string;
  优先级?: string;
  project_id?: string;
  project_name?: string;
  creator?: string;
  [key: string]: unknown;
}

export function selectRequirements(params: {
  project_id?: string;
  page?: number;
  page_size?: number;
}) {
  return http.post<ApiResponse<RequirementItem[] | Record<string, unknown>>>(
    "/project/select_requirement",
    {
      project_id: params.project_id || "",
      page: params.page || 1,
      page_size: params.page_size || 100
    }
  );
}

export function selectUserRequirements(params: {
  project_id?: string;
  page?: number;
  page_size?: number;
}) {
  return http.post<ApiResponse<RequirementItem[] | Record<string, unknown>>>(
    "/requirement/user_select",
    {
      project_id: params.project_id || "",
      page: params.page || 1,
      page_size: params.page_size || 100
    }
  );
}
