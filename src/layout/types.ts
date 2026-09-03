import type { FunctionalComponent } from "vue";

const { VITE_HIDE_HOME } = import.meta.env;

// 首页路由配置（登录后默认固定标签）
const homeRoute: RouteConfigs = {
  path: "/welcome",
  name: "Welcome",
  meta: {
    title: "首页",
    icon: "ep/home-filled"
  }
};

// 根据权限过滤固定标签
export const getRouterArrays = (): Array<RouteConfigs> => {
  if (VITE_HIDE_HOME === "true") {
    return [];
  }

  return [homeRoute];
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
