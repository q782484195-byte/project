// import "@/utils/sso";
import Cookies from "js-cookie";
import { getConfig } from "@/config";
import NProgress from "@/utils/progress";
import { buildHierarchyTree } from "@/utils/tree";
import remainingRouter from "./modules/remaining";
import {
  isUrl,
  openLink,
  cloneDeep,
  isAllEmpty,
  storageLocal
} from "@pureadmin/utils";
import { setRouterInstance } from "./context";
import {
  ascending,
  getTopMenu,
  initRouter,
  isOneOfArray,
  findRouteByPath,
  handleAliveRoute,
  formatTwoStageRoutes,
  formatFlatteningRoutes,
  pushDynamicRouteTag
} from "./utils";
import {
  type Router,
  type RouteRecordRaw,
  type RouteComponent,
  createRouter,
  createWebHistory,
  createWebHashHistory,
  type RouterHistory
} from "vue-router";
import {
  type DataInfo,
  userKey,
  removeToken,
  multipleTabsKey
} from "@/utils/auth";

/** 自动导入全部静态路由，无需再手动引入！匹配 src/router/modules 目录（任何嵌套级别）中具有 .ts 扩展名的所有文件，除了 remaining.ts 文件
 * 如何匹配所有文件请看：https://github.com/mrmlnc/fast-glob#basic-syntax
 * 如何排除文件请看：https://cn.vitejs.dev/guide/features.html#negative-patterns
 */
const modules: Record<string, any> = import.meta.glob(
  ["./modules/**/*.ts", "!./modules/**/remaining.ts"],
  {
    eager: true
  }
);

/** 原始静态路由（未做任何处理） */
const routes = [];

Object.keys(modules).forEach(key => {
  const def = modules[key].default;
  if (def != null) routes.push(def);
});

/** 计算静态路由（延迟计算，避免模块加载时的初始化问题） */
function computeConstantRoutes(): Array<RouteRecordRaw> {
  return formatTwoStageRoutes(
    formatFlatteningRoutes(buildHierarchyTree(ascending(routes.flat(Infinity))))
  );
}

/** 导出处理后的静态路由（三级及以上的路由全部拍成二级） */
export const constantRoutes: Array<RouteRecordRaw> = computeConstantRoutes();

/** 初始的静态路由，用于退出登录时重置路由 */
let initConstantRoutes: Array<RouteRecordRaw> | null = null;

function getInitConstantRoutes(): Array<RouteRecordRaw> {
  if (!initConstantRoutes) {
    initConstantRoutes = cloneDeep(constantRoutes);
  }
  return initConstantRoutes;
}

/** 用于渲染菜单，保持原始层级 */
export const constantMenus: Array<RouteComponent> = ascending(
  routes.flat(Infinity)
).concat(...remainingRouter);

/** 不参与菜单的路由 */
export const remainingPaths = Object.keys(remainingRouter).map(v => {
  return remainingRouter[v].path;
});

// 获取路由历史模式（在 router/index.ts 中实现，避免从 utils 导入导致循环依赖）
function getHistoryMode(routerHistory: string): RouterHistory {
  // 如果没有配置或为空，默认使用 hash 模式（兼容性更好）
  if (!routerHistory || routerHistory.trim() === "") {
    return createWebHashHistory("");
  }
  // len为1 代表只有历史模式 为2 代表历史模式中存在base参数
  const historyMode = routerHistory.split(",");
  const leftMode = historyMode[0];
  const rightMode = historyMode[1];
  // no param
  if (historyMode.length === 1) {
    if (leftMode === "hash") {
      return createWebHashHistory("");
    } else if (leftMode === "h5") {
      return createWebHistory("");
    }
  } //has param
  else if (historyMode.length === 2) {
    if (leftMode === "hash") {
      return createWebHashHistory(rightMode);
    } else if (leftMode === "h5") {
      return createWebHistory(rightMode);
    }
  }
  // 默认返回 hash 模式
  return createWebHashHistory("");
}

// 延迟创建 router 实例，避免循环依赖
let routerInstance: Router | null = null;
let routerInitialized = false;

function createRouterInstance(): Router {
  if (!routerInstance) {
    // 确保路由计算完成
    const computedRoutes = computeConstantRoutes();
    routerInstance = createRouter({
      history: getHistoryMode(import.meta.env.VITE_ROUTER_HISTORY || ""),
      routes: computedRoutes.concat(...(remainingRouter as any)),
      strict: true,
      scrollBehavior(to, from, savedPosition) {
        return new Promise(resolve => {
          if (savedPosition) {
            return savedPosition;
          } else {
            if (from.meta.saveSrollTop) {
              const top: number =
                document.documentElement.scrollTop || document.body.scrollTop;
              resolve({ left: 0, top });
            }
          }
        });
      }
    });
    // 与 main.ts 中 setRouterInstance 同步，确保 initRouter / getRouterAsync 在任意时机都能拿到实例
    setRouterInstance(routerInstance);
    // 延迟注册路由守卫，确保所有依赖都已初始化
    if (!routerInitialized) {
      setupRouterGuards(routerInstance);
      routerInitialized = true;
    }
  }
  return routerInstance;
}

