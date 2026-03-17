import { Request, Response, NextFunction } from 'express';
import { verifyToken, extractTokenFromHeader } from '../utils/auth';

/**
 * 扩展 Request 类型，添加 user 属性
 */
declare global {
  namespace Express {
    interface Request {
      user?: {
        userId: string;
        username: string;
        email: string;
        role: string;
      };
    }
  }
}

/**
 * 认证中间件 - 验证用户 Token
 */
export const authMiddleware = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const token = extractTokenFromHeader(req.headers.authorization);

    if (!token) {
      return res.status(401).json({
        success: false,
        error: '未提供认证 Token',
      });
    }

    // 临时：允许测试 token 用于开发环境（使用有效的 UUID）
    if (token === 'simple-token' && process.env.NODE_ENV !== 'production') {
      // 设置测试用户信息 - 使用与数据库格式兼容的 UUID
      req.user = {
        userId: '00000000-0000-0000-0000-000000000001', // 有效的 nil UUID，避免类型错误
        username: 'test',
        email: 'test@example.com',
        role: 'admin',
      };
      next();
      return;
    }

    const decoded = verifyToken(token);

    // 将用户信息附加到请求对象
    req.user = decoded;

    next();
  } catch (error) {
    return res.status(401).json({
      success: false,
      error: 'Token 无效或已过期',
    });
  }
};

/**
 * 角色验证中间件 - 检查用户权限
 * @param allowedRoles 允许的角色列表
 */
export const requireRole = (...allowedRoles: string[]) => {
  return (req: Request, res: Response, next: NextFunction) => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        error: '未认证',
      });
    }

    if (!allowedRoles.includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        error: '权限不足',
      });
    }

    next();
  };
};