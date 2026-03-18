import express from 'express';
import {
  createHealthData,
  getHealthData,
  getHealthDataStats,
  getHealthDataByDate,
  updateHealthData,
  deleteHealthData,
} from '../controllers/healthDataController';
import { authMiddleware } from '../middleware/authMiddleware';

const router = express.Router();

// 所有路由都需要认证，只能访问自己的健康数据
router.use(authMiddleware);

/**
 * 健康数据路由 - 权限说明：
 * - 普通用户：只能创建/查看/修改/删除自己的健康数据
 * - 教练/健身房管理员：不能访问健康数据（仅用于个人）
 * - 管理员：可以查看所有用户的健康数据
 */

// 获取健康数据列表（支持日期筛选）
// 参数: start_date, end_date, limit, offset
// 权限: 所有认证用户（仅返回自己的数据）
router.get('/', getHealthData);

// 获取健康数据统计（平均值、最大最小值等）
// 参数: start_date, end_date
// 权限: 所有认证用户
router.get('/stats', getHealthDataStats);

// 获取指定日期的健康数据
// 权限: 所有认证用户
router.get('/date/:date', getHealthDataByDate);

// 创建健康数据记录
// 权限: 所有认证用户
router.post('/', createHealthData);

// 更新健康数据 /api/health/:id
// 权限: 仅创建者（用户自己）和管理员
router.put('/:id', updateHealthData);

// 删除健康数据 /api/health/:id
// 权限: 仅创建者（用户自己）和管理员
router.delete('/:id', deleteHealthData);

export default router;