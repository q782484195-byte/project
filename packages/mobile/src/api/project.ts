import { http } from "@/utils/http";
import type { ApiResponse, ProjectListItem } from "@/api/types";

export function selectProjects(params?: {
  page?: number;
  page_size?: number;
  state?: string;
}) {
  return http.post<ApiResponse<ProjectListItem[]>>("/project/select", {
    page: params?.page || 1,
    page_size: params?.page_size || 20,
    state: params?.state || ""
  });
}
