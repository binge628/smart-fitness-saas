-- 插入测试用户（使用合法 UUID 格式）
INSERT INTO users (id, username, email, password_hash, phone, role, status) VALUES
    ('3ec30187-41df-4b86-96dd-7e7d6e9c2f4', 'testuser', 'test@example.com', '$2a$10$rKxJj3a2b4c5d6e7f8g9h0i1j2k3l4m5n6o7p8q9r0s1t2u3v4w5x6y7z8a9b0', '13800138000', 'user', 'active')
ON CONFLICT (id) DO UPDATE SET
    username = EXCLUDED.username,
    email = EXCLUDED.email;

-- 获取测试用户 ID
DO $$ DECLARE test_user_id UUID; BEGIN
  SELECT id INTO test_user_id FROM users WHERE username = 'testuser' LIMIT 1;

  -- 创建健身房
  INSERT INTO gyms (id, name, description, address, phone, owner_id, status) VALUES
      ('4fd41298-52e7-4c3a-9fe0-8b6a7f1c3d5e', '活力健身中心', '设备齐全的专业健身房，提供私人教练服务', '北京市朝阳区健身路123号', '010-12345678', test_user_id, 'active'),
      ('5ge52309-63f8-4d4b-0g01-9c7b8g2d4e6f', '力量训练馆', '专注于力量训练的专业场馆', '上海市浦东新区健身路456号', '021-87654321', test_user_id, 'active')
  ON CONFLICT (id) DO NOTHING;

  -- 创建健身房会员
  INSERT INTO gym_members (id, gym_id, user_id, membership_type, membership_status, start_date, end_date) VALUES
      ('6hf63410-74g9-5e5c-1h12-0d8c9h3e5f7g', '4fd41298-52e7-4c3a-9fe0-8b6a7f1c3d5e', test_user_id, 'vip', 'active', CURRENT_DATE - INTERVAL '30 days', CURRENT_DATE + INTERVAL '330 days'),
      ('7ig74521-85h0-6f7d-2i23-1e9d0i4f6g8h', '5ge52309-63f8-4d4b-0g01-9c7b8g2d4e6f', test_user_id, 'premium', 'active', CURRENT_DATE - INTERVAL '15 days', CURRENT_DATE + INTERVAL '345 days')
  ON CONFLICT (gym_id, user_id) DO NOTHING;
END $$;

-- 创建健身计划
INSERT INTO fitness_plans (id, name, description, duration_weeks, difficulty, target_goal, creator_id, is_template, gym_id) VALUES
    ('8jh85632-96i1-7g8e-3j34-2f0e1j5g7h9i', '初学者减脂计划', '适合健身新手，通过有氧运动和力量训练达到减脂目标', 8, 'beginner', '减脂塑形', '3ec30187-41df-4b86-96dd-7e7d6e9c2f4', true, '4fd41298-52e7-4c3a-9fe0-8b6a7f1c3d5e'),
    ('9ki96743-07j2-8h9f-4k45-3g1f2k6h8i0j', '中级增肌计划', '针对有一定基础的用户，通过高强度训练增加肌肉量', 12, 'intermediate', '增肌', '3ec30187-41df-4b86-96dd-7e7d6e9c2f4', true, '4fd41298-52e7-4c3a-9fe0-8b6a7f1c3d5e'),
    ('0lj07854-18k3-9i0g-5l56-4h2g3l7i9j1k', '高级力量突破', '为经验丰富的训练者设计，专注于突破力量瓶颈', 16, 'advanced', '力量提升', '3ec30187-41df-4b86-96dd-7e7d6e9c2f4', false, '5ge52309-63f8-4d4b-0g01-9c7b8g2d4e6f'),
    ('1mk18965-29l4-0j1h-6m67-5i3h4m0j2k6l', '核心肌群强化', '全身核心训练专项，30天告别腰酸背痛', 4, 'beginner', '核心强化', '3ec30187-41df-4b86-96dd-7e7d6e9c2f4', true, null),
    ('2nl29076-30m5-1k2i-7n78-6j4i5n1k7l3m', 'HIIT燃脂训练', '高强度间歇训练，短时间内快速燃烧脂肪', 6, 'intermediate', '快速燃脂', '3ec30187-41df-4b86-96dd-7e7d6e9c2f4', true, null)
ON CONFLICT (id) DO NOTHING;

