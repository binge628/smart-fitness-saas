# 系统迁移指南

## macOS → Windows 迁移

### 1. 数据迁移方式

您有两种方式处理数据库：

#### 方式 A：使用 PostgreSQL 云数据库（推荐）

使用云数据库服务，切换系统无需迁移数据：

**选项 1：Supabase（免费，推荐）**
- 访问：https://supabase.com
- 创建账号并新建项目
- 获取数据库连接信息
- 修改 `.env` 文件中的配置
- 运行 `db/init.sql` 初始化表结构
- Windows 端直接连接即可，无需本地安装 PostgreSQL

**选项 2：Railway / Render 或其他云服务**
- 类似流程，选择支持 PostgreSQL 的服务

#### 方式 B：迁移本地数据库

如果您有本地数据需要迁移：

```bash
# macOS 上导出数据
pg_dump -U fitness_user smart_fitness > backup.sql

# 将 backup.sql 复制到 Windows
# 在 Windows 上恢复
psql -U fitness_user -d smart_fitness < backup.sql
```

### 2. Windows 环境配置

#### 安装 PostgreSQL

1. **下载安装包**
   - 访问：https://www.postgresql.org/download/windows/
   - 下载最新版（建议 16.x）

2. **安装步骤**
   - 双击运行安装程序
   - 端口保持默认 `5432`
   - 密码设为 `fitness_password_123`（与 .env 一致）
   - 选择组件时安装 pgAdmin 4（可选）

3. **验证安装**

打开命令提示符（CMD）或 PowerShell：

```cmd
psql --version
```

#### 创建用户和数据库

使用 pgAdmin 或命令行创建：

**命令行方式（以管理员身份运行）：**

```cmd
# 连接到 PostgreSQL
psql -U postgres

# 创建用户
CREATE USER fitness_user WITH PASSWORD 'fitness_password_123';
CREATE DATABASE smart_fitness OWNER fitness_user;
\q
```

或者直接运行初始化脚本：

```cmd
cd backend
psql -U postgres -f db/init.sql
```

#### 配置 .env

Windows 上 `.env` 文件内容应保持不变：

```env
PORT=3001
NODE_ENV=development

DB_HOST=localhost
DB_PORT=5432
DB_NAME=smart_fitness
DB_USER=postgres         # Windows 通常用 postgres 超级用户
DB_PASSWORD=your_windows_password

JWT_SECRET=your_jwt_secret_key_here
JWT_EXPIRES_IN=7d
CLIENT_URL=http://localhost:5173
```

#### 从 macOS 迁移（如需要）

```cmd
# 在 Windows 的 psql 中
psql -U postgres -d smart_fitness

# 导入之前导出的 backup.sql（如果从 macOS 导出了）
\i backup.sql

# 或者直接运行初始化脚本
\i ..\db\init.sql

# 查看数据
SELECT * FROM users;
\q
```

### 3. Node.js 环境

**安装 Node.js：**

1. 访问：https://nodejs.org/
2. 下载 LTS 版本（推荐 20.x）
3. 运行安装程序

**验证安装：**

```cmd
node --version
npm --version
```

**安装依赖并启动：**

```cmd
cd backend
npm install
npm run dev

# 打开新终端
cd frontend
npm install
npm run dev
```

### 4. 差异说明

| 项目 | macOS | Windows |
|------|--------|---------|
| 路径分隔符 | `/` | `\` 或 `/` |
| PostgreSQL 服务 | `brew services` | Windows 服务/自动启动 |
| 默认超级用户 | 通常 `postgres` | `postgres` |
| 配置文件位置 | `/usr/local/var/postgres/` | `C:\Program Files\PostgreSQL\16\data\` |
| shell 脚本 | Bash (`.sh`) | PowerShell 或 Batch (`.bat`) |

### 5. Windows 特定注意事项

#### Git 换行符问题

Windows 和 macOS 的换行符不同（CRLF vs LF），可能引起 `.sh` 脚本问题：

**解决方式 1：自动转换**

```cmd
git config --global core.autocrlf true
```

**解决方式 2：Windows 下使用 PowerShell**

将 `scripts/init-db.sh` 转换为 PowerShell 脚本：

`scripts\init-db.ps1`

```powershell
# 内容见下方
```

#### PowerShell 初始化脚本 (init-db.ps1)

```powershell
# 初始化脚本 PowerShell 版本
$env:PGPASSWORD = "your_password"
psql -U postgres -h localhost -d postgres -f .\db\init.sql
```

或者使用 pgAdmin 图形界面加载数据库。

## macOS 本地初始化步骤

### 当前环境操作

如果您希望在 macOS 上立即开始开发，请按以下步骤操作：

```bash
# 1. 安装 Homebrew（如果没有）
/bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)"

# 2. 添加 Homebrew 到 PATH（如果提示找不到 brew）
echo 'eval "$(/opt/homebrew/bin/brew shellenv)"' >> ~/.zprofile

# 3. 重新加载 shell
source ~/.zprofile

# 4. 安装 PostgreSQL
brew install postgresql@16
brew services start postgresql@16

# 5. 初始化数据库
cd backend
./scripts/init-db.sh

# 6. 启动后端
npm run dev
```

### 快速测试

初始化完成后，打开浏览器访问：

- 前端：http://localhost:5174
- 后端健康检查：http://localhost:3001/health

默认测试账号：
- 用户名：`admin`
- 邮箱：`admin@smartfitness.com`
- 密码：`admin123`

## 建议

**开发阶段：**
- 建议使用云数据库（Supabase 等免费服务）
- 避免本地安装 PostgreSQL
- 不同系统间切换无障碍

**毕业设计/演示：**
- 使用云数据库更方便演示
- 评委或老师可以直接在线访问

---

## PostgreSQL 云服务对比

| 服务 | 免费额度 | 优点 | 推荐度 |
|------|----------|------|--------|
| Supabase | 500MB 数据库 | 开箱即用、免费额度高 | ⭐⭐⭐⭐⭐ |
| Railway | $5 赠送额度 | 简单易用 | ⭐⭐⭐⭐ |
| Neon | 免费版试用 | Serverless、自动扩缩 | ⭐⭐⭐⭐ |
| Render | 免费层 | 一键部署 | ⭐⭐⭐ |

**Supabase 快速上手：**
1. 注册账号
2. 新建项目
3. 在 Project Settings → Database 获取连接信息
4. 将信息填入 `.env`
5. 在 SQL Editor 运行 `db/init.sql` 内容