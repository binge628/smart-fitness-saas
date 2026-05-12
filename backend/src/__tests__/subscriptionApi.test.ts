/**
 * 订阅计费系统 API 集成测试
 */
import express, { Request, Response, NextFunction } from 'express';
import request from 'supertest';

// Mock auth 工具模块
jest.mock('../utils/auth', () => ({
  generateToken: jest.fn(() => 'mock-token'),
  verifyToken: jest.fn(() => ({ userId: 'test-user-id', username: 'testuser', email: 'test@test.com', role: 'user' })),
  extractTokenFromHeader: jest.fn((header: string) => header?.split(' ')[1] || null),
  hashPassword: jest.fn(() => Promise.resolve('hashed')),
  comparePassword: jest.fn(() => Promise.resolve(true)),
}));

// Mock 数据库模块
jest.mock('../config/database', () => {
  const mPool = {
    query: jest.fn(),
    connect: jest.fn(),
  };
  return { __esModule: true, default: mPool };
});

import subscriptionRoutes from '../routes/subscriptionRoutes';
import pool from '../config/database';
const mockedPool = pool as any;

// 模拟 authMiddleware
jest.mock('../middleware/authMiddleware', () => ({
  authMiddleware: (req: Request, _res: Response, next: NextFunction) => {
    if (req.headers.authorization === 'Bearer valid-token') {
      req.user = { userId: 'test-user-id', username: 'testuser', email: 'test@test.com', role: 'user' };
      next();
    } else if (req.headers.authorization === 'Bearer admin-token') {
      req.user = { userId: 'admin-id', username: 'admin', email: 'admin@test.com', role: 'admin' };
      next();
    } else {
      _res.status(401).json({ success: false, error: '未提供认证 Token' });
    }
  },
  requireRole: (...allowedRoles: string[]) => (req: Request, res: Response, next: NextFunction) => {
    if (!req.user) {
      return res.status(401).json({ success: false, error: '未认证' });
    }
    if (!allowedRoles.includes(req.user.role)) {
      return res.status(403).json({ success: false, error: '权限不足' });
    }
    next();
  },
}));

// 创建测试用 Express app
function createTestApp() {
  const app = express();
  app.use(express.json());
  app.use('/api/subscriptions', subscriptionRoutes);
  return app;
}

