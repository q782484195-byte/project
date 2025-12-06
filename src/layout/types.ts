import type { FunctionalComponent } from "vue";
import { storageLocal, intersection } from "@pureadmin/utils";

const { VITE_HIDE_HOME } = import.meta.env;

// 判断两个数组彼此是否存在相同值（用于权限检查）
const isOneOfArray = (a: Array<string> | undefined, b: Array<string> | undefined): boolean => {
  if (!Array.isArray(a) || !Array.isArray(b)) {
    return true; // 如果没有定义 roles，默认允许访问
  }
  return intersection(a, b).length > 0;
};

// 工作台路由配置
const workspaceRoute: RouteConfigs = {
  path: "/workspace",
  name: "Workspace",
  meta: {
    title: "工作台",
    icon: "ep/home-filled",
    roles: ["Admin", "DepartmentManager", "Member"] // 工作台需要的角色权限
  }
};

// 根据权限过滤固定标签
export const getRouterArrays = (): Array<RouteConfigs> => {
  if (VITE_HIDE_HOME === "true") {
    return [];
  }

  try {
    // 动态导入 userKey 和 DataInfo，避免初始化顺序问题
    const { userKey } = require("@/utils/auth");
    const { DataInfo } = require("@/utils/auth");

    // 获取当前用户角色
    const userInfo = storageLocal().getItem<{ roles?: Array<string> }>(userKey);
    const currentRoles = userInfo?.roles ?? [];

    // 检查工作台路由权限
    const hasWorkspacePermission = isOneOfArray(
      workspaceRoute.meta?.roles as Array<string> | undefined,
      currentRoles
    );

    // 如果有权限，返回工作台路由；否则返回空数组
    return hasWorkspacePermission ? [workspaceRoute] : [];
  } catch (error) {
    // 如果导入失败（可能在初始化阶段），默认返回空数组
    return [];
  }
};

// 保持向后兼容，但建议使用 getRouterArrays()
// 延迟初始化，避免在模块加载时执行（初始化为空数组，运行时通过 getRouterArrays() 获取）
export const routerArrays: Array<RouteConfigs> = [];

export type routeMetaType = {
  title?: string;
  icon?: string | FunctionalComponent;
  showLink?: boolean;
  savedPosition?: boolean;
  auths?: Array<string>;
  roles?: Array<string>; // 角色权限数组
};

export type RouteConfigs = {
  path?: string;
  query?: object;
  params?: object;
  meta?: routeMetaType;
  children?: RouteConfigs[];
  name?: string;
};

export type multiTagsType = {
  tags: Array<RouteConfigs>;
};

export type tagsViewsType = {
  icon: string | FunctionalComponent;
  text: string;
  divided: boolean;
  disabled: boolean;
  show: boolean;
};

export interface setType {
  sidebar: {
    opened: boolean;
    withoutAnimation: boolean;
    isClickCollapse: boolean;
  };
  device: string;
  fixedHeader: boolean;
  classes: {
    hideSidebar: boolean;
    openSidebar: boolean;
    withoutAnimation: boolean;
    mobile: boolean;
  };
  hideTabs: boolean;
}

export type menuType = {
  id?: number;
  name?: string;
  path?: string;
  noShowingChildren?: boolean;
  children?: menuType[];
  value: unknown;
  meta?: {
    icon?: string;
    title?: string;
    rank?: number;
    showParent?: boolean;
    extraIcon?: string;
  };
  showTooltip?: boolean;
  parentId?: number;
  pathList?: number[];
  redirect?: string;
};

export type themeColorsType = {
  color: string;
  themeColor: string;
};

export interface scrollbarDomType extends HTMLElement {
  wrap?: {
    offsetWidth: number;
  };
}
