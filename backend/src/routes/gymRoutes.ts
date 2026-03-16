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
import { authMiddleware } from '../middleware/authMiddleware';

const router = express.Router();

// 所有路由都需要认证
router.use(authMiddleware);

/**
 * 健身房管理路由
 */

// 获取健身房列表（支持筛选）
// 参数: owner_id, status, limit, offset
router.get('/', getGyms);

// 获取我的健身房列表
router.get('/my', getMyGyms);

// 获取我的会员资格
router.get('/memberships/me', getMyMemberships);

// 创建健身房
router.post('/', createGym);

// 健身房详情 /api/gyms/:id
router.get('/:id', getGymById);

// 更新健身房 /api/gyms/:id
router.put('/:id', updateGym);

// 删除健身房 /api/gyms/:id
router.delete('/:id', deleteGym);

/**
 * 健身房会员管理路由 /api/gyms/:id/members
 */

// 获取健身房会员列表
router.get('/:id/members', getGymMembers);

// 添加会员到健身房
router.post('/:id/members', addGymMember);

// 更新会员信息 /api/gyms/:gymId/members/:userId
router.put('/:gymId/members/:userId', updateGymMember);

// 移除会员 /api/gyms/:gymId/members/:userId
router.delete('/:gymId/members/:userId', removeGymMember);

export default router;