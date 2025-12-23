import App from "./App.vue";
import { setupStore } from "@/store";
import { getPlatformConfig } from "./config";
import { useEcharts } from "@/plugins/echarts";
import {
  createApp, type Directive
} from "vue";
import { useElementPlus } from "@/plugins/elementPlus";
import { injectResponsiveStorage } from "@/utils/responsive";

import Table from "@pureadmin/table";
import PureDescriptions from "@pureadmin/descriptions";

// 引入重置样式
import "./style/reset.scss";
// 导入公共样式
import "./style/index.scss";
// 一定要在main.ts中导入tailwind.css，防止vite每次hmr都会请求src/style/index.scss整体css文件导致热更新慢的问题
import "./style/tailwind.css";
import "element-plus/dist/index.css";
// 引入字体图标
import "./assets/iconfont/iconfont.js";
import "./assets/iconfont/iconfont.css";

const app = createApp(App);

// 自定义指令
import * as directives from "@/directives";
Object.keys(directives).forEach(key => {
  app.directive(key, (directives as { [key: string]: Directive })[key]);
});

// 延迟导入组件，避免初始化顺序问题
let componentsInitialized = false;

async function initComponents() {
  if (componentsInitialized) return;

  try {
    // 导入图标组件
    const iconModule = await import("./components/ReIcon");
    app.component("IconifyIconOffline", iconModule.IconifyIconOffline);
    app.component("IconifyIconOnline", iconModule.IconifyIconOnline);
    app.component("FontIcon", iconModule.FontIcon);

    // 导入权限组件（延迟导入，避免循环依赖）
    // 确保 router 已经初始化后再导入这些组件
    const [authModule, permsModule] = await Promise.all([
      import("@/components/ReAuth"),
      import("@/components/RePerms")
    ]);
    app.component("Auth", authModule.Auth);
    app.component("Perms", permsModule.Perms);

    componentsInitialized = true;
  } catch (error) {
    console.error("Failed to initialize components:", error);
    // 即使失败也标记为已初始化，避免重复尝试
    componentsInitialized = true;
  }
}

// 引入 vue-tippy
import "tippy.js/dist/tippy.css";
import "tippy.js/themes/light.css";
import VueTippy from "vue-tippy";

getPlatformConfig(app).then(async config => {
  setupStore(app);
  // 先初始化 storage，确保在组件使用前已经准备好
  injectResponsiveStorage(app, config);
  // 初始化 store hooks，避免循环依赖
  const { initStoreHooks, setRouterInstance } = await import("@/router/utils");
  await initStoreHooks();
  // 延迟导入 router，确保 store hooks 已初始化
  const routerModule = await import("./router");
  const router = routerModule.default;
  // 设置 router 实例，供 utils 使用
  setRouterInstance(router);
  app.use(router);
  await router.isReady();
  // 初始化组件（在 router 初始化之后）
  await initComponents();
  // 注册插件
  app.use(VueTippy).use(useElementPlus).use(Table).use(PureDescriptions).use(useEcharts);
  app.mount("#app");
});
