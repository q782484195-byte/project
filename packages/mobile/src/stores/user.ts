import { defineStore } from "pinia";
import { loginApi } from "@/api/user";
import { isApiSuccess } from "@/utils/api";
import {
  clearToken,
  getStoredUser,
  getToken,
  setStoredUser,
  setToken
} from "@/utils/auth";

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
      const response = await loginApi({ username, password });

      if (!isApiSuccess(response) || !response.token) {
        throw new Error(response.message || "登录失败");
      }

      const user: MobileUser = {
        username: response.username,
        nickname: response.username,
        name: response.username,
        roles: response.role || [],
        permissions: response.button_permissions || []
      };

      this.token = response.token;
      setToken(response.token);
      this.user = user;
      setStoredUser(user);
    },
    logout() {
      this.token = "";
      this.user = null;
      clearToken();
      uni.reLaunch({ url: "/pages/login/index" });
    }
  }
});
