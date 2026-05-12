# Smart Fitness SaaS 优化计划

> 最后更新: 2026-05-11

---

## 进度概览

| 优先级 | 状态 |
|--------|------|
| P0 - 安全问题 | ✅ 已完成（6/6） |
| P1 - 架构设计优化 | ✅ 已完成（5/5） |
| P2 - 工程化优化 | ✅ 已完成（3/3） |
| P3 - 产品功能推荐 | 🔄 进行中（5/6） |

---

## P0 - 安全问题 ✅

> 全部完成

1. ✅ JWT Token 认证中间件
2. ✅ 密码 bcrypt 加密存储
3. ✅ Zod 请求参数校验
4. ✅ CORS 跨域配置
5. ✅ 文件上传安全（类型白名单 + 大小限制）
6. ✅ 统一错误处理中间件

---

## P1 - 架构设计优化 ✅

> 全部完成

1. ✅ RESTful API 规范化
2. ✅ 前端状态管理（Zustand）
3. ✅ 前端路由守卫
4. ✅ 前端错误边界
5. ✅ Docker 容器化

---

## P2 - 工程化优化 ✅

> 全部完成

1. ✅ Swagger API 文档
2. ✅ Jest/Vitest 测试框架
3. ✅ 头像上传功能

---

## P3 - 产品功能推荐

### ✅ 15. 训练动作库

预置训练动作，含肌肉群标记、标准姿势说明，健身 SaaS 核心差异化。

**已实现：**
- 数据库：`exercises` 表 + 23 条预置动作数据
- 后端：`exerciseController` + `exerciseRoutes`，支持按肌群/类别/关键词筛选
- 前端：`ExercisesPage` 动作库页面，分类标签 + 搜索 + 自定义动作创建

---

### ✅ 16. 训练组数/重量/次数记录

当前只记录时长+热量，缺少力量训练核心数据模型。

**已实现：**
- 数据库：`workout_sets` 表，关联 `workout_logs` 和 `exercises`
- 后端：创建训练日志时支持嵌套 `sets` 数组，一次请求完成训练+组数写入
- 前端：`WorkoutsPage` 内联组数录入，支持重量/次数/休息时间

---

### ✅ 17. 训练日历视图

日历形式展示训练计划和完成情况，提升用户体验。

**已实现：**
- 后端：`workoutController.getStats` 提供训练统计数据
- 前端：`WorkoutsPage` 日历视图展示训练日期和完成情况

---

### ✅ 18. 成就 & 勋章系统

连续打卡、累计训练等成就解锁，游戏化提升粘性。

**已实现：**
- 数据库：`achievements` 表（17 条预设成就）+ `user_achievements` 表
- 后端：`achievementController`（3 个 API + `checkAndUnlockAchievements` 导出函数）
  - `GET /api/achievements` — 成就列表含进度
  - `GET /api/achievements/stats` — 成就统计
  - `POST /api/achievements/check` — 检查并解锁
- 集成：`createWorkout` 完成后自动检查成就，响应含 `new_achievements`
- 前端：`AchievementsPage` 成就勋章页面，分类展示 + 进度条 + 统计卡片
- 测试：后端 23 个 API 集成测试 + 前端 19 个组件测试 + 16 个静态分析测试

---

### ✅ 19. 完善订阅计费系统

> 数据库已有 `subscriptions` 表，补全前后端实现。

**已实现：**
- 后端：`subscriptionController`（5 个 API）+ `subscriptionRoutes` + Zod 校验
  - `GET /api/subscriptions/plans` — 获取套餐价格列表（公开）
  - `GET /api/subscriptions/my` — 获取当前用户订阅
  - `POST /api/subscriptions/subscribe` — 订阅/续费
  - `PUT /api/subscriptions/cancel` — 取消订阅
  - `GET /api/subscriptions` — 管理员查看所有订阅
- 前端：`SubscriptionPage` 会员订阅页面，套餐对比 + 订阅操作
- 路由和菜单：`App.tsx` + `AppLayout.tsx` 已集成
- 测试：后端 24 个 API 集成测试

#### 19.1 现有基础

数据库 `subscriptions` 表结构：

