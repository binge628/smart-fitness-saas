import express from 'express';
import { registerUser, loginUser, getCurrentUser } from '../controllers/userController';
import { authMiddleware } from '../middleware/authMiddleware';

const router = express.Router();

/**
 * 认证路由
 */

// 注册
router.post('/register', registerUser);

// 登录
router.post('/login', loginUser);

// 获取当前用户 (需要认证)
router.get('/me', authMiddleware, getCurrentUser);

export default router;