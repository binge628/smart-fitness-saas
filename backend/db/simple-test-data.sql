-- 插入测试用户
INSERT INTO users (id, username, email, password_hash, phone, role, status) VALUES
    ('3ec30187-41df-4b86-96dd-7e7d6e9c2f4', 'testuser', 'test@example.com', '$2a$10$rKxJj3a2b4c5d6e7f8g9h0i1j2k3l4m5n6o7p8q9r0s1t2u3v4w5x6y7z8a9b0', '13800138000', 'user', 'active')
ON CONFLICT (id) DO UPDATE SET
    username = EXCLUDED.username,
    email = EXCLUDED.email;

-- 创建健身房
INSERT INTO gyms (id, name, description, address, phone, owner_id, status) VALUES
    ('4fd41298-52e7-4c3a-9fe0-8b6a7f1c3d5e', '活力健身中心', '设备齐全，提供私人教练服务', '北京市朝阳区健身路123号', '010-12345678', '3ec30187-41df-4b86-96dd-7e7d6e9c2f4', 'active'),
    ('5ge52309-63f8-4d4b-0g01-9c7b8g2d4e6f', '力量训练馆', '专注于力量训练的专业场馆', '上海市浦东新区健身路456号', '021-87654321', '3ec30187-41df-4b86-96dd-7e7d6e9c2f4', 'active')
ON CONFLICT (id) DO NOTHING;

-- 创建健身房会员
INSERT INTO gym_members (id, gym_id, user_id, membership_type, membership_status, start_date, end_date) VALUES
    ('6hf63410-74g9-5e5c-1h12-0d8c9h3e5f7g', '4fd41298-52e7-4c3a-9fe0-8b6a7f1c3d5e', '3ec30187-41df-4b86-96dd-7e7d6e9c2f4', 'vip', 'active', CURRENT_DATE - INTERVAL '30 days', CURRENT_DATE + INTERVAL '330 days'),
    ('7ig74521-85h0-6f7d-2i23-1e9d0i4f6g8h', '5ge52309-63f8-4d4b-0g01-9c7b8g2d4e6f', '3ec30187-41df-4b86-96dd-7e7d6e9c2f4', 'premium', 'active', CURRENT_DATE - INTERVAL '15 days', CURRENT_DATE + INTERVAL '345 days')
ON CONFLICT (gym_id, user_id) DO NOTHING;

-- 创建健身计划
INSERT INTO fitness_plans (id, name, description, duration_weeks, difficulty, target_goal, creator_id, is_template, gym_id) VALUES
    ('8jh85632-96i1-7g8e-3j34-2f0e1j5g7h9i', '初学者减脂计划', '适合健身新手，通过有氧运动和力量训练达到减脂目标', 8, 'beginner', '减脂塑形', '3ec30187-41df-4b86-96dd-7e7d6e9c2f4', true, '4fd41298-52e7-4c3a-9fe0-8b6a7f1c3d5e'),
    ('9ki96743-07j2-8h9f-4k45-3g1f2k6h8i0j', '中级增肌计划', '针对有一定基础的用户，通过高强度训练增加肌肉量', 12, 'intermediate', '增肌', '3ec30187-41df-4b86-96dd-7e7d6e9c2f4', true, '4fd41298-52e7-4c3a-9fe0-8b6a7f1c3d5e'),
    ('0lj07854-18k3-9i0g-5l56-4h2g3l7i9j1k', '高级力量突破', '为经验丰富的训练者设计，专注于突破力量瓶颈', 16, 'advanced', '力量提升', '3ec30187-41df-4b86-96dd-7e7d6e9c2f4', false, '5ge52309-63f8-4d4b-0g01-9c7b8g2d4e6f'),
    ('1mk18965-29l4-0j1h-6m67-5i3h4m0j2k6l', '核心肌群强化', '全身核心训练专项，30天告别腰酸背痛', 4, 'beginner', '核心强化', '3ec30187-41df-4b86-96dd-7e7d6e9c2f4', true, null),
    ('2nl29076-30m5-1k2i-7n78-6j4i5n1k7l3m', 'HIIT燃脂训练', '高强度间歇训练，短时间内快速燃烧脂肪', 6, 'intermediate', '快速燃脂', '3ec30187-41df-4b86-96dd-7e7d6e9c2f4', true, null)