```sql
CREATE TABLE IF NOT EXISTS subscriptions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    plan_type VARCHAR(20) NOT NULL DEFAULT 'free'
      CHECK (plan_type IN ('free', 'monthly', 'yearly')),
    status VARCHAR(20) NOT NULL DEFAULT 'active'
      CHECK (status IN ('active', 'cancelled', 'expired')),
    start_date DATE NOT NULL,
    end_date DATE,
    amount DECIMAL(10,2),
    payment_method VARCHAR(50),
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);
```

#### 19.2 技术方案

##### 后端实现

**新增文件：**
- `backend/src/controllers/subscriptionController.ts` — 订阅控制器
- `backend/src/routes/subscriptionRoutes.ts` — 订阅路由
- `backend/src/schemas/subscriptionSchemas.ts` — Zod 校验（追加到 `schemas/index.ts`）

**API 设计：**

| 方法 | 路径 | 说明 | 权限 |
|------|------|------|------|
| GET | `/api/subscriptions/my` | 获取当前用户订阅 | 认证用户 |
| POST | `/api/subscriptions/subscribe` | 订阅/续费 | 认证用户 |
| PUT | `/api/subscriptions/cancel` | 取消订阅 | 认证用户 |
| GET | `/api/subscriptions/plans` | 获取套餐价格列表 | 公开 |
| GET | `/api/subscriptions` | 管理员查看所有订阅 | 管理员 |

**核心逻辑：**

```
subscriptionController.ts
├── getMySubscription()      — 查询当前订阅，自动检查过期状态
├── subscribe()              — 创建/续费订阅
│   ├── 校验 plan_type 合法性
│   ├── 计算起止日期和金额
│   ├── 取消旧订阅（如有）
│   └── 创建新订阅记录
├── cancelSubscription()     — 标记取消，到期不续
├── getPlans()               — 返回套餐信息（静态配置）
└── getAllSubscriptions()    — 管理员分页查询
```

**套餐定价（配置化）：**

```typescript
const SUBSCRIPTION_PLANS = {
  free:    { name: '免费版', price: 0,    duration_days: 0,   features: [...] },
  monthly: { name: '月度会员', price: 29.9, duration_days: 30,  features: [...] },
  yearly:  { name: '年度会员', price: 299,  duration_days: 365, features: [...] },
};
```

**订阅过期自动检查：**
- 在 `getMySubscription` 中查询时自动将 `end_date < CURRENT_DATE` 的订阅标记为 `expired`
- 可选：添加定时任务（node-cron）批量扫描过期订阅

**权限中间件扩展：**
- 新增 `requireSubscription(plan_type)` 中间件，限制高级功能仅订阅用户可用
- 例如：训练数据分析导出、AI 健身助手等

##### 前端实现

**新增文件：**
- `frontend/src/pages/SubscriptionPage.tsx` — 订阅/套餐页面
- `frontend/src/services/api.ts` — 追加 `subscriptionService`

**页面设计：**

```
SubscriptionPage
├── 当前订阅状态卡片
│   ├── 套餐名称 + 到期时间
│   ├── 取消订阅按钮（active 状态下）
│   └── 续费按钮（cancelled/expired 状态下）
├── 套餐对比表格
│   ├── 免费版 / 月度 / 年度 三列
│   └── 功能对比（训练记录上限、数据导出、AI 助手等）
└── 订阅操作
    ├── 选择套餐
    ├── 确认订阅（模拟支付，暂不接入真实支付）
    └── 订阅成功提示
```

**路由和菜单：**
- App.tsx 新增 `/subscription` 路由
- AppLayout.tsx 在用户菜单中添加「会员订阅」菜单项

##### 数据库补充

```sql
-- 新增订阅特性配置表（可选，也可用代码配置）
-- ALTER TABLE subscriptions ADD COLUMN auto_renew BOOLEAN DEFAULT true;
```

#### 19.3 实施步骤

1. **后端 schemas** — 在 `schemas/index.ts` 中添加 `subscribeSchema`、`cancelSubscriptionSchema`
2. **后端 controller** — 实现 `subscriptionController.ts`，5 个核心函数
3. **后端 routes** — 实现 `subscriptionRoutes.ts`，注册到 `index.ts`
4. **前端 API** — 在 `api.ts` 中添加 `subscriptionService`
5. **前端页面** — 实现 `SubscriptionPage.tsx`，套餐对比 + 订阅操作
6. **前端路由** — 注册路由和菜单
7. **测试** — 后端 API 测试 + 前端组件测试
8. **权限集成** — `requireSubscription` 中间件，限制高级功能

