import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';

// JWT 配置
const JWT_SECRET = process.env.JWT_SECRET || 'dev_jwt_secret_key_change_in_production';
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '7d';

/**
 * JWT payload 类型
 */
export interface JwtPayload {
  userId: string;
  username: string;
  email: string;
  role: string;
}

/**
 * 生成 JWT Token
 */
export const generateToken = (payload: Omit<JwtPayload, 'role'> & { role?: string }): string => {
  return jwt.sign(payload, JWT_SECRET, {
    expiresIn: JWT_EXPIRES_IN,
  });
};

/**
 * 验证 JWT Token
 */
export const verifyToken = (token: string): JwtPayload => {
  try {
    return jwt.verify(token, JWT_SECRET) as JwtPayload;
  } catch (error) {
    throw new Error('Invalid or expired token');
  }
};

/**
 * 加密密码
 */
export const hashPassword = async (password: string): Promise<string> => {
  const salt = await bcrypt.genSalt(10);
  return bcrypt.hash(password, salt);
};

/**
 * 比对密码
 */
export const comparePassword = async (password: string, hash: string): Promise<boolean> => {
  try {
    const result = await bcrypt.compare(password, hash);
    console.log('🔐 密码比对结果:', { password, hash: hash.substring(0, 30) + '...', result });
    return result;
  } catch (error) {
    console.error('❌ 密码比对失败:', error);
    throw error;
  }
};

/**
 * 从请求头中提取 Token
 */
export const extractTokenFromHeader = (authHeader: string | undefined): string | null => {
  if (!authHeader) return null;
  const parts = authHeader.split(' ');
  if (parts.length !== 2 || parts[0] !== 'Bearer') return null;
  return parts[1];
};