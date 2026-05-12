import dotenv from 'dotenv';

// 先加载环境变量
dotenv.config();

import { Pool } from 'pg';

/**
 * 数据库连接配置
 * 支持两种配置方式：
 * 1. DATABASE_URL（推荐）: 完整的连接字符串，用于 Supabase 等云数据库
 * 2. 分离配置项: DB_HOST, DB_PORT, DB_NAME, DB_USER, DB_PASSWORD，用于本地数据库
 */

const connectionString = process.env.DATABASE_URL;

let poolConfig: any = {
  max: 20, // 最大连接数
  idleTimeoutMillis: 30000, // 空闲连接超时时间
  connectionTimeoutMillis: 2000, // 连接超时时间
};

if (connectionString) {
  // 优先使用连接字符串
  poolConfig.connectionString = connectionString;
  // 仅云数据库（supabase.co 等）需要 SSL，本地连接禁用 SSL
  if (connectionString.includes('supabase.co') || connectionString.includes('amazonaws.com')) {
    poolConfig.ssl = { rejectUnauthorized: false };
  } else if (connectionString.includes('localhost') || connectionString.includes('127.0.0.1')) {
    poolConfig.ssl = false;
  }
  console.log('🔗 使用连接字符串配置数据库 (SSL:', poolConfig.ssl !== false ? '启用' : '禁用', ')');
} else {
  // 使用分离的配置项（用于本地 PostgreSQL）
  poolConfig.host = process.env.DB_HOST || 'localhost';
  poolConfig.port = parseInt(process.env.DB_PORT || '5432');
  poolConfig.database = process.env.DB_NAME || 'smart_fitness';
  poolConfig.user = process.env.DB_USER || 'postgres';
  poolConfig.password = process.env.DB_PASSWORD || '';
  console.log('🔗 使用本地配置连接数据库');
}

console.log('数据库配置检查:', {
  hasConnectionString: !!connectionString,
  hasDbHost: !!process.env.DB_HOST,
});

// 创建数据库连接池
const pool = new Pool(poolConfig);

// 测试数据库连接
pool.on('connect', () => {
  console.log('✅ 数据库连接成功');
});

pool.on('error', (err) => {
  console.error('❌ 数据库连接错误:', err.message);
});

export default pool;