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

// 所有路由都需要认证
router.use(authMiddleware);

/**
 * 训练日志路由
 */

// 获取训练日志列表（支持筛选）
// 参数: plan_id, start_date, end_date, limit, offset
router.get('/', getWorkouts);

// 获取训练日志统计（总次数、总时长、总卡路里等）
// 参数: start_date, end_date
router.get('/stats', getWorkoutStats);

// 创建训练日志
router.post('/', createWorkout);

// 获取训练日志详情 /api/workouts/:id
router.get('/:id', getWorkoutById);

// 更新训练日志 /api/workouts/:id
router.put('/:id', updateWorkout);

// 删除训练日志 /api/workouts/:id
router.delete('/:id', deleteWorkout);

export default router;