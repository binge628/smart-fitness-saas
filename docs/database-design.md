# 数据库设计文档

## 核心表结构

### 1. 用户表 (users)
| 字段 | 类型 | 说明 |
|------|------|------|
| id | UUID | 主键 |
| username | VARCHAR(50) | 用户名 |
| email | VARCHAR(100) | 邮箱 |
| password_hash | VARCHAR(255) | 密码哈希 |
| phone | VARCHAR(20) | 手机号 |
| avatar | VARCHAR(255) | 头像URL |
| role | ENUM('user','admin','coach','gym_admin') | 角色 |
| status | ENUM('active','inactive','banned') | 状态 |
| created_at | TIMESTAMP | 创建时间 |
| updated_at | TIMESTAMP | 更新时间 |

### 2. 健身房表 (gyms) - SaaS 多租户核心
| 字段 | 类型 | 说明 |
|------|------|------|
| id | UUID | 主键 |
| name | VARCHAR(100) | 健身房名称 |
| description | TEXT | 描述 |
| address | VARCHAR(255) | 地址 |
| phone | VARCHAR(20) | 联系电话 |
| owner_id | UUID | 所有者ID (外键 → users) |
| status | ENUM('active','inactive') | 状态 |
| created_at | TIMESTAMP | 创建时间 |
| updated_at | TIMESTAMP | 更新时间 |

### 3. 健身房会员表 (gym_members)
| 字段 | 类型 | 说明 |
|------|------|------|
| id | UUID | 主键 |
| gym_id | UUID | 健身房ID (外键 → gyms) |
| user_id | UUID | 用户ID (外键 → users) |
| membership_type | ENUM('basic','premium','vip') | 会员类型 |
| membership_status | ENUM('active','expired','suspended') | 状态 |
| start_date | DATE | 开始日期 |
| end_date | DATE | 到期日期 |
| created_at | TIMESTAMP | 创建时间 |

### 4. 健身计划表 (fitness_plans)
| 字段 | 类型 | 说明 |
|------|------|------|
| id | UUID | 主键 |
| name | VARCHAR(100) | 计划名称 |
| description | TEXT | 描述 |
| duration_weeks | INTEGER | 持续周数 |
| difficulty | ENUM('beginner','intermediate','advanced') | 难度等级 |
| target_goal | VARCHAR(50) | 目标（减脂、增肌等） |
| creator_id | UUID | 创建者ID (外键 → users) |
| is_template | BOOLEAN | 是否为模板 |
| gym_id | UUID | 所属健身房（可为空，模板可共享） |
| created_at | TIMESTAMP | 创建时间 |
| updated_at | TIMESTAMP | 更新时间 |

### 5. 训练日志表 (workout_logs)
| 字段 | 类型 | 说明 |
|------|------|------|
| id | UUID | 主键 |
| user_id | UUID | 用户ID (外键 → users) |
| plan_id | UUID | 计划ID (外键 → fitness_plans) |
| workout_date | DATE | 训练日期 |
| duration_minutes | INTEGER | 训练时长 |
| calories_burned | INTEGER | 消耗卡路里 |
| notes | TEXT | 备注 |
| created_at | TIMESTAMP | 创建时间 |

### 6. 健康数据表 (health_data)
| 字段 | 类型 | 说明 |
|------|------|------|
| id | UUID | 主键 |
| user_id | UUID | 用户ID (外键 → users) |
| record_date | DATE | 记录日期 |
| weight | DECIMAL(5,2) | 体重(kg) |
| height | DECIMAL(5,2) | 身高(cm) |
| body_fat_percentage | DECIMAL(5,2) | 体脂率(%) |
| muscle_mass | DECIMAL(5,2) | 肌肉量(kg) |
| heart_rate_resting | INTEGER | 静息心率 |
| blood_pressure_systolic | INTEGER | 收缩压 |
| blood_pressure_diastolic | INTEGER | 舒张压 |
| created_at | TIMESTAMP | 创建时间 |

### 7. 订阅表 (subscriptions)
| 字段 | 类型 | 说明 |
|------|------|------|
| id | UUID | 主键 |
| user_id | UUID | 用户ID (外键 → users) |
| plan_type | ENUM('free','monthly','yearly') | 订阅类型 |
| status | ENUM('active','cancelled','expired') | 状态 |
| start_date | DATE | 开始日期 |
| end_date | DATE | 到期日期 |
| amount | DECIMAL(10,2) | 订阅金额 |
| payment_method | VARCHAR(50) | 支付方式 |
| created_at | TIMESTAMP | 创建时间 |

## 索引设计

- `users.email` - 唯一索引
- `users.username` - 唯一索引
- `workout_logs.user_id, workout_date` - 复合索引
- `health_data.user_id, record_date` - 复合索引
- `gym_members.user_id` - 索引
- `gym_members.gym_id` - 索引