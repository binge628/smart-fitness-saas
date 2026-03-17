-- 修复 admin 用户密码为正确的 admin123 哈希值
UPDATE users
SET password_hash = '$2b$10$7XJMD7ljl/Wwhb7l/iD3k.5OcyRQEjy3Caz1el7DLa.OHxO.Ulxku'
WHERE username = 'admin';

-- 验证更新
SELECT username, role, status, updated_at
FROM users
WHERE username = 'admin';

SELECT '✅ admin 用户密码已更新为 admin123' as status;