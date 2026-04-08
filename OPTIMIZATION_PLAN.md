# Smart Fitness SaaS 优化计划

> 最后更新: 2026-04-08

---

## 进度概览

| 优先级 | 任务数 | 已完成 | 状态 |
|--------|--------|--------|------|
| P0 - 安全问题 | 6 | 6 | ✅ 已完成 |
| P1 - 架构设计优化 | 5 | 5 | ✅ 已完成 |
| P2 - 工程化优化 | 3 | 0 | ⏳ 待开始 |
| P3 - 产品功能推荐 | 6 | 0 | ⏳ 待开始 |

---

## P0 - 安全问题（必须修复）

- [x] 1. 移除密码明文日志 (`backend/src/utils/auth.ts` comparePassword 函数打印了密码原文)
- [x] 2. 移除生产环境敏感信息日志 (`backend/src/index.ts` 全局请求日志打印了完整 Headers/Body，含 Token 和密码)
- [x] 3. 移除测试后门 (`backend/src/middleware/authMiddleware.ts` 中 simple-token 硬编码后门)
- [x] 4. JWT Secret 启动校验 (`backend/src/utils/auth.ts` 默认弱密钥，应在启动时校验缺失则退出)
- [x] 5. 启用 401 自动重定向 (`frontend/src/services/api.ts` 响应拦截器中 401 处理被注释)
- [x] 6. 数据库连接字符串日志脱敏 (`backend/src/config/database.ts` 打印了连接字符串片段)

## P1 - 架构设计优化

- [x] 7. 引入 Zustand 全局状态管理 (替代各处直接读 localStorage，统一管理 auth 状态)
- [x] 8. 优化路由结构 (`frontend/src/App.tsx` 每个路由重复 AuthGuard + AppLayout 包裹，改为嵌套路由)
- [x] 9. 引入请求参数校验库 (后端引入 zod，替代手动 if 校验)
- [x] 10. 统一后端错误处理 (抽取自定义 Error 类 + 统一错误中间件，消除 Controller 中重复的 try-catch)
- [x] 11. 封装通用 SQL 动态更新工具 (消除多个 Controller 中重复的动态参数拼接逻辑)

## P2 - 工程化优化

- [ ] 12. 添加前端全局 ErrorBoundary (防止渲染错误导致白屏)
- [ ] 13. 添加 Docker 部署配置 (Dockerfile + docker-compose.yml)
- [ ] 14. 头像存储方案优化 (当前 base64 存数据库 VARCHAR(255) 会超限，应改为文件存储 + URL 引用)

## P3 - 产品功能推荐

- [ ] 15. 训练动作库 (预置训练动作，含肌肉群标记、标准姿势说明，健身 SaaS 核心差异化)
- [ ] 16. 训练组数/重量/次数记录 (当前只记录时长+热量，缺少力量训练核心数据模型)
- [ ] 17. 训练日历视图 (日历形式展示训练计划和完成情况，提升用户体验)
- [ ] 18. 成就 & 勋章系统 (连续打卡、累计训练等成就解锁，游戏化提升粘性)
- [ ] 19. 完善订阅计费系统 (数据库已有 subscriptions 表，补全前后端实现)
- [ ] 20. AI 健身助手 (基于用户数据用 LLM 生成个性化训练建议)
