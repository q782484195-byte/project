# Windows PowerShell 清理缓存脚本
# 使用方法: .\clean-cache.ps1

Write-Host "正在清理构建缓存..." -ForegroundColor Yellow

# 清理 dist 目录
if (Test-Path "dist") {
    Remove-Item -Recurse -Force "dist"
    Write-Host "✓ 已清理 dist 目录" -ForegroundColor Green
} else {
    Write-Host "⚠ dist 目录不存在" -ForegroundColor Gray
}

# 清理 Vite 缓存
if (Test-Path "node_modules\.vite") {
    Remove-Item -Recurse -Force "node_modules\.vite"
    Write-Host "✓ 已清理 Vite 缓存" -ForegroundColor Green
} else {
    Write-Host "⚠ Vite 缓存不存在" -ForegroundColor Gray
}

Write-Host "`n缓存清理完成！" -ForegroundColor Green
Write-Host "现在可以运行: npm run build" -ForegroundColor Cyan

