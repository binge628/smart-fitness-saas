# Windows 系统启动指南

本文档详细说明如何在 Windows 系统上配置和启动智慧健身 SaaS 系统。

---

## 方式一：使用 Docker Desktop（推荐 ⭐）

> **优点**：最简单，无需安装 Node.js、PostgreSQL 等环境，一键启动所有服务

### 第一步：安装 Docker Desktop

1. 访问 https://www.docker.com/products/docker-desktop/
2. 下载 Docker Desktop for Windows
3. 运行安装程序，按提示完成安装
4. 启动 Docker Desktop，确保状态为绿色（正在运行）

### 第二步：克隆项目（可选，如已有项目可跳过）

```powershell
# 打开 PowerShell 或 CMD
cd C:\Projects  # 或你的项目目录
git clone https://github.com/binge628/smart-fitness-saas.git
cd smart-fitness-saas
```

### 第三步：配置环境变量

```powershell
# 进入项目目录
cd C:\Projects\smart-fitness-saas

# 复制环境变量模板
cd backend
copy .env.example .env

# 用记事本编辑 .env 文件
notepad .env
```

**修改以下配置：**
```env
# 数据库连接（Docker 模式下使用此配置）
DATABASE_URL=postgres://postgres:postgres@postgres:5432/smart_fitness

# JWT 密钥（生产环境请修改）
JWT_SECRET=your_jwt_secret_key_here_change_in_production

# 前端地址
CLIENT_URL=http://localhost:5173
```

### 第四步：一键启动所有服务

```powershell
# 返回项目根目录
cd C:\Projects\smart-fitness-saas

# 启动所有服务（前端 + 后端 + 数据库）
docker-compose up -d

# 查看日志
docker-compose logs -f

# 停止服务
docker-compose down
```

### 第五步：访问应用

- **前端**：http://localhost:80
- **后端 API**：http://localhost:3001
- **API 文档**：http://localhost:3001/api-docs
- **数据库**：localhost:5432

---

## 方式二：本地环境部署（适合开发）

> **优点**：开发体验更好，支持热重载，调试方便

### 第一步：安装必要软件

#### 1. 安装 Node.js

1. 访问 https://nodejs.org/
2. 下载 **LTS 版本**（推荐 v20.x）
3. 运行安装程序，按提示完成安装
4. 验证安装：
   ```powershell
   node --version
   npm --version
   ```

#### 2. 安装 PostgreSQL

**选项 A：使用 PostgreSQL 官方安装包**

1. 访问 https://www.postgresql.org/download/windows/
2. 下载 Windows 安装包（推荐 15 或 16 版本）
3. 运行安装程序：
   - 安装路径：`C:\Program Files\PostgreSQL\16`
   - 设置 postgres 用户密码（记住这个密码）
   - 端口：5432
4. 验证安装：
   ```powershell
   # 打开 pgAdmin 或命令行
   psql -U postgres
   ```

**选项 B：使用 Docker 启动 PostgreSQL（推荐）**

```powershell
# 只需安装 Docker Desktop，然后运行：
docker run -d --name smart-fitness-db `
  -e POSTGRES_USER=postgres `
  -e POSTGRES_PASSWORD=postgres `
  -e POSTGRES_DB=smart_fitness `
  -p 5432:5432 `
  postgres:15-alpine
```

#### 3. 安装 Git（可选，如已安装可跳过）

1. 访问 https://git-scm.com/download/win
2. 下载并安装 Git for Windows
3. 验证安装：
   ```powershell
   git --version
   ```

---

### 第二步：克隆项目

```powershell
# 创建项目目录
mkdir C:\Projects
cd C:\Projects

# 克隆项目
git clone https://github.com/binge628/smart-fitness-saas.git
cd smart-fitness-saas
```

---

### 第三步：初始化数据库

#### 使用 PowerShell 初始化

```powershell
# 进入数据库脚本目录
cd C:\Projects\smart-fitness-saas\backend\db

# 方法 1：使用 psql 命令行
$env:PGPASSWORD = "你的 postgres 密码"
psql -U postgres -h localhost -f init.sql

# 方法 2：使用 pgAdmin
# 1. 打开 pgAdmin
# 2. 连接到 PostgreSQL
# 3. 打开 Query Tool
# 4. 复制 init.sql 内容并执行
```

#### 使用 Docker 初始化（推荐）

```powershell
# 启动 PostgreSQL 容器
docker run -d --name smart-fitness-db `
  -e POSTGRES_USER=postgres `
  -e POSTGRES_PASSWORD=postgres `
  -e POSTGRES_DB=smart_fitness `
  -p 5432:5432 `
  -v ${PWD}/backend/db/init.sql:/docker-entrypoint-initdb.d/init.sql `
  postgres:15-alpine
```

---

### 第四步：配置后端

```powershell
# 进入后端目录
cd C:\Projects\smart-fitness-saas\backend

# 安装依赖
npm install

# 复制环境变量
copy .env.example .env

# 编辑 .env 文件（用记事本或 VS Code）
notepad .env
```

**修改 `.env` 配置：**

```env
# 服务器配置
PORT=3001
NODE_ENV=development

# 数据库配置（本地 PostgreSQL）
DATABASE_URL=postgres://postgres:你的密码@localhost:5432/smart_fitness

# 或者使用分参数配置（二选一）
# DB_HOST=localhost
# DB_PORT=5432
# DB_NAME=smart_fitness
# DB_USER=postgres
# DB_PASSWORD=你的密码

