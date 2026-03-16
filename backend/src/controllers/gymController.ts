import { Request, Response } from 'express';
import pool from '../config/database';

/**
 * 健身房会员管理
 */

/**
 * 添加会员到健身房
 * POST /api/gyms/:id/members
 */
export const addGymMember = async (req: Request, res: Response) => {
  try {
    const { id: gym_id } = req.params;
    const { user_id, membership_type, start_date, end_date } = req.body;

    // 参数验证
    if (!user_id || !membership_type || !start_date) {
      return res.status(400).json({
        success: false,
        error: '用户ID、会员类型和开始日期为必填项',
      });
    }

    // 检查是否已经是会员
    const existingMember = await pool.query(
      'SELECT id FROM gym_members WHERE gym_id = $1 AND user_id = $2',
      [gym_id, user_id]
    );

    if (existingMember.rowCount && existingMember.rowCount > 0) {
      return res.status(400).json({
        success: false,
        error: '该用户已经是此健身房的会员',
      });
    }

    const result = await pool.query(
      `INSERT INTO gym_members (gym_id, user_id, membership_type, start_date, end_date, membership_status)
       VALUES ($1, $2, $3, $4, $5, 'active')
       RETURNING *`,
      [gym_id, user_id, membership_type, start_date, end_date || null]
    );

    res.status(201).json({
      success: true,
      message: '会员添加成功',
      data: result.rows[0],
    });
  } catch (error) {
    console.error('添加会员失败:', error);
    res.status(500).json({
      success: false,
      error: '添加会员失败',
    });
  }
};

/**
 * 获取健身房会员列表
 * GET /api/gyms/:id/members
 */
export const getGymMembers = async (req: Request, res: Response) => {
  try {
    const { id: gym_id } = req.params;
    const { status, limit = 20, offset = 0 } = req.query;

    let query = `
      SELECT gm.*, u.username, u.email, u.phone, u.avatar
      FROM gym_members gm
      JOIN users u ON gm.user_id = u.id
      WHERE gm.gym_id = $1
    `;
    const params: any[] = [gym_id];

    if (status) {
      query += ` AND gm.membership_status = $2`;
      params.push(status);
    }

    query += ` ORDER BY gm.created_at DESC LIMIT $2 OFFSET $3`;

    const result = await pool.query(query, params);

    res.json({
      success: true,
      data: result.rows,
      count: result.rowCount,
    });
  } catch (error) {
    console.error('获取健身房会员列表失败:', error);
    res.status(500).json({
      success: false,
      error: '获取健身房会员列表失败',
    });
  }
};

/**
 * 更新健身房会员信息
 * PUT /api/gyms/:gymId/members/:userId
 */
export const updateGymMember = async (req: Request, res: Response) => {
  try {
    const { gymId, userId } = req.params;
    const { membership_type, start_date, end_date, membership_status } = req.body;

    // 检查会员是否存在
    const existingMember = await pool.query(
      'SELECT id FROM gym_members WHERE gym_id = $1 AND user_id = $2',
      [gymId, userId]
    );

    if (existingMember.rowCount === 0) {
      return res.status(404).json({
        success: false,
        error: '会员不存在',
      });
    }

    const updates: string[] = [];
    const values: any[] = [];
    let paramIndex = 1;

    if (membership_type !== undefined) {
      updates.push(`membership_type = $${paramIndex}`);
      values.push(membership_type);
      paramIndex++;
    }
    if (start_date !== undefined) {
      updates.push(`start_date = $${paramIndex}`);
      values.push(start_date);
      paramIndex++;
    }
    if (end_date !== undefined) {
      updates.push(`end_date = $${paramIndex}`);
      values.push(end_date);
      paramIndex++;
    }
    if (membership_status !== undefined) {
      updates.push(`membership_status = $${paramIndex}`);
      values.push(membership_status);
      paramIndex++;
    }

    values.push(gymId, userId);

    const query = `
      UPDATE gym_members
      SET ${updates.join(', ')}
      WHERE gym_id = $${paramIndex} AND user_id = $${paramIndex + 1}
      RETURNING *
    `;

    const result = await pool.query(query, values);

    res.json({
      success: true,
      message: '会员信息更新成功',
      data: result.rows[0],
    });
  } catch (error) {
    console.error('更新会员信息失败:', error);
    res.status(500).json({
      success: false,
      error: '更新会员信息失败',
    });
  }
};

