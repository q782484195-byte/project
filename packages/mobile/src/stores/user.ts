import { defineStore } from "pinia";
import { LOGIN_API } from "@/config/api";
import {
  clearToken,
  getStoredUser,
  getToken,
  setStoredUser,
  setToken
} from "@/utils/auth";
import { http } from "@/utils/http";

export interface LoginApiResponse {
  code: number;
  message?: string;
  token?: string;
  username?: string;
  role?: string[];
  button_permissions?: string[];
}

export interface MobileUser {
  id?: string;
  username?: string;
  name?: string;
  nickname?: string;
  avatar?: string;
  department?: string;
  roles?: string[];
  permissions?: string[];
  [key: string]: unknown;
}

export const useUserStore = defineStore("user", {
  state: () => ({
    token: "",
    user: null as MobileUser | null
  }),
  getters: {
    isLoggedIn: (state) => !!state.token,
    displayName: (state) =>
      state.user?.name || state.user?.nickname || state.user?.username || "用户"
  },
  actions: {
    restoreToken() {
      this.token = getToken();
      this.user = getStoredUser<MobileUser>();
    },
    async login(username: string, password: string) {
      const res = await http.post<LoginApiResponse>("/login", {
        username,
        password
      });

      if (typeof res !== "object" || res === null) {
        throw new Error(`接口返回异常（${LOGIN_API}）`);
      }

      if (res.code !== 200 || !res.token) {
        throw new Error(res.message || res.msg || "登录失败");
      }

      this.token = res.token;
      setToken(res.token);
      this.user = {
        username: res.username || username,
        nickname: res.username || username,
        roles: res.role || [],
        permissions: res.button_permissions || []
      };
      setStoredUser(this.user);
    },
    logout() {
      this.token = "";
      this.user = null;
      clearToken();
      uni.reLaunch({ url: "/pages/login/index" });
    }
  }
});
