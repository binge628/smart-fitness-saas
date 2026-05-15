# 项目配置与启动指南

本文档详细说明如何配置和启动智慧健身 SaaS 系统。

---

## 一、前置要求

| 软件 | 版本要求 | 用途 |
|------|----------|------|
| Node.js | >= 18（推荐 v20） | 运行前后端代码 |
| npm | >= 9 | 包管理器 |
| PostgreSQL | >= 15 | 数据库（本地部署时需要） |
| Docker | >= 20 | 容器化部署（可选） |

---

## 二、下载依赖

### 2.1 前端依赖

```bash
cd frontend
npm install
```

**依赖说明：**

| 依赖 | 版本 | 用途 |
|------|------|------|
| react | 19.2.4 | UI 框架 |
| react-dom | 19.2.4 | React DOM 渲染 |
| react-router-dom | 7.13.1 | 路由管理 |
| antd | 6.3.2 | UI 组件库 |
| @ant-design/icons | 6.1.0 | 图标库 |
| axios | 1.13.6 | HTTP 客户端 |
| zustand | 5.0.12 | 状态管理 |
| dayjs | 1.11.20 | 日期处理 |
| typescript | ~5.9.3 | 类型系统 |
| vite | ^8.0.0 | 构建工具 |
| vitest | 2.0.0 | 测试框架 |

### 2.2 后端依赖

```bash
cd backend
npm install
```

**依赖说明：**

| 依赖 | 版本 | 用途 |
|------|------|------|
| express | 5.2.1 | Web 框架 |
| typescript | 5.9.3 | 类型系统 |
| ts-node-dev | 2.0.0 | TypeScript 开发运行 |
| pg | 8.20.0 | PostgreSQL 驱动 |
| dotenv | 17.3.1 | 环境变量加载 |
| cors | 2.8.6 | 跨域中间件 |
| jsonwebtoken | 9.0.3 | JWT 认证 |
| bcryptjs | 3.0.3 | 密码加密 |
| zod | 4.3.6 | 参数校验 |
| multer | 2.1.1 | 文件上传 |
| axios | 1.8.4 | HTTP 客户端（AI 调用） |
| swagger-ui-express | 5.0.1 | API 文档 |
| jest | 30.3.0 | 测试框架 |
| supertest | 7.2.2 | API 测试 |

---

## 三、数据库配置

### 方式 1：使用 Docker 启动 PostgreSQL（推荐）

```bash
# 在项目根目录执行
docker-compose up -d postgres

# 查看日志
docker-compose logs -f postgres

# 停止服务
docker-compose down
```

**连接参数：**
- Host: `localhost`
- Port: `5432`
- Database: `smart_fitness`
- User: `postgres`
- Password: `postgres`

**DATABASE_URL 格式：**
```
DATABASE_URL=postgres://postgres:postgres@localhost:5432/smart_fitness
```

### 方式 2：使用 Supabase 云数据库（推荐）

**步骤：**

1. 访问 https://supabase.com 注册账号
2. 创建新项目（选择 PostgreSQL）
3. 进入 Settings → Database → Connection string
4. 复制 Pooler 模式的连接字符串
5. 在 Supabase SQL Editor 中运行 `backend/db/init.sql` 初始化表结构

**连接字符串格式：**
```
DATABASE_URL=postgres://postgres.[project-id]:[password]@aws-0-[region].pooler.supabase.com:6543/postgres
```

详细说明：[docs/SUPABASE_SETUP.md](docs/SUPABASE_SETUP.md)

### 方式 3：本地 PostgreSQL

**macOS 安装：**
```bash
brew install postgresql@16
brew services start postgresql@16

# 创建数据库
createdb smart_fitness

# 初始化表结构
cd backend
psql -U postgres -f db/init.sql
```

**Linux 安装：**
```bash
sudo apt-get install postgresql-16
sudo systemctl start postgresql
sudo -u postgres createdb smart_fitness
```

**Windows 安装：**
下载 https://www.postgresql.org/download/windows/ 安装

---

## 四、环境变量配置

### 4.1 后端环境变量

后端需要配置 `backend/.env` 文件：

```bash
cd backend
cp .env.example .env
```

**关键配置项说明：**

