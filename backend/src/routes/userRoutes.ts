import express from 'express';
import {
  getUsers,
  getUserById,
  updateCurrentUser,
  changePassword,
  updateUserRole,
  updateUserStatus,
  uploadAvatar,
} from '../controllers/userController';
import { authMiddleware, requireRole } from '../middleware/authMiddleware';
import { avatarUpload } from '../middleware/upload';

const router = express.Router();

// 用户路由（所有路由都需要认证）
router.use(authMiddleware);

// 获取所有用户 (仅管理员可访问)
router.get('/', requireRole('admin'), getUsers);

// 上传头像
// 权限: 所有认证用户可上传自己的头像
router.post('/me/avatar', avatarUpload.single('avatar'), uploadAvatar);

// 更新当前用户信息
// 权限: 所有认证用户可更新自己的信息
router.put('/me', updateCurrentUser);

// 修改当前用户密码
// 权限: 所有认证用户可修改自己的密码
router.put('/me/password', changePassword);

// 获取指定用户信息
// 权限: 管理员可查看任意用户，其他用户只能查看自己
router.get('/:id', getUserById);

// 更新用户角色（仅管理员）
// 权限: 仅管理员可操作
router.put('/:id/role', requireRole('admin'), updateUserRole);

// 更新用户状态（仅管理员）
// 权限: 仅管理员可操作
router.put('/:id/status', requireRole('admin'), updateUserStatus);

export default router;