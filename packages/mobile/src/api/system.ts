import { http } from "@/utils/http";
import type { ApiResponse } from "@/api/types";

export function getNextStateUserList(params: { next_state: string }) {
  return http.post<ApiResponse<Array<Record<string, unknown>>>>(
    "/department/next_state_select_user",
    params
  );
}

export function selectNotificationPerson() {
  return http.get<ApiResponse<{ recipient: string[] }>>("/notification/select_person");
}

export function sendNotification(params: { recipient: string[] }) {
  return http.post<ApiResponse<unknown>>("/notification/update_person", params);
}

export function addNotification(params: {
  task_id: string;
  task_name: string;
  deadline: number;
  recipient: string[];
}) {
  return http.post<ApiResponse<unknown>>("/notification/add", params);
}
