import { defineStore } from "pinia";
import {
  type cacheType,
  store,
  getKeyList
} from "../utils";
import { constantMenus } from "@/router";
import { useMultiTagsStoreHook } from "./multiTags";
// 动态导入工具函数，避免循环依赖
let routerUtilsCache: {
  ascending: (arr: any[]) => any[];
  filterTree: (data: any[]) => any[];
  filterNoPermissionTree: (data: any[]) => any[];
  formatFlatteningRoutes: (routesList: any[]) => any[];
} | null = null;

async function getRouterUtils() {
  if (!routerUtilsCache) {
    const routerUtils = await import("@/router/utils");
    routerUtilsCache = {
      ascending: routerUtils.ascending,
      filterTree: routerUtils.filterTree,
      filterNoPermissionTree: routerUtils.filterNoPermissionTree,
      formatFlatteningRoutes: routerUtils.formatFlatteningRoutes
    };
  }
  return routerUtilsCache;
}

export const usePermissionStore = defineStore("pure-permission", {
  state: () => ({
    // 静态路由生成的菜单
    constantMenus,
    // 整体路由生成的菜单（静态、动态）
    wholeMenus: [],
    // 整体路由（一维数组格式）
    flatteningRoutes: [],
    // 缓存页面keepAlive
    cachePageList: []
  }),
  actions: {
    /** 组装整体路由生成的菜单 */
    async handleWholeMenus(routes: any[]) {
      const utils = await getRouterUtils();
      const filteredMenus = utils.filterNoPermissionTree(
        utils.filterTree(utils.ascending(this.constantMenus.concat(routes)))
      );
      this.wholeMenus = filteredMenus;

      this.flatteningRoutes = utils.formatFlatteningRoutes(
        this.constantMenus.concat(routes) as any
      );
    },
    /** 监听缓存页面是否存在于标签页，不存在则删除 */
    clearCache() {
      let cacheLength = this.cachePageList.length;
      const nameList = getKeyList(useMultiTagsStoreHook().multiTags, "name");
      while (cacheLength > 0) {
        nameList.findIndex(v => v === this.cachePageList[cacheLength - 1]) ===
          -1 &&
          this.cachePageList.splice(
            this.cachePageList.indexOf(this.cachePageList[cacheLength - 1]),
            1
          );
        cacheLength--;
      }
    },
    cacheOperate({ mode, name }: cacheType) {
      const delIndex = this.cachePageList.findIndex(v => v === name);
      switch (mode) {
        case "refresh":
          this.cachePageList = this.cachePageList.filter(v => v !== name);
          this.clearCache();
          break;
        case "add":
          this.cachePageList.push(name);
          break;
        case "delete":
          delIndex !== -1 && this.cachePageList.splice(delIndex, 1);
          this.clearCache();
          break;
      }
    },
    /** 清空缓存页面 */
    clearAllCachePage() {
      this.wholeMenus = [];
      this.cachePageList = [];
    }
  }
});

export function usePermissionStoreHook() {
  return usePermissionStore(store);
}