#### 19.4 注意事项

- **支付集成**：初期使用模拟支付，预留支付网关接口（支付宝/微信），后续可接入
- **订阅降级**：从年付降为月付时，保留当前周期权益至到期
- **数据一致性**：订阅状态变更使用事务保证原子性
- **缓存策略**：用户订阅状态可在 auth token 中缓存，减少数据库查询

---

### 🔄 20. AI 健身助手

> 基于用户数据用 LLM 生成个性化训练建议。

#### 20.1 功能概述

AI 健身助手根据用户的训练记录、健康数据、身体指标，生成个性化建议：
- **训练建议**：根据训练频率和强度，推荐休息日或调整训练计划
- **营养建议**：根据体重/体脂变化趋势，给出饮食调整方向
- **计划优化**：分析训练数据，推荐更适合的计划难度和目标
- **问答交互**：用户可提问健身相关问题，AI 结合上下文回答

#### 20.2 技术方案

##### LLM 接入方式

**方案选择：HTTP API 调用（推荐）**

不依赖特定 SDK，通过 `axios` 直接调用 LLM API，便于切换供应商。

```
支持的 LLM 供应商（按优先级）：
1. OpenAI API (GPT-4o-mini / GPT-4o)    — 质量最高
2. Anthropic API (Claude Haiku/Sonnet)   — 性价比好
3. DeepSeek API                          — 成本最低
4. 本地 Ollama                           — 零成本，离线可用
```

**配置化切换（.env）：**

```env
# AI 健身助手配置
AI_PROVIDER=openai          # openai | anthropic | deepseek | ollama
AI_API_KEY=sk-xxx           # API 密钥
AI_MODEL=gpt-4o-mini        # 模型名称
AI_BASE_URL=                # 自定义端点（Ollama: http://localhost:11434/v1）
AI_MAX_TOKENS=1000          # 最大输出 token
AI_TEMPERATURE=0.7          # 创造性参数
```

##### 后端实现

**新增文件：**
- `backend/src/controllers/aiController.ts` — AI 助手控制器
- `backend/src/routes/aiRoutes.ts` — AI 路由
- `backend/src/services/aiService.ts` — LLM 调用封装
- `backend/src/prompts/fitnessPrompts.ts` — 健身场景 Prompt 模板

**API 设计：**

| 方法 | 路径 | 说明 | 权限 |
|------|------|------|------|
| POST | `/api/ai/chat` | AI 对话（流式/非流式） | 订阅用户 |
| POST | `/api/ai/training-advice` | 获取训练建议 | 订阅用户 |
| POST | `/api/ai/nutrition-advice` | 获取营养建议 | 订阅用户 |
| GET  | `/api/ai/plan-suggestion` | 获取计划推荐 | 订阅用户 |

**核心架构：**

```
aiService.ts（LLM 调用统一封装）
├── createChatCompletion(messages, options)
│   ├── 根据 AI_PROVIDER 选择 API 端点
│   ├── 统一请求格式（OpenAI 兼容格式）
│   └── 支持流式（SSE）和非流式响应
├── buildUserContext(userId)
│   ├── 查询用户基本信息（年龄、性别、目标）
│   ├── 查询最近 30 天训练数据
│   ├── 查询最近健康指标
│   └── 组装为系统提示词上下文
└── handleError(error)
    ├── 429 限流 → 返回友好提示
    ├── 401 密钥无效 → 返回配置错误
    └── 500 模型错误 → 降级为预设建议

fitnessPrompts.ts（Prompt 工程）
├── SYSTEM_PROMPT — 健身助手角色设定
├── TRAINING_ADVICE_PROMPT — 训练建议模板
├── NUTRITION_ADVICE_PROMPT — 营养建议模板
└── PLAN_SUGGESTION_PROMPT — 计划推荐模板
```

**AI Controller 核心逻辑：**

