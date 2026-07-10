# Print Android signing cert SHA1/SHA256 for DCloud offline AppKey registration.
# Usage: pnpm cert:info

$ErrorActionPreference = "Stop"

$mobileRoot = Split-Path -Parent $PSScriptRoot
$configPath = Join-Path $mobileRoot "local-android.config.json"

if (-not (Test-Path $configPath)) {
    Write-Host "[ERROR] Missing local-android.config.json" -ForegroundColor Red
    exit 1
}

$config = Get-Content $configPath -Raw -Encoding UTF8 | ConvertFrom-Json
$androidSdkRoot = [string]$config.androidSdkRoot
$integrateProject = if ($config.integrateProject) { [string]$config.integrateProject } else { "HBuilder-Integrate-AS" }
$moduleName = if ($config.moduleName) { [string]$config.moduleName } else { "simpleDemo" }
$appId = [string]$config.appId

$moduleRoot = Join-Path (Join-Path $androidSdkRoot $integrateProject) $moduleName
$keystore = Join-Path $moduleRoot "test.jks"

Write-Host ""
Write-Host "DCloud offline AppKey registration info" -ForegroundColor Cyan
Write-Host "---------------------------------------"
Write-Host "AppID        : $appId"
Write-Host "Package name : com.pm.management"
Write-Host "Keystore     : $keystore"
Write-Host ""

if (-not (Get-Command keytool -ErrorAction SilentlyContinue)) {
    Write-Host "[ERROR] keytool not found. Install JDK 17+." -ForegroundColor Red
    exit 1
}

if (-not (Test-Path $keystore)) {
    Write-Host "[ERROR] Keystore not found: $keystore" -ForegroundColor Red
    exit 1
}

keytool -list -v -keystore $keystore -storepass 123456 -alias key0

Write-Host ""
Write-Host "Register at: https://dev.dcloud.net.cn/" -ForegroundColor Yellow
Write-Host "Path: Your App -> Platform Info -> Offline Packaging Key (Android)"
Write-Host "Use the SHA1 above with package name com.pm.management, then copy"
Write-Host "the generated key into AndroidManifest.xml as dcloud_appkey value."
Write-Host ""