# JWT 配置
JWT_SECRET=dev_jwt_secret_key_change_in_production
JWT_EXPIRES_IN=7d

# 前端地址（CORS）
CLIENT_URL=http://localhost:5173

# AI 配置（可选）
AI_PROVIDER=openai
AI_API_KEY=你的 API 密钥
AI_MODEL=gpt-4o-mini
```

---

### 第五步：配置前端

```powershell
# 进入前端目录
cd C:\Projects\smart-fitness-saas\frontend

# 安装依赖
npm install
```

**前端无需额外配置，默认会使用 `http://localhost:3001` 作为 API 地址。**

如需自定义，可创建 `.env.local` 文件：

```env
VITE_API_URL=http://localhost:3001
```

---

### 第六步：启动服务

#### 启动后端

```powershell
# 打开 PowerShell 窗口 1
cd C:\Projects\smart-fitness-saas\backend
npm run dev
```

看到以下输出表示成功：
```
Server running on port 3001
Database connected successfully
```

#### 启动前端

```powershell
# 打开 PowerShell 窗口 2
cd C:\Projects\smart-fitness-saas\frontend
npm run dev
```

看到以下输出表示成功：
```
VITE v8.x.x  ready in xxx ms

➜  Local:   http://localhost:5173/
➜  Network: use --host to expose
```

---

### 第七步：访问应用

- **前端**：http://localhost:5173
- **后端 API**：http://localhost:3001
- **API 文档**：http://localhost:3001/api-docs

---

## 常见问题解决

### Q1: npm install 失败，报错 "EBUSY: resource busy and locked"

**原因**：文件被占用或权限问题

**解决**：
```powershell
# 关闭所有占用文件的程序（如 VS Code）
# 以管理员身份运行 PowerShell
# 清理 npm 缓存
npm cache clean --force

# 删除 node_modules 和 package-lock.json
Remove-Item -Recurse -Force node_modules
Remove-Item package-lock.json

# 重新安装
npm install
```

---

### Q2: PostgreSQL 连接失败 "password authentication failed"

**原因**：密码错误或用户不存在

**解决**：
1. 打开 pgAdmin
2. 右键点击 Servers → PostgreSQL → Properties
3. 在 Connection 标签页重新输入密码
4. 或在 SQL 工具中重置密码：
   ```sql
   ALTER USER postgres WITH PASSWORD '新密码';
   ```

---

### Q3: 端口被占用 "Port 3001 is already in use"

**原因**：端口被其他程序占用

**解决**：
```powershell
# 查找占用端口的进程
netstat -ano | findstr :3001

# 杀死进程（替换 PID）
taskkill /PID 进程号 /F

# 或者修改后端端口
# 编辑 backend/.env，修改 PORT=3002
```

---

### Q4: Docker Desktop 启动失败 "WSL 2 installation is unavailable"

**原因**：WSL 2 未安装或未启用

**解决**：
1. 以管理员身份打开 PowerShell
2. 启用 WSL：
   ```powershell
   wsl --install
   ```
3. 重启电脑
4. 启动 Docker Desktop

---

### Q5: 前端无法连接后端 API

**原因**：CORS 配置或 API 地址错误

**解决**：
1. 检查后端 `.env` 中 `CLIENT_URL` 是否为 `http://localhost:5173`
2. 检查前端 `src/services/api.ts` 中的 `API_BASE_URL`
3. 确保后端已启动且可访问 http://localhost:3001/health

---

### Q6: 数据库表不存在 "relation 'users' does not exist"

**原因**：数据库未初始化

**解决**：
```powershell
# 方法 1：使用 psql
$env:PGPASSWORD = "密码"
psql -U postgres -h localhost -d smart_fitness -f backend/db/init.sql

# 方法 2：使用 pgAdmin
# 打开 pgAdmin → 连接到 smart_fitness 数据库 → Query Tool
# 复制 backend/db/init.sql 内容并执行
```

---

## 推荐开发工具

| 工具 | 用途 | 下载链接 |
|------|------|----------|
| **VS Code** | 代码编辑器 | https://code.visualstudio.com/ |
| **pgAdmin 4** | PostgreSQL 图形化管理 | 随 PostgreSQL 安装 |
| **Docker Desktop** | 容器化部署 | https://www.docker.com/products/docker-desktop/ |
| **PowerShell 7** | 命令行工具（Windows 自带） | https://aka.ms/powershell |
| **Git for Windows** | 版本控制 | https://git-scm.com/download/win |
| **HeidiSQL** | 数据库客户端（可选） | https://www.heidisql.com/ |

---

## 快速命令参考

```powershell
# Docker 方式启动所有服务
cd C:\Projects\smart-fitness-saas
docker-compose up -d

# 本地开发方式启动
# 窗口 1：启动后端
cd C:\Projects\smart-fitness-saas\backend
npm run dev

# 窗口 2：启动前端
cd C:\Projects\smart-fitness-saas\frontend
npm run dev

# 查看 Docker 日志
docker-compose logs -f

# 停止所有服务
docker-compose down

# 重启单个服务
docker-compose restart backend
```

---

## 测试账号

| 角色 | 用户名/邮箱 | 密码 |
|------|-------------|------|
| 管理员 | admin@fitness.com | admin123 |
| 测试用户 | user@fitness.com | user123 |

---

## 相关文档

- [完整配置指南](../SETUP.md)
- [数据库设计文档](database-design.md)
- [API 接口文档](api.md)
- [Supabase 配置指南](SUPABASE_SETUP.md)