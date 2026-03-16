# Smart Fitness SaaS API 文档

## 基本信息

- **Base URL**: `http://localhost:3001`
- **Content-Type**: `application/json`
- **认证方式**: JWT Bearer Token

## 认证

大多数接口需要在请求头中携带认证 Token：

```
Authorization: Bearer <your_jwt_token>
```

---

## 接口列表

### 1. 认证模块 (Authentication)

#### 1.1 用户注册
- **接口**: `POST /api/auth/register`
- **说明**: 注册新用户
- **权限**: 无需认证

**请求体**:
```json
{
  "username": "string (必填)",
  "email": "string (必填)",
  "password": "string (必填)",
  "phone": "string (可选)"
}
```

**响应**:
```json
{
  "success": true,
  "message": "注册成功",
  "data": {
    "user": {
      "id": "uuid",
      "username": "string",
      "email": "string",
      "phone": "string",
      "role": "user",
      "status": "active"
    },
    "token": "jwt_token_string"
  }
}
```

---

#### 1.2 用户登录
- **接口**: `POST /api/auth/login`
- **说明**: 用户登录获取 Token
- **权限**: 无需认证

**请求体**:
```json
{
  "username": "string (必填，可用用户名或邮箱)",
  "password": "string (必填)"
}
```

**响应**:
```json
{
  "success": true,
  "message": "登录成功",
  "data": {
    "user": {
      "id": "uuid",
      "username": "string",
      "email": "string",
      "phone": "string",
      "avatar": "string",
      "role": "user",
      "status": "active"
    },
    "token": "jwt_token_string"
  }
}
```

---

#### 1.3 获取当前用户信息
- **接口**: `GET /api/auth/me`
- **说明**: 获取当前登录用户的信息
- **权限**: 需要认证

**响应**:
```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "username": "string",
    "email": "string",
    "phone": "string",
    "avatar": "string",
    "role": "user",
    "status": "active"
  }
}
```

---

### 2. 用户管理模块 (Users)

#### 2.1 获取所有用户
- **接口**: `GET /api/users`
- **说明**: 获取用户列表（仅管理员）
- **权限**: 需要认证 + Admin 角色

**响应**:
```json
{
  "success": true,
  "data": [
    {
      "id": "uuid",
      "username": "string",
      "email": "string",
      "phone": "string",
      "avatar": "string",
      "role": "user|admin|coach|gym_admin",
      "status": "active|inactive|banned"
    }
  ],
  "count": 100
}
```

---

#### 2.2 获取指定用户
- **接口**: `GET /api/users/:id`
- **说明**: 根据ID获取用户详情
- **权限**: 需要认证

**响应**:
```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "username": "string",
    "email": "string",
    "phone": "string",
    "avatar": "string",
    "role": "user",
    "status": "active"
  }
}
```

---

### 3. 健身计划模块 (Fitness Plans)

#### 3.1 创建健身计划
- **接口**: `POST /api/plans`
- **说明**: 创建新的健身计划
- **权限**: 需要认证

**请求体**:
```json
{
  "name": "string (必填)",
  "description": "string (可选)",
  "duration_weeks": "number (必填)",
  "difficulty": "beginner|intermediate|advanced (必填)",
  "target_goal": "string (可选，如：减脂、增肌)",
  "is_template": "boolean (可选，默认false)",
  "gym_id": "uuid (可选)"
}
```

**响应**:
```json
{
  "success": true,
  "message": "健身计划创建成功",
  "data": {
    "id": "uuid",
    "name": "string",
    "description": "string",
    "duration_weeks": 4,
    "difficulty": "beginner",
    "target_goal": "减脂",
    "creator_id": "uuid",
    "is_template": false,
    "gym_id": "uuid|null",
    "created_at": "timestamp"
  }
}
```

---

#### 3.2 获取健身计划列表
- **接口**: `GET /api/plans`
- **说明**: 获取健身计划列表，支持筛选
- **权限**: 需要认证

**查询参数**:
- `is_template`: `boolean` - 是否为模板
- `difficulty`: `string` - 难度 (beginner/intermediate/advanced)
- `creator_id`: `uuid` - 创建者ID
- `limit`: `number` - 返回数量限制 (默认20)
- `offset`: `number` - 偏移量

