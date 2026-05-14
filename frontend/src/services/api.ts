import axios from 'axios';
import type { ApiResponse, AuthResponse, User, FitnessPlan, Gym, GymMember, HealthData, WorkoutLog, Exercise, WorkoutSet, Subscription, SubscriptionPlan, AIMessage } from '../types';
import { useAuthStore } from '../stores/authStore';

const BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001';

// 创建 axios 实例
const apiClient = axios.create({
  baseURL: `${BASE_URL}/api`,
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// 请求拦截器 - 添加 Token
apiClient.interceptors.request.use(
  (config) => {
    const token = useAuthStore.getState().token;
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// 响应拦截器 - 统一处理错误
apiClient.interceptors.response.use(
  (response) => {
    return response.data;
  },
  (error) => {
    console.error('[API Error]', error.response?.data || error.message);
    if (error.response?.status === 401) {
      useAuthStore.getState().logout();
      window.location.href = '/login';
    }
    return Promise.reject(error.response?.data || error.message);
  }
);

// 补全头像相对路径为完整 URL
const resolveAvatarUrl = (user: User | undefined): User | undefined => {
  if (user?.avatar && user.avatar.startsWith('/uploads/')) {
    return { ...user, avatar: `${BASE_URL}${user.avatar}` };
  }
  return user;
};

// 认证服务
export const authService = {
  // 注册
  register: (data: { username: string; email: string; password: string; phone?: string }) =>
    apiClient.post<any, ApiResponse<AuthResponse>>('/auth/register', data),

  // 登录
  login: (data: { username: string; password: string }) =>
    apiClient.post<any, ApiResponse<AuthResponse>>('/auth/login', data),

  // 获取当前用户
  getMe: async () => {
    const res = await apiClient.get<any, ApiResponse<User>>('/auth/me');
    return { ...res, data: resolveAvatarUrl(res.data) };
  },

  // 更新当前用户信息
  updateMe: async (data: { username?: string; email?: string; phone?: string; avatar?: string }) => {
    const res = await apiClient.put<any, ApiResponse<User>>('/auth/me', data);
    return { ...res, data: resolveAvatarUrl(res.data) };
  },

  // 修改密码
  changePassword: (data: { oldPassword: string; newPassword: string }) =>
    apiClient.put<any, ApiResponse<void>>('/auth/me/password', data),
};

// 用户服务
export const userService = {
  // 获取用户列表（管理员）
  getUsers: () => apiClient.get<any, ApiResponse<User[]>>('/users'),

  // 获取指定用户
  getUserById: (id: string) =>
    apiClient.get<any, ApiResponse<User>>(`/users/${id}`),

  // 上传头像
  uploadAvatar: async (file: File): Promise<ApiResponse<User>> => {
    const formData = new FormData();
    formData.append('avatar', file);
    const response = await apiClient.post<any, ApiResponse<User>>('/users/me/avatar', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return { ...response, data: resolveAvatarUrl(response.data) };
  },
};

// 健身计划服务
export const planService = {
  // 获取计划列表
  getPlans: (params?: { is_template?: boolean; difficulty?: string; creator_id?: string; limit?: number; offset?: number }) =>
    apiClient.get<any, ApiResponse<FitnessPlan[]>>('/plans', { params }),

  // 获取我的计划
  getMyPlans: () => apiClient.get<any, ApiResponse<FitnessPlan[]>>('/plans/my'),

  // 获取计划详情
  getPlanById: (id: string) =>
    apiClient.get<any, ApiResponse<FitnessPlan>>(`/plans/${id}`),

  // 创建计划
  createPlan: (data: Partial<FitnessPlan>) =>
    apiClient.post<any, ApiResponse<FitnessPlan>>('/plans', data),

  // 更新计划
  updatePlan: (id: string, data: Partial<FitnessPlan>) =>
    apiClient.put<any, ApiResponse<FitnessPlan>>(`/plans/${id}`, data),

  // 删除计划
  deletePlan: (id: string) =>
    apiClient.delete<any, ApiResponse<void>>(`/plans/${id}`),
};

// 健身房服务
export const gymService = {
  // 获取健身房列表
  getGyms: (params?: { owner_id?: string; status?: string; limit?: number; offset?: number }) =>
    apiClient.get<any, ApiResponse<Gym[]>>('/gyms', { params }),

  // 获取我的健身房
  getMyGyms: () => apiClient.get<any, ApiResponse<Gym[]>>('/gyms/my'),

  // 获取健身房详情
  getGymById: (id: string) =>
    apiClient.get<any, ApiResponse<Gym>>(`/gyms/${id}`),

  // 创建健身房
  createGym: (data: Partial<Gym>) =>
    apiClient.post<any, ApiResponse<Gym>>('/gyms', data),

  // 更新健身房
  updateGym: (id: string, data: Partial<Gym>) =>
    apiClient.put<any, ApiResponse<Gym>>(`/gyms/${id}`, data),

  // 删除健身房
  deleteGym: (id: string) =>
    apiClient.delete<any, ApiResponse<void>>(`/gyms/${id}`),

  // 获取健身房会员列表
  getGymMembers: (gymId: string, params?: { status?: string; limit?: number; offset?: number }) =>
    apiClient.get<any, ApiResponse<GymMember[]>>(`/gyms/${gymId}/members`, { params }),

  // 添加会员
  addMember: (gymId: string, data: { user_id: string; membership_type: string; start_date: string; end_date?: string }) =>
    apiClient.post<any, ApiResponse<GymMember>>(`/gyms/${gymId}/members`, data),

  // 更新会员
  updateMember: (gymId: string, userId: string, data: Partial<GymMember>) =>
    apiClient.put<any, ApiResponse<GymMember>>(`/gyms/${gymId}/members/${userId}`, data),

  // 移除会员
  removeMember: (gymId: string, userId: string) =>
    apiClient.delete<any, ApiResponse<void>>(`/gyms/${gymId}/members/${userId}`),

  // 获取我的会员资格
  getMyMemberships: () =>
    apiClient.get<any, ApiResponse<GymMember[]>>('/gyms/memberships/me'),
};

// 健康数据服务
export const healthService = {
  // 获取健康数据列表
  getHealthData: (params?: { start_date?: string; end_date?: string; limit?: number; offset?: number }) =>
    apiClient.get<any, ApiResponse<HealthData[]>>('/health-data', { params }),

  // 获取健康数据统计
  getStats: (params?: { start_date?: string; end_date?: string }) =>
    apiClient.get<any, ApiResponse<any>>('/health-data/stats', { params }),

  // 获取指定日期数据
  getHealthDataByDate: (date: string) =>
    apiClient.get<any, ApiResponse<HealthData>>(`/health-data/date/${date}`),

  // 创建健康数据
  createHealthData: (data: Partial<HealthData>) =>
    apiClient.post<any, ApiResponse<HealthData>>('/health-data', data),

  // 更新健康数据
  updateHealthData: (id: string, data: Partial<HealthData>) =>
    apiClient.put<any, ApiResponse<HealthData>>(`/health-data/${id}`, data),

  // 删除健康数据
  deleteHealthData: (id: string) =>
    apiClient.delete<any, ApiResponse<void>>(`/health-data/${id}`),
};

// 训练日志服务
export const workoutService = {
  // 获取训练日志列表
  getWorkouts: (params?: { plan_id?: string; start_date?: string; end_date?: string; limit?: number; offset?: number }) =>
    apiClient.get<any, ApiResponse<WorkoutLog[]>>('/workouts', { params }),

  // 获取训练统计
  getStats: (params?: { start_date?: string; end_date?: string }) =>
    apiClient.get<any, ApiResponse<any>>('/workouts/stats', { params }),

  // 获取训练日志详情
  getWorkoutById: (id: string) =>
    apiClient.get<any, ApiResponse<WorkoutLog>>(`/workouts/${id}`),

  // 创建训练日志
  createWorkout: (data: Partial<WorkoutLog>) =>
    apiClient.post<any, ApiResponse<WorkoutLog>>('/workouts', data),

  // 更新训练日志
  updateWorkout: (id: string, data: Partial<WorkoutLog>) =>
    apiClient.put<any, ApiResponse<WorkoutLog>>(`/workouts/${id}`, data),

  // 删除训练日志
  deleteWorkout: (id: string) =>
    apiClient.delete<any, ApiResponse<void>>(`/workouts/${id}`),
};

// 动作库服务
export const exerciseService = {
  // 获取动作列表
  getExercises: (params?: { muscle_group?: string; category?: string; search?: string; limit?: number }) =>
    apiClient.get<any, ApiResponse<Exercise[]>>('/exercises', { params }),

  // 获取动作详情
  getExerciseById: (id: string) =>
    apiClient.get<any, ApiResponse<Exercise>>(`/exercises/${id}`),

  // 创建自定义动作
  createExercise: (data: { name: string; muscle_group: string; category: string; description?: string }) =>
    apiClient.post<any, ApiResponse<Exercise>>('/exercises', data),
};

// 成就服务
export const achievementService = {
  // 获取成就列表（含解锁状态和进度）
  getAchievements: () =>
    apiClient.get<any, any>('/achievements'),

  // 获取成就统计
  getStats: () =>
    apiClient.get<any, ApiResponse<{ total: number; unlocked: number; locked: number }>>('/achievements/stats'),

  // 检查并解锁新成就
  checkAchievements: () =>
    apiClient.post<any, any>('/achievements/check'),
};

// 订阅服务
export const subscriptionService = {
  // 获取套餐价格列表（公开）
  getPlans: () =>
    apiClient.get<any, ApiResponse<SubscriptionPlan[]>>('/subscriptions/plans'),

  // 获取当前用户订阅
  getMySubscription: () =>
    apiClient.get<any, any>('/subscriptions/my'),

  // 订阅/续费
  subscribe: (data: { plan_type: 'monthly' | 'yearly'; payment_method?: string }) =>
    apiClient.post<any, any>('/subscriptions/subscribe', data),

  // 取消订阅
  cancelSubscription: () =>
    apiClient.put<any, ApiResponse<Subscription>>('/subscriptions/cancel'),
};

// AI 助手服务
export const aiService = {
  // 检查 AI 服务状态
  checkStatus: () =>
    apiClient.get<any, ApiResponse<{ configured: boolean; provider: string }>>('/ai/status'),

  // AI 对话
  chat: (data: { message: string; type?: 'training' | 'nutrition' | 'plan' | 'general' }) =>
    apiClient.post<any, ApiResponse<{ reply: string; is_fallback: boolean }>>('/ai/chat', data),

  // 获取训练建议
  getTrainingAdvice: (data?: { focus_area?: string }) =>
    apiClient.post<any, ApiResponse<{ reply: string; is_fallback: boolean }>>('/ai/training-advice', data || {}),

  // 获取营养建议
  getNutritionAdvice: (data?: { focus_area?: string }) =>
    apiClient.post<any, ApiResponse<{ reply: string; is_fallback: boolean }>>('/ai/nutrition-advice', data || {}),

  // 获取计划推荐
  getPlanSuggestion: () =>
    apiClient.get<any, ApiResponse<{ reply: string; is_fallback: boolean }>>('/ai/plan-suggestion'),
};

export default apiClient;