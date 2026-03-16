#!/bin/bash

# 智慧健身 SaaS 系统数据库快速初始化脚本

set -e

echo "========================================="
echo "  智慧健身 SaaS - 数据库初始化"
echo "========================================="
echo ""

# 检查 PostgreSQL 是否安装
if ! command -v psql &> /dev/null; then
    echo "❌ 错误: PostgreSQL 未安装"
    echo "请先安装 PostgreSQL:"
    echo "  macOS: brew install postgresql@16"
    echo "  Ubuntu: sudo apt install postgresql postgresql-contrib"
    echo "  Windows: 从 https://www.postgresql.org/download/windows/ 下载安装"
    echo ""
    echo "详细说明请参考: docs/DATABASE_SETUP.md"
    exit 1
fi

echo "✓ PostgreSQL 已安装"
echo ""

# 读取配置
source .env

if [ -z "$DB_NAME" ] || [ -z "$DB_USER" ]; then
    echo "❌ 错误: .env 文件配置不完整"
    echo "请确保 .env 文件中包含 DB_NAME 和 DB_USER 配置"
    exit 1
fi

echo "数据库配置:"
echo "  名称: $DB_NAME"
echo "  用户: $DB_USER"
echo "  主机: ${DB_HOST:-localhost}"
echo "  端口: ${DB_PORT:-5432}"
echo ""

# 询问是否继续
read -p "是否继续初始化数据库? (y/n) " -n 1 -r
echo
if [[ ! $REPLY =~ ^[Yy]$ ]]; then
    echo "已取消"
    exit 0
fi

echo ""
echo "开始初始化数据库..."

# 执行初始化脚本
if psql -h "${DB_HOST:-localhost}" \
   -p "${DB_PORT:-5432}" \
   -U postgres \
   -d postgres \
   -f db/init.sql 2>/dev/null; then
    echo ""
    echo "========================================="
    echo "✓ 数据库初始化成功!"
    echo "========================================="
    echo ""
    echo "测试账号:"
    echo "  用户名: admin"
    echo "  邮箱: admin@smartfitness.com"
    echo "  密码: admin123"
    echo ""
    echo "现在可以启动后端服务:"
    echo "  npm run dev"
else
    # 如果使用默认 postgres 用户失败，尝试使用配置的用户
    echo ""
    echo "尝试使用配置的数据库用户连接..."
    if psql -h "${DB_HOST:-localhost}" \
       -p "${DB_PORT:-5432}" \
       -U "$DB_USER" \
       -d "$DB_NAME" \
       -f db/init.sql 2>/dev/null; then
        echo ""
        echo "========================================="
        echo "✓ 数据库初始化成功!"
        echo "========================================="
    else
        echo ""
        echo "========================================="
        echo "❌ 数据库初始化失败"
        echo "========================================="
        echo ""
        echo "可能的原因:"
        echo "1. PostgreSQL 服务未启动"
        echo "2. 数据库用户或密码不正确"
        echo "3. 数据库 '$DB_NAME' 不存在"
        echo ""
        echo "手动创建数据库:"
        echo "  psql postgres"
        echo "  CREATE USER $DB_USER WITH PASSWORD 'your_password';"
        echo "  CREATE DATABASE $DB_NAME OWNER $DB_USER;"
        echo "  \\q"
        echo ""
        echo "然后重新运行此脚本，或手动导入:"
        echo "  psql -U $DB_USER -d $DB_NAME -f db/init.sql"
        exit 1
    fi
fi