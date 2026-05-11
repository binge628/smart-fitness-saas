/**
 * 成就系统前端组件测试
 * 使用 vitest + @testing-library/react 测试 AchievementsPage 组件
 */
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import React from 'react';

// Mock antd message
vi.mock('antd', async () => {
  const actual = await vi.importActual('antd');
  return {
    ...actual,
    message: {
      success: vi.fn(),
      error: vi.fn(),
      info: vi.fn(),
      warning: vi.fn(),
    },
  };
});

// Mock achievementService
const mockGetAchievements = vi.fn();
const mockGetStats = vi.fn();
const mockCheckAchievements = vi.fn();

vi.mock('../services/api', () => ({
  achievementService: {
    getAchievements: () => mockGetAchievements(),
    getStats: () => mockGetStats(),
    checkAchievements: () => mockCheckAchievements(),
  },
}));

// Mock auth store
vi.mock('../stores/authStore', () => ({
  useAuthStore: () => ({
    user: { id: '1', username: 'testuser', role: 'user' },
    token: 'mock-token',
    isAuthenticated: true,
  }),
}));

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
    unlocked: true,
    unlocked_at: '2026-05-01',
    current_progress: 1,
    progress_percentage: 100,
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
    unlocked: false,
    unlocked_at: null,
    current_progress: 1,
    progress_percentage: 33,
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
    unlocked: false,
    unlocked_at: null,
    current_progress: 5,
    progress_percentage: 50,
  },
];

const mockUserStats = {
  totalWorkouts: 5,
  totalDuration: 180,
  totalCalories: 500,
  currentStreak: 1,
};

