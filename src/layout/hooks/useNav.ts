import { storeToRefs } from "pinia";
import { getConfig, configRef } from "@/config";
import { emitter } from "@/utils/mitt";
import Avatar from "@/assets/user.jpg";
import { getTopMenu } from "@/router/utils";
import { useFullscreen } from "@vueuse/core";
import type { routeMetaType } from "../types";
import { useRouter, useRoute } from "vue-router";
import { router, remainingPaths } from "@/router";
import { computed, onMounted, ref, type CSSProperties } from "vue";
import { useAppStoreHook } from "@/store/modules/app";
import { useUserStoreHook } from "@/store/modules/user";
import { selectDepartmentUsers } from "@/api/system";
import { useGlobal, isAllEmpty } from "@pureadmin/utils";
import { usePermissionStoreHook } from "@/store/modules/permission";
import ExitFullscreen from "~icons/ri/fullscreen-exit-fill";
import Fullscreen from "~icons/ri/fullscreen-fill";

const errorInfo =
  "The current routing configuration is incorrect, please check the configuration";

const roleNameMap: Record<string, string> = {
  Admin: "管理员",
  ProjectManager: "项目经理",
  DepartmentManager: "部门主管",
  Member: "普通成员",
  ProjectDirector: "项目总监",
  BusinessDepartmentMembers: "业务部门成员"
};

export function useNav() {
  const route = useRoute();
  const pureApp = useAppStoreHook();
  const routers = useRouter().options.routes;
  const { isFullscreen, toggle } = useFullscreen();
  const { wholeMenus } = storeToRefs(usePermissionStoreHook());
  /** 平台`layout`中所有`el-tooltip`的`effect`配置，默认`light` */
  const tooltipEffect = getConfig()?.TooltipEffect ?? "light";

  const getDivStyle = computed((): CSSProperties => {
    return {
      width: "100%",
      display: "flex",
      alignItems: "center",
      justifyContent: "space-between",
      overflow: "hidden"
    };
  });

  /** 头像（如果头像为空则使用 src/assets/user.jpg ） */
  const userAvatar = computed(() => {
    return isAllEmpty(useUserStoreHook()?.avatar)
      ? Avatar
      : useUserStoreHook()?.avatar;
  });

  /** 昵称（如果昵称为空则显示用户名） */
  const username = computed(() => {
    return isAllEmpty(useUserStoreHook()?.nickname)
      ? useUserStoreHook()?.username
      : useUserStoreHook()?.nickname;
  });

  const avatarsStyle = computed(() => {
    return username.value ? { marginRight: "10px" } : "";
  });

  /** 当前用户角色（中文显示名） */
  const roleNames = computed(() => {
    const roles = useUserStoreHook()?.roles ?? [];
    return roles.map(role => roleNameMap[role] || role);
  });

  /** 当前用户部门（从部门用户接口获取） */
  const departmentName = ref("");

  async function loadCurrentUserDepartment() {
    try {
      const response = await selectDepartmentUsers();
      if (response.code === 200 && Array.isArray(response.result)) {
        const currentUsername = (useUserStoreHook()?.username ?? "").trim();
        const me = response.result.find(
          u => (u.username || "").trim() === currentUsername
        );
        departmentName.value = me?.department || "";
      }
    } catch {
      departmentName.value = "";
    }
  }

  onMounted(() => {
    loadCurrentUserDepartment();
  });

  /** 部门 + 角色展示文案 */
  const userDeptRoleText = computed(() => {
    const parts: string[] = [];
    if (departmentName.value) parts.push(departmentName.value);
    if (roleNames.value.length) parts.push(roleNames.value.join("、"));
    return parts.join(" · ");
  });

  const isCollapse = computed(() => {
    return !pureApp.getSidebarStatus;
  });

  const device = computed(() => {
    return pureApp.getDevice;
  });

  const { $storage, $config } = useGlobal<GlobalPropertiesApi>();
  const layout = computed(() => {
    return $storage?.layout?.layout;
  });

  const title = computed(() => {
    // 直接访问响应式配置对象，确保能追踪到变化
    // 优先使用 configRef.Title（响应式），然后尝试 $config，最后使用默认值
    return configRef.Title || $config?.Title || getConfig()?.Title || "Pure Admin";
  });

  /** 动态title */
  function changeTitle(meta: routeMetaType) {
    const Title = getConfig()?.Title;
    if (Title && meta?.title) {
      document.title = `${meta.title} | ${Title}`;
    } else if (meta?.title) {
      document.title = meta.title;
    }
  }

  /** 退出登录 */
  function logout() {
    useUserStoreHook().logOut();
  }

  function backTopMenu() {
    router.push(getTopMenu()?.path);
  }

  function onPanel() {
    emitter.emit("openPanel");
  }

  function toggleSideBar() {
    pureApp.toggleSideBar();
  }

  function handleResize(menuRef) {
    menuRef?.handleResize();
  }

  function resolvePath(route) {
    if (!route.children) return console.error(errorInfo);
    const httpReg = /^http(s?):\/\//;
    const routeChildPath = route.children[0]?.path;
    if (httpReg.test(routeChildPath)) {
      return route.path + "/" + routeChildPath;
    } else {
      return routeChildPath;
    }
  }

  function menuSelect(indexPath: string) {
    if (wholeMenus.value.length === 0 || isRemaining(indexPath)) return;
    emitter.emit("changLayoutRoute", indexPath);
  }

  /** 判断路径是否参与菜单 */
  function isRemaining(path: string) {
    return remainingPaths.includes(path);
  }

  /** 获取`logo` */
  function getLogo() {
    return new URL("/logo.svg", import.meta.url).href;
  }

  return {
    route,
    title,
    device,
    layout,
    logout,
    routers,
    $storage,
    isFullscreen,
    Fullscreen,
    ExitFullscreen,
    toggle,
    backTopMenu,
    onPanel,
    getDivStyle,
    changeTitle,
    toggleSideBar,
    menuSelect,
    handleResize,
    resolvePath,
    getLogo,
    isCollapse,
    pureApp,
    username,
    userAvatar,
    avatarsStyle,
    roleNames,
    departmentName,
    userDeptRoleText,
    tooltipEffect
  };
}
