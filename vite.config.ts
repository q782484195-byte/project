import { type UserConfigExport, type ConfigEnv, loadEnv } from "vite";
import vue from "@vitejs/plugin-vue";
import vueJsx from "@vitejs/plugin-vue-jsx";
import { resolve } from "node:path";
import svgLoader from "vite-svg-loader";
import Icons from "unplugin-icons/vite";
import tailwindcss from "@tailwindcss/vite";
import removeNoMatch from "vite-plugin-router-warn";
import { visualizer } from "rollup-plugin-visualizer";
import removeConsole from "vite-plugin-remove-console";
import { codeInspectorPlugin } from "code-inspector-plugin";
import { vitePluginFakeServer } from "vite-plugin-fake-server";
import viteCompression from "vite-plugin-compression";
import dayjs from "dayjs";
import { readFileSync, existsSync } from "node:fs";
import type { Plugin } from "vite";

// 项目根目录
const root = process.cwd();

// 路径别名
const alias = {
  "@": resolve(root, "src"),
  "~": root,
  "#": resolve(root, "types")
};

// 应用信息
const __APP_INFO__ = {
  pkg: JSON.parse(readFileSync(resolve(root, "package.json"), "utf-8")),
  lastBuildTime: dayjs(new Date()).format("YYYY-MM-DD HH:mm:ss")
};

// 内联 platform-config.json 的插件
function inlinePlatformConfig(): Plugin {
  return {
    name: "inline-platform-config",
    enforce: "pre",
    resolveId(id) {
      if (id === "virtual:platform-config") {
        return "\0" + id; // 添加 \0 前缀使其成为虚拟模块
      }
    },
    load(id) {
      if (id === "\0virtual:platform-config") {
        const configPath = resolve(root, "public/platform-config.json");
        if (existsSync(configPath)) {
          const config = JSON.parse(readFileSync(configPath, "utf-8"));
          return `export default ${JSON.stringify(config)};`;
        }
        return "export default {};";
      }
    }
  };
}

// 环境变量处理
function wrapperEnv(envConfig: Record<string, any>) {
  const ret: Record<string, any> = {
    VITE_PORT: 8848,
    VITE_PUBLIC_PATH: "",
    VITE_ROUTER_HISTORY: "",
    VITE_CDN: false,
    VITE_HIDE_HOME: "false",
    VITE_COMPRESSION: "none"
  };

  for (const envName of Object.keys(envConfig)) {
    let realName = envConfig[envName].replace(/\\n/g, "\n");
    realName =
      realName === "true" ? true : realName === "false" ? false : realName;

    if (envName === "VITE_PORT") {
      realName = Number(realName);
    }
    ret[envName] = realName;
    if (typeof realName === "string") {
      process.env[envName] = realName;
    } else if (typeof realName === "object") {
      process.env[envName] = JSON.stringify(realName);
    }
  }
  return ret;
}

// 依赖预构建配置
const optimizeDepsInclude = [
  "qs",
  "mitt",
  "dayjs",
  "axios",
  "pinia",
  "vue-types",
  "js-cookie",
  "vue-tippy",
  "pinyin-pro",
  "sortablejs",
  "@vueuse/core",
  "@pureadmin/utils",
  "responsive-storage"
];

const optimizeDepsExclude = ["@iconify/json"];

// 获取插件列表
function getPluginsList(
  VITE_CDN: boolean,
  VITE_COMPRESSION: string
): any[] {
  const lifecycle = process.env.npm_lifecycle_event;
  const plugins: any[] = [
    inlinePlatformConfig(),
    tailwindcss(),
    vue(),
    vueJsx(),
    codeInspectorPlugin({
      bundler: "vite",
      hideConsole: true
    }),
    removeNoMatch(),
    vitePluginFakeServer({
      logger: false,
      include: "mock",
      infixName: false,
      enableProd: true
    }),
    svgLoader(),
    Icons({
      compiler: "vue3",
      scale: 1
    })
  ];

  // 压缩插件
  if (VITE_COMPRESSION !== "none") {
    if (VITE_COMPRESSION === "gzip" || VITE_COMPRESSION.includes("gzip")) {
      plugins.push(
        viteCompression({
          ext: ".gz",
          algorithm: "gzip",
          threshold: 0,
          deleteOriginFile: false
        })
      );
    }
    if (VITE_COMPRESSION === "brotli" || VITE_COMPRESSION.includes("brotli")) {
      plugins.push(
        viteCompression({
          ext: ".br",
          algorithm: "brotliCompress",
          threshold: 0,
          deleteOriginFile: false
        })
      );
    }
  }

  // 生产环境移除 console
  if (process.env.NODE_ENV === "production") {
    plugins.push(
      removeConsole({
        external: ["src/assets/iconfont/iconfont.js"]
      })
    );
  }

  // 打包分析
  if (lifecycle === "report") {
    plugins.push(
      visualizer({
        open: true,
        brotliSize: true,
        filename: "report.html"
      })
    );
  }

  return plugins.filter(Boolean);
}

export default ({ mode }: ConfigEnv): UserConfigExport => {
  const { VITE_CDN, VITE_PORT, VITE_COMPRESSION, VITE_PUBLIC_PATH } =
    wrapperEnv(loadEnv(mode, root));

  return {
    base: VITE_PUBLIC_PATH,
    root,
    resolve: {
      alias
    },
    server: {
      port: VITE_PORT,
      host: "0.0.0.0",
      proxy: {},
      warmup: {
        clientFiles: ["./index.html", "./src/{views,components}/*"]
      }
    },
    plugins: getPluginsList(VITE_CDN, VITE_COMPRESSION),
    optimizeDeps: {
      include: optimizeDepsInclude,
      exclude: optimizeDepsExclude
    },
    build: {
      target: "es2015",
      sourcemap: false,
      cssCodeSplit: true,
      minify: "esbuild",
      reportCompressedSize: false,
      chunkSizeWarningLimit: 2000,
      rollupOptions: {
        input: {
          index: resolve(root, "index.html")
        },
        output: {
          chunkFileNames: "static/js/[name]-[hash].js",
          entryFileNames: "static/js/[name]-[hash].js",
          assetFileNames: "static/[ext]/[name]-[hash].[ext]",
          // 完全禁用代码分割，将所有内容打包到一个文件
          // 这样可以完全避免循环依赖和初始化顺序问题
          manualChunks(id) {
            // 强制将所有内容（包括 ECharts）打包到 index chunk
            // 无论是什么模块，都返回 "index"，确保所有内容在一个文件
            return "index";
          }
        },
        external: [],
        // 压缩配置
        treeshake: {
          preset: "recommended",
          moduleSideEffects: (id) => {
            // 保留所有业务代码的副作用，避免循环依赖和初始化顺序问题
            if (
              id.includes("/src/router/") ||
              id.includes("/src/store/") ||
              id.includes("/src/components/") ||
              id.includes("/src/views/")
            ) {
              return true;
            }
            return false;
          }
        }
      },
      // 构建性能优化
      commonjsOptions: {
        include: [/node_modules/],
        transformMixedEsModules: true
      }
    },
    define: {
      __INTLIFY_PROD_DEVTOOLS__: false,
      __APP_INFO__: JSON.stringify(__APP_INFO__)
    }
  };
};
