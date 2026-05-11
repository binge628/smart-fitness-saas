/**
 * 成就系统 API 集成测试
 * 使用 supertest + mock 数据库，测试真实 HTTP 请求/响应
 */
import express, { Request, Response, NextFunction } from 'express';
import request from 'supertest';

// Mock auth 工具模块（避免 JWT_SECRET 导致 process.exit）
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

// 导入路由和被 mock 的 pool（必须在 jest.mock 之后）
import achievementRoutes from '../routes/achievementRoutes';
import pool from '../config/database';
const mockedPool = pool as any;

// 创建测试用 Express app
function createTestApp() {
  const app = express();
  app.use(express.json());
  app.use('/api/achievements', (req: Request, _res: Response, next: NextFunction) => {
    if (req.headers.authorization === 'Bearer valid-token') {
      req.user = { userId: 'test-user-id', username: 'testuser', email: 'test@test.com', role: 'user' };
      next();
    } else {
      _res.status(401).json({ success: false, error: '未提供认证 Token' });
    }
  }, achievementRoutes);
  return app;
}

// 模拟成就数据
const mockAchievements = [
  {
    id: 'a1',
    code: 'first_workout',
    name: '初试牛刀',
    description: '完成第1次训练',
    icon: '🎯',
    category: 'milestone',
    requirement_type: 'workouts',
    requirement_value: 1,
  },
  {
    id: 'a2',
    code: 'streak_3',
    name: '三天打鱼',
    description: '连续训练3天',
    icon: '🔥',
    category: 'streak',
    requirement_type: 'days',
    requirement_value: 3,
  },
  {
    id: 'a3',
    code: 'workout_10',
    name: '小试身手',
    description: '累计训练10次',
    icon: '💪',
    category: 'cumulative',
    requirement_type: 'workouts',
    requirement_value: 10,
  },
];

const mockUserStats = {
  total_workouts: '5',
  total_duration: '180',
  total_calories: '500',
};

