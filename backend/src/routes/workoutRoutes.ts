import express from 'express';
import {
  createWorkout,
  getWorkouts,
  getWorkoutById,
  getWorkoutStats,
  updateWorkout,
  deleteWorkout,
} from '../controllers/workoutController';
import { authMiddleware } from '../middleware/authMiddleware';

const router = express.Router();

// 所有路由都需要认证，只能访问自己的训练数据
router.use(authMiddleware);

/**
 * 训练日志路由 - 权限说明：
 * - 普通用户：只能创建/查看/修改/删除自己的训练日志
 * - 教练/健身房管理员：可以查看会员的训练数据（需要扩展）
 * - 管理员：可以查看所有用户的训练数据
 */

// 获取训练日志列表（支持筛选）
// 参数: plan_id, start_date, end_date, limit, offset
// 权限: 所有认证用户（仅返回自己的数据）
router.get('/', getWorkouts);

// 获取训练日志统计（总次数、总时长、总卡路里等）
// 参数: start_date, end_date
// 权限: 所有认证用户
router.get('/stats', getWorkoutStats);

// 创建训练日志
// 权限: 所有认证用户
router.post('/', createWorkout);

// 获取训练日志详情 /api/workouts/:id
// 权限: 所有认证用户
router.get('/:id', getWorkoutById);

// 更新训练日志 /api/workouts/:id
// 权限: 仅创建者和管理员
router.put('/:id', updateWorkout);

// 删除训练日志 /api/workouts/:id
// 权限: 仅创建者和管理员
router.delete('/:id', deleteWorkout);

export default router;