**响应**:
```json
{
  "success": true,
  "data": [
    {
      "id": "uuid",
      "name": "string",
      "description": "string",
      "duration_weeks": 4,
      "difficulty": "beginner",
      "target_goal": "减脂",
      "creator_id": "uuid",
      "creator_name": "string",
      "is_template": false,
      "gym_id": "uuid|null",
      "created_at": "timestamp"
    }
  ],
  "count": 50
}
```

---

#### 3.3 获取我的健身计划
- **接口**: `GET /api/plans/my`
- **说明**: 获取当前用户创建的计划
- **权限**: 需要认证

**响应**:
```json
{
  "success": true,
  "data": [/* 计划列表 */],
  "count": 10
}
```

---

#### 3.4 获取健身计划详情
- **接口**: `GET /api/plans/:id`
- **说明**: 根据ID获取健身计划详情
- **权限**: 需要认证

**响应**:
```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "name": "string",
    "description": "string",
    "duration_weeks": 4,
    "difficulty": "beginner",
    "target_goal": "减脂",
    "creator_id": "uuid",
    "creator_name": "string",
    "is_template": false,
    "gym_id": "uuid|null",
    "created_at": "timestamp"
  }
}
```

---

#### 3.5 更新健身计划
- **接口**: `PUT /api/plans/:id`
- **说明**: 更新健身计划（仅创建者或管理员）
- **权限**: 需要认证（限定创建者/管理员）

**请求体**: 同创建计划，所有字段可选

**响应**:
```json
{
  "success": true,
  "message": "健身计划更新成功",
  "data": { /* 更新后的计划 */ }
}
```

---

#### 3.6 删除健身计划
- **接口**: `DELETE /api/plans/:id`
- **说明**: 删除健身计划（仅创建者或管理员）
- **权限**: 需要认证（限定创建者/管理员）

**响应**:
```json
{
  "success": true,
  "message": "健身计划删除成功"
}
```

---

### 4. 健身房管理模块 (Gyms)

#### 4.1 创建健身房
- **接口**: `POST /api/gyms`
- **说明**: 创建新的健身房
- **权限**: 需要认证

**请求体**:
```json
{
  "name": "string (必填)",
  "description": "string (可选)",
  "address": "string (可选)",
  "phone": "string (可选)"
}
```

**响应**:
```json
{
  "success": true,
  "message": "健身房创建成功",
  "data": {
    "id": "uuid",
    "name": "string",
    "description": "string",
    "address": "string",
    "phone": "string",
    "owner_id": "uuid",
    "status": "active",
    "created_at": "timestamp"
  }
}
```

---

#### 4.2 获取健身房列表
- **接口**: `GET /api/gyms`
- **说明**: 获取健身房列表，支持筛选
- **权限**: 需要认证

**查询参数**:
- `owner_id`: `uuid` - 所有者ID
- `status`: `string` - 状态 (active/inactive)
- `limit`: `number` - 返回数量限制 (默认20)
- `offset`: `number` - 偏移量

**响应**:
```json
{
  "success": true,
  "data": [
    {
      "id": "uuid",
      "name": "string",
      "description": "string",
      "address": "string",
      "phone": "string",
      "owner_id": "uuid",
      "owner_name": "string",
      "status": "active",
      "created_at": "timestamp"
    }
  ],
  "count": 50
}
```

---

#### 4.3 获取我的健身房
- **接口**: `GET /api/gyms/my`
- **说明**: 获取当前用户拥有的健身房
- **权限**: 需要认证

---

#### 4.4 获取健身房详情
- **接口**: `GET /api/gyms/:id`
- **说明**: 获取健身房详情（含会员数）
- **权限**: 需要认证

**响应**:
```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "name": "string",
    "description": "string",
    "address": "string",
    "phone": "string",
    "owner_id": "uuid",
    "owner_name": "string",
    "status": "active",
    "member_count": 25,
    "created_at": "timestamp"
  }
}
```

---

#### 4.5 更新健身房
- **接口**: `PUT /api/gyms/:id`
- **说明**: 更新健身房信息（仅所有者或管理员）
- **权限**: 需要认证（限定所有者/管理员）

---

#### 4.6 删除健身房
- **接口**: `DELETE /api/gyms/:id`
- **说明**: 删除健身房（仅所有者或管理员）
- **权限**: 需要认证（限定所有者/管理员）

---

