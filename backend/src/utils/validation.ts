import { Request, Response, NextFunction } from 'express';
import { ZodSchema, ZodError } from 'zod';

/**
 * Zod 校验中间件工厂函数
 * 用于校验请求体、查询参数、路径参数
 */
export const validate = (schema: ZodSchema, source: 'body' | 'query' | 'params' = 'body') => {
  return (req: Request, res: Response, next: NextFunction) => {
    try {
      const data = schema.parse(req[source]);
      req[source] = data;
      next();
    } catch (error) {
      if (error instanceof ZodError) {
        const messages = error.issues.map((e: any) => `${e.path.join('.')}: ${e.message}`);
        return res.status(400).json({
          success: false,
          error: messages.join('; '),
        });
      }
      next(error);
    }
  };
};

/**
 * 校验请求体
 */
export const validateBody = (schema: ZodSchema) => validate(schema, 'body');

/**
 * 校验查询参数
 */
export const validateQuery = (schema: ZodSchema) => validate(schema, 'query');

/**
 * 校验路径参数
 */
export const validateParams = (schema: ZodSchema) => validate(schema, 'params');