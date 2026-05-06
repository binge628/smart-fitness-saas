-- 训练动作库 + 组数记录 迁移脚本
-- 在 Supabase SQL Editor 中执行

-- ==================== 动作库表 ====================

CREATE TABLE IF NOT EXISTS exercises (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(100) NOT NULL,
    muscle_group VARCHAR(50) NOT NULL CHECK (muscle_group IN ('chest', 'back', 'shoulder', 'leg', 'arm', 'core', 'full_body', 'cardio')),
    category VARCHAR(50) NOT NULL CHECK (category IN ('compound', 'isolation', 'cardio')),
    description TEXT,
    is_preset BOOLEAN NOT NULL DEFAULT false,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- ==================== 训练组数表 ====================

CREATE TABLE IF NOT EXISTS workout_sets (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    workout_id UUID NOT NULL REFERENCES workout_logs(id) ON DELETE CASCADE,
    exercise_id UUID NOT NULL REFERENCES exercises(id) ON DELETE RESTRICT,
    set_order INTEGER NOT NULL,
    weight DECIMAL(6,2),
    reps INTEGER,
    rest_seconds INTEGER,
    notes TEXT,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- ==================== 索引 ====================

CREATE INDEX IF NOT EXISTS idx_exercises_muscle_group ON exercises(muscle_group);
CREATE INDEX IF NOT EXISTS idx_exercises_category ON exercises(category);
CREATE INDEX IF NOT EXISTS idx_workout_sets_workout ON workout_sets(workout_id);
CREATE INDEX IF NOT EXISTS idx_workout_sets_exercise ON workout_sets(exercise_id);

-- ==================== 预置动作数据 ====================

INSERT INTO exercises (name, muscle_group, category, description, is_preset) VALUES
-- 胸部
('杠铃卧推', 'chest', 'compound', '经典胸部复合动作，主要锻炼胸大肌', true),
('哑铃飞鸟', 'chest', 'isolation', '胸部孤立动作，拉伸胸肌', true),
('上斜哑铃卧推', 'chest', 'compound', '重点刺激上胸肌群', true),
('俯卧撑', 'chest', 'compound', '自重训练，锻炼胸肌和核心', true),

-- 背部
('引体向上', 'back', 'compound', '上背部最佳复合动作', true),
('杠铃划船', 'back', 'compound', '背部厚度训练首选', true),
('高位下拉', 'back', 'compound', '引体向上的替代动作', true),
('坐姿划船', 'back', 'compound', '背部中部厚度训练', true),

-- 肩部
('杠铃推举', 'shoulder', 'compound', '肩部整体力量训练', true),
('哑铃侧平举', 'shoulder', 'isolation', '三角肌中束孤立动作', true),
('哑铃前平举', 'shoulder', 'isolation', '三角肌前束训练', true),

-- 腿部
('杠铃深蹲', 'leg', 'compound', '腿部训练之王，全身力量基础', true),
('腿举', 'leg', 'compound', '大重量腿部训练动作', true),
('罗马尼亚硬拉', 'leg', 'compound', '腘绳肌和臀肌训练', true),
('保加利亚分腿蹲', 'leg', 'compound', '单腿力量和平衡训练', true),
('腿弯举', 'leg', 'isolation', '腘绳肌孤立训练', true),

-- 手臂
('杠铃弯举', 'arm', 'isolation', '肱二头肌经典动作', true),
('三头肌下压', 'arm', 'isolation', '肱三头肌孤立训练', true),
('锤式弯举', 'arm', 'isolation', '肱肌和前臂训练', true),

-- 核心
('平板支撑', 'core', 'isolation', '核心稳定性训练', true),
('卷腹', 'core', 'isolation', '腹直肌训练', true),

-- 有氧
('跑步', 'cardio', 'cardio', '基础有氧运动', true),
('跳绳', 'cardio', 'cardio', '高效有氧和协调性训练', true);

-- ==================== 验证 ====================

SELECT CONCAT('✅ 动作库表和组数表创建完成！预置动作: ', COUNT(*), ' 个') as status FROM exercises WHERE is_preset = true;