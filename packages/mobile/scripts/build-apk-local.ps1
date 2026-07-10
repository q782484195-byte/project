# Local Android APK: uni build -> sync assets -> gradle assemble
# Usage:
#   pnpm build:apk:local
#   pnpm build:apk:local -- -Release
#   pnpm build:apk:local -- -SkipBuild

param(
    [switch]$Release,
    [switch]$SkipBuild
)

$ErrorActionPreference = "Stop"
[Console]::OutputEncoding = [System.Text.Encoding]::UTF8

$mobileRoot = Split-Path -Parent $PSScriptRoot
$configPath = Join-Path $mobileRoot "local-android.config.json"
$examplePath = Join-Path $mobileRoot "local-android.config.example.json"

function Write-Step([string]$Message) {
    Write-Host ""
    Write-Host "==> $Message" -ForegroundColor Cyan
}

function Fail([string]$Message) {
    Write-Host ""
    Write-Host "[ERROR] $Message" -ForegroundColor Red
    exit 1
}

if (-not (Test-Path $configPath)) {
    if (Test-Path $examplePath) {
        Copy-Item $examplePath $configPath
        Fail "Created local-android.config.json from example. Please verify androidSdkRoot, then run again."
    }
    Fail "Missing local-android.config.json"
}

$config = Get-Content $configPath -Raw -Encoding UTF8 | ConvertFrom-Json
$appId = [string]$config.appId
$androidSdkRoot = [string]$config.androidSdkRoot
$integrateProject = if ($config.integrateProject) { [string]$config.integrateProject } else { "HBuilder-Integrate-AS" }
$moduleName = if ($config.moduleName) { [string]$config.moduleName } else { "simpleDemo" }
$variant = if ($Release) { "release" } elseif ($config.variant) { [string]$config.variant } else { "debug" }

$integrateRoot = Join-Path $androidSdkRoot $integrateProject
$gradlew = Join-Path $integrateRoot "gradlew.bat"
$assetsAppsDir = Join-Path $integrateRoot "$moduleName/src/main/assets/apps"
$targetAppDir = Join-Path $assetsAppsDir $appId
$targetWwwDir = Join-Path $targetAppDir "www"

$hbResourceDir = Join-Path $mobileRoot "src/unpackage/resources/$appId"
$cliAppDir = Join-Path $mobileRoot "dist/build/app"

Write-Host ""
Write-Host "========================================" -ForegroundColor Green
Write-Host "  Local Android APK Build" -ForegroundColor Green
Write-Host "========================================" -ForegroundColor Green
Write-Host "AppID   : $appId"
Write-Host "Variant : $variant"
Write-Host "SDK     : $integrateRoot"

if (-not (Test-Path $integrateRoot)) {
    Fail "Offline SDK project not found: $integrateRoot. Update androidSdkRoot in local-android.config.json"
}

if (-not (Test-Path $gradlew)) {
    Fail "gradlew.bat not found: $gradlew"
}

if (-not $SkipBuild) {
    Write-Step "1/3 Build uni-app resources (uni build -p app)"
    Push-Location $mobileRoot
    try {
        pnpm exec uni build -p app
        if ($LASTEXITCODE -ne 0) { Fail "uni build failed with exit code $LASTEXITCODE" }
    } finally {
        Pop-Location
    }
} else {
    Write-Step "1/3 Skip frontend build (-SkipBuild)"
}

Write-Step "2/3 Sync resources into Android project"

if (-not (Test-Path $assetsAppsDir)) {
    New-Item -ItemType Directory -Force -Path $assetsAppsDir | Out-Null
}

if (Test-Path $hbResourceDir) {
    Write-Host "  Source (HBuilderX): $hbResourceDir"
    if (Test-Path $targetAppDir) {
        Remove-Item $targetAppDir -Recurse -Force
    }
    Copy-Item $hbResourceDir $targetAppDir -Recurse
} elseif (Test-Path $cliAppDir) {
    Write-Host "  Source (CLI): $cliAppDir"
    if (Test-Path $targetAppDir) {
        Remove-Item $targetAppDir -Recurse -Force
    }
    New-Item -ItemType Directory -Force -Path $targetWwwDir | Out-Null
    Copy-Item (Join-Path $cliAppDir "*") $targetWwwDir -Recurse
} else {
    $msg = "No frontend resources found.`nExpected one of:`n  - $hbResourceDir`n  - $cliAppDir"
    Fail $msg
}

Write-Host "  Synced to: $targetAppDir"

$gradleTask = if ($variant -eq "release") { "assembleRelease" } else { "assembleDebug" }

Write-Step "3/3 Gradle package ($gradleTask)"

Push-Location $integrateRoot
try {
    & $gradlew $gradleTask
    if ($LASTEXITCODE -ne 0) { Fail "Gradle build failed with exit code $LASTEXITCODE" }
} finally {
    Pop-Location
}

$apkName = if ($variant -eq "release") { "$moduleName-release.apk" } else { "$moduleName-debug.apk" }
$apkPath = Join-Path $integrateRoot "$moduleName/build/outputs/apk/$variant/$apkName"

Write-Host ""
Write-Host "========================================" -ForegroundColor Green
Write-Host "  BUILD SUCCESSFUL" -ForegroundColor Green
Write-Host "========================================" -ForegroundColor Green
Write-Host ""
Write-Host "  APK: $apkPath" -ForegroundColor Yellow
Write-Host ""

if (Test-Path $apkPath) {
    explorer.exe "/select,$apkPath"
}
