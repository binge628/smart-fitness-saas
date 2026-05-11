import { Request, Response } from 'express';
import pool from '../config/database';

/**
 * 计算用户连续训练天数
 */
async function calculateStreak(userId: string): Promise<number> {
  const result = await pool.query(
    `SELECT DISTINCT workout_date FROM workout_logs WHERE user_id = $1 ORDER BY workout_date DESC`,
    [userId]
  );

  if (result.rows.length === 0) return 0;

  const dates = result.rows.map((r: any) => {
    const d = new Date(r.workout_date);
    d.setHours(0, 0, 0, 0);
    return d.getTime();
  });

  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const todayTime = today.getTime();
  const yesterdayTime = todayTime - 86400000;

  // 从今天或昨天开始算连续天数
  let startTime: number;
  if (dates.includes(todayTime)) {
    startTime = todayTime;
  } else if (dates.includes(yesterdayTime)) {
    startTime = yesterdayTime;
  } else {
    return 0;
  }

  let streak = 0;
  let checkTime = startTime;
  while (dates.includes(checkTime)) {
    streak++;
    checkTime -= 86400000;
  }

  return streak;
}

/**
 * 获取用户训练统计数据
 */
async function getUserStats(userId: string) {
  const statsResult = await pool.query(
    `SELECT
      COUNT(*) as total_workouts,
      COALESCE(SUM(duration_minutes), 0) as total_duration,
      COALESCE(SUM(calories_burned), 0) as total_calories
     FROM workout_logs
     WHERE user_id = $1`,
    [userId]
  );

  const stats = statsResult.rows[0];
  const totalWorkouts = parseInt(stats.total_workouts) || 0;
  const totalDuration = parseInt(stats.total_duration) || 0;
  const totalCalories = parseInt(stats.total_calories) || 0;
  const currentStreak = await calculateStreak(userId);

  return { totalWorkouts, totalDuration, totalCalories, currentStreak };
}

/**
 * 根据成就类型获取当前进度值
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

/**
 * 检查并解锁新成就（可被其他模块调用）
 */
export async function checkAndUnlockAchievements(userId: string): Promise<string[]> {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    const userStats = await getUserStats(userId);

    // 获取用户已解锁的成就
    const unlockedResult = await client.query(
      'SELECT achievement_id FROM user_achievements WHERE user_id = $1',
      [userId]
    );
    const unlockedIds = new Set(unlockedResult.rows.map((r: any) => r.achievement_id));

    // 获取所有成就
    const achievementsResult = await client.query('SELECT * FROM achievements');
    const achievements = achievementsResult.rows;

    const newUnlocks: string[] = [];
    for (const achievement of achievements) {
      if (unlockedIds.has(achievement.id)) continue;

      const currentProgress = getProgressValue(achievement.requirement_type, userStats);
      if (currentProgress >= achievement.requirement_value) {
        await client.query(
          'INSERT INTO user_achievements (user_id, achievement_id) VALUES ($1, $2)',
          [userId, achievement.id]
        );
        newUnlocks.push(achievement.name);
      }
    }

    await client.query('COMMIT');
    return newUnlocks;
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('检查成就失败:', error);
    return [];
  } finally {
    client.release();
  }
}

/**
 * 获取用户成就列表（含解锁状态和进度）
 * GET /api/achievements
 */
export const getAchievements = async (req: Request, res: Response) => {
  try {
    const userId = req.user!.userId;

    // 获取用户统计
    const userStats = await getUserStats(userId);

    // 获取所有成就和用户的解锁状态
    const result = await pool.query(
      `SELECT a.*, ua.id as user_achievement_id, ua.unlocked_at
       FROM achievements a
       LEFT JOIN user_achievements ua ON a.id = ua.achievement_id AND ua.user_id = $1
       ORDER BY a.category, a.requirement_value`,
      [userId]
    );

    const achievements = result.rows.map((row: any) => {
      const unlocked = !!row.user_achievement_id;
      const currentProgress = unlocked
        ? row.requirement_value
        : getProgressValue(row.requirement_type, userStats);
      const progressPercentage = Math.min(
        Math.round((currentProgress / row.requirement_value) * 100),
        100
      );

      return {
        id: row.id,
        code: row.code,
        name: row.name,
        description: row.description,
        icon: row.icon,
        category: row.category,
        requirement_type: row.requirement_type,
        requirement_value: row.requirement_value,
        unlocked,
        unlocked_at: row.unlocked_at,
        current_progress: currentProgress,
        progress_percentage: progressPercentage,
      };
    });

    const total = achievements.length;
    const unlocked = achievements.filter((a: any) => a.unlocked).length;

    res.json({
      success: true,
      data: achievements,
      stats: { total, unlocked, locked: total - unlocked },
      user_stats: userStats,
    });
  } catch (error) {
    console.error('获取成就列表失败:', error);
    res.status(500).json({
      success: false,
      error: '获取成就列表失败',
    });
  }
};

/**
 * 检查并解锁新成就
 * POST /api/achievements/check
 */
export const checkAchievements = async (req: Request, res: Response) => {
  try {
    const userId = req.user!.userId;
    const newUnlocks = await checkAndUnlockAchievements(userId);
    const userStats = await getUserStats(userId);

    res.json({
      success: true,
      message: newUnlocks.length > 0 ? `解锁了 ${newUnlocks.length} 个新成就！` : '暂无新成就',
      newUnlocks,
      stats: {
        total_workouts: userStats.totalWorkouts,
        total_duration_hours: Math.floor(userStats.totalDuration / 60),
        total_calories: userStats.totalCalories,
        current_streak: userStats.currentStreak,
      },
    });
  } catch (error) {
    console.error('检查成就失败:', error);
    res.status(500).json({
      success: false,
      error: '检查成就失败',
    });
  }
};

/**
 * 获取用户成就统计
 * GET /api/achievements/stats
 */
export const getAchievementStats = async (req: Request, res: Response) => {
  try {
    const userId = req.user!.userId;

    const result = await pool.query(
      `SELECT
        (SELECT COUNT(*) FROM achievements) as total,
        (SELECT COUNT(*) FROM user_achievements WHERE user_id = $1) as unlocked`,
      [userId]
    );

    const row = result.rows[0];
    res.json({
      success: true,
      data: {
        total: parseInt(row.total) || 0,
        unlocked: parseInt(row.unlocked) || 0,
        locked: (parseInt(row.total) || 0) - (parseInt(row.unlocked) || 0),
      },
    });
  } catch (error) {
    console.error('获取成就统计失败:', error);
    res.status(500).json({
      success: false,
      error: '获取成就统计失败',
    });
  }
};