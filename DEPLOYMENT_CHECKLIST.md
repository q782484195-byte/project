# 部署检查清单

## 1. 文件结构检查

确保服务器上的文件结构如下：

```
/var/www/dist/  (或 /var/www/project/dist/)
├── index.html
├── favicon.ico
├── logo.svg
├── platform-config.json
└── static/
    ├── js/
    │   ├── index-*.js
    │   ├── vue-vendor-*.js
    │   ├── element-plus-*.js
    │   └── ...
    ├── css/
    │   ├── element-plus-*.css
    │   ├── index-*.css
    │   └── ...
    └── png/
        └── ...
```

## 2. 文件权限检查

```bash
# 确保 Nginx 用户有读取权限
sudo chown -R www-data:www-data /var/www/dist
sudo chmod -R 755 /var/www/dist
```

## 3. Nginx 配置检查

### 关键配置项：

1. **root 路径**：确保指向正确的 dist 目录
2. **try_files**：必须有 `try_files $uri $uri/ /index.html;`
3. **静态资源**：确保静态资源 location 在 SPA location 之前
4. **platform-config.json**：确保可以访问且不缓存

### 测试配置：

```bash
# 检查 Nginx 配置语法
sudo nginx -t

# 重新加载配置
sudo nginx -s reload
# 或
sudo systemctl reload nginx
```

## 4. 浏览器调试步骤

1. **打开开发者工具**（F12）
2. **查看 Console 标签页**：
   - 检查是否有 JavaScript 错误
   - 检查是否有模块加载错误
   - 检查是否有 CORS 错误

3. **查看 Network 标签页**：
   - 检查 `index.html` 是否成功加载（状态码 200）
   - 检查 `platform-config.json` 是否成功加载
   - 检查所有 `.js` 文件是否成功加载
   - 检查所有 `.css` 文件是否成功加载
   - 查看失败的请求（红色）并记录错误信息

4. **常见错误**：
   - `404 Not Found`：文件路径不正确
   - `403 Forbidden`：文件权限问题
   - `CORS error`：跨域问题
   - `Failed to load module`：MIME 类型问题

## 5. 常见问题排查

### 问题 1：页面空白，只有加载动画

**可能原因**：
- JavaScript 文件加载失败
- `platform-config.json` 加载失败
- 路由初始化失败

**解决方法**：
- 检查浏览器控制台错误
- 检查 Network 标签页中的失败请求
- 确保所有静态资源路径正确

### 问题 2：刷新页面后 404

**可能原因**：
- Nginx 配置缺少 `try_files $uri $uri/ /index.html;`
- 路由模式配置问题

**解决方法**：
- 确保 Nginx 配置中有 `try_files`
- 检查路由历史模式配置（已修复为默认 hash 模式）

### 问题 3：静态资源 404

**可能原因**：
- 文件路径不正确
- 文件权限问题
- Nginx 配置问题

**解决方法**：
- 检查文件是否存在
- 检查文件权限
- 检查 Nginx 静态资源 location 配置

### 问题 4：API 请求失败

**可能原因**：
- API 代理配置不正确
- 后端服务未启动
- CORS 配置问题

**解决方法**：
- 检查 API 代理配置
- 检查后端服务状态
- 检查 CORS 头设置

## 6. 快速测试命令

```bash
# 检查文件是否存在
ls -la /var/www/dist/index.html
ls -la /var/www/dist/static/js/

# 检查文件权限
stat /var/www/dist/index.html

# 测试 Nginx 配置
sudo nginx -t

# 查看 Nginx 错误日志
sudo tail -f /var/log/nginx/error.log

# 查看 Nginx 访问日志
sudo tail -f /var/log/nginx/access.log

# 测试静态资源访问
curl -I http://192.168.69.182:8080/static/js/index-*.js
curl -I http://192.168.69.182:8080/platform-config.json
```

## 7. 如果仍然无法运行

请提供以下信息：

1. **浏览器控制台错误信息**（截图或复制文本）
2. **Network 标签页中的失败请求**（状态码和错误信息）
3. **Nginx 错误日志**（`/var/log/nginx/error.log`）
4. **文件结构**（`ls -la /var/www/dist/` 的输出）
5. **Nginx 配置测试结果**（`nginx -t` 的输出）

