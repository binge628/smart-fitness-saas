import axios from 'axios';
import pool from '../config/database';

// AI 配置
const AI_CONFIG = {
  provider: process.env.AI_PROVIDER || 'openai',
  apiKey: process.env.AI_API_KEY || '',
  model: process.env.AI_MODEL || 'gpt-4o-mini',
  baseUrl: process.env.AI_BASE_URL || '',
  maxTokens: parseInt(process.env.AI_MAX_TOKENS || '1000'),
  temperature: parseFloat(process.env.AI_TEMPERATURE || '0.7'),
};

// API 端点配置
const API_ENDPOINTS: Record<string, { url: string; path: string }> = {
  openai: {
    url: 'https://api.openai.com',
    path: '/v1/chat/completions',
  },
  anthropic: {
    url: 'https://api.anthropic.com',
    path: '/v1/messages',
  },
  deepseek: {
    url: 'https://api.deepseek.com',
    path: '/v1/chat/completions',
  },
  ollama: {
    url: AI_CONFIG.baseUrl || 'http://localhost:11434/v1',
    path: '/chat/completions',
  },
};

// 消息类型
interface Message {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

// 请求选项
interface CompletionOptions {
  maxTokens?: number;
  temperature?: number;
  stream?: boolean;
}

// 用户上下文数据
interface UserContext {
  profile: {
    username: string;
    age?: number;
    gender?: string;
    height?: number;
    weight?: number;
    fitness_goal?: string;
  };
  recentWorkouts: any[];
  healthMetrics: any[];
  stats: {
    totalWorkouts: number;
    totalDuration: number;
    currentStreak: number;
  };
}

/**
 * 创建聊天完成请求
 * 支持多供应商切换（OpenAI、Anthropic、DeepSeek、Ollama）
 */
export const createChatCompletion = async (
  messages: Message[],
  options: CompletionOptions = {}
): Promise<{ content: string; usage?: any }> => {
  const { provider, apiKey, model, maxTokens, temperature } = AI_CONFIG;

  if (!apiKey && provider !== 'ollama') {
    throw new Error('AI_API_KEY 未配置');
  }

  const endpoint = API_ENDPOINTS[provider];
  if (!endpoint) {
    throw new Error(`不支持的 AI 供应商: ${provider}`);
  }

  const url = AI_CONFIG.baseUrl
    ? `${AI_CONFIG.baseUrl}${endpoint.path}`
    : `${endpoint.url}${endpoint.path}`;

  try {
    // Anthropic 使用不同的请求格式
    if (provider === 'anthropic') {
      const response = await axios.post(
        url,
        {
          model: model,
          max_tokens: options.maxTokens || maxTokens,
          temperature: options.temperature || temperature,
          messages: messages.filter((m) => m.role !== 'system'),
          system: messages.find((m) => m.role === 'system')?.content,
        },
        {
          headers: {
            'Content-Type': 'application/json',
            'x-api-key': apiKey,
            'anthropic-version': '2023-06-01',
          },
          timeout: 60000,
        }
      );

      return {
        content: response.data.content[0]?.text || '',
        usage: response.data.usage,
      };
    }

    // OpenAI / DeepSeek / Ollama 使用统一格式
    const response = await axios.post(
      url,
      {
        model: model,
        messages: messages,
        max_tokens: options.maxTokens || maxTokens,
        temperature: options.temperature || temperature,
        stream: options.stream || false,
      },
      {
        headers: {
          'Content-Type': 'application/json',
          Authorization: provider === 'ollama' ? undefined : `Bearer ${apiKey}`,
        },
        timeout: 60000,
      }
    );

    return {
      content: response.data.choices[0]?.message?.content || '',
      usage: response.data.usage,
    };
  } catch (error: any) {
    console.error('AI 调用失败:', error.response?.data || error.message);
    throw formatAIError(error);
  }
};

/**
 * 构建用户上下文
 * 查询用户基本信息、最近训练数据和健康指标
 */
export const buildUserContext = async (userId: string): Promise<UserContext> => {
  try {
    // 查询用户基本信息
    const userResult = await pool.query(
      'SELECT username, age, gender, height, weight, fitness_goal FROM users WHERE id = $1',
      [userId]
    );
    const profile = userResult.rows[0] || { username: '用户' };

    // 查询最近 30 天训练数据
    const workoutsResult = await pool.query(
      `SELECT wl.*, fp.name as plan_name,
        json_agg(
          json_build_object(
            'exercise_name', e.name,
            'muscle_group', e.muscle_group,
            'weight', ws.weight,
            'reps', ws.reps,
            'set_order', ws.set_order
          ) ORDER BY ws.set_order
        ) FILTER (WHERE ws.id IS NOT NULL) as sets
       FROM workout_logs wl
       LEFT JOIN fitness_plans fp ON wl.plan_id = fp.id
       LEFT JOIN workout_sets ws ON wl.id = ws.workout_id
       LEFT JOIN exercises e ON ws.exercise_id = e.id
       WHERE wl.user_id = $1 AND wl.workout_date >= CURRENT_DATE - INTERVAL '30 days'
       GROUP BY wl.id, fp.name
       ORDER BY wl.workout_date DESC
       LIMIT 10`,
      [userId]
    );

    // 查询最近健康指标
    const healthResult = await pool.query(
      `SELECT * FROM health_data
       WHERE user_id = $1
       ORDER BY recorded_at DESC
       LIMIT 5`,
      [userId]
    );

    // 查询统计数据
    const statsResult = await pool.query(
      `SELECT
        COUNT(*) as total_workouts,
        COALESCE(SUM(duration_minutes), 0) as total_duration
       FROM workout_logs
       WHERE user_id = $1`,
      [userId]
    );

    // 计算连续打卡天数
    const streakResult = await pool.query(
      `WITH daily_workouts AS (
        SELECT DISTINCT workout_date::date as date
        FROM workout_logs
        WHERE user_id = $1
        ORDER BY date DESC
      ),
      streak_calc AS (
        SELECT date,
          date - (ROW_NUMBER() OVER (ORDER BY date))::int as streak_group
        FROM daily_workouts
      )
      SELECT COUNT(*) as streak
      FROM streak_calc
      WHERE streak_group = (SELECT streak_group FROM streak_calc ORDER BY date DESC LIMIT 1)`,
      [userId]
    );

    return {
      profile: {
        username: profile.username,
        age: profile.age,
        gender: profile.gender,
        height: profile.height,
        weight: profile.weight,
        fitness_goal: profile.fitness_goal,
      },
      recentWorkouts: workoutsResult.rows,
      healthMetrics: healthResult.rows,
      stats: {
        totalWorkouts: parseInt(statsResult.rows[0]?.total_workouts || '0'),
        totalDuration: parseInt(statsResult.rows[0]?.total_duration || '0'),
        currentStreak: parseInt(streakResult.rows[0]?.streak || '0'),
      },
    };
  } catch (error) {
    console.error('构建用户上下文失败:', error);
    // 返回默认上下文，不阻塞用户
    return {
      profile: { username: '用户' },
      recentWorkouts: [],
      healthMetrics: [],
      stats: { totalWorkouts: 0, totalDuration: 0, currentStreak: 0 },
    };
  }
};

/**
 * 格式化用户上下文为 Prompt 文本
 */
export const formatUserContextForPrompt = (context: UserContext): string => {
  const { profile, recentWorkouts, healthMetrics, stats } = context;

  let prompt = `用户基本信息:\n`;
  prompt += `- 用户名: ${profile.username}\n`;
  if (profile.age) prompt += `- 年龄: ${profile.age}岁\n`;
  if (profile.gender) prompt += `- 性别: ${profile.gender === 'male' ? '男' : profile.gender === 'female' ? '女' : profile.gender}\n`;
  if (profile.height) prompt += `- 身高: ${profile.height}cm\n`;
  if (profile.weight) prompt += `- 体重: ${profile.weight}kg\n`;
  if (profile.fitness_goal) prompt += `- 健身目标: ${profile.fitness_goal}\n`;

  prompt += `\n训练统计:\n`;
  prompt += `- 累计训练: ${stats.totalWorkouts}次\n`;
  prompt += `- 总训练时长: ${Math.floor(stats.totalDuration / 60)}小时${stats.totalDuration % 60}分钟\n`;
  prompt += `- 连续打卡: ${stats.currentStreak}天\n`;

  if (recentWorkouts.length > 0) {
    prompt += `\n最近训练记录:\n`;
    recentWorkouts.slice(0, 5).forEach((workout, index) => {
      prompt += `${index + 1}. ${workout.workout_date}: ${workout.plan_name || '自定义训练'}, 时长${workout.duration_minutes}分钟`;
      if (workout.calories_burned) {
        prompt += `, 消耗${workout.calories_burned}卡路里`;
      }
      prompt += `\n`;
    });
  }

  if (healthMetrics.length > 0) {
    prompt += `\n最近健康指标:\n`;
    healthMetrics.forEach((metric, index) => {
      prompt += `${index + 1}. ${metric.recorded_at}: `;
      if (metric.weight) prompt += `体重${metric.weight}kg `;
      if (metric.body_fat) prompt += `体脂${metric.body_fat}% `;
      if (metric.heart_rate) prompt += `心率${metric.heart_rate}bpm `;
      if (metric.blood_pressure) prompt += `血压${metric.blood_pressure} `;
      prompt += `\n`;
    });
  }

  return prompt;
};

/**
 * 格式化 AI 错误
 */
const formatAIError = (error: any): Error => {
  if (error.response) {
    const status = error.response.status;
    const data = error.response.data;

    if (status === 401) {
      return new Error('AI 服务认证失败，请检查 API 密钥配置');
    } else if (status === 429) {
      return new Error('AI 服务请求过于频繁，请稍后再试');
    } else if (status === 500) {
      return new Error('AI 服务内部错误，请稍后重试');
    } else {
      return new Error(`AI 服务错误: ${data?.error?.message || error.message}`);
    }
  }

  if (error.code === 'ECONNABORTED') {
    return new Error('AI 服务请求超时，请稍后重试');
  }

  return new Error(`AI 服务调用失败: ${error.message}`);
};

/**
 * 检查 AI 配置是否有效
 */
export const isAIConfigured = (): boolean => {
  if (AI_CONFIG.provider === 'ollama') {
    return true; // Ollama 本地运行不需要 API Key
  }
  return !!AI_CONFIG.apiKey && AI_CONFIG.apiKey !== 'your_api_key_here';
};

export default {
  createChatCompletion,
  buildUserContext,
  formatUserContextForPrompt,
  isAIConfigured,
};
