import express from 'express';
import { registerUser, loginUser, getCurrentUser, updateCurrentUser, changePassword } from '../controllers/userController';
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

// 更新当前用户信息 (需要认证)
router.put('/me', authMiddleware, updateCurrentUser);

// 修改当前用户密码 (需要认证)
router.put('/me/password', authMiddleware, changePassword);

export default router;