-- 插入训练日志（过去1个月的训练记录）
INSERT INTO workout_logs (id, user_id, plan_id, workout_date, duration_minutes, calories_burned, notes) VALUES
    ('3om30187-41n6-2l3j-8o90-7k5l8m9n1o2p', '3ec30187-41df-4b86-96dd-7e7d6e9c2f4', '8jh85632-96i1-7g8e-3j34-2f0e1j5g7h9i', CURRENT_DATE - INTERVAL '1 day', 45, 320, '今天状态不错，完成了所有基础动作'),
    ('4pn41298-52o7-3m4k-9p01-8l6m9n0o3p4q', '3ec30187-41df-4b86-96dd-7e7d6e9c2f4', '8jh85632-96i1-7g8e-3j34-2f0e1j5g7h9i', CURRENT_DATE - INTERVAL '3 days', 60, 450, '有氧训练 + 力量训练组合'),
    ('5qo52309-63p8-4n5l-0p12-9n7o0p4q5r6s', '3ec30187-41df-4b86-96dd-7e7d6e9c2f4', '9ki96743-07j2-8h9f-4k45-3g1f2k6h8i0j', CURRENT_DATE - INTERVAL '5 days', 75, 520, '增肌训练第三天，深蹲突破记录'),
    ('6rp63410-74q9-5o6m-1r23-0p8q1r5s7t8u', '3ec30187-41df-4b86-96dd-7e7d6e9c2f4', '2nl29076-30m5-1k2i-7n78-6j4i5n1k7l3m', CURRENT_DATE - INTERVAL '7 days', 30, 280, 'HIIT训练，心率最高达到了160'),
    ('7sq74521-85r0-6p7n-2s34-1q9r2s6t8u9v', '3ec30187-41df-4b86-96dd-7e7d6e9c2f4', '9ki96743-07j2-8h9f-4k45-3g1f2k6h8i0j', CURRENT_DATE - INTERVAL '10 days', 90, 600, '今日训练时长最长，手臂肌肉充血感明显'),
    ('8tr85632-96s1-7q8o-3t45-2r0s3t7u8v9w', '3ec30187-41df-4b86-96dd-7e7d6e9c2f4', '8jh85632-96i1-7g8e-3j34-2f0e1j5g7h9i', CURRENT_DATE - INTERVAL '14 days', 50, 380, '初学者减脂计划第二周，感觉越来越好'),
    ('9us96743-07t2-8r9p-4u56-3s1t4u8v9w0x', '3ec30187-41df-4b86-96dd-7e7d6e9c2f4', '1mk18965-29l4-0j1h-6m67-5i3h4m0j2k6l', CURRENT_DATE - INTERVAL '18 days', 35, 250, '核心训练，平板支撑进步了'),
    ('0vt07854-18u3-9s1h-5v67-4t2u5v9w0x1y', '3ec30187-41df-4b86-96dd-7e7d6e9c2f4', '2nl29076-30m5-1k2i-7n78-6j4i5n1k7l3m', CURRENT_DATE - INTERVAL '21 days', 25, 200, '快速HIIT，适合休息日后的恢复训练'),
    ('1wu18965-29v4-0t2i-6w78-5u3w6v9x0y1z', '3ec30187-41df-4b86-96dd-7e7d6e9c2f4', '0lj07854-18k3-9i0g-5l56-4h2g3l7i9j1k', CURRENT_DATE - INTERVAL '25 days', 120, 850, '力量突破训练日，硬拉达到120kg'),
    ('2xv29076-30w5-1u3j-7x89-6v4x7w0y1z2a', '3ec30187-41df-4b86-96dd-7e7d6e9c2f4', '8jh85632-96i1-7g8e-3j34-2f0e1j5g7h9i', CURRENT_DATE - INTERVAL '28 days', 55, 410, '踏上健身之路的第一天，充满期待！')
ON CONFLICT (id) DO NOTHING;

-- 插入健康数据（过去3个月的健康记录）
INSERT INTO health_data (id, user_id, record_date, weight, height, body_fat_percentage, muscle_mass, heart_rate_resting, blood_pressure_systolic, blood_pressure_diastolic) VALUES
    -- 最新数据
    ('3yw30187-41x6-2v4k-8y01-7k4l8m9n0o1p', '3ec30187-41df-4b86-96dd-7e7d6e9c2f4', CURRENT_DATE, 72.5, 175.0, 18.5, 32.5, 62, 118, 76),
    -- 一周前
    ('4zx41298-52y7-3w5l-9z01-8l5m9n0o2p3q', '3ec30187-41df-4b86-96dd-7e7d6e9c2f4', CURRENT_DATE - INTERVAL '7 days', 73.2, 175.0, 19.2, 32.1, 64, 120, 78),
    -- 两周前
    ('5ay52309-63z8-4x6m-0p12-9n6o1p4q5r6s', '3ec30187-41df-4b86-96dd-7e7d6e9c2f4', CURRENT_DATE - INTERVAL '14 days', 74.1, 175.0, 20.0, 31.8, 65, 122, 80),
    -- 一个月前
    ('6bz63410-7499-5y7n-1q23-0o7q2r5s8t9u', '3ec30187-41df-4b86-96dd-7e7d6e9c2f4', CURRENT_DATE - INTERVAL '30 days', 76.5, 175.0, 21.5, 31.0, 68, 125, 85),
    -- 两个月前
    ('7c074521-85a0-6z8o-2r34-1p8r3s6t9u0v', '3ec30187-41df-4b86-96dd-7e7d6e9c2f4', CURRENT_DATE - INTERVAL '60 days', 78.5, 175.0, 23.0, 30.2, 70, 128, 88),
    -- 三个月前（起始数据）
    ('8d189652-96b1-799p-3s45-2q9r4s7t9u0v', '3ec30187-41df-4b86-96dd-7e7d6e9c2f4', CURRENT_DATE - INTERVAL '90 days', 80.2, 175.0, 24.5, 29.5, 72, 130, 90)
ON CONFLICT (user_id, record_date) DO NOTHING;

-- 验证数据
SELECT '✅ 测试数据创建完成！' as status;

SELECT '👥 用户: 使用 admin 原账号登录，或修改前端测试模式 ID' as '测试数据统计';
SELECT '🏢 健身房: 2' as '  ';
SELECT '📋 健身计划: 5' as '  ';
SELECT '🏃 训练日志: 10' as '  ';
SELECT '💚 健康数据: 6' as '  ';