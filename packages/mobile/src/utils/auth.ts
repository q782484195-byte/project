const TOKEN_KEY = "pm_mobile_token";
const USER_KEY = "pm_mobile_user";

export function getToken(): string {
  return uni.getStorageSync(TOKEN_KEY) || "";
}

export function setToken(token: string) {
  uni.setStorageSync(TOKEN_KEY, token);
}

export function clearToken() {
  uni.removeStorageSync(TOKEN_KEY);
  uni.removeStorageSync(USER_KEY);
}

export function getStoredUser<T = Record<string, unknown>>(): T | null {
  const raw = uni.getStorageSync(USER_KEY);
  if (!raw) return null;
  try {
    return typeof raw === "string" ? JSON.parse(raw) : raw;
  } catch {
    return null;
  }
}

export function setStoredUser(user: unknown) {
  uni.setStorageSync(USER_KEY, JSON.stringify(user));
}

export function formatToken(token: string) {
  return token.startsWith("Bearer ") ? token : `Bearer ${token}`;
}
