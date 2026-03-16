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

// 所有路由都需要认证
router.use(authMiddleware);

/**
 * 健康数据路由
 */

// 获取健康数据列表（支持日期筛选）
// 参数: start_date, end_date, limit, offset
router.get('/', getHealthData);

// 获取健康数据统计（平均值、最大最小值等）
// 参数: start_date, end_date
router.get('/stats', getHealthDataStats);

// 获取指定日期的健康数据
router.get('/date/:date', getHealthDataByDate);

// 创建健康数据记录
router.post('/', createHealthData);

// 更新健康数据 /api/health/:id
router.put('/:id', updateHealthData);

// 删除健康数据 /api/health/:id
router.delete('/:id', deleteHealthData);

export default router;