```env
# ==================== 服务器配置 ====================
PORT=3001                    # 后端服务端口
NODE_ENV=development         # 环境：development | production

# ==================== 数据库配置 ====================
# 方式 1：PostgreSQL URI（推荐）
DATABASE_URL=postgres://user:password@host:port/database

# 方式 2：本地 PostgreSQL 分参数配置（备用）
# DB_HOST=localhost
# DB_PORT=5432
# DB_NAME=smart_fitness
# DB_USER=postgres
# DB_PASSWORD=your_password

# ==================== JWT 认证 ====================
JWT_SECRET=your_jwt_secret_key_here_change_in_production
JWT_EXPIRES_IN=7d            # Token 有效期

# ==================== CORS 跨域 ====================
CLIENT_URL=http://localhost:5173  # 前端地址

# ==================== AI 健身助手（可选） ====================
AI_PROVIDER=openai           # openai | anthropic | deepseek | ollama
AI_API_KEY=sk-xxx            # API 密钥
AI_MODEL=gpt-4o-mini         # 模型名称
AI_BASE_URL=                 # 自定义端点（Ollama: http://localhost:11434/v1）
AI_MAX_TOKENS=1000           # 最大输出 token
AI_TEMPERATURE=0.7           # 创造性参数（0-1）
AI_DAILY_LIMIT=20            # 每日对话次数限制
```

### 4.2 前端环境变量

前端无需额外配置，使用默认配置即可。

如需自定义 API 地址，可创建 `frontend/.env.local`：

```env
VITE_API_URL=http://localhost:3001
```

---

## 五、启动服务

### 5.1 开发模式（推荐）

**启动后端：**
```bash
cd backend
npm run dev
```

**启动前端：**
```bash
cd frontend
npm run dev
```

访问地址：
- 前端：http://localhost:5173
- 后端 API：http://localhost:3001
- API 文档：http://localhost:3001/api-docs

### 5.2 Docker 一键启动

```bash
# 启动所有服务
docker-compose up -d

# 查看日志
docker-compose logs -f

# 停止服务
docker-compose down
```

---

## 六、测试账号

项目初始化后，可使用以下测试账号：

| 角色 | 用户名/邮箱 | 密码 |
|------|-------------|------|
| 管理员 | admin@fitness.com | admin123 |
| 测试用户 | user@fitness.com | user123 |

---

## 七、常见问题

### Q1: 后端启动报错 "connect ECONNREFUSED"

**原因：** 数据库未启动或连接字符串错误

**解决：**
1. 检查 Docker 容器是否运行：`docker-compose ps`
2. 检查 `.env` 中的 `DATABASE_URL` 是否正确
3. 本地 PostgreSQL 需确认服务状态：`brew services list`

### Q2: 前端无法连接后端 API

**原因：** CORS 配置或 API 地址错误

**解决：**
1. 检查后端 `.env` 中 `CLIENT_URL` 是否为前端地址
2. 检查前端 `src/services/api.ts` 中的 `API_BASE_URL`

### Q3: JWT Token 验证失败

**原因：** `JWT_SECRET` 配置不一致

**解决：**
确保后端 `.env` 中 `JWT_SECRET` 与初始化时一致

### Q4: 文件上传失败

**原因：** `uploads` 目录权限问题

**解决：**
```bash
cd backend
mkdir -p uploads
chmod 755 uploads
```

---

## 八、生产环境部署

### 环境变量调整

生产环境需修改以下配置：

```env
NODE_ENV=production
JWT_SECRET=<强随机字符串，至少 32 位>
DATABASE_URL=<生产数据库连接>
CLIENT_URL=https://your-domain.com
```

### Docker 部署

```bash
# 构建镜像
docker-compose build

# 启动服务
docker-compose up -d

# 查看日志
docker-compose logs -f
```

### Nginx 反向代理

参考配置：

```nginx
server {
    listen 80;
    server_name your-domain.com;

    location / {
        proxy_pass http://localhost:80;  # 前端
    }

    location /api {
        proxy_pass http://localhost:3001;  # 后端 API
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
    }
}
```

---

## 九、相关文档

- [数据库设计文档](docs/database-design.md)
- [API 接口文档](docs/api.md)
- [数据库设置指南](docs/DATABASE_SETUP.md)
- [Supabase 配置指南](docs/SUPABASE_SETUP.md)
- [贡献指南](CONTRIBUTING.md)