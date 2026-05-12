import { Request, Response } from 'express';
import pool from '../config/database';

/**
 * 套餐定价配置
 */
export const SUBSCRIPTION_PLANS = {
  free: {
    name: '免费版',
    price: 0,
    duration_days: 0,
    features: [
      '基础训练记录',
      '健康数据追踪',
      '3 个健身计划',
      '动作库浏览',
    ],
  },
  monthly: {
    name: '月度会员',
    price: 29.9,
    duration_days: 30,
    features: [
      '无限训练记录',
      '健康数据导出',
      '无限健身计划',
      'AI 健身建议',
      '成就勋章系统',
      '优先客服支持',
    ],
  },
  yearly: {
    name: '年度会员',
    price: 299,
    duration_days: 365,
    features: [
      '包含月度会员全部功能',
      '专属训练方案',
      '营养饮食建议',
      '数据高级分析',
      '年省约 17%',
    ],
  },
} as const;

type PlanType = keyof typeof SUBSCRIPTION_PLANS;

/**
 * 获取套餐价格列表
 * GET /api/subscriptions/plans
 */
export const getPlans = async (_req: Request, res: Response) => {
  try {
    const plans = Object.entries(SUBSCRIPTION_PLANS).map(([key, plan]) => ({
      plan_type: key,
      name: plan.name,
      price: plan.price,
      duration_days: plan.duration_days,
      features: plan.features,
    }));

    res.json({
      success: true,
      data: plans,
    });
  } catch (error) {
    console.error('获取套餐列表失败:', error);
    res.status(500).json({
      success: false,
      error: '获取套餐列表失败',
    });
  }
};

/**
 * 获取当前用户订阅
 * GET /api/subscriptions/my
 */
export const getMySubscription = async (req: Request, res: Response) => {
  try {
    const userId = req.user!.userId;

    // 自动将过期订阅标记为 expired
    await pool.query(
      `UPDATE subscriptions
       SET status = 'expired'
       WHERE user_id = $1 AND status = 'active' AND end_date IS NOT NULL AND end_date < CURRENT_DATE`,
      [userId]
    );

    const result = await pool.query(
      `SELECT * FROM subscriptions
       WHERE user_id = $1
       ORDER BY created_at DESC
       LIMIT 1`,
      [userId]
    );

    const subscription = result.rows[0] || null;
    const planType: PlanType = subscription?.plan_type || 'free';
    const plan = SUBSCRIPTION_PLANS[planType];

    res.json({
      success: true,
      data: {
        subscription,
        current_plan: {
          plan_type: planType,
          name: plan.name,
          price: plan.price,
          features: plan.features,
        },
      },
    });
  } catch (error) {
    console.error('获取订阅信息失败:', error);
    res.status(500).json({
      success: false,
      error: '获取订阅信息失败',
    });
  }
};

/**
 * 订阅/续费
 * POST /api/subscriptions/subscribe
 */
export const subscribe = async (req: Request, res: Response) => {
  try {
    const userId = req.user!.userId;
    const { plan_type, payment_method } = req.body;

    if (!SUBSCRIPTION_PLANS[plan_type as PlanType] || plan_type === 'free') {
      return res.status(400).json({
        success: false,
        error: '无效的套餐类型，请选择 monthly 或 yearly',
      });
    }

    const plan = SUBSCRIPTION_PLANS[plan_type as PlanType];
    const client = await pool.connect();

    try {
      await client.query('BEGIN');

      // 取消当前活跃订阅
      await client.query(
        `UPDATE subscriptions SET status = 'cancelled'
         WHERE user_id = $1 AND status = 'active'`,
        [userId]
      );

      // 创建新订阅
      const result = await client.query(
        `INSERT INTO subscriptions (user_id, plan_type, status, start_date, end_date, amount, payment_method)
         VALUES ($1, $2, 'active', CURRENT_DATE, CURRENT_DATE + INTERVAL '1 day' * $3, $4, $5)
         RETURNING *`,
        [userId, plan_type, plan.duration_days, plan.price, payment_method || null]
      );

      await client.query('COMMIT');

      res.status(201).json({
        success: true,
        message: `订阅成功！已开通${plan.name}`,
        data: {
          subscription: result.rows[0],
          current_plan: {
            plan_type,
            name: plan.name,
            price: plan.price,
            features: plan.features,
          },
        },
      });
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  } catch (error) {
    console.error('订阅失败:', error);
    res.status(500).json({
      success: false,
      error: '订阅失败，请稍后重试',
    });
  }
};

/**
 * 取消订阅
 * PUT /api/subscriptions/cancel
 */
export const cancelSubscription = async (req: Request, res: Response) => {
  try {
    const userId = req.user!.userId;

    const result = await pool.query(
      `UPDATE subscriptions SET status = 'cancelled'
       WHERE user_id = $1 AND status = 'active'
       RETURNING *`,
      [userId]
    );

    if (result.rowCount === 0) {
      return res.status(404).json({
        success: false,
        error: '没有活跃的订阅',
      });
    }

    res.json({
      success: true,
      message: '订阅已取消，到期后将不再续费',
      data: result.rows[0],
    });
  } catch (error) {
    console.error('取消订阅失败:', error);
    res.status(500).json({
      success: false,
      error: '取消订阅失败',
    });
  }
};

/**
 * 管理员查看所有订阅
 * GET /api/subscriptions
 */
export const getAllSubscriptions = async (req: Request, res: Response) => {
  try {
    const { status, plan_type, limit = 20, offset = 0 } = req.query;

    let query = `
      SELECT s.*, u.username, u.email
      FROM subscriptions s
      JOIN users u ON s.user_id = u.id
      WHERE 1=1
    `;
    const params: any[] = [];
    let paramIndex = 1;

    if (status) {
      query += ` AND s.status = $${paramIndex}`;
      params.push(status);
      paramIndex++;
    }

    if (plan_type) {
      query += ` AND s.plan_type = $${paramIndex}`;
      params.push(plan_type);
      paramIndex++;
    }

    query += ` ORDER BY s.created_at DESC LIMIT $${paramIndex} OFFSET $${paramIndex + 1}`;
    params.push(Number(limit), Number(offset));

    const result = await pool.query(query, params);

    // 获取总数
    let countQuery = 'SELECT COUNT(*) FROM subscriptions WHERE 1=1';
    const countParams: any[] = [];
    let countIndex = 1;

    if (status) {
      countQuery += ` AND status = $${countIndex}`;
      countParams.push(status);
      countIndex++;
    }
    if (plan_type) {
      countQuery += ` AND plan_type = $${countIndex}`;
      countParams.push(plan_type);
    }

    const countResult = await pool.query(countQuery, countParams);

    res.json({
      success: true,
      data: result.rows,
      total: parseInt(countResult.rows[0].count),
    });
  } catch (error) {
    console.error('获取订阅列表失败:', error);
    res.status(500).json({
      success: false,
      error: '获取订阅列表失败',
    });
  }
};