# 生成 Android 正式签名证书（仅首次发版前执行）
# 用法: pnpm keystore:gen

$ErrorActionPreference = "Stop"

$root = Split-Path -Parent $PSScriptRoot
$keystoreDir = Join-Path $root "keystore"
$keystoreFile = Join-Path $keystoreDir "pm-management.keystore"
$alias = "pm-management"

if (Test-Path $keystoreFile) {
  Write-Host ""
  Write-Host "已存在证书文件，跳过生成:" -ForegroundColor Yellow
  Write-Host "  $keystoreFile"
  Write-Host ""
  Write-Host "如需重新生成，请先手动备份并删除该文件。"
  exit 0
}

if (-not (Get-Command keytool -ErrorAction SilentlyContinue)) {
  Write-Host "未找到 keytool，请安装 JDK 并将 keytool 加入 PATH。" -ForegroundColor Red
  exit 1
}

New-Item -ItemType Directory -Force -Path $keystoreDir | Out-Null

Write-Host ""
Write-Host "即将生成正式签名证书（有效期约 100 年）"
Write-Host "  路径: $keystoreFile"
Write-Host "  别名: $alias"
Write-Host ""
Write-Host "请按提示设置密码并填写组织信息；密码请自行保存，勿提交到 Git。"
Write-Host ""

& keytool -genkeypair `
  -alias $alias `
  -keyalg RSA `
  -keysize 2048 `
  -validity 36500 `
  -keystore $keystoreFile

if ($LASTEXITCODE -ne 0) {
  Write-Host "证书生成失败。" -ForegroundColor Red
  exit $LASTEXITCODE
}

Write-Host ""
Write-Host "证书已生成。请在 HBuilderX 证书管理中配置:" -ForegroundColor Green
Write-Host "  证书文件: $keystoreFile"
Write-Host "  证书别名: $alias"
Write-Host ""
Write-Host "可参考 keystore.example.json 与 keystore.local.json（本地配置，不提交）。"
Write-Host "完整说明见 LOCAL_BUILD.md 第六节。"
Write-Host ""
