-- 智慧健身 SaaS 系统数据库初始化脚本

-- 启用 UUID 扩展
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ==================== 用户相关表 ====================

-- 用户表
CREATE TABLE IF NOT EXISTS users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    username VARCHAR(50) UNIQUE NOT NULL,
    email VARCHAR(100) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    phone VARCHAR(20),
    avatar VARCHAR(255),
    role VARCHAR(20) NOT NULL DEFAULT 'user' CHECK (role IN ('user', 'admin', 'coach', 'gym_admin')),
    status VARCHAR(20) NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'banned')),
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- ==================== 健身房相关表 ====================

-- 健身房表（多租户核心）
CREATE TABLE IF NOT EXISTS gyms (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(100) NOT NULL,
    description TEXT,
    address VARCHAR(255),
    phone VARCHAR(20),
    owner_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    status VARCHAR(20) NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'inactive')),
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- 健身房会员表
CREATE TABLE IF NOT EXISTS gym_members (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    gym_id UUID NOT NULL REFERENCES gyms(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    membership_type VARCHAR(20) NOT NULL DEFAULT 'basic' CHECK (membership_type IN ('basic', 'premium', 'vip')),
    membership_status VARCHAR(20) NOT NULL DEFAULT 'active' CHECK (membership_status IN ('active', 'expired', 'suspended')),
    start_date DATE NOT NULL,
    end_date DATE,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(gym_id, user_id)
);

-- ==================== 健身计划相关表 ====================

-- 健身计划表
CREATE TABLE IF NOT EXISTS fitness_plans (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(100) NOT NULL,
    description TEXT,
    duration_weeks INTEGER NOT NULL,
    difficulty VARCHAR(20) NOT NULL CHECK (difficulty IN ('beginner', 'intermediate', 'advanced')),
    target_goal VARCHAR(50),
    creator_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    is_template BOOLEAN NOT NULL DEFAULT false,
    gym_id UUID REFERENCES gyms(id) ON DELETE SET NULL,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- 训练日志表
CREATE TABLE IF NOT EXISTS workout_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    plan_id UUID REFERENCES fitness_plans(id) ON DELETE SET NULL,
    workout_date DATE NOT NULL,
    duration_minutes INTEGER NOT NULL,
    calories_burned INTEGER,
    notes TEXT,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- ==================== 健康数据表 ====================

-- 健康数据表
CREATE TABLE IF NOT EXISTS health_data (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    record_date DATE NOT NULL,
    weight DECIMAL(5,2),
    height DECIMAL(5,2),
    body_fat_percentage DECIMAL(5,2),
    muscle_mass DECIMAL(5,2),
    heart_rate_resting INTEGER,
    blood_pressure_systolic INTEGER,
    blood_pressure_diastolic INTEGER,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(user_id, record_date)
);

-- ==================== 订阅相关表 ====================

-- 订阅表
CREATE TABLE IF NOT EXISTS subscriptions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    plan_type VARCHAR(20) NOT NULL DEFAULT 'free' CHECK (plan_type IN ('free', 'monthly', 'yearly')),
    status VARCHAR(20) NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'cancelled', 'expired')),
    start_date DATE NOT NULL,
    end_date DATE,
    amount DECIMAL(10,2),
    payment_method VARCHAR(50),
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- ==================== 索引创建 ====================

-- 用户表索引
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_users_username ON users(username);
CREATE INDEX IF NOT EXISTS idx_users_role ON users(role);

-- 健身房表索引
CREATE INDEX IF NOT EXISTS idx_gyms_owner ON gyms(owner_id);
CREATE INDEX IF NOT EXISTS idx_gyms_status ON gyms(status);

-- 健身房会员索引
CREATE INDEX IF NOT EXISTS idx_gym_members_user ON gym_members(user_id);
CREATE INDEX IF NOT EXISTS idx_gym_members_gym ON gym_members(gym_id);
CREATE INDEX IF NOT EXISTS idx_gym_members_status ON gym_members(membership_status);

-- 健身计划索引
CREATE INDEX IF NOT EXISTS idx_plans_creator ON fitness_plans(creator_id);
CREATE INDEX IF NOT EXISTS idx_plans_gym ON fitness_plans(gym_id);
CREATE INDEX IF NOT EXISTS idx_plans_template ON fitness_plans(is_template);

-- 训练日志索引
CREATE INDEX IF NOT EXISTS idx_workout_user_date ON workout_logs(user_id, workout_date);
CREATE INDEX IF NOT EXISTS idx_workout_plan ON workout_logs(plan_id);

-- 健康数据索引
CREATE INDEX IF NOT EXISTS idx_health_user_date ON health_data(user_id, record_date);

-- 订阅表索引
CREATE INDEX IF NOT EXISTS idx_subscriptions_user ON subscriptions(user_id);
CREATE INDEX IF NOT EXISTS idx_subscriptions_status ON subscriptions(status);

-- ==================== 初始化测试数据 ====================

-- 插入默认管理员用户（密码: admin123，实际应该使用 bcrypt 加密）
INSERT INTO users (username, email, password_hash, role) VALUES
    ('admin', 'admin@smartfitness.com', '$2a$10$rKxJj3a2b4c5d6e7f8g9h0i1j2k3l4m5n6o7p8q9r0s1t2u3v4w5x6y7z8a9b0', 'admin');

-- 插入示例健身房
INSERT INTO gyms (name, description, address, phone, owner_id) VALUES
    ('活力健身中心', '设备齐全的专业健身房', '北京市朝阳区健身路123号', '010-12345678',
     (SELECT id FROM users WHERE username = 'admin'));

COMMIT;