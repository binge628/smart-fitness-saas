import { Request, Response } from 'express';
import pool from '../config/database';

/**
 * 创建健康数据记录
 * POST /api/health-data
 */
export const createHealthData = async (req: Request, res: Response) => {
  try {
    const {
      record_date,
      weight,
      height,
      body_fat_percentage,
      muscle_mass,
      heart_rate_resting,
      blood_pressure_systolic,
      blood_pressure_diastolic,
    } = req.body;

    // 参数验证
    if (!record_date) {
      return res.status(400).json({
        success: false,
        error: '记录日期为必填项',
      });
    }

    // 至少需要一项有效数据
    const hasValidData =
      weight || height || body_fat_percentage || muscle_mass ||
      heart_rate_resting || blood_pressure_systolic || blood_pressure_diastolic;

    if (!hasValidData) {
      return res.status(400).json({
        success: false,
        error: '至少需要提供一项健康数据',
      });
    }

    const userId = req.user!.userId;

    const result = await pool.query(
      `INSERT INTO health_data
       (user_id, record_date, weight, height, body_fat_percentage, muscle_mass, heart_rate_resting, blood_pressure_systolic, blood_pressure_diastolic)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
       ON CONFLICT (user_id, record_date) DO UPDATE SET
         weight = COALESCE(EXCLUDED.weight, health_data.weight),
         height = COALESCE(EXCLUDED.height, health_data.height),
         body_fat_percentage = COALESCE(EXCLUDED.body_fat_percentage, health_data.body_fat_percentage),
         muscle_mass = COALESCE(EXCLUDED.muscle_mass, health_data.muscle_mass),
         heart_rate_resting = COALESCE(EXCLUDED.heart_rate_resting, health_data.heart_rate_resting),
         blood_pressure_systolic = COALESCE(EXCLUDED.blood_pressure_systolic, health_data.blood_pressure_systolic),
         blood_pressure_diastolic = COALESCE(EXCLUDED.blood_pressure_diastolic, health_data.blood_pressure_diastolic)
       RETURNING *`,
      [
        userId,
        record_date,
        weight || null,
        height || null,
        body_fat_percentage || null,
        muscle_mass || null,
        heart_rate_resting || null,
        blood_pressure_systolic || null,
        blood_pressure_diastolic || null,
      ]
    );

    res.status(201).json({
      success: true,
      message: '健康数据记录成功',
      data: result.rows[0],
    });
  } catch (error) {
    console.error('创建健康数据失败:', error);
    res.status(500).json({
      success: false,
      error: '创建健康数据失败',
    });
  }
};

/**
 * 获取健康数据列表
 * GET /api/health-data
 */
export const getHealthData = async (req: Request, res: Response) => {
  try {
    const { start_date, end_date, limit = 30, offset = 0 } = req.query;

    const userId = req.user!.userId;

    let query = `SELECT * FROM health_data WHERE user_id = $1`;
    const params: any[] = [userId];
    let paramIndex = 2;

    // 日期筛选
    if (start_date) {
      query += ` AND record_date >= $${paramIndex}`;
      params.push(start_date);
      paramIndex++;
    }

    if (end_date) {
      query += ` AND record_date <= $${paramIndex}`;
      params.push(end_date);
      paramIndex++;
    }

    // 按日期倒序，并限制返回数量
    query += ` ORDER BY record_date DESC LIMIT $${paramIndex} OFFSET $${paramIndex + 1}`;
    params.push(Number(limit), Number(offset));

    const result = await pool.query(query, params);

    res.json({
      success: true,
      data: result.rows,
      count: result.rowCount,
    });
  } catch (error) {
    console.error('获取健康数据列表失败:', error);
    res.status(500).json({
      success: false,
      error: '获取健康数据列表失败',
    });
  }
};

/**
 * 获取健康数据统计
 * GET /api/health-data/stats
 */
export const getHealthDataStats = async (req: Request, res: Response) => {
  try {
    const { start_date, end_date } = req.query;

    const userId = req.user!.userId;

    let query = `
      SELECT
        AVG(weight) as avg_weight,
        MAX(weight) as max_weight,
        MIN(weight) as min_weight,
        AVG(body_fat_percentage) as avg_body_fat,
        MAX(body_fat_percentage) as max_body_fat,
        MIN(body_fat_percentage) as min_body_fat,
        AVG(muscle_mass) as avg_muscle_mass,
        COUNT(*) as record_count
      FROM health_data
      WHERE user_id = $1
    `;
    const params: any[] = [userId];
    let paramIndex = 2;

    if (start_date) {
      query += ` AND record_date >= $${paramIndex}`;
      params.push(start_date);
      paramIndex++;
    }

    if (end_date) {
      query += ` AND record_date <= $${paramIndex}`;
      params.push(end_date);
      paramIndex++;
    }

    const result = await pool.query(query, params);

    res.json({
      success: true,
      data: result.rows[0],
    });
  } catch (error) {
    console.error('获取健康数据统计失败:', error);
    res.status(500).json({
      success: false,
      error: '获取健康数据统计失败',
    });
  }
};