#### 4.7 添加会员到健身房
- **接口**: `POST /api/gyms/:id/members`
- **说明**: 将用户添加为健身房会员
- **权限**: 需要认证

**请求体**:
```json
{
  "user_id": "uuid (必填)",
  "membership_type": "basic|premium|vip (必填)",
  "start_date": "date (必填, YYYY-MM-DD)",
  "end_date": "date (可选, YYYY-MM-DD)"
}
```

**响应**:
```json
{
  "success": true,
  "message": "会员添加成功",
  "data": {
    "id": "uuid",
    "gym_id": "uuid",
    "user_id": "uuid",
    "membership_type": "premium",
    "membership_status": "active",
    "start_date": "2026-03-16",
    "end_date": "2026-09-16"
  }
}
```

---

#### 4.8 获取健身房会员列表
- **接口**: `GET /api/gyms/:id/members`
- **说明**: 获取健身房的会员列表
- **权限**: 需要认证

**查询参数**:
- `status`: `string` - 会员状态 (active/expired/suspended)
- `limit`: `number` - 返回数量限制 (默认20)
- `offset`: `number` - 偏移量

**响应**:
```json
{
  "success": true,
  "data": [
    {
      "id": "uuid",
      "gym_id": "uuid",
      "user_id": "uuid",
      "membership_type": "premium",
      "membership_status": "active",
      "username": "string",
      "email": "string",
      "phone": "string",
      "avatar": "string"
    }
  ],
  "count": 25
}
```

---

#### 4.9 更新会员信息
- **接口**: `PUT /api/gyms/:gymId/members/:userId`
- **说明**: 更新会员信息
- **权限**: 需要认证

---

#### 4.10 移除会员
- **接口**: `DELETE /api/gyms/:gymId/members/:userId`
- **说明**: 移除健身房会员
- **权限**: 需要认证

---

#### 4.11 获取我的会员资格
- **接口**: `GET /api/gyms/memberships/me`
- **说明**: 获取当前用户的会员资格列表
- **权限**: 需要认证

**响应**:
```json
{
  "success": true,
  "data": [
    {
      "id": "uuid",
      "gym_id": "uuid",
      "gym_name": "string",
      "gym_address": "string",
      "membership_type": "premium",
      "membership_status": "active",
      "start_date": "2026-03-16",
      "end_date": "2026-09-16"
    }
  ],
  "count": 2
}
```

---

### 5. 健康数据模块 (Health Data)

#### 5.1 创建健康数据
- **接口**: `POST /api/health-data`
- **说明**: 创建或更新健康数据记录（同日期自动更新）
- **权限**: 需要认证

**请求体**:
```json
{
  "record_date": "date (必填, YYYY-MM-DD)",
  "weight": "number (可选, kg)",
  "height": "number (可选, cm)",
  "body_fat_percentage": "number (可选, %)",
  "muscle_mass": "number (可选, kg)",
  "heart_rate_resting": "number (可选, bpm)",
  "blood_pressure_systolic": "number (可选)",
  "blood_pressure_diastolic": "number (可选)"
}
```

**响应**:
```json
{
  "success": true,
  "message": "健康数据记录成功",
  "data": {
    "id": "uuid",
    "user_id": "uuid",
    "record_date": "2026-03-16",
    "weight": 75.5,
    "height": 175,
    "body_fat_percentage": 18.5,
    "muscle_mass": 58.2
  }
}
```

---

#### 5.2 获取健康数据列表
- **接口**: `GET /api/health-data`
- **说明**: 获取健康数据列表，支持日期筛选
- **权限**: 需要认证

**查询参数**:
- `start_date`: `date` - 开始日期 (YYYY-MM-DD)
- `end_date`: `date` - 结束日期 (YYYY-MM-DD)
- `limit`: `number` - 返回数量限制 (默认30)
- `offset`: `number` - 偏移量

---

#### 5.3 获取健康数据统计
- **接口**: `GET /api/health-data/stats`
- **说明**: 获取健康数据的统计信息
- **权限**: 需要认证

**查询参数**:
- `start_date`: `date` - 开始日期 (YYYY-MM-DD)
- `end_date`: `date` - 结束日期 (YYYY-MM-DD)

**响应**:
```json
{
  "success": true,
  "data": {
    "avg_weight": 75.5,
    "max_weight": 78.0,
    "min_weight": 72.0,
    "avg_body_fat": 18.5,
    "max_body_fat": 19.0,
    "min_body_fat": 18.0,
    "avg_muscle_mass": 58.2,
    "record_count": 30
  }
}
```

