import { existsSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath, URL } from "node:url";

import { defineConfig } from "vite";
import Uni from "@uni-helper/plugin-uni";

const rootDir = dirname(fileURLToPath(import.meta.url));

/**
 * 仅锁定 @vue/* 子包为 3.4.21，避免根仓库 hoist 的 3.5 混入。
 * 不要 alias `vue` 本身 —— uni-app H5 会通过插件把 `vue` 解析到
 * `@dcloudio/uni-h5-vue`（含 injectHook 等补丁导出）。
 */
const VUE_SUB_PKGS = [
  "@vue/shared",
  "@vue/reactivity",
  "@vue/runtime-core",
  "@vue/runtime-dom",
  "@vue/compiler-core",
  "@vue/compiler-dom",
  "@vue/compiler-sfc"
] as const;

function resolveLocalPkg(name: string) {
  const pkgDir = join(rootDir, "node_modules", ...name.split("/"));
  if (!existsSync(join(pkgDir, "package.json"))) {
    throw new Error(`未找到本地依赖 ${name}，请在 packages/mobile 下执行 pnpm install`);
  }
  return pkgDir;
}

const vueSubAliases = Object.fromEntries(
  VUE_SUB_PKGS.map((name) => [name, resolveLocalPkg(name)])
);

export default defineConfig({
  resolve: {
    dedupe: [...VUE_SUB_PKGS],
    alias: {
      "@": fileURLToPath(new URL("./src", import.meta.url)),
      ...vueSubAliases
    }
  },
  plugins: [Uni()]
});
