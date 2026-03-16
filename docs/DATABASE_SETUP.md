# 数据库配置指南

## macOS 安装 PostgreSQL

### 使用 Homebrew 安装（推荐）

```bash
# 如果没有安装 Homebrew，先安装
/bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)"

# 安装 PostgreSQL
brew install postgresql@16

# 启动 PostgreSQL 服务
brew services start postgresql@16

# 或者直接启动
pg_ctl -D /usr/local/var/postgres start
```

### 验证安装

```bash
psql --version
```

## 数据库初始化

### 1. 创建数据库用户

```bash
# 使用默认 postgres 用户连接
psql postgres

# 在 psql 中执行
CREATE USER fitness_user WITH PASSWORD 'your_secure_password';
CREATE DATABASE smart_fitness OWNER fitness_user;
\q
```

### 2. 修改 .env 配置

从 `.env.example`复制并修改 `.env` 文件：

```bash
cd backend
cp .env.example .env
```

修改 `.env` 中的数据库配置：

```env
# 服务器配置
PORT=3001
NODE_ENV=development

# 数据库配置（PostgreSQL）
DB_HOST=localhost
DB_PORT=5432
DB_NAME=smart_fitness
DB_USER=fitness_user
DB_PASSWORD=your_secure_password

# JWT 密钥
JWT_SECRET=your_jwt_secret_key_here_change_in_production
JWT_EXPIRES_IN=7d

# 前端地址（CORS）
CLIENT_URL=http://localhost:5173
```

### 3. 运行初始化脚本

```bash
cd backend
psql -U fitness_user -d smart_fitness -f db/init.sql
```

或者使用 psql 交互方式：

```bash
psql -U fitness_user -d smart_fitness

# 在 psql 中执行
\i db/init.sql
\q
```

## 验证数据库

连接数据库并验证表是否创建成功：

```bash
psql -U fitness_user -d smart_fitness

# 查看所有表
\dt

# 查看用户表数据
SELECT * FROM users;

# 查看健身房表数据
SELECT * FROM gyms;

# 退出
\q
```

## 常用PostgreSQL命令

```bash
# 启动服务
brew services start postgresql@16

# 停止服务
brew services stop postgresql@16

# 重启服务
brew services restart postgresql@16

# 查看服务状态
brew services list

# 连接数据库
psql -U fitness_user -d smart_fitness

# 备份数据库
pg_dump -U fitness_user smart_fitness > backup.sql

# 恢复数据库
psql -U fitness_user smart_fitness < backup.sql
```

## 默认测试账号

系统初始化后会创建以下测试账号：

| 用户名 | 邮箱 | 密码 | 角色 |
|--------|------|------|------|
| admin | admin@smartfitness.com | admin123 | 管理员 |

**注意**: 首次登录后请立即修改密码！

## 故障排查

### 问题1: 连接被拒绝

```
connection refused
```

**解决方案**: 确认 PostgreSQL 服务正在运行

```bash
brew services list | grep postgresql
brew services start postgresql@16
```

### 问题2: 认证失败

```
FATAL: password authentication failed
```

**解决方案**: 检查 .env 中的 DB_USER 和 DB_PASSWORD 是否正确

### 问题3: 数据库不存在

```
FATAL: database "smart_fitness" does not exist
```

**解决方案**: 创建数据库

```bash
psql postgres
CREATE DATABASE smart_fitness OWNER fitness_user;
\q
```

### 问题4: UUID 扩展错误

```
ERROR: could not open extension control file
```

**解决方案**: PostgreSQL 版本太低，需要升级到 12.0 或更高版本

```bash
brew upgrade postgresql@16
```

## Linux/Windows 安装

### Linux (Ubuntu/Debian)

```bash
# 安装 PostgreSQL
sudo apt update
sudo apt install postgresql postgresql-contrib

# 启动服务
sudo systemctl start postgresql

# 创建用户
sudo -u postgres createuser fitness_user
sudo -u postgres createdb smart_fitness -O fitness_user

# 设置密码
sudo -u postgres psql
ALTER USER fitness_user WITH PASSWORD 'your_password';
\q
```

### Windows

1. 下载 PostgreSQL 安装包: https://www.postgresql.org/download/windows/
2. 运行安装程序，按提示完成安装
3. 使用 pgAdmin 管理数据库，或使用命令行工具