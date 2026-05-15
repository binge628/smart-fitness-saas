# 智慧健身 SaaS 系统 (Smart Fitness SaaS)

基于 SaaS 模式的智慧健身管理系统，支持个性化健身计划、数据采集分析、健身房管理等核心功能。

## 快速开始

### 第一步：下载依赖

**前端依赖**
```bash
cd frontend
npm install
```

**后端依赖**
```bash
cd backend
npm install
```

### 第二步：配置数据库

有两种方式配置数据库：

**方式 1：使用 Docker 启动 PostgreSQL（推荐）**
```bash
# 在项目根目录执行
docker-compose up -d postgres
```

**方式 2：使用 Supabase 云数据库（推荐）**
1. 访问 https://supabase.com 注册账号
2. 创建新项目，获取数据库连接字符串
3. 修改 `backend/.env` 中的 `DATABASE_URL`

**方式 3：本地安装 PostgreSQL**
```bash
# macOS
brew install postgresql@16
brew services start postgresql@16

# 初始化数据库
cd backend
./scripts/init-db.sh
```

### 第三步：配置环境变量

**后端配置**
```bash
cd backend
cp .env.example .env
# 编辑 .env 文件，配置数据库连接、JWT 密钥等
```

关键配置项：
- `DATABASE_URL` - 数据库连接字符串
- `JWT_SECRET` - JWT 密钥（生产环境请修改）
- `CLIENT_URL` - 前端地址（CORS）
- `AI_API_KEY` - AI 供应商 API 密钥（可选）

**前端配置**
```bash
cd frontend
# 前端无需额外配置，直接使用默认配置即可
```

### 第四步：启动服务

**启动后端**
```bash
cd backend
npm run dev
```
访问：http://localhost:3001

**启动前端**
```bash
cd frontend
npm run dev
```
访问：http://localhost:5173

### 使用 Docker 一键启动（可选）

```bash
# 启动所有服务
docker-compose up -d

# 查看日志
docker-compose logs -f

# 停止服务
docker-compose down
```

### Windows 用户

Windows 用户请参考详细指南：**[docs/WINDOWS_SETUP.md](docs/WINDOWS_SETUP.md)**

主要内容：
- 方式一：Docker Desktop 一键启动（推荐）
- 方式二：本地环境部署（Node.js + PostgreSQL）
- 常见问题解决（WSL2、端口占用、权限问题等）
- 推荐开发工具

## 项目结构

## 技术栈

### 前端
- 框架：React 19 + TypeScript
- 构建工具：Vite 8
- UI 组件库：Ant Design 6
- 路由：React Router v7
- 状态管理：Zustand
- HTTP 客户端：Axios
- 日期处理：Day.js
- 测试：Vitest + React Testing Library

### 后端
- 框架：Express 5 + TypeScript
- 数据库：PostgreSQL 15
- 认证：JWT
- 密码加密：Bcryptjs
- 跨域：CORS
- 环境变量：dotenv
- 文档：Swagger/OpenAPI
- 测试：Jest + Supertest

## 前置要求

- Node.js >= 18（推荐 v20）
- PostgreSQL >= 15（本地开发或使用本地数据库时需要）
- npm >= 9

### 开发环境启动

**推荐开发模式**：前后端分离开发，热重载

```bash
# 终端 1：启动后端
cd backend
npm install  # 首次需要安装依赖
npm run dev

# 终端 2：启动前端
cd frontend
npm install  # 首次需要安装依赖
npm run dev
```

## 核心功能模块

| 模块 | 后端 | 前端 | 说明 |
|------|------|------|------|
| 用户管理 | ✅ 已完成 | ✅ 已完成 | 注册/登录/权限管理/JWT认证 |
| 健身计划 | ✅ 已完成 | ✅ 已完成 | 计划模板/个性化定制/筛选/CURD |
| 健身房管理 | ✅ 已完成 | ✅ 已完成 | 健身房CRUD + 会员管理 + 我的会员 |
| 健康数据 | ✅ 已完成 | ✅ 已完成 | 体重/体脂率等健康指标 + BMI计算 + 统计 + 趋势 |
| 训练日志 | ✅ 已完成 | ✅ 已完成 | 训练记录 + 训练统计 + 强度计算 |
| AI 健身助手 | ✅ 已完成 | ✅ 已完成 | 基于 LLM 的健身咨询（支持 OpenAI/Claude/DeepSeek/Ollama） |

## 数据库配置详解

