import express from 'express';
import {
  getExercises,
  getExerciseById,
  createExercise,
} from '../controllers/exerciseController';
import { authMiddleware } from '../middleware/authMiddleware';
import { validateBody } from '../utils/validation';
import { createExerciseSchema } from '../schemas';

const router = express.Router();

// 动作列表（公开，无需认证）
router.get('/', getExercises);

// 动作详情（公开）
router.get('/:id', getExerciseById);

// 创建自定义动作（需认证）
router.post('/', authMiddleware, validateBody(createExerciseSchema), createExercise);

export default router;