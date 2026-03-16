import express from 'express';
import { getUsers, getUserById } from '../controllers/userController';
import { authMiddleware, requireRole } from '../middleware/authMiddleware';

const router = express.Router();

// 用户路由（所有路由都需要认证）
router.use(authMiddleware);

// 获取所有用户 (仅管理员可访问)
router.get('/', requireRole('admin'), getUsers);

// 获取指定用户信息
router.get('/:id', getUserById);

export default router;