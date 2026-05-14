import { Request, Response, NextFunction } from 'express';

const DAILY_LIMIT = 20;

interface RateLimitEntry {
  count: number;
  date: string;
}

const rateLimitMap = new Map<string, RateLimitEntry>();

const getToday = (): string => new Date().toISOString().split('T')[0];

export const aiRateLimit = (req: Request, res: Response, next: NextFunction): void => {
  const userId = req.user?.userId;
  if (!userId) {
    res.status(401).json({ success: false, error: '未认证' });
    return;
  }

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