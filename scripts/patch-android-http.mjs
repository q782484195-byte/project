/**
 * 允许 Android WebView 访问 HTTP 接口（内网部署常见）
 * 在 cap sync 之后执行
 */
import { readFileSync, writeFileSync, existsSync } from "node:fs";
import { resolve } from "node:path";

const manifestPath = resolve(
  process.cwd(),
  "android/app/src/main/AndroidManifest.xml"
);

if (!existsSync(manifestPath)) {
  console.warn("[patch-android-http] 未找到 AndroidManifest，请先执行: pnpm cap:sync");
  process.exit(0);
}

let xml = readFileSync(manifestPath, "utf-8");

if (!xml.includes("usesCleartextTraffic")) {
  xml = xml.replace(
    /<application\b/,
    '<application android:usesCleartextTraffic="true"'
  );
  writeFileSync(manifestPath, xml, "utf-8");
  console.log("[patch-android-http] 已开启 usesCleartextTraffic");
} else {
  console.log("[patch-android-http] 已配置 HTTP 明文访问，跳过");
}
