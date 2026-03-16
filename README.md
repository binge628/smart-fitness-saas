# 智慧健身 SaaS 系统 (Smart Fitness SaaS)

基于 SaaS 模式的智慧健身管理系统，支持个性化健身计划、数据采集分析、健身房管理等核心功能。

## 项目结构

```
smart-fitness-saas/
├── frontend/          # 前端项目（React + TypeScript + Vite）
├── backend/           # 后端项目（Node.js + Express + TypeScript）
├── docs/              # 项目文档
├── scripts/           # 工具脚本
└── docker/            # Docker 配置（待添加）
```

## 技术栈

### 前端
- 框架：React 18 + TypeScript
- 构建工具：Vite
- UI 组件库：Ant Design
- 路由：React Router v6
- 状态管理：Zustand
- HTTP 客户端：Axios
- 日期处理：Day.js

### 后端
- 框架：Express + TypeScript
- 数据库：PostgreSQL
- 认证：JWT
- 密码加密：Bcryptjs
- 跨域：CORS
- 环境变量：dotenv

## 快速开始

### 前置要求
- Node.js >= 18
- PostgreSQL >= 14

### 前端启动

```bash
cd frontend
npm install
npm run dev
```

访问：http://localhost:5173

### 后端启动

```bash
cd backend
npm install
cp .env.example .env  # 配置环境变量
npm run dev
```

访问：http://localhost:3001

## 核心功能模块

| 模块 | 状态 | 说明 |
|------|------|------|
| 用户管理 | ✅ 已完成 | 注册/登录/权限管理/JWT认证 |
| 健身计划 | ✅ 已完成 | 计划模板/个性化定制/执行追踪 |
| 数据采集 | 🚧 待开发 | 智能设备接入/运动数据可视化 |
| 健身房管理 | 🚧 待开发 | 会员管理/设备调度/经营分析 |
| 健康数据 | 🚧 待开发 | 体重/体脂率等健康指标管理 |
| 训练日志 | 🚧 待开发 | 记录每次训练数据 |

## 开发计划

### 已完成 ✅
- [x] 项目初始化
- [x] 数据库设计与迁移
- [x] 用户认证系统（注册、登录、JWT）
- [x] 健身计划模块（CRUD、筛选）

### 待开发 🚧
- [ ] 健身房管理模块
- [ ] 健康数据模块
- [ ] 训练日志模块
- [ ] 前端页面开发
- [ ] 测试与部署

## License

MIT