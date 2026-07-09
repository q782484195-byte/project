import { API_BASE_URL } from "@/config/api";
import { clearToken, formatToken, getToken } from "./auth";

interface ApiResponse<T = unknown> {
  code?: number;
  msg?: string;
  message?: string;
  data?: T;
  [key: string]: unknown;
}

type HttpMethod = "GET" | "POST" | "PUT" | "DELETE";

function ensureBaseUrl() {
  if (!API_BASE_URL) {
    throw new Error("API 地址未配置");
  }
}

function buildUrl(url: string, params?: Record<string, unknown>) {
  ensureBaseUrl();
  const path = url.startsWith("/") ? url : `/${url}`;
  if (!params || !Object.keys(params).length) return API_BASE_URL + path;
  const query = Object.entries(params)
    .filter(([, v]) => v !== undefined && v !== null && v !== "")
    .map(([k, v]) => `${encodeURIComponent(k)}=${encodeURIComponent(String(v))}`)
    .join("&");
  return `${API_BASE_URL}${path}${path.includes("?") ? "&" : "?"}${query}`;
}

function request<T>(
  method: HttpMethod,
  url: string,
  data?: unknown,
  params?: Record<string, unknown>
): Promise<T> {
  ensureBaseUrl();
  const path = url.startsWith("/") ? url : `/${url}`;
  const fullUrl = method === "GET" ? buildUrl(url, params) : API_BASE_URL + path;

  return new Promise((resolve, reject) => {
    uni.request({
      url: fullUrl,
      method,
      data: method === "GET" ? undefined : data,
      header: {
        "Content-Type": "application/json",
        Authorization: getToken() ? formatToken(getToken()) : ""
      },
      success(res) {
        const status = res.statusCode ?? 0;
        if (status === 401) {
          clearToken();
          uni.reLaunch({ url: "/pages/login/index" });
          reject(new Error("未登录"));
          return;
        }
        if (status < 200 || status >= 300) {
          reject(new Error(`请求失败 HTTP ${status}`));
          return;
        }
        resolve(res.data as T);
      },
      fail(err) {
        const errMsg =
          (err as UniApp.GeneralCallbackResult)?.errMsg || "网络异常";
        reject(new Error(`${errMsg}（${fullUrl}）`));
      }
    });
  });
}

export const http = {
  get<T>(url: string, params?: Record<string, unknown>) {
    return request<T>("GET", url, undefined, params);
  },
  post<T>(url: string, data?: unknown) {
    return request<T>("POST", url, data);
  },
  put<T>(url: string, data?: unknown) {
    return request<T>("PUT", url, data);
  },
  delete<T>(url: string) {
    return request<T>("DELETE", url);
  }
};

export type { ApiResponse };
