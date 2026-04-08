/**
 * 自定义应用错误类
 * 用于统一错误处理
 */
export class AppError extends Error {
  public readonly statusCode: number;
  public readonly isOperational: boolean;

  constructor(message: string, statusCode: number = 500, isOperational: boolean = true) {
    super(message);
    this.statusCode = statusCode;
    this.isOperational = isOperational;

    // 确保原型链正确
    Object.setPrototypeOf(this, AppError.prototype);
  }
}

/**
 * 资源未找到错误 (404)
 */
export class NotFoundError extends AppError {
  constructor(resource: string = '资源') {
    super(`${resource}不存在`, 404);
  }
}

/**
 * 验证错误 (400)
 */
export class ValidationError extends AppError {
  constructor(message: string = '参数验证失败') {
    super(message, 400);
  }
}

/**
 * 认证错误 (401)
 */
export class UnauthorizedError extends AppError {
  constructor(message: string = '未认证') {
    super(message, 401);
  }
}

/**
 * 权限错误 (403)
 */
export class ForbiddenError extends AppError {
  constructor(message: string = '无权访问') {
    super(message, 403);
  }
}

/**
 * 冲突错误 (409) - 如重复创建
 */
export class ConflictError extends AppError {
  constructor(message: string = '资源冲突') {
    super(message, 409);
  }
}

/**
 * 数据库错误 (500)
 */
export class DatabaseError extends AppError {
  constructor(message: string = '数据库操作失败') {
    super(message, 500);
  }
}