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

// 所有路由都需要认证
router.use(authMiddleware);

/**
 * 健身计划路由
 */

// 获取计划列表（支持筛选）
// 参数: is_template, difficulty, creator_id, limit, offset
router.get('/', getPlans);

// 获取我的计划
router.get('/my', getMyPlans);

// 创建计划
router.post('/', createPlan);

// 获取计划详情 /api/plans/:id
router.get('/:id', getPlanById);

// 更新计划 /api/plans/:id
router.put('/:id', updatePlan);

// 删除计划 /api/plans/:id
router.delete('/:id', deletePlan);

export default router;