describe('AchievementsPage 组件测试', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // 默认 mock 返回值
    mockGetAchievements.mockResolvedValue({
      data: mockAchievements,
      user_stats: mockUserStats,
    });
    mockGetStats.mockResolvedValue({
      data: { total: 3, unlocked: 1, locked: 2 },
    });
    mockCheckAchievements.mockResolvedValue({
      newUnlocks: [],
      message: '暂无新成就',
    });
  });

  // ==================== 页面渲染测试 ====================

  describe('T11: 页面加载', () => {
    it('应渲染成就勋章标题', async () => {
      const AchievementsPage = (await import('../pages/AchievementsPage')).default;
      render(<AchievementsPage />);

      await waitFor(() => {
        expect(screen.getByText('成就勋章')).toBeTruthy();
      });
    });

    it('应显示刷新成就按钮', async () => {
      const AchievementsPage = (await import('../pages/AchievementsPage')).default;
      render(<AchievementsPage />);

      await waitFor(() => {
        expect(screen.getByText('刷新成就')).toBeTruthy();
      });
    });

    it('加载完成后应显示成就数据', async () => {
      const AchievementsPage = (await import('../pages/AchievementsPage')).default;
      render(<AchievementsPage />);

      await waitFor(() => {
        // 已解锁成就名称
        expect(screen.getByText('初试牛刀')).toBeTruthy();
        // 未解锁成就名称
        expect(screen.getByText('三天打鱼')).toBeTruthy();
        expect(screen.getByText('小试身手')).toBeTruthy();
      });
    });

    it('应显示统计信息', async () => {
      const AchievementsPage = (await import('../pages/AchievementsPage')).default;
      render(<AchievementsPage />);

      await waitFor(() => {
        expect(screen.getByText('已解锁')).toBeTruthy();
        expect(screen.getByText('未解锁')).toBeTruthy();
        expect(screen.getByText('完成进度')).toBeTruthy();
      });
    });
  });

  describe('T12: 空数据状态', () => {
    it('无成就数据时显示空状态', async () => {
      mockGetAchievements.mockResolvedValue({ data: [], user_stats: null });
      mockGetStats.mockResolvedValue({ data: { total: 0, unlocked: 0, locked: 0 } });

      const AchievementsPage = (await import('../pages/AchievementsPage')).default;
      render(<AchievementsPage />);

      await waitFor(() => {
        expect(screen.getByText('暂无成就数据')).toBeTruthy();
      });
    });
  });

  // ==================== 交互逻辑测试 ====================

  describe('T13: 刷新成就交互', () => {
    it('点击刷新按钮应调用 checkAchievements API', async () => {
      const AchievementsPage = (await import('../pages/AchievementsPage')).default;
      render(<AchievementsPage />);

      await waitFor(() => {
        expect(screen.getByText('刷新成就')).toBeTruthy();
      });

      const refreshBtn = screen.getByText('刷新成就');
      fireEvent.click(refreshBtn);

      await waitFor(() => {
        expect(mockCheckAchievements).toHaveBeenCalledTimes(1);
      });
    });

    it('解锁新成就时应显示成功提示', async () => {
      const { message } = await import('antd');
      mockCheckAchievements.mockResolvedValue({
        newUnlocks: ['三天打鱼', '小试身手'],
        message: '解锁了 2 个新成就！',
      });

      const AchievementsPage = (await import('../pages/AchievementsPage')).default;
      render(<AchievementsPage />);

      await waitFor(() => {
        expect(screen.getByText('刷新成就')).toBeTruthy();
      });

      fireEvent.click(screen.getByText('刷新成就'));

      await waitFor(() => {
        expect(message.success).toHaveBeenCalledWith(
          expect.stringContaining('三天打鱼'),
          3
        );
      });
    });

    it('无新成就时应显示提示信息', async () => {
      const { message } = await import('antd');
      mockCheckAchievements.mockResolvedValue({
        newUnlocks: [],
        message: '暂无新成就',
      });

      const AchievementsPage = (await import('../pages/AchievementsPage')).default;
      render(<AchievementsPage />);

      await waitFor(() => {
        expect(screen.getByText('刷新成就')).toBeTruthy();
      });

      fireEvent.click(screen.getByText('刷新成就'));

      await waitFor(() => {
        expect(message.info).toHaveBeenCalledWith('暂无新成就，继续加油！');
      });
    });
  });

  // ==================== 成就分类展示测试 ====================

  describe('T14: 成就分类展示', () => {
    it('应显示分类标签', async () => {
      const AchievementsPage = (await import('../pages/AchievementsPage')).default;
      render(<AchievementsPage />);

      await waitFor(() => {
        expect(screen.getByText('里程碑')).toBeTruthy();
        expect(screen.getByText('连续打卡')).toBeTruthy();
        expect(screen.getByText('累计成就')).toBeTruthy();
      });
    });

    it('已解锁成就应显示解锁日期', async () => {
      const AchievementsPage = (await import('../pages/AchievementsPage')).default;
      render(<AchievementsPage />);

      await waitFor(() => {
        // 初试牛刀已解锁，应显示日期
        expect(screen.getByText('2026/5/1')).toBeTruthy();
      });
    });

    it('未解锁成就应显示进度信息', async () => {
      const AchievementsPage = (await import('../pages/AchievementsPage')).default;
      render(<AchievementsPage />);

      await waitFor(() => {
        // 三天打鱼：current_progress=1, requirement_value=3
        expect(screen.getByText('1/3')).toBeTruthy();
        // 小试身手：current_progress=5, requirement_value=10
        expect(screen.getByText('5/10')).toBeTruthy();
      });
    });
  });

  // ==================== API 服务测试 ====================

  describe('T15: achievementService API 端点', () => {
    it('getAchievements 应调用 GET /achievements', async () => {
      const { achievementService } = await import('../services/api');
      await achievementService.getAchievements();
      expect(mockGetAchievements).toHaveBeenCalled();
    });

    it('getStats 应调用 GET /achievements/stats', async () => {
      const { achievementService } = await import('../services/api');
      await achievementService.getStats();
      expect(mockGetStats).toHaveBeenCalled();
    });

    it('checkAchievements 应调用 POST /achievements/check', async () => {
      const { achievementService } = await import('../services/api');
      await achievementService.checkAchievements();
      expect(mockCheckAchievements).toHaveBeenCalled();
    });
  });

  // ==================== 用户统计展示测试 ====================

  describe('T16: 用户统计展示', () => {
    it('应显示连续训练天数', async () => {
      const AchievementsPage = (await import('../pages/AchievementsPage')).default;
      render(<AchievementsPage />);

      await waitFor(() => {
        expect(screen.getByText(/连续 1 天/)).toBeTruthy();
      });
    });

    it('应显示累计训练次数', async () => {
      const AchievementsPage = (await import('../pages/AchievementsPage')).default;
      render(<AchievementsPage />);

      await waitFor(() => {
        expect(screen.getByText(/累计 5 次训练/)).toBeTruthy();
      });
    });

    it('应显示累计训练时长', async () => {
      const AchievementsPage = (await import('../pages/AchievementsPage')).default;
      render(<AchievementsPage />);

      await waitFor(() => {
        // 180 分钟 = 3 小时
        expect(screen.getByText(/累计 3 小时/)).toBeTruthy();
      });
    });
  });

  // ==================== 错误处理测试 ====================

  describe('T17: API 错误处理', () => {
    it('加载成就失败应显示错误提示', async () => {
      const { message } = await import('antd');
      mockGetAchievements.mockRejectedValue(new Error('Network error'));

      const AchievementsPage = (await import('../pages/AchievementsPage')).default;
      render(<AchievementsPage />);

      await waitFor(() => {
        expect(message.error).toHaveBeenCalledWith('加载成就数据失败');
      });
    });

    it('检查成就失败应显示错误提示', async () => {
      const { message } = await import('antd');
      mockCheckAchievements.mockRejectedValue(new Error('Network error'));

      const AchievementsPage = (await import('../pages/AchievementsPage')).default;
      render(<AchievementsPage />);

      await waitFor(() => {
        expect(screen.getByText('刷新成就')).toBeTruthy();
      });

      fireEvent.click(screen.getByText('刷新成就'));

      await waitFor(() => {
        expect(message.error).toHaveBeenCalledWith('检查成就失败');
      });
    });
  });
});