/**
 * 获取指定日期的健康数据
 * GET /api/health-data/date/:date
 */
export const getHealthDataByDate = async (req: Request, res: Response) => {
  try {
    const { date } = req.params;
    const userId = req.user!.userId;

    const result = await pool.query(
      'SELECT * FROM health_data WHERE user_id = $1 AND record_date = $2',
      [userId, date]
    );

    if (result.rowCount === 0) {
      return res.status(404).json({
        success: false,
        error: '该日期的健康数据不存在',
      });
    }

    res.json({
      success: true,
      data: result.rows[0],
    });
  } catch (error) {
    console.error('获取健康数据失败:', error);
    res.status(500).json({
      success: false,
      error: '获取健康数据失败',
    });
  }
};

/**
 * 更新健康数据
 * PUT /api/health-data/:id
 */
export const updateHealthData = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const {
      weight,
      height,
      body_fat_percentage,
      muscle_mass,
      heart_rate_resting,
      blood_pressure_systolic,
      blood_pressure_diastolic,
    } = req.body;

    const userId = req.user!.userId;

    // 检查记录是否存在且属于当前用户
    const existingData = await pool.query(
      'SELECT id FROM health_data WHERE id = $1 AND user_id = $2',
      [id, userId]
    );

    if (existingData.rowCount === 0) {
      return res.status(404).json({
        success: false,
        error: '健康数据记录不存在',
      });
    }

    const updates: string[] = [];
    const values: any[] = [];
    let paramIndex = 1;

    if (weight !== undefined) {
      updates.push(`weight = $${paramIndex}`);
      values.push(weight);
      paramIndex++;
    }
    if (height !== undefined) {
      updates.push(`height = $${paramIndex}`);
      values.push(height);
      paramIndex++;
    }
    if (body_fat_percentage !== undefined) {
      updates.push(`body_fat_percentage = $${paramIndex}`);
      values.push(body_fat_percentage);
      paramIndex++;
    }
    if (muscle_mass !== undefined) {
      updates.push(`muscle_mass = $${paramIndex}`);
      values.push(muscle_mass);
      paramIndex++;
    }
    if (heart_rate_resting !== undefined) {
      updates.push(`heart_rate_resting = $${paramIndex}`);
      values.push(heart_rate_resting);
      paramIndex++;
    }
    if (blood_pressure_systolic !== undefined) {
      updates.push(`blood_pressure_systolic = $${paramIndex}`);
      values.push(blood_pressure_systolic);
      paramIndex++;
    }
    if (blood_pressure_diastolic !== undefined) {
      updates.push(`blood_pressure_diastolic = $${paramIndex}`);
      values.push(blood_pressure_diastolic);
      paramIndex++;
    }

    values.push(id);

    const query = `
      UPDATE health_data
      SET ${updates.join(', ')}
      WHERE id = $${paramIndex}
      RETURNING *
    `;

    const result = await pool.query(query, values);

    res.json({
      success: true,
      message: '健康数据更新成功',
      data: result.rows[0],
    });
  } catch (error) {
    console.error('更新健康数据失败:', error);
    res.status(500).json({
      success: false,
      error: '更新健康数据失败',
    });
  }
};

/**
 * 删除健康数据
 * DELETE /api/health-data/:id
 */
export const deleteHealthData = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const userId = req.user!.userId;

    // 检查记录是否存在且属于当前用户
    const existingData = await pool.query(
      'SELECT id FROM health_data WHERE id = $1 AND user_id = $2',
      [id, userId]
    );

    if (existingData.rowCount === 0) {
      return res.status(404).json({
        success: false,
        error: '健康数据记录不存在',
      });
    }

    await pool.query('DELETE FROM health_data WHERE id = $1', [id]);

    res.json({
      success: true,
      message: '健康数据删除成功',
    });
  } catch (error) {
    console.error('删除健康数据失败:', error);
    res.status(500).json({
      success: false,
      error: '删除健康数据失败',
    });
  }
};