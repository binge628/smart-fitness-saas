-- 策略：使用现有 admin 用户创建测试数据
-- 然后更新前端登录，使用 admin 账号登录
-- 用户名：admin，密码：admin123

-- 创建健身房
INSERT INTO gyms (name, description, address, phone, owner_id, status)
SELECT '活力健身中心', '设备齐全，提供私人教练服务', '北京市朝阳区健身路123号', '010-12345678', id, 'active' FROM users WHERE username = 'admin'
ON CONFLICT DO NOTHING;

INSERT INTO gyms (name, description, address, phone, owner_id, status)
SELECT '力量训练馆', '专注于力量训练的专业场馆', '上海市浦东新区健身路456号', '021-87654321', id, 'active' FROM users WHERE username = 'admin'
ON CONFLICT DO NOTHING;

-- 创建健身计划（关联到 admin）
INSERT INTO fitness_plans (name, description, duration_weeks, difficulty, target_goal, creator_id, is_template)
SELECT '初学者减脂计划', '适合健身新手，通过有氧运动和力量训练达到减脂目标', 8, 'beginner', '减脂塑形', id, true FROM users WHERE username = 'admin'
ON CONFLICT DO NOTHING;

INSERT INTO fitness_plans (name, description, duration_weeks, difficulty, target_goal, creator_id, is_template)
SELECT '中级增肌计划', '针对有一定基础的用户，通过高强度训练增加肌肉量', 12, 'intermediate', '增肌', id, true FROM users WHERE username = 'admin'
ON CONFLICT DO NOTHING;

INSERT INTO fitness_plans (name, description, duration_weeks, difficulty, target_goal, creator_id, is_template)
SELECT '高级力量突破', '为经验丰富的训练者设计，专注于突破力量瓶颈', 16, 'advanced', '力量提升', id, false FROM users WHERE username = 'admin'
ON CONFLICT DO NOTHING;

-- 创建训练日志（关联到 admin，过去1个月）
INSERT INTO workout_logs (user_id, workout_date, duration_minutes, calories_burned, notes)
SELECT id, CURRENT_DATE - INTERVAL '1 day', 45, 320, '今天状态不错' FROM users WHERE username = 'admin'
ON CONFLICT DO NOTHING;

INSERT INTO workout_logs (user_id, workout_date, duration_minutes, calories_burned, notes)
SELECT id, CURRENT_DATE - INTERVAL '3 days', 60, 450, '有氧训练 + 力量训练组合' FROM users WHERE username = 'admin'
ON CONFLICT DO NOTHING;

INSERT INTO workout_logs (user_id, workout_date, duration_minutes, calories_burned, notes)
SELECT id, CURRENT_DATE - INTERVAL '7 days', 30, 280, 'HIIT训练，心率最高达到了160' FROM users WHERE username = 'admin'
ON CONFLICT DO NOTHING;

INSERT INTO workout_logs (user_id, workout_date, duration_minutes, calories_burned, notes)
SELECT id, CURRENT_DATE - INTERVAL '14 days', 50, 380, '计划第二周，感觉越来越好' FROM users WHERE username = 'admin'
ON CONFLICT DO NOTHING;

-- 创建健康数据（关联到 admin，过去3个月）
INSERT INTO health_data (user_id, record_date, weight, height, body_fat_percentage, muscle_mass, heart_rate_resting, blood_pressure_systolic, blood_pressure_diastolic)
SELECT id, CURRENT_DATE, 72.5, 175.0, 18.5, 32.5, 62, 118, 76 FROM users WHERE username = 'admin'
ON CONFLICT (user_id, record_date) DO NOTHING;

INSERT INTO health_data (user_id, record_date, weight, height, body_fat_percentage, muscle_mass, heart_rate_resting, blood_pressure_systolic, blood_pressure_diastolic)
SELECT id, CURRENT_DATE - INTERVAL '7 days', 73.2, 175.0, 19.2, 32.1, 64, 120, 78 FROM users WHERE username = 'admin'
ON CONFLICT (user_id, record_date) DO NOTHING;

INSERT INTO health_data (user_id, record_date, weight, height, body_fat_percentage, muscle_mass, heart_rate_resting, blood_pressure_systolic, blood_pressure_diastolic)
SELECT id, CURRENT_DATE - INTERVAL '30 days', 76.5, 175.0, 21.5, 31.0, 68, 125, 85 FROM users WHERE username = 'admin'
ON CONFLICT (user_id, record_date) DO NOTHING;

INSERT INTO health_data (user_id, record_date, weight, height, body_fat_percentage, muscle_mass, heart_rate_resting, blood_pressure_systolic, blood_pressure_diastolic)
SELECT id, CURRENT_DATE - INTERVAL '60 days', 78.5, 175.0, 23.0, 30.2, 70, 128, 88 FROM users WHERE username = 'admin'
ON CONFLICT (user_id, record_date) DO NOTHING;

-- 验证
SELECT '✅ 测试数据创建完成！使用 admin/admin123 登录即可查看数据' as status;

SELECT CONCAT('创建的健身计划: ', COUNT(*)) FROM fitness_plans WHERE creator_id = (SELECT id FROM users WHERE username = 'admin');
SELECT CONCAT('创建的训练日志: ', COUNT(*)) FROM workout_logs WHERE user_id = (SELECT id FROM users WHERE username = 'admin');
SELECT CONCAT('创建的健康数据: ', COUNT(*)) FROM health_data WHERE user_id = (SELECT id FROM users WHERE username = 'admin');