import { http } from "@/utils/http";
import type { LoginResponse } from "@/api/types";

export function loginApi(data: { username: string; password: string }) {
  return http.post<LoginResponse>("/user/login", data);
}

export function updatePasswordApi(data: { old_password?: string; new_password: string }) {
  return http.post("/user/update_password", data);
}
