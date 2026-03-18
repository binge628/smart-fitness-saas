import express from 'express';
import {
  createPlan,
  getPlans,
  getPlanById,
  updatePlan,
  deletePlan,
  getMyPlans,
} from '../controllers/planController';
import { authMiddleware } from '../middleware/authMiddleware';

const router = express.Router();

/**
 * 健身计划路由
 */

// 所有路由都需要认证
router.use(authMiddleware);

// 获取计划列表（支持筛选）
// 参数: is_template, difficulty, creator_id, limit, offset
// 权限: 所有认证用户可访问
router.get('/', getPlans);

// 获取我的计划
// 权限: 所有认证用户可访问
router.get('/my', getMyPlans);

// 创建计划
// 权限: 所有认证用户可创建自己的计划，教练可创建模板
router.post('/', createPlan);

// 获取计划详情 /api/plans/:id
// 权限: 所有认证用户可访问
router.get('/:id', getPlanById);

// 更新计划 /api/plans/:id
// 权限: 计划创建者、健身房管理员、管理员可修改
router.put('/:id', updatePlan);

// 删除计划 /api/plans/:id
// 权限: 计划创建者、健身房管理员、管理员可删除
router.delete('/:id', deletePlan);

export default router;