/**
 * 移除健身房会员
 * DELETE /api/gyms/:gymId/members/:userId
 */
export const removeGymMember = async (req: Request, res: Response) => {
  try {
    const { gymId, userId } = req.params;

    const result = await pool.query(
      'DELETE FROM gym_members WHERE gym_id = $1 AND user_id = $2 RETURNING *',
      [gymId, userId]
    );

    if (result.rowCount === 0) {
      return res.status(404).json({
        success: false,
        error: '会员不存在',
      });
    }

    res.json({
      success: true,
      message: '会员移除成功',
    });
  } catch (error) {
    console.error('移除会员失败:', error);
    res.status(500).json({
      success: false,
      error: '移除会员失败',
    });
  }
};

/**
 * 获取我的健身房会员资格
 * GET /api/gyms/memberships/me
 */
export const getMyMemberships = async (req: Request, res: Response) => {
  try {
    const userId = req.user!.userId;

    const result = await pool.query(
      `SELECT gm.*, g.name as gym_name, g.address as gym_address
       FROM gym_members gm
       JOIN gyms g ON gm.gym_id = g.id
       WHERE gm.user_id = $1 AND gm.membership_status = $2
       ORDER BY gm.created_at DESC`,
      [userId, 'active']
    );

    res.json({
      success: true,
      data: result.rows,
      count: result.rowCount,
    });
  } catch (error) {
    console.error('获取我的会员资格失败:', error);
    res.status(500).json({
      success: false,
      error: '获取我的会员资格失败',
    });
  }
};

/**
 * 创建健身房
 * POST /api/gyms
 */
export const createGym = async (req: Request, res: Response) => {
  try {
    const { name, description, address, phone } = req.body;

    // 参数验证
    if (!name) {
      return res.status(400).json({
        success: false,
        error: '健身房名称为必填项',
      });
    }

    const owner_id = req.user!.userId;

    const result = await pool.query(
      `INSERT INTO gyms (name, description, address, phone, owner_id)
       VALUES ($1, $2, $3, $4, $5)
       RETURNING *`,
      [name, description || null, address || null, phone || null, owner_id]
    );

    res.status(201).json({
      success: true,
      message: '健身房创建成功',
      data: result.rows[0],
    });
  } catch (error) {
    console.error('创建健身房失败:', error);
    res.status(500).json({
      success: false,
      error: '创建健身房失败',
    });
  }
};

/**
 * 获取健身房列表
 * GET /api/gyms
 */
export const getGyms = async (req: Request, res: Response) => {
  try {
    const { owner_id, status, limit = 20, offset = 0 } = req.query;

    let query = `
      SELECT g.*, u.username as owner_name
      FROM gyms g
      LEFT JOIN users u ON g.owner_id = u.id
      WHERE 1=1
    `;
    const params: any[] = [];
    let paramIndex = 1;

    // 筛选条件
    if (owner_id) {
      query += ` AND g.owner_id = $${paramIndex}`;
      params.push(owner_id);
      paramIndex++;
    }

    if (status) {
      query += ` AND g.status = $${paramIndex}`;
      params.push(status);
      paramIndex++;
    }

    // 只显示激活状态的健身房（除非指定）
    if (!status) {
      query += ` AND g.status = 'active'`;
    }

    // 排序和分页
    query += ` ORDER BY g.created_at DESC LIMIT $${paramIndex} OFFSET $${paramIndex + 1}`;
    params.push(Number(limit), Number(offset));

    const result = await pool.query(query, params);

    res.json({
      success: true,
      data: result.rows,
      count: result.rowCount,
    });
  } catch (error) {
    console.error('获取健身房列表失败:', error);
    res.status(500).json({
      success: false,
      error: '获取健身房列表失败',
    });
  }
};

