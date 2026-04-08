# P1 架构设计优化 - 自测用例

> 测试日期: 2026-04-08
> 测试范围: P1 架构设计优化（任务 7-11）

---

## 一、Zustand 全局状态管理测试

### 1.1 认证状态持久化
**测试步骤：**
1. 打开浏览器，访问 http://localhost:5173/
2. 使用测试账号登录（或注册新账号）
3. 登录成功后，刷新页面
4. 检查是否保持登录状态

**预期结果：**
- ✅ 登录状态保持，不会跳转到登录页
- ✅ localStorage 中有 token 和 user 数据
- ✅ 页面顶部显示用户名和头像

### 1.2 退出登录
**测试步骤：**
1. 点击右上角用户头像
2. 点击"退出登录"

**预期结果：**
- ✅ 跳转到登录页
- ✅ localStorage 中的 token 和 user 被清除
- ✅ 无法访问受保护的路由

---

## 二、嵌套路由测试

### 2.1 路由切换
**测试步骤：**
1. 登录后，依次点击左侧菜单：首页、健身计划、健身房、健康数据、训练日志、个人资料
2. 观察页面切换效果

**预期结果：**
- ✅ 每个页面都能正常加载
- ✅ 左侧菜单高亮跟随当前路由
- ✅ 页面切换流畅，无白屏

### 2.2 未登录访问保护
**测试步骤：**
1. 退出登录
2. 直接访问 http://localhost:5173/plans

**预期结果：**
- ✅ 自动跳转到登录页
- ✅ 登录后跳转回原目标页面

### 2.3 已登录访问登录页
**测试步骤：**
1. 登录状态下，访问 http://localhost:5173/login

**预期结果：**
- ✅ 自动跳转到首页

---

## 三、Zod 参数校验测试

### 3.1 注册参数校验

**测试命令：**
```bash
# 测试1: 用户名太短
curl -X POST http://localhost:3001/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"username":"ab","email":"test@test.com","password":"123456"}'

# 预期: {"success":false,"error":"用户名至少3个字符"}

# 测试2: 邮箱格式错误
curl -X POST http://localhost:3001/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"username":"testuser","email":"invalid-email","password":"123456"}'

# 预期: {"success":false,"error":"邮箱格式不正确"}

# 测试3: 密码太短
curl -X POST http://localhost:3001/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"username":"testuser","email":"test@test.com","password":"123"}'

# 预期: {"success":false,"error":"密码至少6个字符"}

# 测试4: 手机号格式错误
curl -X POST http://localhost:3001/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"username":"testuser","email":"test@test.com","password":"123456","phone":"12345"}'

# 预期: {"success":false,"error":"手机号格式不正确"}
```

### 3.2 健身计划参数校验

**测试命令：**
```bash
# 先登录获取 token
TOKEN=$(curl -s -X POST http://localhost:3001/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username":"admin","password":"admin123"}' | grep -o '"token":"[^"]*"' | cut -d'"' -f4)

# 测试1: 缺少必填字段
curl -X POST http://localhost:3001/api/plans \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d '{"name":"测试计划"}'

# 预期: 返回缺少 duration_weeks 和 difficulty 的错误

# 测试2: 难度值非法
curl -X POST http://localhost:3001/api/plans \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d '{"name":"测试计划","duration_weeks":4,"difficulty":"expert"}'

# 预期: {"success":false,"error":"难度等级必须是 beginner、intermediate 或 advanced"}

# 测试3: 持续周数超限
curl -X POST http://localhost:3001/api/plans \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d '{"name":"测试计划","duration_weeks":100,"difficulty":"beginner"}'

# 预期: {"success":false,"error":"持续周数最多52周"}
```

### 3.3 训练日志参数校验

**测试命令：**
```bash
# 测试: 日期格式错误
curl -X POST http://localhost:3001/api/workouts \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d '{"workout_date":"2026/04/08","duration_minutes":30}'

# 预期: {"success":false,"error":"日期格式不正确，应为 YYYY-MM-DD"}

# 测试: 训练时长超限
curl -X POST http://localhost:3001/api/workouts \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d '{"workout_date":"2026-04-08","duration_minutes":1000}'

# 预期: {"success":false,"error":"训练时长最多600分钟"}
```

---

## 四、统一错误处理测试

### 4.1 404 错误
**测试命令：**
```bash
curl http://localhost:3001/api/not-exist

# 预期: {"success":false,"error":"请求的资源不存在","path":"/api/not-exist"}
```

### 4.2 认证错误
**测试命令：**
```bash
# 无 token 访问受保护接口
curl http://localhost:3001/api/auth/me

# 预期: {"success":false,"error":"未认证"}

# 无效 token
curl http://localhost:3001/api/auth/me \
  -H "Authorization: Bearer invalid-token"

# 预期: {"success":false,"error":"认证失败，请重新登录"}
```

### 4.3 权限错误
**测试命令：**
```bash
# 普通用户尝试创建健身房（需要管理员权限）
curl -X POST http://localhost:3001/api/gyms \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $USER_TOKEN" \
  -d '{"name":"测试健身房"}'

# 预期: {"success":false,"error":"权限不足"}
```

---

## 五、SQL 动态更新工具测试

### 5.1 单元测试脚本

