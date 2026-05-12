import dotenv from 'dotenv';
dotenv.config();

import express from 'express';
import cors from 'cors';
import path from 'path';
import pool from './config/database';
import authRoutes from './routes/authRoutes';
import userRoutes from './routes/userRoutes';
import planRoutes from './routes/planRoutes';
import gymRoutes from './routes/gymRoutes';
import healthDataRoutes from './routes/healthDataRoutes';
import workoutRoutes from './routes/workoutRoutes';
import exerciseRoutes from './routes/exerciseRoutes';
import achievementRoutes from './routes/achievementRoutes';
import subscriptionRoutes from './routes/subscriptionRoutes';
import { errorHandler } from './middleware/errorHandler';
import SwaggerDoc from '../swagger';

const app = express();
const PORT = process.env.PORT || 3001;

// 请求日志（仅记录方法和路径，不打印敏感信息）
app.use((req, res, next) => {
  console.log(`${new Date().toISOString()} - ${req.method} ${req.path}`);
  next();
});

app.use(cors({
  origin: process.env.CLIENT_URL || 'http://localhost:5173',
  credentials: true,
}));
// 增加请求体大小限制以支持 base64 头像上传
app.use(express.json({ limit: '5mb' }));
app.use(express.urlencoded({ extended: true, limit: '5mb' }));

// 静态文件服务 - 头像上传
app.use('/uploads', express.static(path.join(__dirname, '../uploads')));

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
app.use('/api/exercises', exerciseRoutes);
app.use('/api/achievements', achievementRoutes);
app.use('/api/subscriptions', subscriptionRoutes);

// 404 处理
app.use((req, res) => {
  console.log(`❌ 404 - ${req.path}`);
  res.status(404).json({ 
    success: false, 
    error: '请求的资源不存在',
    path: req.path 
  });
});

// 统一错误处理中间件
app.use(errorHandler);

// 集成 Swagger API 文档
SwaggerDoc(app);

// 启动服务器
app.listen(PORT, () => {
  console.log(`Server running on: http://localhost:${PORT}`);
  console.log(`Health check: http://localhost:${PORT}/health`);
  console.log(`API Docs: http://localhost:${PORT}/api-docs`);
  console.log(`\n========================================`);
  console.log(`🏋  Smart Fitness SaaS API Server`);
  console.log(`========================================`);
  console.log(`Environment: ${process.env.NODE_ENV || 'development'}`);
  console.log(`Client URL (CORS): ${process.env.CLIENT_URL || 'http://localhost:5173'}`);
  console.log(`Server running on: http://localhost:${PORT}`);
  console.log(`Health check: http://localhost:${PORT}/health`);
  console.log(`========================================\n`);
});