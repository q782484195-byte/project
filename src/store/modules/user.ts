import { defineStore } from "pinia";
import {
  type userType,
  store,
  storageLocal
} from "../utils";
import { router, resetRouter } from "@/router";
import { getRouterArrays } from "@/layout/types";
import { type UserResult, getLogin } from "@/api/user";
import { useMultiTagsStoreHook } from "./multiTags";
import {
  type DataInfo,
  setToken,
  removeToken,
  userKey,
  parseTokenExpiration
} from "@/utils/auth";

export const useUserStore = defineStore("pure-user", {
  state: (): userType => ({
    // 头像
    avatar: storageLocal().getItem<DataInfo<number>>(userKey)?.avatar ?? "",
    // 用户名
    username: storageLocal().getItem<DataInfo<number>>(userKey)?.username ?? "",
    // 昵称
    nickname: storageLocal().getItem<DataInfo<number>>(userKey)?.nickname ?? "",
    // 页面级别权限
    roles: storageLocal().getItem<DataInfo<number>>(userKey)?.roles ?? [],
    // 按钮级别权限
    permissions:
      storageLocal().getItem<DataInfo<number>>(userKey)?.permissions ?? [],
    // 是否勾选了登录页的免登录
    isRemembered: false,
    // 登录页的免登录存储几天，默认7天
    loginDay: 7
  }),
  actions: {
    /** 存储头像 */
    SET_AVATAR(avatar: string) {
      this.avatar = avatar;
    },
    /** 存储用户名 */
    SET_USERNAME(username: string) {
      this.username = username;
    },
    /** 存储昵称 */
    SET_NICKNAME(nickname: string) {
      this.nickname = nickname;
    },
    /** 存储角色 */
    SET_ROLES(roles: Array<string>) {
      this.roles = roles;
    },
    /** 存储按钮级别权限 */
    SET_PERMS(permissions: Array<string>) {
      this.permissions = permissions;
    },
    /** 存储是否勾选了登录页的免登录 */
    SET_ISREMEMBERED(bool: boolean) {
      this.isRemembered = bool;
    },
    /** 设置登录页的免登录存储几天 */
    SET_LOGINDAY(value: number) {
      this.loginDay = Number(value);
    },
    /** 登入 */
    async loginByUsername(data) {
      return new Promise<UserResult>((resolve, reject) => {
        getLogin(data)
          .then((response: any) => {
            // 转换实际返回的数据格式为期望的格式
            if (response?.code === 200) {
              // 计算过期时间：优先从 token 中解析，否则默认7天后过期
              let expiresDate = new Date();
              const tokenExpiration = response.token
                ? parseTokenExpiration(response.token)
                : null;
              if (tokenExpiration) {
                expiresDate = new Date(tokenExpiration);
              } else {
                expiresDate.setDate(expiresDate.getDate() + 7); // 默认7天过期
              }

              const transformedData: UserResult = {
                success: true,
                data: {
                  avatar: "", // 后端未返回头像，使用默认值
                  username: response.username || "",
                  nickname: response.username || "", // 使用用户名作为昵称
                  roles: response.role || [],
                  permissions: response.button_permissions || [],
                  accessToken: response.token || "",
                  refreshToken: response.token || "", // 如果没有单独的 refreshToken，使用 token
                  expires: expiresDate
                }
              };

              setToken(transformedData.data);

              // 打印当前权限信息
              console.log("=== 登录成功 - 当前用户权限信息 ===");
              console.log("角色 (roles):", transformedData.data.roles);
              console.log(
                "按钮权限 (permissions):",
                transformedData.data.permissions
              );
              console.log("用户名 (username):", transformedData.data.username);
              console.log("===================================");

              resolve(transformedData);
            } else {
              // 登录失败（code !== 200）
              const errorResult: UserResult = {
                success: false,
                data: {
                  avatar: "",
                  username: "",
                  nickname: "",
                  roles: [],
                  permissions: [],
                  accessToken: "",
                  refreshToken: "",
                  expires: new Date()
                },
                message: response?.message || "登录失败"
              } as any;
              resolve(errorResult);
            }
          })
          .catch(error => {
            reject(error);
          });
      });
    },
    /** 前端登出（不调用接口） */
    logOut() {
      this.username = "";
      this.roles = [];
      this.permissions = [];
      removeToken();
      useMultiTagsStoreHook().handleTags("equal", [...getRouterArrays()]);
      resetRouter();
      router.push("/login");
    }
    /** 刷新`token` - 已注释，token过期直接跳转登录页面 */
    // async handRefreshToken(data) {
    //   return new Promise<RefreshTokenResult>((resolve, reject) => {
    //     refreshTokenApi(data)
    //       .then(data => {
    //         if (data) {
    //           setToken(data.data);
    //           resolve(data);
    //         }
    //       })
    //       .catch(error => {
    //         reject(error);
    //       });
    //   });
    // }
  }
});

export function useUserStoreHook() {
  return useUserStore(store);
}
