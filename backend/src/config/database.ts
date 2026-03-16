import { Pool } from 'pg';

// 数据库连接池配置
const pool = new Pool({
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT || '5432'),
  database: process.env.DB_NAME || 'smart_fitness',
  user: process.env.DB_USER || 'postgres',
  password: process.env.DB_PASSWORD || '',
  max: 20, // 最大连接数
  idleTimeoutMillis: 30000, // 空闲连接超时时间
  connectionTimeoutMillis: 2000, // 连接超时时间
});

// 测试数据库连接
pool.on('connect', () => {
  console.log('✓ 数据库连接成功');
});

pool.on('error', (err) => {
  console.error('✗ 数据库连接错误:', err);
});

export default pool;