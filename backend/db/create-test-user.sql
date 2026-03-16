-- 创建测试用户的 SQL 脚本
-- 在 Supabase SQL Editor 中执行此脚本，即可创建测试账号

-- 测试用户 1
INSERT INTO users (username, email, password_hash, role) VALUES
    ('testuser', 'test@example.com', '$2a$10$rKxJj3a2b4c5d6e7f8g9h0i1j2k3l4m5n6o7p8q9r0s1t2u3v4w5x6y7z8a9b0', 'user')
ON CONFLICT (username) DO NOTHING;

-- 测试用户 2
INSERT INTO users (username, email, password_hash, role) VALUES
    ('demo', 'demo@smartfitness.com', '$2a$10$rKxJj3a2b4c5d6e7f8g9h0i1j2k3l4m5n6o7p8q9r0s1t2u3v4w5x6y7z8a9b0', 'user')
ON CONFLICT (username) DO NOTHING;

-- 创建一个测试健身房（使用 testuser）
INSERT INTO gyms (name, description, address, phone, owner_id) VALUES
    ('示例健身房', '这是一个示例健身房，用于测试', '测试地址123号', '010-88888888',
     (SELECT id FROM users WHERE username = 'testuser' LIMIT 1))
ON CONFLICT DO NOTHING;

-- 查询验证
SELECT '✅ 测试用户创建成功！' as status;
SELECT username, email, role FROM users WHERE username IN ('testuser', 'demo');