import { Request, Response } from 'express';
import pool from '../config/database';

/**
 * 创建训练日志
 * POST /api/workouts
 */
export const createWorkout = async (req: Request, res: Response) => {
  try {
    const { plan_id, workout_date, duration_minutes, calories_burned, notes } = req.body;

    // 参数验证
    if (!workout_date || !duration_minutes) {
      return res.status(400).json({
        success: false,
        error: '训练日期和训练时长为必填项',
      });
    }

    const userId = req.user!.userId;

    const result = await pool.query(
      `INSERT INTO workout_logs (user_id, plan_id, workout_date, duration_minutes, calories_burned, notes)
       VALUES ($1, $2, $3, $4, $5, $6)
       RETURNING *`,
      [userId, plan_id || null, workout_date, duration_minutes, calories_burned || null, notes || null]
    );

    res.status(201).json({
      success: true,
      message: '训练日志创建成功',
      data: result.rows[0],
    });
  } catch (error) {
    console.error('创建训练日志失败:', error);
    res.status(500).json({
      success: false,
      error: '创建训练日志失败',
    });
  }
};

/**
 * 获取训练日志列表
 * GET /api/workouts
 */
export const getWorkouts = async (req: Request, res: Response) => {
  try {
    const { plan_id, start_date, end_date, limit = 20, offset = 0 } = req.query;

    const userId = req.user!.userId;

    let query = `
      SELECT wl.*, fp.name as plan_name
      FROM workout_logs wl
      LEFT JOIN fitness_plans fp ON wl.plan_id = fp.id
      WHERE wl.user_id = $1
    `;
    const params: any[] = [userId];
    let paramIndex = 2;

    // 筛选条件
    if (plan_id) {
      query += ` AND wl.plan_id = $${paramIndex}`;
      params.push(plan_id);
      paramIndex++;
    }

    if (start_date) {
      query += ` AND wl.workout_date >= $${paramIndex}`;
      params.push(start_date);
      paramIndex++;
    }

    if (end_date) {
      query += ` AND wl.workout_date <= $${paramIndex}`;
      params.push(end_date);
      paramIndex++;
    }

    // 按日期倒序，并限制返回数量
    query += ` ORDER BY wl.workout_date DESC LIMIT $${paramIndex} OFFSET $${paramIndex + 1}`;
    params.push(Number(limit), Number(offset));

    const result = await pool.query(query, params);

    res.json({
      success: true,
      data: result.rows,
      count: result.rowCount,
    });
  } catch (error) {
    console.error('获取训练日志列表失败:', error);
    res.status(500).json({
      success: false,
      error: '获取训练日志列表失败',
    });
  }
};

/**
 * 获取训练日志详情
 * GET /api/workouts/:id
 */
export const getWorkoutById = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const userId = req.user!.userId;

    const result = await pool.query(
      `SELECT wl.*, fp.name as plan_name, fp.difficulty, fp.target_goal
       FROM workout_logs wl
       LEFT JOIN fitness_plans fp ON wl.plan_id = fp.id
       WHERE wl.id = $1 AND wl.user_id = $2`,
      [id, userId]
    );

    if (result.rowCount === 0) {
      return res.status(404).json({
        success: false,
        error: '训练日志不存在',
      });
    }

    res.json({
      success: true,
      data: result.rows[0],
    });
  } catch (error) {
    console.error('获取训练日志详情失败:', error);
    res.status(500).json({
      success: false,
      error: '获取训练日志详情失败',
    });
  }
};

/**
 * 获取训练日志统计
 * GET /api/workouts/stats
 */
export const getWorkoutStats = async (req: Request, res: Response) => {
  try {
    const { start_date, end_date } = req.query;

    const userId = req.user!.userId;

    let query = `
      SELECT
        COUNT(*) as total_workouts,
        SUM(duration_minutes) as total_duration,
        AVG(duration_minutes) as avg_duration,
        SUM(calories_burned) as total_calories,
        AVG(calories_burned) as avg_calories
      FROM workout_logs
      WHERE user_id = $1
    `;
    const params: any[] = [userId];
    let paramIndex = 2;

    if (start_date) {
      query += ` AND workout_date >= $${paramIndex}`;
      params.push(start_date);
      paramIndex++;
    }

    if (end_date) {
      query += ` AND workout_date <= $${paramIndex}`;
      params.push(end_date);
      paramIndex++;
    }

    const result = await pool.query(query, params);

    res.json({
      success: true,
      data: result.rows[0],
    });
  } catch (error) {
    console.error('获取训练日志统计失败:', error);
    res.status(500).json({
      success: false,
      error: '获取训练日志统计失败',
    });
  }
};

/**
 * 更新训练日志
 * PUT /api/workouts/:id
 */
export const updateWorkout = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { plan_id, workout_date, duration_minutes, calories_burned, notes } = req.body;

    const userId = req.user!.userId;

    // 检查日志是否存在且属于当前用户
    const existingWorkout = await pool.query(
      'SELECT id FROM workout_logs WHERE id = $1 AND user_id = $2',
      [id, userId]
    );

    if (existingWorkout.rowCount === 0) {
      return res.status(404).json({
        success: false,
        error: '训练日志不存在',
      });
    }

    const updates: string[] = [];
    const values: any[] = [];
    let paramIndex = 1;

    if (plan_id !== undefined) {
      updates.push(`plan_id = $${paramIndex}`);
      values.push(plan_id || null);
      paramIndex++;
    }
    if (workout_date !== undefined) {
      updates.push(`workout_date = $${paramIndex}`);
      values.push(workout_date);
      paramIndex++;
    }
    if (duration_minutes !== undefined) {
      updates.push(`duration_minutes = $${paramIndex}`);
      values.push(duration_minutes);
      paramIndex++;
    }
    if (calories_burned !== undefined) {
      updates.push(`calories_burned = $${paramIndex}`);
      values.push(calories_burned || null);
      paramIndex++;
    }
    if (notes !== undefined) {
      updates.push(`notes = $${paramIndex}`);
      values.push(notes || null);
      paramIndex++;
    }

    values.push(id);

    const query = `
      UPDATE workout_logs
      SET ${updates.join(', ')}
      WHERE id = $${paramIndex}
      RETURNING *
    `;

    const result = await pool.query(query, values);

    res.json({
      success: true,
      message: '训练日志更新成功',
      data: result.rows[0],
    });
  } catch (error) {
    console.error('更新训练日志失败:', error);
    res.status(500).json({
      success: false,
      error: '更新训练日志失败',
    });
  }
};

/**
 * 删除训练日志
 * DELETE /api/workouts/:id
 */
export const deleteWorkout = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const userId = req.user!.userId;

    // 检查日志是否存在且属于当前用户
    const existingWorkout = await pool.query(
      'SELECT id FROM workout_logs WHERE id = $1 AND user_id = $2',
      [id, userId]
    );

    if (existingWorkout.rowCount === 0) {
      return res.status(404).json({
        success: false,
        error: '训练日志不存在',
      });
    }

    await pool.query('DELETE FROM workout_logs WHERE id = $1', [id]);

    res.json({
      success: true,
      message: '训练日志删除成功',
    });
  } catch (error) {
    console.error('删除训练日志失败:', error);
    res.status(500).json({
      success: false,
      error: '删除训练日志失败',
    });
  }
};