// 用户相关类型
export interface User {
  id: string;
  username: string;
  email: string;
  phone?: string;
  avatar?: string;
  role: 'user' | 'admin' | 'coach' | 'gym_admin';
  status: 'active' | 'inactive' | 'banned';
  created_at: string;
}

// 健身计划类型
export interface FitnessPlan {
  id: string;
  name: string;
  description?: string;
  duration_weeks: number;
  difficulty: 'beginner' | 'intermediate' | 'advanced';
  target_goal?: string;
  creator_id: string;
  creator_name?: string;
  is_template: boolean;
  gym_id?: string;
  created_at: string;
  updated_at: string;
}

// 健身房类型
export interface Gym {
  id: string;
  name: string;
  description?: string;
  address?: string;
  phone?: string;
  owner_id: string;
  owner_name?: string;
  status: 'active' | 'inactive';
  member_count?: number;
  created_at: string;
}

// 健身房会员类型
export interface GymMember {
  id: string;
  gym_id: string;
  user_id: string;
  membership_type: 'basic' | 'premium' | 'vip';
  membership_status: 'active' | 'expired' | 'suspended';
  start_date: string;
  end_date?: string;
  username?: string;
  email?: string;
  phone?: string;
  avatar?: string;
}

// 健康数据类型
export interface HealthData {
  id: string;
  user_id: string;
  record_date: string;
  weight?: number;
  height?: number;
  body_fat_percentage?: number;
  muscle_mass?: number;
  heart_rate_resting?: number;
  blood_pressure_systolic?: number;
  blood_pressure_diastolic?: number;
  created_at: string;
}

// 训练日志类型
export interface WorkoutLog {
  id: string;
  user_id: string;
  plan_id?: string;
  plan_name?: string;
  workout_date: string;
  duration_minutes: number;
  calories_burned?: number;
  notes?: string;
  created_at: string;
}

// API 响应类型
export interface ApiResponse<T = any> {
  success: boolean;
  message?: string;
  data?: T;
  count?: number;
  error?: string;
}

// 认证响应类型
export interface AuthResponse {
  user: User;
  token: string;
}