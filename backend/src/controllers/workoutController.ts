import { Request, Response } from 'express';
import pool from '../config/database';
import { checkAndUnlockAchievements } from './achievementController';

interface SetInput {
  exercise_id: string;
  set_order: number;
  weight?: number | null;
  reps?: number | null;
  rest_seconds?: number | null;
  notes?: string;
}

/**
 * 创建训练日志
 * POST /api/workouts
 */
export const createWorkout = async (req: Request, res: Response) => {
  const client = await pool.connect();
  try {
    const { plan_id, workout_date, duration_minutes, calories_burned, notes, sets } = req.body;

    if (!workout_date || !duration_minutes) {
      return res.status(400).json({
        success: false,
        error: '训练日期和训练时长为必填项',
      });
    }

    const userId = req.user!.userId;

    await client.query('BEGIN');

    const result = await client.query(
      `INSERT INTO workout_logs (user_id, plan_id, workout_date, duration_minutes, calories_burned, notes)
       VALUES ($1, $2, $3, $4, $5, $6)
       RETURNING *`,
      [userId, plan_id || null, workout_date, duration_minutes, calories_burned || null, notes || null]
    );

    const workout = result.rows[0];

    // 插入训练组数
    if (sets && sets.length > 0) {
      for (const s of sets as SetInput[]) {
        await client.query(
          `INSERT INTO workout_sets (workout_id, exercise_id, set_order, weight, reps, rest_seconds, notes)
           VALUES ($1, $2, $3, $4, $5, $6, $7)`,
          [workout.id, s.exercise_id, s.set_order, s.weight || null, s.reps || null, s.rest_seconds || null, s.notes || null]
        );
      }
    }

    await client.query('COMMIT');

    // 返回完整数据（含 sets）
    const fullResult = await getWorkoutWithSets(workout.id);

    // 检查成就解锁
    const newAchievements = await checkAndUnlockAchievements(userId);

    res.status(201).json({
      success: true,
      message: '训练日志创建成功',
       data: fullResult,
      new_achievements: newAchievements.length > 0 ? newAchievements : undefined,
    });
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('创建训练日志失败:', error);
    res.status(500).json({
      success: false,
      error: '创建训练日志失败',
    });
  } finally {
    client.release();
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

    query += ` ORDER BY wl.workout_date DESC LIMIT $${paramIndex} OFFSET $${paramIndex + 1}`;
    params.push(Number(limit), Number(offset));

    const result = await pool.query(query, params);

    // 批量获取所有 workout 的 sets
    const workoutIds = result.rows.map((r: any) => r.id);
    let setsMap: Record<string, any[]> = {};

    if (workoutIds.length > 0) {
      const setsResult = await pool.query(
        `SELECT ws.*, e.name as exercise_name, e.muscle_group
         FROM workout_sets ws
         JOIN exercises e ON ws.exercise_id = e.id
         WHERE ws.workout_id = ANY($1)
         ORDER BY ws.workout_id, ws.set_order`,
        [workoutIds]
      );
      for (const set of setsResult.rows) {
        if (!setsMap[set.workout_id]) setsMap[set.workout_id] = [];
        setsMap[set.workout_id].push(set);
      }
    }

    const workoutsWithSets = result.rows.map((w: any) => ({
      ...w,
      sets: setsMap[w.id] || [],
    }));

    res.json({
      success: true,
       data: workoutsWithSets,
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

    const workout = result.rows[0];
    const fullResult = await getWorkoutWithSets(id as string);

    res.json({
      success: true,
       data: { ...workout, ...fullResult },
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
  const client = await pool.connect();
  try {
    const { id } = req.params;
    const { plan_id, workout_date, duration_minutes, calories_burned, notes, sets } = req.body;

    const userId = req.user!.userId;

    const existingWorkout = await client.query(
      'SELECT id FROM workout_logs WHERE id = $1 AND user_id = $2',
      [id, userId]
    );

    if (existingWorkout.rowCount === 0) {
      return res.status(404).json({
        success: false,
        error: '训练日志不存在',
      });
    }

    await client.query('BEGIN');

    // 更新 workout_logs 基础字段
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
      // 确保转换为数字或 null
      const caloriesValue = calories_burned === '' || calories_burned === null ? null : Number(calories_burned);
      values.push(caloriesValue === null || isNaN(caloriesValue) ? null : caloriesValue);
      paramIndex++;
    }
    if (notes !== undefined) {
      updates.push(`notes = $${paramIndex}`);
      // 确保转换为字符串或 null
      values.push(notes === '' ? null : notes);
      paramIndex++;
    }

    if (updates.length > 0) {
      values.push(id);
      await client.query(
        `UPDATE workout_logs SET ${updates.join(', ')} WHERE id = $${paramIndex}`,
        values
      );
    }

    // 更新 sets（先删后插）
    if (sets !== undefined) {
      await client.query('DELETE FROM workout_sets WHERE workout_id = $1', [id]);
      for (const s of sets as SetInput[]) {
        await client.query(
          `INSERT INTO workout_sets (workout_id, exercise_id, set_order, weight, reps, rest_seconds, notes)
           VALUES ($1, $2, $3, $4, $5, $6, $7)`,
          [
            id,
            s.exercise_id,
            s.set_order,
            s.weight == null ? null : Number(s.weight),
            s.reps == null ? null : Number(s.reps),
            s.rest_seconds == null ? null : Number(s.rest_seconds),
            s.notes || null
          ]
        );
      }
    }

    await client.query('COMMIT');

    const fullResult = await getWorkoutWithSets(id as string);
    res.json({
      success: true,
      message: '训练日志更新成功',
       data: fullResult,
    });
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('更新训练日志失败:', error);
    res.status(500).json({
      success: false,
      error: '更新训练日志失败',
    });
  } finally {
    client.release();
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

/**
 * 辅助函数：获取 workout 及其 sets
 */
async function getWorkoutWithSets(workoutId: string) {
  const setsResult = await pool.query(
    `SELECT ws.*, e.name as exercise_name, e.muscle_group
     FROM workout_sets ws
     JOIN exercises e ON ws.exercise_id = e.id
     WHERE ws.workout_id = $1
     ORDER BY ws.set_order`,
    [workoutId]
  );
  return { sets: setsResult.rows };
}