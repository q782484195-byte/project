import { ref } from "vue";
import { getConfig } from "@/config";
import { useLayout } from "./useLayout";
import { removeToken } from "@/utils/auth";
import { getRouterArrays } from "@/layout/types";
import { router, resetRouter } from "@/router";
import type { themeColorsType } from "../types";
import { useAppStoreHook } from "@/store/modules/app";
import { useEpThemeStoreHook } from "@/store/modules/epTheme";
import { useMultiTagsStoreHook } from "@/store/modules/multiTags";
import { darken, lighten, useGlobal, storageLocal } from "@pureadmin/utils";

export function useDataThemeChange() {
  const { layoutTheme, layout } = useLayout();
  const themeColors = ref<Array<themeColorsType>>([
    /* 亮白色 */
    { color: "#ffffff", themeColor: "light" },
    /* 道奇蓝 */
    { color: "#1b2a47", themeColor: "default" },
    /* 深紫罗兰色 */
    { color: "#722ed1", themeColor: "saucePurple" },
    /* 深粉色 */
    { color: "#eb2f96", themeColor: "pink" },
    /* 猩红色 */
    { color: "#f5222d", themeColor: "dusk" },
    /* 橙红色 */
    { color: "#fa541c", themeColor: "volcano" },
    /* 绿宝石 */
    { color: "#13c2c2", themeColor: "mingQing" },
    /* 酸橙绿 */
    { color: "#52c41a", themeColor: "auroraGreen" }
  ]);

  const { $storage } = useGlobal<GlobalPropertiesApi>();
  const dataTheme = ref<boolean>($storage?.layout?.darkMode ?? false);
  const overallStyle = ref<string>($storage?.layout?.overallStyle ?? "light");
  const body = document.documentElement as HTMLElement;

  function toggleClass(flag: boolean, clsName: string, target?: HTMLElement) {
    const targetEl = target || document.body;
    if (!targetEl) return;
    let className = targetEl.className || "";
    // 确保 className 是字符串
    if (typeof className !== "string") {
      className = String(className || "");
    }
    className = className.replace(clsName, "").trim();
    targetEl.className = flag ? `${className} ${clsName}`.trim() : className;
  }

  /** 设置导航主题色 */
  function setLayoutThemeColor(
    theme = getConfig()?.Theme ?? "light",
    isClick = true
  ) {
    if (!layoutTheme.value) return;
    // 确保 theme 是字符串
    const themeValue = typeof theme === "string" ? theme : "light";
    layoutTheme.value.theme = themeValue;
    document.documentElement.setAttribute("data-theme", themeValue);
    // 如果非isClick，保留之前的themeColor
    const storageThemeColor = $storage?.layout?.themeColor ?? "light";
    if (!$storage?.layout) {
      $storage.layout = {};
    }
    $storage.layout = {
      layout: layout.value ?? "vertical",
      theme: themeValue,
      darkMode: dataTheme.value ?? false,
      sidebarStatus: $storage.layout?.sidebarStatus ?? true,
      epThemeColor: $storage.layout?.epThemeColor ?? "#409EFF",
      themeColor: isClick ? themeValue : (storageThemeColor || "light"),
      overallStyle: overallStyle.value ?? "light"
    };

    if (themeValue === "default" || themeValue === "light") {
      const epThemeColor = getConfig()?.EpThemeColor ?? "#409EFF";
      setEpThemeColor(epThemeColor);
    } else {
      const colors = themeColors.value.find(v => v.themeColor === themeValue);
      if (colors) {
        setEpThemeColor(colors.color);
      } else {
        setEpThemeColor("#409EFF");
      }
    }
  }

  function setPropertyPrimary(mode: string, i: number, color: string) {
    document.documentElement.style.setProperty(
      `--el-color-primary-${mode}-${i}`,
      dataTheme.value ? darken(color, i / 10) : lighten(color, i / 10)
    );
  }

  /** 设置 `element-plus` 主题色 */
  const setEpThemeColor = (color: string) => {
    useEpThemeStoreHook().setEpThemeColor(color);
    document.documentElement.style.setProperty("--el-color-primary", color);
    for (let i = 1; i <= 2; i++) {
      setPropertyPrimary("dark", i, color);
    }
    for (let i = 1; i <= 9; i++) {
      setPropertyPrimary("light", i, color);
    }
  };

  /** 浅色、深色整体风格切换 */
  function dataThemeChange(overall?: string) {
    // 确保 overall 有默认值
    overallStyle.value = overall ?? "light";
    const epThemeStore = useEpThemeStoreHook();
    if (!epThemeStore) return;

    if (epThemeStore.epTheme === "light" && dataTheme.value) {
      setLayoutThemeColor("default", false);
    } else {
      setLayoutThemeColor(epThemeStore.epTheme, false);
    }

    if (dataTheme.value) {
      document.documentElement.classList.add("dark");
    } else {
      if ($storage?.layout?.themeColor === "light") {
        setLayoutThemeColor("light", false);
      }
      document.documentElement.classList.remove("dark");
    }
  }

  /** 清空缓存并返回登录页 */
  function onReset() {
    removeToken();
    storageLocal().clear();
    const { Grey, Weak, MultiTagsCache, EpThemeColor, Layout } = getConfig();
    useAppStoreHook().setLayout(Layout);
    setEpThemeColor(EpThemeColor);
    useMultiTagsStoreHook().multiTagsCacheChange(MultiTagsCache);
    toggleClass(Grey, "html-grey", document.querySelector("html"));
    toggleClass(Weak, "html-weakness", document.querySelector("html"));
    router.push("/login");
    useMultiTagsStoreHook().handleTags("equal", [...getRouterArrays()]);
    resetRouter();
  }

  return {
    body,
    dataTheme,
    overallStyle,
    layoutTheme,
    themeColors,
    onReset,
    toggleClass,
    dataThemeChange,
    setEpThemeColor,
    setLayoutThemeColor
  };
}