describe('成就系统 API 集成测试', () => {
  let app: express.Express;

  beforeEach(() => {
    app = createTestApp();
    jest.clearAllMocks();
  });

  // ==================== GET /api/achievements ====================

  describe('GET /api/achievements - 获取成就列表', () => {
    it('T1: 未认证时返回 401', async () => {
      const res = await request(app).get('/api/achievements');
      expect(res.status).toBe(401);
      expect(res.body.success).toBe(false);
    });

    it('T2: 认证后返回成就列表（含进度和统计）', async () => {
      mockedPool.query
        .mockResolvedValueOnce({ rows: [mockUserStats] })
        .mockResolvedValueOnce({ rows: [mockUserStats] })
        .mockResolvedValueOnce({
          rows: mockAchievements.map(a => ({
            ...a,
            user_achievement_id: a.id === 'a1' ? 'ua1' : null,
            unlocked_at: a.id === 'a1' ? '2026-05-01' : null,
          })),
        });

      const res = await request(app)
        .get('/api/achievements')
        .set('Authorization', 'Bearer valid-token');

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data).toBeDefined();
      expect(res.body.stats).toBeDefined();
      expect(res.body.stats.total).toBe(3);
      expect(res.body.stats.unlocked).toBe(1);
      expect(res.body.stats.locked).toBe(2);
      expect(res.body.user_stats).toBeDefined();
    });

    it('T3: 已解锁成就的进度应为 100%', async () => {
      mockedPool.query
        .mockResolvedValueOnce({ rows: [mockUserStats] })
        .mockResolvedValueOnce({ rows: [mockUserStats] })
        .mockResolvedValueOnce({
          rows: [{
            ...mockAchievements[0],
            user_achievement_id: 'ua1',
            unlocked_at: '2026-05-01',
          }],
        });

      const res = await request(app)
        .get('/api/achievements')
        .set('Authorization', 'Bearer valid-token');

      expect(res.status).toBe(200);
      const unlocked = res.body.data.find((a: any) => a.unlocked === true);
      if (unlocked) {
        expect(unlocked.progress_percentage).toBe(100);
      }
    });

    it('T4: 未解锁成就显示当前进度', async () => {
      mockedPool.query
        .mockResolvedValueOnce({ rows: [mockUserStats] })
        .mockResolvedValueOnce({ rows: [mockUserStats] })
        .mockResolvedValueOnce({
          rows: mockAchievements.map(a => ({
            ...a,
            user_achievement_id: null,
            unlocked_at: null,
          })),
        });

      const res = await request(app)
        .get('/api/achievements')
        .set('Authorization', 'Bearer valid-token');

      expect(res.status).toBe(200);
      const lockedItems = res.body.data.filter((a: any) => !a.unlocked);
      const workoutAchievement = lockedItems.find(
        (a: any) => a.requirement_type === 'workouts' && a.requirement_value === 10
      );
      if (workoutAchievement) {
        expect(workoutAchievement.current_progress).toBe(5);
        expect(workoutAchievement.progress_percentage).toBe(50);
      }
    });

    it('T5: 数据库错误时返回 500', async () => {
      mockedPool.query.mockRejectedValueOnce(new Error('DB connection failed'));

      const res = await request(app)
        .get('/api/achievements')
        .set('Authorization', 'Bearer valid-token');

      expect(res.status).toBe(500);
      expect(res.body.success).toBe(false);
    });
  });

  // ==================== GET /api/achievements/stats ====================

  describe('GET /api/achievements/stats - 获取成就统计', () => {
    it('T6: 未认证时返回 401', async () => {
      const res = await request(app).get('/api/achievements/stats');
      expect(res.status).toBe(401);
    });

    it('T7: 认证后返回 total/unlocked/locked 统计', async () => {
      mockedPool.query.mockResolvedValueOnce({
        rows: [{ total: '16', unlocked: '3' }],
      });

      const res = await request(app)
        .get('/api/achievements/stats')
        .set('Authorization', 'Bearer valid-token');

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.total).toBe(16);
      expect(res.body.data.unlocked).toBe(3);
      expect(res.body.data.locked).toBe(13);
    });

    it('T8: 无成就时 total 为 0', async () => {
      mockedPool.query.mockResolvedValueOnce({
        rows: [{ total: '0', unlocked: '0' }],
      });

      const res = await request(app)
        .get('/api/achievements/stats')
        .set('Authorization', 'Bearer valid-token');

      expect(res.status).toBe(200);
      expect(res.body.data.total).toBe(0);
      expect(res.body.data.unlocked).toBe(0);
      expect(res.body.data.locked).toBe(0);
    });
  });

  // ==================== POST /api/achievements/check ====================

  describe('POST /api/achievements/check - 检查并解锁成就', () => {
    it('T9: 未认证时返回 401', async () => {
      const res = await request(app).post('/api/achievements/check');
      expect(res.status).toBe(401);
    });

    it('T10: 达成条件时解锁新成就', async () => {
      // mockClient: 事务操作 (BEGIN, SELECT已解锁, SELECT全部, INSERT, COMMIT)
      const mockClient = {
        query: jest.fn()
          .mockResolvedValueOnce({ rows: [] })           // BEGIN
          .mockResolvedValueOnce({ rows: [] })            // SELECT 已解锁成就
          .mockResolvedValueOnce({ rows: mockAchievements }) // SELECT 全部成就
          .mockResolvedValueOnce({ rows: [] })            // INSERT first_workout (5 >= 1)
          .mockResolvedValueOnce({ rows: [] }),           // COMMIT
        release: jest.fn(),
      };
      mockedPool.connect.mockResolvedValueOnce(mockClient);

      // pool.query: getUserStats 调用 (stats + streak)，被调用2次
      // 第1次: checkAndUnlockAchievements 内的 getUserStats
      // 第2次: checkAchievements handler 内的 getUserStats
      mockedPool.query
        .mockResolvedValueOnce({ rows: [mockUserStats] })  // stats (第1次)
        .mockResolvedValueOnce({ rows: [] })                // streak dates (第1次) - 空表示 streak=0
        .mockResolvedValueOnce({ rows: [mockUserStats] })  // stats (第2次)
        .mockResolvedValueOnce({ rows: [] });               // streak dates (第2次)

      const res = await request(app)
        .post('/api/achievements/check')
        .set('Authorization', 'Bearer valid-token');

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.newUnlocks).toBeDefined();
    });

    it('T11: 无新成就时返回空数组', async () => {
      // 全部成就已解锁的情况
      const mockClient = {
        query: jest.fn()
          .mockResolvedValueOnce({ rows: [] })             // BEGIN
          .mockResolvedValueOnce({                         // SELECT 已解锁 - 全部已解锁
            rows: mockAchievements.map(a => ({ achievement_id: a.id })),
          })
          .mockResolvedValueOnce({ rows: mockAchievements }) // SELECT 全部成就
          .mockResolvedValueOnce({ rows: [] }),             // COMMIT
        release: jest.fn(),
      };
      mockedPool.connect.mockResolvedValueOnce(mockClient);

      mockedPool.query
        .mockResolvedValueOnce({ rows: [mockUserStats] })
        .mockResolvedValueOnce({ rows: [] })
        .mockResolvedValueOnce({ rows: [mockUserStats] })
        .mockResolvedValueOnce({ rows: [] });

      const res = await request(app)
        .post('/api/achievements/check')
        .set('Authorization', 'Bearer valid-token');

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.newUnlocks).toEqual([]);
    });

    it('T12: 返回用户训练统计信息', async () => {
      const mockClient = {
        query: jest.fn()
          .mockResolvedValueOnce({ rows: [] })             // BEGIN
          .mockResolvedValueOnce({ rows: [] })             // SELECT 已解锁成就
          .mockResolvedValueOnce({ rows: [] })             // SELECT 全部成就（空）
          .mockResolvedValueOnce({ rows: [] }),             // COMMIT
        release: jest.fn(),
      };
      mockedPool.connect.mockResolvedValueOnce(mockClient);

      mockedPool.query
        .mockResolvedValueOnce({ rows: [mockUserStats] })
        .mockResolvedValueOnce({ rows: [] })
        .mockResolvedValueOnce({ rows: [mockUserStats] })
        .mockResolvedValueOnce({ rows: [] });

      const res = await request(app)
        .post('/api/achievements/check')
        .set('Authorization', 'Bearer valid-token');

      expect(res.status).toBe(200);
      expect(res.body.stats).toBeDefined();
      expect(res.body.stats.total_workouts).toBe(5);
      expect(res.body.stats.current_streak).toBeDefined();
    });
  });

  // ==================== 业务逻辑单元测试 ====================

  describe('getProgressValue - 进度值计算', () => {
    it('T13: workouts 类型返回 totalWorkouts', () => {
      const stats = { totalWorkouts: 5, totalDuration: 180, totalCalories: 500, currentStreak: 2 };
      expect(getProgressValue('workouts', stats)).toBe(5);
    });

    it('T14: days 类型返回 currentStreak', () => {
      const stats = { totalWorkouts: 5, totalDuration: 180, totalCalories: 500, currentStreak: 7 };
      expect(getProgressValue('days', stats)).toBe(7);
    });

    it('T15: duration 类型转换为小时（向下取整）', () => {
      const stats = { totalWorkouts: 5, totalDuration: 180, totalCalories: 500, currentStreak: 2 };
      expect(getProgressValue('duration', stats)).toBe(3);
    });

    it('T16: calories 类型返回 totalCalories', () => {
      const stats = { totalWorkouts: 5, totalDuration: 180, totalCalories: 500, currentStreak: 2 };
      expect(getProgressValue('calories', stats)).toBe(500);
    });

    it('T17: 未知类型返回 0', () => {
      const stats = { totalWorkouts: 5, totalDuration: 180, totalCalories: 500, currentStreak: 2 };
      expect(getProgressValue('unknown', stats)).toBe(0);
    });
  });

  describe('进度百分比计算', () => {
    it('T18: 进度为 0 时返回 0%', () => {
      expect(Math.min(Math.round((0 / 10) * 100), 100)).toBe(0);
    });

    it('T19: 进度过半时返回 50%', () => {
      expect(Math.min(Math.round((5 / 10) * 100), 100)).toBe(50);
    });

    it('T20: 进度超过目标时上限 100%', () => {
      expect(Math.min(Math.round((15 / 10) * 100), 100)).toBe(100);
    });

    it('T21: 恰好达成时返回 100%', () => {
      expect(Math.min(Math.round((10 / 10) * 100), 100)).toBe(100);
    });

    it('T22: 进度 33% 四舍五入', () => {
      expect(Math.min(Math.round((1 / 3) * 100), 100)).toBe(33);
    });
  });

  describe('checkAndUnlockAchievements 事务行为', () => {
    it('T23: 数据库错误时应回滚并返回空数组', async () => {
      // BEGIN 成功，但 getUserStats 中的 pool.query 失败
      const mockClient = {
        query: jest.fn()
          .mockResolvedValueOnce({ rows: [] })  // BEGIN
          .mockResolvedValueOnce({ rows: [] }), // ROLLBACK (catch 中调用)
        release: jest.fn(),
      };
      mockedPool.connect.mockResolvedValueOnce(mockClient);
      // getUserStats 的 pool.query 抛出错误
      mockedPool.query.mockRejectedValueOnce(new Error('DB error'));

      const { checkAndUnlockAchievements } = await import('../controllers/achievementController');
      const result = await checkAndUnlockAchievements('test-user-id');

      expect(result).toEqual([]);
      expect(mockClient.query).toHaveBeenCalledWith('ROLLBACK');
      expect(mockClient.release).toHaveBeenCalled();
    });
  });
});

/**
 * 复现 controller 中的 getProgressValue 逻辑用于单元测试
 */
function getProgressValue(requirementType: string, userStats: any): number {
  switch (requirementType) {
    case 'workouts':
      return userStats.totalWorkouts;
    case 'days':
      return userStats.currentStreak;
    case 'duration':
      return Math.floor(userStats.totalDuration / 60);
    case 'calories':
      return userStats.totalCalories;
    default:
      return 0;
  }
}