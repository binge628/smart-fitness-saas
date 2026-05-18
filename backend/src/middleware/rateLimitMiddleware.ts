import { Request, Response, NextFunction } from 'express';

const DAILY_LIMIT = 20;

interface RateLimitEntry {
  count: number;
  date: string;
}

const rateLimitMap = new Map<string, RateLimitEntry>();

const getToday = (): string => new Date().toISOString().split('T')[0];

/** 清理过期的限流条目，防止内存泄漏 */
const cleanupExpiredEntries = (): void => {
  const today = getToday();
  for (const [userId, entry] of rateLimitMap) {
    if (entry.date !== today) {
      rateLimitMap.delete(userId);
    }
  }
};

// 每小时清理一次过期条目
const CLEANUP_INTERVAL = 60 * 60 * 1000;
let cleanupTimer: ReturnType<typeof setInterval> | null = null;

/** 启动定时清理（仅在首次调用时启动） */
const ensureCleanupStarted = (): void => {
  if (!cleanupTimer) {
    cleanupTimer = setInterval(cleanupExpiredEntries, CLEANUP_INTERVAL);
    // 防止定时器阻止进程退出
    if (cleanupTimer && typeof cleanupTimer === 'object' && 'unref' in cleanupTimer) {
      cleanupTimer.unref();
    }
  }
};

export const aiRateLimit = (req: Request, res: Response, next: NextFunction): void => {
  const userId = req.user?.userId;
  if (!userId) {
    res.status(401).json({ success: false, error: '未认证' });
    return;
  }

  ensureCleanupStarted();

  const today = getToday();
  const entry = rateLimitMap.get(userId);

  if (!entry || entry.date !== today) {
    rateLimitMap.set(userId, { count: 1, date: today });
    next();
    return;
  }

  if (entry.count >= DAILY_LIMIT) {
    res.status(429).json({
      success: false,
      error: '今日 AI 对话次数已用完，请明天再来',
    });
    return;
  }

  entry.count++;
  next();
};