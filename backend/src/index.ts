import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import pool from './config/database';
import authRoutes from './routes/authRoutes';
import userRoutes from './routes/userRoutes';
import planRoutes from './routes/planRoutes';
import gymRoutes from './routes/gymRoutes';
import healthDataRoutes from './routes/healthDataRoutes';
import workoutRoutes from './routes/workoutRoutes';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3001;

// 中间件
app.use(cors({
  origin: process.env.CLIENT_URL || 'http://localhost:5173',
  credentials: true,
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// 请求日志（开发环境）
if (process.env.NODE_ENV === 'development') {
  app.use((req, res, next) => {
    console.log(`${new Date().toISOString()} - ${req.method} ${req.path}`);
    next();
  });
}

// 健康检查
app.get('/health', async (req, res) => {
  try {
    // 测试数据库连接
    const dbResult = await pool.query('SELECT NOW()');
    res.json({
      status: 'ok',
      message: 'Smart Fitness SaaS API is running',
      database: 'connected',
      dbTime: dbResult.rows[0].now,
    });
  } catch (error) {
    res.json({
      status: 'error',
      message: 'API running but database disconnected',
      error: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

// API 路由前缀和基础路由
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/plans', planRoutes);
app.use('/api/gyms', gymRoutes);
app.use('/api/health-data', healthDataRoutes);
app.use('/api/workouts', workoutRoutes);

// 404 处理
app.use((req, res) => {
  res.status(404).json({ error: 'Not Found', path: req.path });
});

// 全局错误处理
app.use((err: Error, req: express.Request, res: express.Response, next: express.NextFunction) => {
  console.error('Error:', err);
  res.status(500).json({ error: err.message || 'Internal Server Error' });
});

// 启动服务器
app.listen(PORT, () => {
  console.log(`\n========================================`);
  console.log(`🏋  Smart Fitness SaaS API Server`);
  console.log(`========================================`);
  console.log(`Environment: ${process.env.NODE_ENV || 'development'}`);
  console.log(`Server running on: http://localhost:${PORT}`);
  console.log(`Health check: http://localhost:${PORT}/health`);
  console.log(`========================================\n`);
});