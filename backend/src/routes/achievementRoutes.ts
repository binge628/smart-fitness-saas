import express from 'express';
import {
  getAchievements,
  checkAchievements,
  getAchievementStats,
} from '../controllers/achievementController';
import { authMiddleware } from '../middleware/authMiddleware';

const router = express.Router();

// 获取成就列表（需认证）
router.get('/', authMiddleware, getAchievements);

// 获取成就统计（需认证）
router.get('/stats', authMiddleware, getAchievementStats);

// 检查并解锁新成就（需认证）
router.post('/check', authMiddleware, checkAchievements);

export default router;