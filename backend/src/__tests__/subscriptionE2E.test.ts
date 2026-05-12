/**
 * 订阅计费系统 E2E 端到端测试
 * 测试完整业务流程：获取套餐 -> 订阅 -> 查询 -> 取消
 */
import request from 'supertest';

const API_BASE = 'http://localhost:3001';

describe('订阅计费系统 E2E 测试', () => {
  const testUsername = `sub_test_${Date.now()}`;
  const testEmail = `sub_test_${Date.now()}@example.com`;
  const testPassword = 'password123';

  // 辅助函数：获取认证 token
  async function getAuthToken(): Promise<string> {
    // 先尝试注册
    const registerRes = await request(API_BASE)
      .post('/api/auth/register')
      .send({
        username: testUsername,
        email: testEmail,
        password: testPassword,
      });

    if (registerRes.body.success) {
      return registerRes.body.data.token;
    }

    // 注册失败则登录
    const loginRes = await request(API_BASE)
      .post('/api/auth/login')
      .send({
        username: testUsername,
        password: testPassword,
      });

    if (loginRes.body.success) {
      return loginRes.body.data.token;
    }

    throw new Error('无法获取认证 token');
  }

  describe('E2E-1: 获取套餐列表', () => {
    it('无需认证即可获取套餐列表', async () => {
      const res = await request(API_BASE)
        .get('/api/subscriptions/plans');

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data).toHaveLength(3);

      // 验证套餐结构
      const plans = res.body.data;
      const freePlan = plans.find((p: any) => p.plan_type === 'free');
      const monthlyPlan = plans.find((p: any) => p.plan_type === 'monthly');
      const yearlyPlan = plans.find((p: any) => p.plan_type === 'yearly');

      expect(freePlan).toBeDefined();
      expect(freePlan.price).toBe(0);
      expect(monthlyPlan.price).toBe(29.9);
      expect(yearlyPlan.price).toBe(299);
    });
  });

  describe('E2E-2: 完整订阅流程', () => {
    let authToken: string;

    beforeAll(async () => {
      // 使用较短的唯一用户名
      const uniqueId = Math.random().toString(36).substr(2, 6);
      const registerRes = await request(API_BASE)
        .post('/api/auth/register')
        .send({
          username: `sub_${uniqueId}`,
          email: `sub_${uniqueId}@test.com`,
          password: testPassword,
        });

      expect(registerRes.body.success).toBe(true);
      authToken = registerRes.body.data.token;
    });

    it('步骤1: 获取当前订阅（初始应为免费版）', async () => {
      const res = await request(API_BASE)
        .get('/api/subscriptions/my')
        .set('Authorization', `Bearer ${authToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.current_plan.plan_type).toBe('free');
    });

    it('步骤2: 订阅月度会员', async () => {
      const res = await request(API_BASE)
        .post('/api/subscriptions/subscribe')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          plan_type: 'monthly',
          payment_method: 'mock_payment',
        });

      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.data.subscription.plan_type).toBe('monthly');
      expect(res.body.data.subscription.status).toBe('active');
      expect(res.body.data.current_plan.name).toBe('月度会员');
    });

    it('步骤3: 查询订阅状态已更新为月度', async () => {
      const res = await request(API_BASE)
        .get('/api/subscriptions/my')
        .set('Authorization', `Bearer ${authToken}`);

      expect(res.status).toBe(200);
      expect(res.body.data.current_plan.plan_type).toBe('monthly');
      expect(res.body.data.subscription.status).toBe('active');
    });

    it('步骤4: 升级到年度会员', async () => {
      const res = await request(API_BASE)
        .post('/api/subscriptions/subscribe')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          plan_type: 'yearly',
          payment_method: 'mock_payment',
        });

      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.data.subscription.plan_type).toBe('yearly');
      expect(res.body.data.current_plan.name).toBe('年度会员');
    });

    it('步骤5: 取消订阅', async () => {
      const res = await request(API_BASE)
        .put('/api/subscriptions/cancel')
        .set('Authorization', `Bearer ${authToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.status).toBe('cancelled');
    });

    it('步骤6: 查询订阅状态已变更为取消', async () => {
      const res = await request(API_BASE)
        .get('/api/subscriptions/my')
        .set('Authorization', `Bearer ${authToken}`);

      expect(res.status).toBe(200);
      expect(res.body.data.subscription.status).toBe('cancelled');
    });
  });

  describe('E2E-3: 错误处理', () => {
    let authToken: string;

    beforeAll(async () => {
      // 使用新的用户名注册
      const uniqueId = Math.random().toString(36).substr(2, 6);
      const registerRes = await request(API_BASE)
        .post('/api/auth/register')
        .send({
          username: `err_${uniqueId}`,
          email: `err_${uniqueId}@test.com`,
          password: testPassword,
        });

      expect(registerRes.body.success).toBe(true);
      authToken = registerRes.body.data.token;
    });

    it('无效套餐类型返回 400', async () => {
      const res = await request(API_BASE)
        .post('/api/subscriptions/subscribe')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          plan_type: 'invalid_plan',
        });

      expect(res.status).toBe(400);
    });

    it('免费套餐不能订阅', async () => {
      const res = await request(API_BASE)
        .post('/api/subscriptions/subscribe')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          plan_type: 'free',
        });

      expect(res.status).toBe(400);
    });

    it('未认证访问受保护接口返回 401', async () => {
      const res = await request(API_BASE)
        .get('/api/subscriptions/my');

      expect(res.status).toBe(401);
    });

    it('无活跃订阅时取消返回 404', async () => {
      // 先确保没有活跃订阅
      await request(API_BASE)
        .put('/api/subscriptions/cancel')
        .set('Authorization', `Bearer ${authToken}`);

      // 再次取消应该返回 404
      const res = await request(API_BASE)
        .put('/api/subscriptions/cancel')
        .set('Authorization', `Bearer ${authToken}`);

      expect(res.status).toBe(404);
    });
  });
});