describe('订阅计费系统 API 集成测试', () => {
  let app: express.Express;

  beforeEach(() => {
    app = createTestApp();
    jest.clearAllMocks();
  });

  // ==================== GET /api/subscriptions/plans ====================

  describe('GET /api/subscriptions/plans - 获取套餐列表', () => {
    it('T1: 无需认证即可访问', async () => {
      const res = await request(app).get('/api/subscriptions/plans');
      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
    });

    it('T2: 返回三个套餐', async () => {
      const res = await request(app).get('/api/subscriptions/plans');
      expect(res.body.data).toHaveLength(3);
      const planTypes = res.body.data.map((p: any) => p.plan_type);
      expect(planTypes).toContain('free');
      expect(planTypes).toContain('monthly');
      expect(planTypes).toContain('yearly');
    });

    it('T3: 每个套餐包含必要字段', async () => {
      const res = await request(app).get('/api/subscriptions/plans');
      res.body.data.forEach((plan: any) => {
        expect(plan).toHaveProperty('plan_type');
        expect(plan).toHaveProperty('name');
        expect(plan).toHaveProperty('price');
        expect(plan).toHaveProperty('duration_days');
        expect(plan).toHaveProperty('features');
        expect(Array.isArray(plan.features)).toBe(true);
      });
    });

    it('T4: 免费版价格为 0', async () => {
      const res = await request(app).get('/api/subscriptions/plans');
      const freePlan = res.body.data.find((p: any) => p.plan_type === 'free');
      expect(freePlan.price).toBe(0);
    });

    it('T5: 年度套餐比月度更优惠', async () => {
      const res = await request(app).get('/api/subscriptions/plans');
      const monthly = res.body.data.find((p: any) => p.plan_type === 'monthly');
      const yearly = res.body.data.find((p: any) => p.plan_type === 'yearly');
      expect(yearly.price).toBeLessThan(monthly.price * 12);
    });
  });

  // ==================== GET /api/subscriptions/my ====================

  describe('GET /api/subscriptions/my - 获取当前订阅', () => {
    it('T6: 未认证时返回 401', async () => {
      const res = await request(app).get('/api/subscriptions/my');
      expect(res.status).toBe(401);
    });

    it('T7: 认证后返回当前套餐信息', async () => {
      // 自动过期更新 + 查询订阅
      mockedPool.query
        .mockResolvedValueOnce({ rowCount: 0 })     // 过期更新
        .mockResolvedValueOnce({ rows: [] });         // 无订阅记录

      const res = await request(app)
        .get('/api/subscriptions/my')
        .set('Authorization', 'Bearer valid-token');

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.current_plan).toBeDefined();
      expect(res.body.data.current_plan.plan_type).toBe('free');
    });

    it('T8: 有活跃订阅时返回订阅详情', async () => {
      const mockSub = {
        id: 'sub-1',
        plan_type: 'monthly',
        status: 'active',
        start_date: '2026-05-01',
        end_date: '2026-05-31',
        amount: 29.9,
      };
      mockedPool.query
        .mockResolvedValueOnce({ rowCount: 0 })
        .mockResolvedValueOnce({ rows: [mockSub] });

      const res = await request(app)
        .get('/api/subscriptions/my')
        .set('Authorization', 'Bearer valid-token');

      expect(res.status).toBe(200);
      expect(res.body.data.subscription.plan_type).toBe('monthly');
      expect(res.body.data.current_plan.plan_type).toBe('monthly');
    });

    it('T9: 自动将过期订阅标记为 expired', async () => {
      mockedPool.query
        .mockResolvedValueOnce({ rowCount: 1 })     // 过期更新
        .mockResolvedValueOnce({ rows: [] });

      const res = await request(app)
        .get('/api/subscriptions/my')
        .set('Authorization', 'Bearer valid-token');

      expect(res.status).toBe(200);
      // 验证过期更新 SQL 被调用
      expect(mockedPool.query).toHaveBeenCalledWith(
        expect.stringContaining("status = 'expired'"),
        expect.arrayContaining(['test-user-id'])
      );
    });
  });

  // ==================== POST /api/subscriptions/subscribe ====================

  describe('POST /api/subscriptions/subscribe - 订阅/续费', () => {
    it('T10: 未认证时返回 401', async () => {
      const res = await request(app)
        .post('/api/subscriptions/subscribe')
        .send({ plan_type: 'monthly' });
      expect(res.status).toBe(401);
    });

    it('T11: 无效套餐类型返回 400', async () => {
      const res = await request(app)
        .post('/api/subscriptions/subscribe')
        .set('Authorization', 'Bearer valid-token')
        .send({ plan_type: 'invalid' });

      expect(res.status).toBe(400);
    });

    it('T12: free 套餐返回 400', async () => {
      const res = await request(app)
        .post('/api/subscriptions/subscribe')
        .set('Authorization', 'Bearer valid-token')
        .send({ plan_type: 'free' });

      expect(res.status).toBe(400);
    });

    it('T13: 订阅月度套餐成功', async () => {
      const mockClient = {
        query: jest.fn()
          .mockResolvedValueOnce({ rows: [] })           // BEGIN
          .mockResolvedValueOnce({ rowCount: 0 })         // 取消旧订阅
          .mockResolvedValueOnce({                         // 创建新订阅
            rows: [{
              id: 'sub-new',
              plan_type: 'monthly',
              status: 'active',
              start_date: '2026-05-11',
              end_date: '2026-06-10',
              amount: 29.9,
            }],
          })
          .mockResolvedValueOnce({ rows: [] }),            // COMMIT
        release: jest.fn(),
      };
      mockedPool.connect.mockResolvedValueOnce(mockClient);

      const res = await request(app)
        .post('/api/subscriptions/subscribe')
        .set('Authorization', 'Bearer valid-token')
        .send({ plan_type: 'monthly' });

      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.message).toContain('月度会员');
      expect(res.body.data.current_plan.plan_type).toBe('monthly');
    });

    it('T14: 订阅年度套餐成功', async () => {
      const mockClient = {
        query: jest.fn()
          .mockResolvedValueOnce({ rows: [] })
          .mockResolvedValueOnce({ rowCount: 0 })
          .mockResolvedValueOnce({
            rows: [{
              id: 'sub-new',
              plan_type: 'yearly',
              status: 'active',
              start_date: '2026-05-11',
              end_date: '2027-05-11',
              amount: 299,
            }],
          })
          .mockResolvedValueOnce({ rows: [] }),
        release: jest.fn(),
      };
      mockedPool.connect.mockResolvedValueOnce(mockClient);

      const res = await request(app)
        .post('/api/subscriptions/subscribe')
        .set('Authorization', 'Bearer valid-token')
        .send({ plan_type: 'yearly' });

      expect(res.status).toBe(201);
      expect(res.body.data.current_plan.plan_type).toBe('yearly');
    });
  });

  // ==================== PUT /api/subscriptions/cancel ====================

  describe('PUT /api/subscriptions/cancel - 取消订阅', () => {
    it('T15: 未认证时返回 401', async () => {
      const res = await request(app).put('/api/subscriptions/cancel');
      expect(res.status).toBe(401);
    });

    it('T16: 有活跃订阅时取消成功', async () => {
      mockedPool.query.mockResolvedValueOnce({
        rowCount: 1,
        rows: [{ id: 'sub-1', plan_type: 'monthly', status: 'cancelled' }],
      });

      const res = await request(app)
        .put('/api/subscriptions/cancel')
        .set('Authorization', 'Bearer valid-token');

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.message).toContain('取消');
    });

    it('T17: 无活跃订阅时返回 404', async () => {
      mockedPool.query.mockResolvedValueOnce({ rowCount: 0 });

      const res = await request(app)
        .put('/api/subscriptions/cancel')
        .set('Authorization', 'Bearer valid-token');

      expect(res.status).toBe(404);
      expect(res.body.error).toContain('没有活跃');
    });
  });

  // ==================== GET /api/subscriptions (管理员) ====================

  describe('GET /api/subscriptions - 管理员查看所有订阅', () => {
    it('T18: 未认证时返回 401', async () => {
      const res = await request(app).get('/api/subscriptions');
      expect(res.status).toBe(401);
    });

    it('T19: 普通用户无权访问', async () => {
      const res = await request(app)
        .get('/api/subscriptions')
        .set('Authorization', 'Bearer valid-token');

      // 需要管理员角色，普通用户应被拒绝
      expect([401, 403]).toContain(res.status);
    });

    it('T20: 管理员可查看所有订阅', async () => {
      mockedPool.query
        .mockResolvedValueOnce({ rows: [{ id: 'sub-1' }], rowCount: 1 })
        .mockResolvedValueOnce({ rows: [{ count: '1' }] });

      const res = await request(app)
        .get('/api/subscriptions')
        .set('Authorization', 'Bearer admin-token');

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
    });
  });

  // ==================== 套餐配置验证 ====================

  describe('SUBSCRIPTION_PLANS 配置', () => {
    it('T21: 月度套餐天数为 30', () => {
      const { SUBSCRIPTION_PLANS } = require('../controllers/subscriptionController');
      expect(SUBSCRIPTION_PLANS.monthly.duration_days).toBe(30);
    });

    it('T22: 年度套餐天数为 365', () => {
      const { SUBSCRIPTION_PLANS } = require('../controllers/subscriptionController');
      expect(SUBSCRIPTION_PLANS.yearly.duration_days).toBe(365);
    });

    it('T23: 免费版天数为 0', () => {
      const { SUBSCRIPTION_PLANS } = require('../controllers/subscriptionController');
      expect(SUBSCRIPTION_PLANS.free.duration_days).toBe(0);
    });

    it('T24: 所有套餐都有功能列表', () => {
      const { SUBSCRIPTION_PLANS } = require('../controllers/subscriptionController');
      Object.values(SUBSCRIPTION_PLANS).forEach((plan: any) => {
        expect(Array.isArray(plan.features)).toBe(true);
        expect(plan.features.length).toBeGreaterThan(0);
      });
    });
  });
});