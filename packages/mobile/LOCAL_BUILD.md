# 本地打包检查清单（Android）

适用于 `packages/mobile` 的 HBuilderX 本地打包流程。按顺序勾选，避免漏步骤。

## 一、环境准备（首次做一次）

- [ ] 已安装 [HBuilderX](https://www.dcloud.io/hbuilderx.html)（建议正式版）
- [ ] HBuilderX：**工具 → 设置 → 运行配置**，已配置 **Android SDK 路径**
  - 常见路径：`C:\Users\<用户名>\AppData\Local\Android\Sdk`
  - 或通过 HBuilderX：**工具 → SDK 配置 → Android SDK** 安装
- [ ] SDK 已安装 **Android 10 (API 30)**（与 `src/manifest.json` 中 `targetSdkVersion` 一致）
- [ ] 已安装 **Android SDK Build-Tools**
- [ ] JDK 可用（HBuilderX 3.x 通常用 JDK 8；可在 HBuilderX 运行配置中指定）

### 快速自检

在 PowerShell 中（路径按实际修改）：

```powershell
# SDK 目录存在
Test-Path "$env:LOCALAPPDATA\Android\Sdk"

# keytool 可用（随 JDK 提供）
keytool -help
```

---

## 二、项目与配置核对

- [ ] 用 HBuilderX 打开目录：`packages/mobile`（不是只开 `src`）
- [ ] `src/manifest.json` 中包名：`com.pm.management`
- [ ] AppID：`__UNI__7E207AA`
- [ ] `.env.production` 中 `VITE_API_URL` 是手机能访问的地址（同网段内网 IP 或公网域名）
- [ ] 若需 HTTP 明文：已保留 `AndroidManifest.xml` 与 `nativeResources/android/res/xml/network_security_config.xml`

---

## 三、编译前端资源（每次发版前）

在项目根目录 `packages/mobile` 执行：

```bash
pnpm install
pnpm build:apk
```

`build:apk` 会：

1. 执行 `uni build -p app`，注入 `.env.production` 中的 API 地址
2. 校验 `dist/build/app/` 产物
3. 打印后续 HBuilderX 本地打包步骤

预期产物目录：

```
packages/mobile/dist/build/app/
```

（若曾用 HBuilderX 云打包，也可能存在 `src/unpackage/dist/build/app-plus/`）

---

## 四、HBuilderX 本地打 APK

### 首次打包，或修改了 manifest / 权限 / 图标 / 原生模块

- [ ] **发行 → 原生 App-本地打包 → 生成本地打包 App 资源**

### 每次出安装包

- [ ] **发行 → 原生 App-本地打包 → 打 Android 安装包**
- [ ] 选择证书（测试见第五节，正式见第六节）
- [ ] 等待编译完成（首次较慢，后续增量更快）

常见输出目录：

```
packages/mobile/src/unpackage/release/apk/
```

---

## 五、测试证书（内部调试）

仅用于开发/内测，**不能用于应用市场上架**。

HBuilderX 自带测试证书路径（示例）：

```
C:/Users/W10/Desktop/HBuilderX/plugins/app-safe-pack/Test.keystore
```

- 别名：`android`
- 密码：见 HBuilderX 文档或使用自有测试 keystore

---

## 六、正式签名证书（发版必做）

### 生成 keystore（仅首次）

在 `packages/mobile` 目录执行：

```powershell
pnpm keystore:gen
```

或手动：

```powershell
keytool -genkeypair -alias pm-management -keyalg RSA -keysize 2048 -validity 36500 -keystore keystore/pm-management.keystore
```

按提示填写组织信息；**密码请自行记录，勿提交到 Git**。

### HBuilderX 中配置

**发行 → 原生 App-本地打包 → 证书管理 → Android**，填写：

| 项 | 示例 |
|----|------|
| 证书文件 | `packages/mobile/keystore/pm-management.keystore` |
| 证书库密码 | （你设置的 store 密码） |
| 证书别名 | `pm-management` |
| 证书私钥密码 | （通常与 store 密码相同） |

可参考 `keystore.example.json` 的字段说明；真实密码放在本机 `keystore.local.json`（已 gitignore）。

### 重要提醒

- 正式包与测试包 **证书不同** 时，Android 视为两个应用，无法覆盖安装
- **keystore 丢失无法找回**，请备份到安全位置（密码管理器 + 离线备份）
- 不要将 `.keystore` 和密码提交到仓库

---

## 七、装包验证

- [ ] APK 能正常安装
- [ ] 登录页能连上后端（确认 `VITE_API_URL` 在手机网络下可达）
- [ ] 工作台、任务列表等核心流程可用
- [ ] 若升级安装失败，检查是否换了签名证书

---

## 八、常见问题

| 现象 | 处理 |
|------|------|
| 提示找不到 Android SDK | HBuilderX 运行配置中手动指定 SDK 路径，并安装 API 30 |
| 接口连不上 | 重新执行 `pnpm build:apk`，确认 `.env.production` 地址正确 |
| 打包很慢 | 首次需下载 Gradle/依赖；之后通常比云打包排队快 |
| 与云打包行为不一致 | 本地打包前务必先跑 `pnpm build:apk`，不要只靠 HBuilderX 内置编译 |

---

## 九、推荐工作流

```
改代码 → pnpm build:apk → HBuilderX 本地打 Android 包 → 真机安装测试
```

仅当修改 manifest、权限、图标、原生配置时，才需要重新「生成本地打包 App 资源」。
