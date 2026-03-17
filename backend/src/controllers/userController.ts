import { Request, Response } from 'express';
import pool from '../config/database';
import { hashPassword, comparePassword, generateToken, JwtPayload } from '../utils/auth';

/**
 * 用户注册
 * POST /api/auth/register
 */
export const registerUser = async (req: Request, res: Response) => {
  try {
    const { username, email, password, phone } = req.body;

    // 参数验证
    if (!username || !email || !password) {
      return res.status(400).json({
        success: false,
        error: '用户名、邮箱和密码为必填项',
      });
    }

    // 检查用户名是否已存在
    const existingUser = await pool.query(
      'SELECT id FROM users WHERE username = $1 OR email = $2',
      [username, email]
    );

    if (existingUser.rowCount && existingUser.rowCount > 0) {
      return res.status(400).json({
        success: false,
        error: '用户名或邮箱已被注册',
      });
    }

    // 加密密码
    const passwordHash = await hashPassword(password);

    // 创建用户
    const result = await pool.query(
      'INSERT INTO users (username, email, password_hash, phone) VALUES ($1, $2, $3, $4) RETURNING id, username, email, phone, role, status, created_at',
      [username, email, passwordHash, phone]
    );

    const user = result.rows[0];

    // 生成 JWT Token
    const token = generateToken({
      userId: user.id,
      username: user.username,
      email: user.email,
      role: user.role,
    });

    res.status(201).json({
      success: true,
      message: '注册成功',
      data: {
        user: {
          id: user.id,
          username: user.username,
          email: user.email,
          phone: user.phone,
          role: user.role,
          status: user.status,
        },
        token,
      },
    });
  } catch (error) {
    console.error('注册失败:', error);
    res.status(500).json({
      success: false,
      error: '注册失败，请稍后重试',
    });
  }
};

/**
 * 用户登录
 * POST /api/auth/login
 */
export const loginUser = async (req: Request, res: Response) => {
  try {
    const { username, password } = req.body;

    console.log('📥 收到登录请求:', { username });

    // 参数验证
    if (!username || !password) {
      return res.status(400).json({
        success: false,
        error: '用户名和密码为必填项',
      });
    }

    // 查找用户
    const result = await pool.query(
      'SELECT * FROM users WHERE username = $1 OR email = $1',
      [username]
    );

    if (result.rowCount === 0) {
      return res.status(401).json({
        success: false,
        error: '用户名或密码错误',
      });
    }

    const user = result.rows[0];
    console.log('📦 找到用户:', { id: user.id, username: user.username });

    // 检查用户状态
    if (user.status !== 'active') {
      return res.status(403).json({
        success: false,
        error: '账户已被禁用',
      });
    }

    // 验证密码
    const isPasswordValid = await comparePassword(password, user.password_hash);
    if (!isPasswordValid) {
      return res.status(401).json({
        success: false,
        error: '用户名或密码错误',
      });
    }

    // 生成 JWT Token
    const token = generateToken({
      userId: user.id,
      username: user.username,
      email: user.email,
      role: user.role,
    });

    res.json({
      success: true,
      message: '登录成功',
      data: {
        user: {
          id: user.id,
          username: user.username,
          email: user.email,
          phone: user.phone,
          avatar: user.avatar,
          role: user.role,
          status: user.status,
        },
        token,
      },
    });
  } catch (error) {
    console.error('登录失败:', error);
    res.status(500).json({
      success: false,
      error: '登录失败，请稍后重试',
    });
  }
};

/**
 * 获取当前用户信息
 * GET /api/auth/me
 */
export const getCurrentUser = async (req: Request, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        error: '未认证',
      });
    }

    const result = await pool.query(
      'SELECT id, username, email, phone, avatar, role, status, created_at FROM users WHERE id = $1',
      [req.user.userId]
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
    console.error('获取当前用户失败:', error);
    res.status(500).json({
      success: false,
      error: '获取用户信息失败',
    });
  }
};

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

/**
 * 更新当前用户信息
 * PUT /api/auth/me
 */
export const updateCurrentUser = async (req: Request, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        error: '未认证',
      });
    }

    const { username, email, phone, avatar } = req.body;
    const userId = req.user.userId;

    // 检查用户名或邮箱是否已被其他用户使用
    if (username || email) {
      const existingUser = await pool.query(
        'SELECT id FROM users WHERE (username = $1 OR email = $2) AND id != $3',
        [username || '', email || '', userId]
      );

      if (existingUser.rowCount && existingUser.rowCount > 0) {
        return res.status(400).json({
          success: false,
          error: '用户名或邮箱已被使用',
        });
      }
    }

    const updates: string[] = [];
    const values: any[] = [];
    let paramIndex = 1;

    if (username !== undefined) {
      updates.push(`username = $${paramIndex}`);
      values.push(username);
      paramIndex++;
    }
    if (email !== undefined) {
      updates.push(`email = $${paramIndex}`);
      values.push(email);
      paramIndex++;
    }
    if (phone !== undefined) {
      updates.push(`phone = $${paramIndex}`);
      values.push(phone);
      paramIndex++;
    }
    if (avatar !== undefined) {
      updates.push(`avatar = $${paramIndex}`);
      values.push(avatar);
      paramIndex++;
    }

    if (updates.length === 0) {
      return res.status(400).json({
        success: false,
        error: '请提供至少一个需要更新的字段',
      });
    }

    values.push(userId);

    const query = `
      UPDATE users
      SET ${updates.join(', ')}, updated_at = CURRENT_TIMESTAMP
      WHERE id = $${paramIndex}
      RETURNING id, username, email, phone, avatar, role, status, created_at
    `;

    const result = await pool.query(query, values);

    res.json({
      success: true,
      message: '用户信息更新成功',
      data: result.rows[0],
    });
  } catch (error) {
    console.error('更新用户信息失败:', error);
    res.status(500).json({
      success: false,
      error: '更新用户信息失败',
    });
  }
};

/**
 * 修改用户密码
 * PUT /api/auth/me/password
 */
export const changePassword = async (req: Request, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        error: '未认证',
      });
    }

    const { oldPassword, newPassword } = req.body;
    const userId = req.user.userId;

    if (!oldPassword || !newPassword) {
      return res.status(400).json({
        success: false,
        error: '旧密码和新密码不能为空',
      });
    }

    if (newPassword.length < 6) {
      return res.status(400).json({
        success: false,
        error: '新密码至少需要6个字符',
      });
    }

    // 获取用户当前密码
    const userResult = await pool.query(
      'SELECT password_hash FROM users WHERE id = $1',
      [userId]
    );

    if (userResult.rowCount === 0) {
      return res.status(404).json({
        success: false,
        error: '用户不存在',
      });
    }

    const user = userResult.rows[0];

    // 验证旧密码
    const isPasswordValid = await comparePassword(oldPassword, user.password_hash);
    if (!isPasswordValid) {
      return res.status(401).json({
        success: false,
        error: '旧密码错误',
      });
    }

    // 加密新密码
    const newPasswordHash = await hashPassword(newPassword);

    // 更新密码
    await pool.query(
      'UPDATE users SET password_hash = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2',
      [newPasswordHash, userId]
    );

    res.json({
      success: true,
      message: '密码修改成功',
    });
  } catch (error) {
    console.error('修改密码失败:', error);
    res.status(500).json({
      success: false,
      error: '修改密码失败',
    });
  }
};