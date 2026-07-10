import type { ApiResponse } from "@/api/types";

export function getApiMessage(response: ApiResponse) {
  return response.message || response.msg || "请求失败";
}

export function isApiSuccess(response: ApiResponse) {
  return response.code === 200 || response.code === 0;
}

export function unwrapList<T>(response: ApiResponse<T[] | { list?: T[]; records?: T[] }>) {
  if (!isApiSuccess(response)) {
    throw new Error(getApiMessage(response));
  }

  if (Array.isArray(response.result)) return response.result;
  if (Array.isArray(response.data)) return response.data;

  const data = response.data;
  if (data && typeof data === "object" && !Array.isArray(data)) {
    const nested = data as { list?: T[]; records?: T[] };
    if (Array.isArray(nested.list)) return nested.list;
    if (Array.isArray(nested.records)) return nested.records;
  }

  return [];
}

export function unwrapItem<T>(response: ApiResponse<T>) {
  if (!isApiSuccess(response)) {
    throw new Error(getApiMessage(response));
  }
  return (response.result ?? response.data ?? null) as T | null;
}
