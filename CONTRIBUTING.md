# 贡献指南

感谢你对智慧健身 SaaS 项目的关注！本文档帮助你快速搭建本地开发环境。

## 前置环境

| 依赖 | 最低版本 | 推荐版本 | 安装方式 |
|------|---------|---------|---------|
| Node.js | >= 18 | 22.12+ | [nvm](https://github.com/nvm-sh/nvm) 或 [官网](https://nodejs.org/) |
| PostgreSQL | >= 14 | 16 | macOS: `brew install postgresql@16` |
| Git | >= 2.x | latest | 系统包管理器 |

## 快速开始

### 1. Clone 项目

```bash
git clone https://github.com/binge628/smart-fitness-saas.git
cd smart-fitness-saas
```

### 2. 安装依赖

```bash
# 前端
cd frontend && npm install && cd ..

# 后端
cd backend && npm install && cd ..
```

### 3. 配置环境变量

`.env` 文件未被纳入版本控制，需手动创建：

```bash
cd backend
cp .env.example .env
```

编辑 `backend/.env`，填写以下必要配置：

| 配置项 | 必填 | 说明 | 示例 |
|--------|------|------|------|
| `DATABASE_URL` | 是 | PostgreSQL 连接串 | `postgres://用户名@localhost:5432/smart_fitness` |
| `JWT_SECRET` | 是 | JWT 签名密钥，生产环境务必更换 | 任意长随机字符串 |
| `AI_API_KEY` | 否 | AI 健身助手功能需要 | OpenAI / DeepSeek 等 API Key |

其余配置项均有默认值，可按需调整。

### 4. 初始化数据库

**创建数据库：**

```bash
# 方式 A：命令行
createdb smart_fitness

# 方式 B：psql 内执行
psql postgres
CREATE DATABASE smart_fitness;
\q
```

**导入表结构和数据（按顺序执行）：**

```bash
cd backend

# 核心表结构
psql -d smart_fitness -f db/init.sql

# 动作库与训练组
psql -d smart_fitness -f db/add-exercises-and-sets.sql

# 成就勋章
psql -d smart_fitness -f db/achievements.sql

# 增量迁移：AI 对话表
psql -d smart_fitness -f db/migrations/007_ai_conversations.sql

# 可选：测试数据（含测试账号 admin / admin123）
psql -d smart_fitness -f db/test-data-v2.sql
```

也可以使用交互式脚本（会读取 `.env` 中的 `DB_NAME` 和 `DB_USER`）：

```bash
cd backend && ./scripts/init-db.sh
```

### 5. 启动开发服务

```bash
# 终端 1 — 后端 (http://localhost:3001)
cd backend && npm run dev

# 终端 2 — 前端 (http://localhost:5173)
cd frontend && npm run dev
```

启动后访问：

- 前端页面：http://localhost:5173
- 后端健康检查：http://localhost:3001/health
- API 文档：http://localhost:3001/api-docs

## 常见问题

### 数据库连接失败

确认 PostgreSQL 服务已启动：

```bash
# macOS
brew services start postgresql@16

# 检查连接
pg_isready -h localhost -p 5432
```

### `.env` 文件缺失

后端启动时如果报数据库连接错误，首先检查 `backend/.env` 是否存在且 `DATABASE_URL` 配置正确。

### Node.js 版本不兼容

Vite 8 要求 Node.js 20.19+ 或 22.12+，低版本虽然可能运行但会有警告。推荐使用 nvm 管理版本：

```bash
nvm install 22
nvm use 22
```

### 数据库迁移表缺失

`db/migrations/` 目录下的 SQL 是增量迁移，必须按顺序执行，否则对应功能模块会报错。

## 项目结构

```
smart-fitness-saas/
├── frontend/          # React + TypeScript + Vite + Ant Design
│   └── src/
│       ├── pages/     # 页面组件
│       ├── services/  # API 调用层
│       ├── types/     # TypeScript 类型定义
│       └── layouts/   # 布局组件
├── backend/           # Express + TypeScript + PostgreSQL
│   ├── src/
│   │   ├── routes/    # 路由定义
│   │   ├── controllers/
│   │   ├── services/
│   │   ├── schemas/   # Zod 校验
│   │   └── middleware/
│   ├── db/            # 数据库脚本和迁移
│   └── scripts/       # 工具脚本
└── docs/              # 项目文档
```

## 开发规范

- 提交信息使用中文或英文均可，确保描述清晰
- 代码提交前请确保 `npm run lint` 无报错（前端）
- 后端接口变动请同步更新 Swagger 注释