### 环境变量说明

后端支持两种数据库配置方式，在 `backend/.env` 中配置：

**方式 1：PostgreSQL URI（推荐，适用于 Supabase 或 Docker）**
```env
DATABASE_URL=postgres://user:password@host:port/database
```

**方式 2：本地 PostgreSQL 分参数配置**
```env
DB_HOST=localhost
DB_PORT=5432
DB_NAME=smart_fitness
DB_USER=postgres
DB_PASSWORD=your_password
```

### 数据库初始化

使用 Docker 启动后，数据库会自动初始化。本地 PostgreSQL 需要手动执行初始化脚本：

```bash
cd backend
psql -U postgres -f db/init.sql
```

### AI 健身助手配置（可选）

在 `backend/.env` 中配置：

```env
# LLM 供应商：openai | anthropic | deepseek | ollama
AI_PROVIDER=openai
AI_API_KEY=sk-xxx  # API 密钥
AI_MODEL=gpt-4o-mini  # 模型名称
AI_BASE_URL=  # 自定义端点（Ollama: http://localhost:11434/v1）
AI_MAX_TOKENS=1000
AI_TEMPERATURE=0.7
AI_DAILY_LIMIT=20  # 每日对话次数限制
```

## 常用脚本命令

### 后端
```bash
cd backend
npm run dev      # 开发模式（热重载）
npm run build    # 编译 TypeScript
npm run start    # 启动生产环境
npm run test     # 运行测试
```

### 前端
```bash
cd frontend
npm run dev       # 开发模式（热重载）
npm run build     # 编译生产版本
npm run preview   # 预览生产构建
npm run lint      # ESLint 检查
npm run test      # 运行测试
```

## 开发进度

### 已完成 ✅
- [x] 项目初始化与架构搭建
- [x] 数据库设计与迁移（7张表）
  - [x] 支持本地 PostgreSQL
  - [x] 支持 Supabase 云数据库
- [x] 后端 API 开发（34个接口）
  - [x] 用户认证系统（注册、登录、JWT）
  - [x] 健身计划模块（CRUD、筛选）
  - [x] 健身房管理模块（多租户 + 会员管理）
  - [x] 健康数据模块（健康指标 + 统计）
  - [x] 训练日志模块（训练记录 + 统计）
- [x] 前端页面开发
  - [x] 登录/注册页面（含用户导航）
  - [x] 首页仪表盘
  - [x] 健身计划管理页面（CRUD、筛选、详情）
  - [x] 健身房管理页面（CRUD、会员列表、我的会员）
  - [x] 健康数据页面（记录、BMI计算、统计）
  - [x] 训练日志页面（记录、强度计算、统计）
  - [x] 首页仪表盘数据对接（训练、计划、健身房、健康数据统计）
- [x] 个人资料页面（信息编辑、头像上传、修改密码）
- [x] 测试数据脚本
  - [x] 测试用户数据
  - [x] 管理员密码修复脚本

### 待开发 🚧

#### 高优先级
（暂无）

#### 中优先级
- [ ] 数据可视化
  - [ ] 健康数据趋势图表（体重、体脂率等）
  - [ ] 训练统计图表（周/月训练次数）
  - [ ] 计划执行进度图表
- [ ] 权限控制实现
  - [ ] 管理员功能
  - [ ] 教练功能
  - [ ] 健身房管理员权限
- [ ] API 文档完善
  - [ ] Swagger/OpenAPI 接入
  - [ ]接口使用文档

#### 低优先级
- [ ] 性能优化
- [ ] 单元测试与集成测试
- [ ] 部署配置（Docker、CI/CD）
- [ ] [可选] 支付集成（微信支付/支付宝）

## 无用文件说明

以下文件或目录目前为空或仅用于临时用途，可以安全删除：

| 文件/目录 | 说明 | 是否可删除 |
|-----------|------|------------|
| `paper/` | 空目录，原本用于存放论文相关资料 | ✅ 可删除 |
| `scripts/` | 空目录，原本用于存放工具脚本 | ✅ 可删除（如需要可重新创建） |
| `zBakeryData/` | 空目录，包含空的 `.db` 和 `.env` 子目录 | ✅ 可删除 |
| `OPTIMIZATION_PLAN.md` | 优化计划文档，已完成所有优化项目 | ⚠️ 建议保留作为历史记录 |

删除命令：
```bash
# 在项目根目录执行
rm -rf paper/ scripts/ zBakeryData/
```

## License

MIT