/** 记录已经加载的页面路径 */
const loadedPaths = new Set<string>();

/** 重置已加载页面记录 */
export function resetLoadedPaths() {
  loadedPaths.clear();
}

/** 重置路由 */
export function resetRouter() {
  router.clearRoutes();
  const initRoutes = getInitConstantRoutes();
  for (const route of initRoutes.concat(...(remainingRouter as any))) {
    router.addRoute(route);
  }
  router.options.routes = computeConstantRoutes();
  // 延迟导入避免循环依赖
  import("@/store/modules/permission").then(module => {
    module.usePermissionStoreHook().clearAllCachePage();
  });
  resetLoadedPaths();
}

/** 路由白名单 */
const whiteList = ["/login"];

const { VITE_HIDE_HOME } = import.meta.env;

/** 设置路由守卫（延迟执行，避免循环依赖） */
function setupRouterGuards(router: Router) {
  router.beforeEach(async (to: ToRouteType, _from, next) => {
    to.meta.loaded = loadedPaths.has(to.path);

    if (!to.meta.loaded) {
      NProgress.start();
    }

    if (to.meta?.keepAlive) {
      handleAliveRoute(to, "add");
      // 页面整体刷新和点击标签页刷新
      if (_from.name === undefined || _from.name === "Redirect") {
        handleAliveRoute(to);
      }
    }
    const userInfo = storageLocal().getItem<DataInfo<number>>(userKey);
    const externalLink = isUrl(to?.name as string);
    if (!externalLink) {
      to.matched.some(item => {
        if (!item.meta.title) return "";
        const Title = getConfig().Title;
        if (Title) document.title = `${item.meta.title} | ${Title}`;
        else document.title = item.meta.title as string;
      });
    }
    /** 如果已经登录并存在登录信息后不能跳转到路由白名单，而是继续保持在当前页面 */
    function toCorrectRoute() {
      whiteList.includes(to.fullPath) ? next(_from.fullPath) : next();
    }
    if (Cookies.get(multipleTabsKey) && userInfo) {
      // 无权限跳转403页面
      if (to.meta?.roles && !isOneOfArray(to.meta?.roles, userInfo?.roles)) {
        next({ path: "/error/403" });
      }
      // 开启隐藏首页后在浏览器地址栏手动输入首页dashboard路由则跳转到404页面
      if (VITE_HIDE_HOME === "true" && to.fullPath === "/dashboard/index") {
        next({ path: "/error/404" });
      }
      if (_from?.name) {
        // name为超链接
        if (externalLink) {
          openLink(to?.name as string);
          NProgress.done();
        } else {
          toCorrectRoute();
        }
      } else {
        // 刷新
        // 延迟导入避免循环依赖
        try {
          const [permissionModule, multiTagsModule] = await Promise.all([
            import("@/store/modules/permission"),
            import("@/store/modules/multiTags")
          ]);
          const usePermissionStoreHook = permissionModule.usePermissionStoreHook;
          const useMultiTagsStoreHook = multiTagsModule.useMultiTagsStoreHook;

          // 初始化菜单路由
          const permissionStore = usePermissionStoreHook();
          if (permissionStore.wholeMenus.length === 0 && to.path !== "/login") {
            try {
              const routerInstance = (await initRouter()) as Router;
              if (!useMultiTagsStoreHook().getMultiTagsCache) {
                const { path } = to;
                const route = findRouteByPath(
                  path,
                  routerInstance.options.routes[0].children
                );
                getTopMenu(true);
                // query、params模式路由传参数的标签页不在此处处理
                if (route && route.meta?.title) {
                  if (isAllEmpty(route.parentId) && route.meta?.backstage) {
                    // 此处为动态顶级路由（目录）
                    const { path, name, meta } = route.children[0];
                    useMultiTagsStoreHook().handleTags("push", {
                      path,
                      name,
                      meta
                    });
                  } else {
                    const { path, name, meta } = route;
                    useMultiTagsStoreHook().handleTags("push", {
                      path,
                      name,
                      meta
                    });
                  }
                }
              }
              // 确保动态路由完全加入路由列表并且不影响静态路由（注意：动态路由刷新时router.beforeEach可能会触发两次，第一次触发动态路由还未完全添加，第二次动态路由才完全添加到路由列表，如果需要在router.beforeEach做一些判断可以在to.name存在的条件下去判断，这样就只会触发一次）
              if (isAllEmpty(to.name)) routerInstance.push(to.fullPath);
            } catch (error) {
              console.error("初始化路由失败:", error);
            }
          }
          toCorrectRoute();
        } catch (error) {
          console.error("路由守卫错误:", error);
          toCorrectRoute();
        }
      }
    } else {
      if (to.path !== "/login") {
        if (whiteList.indexOf(to.path) !== -1) {
          next();
        } else {
          removeToken();
          next({ path: "/login" });
        }
      } else {
        next();
      }
    }
  });

  router.afterEach(to => {
    loadedPaths.add(to.path);
    NProgress.done();
    // params/query 动态详情页（如任务详情）加入标签栏
    void pushDynamicRouteTag(to as ToRouteType);
  });
}

/** 创建路由实例（延迟创建） */
export const router: Router = createRouterInstance();

export default router;
