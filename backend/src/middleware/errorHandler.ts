import { Request, Response, NextFunction } from 'express';
import { AppError } from '../utils/errors';

/**
 * 统一错误处理中间件
 */
export const errorHandler = (
  err: Error | AppError,
  req: Request,
  res: Response,
  _next: NextFunction
) => {
  console.error('❌ 错误:', err.message);
  console.error('📍 路径:', req.method, req.path);

  // 如果是自定义的应用错误
  if (err instanceof AppError) {
    return res.status(err.statusCode).json({
      success: false,
      error: err.message,
    });
  }

  // PostgreSQL 唯一约束冲突
  if (err.message.includes('duplicate key') || err.message.includes('unique constraint')) {
    return res.status(409).json({
      success: false,
      error: '资源已存在',
    });
  }

  // PostgreSQL 外键约束错误
  if (err.message.includes('foreign key constraint')) {
    return res.status(400).json({
      success: false,
      error: '关联资源不存在',
    });
  }

  // JWT 错误
  if (err.message.includes('jwt') || err.message.includes('token')) {
    return res.status(401).json({
      success: false,
      error: '认证失败，请重新登录',
    });
  }

  // 默认服务器错误
  return res.status(500).json({
    success: false,
    error: process.env.NODE_ENV === 'production' ? '服务器内部错误' : err.message,
  });
};

/**
 * 异步路由包装器
 * 用于自动捕获异步错误并传递给错误中间件
 */
export const asyncHandler = (fn: Function) => {
  return (req: Request, res: Response, next: NextFunction) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
};