ON CONFLICT (id) DO NOTHING;

-- 插入训练日志
INSERT INTO workout_logs (id, user_id, plan_id, workout_date, duration_minutes, calories_burned, notes) VALUES
    ('3om30187-41n6-2l3j-8o90-7k5l8m9n1o2p', '3ec30187-41df-4b86-96dd-7e7d6e9c2f4', '8jh85632-96i1-7g8e-3j34-2f0e1j5g7h9i', CURRENT_DATE - INTERVAL '1 day', 45, 320, '今天状态不错'),
    ('4pn41298-52o7-3m4k-9p01-8l6m9n0o3p4q', '3ec30187-41df-4b86-96dd-7e7d6e9c2f4', '8jh85632-96i1-7g8e-3j34-2f0e1j5g7h9i', CURRENT_DATE - INTERVAL '3 days', 60, 450, '有氧训练 + 力量训练组合'),
    ('5qo52309-63p8-4n5l-0p12-9n7o0p4q5r6s', '3ec30187-41df-4b86-96dd-7e7d6e9c2f4', '9ki96743-07j2-8h9f-4k45-3g1f2k6h8i0j', CURRENT_DATE - INTERVAL '5 days', 75, 520, '增肌训练第三天'),
    ('6rp63410-74q9-5o6m-1r23-0p8q1r5s7t8u', '3ec30187-41df-4b86-96dd-7e7d6e9c2f4', '2nl29076-30m5-1k2i-7n78-6j4i5n1k7l3m', CURRENT_DATE - INTERVAL '7 days', 30, 280, 'HIIT训练'),
    ('7sq74521-85r0-6p7n-2s34-1q9r2s6t8u9v', '3ec30187-41df-4b86-96dd-7e7d6e9c2f4', '9ki96743-07j2-8h9f-4k45-3g1f2k6h8i0j', CURRENT_DATE - INTERVAL '10 days', 90, 600, '今日训练时长最长')
ON CONFLICT (id) DO NOTHING;

-- 插入健康数据
INSERT INTO health_data (id, user_id, record_date, weight, height, body_fat_percentage, muscle_mass, heart_rate_resting, blood_pressure_systolic, blood_pressure_diastolic) VALUES
    ('3yw30187-41x6-2v4k-8y01-7k4l8m9n0o1p', '3ec30187-41df-4b86-96dd-7e7d6e9c2f4', CURRENT_DATE, 72.5, 175.0, 18.5, 32.5, 62, 118, 76),
    ('4zx41298-52y7-3w5l-9z01-8l5m9n0o2p3q', '3ec30187-41df-4b86-96dd-7e7d6e9c2f4', CURRENT_DATE - INTERVAL '7 days', 73.2, 175.0, 19.2, 32.1, 64, 120, 78),
    ('5ay52309-63z8-4x6m-0p12-9n6o1p4q5r6s', '3ec30187-41df-4b86-96dd-7e7d6e9c2f4', CURRENT_DATE - INTERVAL '30 days', 76.5, 175.0, 21.5, 31.0, 68, 125, 85),
    ('6bz63410-7499-5y7n-1q23-0o7q2r5s8t9u', '3ec30187-41df-4b86-96dd-7e7d6e9c2f4', CURRENT_DATE - INTERVAL '60 days', 78.5, 175.0, 23.0, 30.2, 70, 128, 88),
    ('7c074521-85a0-6z8o-2r34-1p8r3s6t9u0v', '3ec30187-41df-4b86-96dd-7e7d6e9c2f4', CURRENT_DATE - INTERVAL '90 days', 80.2, 175.0, 24.5, 29.5, 72, 130, 90)
ON CONFLICT (user_id, record_date) DO NOTHING;

-- 验证
SELECT '✅ 测试数据创建完成！' as status;