import axios from "axios";
import type { App } from "vue";
import { reactive } from "vue";

// 使用响应式对象，确保配置更新后组件能响应
let config: PlatformConfigs = reactive({} as PlatformConfigs);
const { VITE_PUBLIC_PATH } = import.meta.env;

// 导出响应式配置对象，供组件直接访问
export const configRef = config;

// 构建时配置（由 Vite 插件内联）
let buildTimeConfig: PlatformConfigs | null = null;

// 异步加载构建时配置
async function loadBuildTimeConfig() {
  if (import.meta.env.PROD) {
    try {
      // 在构建时，Vite 插件会内联配置
      // @ts-ignore - virtual module
      const inlineConfig = await import("virtual:platform-config").catch(() => null);
      if (inlineConfig?.default) {
        buildTimeConfig = inlineConfig.default;
        // 立即设置配置
        Object.assign(config, buildTimeConfig);
        return buildTimeConfig;
      }
    } catch (e) {
      // 忽略构建时错误，使用运行时加载
      console.warn("构建时配置加载失败，将使用运行时加载:", e);
    }
  }
  return null;
}

const setConfig = (cfg?: unknown) => {
  // 使用 Object.assign 更新响应式对象
  if (cfg && typeof cfg === "object") {
    Object.assign(config, cfg);
  }
};

const getConfig = (key?: string): PlatformConfigs => {
  if (typeof key === "string") {
    const arr = key.split(".");
    if (arr && arr.length) {
      let data = config;
      arr.forEach(v => {
        if (data && typeof data[v] !== "undefined") {
          data = data[v];
        } else {
          data = null;
        }
      });
      return data;
    }
  }
  return config;
};

/** 获取项目动态全局配置 */
export const getPlatformConfig = async (app: App): Promise<PlatformConfigs> => {
  // 尝试加载构建时配置
  const inlineConfig = await loadBuildTimeConfig();
  if (inlineConfig) {
    app.config.globalProperties.$config = inlineConfig;
    setConfig(inlineConfig);
    console.log("使用构建时配置，Title:", inlineConfig.Title);
    return inlineConfig;
  }

  // 先设置一个空的配置对象，避免组件访问时出错
  app.config.globalProperties.$config = getConfig() || {};

  return axios({
    method: "get",
    url: `${VITE_PUBLIC_PATH}platform-config.json`,
    // 添加缓存控制，确保获取最新配置
    headers: {
      "Cache-Control": "no-cache",
      "Pragma": "no-cache"
    },
    // 添加超时设置
    timeout: 5000
  })
    .then(({ data: configData }) => {
      // 自动注入系统配置
      if (app && typeof configData === "object" && configData !== null) {
        // 直接使用加载的配置，不合并（因为初始 config 是空对象）
        app.config.globalProperties.$config = configData;
        // 设置全局配置（使用 Object.assign 更新响应式对象）
        setConfig(configData);
        console.log("配置加载成功，Title:", configData.Title);
        console.log("当前 getConfig().Title:", getConfig()?.Title);
        console.log("当前 configRef.Title:", configRef.Title);
        return configData;
      }
      console.warn("配置数据格式不正确:", configData);
      return app.config.globalProperties.$config;
    })
    .catch((error) => {
      console.error("加载 platform-config.json 失败:", error);
      console.error("请求 URL:", `${VITE_PUBLIC_PATH}platform-config.json`);
      // 即使加载失败，也返回当前配置，避免应用崩溃
      const currentConfig = getConfig() || {};
      app.config.globalProperties.$config = currentConfig;
      return currentConfig;
    });
};

/** 本地响应式存储的命名空间 */
const responsiveStorageNameSpace = () => getConfig().ResponsiveStorageNameSpace;

export { getConfig, setConfig, responsiveStorageNameSpace };
