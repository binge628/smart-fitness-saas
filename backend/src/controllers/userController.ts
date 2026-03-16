import { Request, Response } from 'express';
import pool from '../config/database';

/**
 * 获取所有用户
 * GET /api/users
 */
export const getUsers = async (req: Request, res: Response) => {
  try {
    const result = await pool.query(
      'SELECT id, username, email, phone, avatar, role, status, created_at FROM users ORDER BY created_at DESC'
    );
    res.json({
      success: true,
      data: result.rows,
      count: result.rowCount,
    });
  } catch (error) {
    console.error('获取用户列表失败:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch users',
    });
  }
};

/**
 * 根据ID获取用户
 * GET /api/users/:id
 */
export const getUserById = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const result = await pool.query(
      'SELECT id, username, email, phone, avatar, role, status, created_at FROM users WHERE id = $1',
      [id]
    );

    if (result.rowCount === 0) {
      return res.status(404).json({
        success: false,
        error: 'User not found',
      });
    }

    res.json({
      success: true,
      data: result.rows[0],
    });
  } catch (error) {
    console.error('获取用户失败:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch user',
    });
  }
};