import { Request, Response } from 'express';
import pool from '../config/database';

/**
 * 创建健身计划
 * POST /api/plans
 */
export const createPlan = async (req: Request, res: Response) => {
  try {
    const { name, description, duration_weeks, difficulty, target_goal, is_template, gym_id } = req.body;

    // 参数验证
    if (!name || !duration_weeks || !difficulty) {
      return res.status(400).json({
        success: false,
        error: '计划名称、持续周数和难度等级为必填项',
      });
    }

    const creator_id = req.user!.userId;

    const result = await pool.query(
      `INSERT INTO fitness_plans (name, description, duration_weeks, difficulty, target_goal, creator_id, is_template, gym_id)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
       RETURNING *`,
      [name, description, duration_weeks, difficulty, target_goal || null, creator_id, is_template || false, gym_id || null]
    );

    res.status(201).json({
      success: true,
      message: '健身计划创建成功',
      data: result.rows[0],
    });
  } catch (error) {
    console.error('创建健身计划失败:', error);
    res.status(500).json({
      success: false,
      error: '创建健身计划失败',
    });
  }
};

/**
 * 获取健身计划列表
 * GET /api/plans
 */
export const getPlans = async (req: Request, res: Response) => {
  try {
    const { is_template, difficulty, creator_id, limit = 20, offset = 0 } = req.query;

    let query = `
      SELECT fp.*, u.username as creator_name
      FROM fitness_plans fp
      LEFT JOIN users u ON fp.creator_id = u.id
      WHERE 1=1
    `;
    const params: any[] = [];
    let paramIndex = 1;

    // 筛选条件
    if (is_template !== undefined) {
      query += ` AND fp.is_template = $${paramIndex}`;
      params.push(is_template === 'true');
      paramIndex++;
    }

    if (difficulty) {
      query += ` AND fp.difficulty = $${paramIndex}`;
      params.push(difficulty);
      paramIndex++;
    }

    if (creator_id) {
      query += ` AND fp.creator_id = $${paramIndex}`;
      params.push(creator_id);
      paramIndex++;
    }

    // 排序和分页
    query += ` ORDER BY fp.created_at DESC LIMIT $${paramIndex} OFFSET $${paramIndex + 1}`;
    params.push(Number(limit), Number(offset));

    const result = await pool.query(query, params);

    res.json({
      success: true,
      data: result.rows,
      count: result.rowCount,
    });
  } catch (error) {
    console.error('获取健身计划列表失败:', error);
    res.status(500).json({
      success: false,
      error: '获取健身计划列表失败',
    });
  }
};

/**
 * 获取健身计划详情
 * GET /api/plans/:id
 */
export const getPlanById = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    const result = await pool.query(
      `SELECT fp.*, u.username as creator_name
       FROM fitness_plans fp
       LEFT JOIN users u ON fp.creator_id = u.id
       WHERE fp.id = $1`,
      [id]
    );

    if (result.rowCount === 0) {
      return res.status(404).json({
        success: false,
        error: '健身计划不存在',
      });
    }

    res.json({
      success: true,
      data: result.rows[0],
    });
  } catch (error) {
    console.error('获取健身计划详情失败:', error);
    res.status(500).json({
      success: false,
      error: '获取健身计划详情失败',
    });
  }
};

/**
 * 更新健身计划
 * PUT /api/plans/:id
 */
export const updatePlan = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { name, description, duration_weeks, difficulty, target_goal, is_template, status } = req.body;

    const userId = req.user!.userId;
    const userRole = req.user!.role;

    // 检查计划是否存在
    const existingPlan = await pool.query('SELECT creator_id FROM fitness_plans WHERE id = $1', [id]);
    if (existingPlan.rowCount === 0) {
      return res.status(404).json({
        success: false,
        error: '健身计划不存在',
      });
    }

    // 权限检查：只有创建者或管理员可以修改
    if (existingPlan.rows[0].creator_id !== userId && userRole !== 'admin') {
      return res.status(403).json({
        success: false,
        error: '无权修改此健身计划',
      });
    }

    const updates: string[] = [];
    const values: any[] = [];
    let paramIndex = 1;

    if (name !== undefined) {
      updates.push(`name = $${paramIndex}`);
      values.push(name);
      paramIndex++;
    }
    if (description !== undefined) {
      updates.push(`description = $${paramIndex}`);
      values.push(description);
      paramIndex++;
    }
    if (duration_weeks !== undefined) {
      updates.push(`duration_weeks = $${paramIndex}`);
      values.push(duration_weeks);
      paramIndex++;
    }
    if (difficulty !== undefined) {
      updates.push(`difficulty = $${paramIndex}`);
      values.push(difficulty);
      paramIndex++;
    }
    if (target_goal !== undefined) {
      updates.push(`target_goal = $${paramIndex}`);
      values.push(target_goal);
      paramIndex++;
    }
    if (is_template !== undefined) {
      updates.push(`is_template = $${paramIndex}`);
      values.push(is_template);
      paramIndex++;
    }
    if (status !== undefined) {
      updates.push(`status = $${paramIndex}`);
      values.push(status);
      paramIndex++;
    }

    updates.push(`updated_at = CURRENT_TIMESTAMP`);
    values.push(id);

    const query = `
      UPDATE fitness_plans
      SET ${updates.join(', ')}
      WHERE id = $${paramIndex}
      RETURNING *
    `;

    const result = await pool.query(query, values);

    res.json({
      success: true,
      message: '健身计划更新成功',
      data: result.rows[0],
    });
  } catch (error) {
    console.error('更新健身计划失败:', error);
    res.status(500).json({
      success: false,
      error: '更新健身计划失败',
    });
  }
};

/**
 * 删除健身计划
 * DELETE /api/plans/:id
 */
export const deletePlan = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const userId = req.user!.userId;
    const userRole = req.user!.role;

    // 检查计划是否存在
    const existingPlan = await pool.query('SELECT creator_id FROM fitness_plans WHERE id = $1', [id]);
    if (existingPlan.rowCount === 0) {
      return res.status(404).json({
        success: false,
        error: '健身计划不存在',
      });
    }

    // 权限检查：只有创建者或管理员可以删除
    if (existingPlan.rows[0].creator_id !== userId && userRole !== 'admin') {
      return res.status(403).json({
        success: false,
        error: '无权删除此健身计划',
      });
    }

    await pool.query('DELETE FROM fitness_plans WHERE id = $1', [id]);

    res.json({
      success: true,
      message: '健身计划删除成功',
    });
  } catch (error) {
    console.error('删除健身计划失败:', error);
    res.status(500).json({
      success: false,
      error: '删除健身计划失败',
    });
  }
};

/**
 * 获取我的健身计划
 * GET /api/plans/my
 */
export const getMyPlans = async (req: Request, res: Response) => {
  try {
    const userId = req.user!.userId;

    const result = await pool.query(
      `SELECT * FROM fitness_plans
       WHERE creator_id = $1
       ORDER BY created_at DESC`,
      [userId]
    );

    res.json({
      success: true,
      data: result.rows,
      count: result.rowCount,
    });
  } catch (error) {
    console.error('获取我的健身计划失败:', error);
    res.status(500).json({
      success: false,
      error: '获取我的健身计划失败',
    });
  }
};