import { existsSync, readFileSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const cliAppDir = join(root, "dist/build/app");
const hbAppPlusDir = join(root, "src/unpackage/dist/build/app-plus");
const releaseApkDir = join(root, "src/unpackage/release/apk");
const envProduction = join(root, ".env.production");

function resolveAppOutputDir() {
  if (existsSync(cliAppDir)) return { path: cliAppDir, source: "CLI (pnpm build:app)" };
  if (existsSync(hbAppPlusDir)) return { path: hbAppPlusDir, source: "HBuilderX 历史产物" };
  return null;
}

const output = resolveAppOutputDir();

function readApiUrl() {
  if (!existsSync(envProduction)) return "(未找到 .env.production)";
  const match = readFileSync(envProduction, "utf8").match(/^VITE_API_URL=(.+)$/m);
  return match?.[1]?.trim() || "(未配置 VITE_API_URL)";
}

function ok(message) {
  console.log(`  ✓ ${message}`);
}

function step(index, message) {
  console.log(`\n${index}. ${message}`);
}

console.log("\n========================================");
console.log("  App 资源编译完成 — 本地打包指引");
console.log("========================================\n");

if (output) {
  ok(`产物目录 (${output.source}): ${output.path}`);
} else {
  console.error(`  ✗ 未找到编译产物`);
  console.error(`    CLI 预期: ${cliAppDir}`);
  console.error(`    HBuilderX 预期: ${hbAppPlusDir}`);
  console.error("    请检查 build:app 是否成功。");
  process.exit(1);
}

ok(`API 地址 (.env.production): ${readApiUrl()}`);

step(1, "用 HBuilderX 打开项目目录");
console.log(`     ${root}`);

step(2, "若首次打包或改过 manifest/权限/图标/原生模块");
console.log("     发行 → 原生 App-本地打包 → 生成本地打包 App 资源");

step(3, "打 Android 安装包");
console.log("     发行 → 原生 App-本地打包 → 打 Android 安装包");

step(4, "选择证书");
console.log("     测试: HBuilderX 自带 Test.keystore");
console.log("     正式: 见 LOCAL_BUILD.md 第六节，或执行 pnpm keystore:gen");

step(5, "安装 APK");
console.log(`     常见输出: ${releaseApkDir}`);
console.log("\n详细清单见: packages/mobile/LOCAL_BUILD.md\n");