---

#### 5.4 获取指定日期数据
- **接口**: `GET /api/health-data/date/:date`
- **说明**: 获取指定日期的健康数据
- **权限**: 需要认证

---

#### 5.5 更新健康数据
- **接口**: `PUT /api/health-data/:id`
- **说明**: 更新健康数据
- **权限**: 需要认证

---

#### 5.6 删除健康数据
- **接口**: `DELETE /api/health-data/:id`
- **说明**: 删除健康数据
- **权限**: 需要认证

---

### 6. 训练日志模块 (Workout Logs)

#### 6.1 创建训练日志
- **接口**: `POST /api/workouts`
- **说明**: 记录一次训练
- **权限**: 需要认证

**请求体**:
```json
{
  "plan_id": "uuid (可选)",
  "workout_date": "date (必填, YYYY-MM-DD)",
  "duration_minutes": "number (必填)",
  "calories_burned": "number (可选)",
  "notes": "string (可选)"
}
```

**响应**:
```json
{
  "success": true,
  "message": "训练日志创建成功",
  "data": {
    "id": "uuid",
    "user_id": "uuid",
    "plan_id": "uuid|null",
    "workout_date": "2026-03-16",
    "duration_minutes": 60,
    "calories_burned": 450,
    "notes": "感觉很好，完成了所有动作",
    "created_at": "timestamp"
  }
}
```

---

#### 6.2 获取训练日志列表
- **接口**: `GET /api/workouts`
- **说明**: 获取训练日志列表，支持筛选
- **权限**: 需要认证

**查询参数**:
- `plan_id`: `uuid` - 健身计划ID
- `start_date`: `date` - 开始日期 (YYYY-MM-DD)
- `end_date`: `date` - 结束日期 (YYYY-MM-DD)
- `limit`: `number` - 返回数量限制 (默认20)
- `offset`: `number` - 偏移量

**响应**:
```json
{
  "success": true,
  "data": [
    {
      "id": "uuid",
      "user_id": "uuid",
      "plan_id": "uuid|null",
      "plan_name": "30天减脂计划",
      "workout_date": "2026-03-16",
      "duration_minutes": 60,
      "calories_burned": 450,
      "notes": "感觉很好"
    }
  ],
  "count": 20
}
```

---

#### 6.3 获取训练日志详情
- **接口**: `GET /api/workouts/:id`
- **说明**: 获取训练日志详情（含关联计划信息）
- **权限**: 需要认证

---

#### 6.4 获取训练统计
- **接口**: `GET /api/workouts/stats`
- **说明**: 获取训练数据的统计信息
- **权限**: 需要认证

**查询参数**:
- `start_date`: `date` - 开始日期 (YYYY-MM-DD)
- `end_date`: `date` - 结束日期 (YYYY-MM-DD)

**响应**:
```json
{
  "success": true,
  "data": {
    "total_workouts": 30,
    "total_duration": 3600,
    "avg_duration": 120,
    "total_calories": 13500,
    "avg_calories": 450
  }
}
```

---

#### 6.5 更新训练日志
- **接口**: `PUT /api/workouts/:id`
- **说明**: 更新训练日志
- **权限**: 需要认证

---

#### 6.6 删除训练日志
- **接口**: `DELETE /api/workouts/:id`
- **说明**: 删除训练日志
- **权限**: 需要认证

---

## 错误响应

所有接口在出错时会返回统一的错误格式：

```json
{
  "success": false,
  "error": "错误信息描述"
}
```

### 常见 HTTP 状态码

| 状态码 | 说明 |
|--------|------|
| 200 | 请求成功 |
| 201 | 创建成功 |
| 400 | 请求参数错误 |
| 401 | 未认证或 Token 无效 |
| 403 | 权限不足 |
| 404 | 资源不存在 |
| 500 | 服务器内部错误 |

---

## 健康检查

- **接口**: `GET /health`
- **说明**: 检查 API 和数据库连接状态
- **权限**: 无需认证

**响应**:
```json
{
  "status": "ok",
  "message": "Smart Fitness SaaS API is running",
  "database": "connected",
  "dbTime": "2026-03-16T10:30:00.000Z"
}
```