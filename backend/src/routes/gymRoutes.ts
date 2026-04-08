import express from 'express';
import {
  createGym,
  getGyms,
  getGymById,
  updateGym,
  deleteGym,
  getMyGyms,
  addGymMember,
  getGymMembers,
  updateGymMember,
  removeGymMember,
  getMyMemberships,
} from '../controllers/gymController';
import { authMiddleware, requireRole } from '../middleware/authMiddleware';
import { validateBody, validateParams } from '../utils/validation';
import { createGymSchema, updateGymSchema, addMemberSchema, updateMemberSchema, uuidParamSchema } from '../schemas';

const router = express.Router();

/**
 * 健身房管理路由
 */

// 所有路由都需要认证
router.use(authMiddleware);

// 获取健身房列表（支持筛选）
// 参数: owner_id, status, limit, offset
// 权限: 所有认证用户可访问
router.get('/', getGyms);

// 获取我的健身房列表
// 权限: 所有认证用户可访问
router.get('/my', getMyGyms);

// 获取我的会员资格
// 权限: 所有认证用户可访问
router.get('/memberships/me', getMyMemberships);

// 创建健身房
// 权限: 健身房管理员、管理员可创建
router.post('/', requireRole('admin', 'gym_admin'), validateBody(createGymSchema), createGym);

// 健身房详情 /api/gyms/:id
// 权限: 所有认证用户可访问
router.get('/:id', validateParams(uuidParamSchema), getGymById);

// 更新健身房 /api/gyms/:id
// 权限: 健身房所有者、管理员可更新
router.put('/:id', validateParams(uuidParamSchema), validateBody(updateGymSchema), updateGym);

// 删除健身房 /api/gyms/:id
// 权限: 健身房所有者、管理员可删除
router.delete('/:id', validateParams(uuidParamSchema), deleteGym);

/**
 * 健身房会员管理路由 /api/gyms/:id/members
 */

// 获取健身房会员列表
// 权限: 健身房管理员、管理员可查看
router.get('/:id/members', validateParams(uuidParamSchema), getGymMembers);

// 添加会员到健身房
// 权限: 健身房管理员、管理员可操作
router.post('/:id/members', validateParams(uuidParamSchema), validateBody(addMemberSchema), addGymMember);

// 更新会员信息 /api/gyms/:gymId/members/:userId
// 权限: 健身房管理员、管理员可操作
router.put('/:gymId/members/:userId', validateBody(updateMemberSchema), updateGymMember);

// 移除会员 /api/gyms/:gymId/members/:userId
// 权限: 健身房管理员、管理员可操作
router.delete('/:gymId/members/:userId', removeGymMember);

export default router;