/**
 * AI 健身助手 API 集成测试
 */
import express, { Request, Response, NextFunction } from 'express';
import request from 'supertest';

// Mock auth 工具模块
jest.mock('../utils/auth', () => ({
  generateToken: jest.fn(() => 'mock-token'),
  verifyToken: jest.fn(() => ({ userId: 'test-user-id', username: 'testuser', email: 'test@test.com', role: 'user' })),
  extractTokenFromHeader: jest.fn((header: string) => header?.split(' ')[1] || null),
}));

// Mock 数据库模块
jest.mock('../config/database', () => {
  const mPool = {
    query: jest.fn(),
    connect: jest.fn(),
  };
  return { __esModule: true, default: mPool };
});

// Mock AI 服务模块
jest.mock('../services/aiService', () => ({
  createChatCompletion: jest.fn(),
  buildUserContext: jest.fn(() => Promise.resolve({
    profile: { username: 'testuser', age: 25, gender: 'male', height: 175, weight: 70, fitness_goal: '增肌' },
    recentWorkouts: [],
    healthMetrics: [],
    stats: { totalWorkouts: 10, totalDuration: 600, currentStreak: 3 },
  })),
  formatUserContextForPrompt: jest.fn(() => '用户基本信息:\n- 用户名: testuser\n- 年龄: 25岁'),
  isAIConfigured: jest.fn(() => false),
}));

import aiRoutes from '../routes/aiRoutes';
import { createChatCompletion, isAIConfigured } from '../services/aiService';

const mockedCreateChatCompletion = createChatCompletion as jest.MockedFunction<typeof createChatCompletion>;
const mockedIsAIConfigured = isAIConfigured as jest.MockedFunction<typeof isAIConfigured>;

const app = express();
app.use(express.json());
app.use('/api/ai', aiRoutes);

describe('AI 健身助手 API', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockedIsAIConfigured.mockReturnValue(false);
  });

  describe('GET /api/ai/status', () => {
    it('应返回 AI 服务状态（未配置）', async () => {
      mockedIsAIConfigured.mockReturnValue(false);
      const res = await request(app).get('/api/ai/status');
      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.configured).toBe(false);
    });

    it('应返回 AI 服务状态（已配置）', async () => {
      mockedIsAIConfigured.mockReturnValue(true);
      const res = await request(app).get('/api/ai/status');
      expect(res.status).toBe(200);
      expect(res.body.data.configured).toBe(true);
    });
  });

  describe('POST /api/ai/chat', () => {
    it('未认证应返回 401', async () => {
      const res = await request(app)
        .post('/api/ai/chat')
        .send({ message: '你好' });
      expect(res.status).toBe(401);
    });

    it('AI 未配置时应返回降级预设建议', async () => {
      mockedIsAIConfigured.mockReturnValue(false);
      const res = await request(app)
        .post('/api/ai/chat')
        .set('Authorization', 'Bearer valid-token')
        .send({ message: '请给我训练建议' });
      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.is_fallback).toBe(true);
      expect(res.body.data.reply).toBeDefined();
    });

    it('消息为空应返回 400', async () => {
      const res = await request(app)
        .post('/api/ai/chat')
        .set('Authorization', 'Bearer valid-token')
        .send({ message: '' });
      expect(res.status).toBe(400);
    });

    it('消息超过 500 字应返回 400', async () => {
      const res = await request(app)
        .post('/api/ai/chat')
        .set('Authorization', 'Bearer valid-token')
        .send({ message: 'a'.repeat(501) });
      expect(res.status).toBe(400);
    });
  });

  describe('POST /api/ai/training-advice', () => {
    it('未认证应返回 401', async () => {
      const res = await request(app)
        .post('/api/ai/training-advice')
        .send({});
      expect(res.status).toBe(401);
    });

    it('AI 未配置时应返回训练降级建议', async () => {
      mockedIsAIConfigured.mockReturnValue(false);
      const res = await request(app)
        .post('/api/ai/training-advice')
        .set('Authorization', 'Bearer valid-token')
        .send({});
      expect(res.status).toBe(200);
      expect(res.body.data.is_fallback).toBe(true);
      expect(res.body.data.reply).toContain('训练');
    });
  });

  describe('POST /api/ai/nutrition-advice', () => {
    it('AI 未配置时应返回营养降级建议', async () => {
      mockedIsAIConfigured.mockReturnValue(false);
      const res = await request(app)
        .post('/api/ai/nutrition-advice')
        .set('Authorization', 'Bearer valid-token')
        .send({});
      expect(res.status).toBe(200);
      expect(res.body.data.is_fallback).toBe(true);
      expect(res.body.data.reply).toContain('营养');
    });
  });

  describe('GET /api/ai/plan-suggestion', () => {
    it('未认证应返回 401', async () => {
      const res = await request(app).get('/api/ai/plan-suggestion');
      expect(res.status).toBe(401);
    });

    it('AI 未配置时应返回计划降级建议', async () => {
      mockedIsAIConfigured.mockReturnValue(false);
      const res = await request(app)
        .get('/api/ai/plan-suggestion')
        .set('Authorization', 'Bearer valid-token');
      expect(res.status).toBe(200);
      expect(res.body.data.is_fallback).toBe(true);
      expect(res.body.data.reply).toContain('计划');
    });
  });

  describe('限流中间件', () => {
    it('超过每日限制应返回 429', async () => {
      mockedIsAIConfigured.mockReturnValue(false);
      // 发送 21 次请求，第 21 次应被限流
      const promises = [];
      for (let i = 0; i < 20; i++) {
        promises.push(
          request(app)
            .post('/api/ai/chat')
            .set('Authorization', 'Bearer valid-token')
            .send({ message: `测试消息 ${i}` })
        );
      }
      await Promise.all(promises);

      const res = await request(app)
        .post('/api/ai/chat')
        .set('Authorization', 'Bearer valid-token')
        .send({ message: '超出限制' });
      expect(res.status).toBe(429);
      expect(res.body.error).toContain('次数已用完');
    });
  });
});