# Xuanwu Web Frontend

基于 React + TypeScript + Arco Design 的现代化管理后台前端。

## 技术栈

- **React 18** - UI 框架
- **TypeScript** - 类型安全
- **Vite 5** - 构建工具
- **Arco Design** - UI 组件库（字节跳动出品）
- **React Router 6** - 路由管理
- **Zustand** - 状态管理
- **Axios** - HTTP 客户端
- **Monaco Editor** - 代码编辑器
- **ECharts** - 数据可视化

## 功能特性

- ✅ 响应式设计，支持移动端
- ✅ 现代化 UI，美观流畅
- ✅ TypeScript 类型安全
- ✅ 路由懒加载
- ✅ API 请求封装
- ✅ 状态管理
- ✅ 暗色主题支持

## 快速开始

### 安装依赖

```bash
npm install
```

### 开发模式

```bash
npm run dev
```

访问 http://localhost:5173

### 构建生产版本

```bash
npm run build
```

构建产物在 `dist` 目录。

### 预览生产版本

```bash
npm run preview
```

## 项目结构

```
src/
├── api/              # API 接口
├── assets/           # 静态资源
├── components/       # 公共组件
├── layouts/          # 布局组件
├── pages/            # 页面组件
├── router/           # 路由配置
├── stores/           # 状态管理
├── types/            # TypeScript 类型
├── utils/            # 工具函数
├── App.tsx           # 根组件
└── main.tsx          # 入口文件
```

## 页面功能

- **仪表盘** - 任务统计、最近日志
- **定时任务** - 任务的增删改查、立即执行
- **脚本管理** - 脚本编辑、上传、执行
- **环境变量** - 环境变量管理
- **依赖管理** - Python/Node.js/Linux 依赖管理
- **执行日志** - 任务执行日志查看
- **系统配置** - 镜像源、备份恢复

## 后端对接

前端通过 Vite 代理转发 API 请求到后端：

```typescript
// vite.config.ts
proxy: {
  '/api': {
    target: 'http://localhost:3000',
    changeOrigin: true,
  },
}
```

## 部署

构建后将 `dist` 目录部署到任何静态文件服务器即可。

### Nginx 配置示例

```nginx
server {
    listen 80;
    server_name your-domain.com;
    root /path/to/dist;
    index index.html;

    location / {
        try_files $uri $uri/ /index.html;
    }

    location /api {
        proxy_pass http://localhost:3000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
    }
}
```

## License

MIT

