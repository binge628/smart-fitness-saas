import express from 'express';
import {
  getPlans,
  getMySubscription,
  subscribe,
  cancelSubscription,
  getAllSubscriptions,
} from '../controllers/subscriptionController';
import { authMiddleware, requireRole } from '../middleware/authMiddleware';
import { validateBody } from '../utils/validation';
import { subscribeSchema } from '../schemas';

const router = express.Router();

// 获取套餐价格列表（公开，无需认证）
router.get('/plans', getPlans);

// 获取当前用户订阅（需认证）
router.get('/my', authMiddleware, getMySubscription);

// 订阅/续费（需认证）
router.post('/subscribe', authMiddleware, validateBody(subscribeSchema), subscribe);

// 取消订阅（需认证）
router.put('/cancel', authMiddleware, cancelSubscription);

// 管理员查看所有订阅（需管理员权限）
router.get('/', authMiddleware, requireRole('admin'), getAllSubscriptions);

export default router;