**测试命令：**
```bash
cd /Users/bianxiao/smart-fitness-saas/backend
node -e "
const { buildUpdateQuery, buildInsertQuery, buildSelectQuery } = require('./dist/utils/queryBuilder.js');

// 测试 buildUpdateQuery
const updateResult = buildUpdateQuery(
  'users',
  { username: 'newname', email: 'new@email.com' },
  'id = \$1',
  ['user-123']
);
console.log('Update Query:', updateResult.query);
console.log('Update Values:', updateResult.values);

// 测试 buildInsertQuery
const insertResult = buildInsertQuery(
  'fitness_plans',
  { name: '测试计划', difficulty: 'beginner', duration_weeks: 4 }
);
console.log('Insert Query:', insertResult.query);
console.log('Insert Values:', insertResult.values);

// 测试 buildSelectQuery
const selectResult = buildSelectQuery(
  'users',
  { status: 'active', role: 'user' },
  { orderBy: 'created_at DESC', limit: 10 }
);
console.log('Select Query:', selectResult.query);
console.log('Select Values:', selectResult.values);
"
```

**预期输出：**
```
Update Query: 
    UPDATE users
    SET username = $1, email = $2, updated_at = CURRENT_TIMESTAMP
    WHERE id = $3
    RETURNING *
    
Update Values: [ 'newname', 'new@email.com', 'user-123' ]

Insert Query: 
    INSERT INTO fitness_plans (name, difficulty, duration_weeks)
    VALUES ($1, $2, $3)
    RETURNING *
    
Insert Values: [ '测试计划', 'beginner', 4 ]

Select Query: SELECT * FROM users WHERE status = $1 AND role = $2 ORDER BY created_at DESC LIMIT $3
Select Values: [ 'active', 'user', 10 ]
```

---

## 六、集成测试

### 6.1 完整用户流程

**测试步骤：**
```bash
# 1. 注册新用户
curl -X POST http://localhost:3001/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"username":"testuser","email":"test@example.com","password":"test123456"}'

# 2. 登录
LOGIN_RESULT=$(curl -s -X POST http://localhost:3001/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username":"testuser","password":"test123456"}')
echo $LOGIN_RESULT

# 3. 提取 token
TOKEN=$(echo $LOGIN_RESULT | grep -o '"token":"[^"]*"' | cut -d'"' -f4)

# 4. 获取当前用户信息
curl http://localhost:3001/api/auth/me \
  -H "Authorization: Bearer $TOKEN"

# 5. 创建健身计划
curl -X POST http://localhost:3001/api/plans \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d '{"name":"增肌计划","duration_weeks":8,"difficulty":"intermediate","target_goal":"增肌"}'

# 6. 获取计划列表
curl http://localhost:3001/api/plans \
  -H "Authorization: Bearer $TOKEN"

# 7. 创建训练日志
curl -X POST http://localhost:3001/api/workouts \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d '{"workout_date":"2026-04-08","duration_minutes":45,"calories_burned":300}'

# 8. 获取训练统计
curl http://localhost:3001/api/workouts/stats \
  -H "Authorization: Bearer $TOKEN"
```

---

## 七、前端功能测试

### 7.1 登录页面
- [ ] 输入框校验提示正常显示
- [ ] 登录失败显示错误信息
- [ ] 登录成功跳转首页

### 7.2 健身计划页面
- [ ] 列表正常加载
- [ ] 创建计划表单校验正常
- [ ] 编辑/删除功能正常

### 7.3 训练日志页面
- [ ] 日志列表正常显示
- [ ] 日期选择器正常工作
- [ ] 统计数据正确计算

### 7.4 个人资料页面
- [ ] 用户信息正确显示
- [ ] 修改资料功能正常
- [ ] 修改密码功能正常
- [ ] 头像上传功能正常

---

## 测试结果汇总

| 模块 | 测试项 | 状态 | 备注 |
|------|--------|------|------|
| Zustand | 状态持久化 | ⬜ | |
| Zustand | 退出登录 | ⬜ | |
| 嵌套路由 | 路由切换 | ⬜ | |
| 嵌套路由 | 访问保护 | ⬜ | |
| Zod | 注册校验 | ⬜ | |
| Zod | 计划校验 | ⬜ | |
| 错误处理 | 404处理 | ⬜ | |
| 错误处理 | 认证错误 | ⬜ | |
| SQL工具 | 动态构建 | ⬜ | |

---

## 快速测试脚本

```bash
# 运行所有 API 测试
cd /Users/bianxiao/smart-fitness-saas/backend

echo "=== 测试 Zod 参数校验 ==="
echo "1. 用户名太短:"
curl -s -X POST http://localhost:3001/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"username":"ab","email":"test@test.com","password":"123456"}' | jq .

echo "2. 邮箱格式错误:"
curl -s -X POST http://localhost:3001/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"username":"testuser","email":"invalid","password":"123456"}' | jq .

echo "=== 测试错误处理 ==="
echo "3. 404错误:"
curl -s http://localhost:3001/api/not-exist | jq .

echo "4. 未认证访问:"
curl -s http://localhost:3001/api/auth/me | jq .

echo "=== 测试 SQL 工具 ==="
node -e "
const { buildUpdateQuery } = require('./dist/utils/queryBuilder.js');
const result = buildUpdateQuery('users', { username: 'test' }, 'id = \$1', ['123']);
console.log('SQL:', result.query.replace(/\\n/g, ' ').trim());
console.log('Values:', result.values);
"
```