# 朱雀 项目架构总览

## 🎯 项目简介

朱雀（朱雀）是一个仿青龙面板的轻量级定时任务管理平台，采用前后端分离架构。

## 🏗️ 技术架构

### 后端技术栈
- **Rust** - 高性能系统编程语言
- **Axum** - 现代化 Web 框架
- **SQLite** - 轻量级数据库
- **Tokio** - 异步运行时
- **Tokio-cron-scheduler** - 定时任务调度

### 前端技术栈
- **React 18** - UI 框架
- **TypeScript** - 类型安全
- **Vite 5** - 极速构建工具
- **Arco Design** - 字节跳动企业级 UI 组件库
- **React Router 6** - 路由管理
- **Zustand** - 轻量级状态管理
- **Axios** - HTTP 客户端
- **Monaco Editor** - 代码编辑器（VS Code 同款）
- **ECharts** - 数据可视化

## 📁 项目结构

\`\`\`
zhuque/
├── src/                    # Rust 后端源码
│   ├── api/               # API 路由处理
│   ├── middleware/        # 中间件（认证等）
│   ├── models/            # 数据模型
│   ├── scheduler/         # 任务调度器
│   ├── services/          # 业务逻辑
│   └── main.rs           # 入口文件
├── web/                   # React 前端
│   ├── src/
│   │   ├── api/          # API 接口封装
│   │   ├── components/   # 公共组件
│   │   ├── layouts/      # 布局组件
│   │   ├── pages/        # 页面组件
│   │   ├── router/       # 路由配置
│   │   ├── stores/       # 状态管理
│   │   ├── types/        # TypeScript 类型
│   │   └── utils/        # 工具函数
│   └── package.json
├── data/                  # 数据目录（运行时生成）
│   ├── app.db            # SQLite 数据库
│   └── scripts/          # 脚本文件
└── Cargo.toml            # Rust 项目配置
\`\`\`

## ✨ 核心功能

### 1. 定时任务管理
- ✅ 创建、编辑、删除任务
- ✅ Cron 表达式支持
- ✅ 任务启用/禁用
- ✅ 立即执行任务
- ✅ 任务分组管理
- ✅ 开机自动执行任务

### 2. 脚本管理
- ✅ 文件树展示
- ✅ 在线代码编辑（Monaco Editor）
- ✅ 语法高亮（Python/Node.js/Shell）
- ✅ 脚本上传/下载
- ✅ 在线调试执行
- ✅ 目录管理

### 3. 依赖管理
- ✅ Python3 依赖（pip）
- ✅ Node.js 依赖（npm）
- ✅ Linux 系统依赖（apt）
- ✅ 批量安装
- ✅ 重新安装
- ✅ 安装状态实时显示

### 4. 环境变量管理
- ✅ 键值对管理
- ✅ 环境变量分组
- ✅ 任务级环境变量

### 5. 执行日志
- ✅ 任务执行日志查看
- ✅ 实时日志流
- ✅ 日志搜索和过滤
- ✅ 日志清理

### 6. 系统配置
- ✅ 镜像源配置（pip/npm）
- ✅ 数据备份与恢复
- ✅ JWT 认证系统

## 🚀 快速开始

### 启动后端

\`\`\`bash
# 开发模式
cargo run

# 生产模式
cargo build --release
./target/release/zhuque
\`\`\`

后端默认运行在 http://localhost:3000

### 启动前端

\`\`\`bash
cd web
npm install
npm run dev
\`\`\`

前端默认运行在 http://localhost:5173

### 构建前端

\`\`\`bash
cd web
npm run build
\`\`\`

构建产物在 \`web/dist\` 目录。

## 🎨 UI 特性

### 响应式设计
- ✅ 完美支持桌面端（1920px+）
- ✅ 平板适配（768px - 1024px）
- ✅ 移动端优化（< 768px）
- ✅ 侧边栏自动折叠

### 现代化界面
- ✅ Arco Design 企业级组件
- ✅ 渐变色登录页
- ✅ 卡片式布局
- ✅ 流畅动画效果
- ✅ 暗色主题支持（待完善）

### 交互体验
- ✅ 表格分页、搜索、排序
- ✅ 模态框表单验证
- ✅ 操作确认提示
- ✅ 加载状态反馈
- ✅ 错误提示友好

## 🔐 安全特性

- JWT Token 认证
- 请求拦截器自动注入 Token
- 401 自动跳转登录
- CORS 跨域支持
- 密码加密存储（待实现）

## 📡 API 接口

### 认证
- POST /api/auth/login - 用户登录

### 任务管理
- GET /api/tasks - 获取任务列表
- POST /api/tasks - 创建任务
- GET /api/tasks/:id - 获取任务详情
- PUT /api/tasks/:id - 更新任务
- DELETE /api/tasks/:id - 删除任务
- POST /api/tasks/:id/run - 立即执行任务
- DELETE /api/tasks/:id/kill - 终止任务

### 脚本管理
- GET /api/scripts - 获取脚本列表
- GET /api/scripts/*path - 获取脚本内容
- PUT /api/scripts/*path - 更新脚本
- DELETE /api/scripts/*path - 删除脚本
- POST /api/scripts - 上传脚本
- GET /api/scripts/execute/*path - 执行脚本

### 环境变量
- GET /api/env - 获取环境变量列表
- POST /api/env - 创建环境变量
- PUT /api/env/:id - 更新环境变量
- DELETE /api/env/:id - 删除环境变量

### 依赖管理
- GET /api/dependences - 获取依赖列表
- POST /api/dependences - 创建依赖
- POST /api/dependences/batch - 批量创建
- POST /api/dependences/:id/reinstall - 重新安装

### 日志管理
- GET /api/logs - 获取日志列表
- DELETE /api/logs/cleanup/:days - 清理旧日志

### 系统配置
- GET /api/configs - 获取配置列表
- POST /api/configs/:key - 更新配置
- GET /api/configs/mirror/config - 获取镜像配置
- POST /api/configs/mirror/config - 更新镜像配置

## 🌐 部署方案

### 方案一：前后端分离部署

**后端：**
\`\`\`bash
cargo build --release
./target/release/zhuque
\`\`\`

**前端：**
\`\`\`bash
cd web && npm run build
# 将 dist 目录部署到 Nginx/Apache
\`\`\`

### 方案二：Nginx 反向代理

\`\`\`nginx
server {
    listen 80;
    server_name your-domain.com;

    # 前端静态文件
    root /path/to/web/dist;
    index index.html;

    location / {
        try_files $uri $uri/ /index.html;
    }

    # 后端 API 代理
    location /api {
        proxy_pass http://localhost:3000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
    }
}
\`\`\`

## 📝 待完善功能

- [ ] 完善其他页面（脚本管理、环境变量等）
- [ ] 添加暗色主题切换
- [ ] 实时日志流（WebSocket/SSE）
- [ ] Cron 表达式可视化编辑器
- [ ] 任务执行统计图表
- [ ] 用户权限管理
- [ ] 多用户支持
- [ ] 国际化（i18n）

## 📄 License

MIT

---

**当前状态：**
- ✅ 后端服务运行正常（http://localhost:3000）
- ✅ 前端服务运行正常（http://localhost:5173）
- ✅ 已实现登录页、仪表盘、任务管理页面
- ✅ API 接口完整封装
- ✅ 响应式布局完成
\`\`\`
