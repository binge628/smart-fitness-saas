# Supabase 云数据库配置指南

## 快速开始（5 步完成）

### 1️⃣ 注册并创建项目

1. 访问 https://supabase.com
2. 点击 **"Start your project"**
3. 注册账号（GitHub 或邮箱）
4. 创建新项目：
   - Name: `smart-fitness-saas`
   - Password: 设置强密码（记住这个密码！）
   - Region: 选择离您最近的区域
   - 等待 1-2 分钟

### 2️⃣ 获取连接字符串

1. 登录后进入项目
2. 左侧菜单点击 **Settings**（齿轮图标）
3. 进入 **Database**
4. 找到 **Connection string**，点击 **URI** 标签
5. 复制完整的连接字符串，格式如下：

```
postgres://postgres.xxxxxxxxxxxxx:YOUR_PASSWORD@aws-0-ap-southeast-1.pooler.supabase.com:6543/postgres
```

### 3️⃣ 配置后端环境变量

打开 `backend/.env` 文件，修改为：

```env
PORT=3001
NODE_ENV=development

# ✅ 使用 Supabase 连接字符串（将 YOUR_PASSWORD 替换为创建项目的密码）
DATABASE_URL=postgres://postgres.xxxxxxxxxxxxx:YOUR_PASSWORD@aws-0-ap-southeast-1.pooler.supabase.com:6543/postgres

JWT_SECRET=your_jwt_secret_key_here_change_in_production
JWT_EXPIRES_IN=7d

CLIENT_URL=http://localhost:5173
```

**注意**：将连接字符串中的 `YOUR_PASSWORD` 替换为您创建项目时设置的数据库密码。

### 4️⃣ 初始化数据库表结构

**方法 A：网页操作（推荐，无需安装 PostgreSQL）**

1. 在 Supabase 左侧菜单点击 **SQL Editor**
2. 点击 **"New query"**
3. 打开 `backend/db/init.sql`
4. 复制全部内容，粘贴到页面
5. 点击右下角 **"Run"** 按钮
6. 看到 "Success" 表示完成

**方法 B：命令行（需要本地安装 psql）**

```bash
psql "postgres://postgres.xxxx:password@aws-0-xxx.pooler.supabase.com:6543/postgres" -f db/init.sql
```

### 5️⃣ 启动后端服务

```bash
cd backend
npm install  # 首次运行
npm run dev
```

看到以下输出表示成功：

```
🔗 使用连接字符串配置数据库
✅ 数据库连接成功

========================================
🏋  Smart Fitness SaaS API Server
========================================
Server running on: http://localhost:3001
Health check: http://localhost:3001/health
========================================
```

## 验证配置

### 测试数据库连接

访问健康检查接口：

```
http://localhost:3001/health
```

成功响应：

```json
{
  "status": "ok",
  "message": "Smart Fitness SaaS API is running",
  "database": "connected",
  "dbTime": "2024-03-16T..."
}
```

### 查看 Supabase 数据

1. Supabase 左侧菜单点击 **Table Editor**
2. 可以看到创建的表：
   - `users`
   - `gyms`
   - `fitness_plans`
   - `health_data`
   - `workout_logs`
   - `gym_members`
   - `subscriptions`

3. 点击表名可以查看/编辑数据

## Windows/macOS 切换

### Windows 系统操作

```cmd
# 1. 打开 backend 文件夹
cd backend

# 2. 确认 .env 配置指向 Supabase
# 不需要修改！.env 文件保持不变即可

# 3. 启动后端
npm run dev
```

### macOS 系统操作

```bash
# 1. 打开 backend 文件夹
cd backend

# 2. .env 已配置，直接启动
npm run dev
```

**优势**：使用云数据库后，两个系统配置完全相同，无需重复安装 PostgreSQL！

## 常见问题

### Q: 连接时提示密码错误

A: 检查 `.env` 中 `DATABASE_URL` 的密码是否与创建项目时设置的一致。

### Q: 表已存在错误

A: 在 Supabase SQL Editor 中先执行：

```sql
-- 删除所有表（谨慎操作！）
DROP TABLE IF EXISTS subscriptions CASCADE;
DROP TABLE IF EXISTS health_data CASCADE;
DROP TABLE IF EXISTS workout_logs CASCADE;
DROP TABLE IF EXISTS gym_members CASCADE;
DROP TABLE IF EXISTS fitness_plans CASCADE;
DROP TABLE IF EXISTS gyms CASCADE;
DROP TABLE IF EXISTS users CASCADE;
```

然后重新运行 `init.sql`。

### Q: 测试账号无法登录

A: 初始化脚本的测试账号使用了 bcrypt，需要运行完整脚本。请确保 `init.sql` 执行成功，然后使用：
- 用户名：`admin`
- 邮箱：`admin@smartfitness.com`
- 密码：`admin123`

### Q: 想清空数据库重新开始

A: 在 Supabase 项目设置中：

1. 进入 **Database**
2. 找到 **Reset Database Password**
3. 或者在 SQL Editor 运行：
```sql
TRUNCATE TABLE workout_logs CASCADE;
TRUNCATE TABLE health_data CASCADE;
TRUNCATE TABLE gym_members CASCADE;
TRUNCATE TABLE fitness_plans CASCADE;
TRUNCATE TABLE gyms CASCADE;
TRUNCATE TABLE users CASCADE;
```

### Q: 找不到连接字符串怎么办

A:
1. 确保已登录 Supabase
2. 进入正确的项目
3. Settings → Database → Connection string → URI

## 连接字符串格式说明

```
postgres://[用户名]:[密码]@[主机名]:[端口]/[数据库名]
        ↓          ↓        ↓                      ↓
   postgres.xxx  密码    aws-0-xxx.pooler...     postgres
```

## 数据库安全提示

1. **不要提交 `.env` 文件** 到 Git（已在 `.gitignore` 中）
2. **定期更换数据库密码**（Supabase Settings → Database）
3. **生产环境修改 JWT_SECRET** 为随机强密码
4. **开启 Supabase 数据库备份**（Settings → Database → Backup）

## 测试完整流程

1. 启动后端：`cd backend && npm run dev`
2. 启动前端：`cd frontend && npm run dev`
3. 浏览器访问：`http://localhost:5174`
4. 使用测试账号登录：
   - 用户名：`admin`
   - 密码：`admin123`
5. 测试创建健身计划、记录训练等功能

---

## 需要帮助？

- Supabase 官方文档：https://supabase.com/docs
- 项目问题：GitHub Issues