```typescript
// aiController.ts 关键流程
export const chatWithAI = async (req, res) => {
  const userId = req.user.userId;
  const { message, type } = req.body;

  // 1. 构建用户上下文
  const userContext = await aiService.buildUserContext(userId);

  // 2. 组装消息
  const messages = [
    { role: 'system', content: fitnessPrompts.SYSTEM_PROMPT + userContext },
    { role: 'user', content: message },
  ];

  // 3. 调用 LLM
  const response = await aiService.createChatCompletion(messages, {
    max_tokens: AI_MAX_TOKENS,
    temperature: AI_TEMPERATURE,
  });

  // 4. 返回结果
  res.json({ success: true, data: { reply: response.content } });
};
```

**流式响应（SSE）：**

```typescript
// 支持 Server-Sent Events 流式输出
export const chatStream = async (req, res) => {
  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');

  const stream = await aiService.createChatCompletion(messages, { stream: true });
  for await (const chunk of stream) {
    res.write(`data: ${JSON.stringify(chunk)}\n\n`);
  }
  res.write('data: [DONE]\n\n');
  res.end();
};
```

##### 前端实现

**新增文件：**
- `frontend/src/pages/AIAssistantPage.tsx` — AI 助手页面
- `frontend/src/services/api.ts` — 追加 `aiService`

**页面设计：**

```
AIAssistantPage
├── 快捷操作区
│   ├── 🏋️ 训练建议按钮
│   ├── 🥗 营养建议按钮
│   └── 📋 计划推荐按钮
├── 对话区域
│   ├── 消息气泡列表（用户/AI 交替）
│   │   ├── 用户消息（右侧，蓝色）
│   │   └── AI 回复（左侧，灰色，支持 Markdown 渲染）
│   └── 加载状态（打字动画）
├── 输入区域
│   ├── 文本输入框
│   └── 发送按钮
└── 免费用户提示
    └── "升级会员解锁 AI 健身助手"
```

**流式接收：**

```typescript
// 前端使用 fetch + ReadableStream 接收 SSE
const eventSource = new EventSource('/api/ai/chat/stream');
eventSource.onmessage = (event) => {
  if (event.data === '[DONE]') { eventSource.close(); return; }
  const chunk = JSON.parse(event.data);
  setMessages(prev => appendToLast(prev, chunk.content));
};
```

##### 安全与限流

- **认证**：所有 AI 接口需认证 + 订阅检查
- **限流**：每用户每日 20 次对话上限，防止滥用
- **输入过滤**：Prompt 注入防护，限制输入长度（500 字）
- **内容安全**：系统提示词约束 AI 仅回答健身相关问题
- **降级策略**：LLM 不可用时返回预设建议模板，不阻塞用户

##### 数据库补充

```sql
-- AI 对话记录表（可选，用于上下文记忆）
CREATE TABLE IF NOT EXISTS ai_conversations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    role VARCHAR(20) NOT NULL CHECK (role IN ('user', 'assistant', 'system')),
    content TEXT NOT NULL,
    conversation_id UUID,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_ai_conversations_user ON ai_conversations(user_id);
CREATE INDEX IF NOT EXISTS idx_ai_conversations_conv ON ai_conversations(conversation_id);
```

#### 20.3 实施步骤

1. **环境配置** — `.env` 添加 AI 相关配置项
2. **后端 aiService** — 实现 LLM 调用封装，支持多供应商切换
3. **后端 prompts** — 编写健身场景 Prompt 模板
4. **后端 controller** — 实现 `aiController.ts`，4 个 API
5. **后端 routes** — 实现 `aiRoutes.ts`，注册到 `index.ts`
6. **限流中间件** — 实现每日对话次数限制
7. **前端 API** — 在 `api.ts` 中添加 `aiService`
8. **前端页面** — 实现 `AIAssistantPage.tsx`，对话界面
9. **前端路由** — 注册路由和菜单
10. **测试** — 后端 API 测试 + 前端组件测试
11. **订阅集成** — AI 功能限制为订阅用户可用

#### 20.4 注意事项

- **成本控制**：优先使用低成本模型（GPT-4o-mini / DeepSeek），单次对话控制在 1000 token 内
- **上下文窗口**：只传入最近 30 天训练数据和 5 条健康指标，避免 token 浪费
- **缓存策略**：相同用户 5 分钟内重复请求可返回缓存结果
- **错误处理**：LLM 调用失败时降级为预设建议，不暴露技术细节
- **隐私合规**：AI 对话不记录敏感个人信息（手机号、邮箱等），上下文中脱敏
- **多轮对话**：初期支持单轮问答，后续可扩展为多轮对话（需 `ai_conversations` 表）

