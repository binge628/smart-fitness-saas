import { Request, Response } from 'express';
import pool from '../config/database';

/**
 * 获取动作列表
 * GET /api/exercises
 */
export const getExercises = async (req: Request, res: Response) => {
  try {
    const { muscle_group, category, search, limit = 50, offset = 0 } = req.query;

    let query = 'SELECT * FROM exercises WHERE 1=1';
    const params: any[] = [];
    let paramIndex = 1;

    if (muscle_group) {
      query += ` AND muscle_group = $${paramIndex}`;
      params.push(muscle_group);
      paramIndex++;
    }

    if (category) {
      query += ` AND category = $${paramIndex}`;
      params.push(category);
      paramIndex++;
    }

    if (search) {
      query += ` AND name ILIKE $${paramIndex}`;
      params.push(`%${search}%`);
      paramIndex++;
    }

    query += ` ORDER BY is_preset DESC, name ASC LIMIT $${paramIndex} OFFSET $${paramIndex + 1}`;
    params.push(Number(limit), Number(offset));

    const result = await pool.query(query, params);

    res.json({
      success: true,
      data: result.rows,
      count: result.rowCount,
    });
  } catch (error) {
    console.error('获取动作列表失败:', error);
    res.status(500).json({
      success: false,
      error: '获取动作列表失败',
    });
  }
};

/**
 * 获取动作详情
 * GET /api/exercises/:id
 */
export const getExerciseById = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    const result = await pool.query('SELECT * FROM exercises WHERE id = $1', [id]);

    if (result.rowCount === 0) {
      return res.status(404).json({
        success: false,
        error: '动作不存在',
      });
    }

    res.json({
      success: true,
      data: result.rows[0],
    });
  } catch (error) {
    console.error('获取动作详情失败:', error);
    res.status(500).json({
      success: false,
      error: '获取动作详情失败',
    });
  }
};

/**
 * 创建自定义动作
 * POST /api/exercises
 */
export const createExercise = async (req: Request, res: Response) => {
  try {
    const { name, muscle_group, category, description } = req.body;

    if (!name || !muscle_group || !category) {
      return res.status(400).json({
        success: false,
        error: '动作名称、肌群和类别为必填项',
      });
    }

    const result = await pool.query(
      `INSERT INTO exercises (name, muscle_group, category, description, is_preset)
       VALUES ($1, $2, $3, $4, false)
       RETURNING *`,
      [name, muscle_group, category, description || null]
    );

    res.status(201).json({
      success: true,
      message: '动作创建成功',
      data: result.rows[0],
    });
  } catch (error) {
    console.error('创建动作失败:', error);
    res.status(500).json({
      success: false,
      error: '创建动作失败',
    });
  }
};