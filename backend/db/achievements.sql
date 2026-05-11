-- 成就 & 勋章系统 迁移脚本
-- 在 Supabase SQL Editor 中执行

-- ==================== 成就表 ====================

CREATE TABLE IF NOT EXISTS achievements (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    code VARCHAR(50) NOT NULL UNIQUE,
    name VARCHAR(100) NOT NULL,
    description TEXT,
    icon VARCHAR(50),
    category VARCHAR(20) NOT NULL CHECK (category IN ('milestone', 'streak', 'cumulative')),
    requirement_type VARCHAR(20) NOT NULL CHECK (requirement_type IN ('workouts', 'days', 'duration', 'calories')),
    requirement_value INTEGER NOT NULL,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- ==================== 用户成就表 ====================

CREATE TABLE IF NOT EXISTS user_achievements (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    achievement_id UUID NOT NULL REFERENCES achievements(id) ON DELETE CASCADE,
    unlocked_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(user_id, achievement_id)
);

-- ==================== 索引 ====================

CREATE INDEX IF NOT EXISTS idx_user_achievements_user ON user_achievements(user_id);
CREATE INDEX IF NOT EXISTS idx_user_achievements_achievement ON user_achievements(achievement_id);

-- ==================== 预设成就数据 ====================

INSERT INTO achievements (code, name, description, icon, category, requirement_type, requirement_value) VALUES
-- 里程碑
('first_workout', '初试牛刀', '完成第1次训练', '🎯', 'milestone', 'workouts', 1),
('workout_10', '小试身手', '累计训练10次', '💪', 'cumulative', 'workouts', 10),
('workout_50', '健身达人', '累计训练50次', '🏆', 'cumulative', 'workouts', 50),
('workout_100', '训练有素', '累计训练100次', '👑', 'cumulative', 'workouts', 100),

-- 连续打卡
('streak_3', '三天打鱼', '连续训练3天', '🔥', 'streak', 'days', 3),
('streak_7', '一周坚持', '连续训练7天', '⭐', 'streak', 'days', 7),
('streak_14', '两周进阶', '连续训练14天', '🌟', 'streak', 'days', 14),
('streak_30', '月度冠军', '连续训练30天', '🏅', 'streak', 'days', 30),
('streak_100', '百日英雄', '连续训练100天', '💎', 'streak', 'days', 100),

-- 累计时长（小时）
('duration_10h', '十小时战士', '累计训练10小时', '⏱️', 'cumulative', 'duration', 10),
('duration_50h', '五十小时大师', '累计训练50小时', '⌛', 'cumulative', 'duration', 50),
('duration_100h', '百小时传奇', '累计训练100小时', '🌈', 'cumulative', 'duration', 100),
('duration_500h', '五百小时神话', '累计训练500小时', '🚀', 'cumulative', 'duration', 500),

-- 累计消耗卡路里
('calories_1000', '燃脂初现', '累计消耗1000卡', '🔥', 'cumulative', 'calories', 1000),
('calories_10000', '燃脂一万', '累计消耗10000卡', '💥', 'cumulative', 'calories', 10000),
('calories_50000', '燃脂大师', '累计消耗50000卡', '⚡', 'cumulative', 'calories', 50000),
('calories_100000', '燃脂传奇', '累计消耗100000卡', '🌟', 'cumulative', 'calories', 100000);

-- ==================== 验证 ====================

SELECT CONCAT('✅ 成就系统创建完成！预设成就: ', COUNT(*), ' 个') as status FROM achievements;