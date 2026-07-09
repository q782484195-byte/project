import type { CapacitorConfig } from "@capacitor/cli";

const config: CapacitorConfig = {
  appId: "com.pm.management",
  appName: "项目管理",
  webDir: "dist",
  server: {
    // hash 路由在 WebView 中更稳定
    androidScheme: "https"
  },
  android: {
    allowMixedContent: true
  }
};

export default config;