/**
 * 获取健身房详情
 * GET /api/gyms/:id
 */
export const getGymById = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    const result = await pool.query(
      `SELECT g.*, u.username as owner_name
       FROM gyms g
       LEFT JOIN users u ON g.owner_id = u.id
       WHERE g.id = $1`,
      [id]
    );

    if (result.rowCount === 0) {
      return res.status(404).json({
        success: false,
        error: '健身房不存在',
      });
    }

    // 获取会员数
    const memberCount = await pool.query(
      'SELECT COUNT(*) as count FROM gym_members WHERE gym_id = $1 AND membership_status = $2',
      [id, 'active']
    );

    const data = {
      ...result.rows[0],
      member_count: parseInt(memberCount.rows[0].count),
    };

    res.json({
      success: true,
      data,
    });
  } catch (error) {
    console.error('获取健身房详情失败:', error);
    res.status(500).json({
      success: false,
      error: '获取健身房详情失败',
    });
  }
};

/**
 * 更新健身房
 * PUT /api/gyms/:id
 */
export const updateGym = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { name, description, address, phone, status } = req.body;

    const userId = req.user!.userId;
    const userRole = req.user!.role;

    // 检查健身房是否存在
    const existingGym = await pool.query('SELECT owner_id FROM gyms WHERE id = $1', [id]);
    if (existingGym.rowCount === 0) {
      return res.status(404).json({
        success: false,
        error: '健身房不存在',
      });
    }

    // 权限检查：只有所有者或管理员可以修改
    if (existingGym.rows[0].owner_id !== userId && userRole !== 'admin') {
      return res.status(403).json({
        success: false,
        error: '无权修改此健身房',
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
    if (address !== undefined) {
      updates.push(`address = $${paramIndex}`);
      values.push(address);
      paramIndex++;
    }
    if (phone !== undefined) {
      updates.push(`phone = $${paramIndex}`);
      values.push(phone);
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
      UPDATE gyms
      SET ${updates.join(', ')}
      WHERE id = $${paramIndex}
      RETURNING *
    `;

    const result = await pool.query(query, values);

    res.json({
      success: true,
      message: '健身房更新成功',
      data: result.rows[0],
    });
  } catch (error) {
    console.error('更新健身房失败:', error);
    res.status(500).json({
      success: false,
      error: '更新健身房失败',
    });
  }
};

/**
 * 删除健身房
 * DELETE /api/gyms/:id
 */
export const deleteGym = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const userId = req.user!.userId;
    const userRole = req.user!.role;

    // 检查健身房是否存在
    const existingGym = await pool.query('SELECT owner_id FROM gyms WHERE id = $1', [id]);
    if (existingGym.rowCount === 0) {
      return res.status(404).json({
        success: false,
        error: '健身房不存在',
      });
    }

    // 权限检查：只有所有者或管理员可以删除
    if (existingGym.rows[0].owner_id !== userId && userRole !== 'admin') {
      return res.status(403).json({
        success: false,
        error: '无权删除此健身房',
      });
    }

    await pool.query('DELETE FROM gyms WHERE id = $1', [id]);

    res.json({
      success: true,
      message: '健身房删除成功',
    });
  } catch (error) {
    console.error('删除健身房失败:', error);
    res.status(500).json({
      success: false,
      error: '删除健身房失败',
    });
  }
};

/**
 * 获取我的健身房列表
 * GET /api/gyms/my
 */
export const getMyGyms = async (req: Request, res: Response) => {
  try {
    const userId = req.user!.userId;

    const result = await pool.query(
      'SELECT * FROM gyms WHERE owner_id = $1 ORDER BY created_at DESC',
      [userId]
    );

    res.json({
      success: true,
      data: result.rows,
      count: result.rowCount,
    });
  } catch (error) {
    console.error('获取我的健身房列表失败:', error);
    res.status(500).json({
      success: false,
      error: '获取我的健身房列表失败',
    });
  }
};