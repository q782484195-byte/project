# Local Android APK: uni build -> sync assets -> gradle assemble
# Usage:
#   pnpm build:apk:local
#   pnpm build:apk:local -- -Release
#   pnpm build:apk:local -- -SkipBuild
#   pnpm build:apk:local -- -Clean

param(
    [switch]$Release,
    [switch]$SkipBuild,
    [switch]$Clean
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

function Get-PathLastWriteTime([string]$Path) {
    if (-not (Test-Path $Path)) { return $null }
    return (Get-Item $Path).LastWriteTime
}

function Resolve-ResourceSource {
    param(
        [string]$CliAppDir,
        [string]$HbResourceDir,
        [bool]$PreferCli
    )

    $cliExists = Test-Path $CliAppDir
    $hbExists = Test-Path $HbResourceDir

    if ($PreferCli) {
        if ($cliExists) {
            return @{
                Type = "cli"
                Path = $CliAppDir
                Label = "CLI (dist/build/app)"
            }
        }
        Fail "uni build did not produce: $CliAppDir"
    }

    if ($cliExists -and $hbExists) {
        $cliTime = Get-PathLastWriteTime $CliAppDir
        $hbTime = Get-PathLastWriteTime $HbResourceDir
        if ($cliTime -ge $hbTime) {
            Write-Host "  Note: Using newer CLI build instead of stale HBuilderX cache." -ForegroundColor Yellow
            return @{
                Type = "cli"
                Path = $CliAppDir
                Label = "CLI (dist/build/app)"
            }
        }
        Write-Host "  Warning: HBuilderX cache is newer than CLI output; using HBuilderX resources." -ForegroundColor Yellow
        Write-Host "  Run without -SkipBuild to refresh CLI output." -ForegroundColor Yellow
        return @{
            Type = "hb"
            Path = $HbResourceDir
            Label = "HBuilderX (src/unpackage/resources)"
        }
    }

    if ($cliExists) {
        return @{
            Type = "cli"
            Path = $CliAppDir
            Label = "CLI (dist/build/app)"
        }
    }

    if ($hbExists) {
        Write-Host "  Warning: Only HBuilderX cache found. Run without -SkipBuild for latest code." -ForegroundColor Yellow
        return @{
            Type = "hb"
            Path = $HbResourceDir
            Label = "HBuilderX (src/unpackage/resources)"
        }
    }

    $msg = @"
No frontend resources found.
Expected one of:
  - $CliAppDir
  - $HbResourceDir
Run: pnpm build:apk:local
"@
    Fail $msg
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

if ($Clean) {
    Write-Step "0/3 Clean previous outputs (-Clean)"
    if (Test-Path (Join-Path $mobileRoot "dist")) {
        Remove-Item (Join-Path $mobileRoot "dist") -Recurse -Force
        Write-Host "  Removed dist/"
    }
    if (Test-Path $hbResourceDir) {
        Remove-Item $hbResourceDir -Recurse -Force
        Write-Host "  Removed stale HBuilderX resources: $hbResourceDir"
    }
    if (Test-Path $targetAppDir) {
        Remove-Item $targetAppDir -Recurse -Force
        Write-Host "  Removed synced Android assets: $targetAppDir"
    }
}

if (-not $SkipBuild) {
    Write-Step "1/3 Build uni-app resources (uni build -p app)"
    Push-Location $mobileRoot
    try {
        pnpm exec uni build -p app
        if ($LASTEXITCODE -ne 0) { Fail "uni build failed with exit code $LASTEXITCODE" }
        if (-not (Test-Path $cliAppDir)) {
            Fail "uni build finished but output not found: $cliAppDir"
        }
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

$source = Resolve-ResourceSource -CliAppDir $cliAppDir -HbResourceDir $hbResourceDir -PreferCli:(-not $SkipBuild)
Write-Host "  Source: $($source.Label)"
Write-Host "  Path  : $($source.Path)"

if (Test-Path $targetAppDir) {
    Remove-Item $targetAppDir -Recurse -Force
}

if ($source.Type -eq "hb") {
    Copy-Item $source.Path $targetAppDir -Recurse
} else {
    New-Item -ItemType Directory -Force -Path $targetWwwDir | Out-Null
    Copy-Item (Join-Path $source.Path "*") $targetWwwDir -Recurse -Force
}

Write-Host "  Synced to: $targetAppDir"

$gradleTask = if ($variant -eq "release") { "assembleRelease" } else { "assembleDebug" }
if ($Clean) {
    $gradleTask = "clean $gradleTask"
}

Write-Step "3/3 Gradle package ($gradleTask)"

Push-Location $integrateRoot
try {
    & $gradlew @($gradleTask.Split(" "))
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
Write-Host "  Resource: $($source.Label)" -ForegroundColor Yellow
Write-Host "  APK     : $apkPath" -ForegroundColor Yellow
Write-Host ""

if (Test-Path $apkPath) {
    explorer.exe "/select,$apkPath"
}
