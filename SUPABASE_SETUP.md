# Supabase 数据库设置指南

## 步骤 1：修复 admin 用户密码

在 Supabase SQL Editor 中执行以下 SQL：

```sql
-- 修复 admin 用户密码为正确的 admin123 哈希值
UPDATE users
SET password_hash = '$2b$10$7XJMD7ljl/Wwhb7l/iD3k.5OcyRQEjy3Caz1el7DLa.OHxO.Ulxku'
WHERE username = 'admin';

-- 验证更新
SELECT username, role, status, updated_at
FROM users
WHERE username = 'admin';

SELECT '✅ admin 用户密码已更新为 admin123' as status;
```

> **执行后登录信息**
> - 用户名：`admin`
> - 密码：`admin123`

---

## 步骤 2：创建测试数据

在 Supabase SQL Editor 中执行以下任一脚本：

### 选项 A：完整测试数据（推荐）

执行文件：`/Users/bianxiao/smart-fitness-saas/backend/db/add-test-data.sql`

包含数据：
- 2 家健身房
- 5 个健身计划
- 10 条训练日志
- 6 条健康记录
- 25 家健身房会员

### 选项 B：简化测试数据

执行文件：`/Users/bianxiao/smart-fitness-saas/backend/db/test-data-v2.sql`

包含数据：
- 2 家健身房
- 3 个健身计划
- 4 条训练日志
- 5 条健康记录

---

## 执行步骤

1. 登录 Supabase 控制台：
   https://supabase.com/dashboard

2. 进入你的项目

3. 点击左侧菜单 "SQL Editor"

4. 新建查询（New Query）

5. 粘贴上面选择的 SQL 代码

6. 点击 "Run" 执行

7. 确认看到 ✅ 提示信息

---

## 验证方法

执行完 SQL 后，刷新前端页面验证：

1. 打开 http://localhost:5173/
2. 使用 `admin` / `admin123` 登录（或点击测试模式）
3. 检查首页数据统计
4. 检查各页面列表是否显示数据

---

## 故障排除

如果执行后仍有问题：

**问题 1：用户不存在**
```sql
-- 创建 admin 用户（如果不存在）
INSERT INTO users (username, email, password_hash, role)
VALUES ('admin', 'admin@smartfitness.com', '$2b$10$7XJMD7ljl/Wwhb7l/iD3k.5OcyRQEjy3Caz1el7DLa.OHxO.Ulxku', 'admin')
ON CONFLICT (username) DO NOTHING;
```

**问题 2：密码哈希不匹配**
- 完整复制脚本中的哈希值：
  `$2b$10$7XJMD7ljl/Wwhb7l/iD3k.5OcyRQEjy3Caz1el7DLa.OHxO.Ulxku`
- 确保没有复制错误

**问题 3：查询报错**
- 如果某个表不存在，先创建表：
  ```sql
  -- 执行初始化脚本
  -- 文件路径：/Users/bianxiao/smart-fitness-saas/backend/db/init.sql
  ```