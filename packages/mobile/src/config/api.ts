/**
 * API 基础地址
 * - 开发/CLI 打包：读取 .env 中的 VITE_API_URL
 * - HBuilderX 云打包：env 可能未注入，使用 DEFAULT_API_BASE 兜底
 */
const DEFAULT_API_BASE = "http://192.168.1.38:1137";

function normalizeBaseUrl(url: string) {
  return url.trim().replace(/\/+$/, "");
}

const envUrl = import.meta.env.VITE_API_URL as string | undefined;

export const API_BASE_URL = normalizeBaseUrl(envUrl || DEFAULT_API_BASE);

export const LOGIN_API = `${API_BASE_URL}/login`;