---

## 技术栈参考

| 层级 | 技术 |
|------|------|
| 后端框架 | Express 5 + TypeScript |
| 数据库 | PostgreSQL 15（本地）/ Supabase（云） |
| 认证 | JWT (jsonwebtoken) |
| 校验 | Zod |
| 前端框架 | React 19 + TypeScript |
| UI 组件 | Ant Design 6 |
| 状态管理 | Zustand |
| 路由 | React Router 7 |
| 构建 | Vite 8 |
| 容器化 | Docker + docker-compose |
| 测试 | Jest（后端）+ Vitest（前端） |
| AI（计划） | OpenAI API 兼容接口 |

---

## 项目文件结构

```
smart-fitness-saas/
├── backend/
│   ├── src/
│   │   ├── controllers/       # 业务逻辑
│   │   │   ├── achievementController.ts  ✅
│   │   │   ├── exerciseController.ts     ✅
│   │   │   ├── gymController.ts          ✅
│   │   │   ├── healthDataController.ts   ✅
│   │   │   ├── planController.ts         ✅
│   │   │   ├── userController.ts         ✅
│   │   │   ├── workoutController.ts      ✅
│   │   │   ├── subscriptionController.ts 🔄 (P3-19)
│   │   │   └── aiController.ts           🔄 (P3-20)
│   │   ├── routes/            # 路由定义
│   │   ├── middleware/        # 中间件（auth, error, upload）
│   │   ├── schemas/           # Zod 校验
│   │   ├── utils/             # 工具函数
│   │   ├── services/          # 业务服务
│   │   │   └── aiService.ts             🔄 (P3-20)
│   │   ├── prompts/           # AI Prompt 模板
│   │   │   └── fitnessPrompts.ts        🔄 (P3-20)
│   │   ├── config/            # 配置（数据库）
│   │   ├── stores/            # 前端状态（Zustand）
│   │   └── __tests__/         # 测试
│   ├── db/                    # SQL 迁移脚本
│   └── package.json
├── frontend/
│   ├── src/
│   │   ├── pages/             # 页面组件
│   │   │   ├── AchievementsPage.tsx     ✅
│   │   │   ├── ExercisesPage.tsx        ✅
│   │   │   ├── GymsPage.tsx             ✅
│   │   │   ├── HealthDataPage.tsx       ✅
│   │   │   ├── HomePage.tsx             ✅
│   │   │   ├── PlansPage.tsx            ✅
│   │   │   ├── WorkoutsPage.tsx         ✅
│   │   │   ├── ProfilePage.tsx          ✅
│   │   │   ├── SubscriptionPage.tsx     🔄 (P3-19)
│   │   │   └── AIAssistantPage.tsx      🔄 (P3-20)
│   │   ├── layouts/           # 布局
│   │   ├── components/        # 公共组件
│   │   ├── services/          # API 服务
│   │   ├── stores/            # 状态管理
│   │   ├── types/             # TypeScript 类型
│   │   ├── utils/             # 工具函数
│   │   └── __tests__/         # 测试
│   └── package.json
├── docker-compose.yml
├── nginx.conf
└── OPTIMIZATION_PLAN.md
```

---

## 已完成功能清单

| # | 功能 | 后端 | 前端 | 测试 |
|---|------|------|------|------|
| 1 | 用户认证（注册/登录/JWT） | ✅ | ✅ | ✅ |
| 2 | 用户管理（CRUD/头像上传） | ✅ | ✅ | ✅ |
| 3 | 健身计划（模板/自定义） | ✅ | ✅ | ✅ |
| 4 | 健身房管理（CRUD/会员） | ✅ | ✅ | ✅ |
| 5 | 健康数据（体重/体脂/心率） | ✅ | ✅ | ✅ |
| 6 | 训练日志（时长/热量/组数） | ✅ | ✅ | ✅ |
| 7 | 动作库（预置23个/自定义） | ✅ | ✅ | ✅ |
| 8 | 成就勋章系统（17项成就） | ✅ | ✅ | ✅ |
| 9 | Docker 容器化 | ✅ | — | — |
| 10 | Swagger API 文档 | ✅ | — | — |
| 11 | 订阅计费系统 | ✅ | ✅ | ✅ |
| 12 | AI 健身助手 | 🔄 | 🔄 | — |