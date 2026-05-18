import { create } from 'zustand';
import type { User } from '../types';

interface AuthState {
  token: string | null;
  user: User | null;
  isAuthenticated: boolean;
  isValidating: boolean;

  /** 登录成功后调用，保存 token 和用户信息 */
  login: (token: string, user: User) => void;
  /** 退出登录，清除所有状态 */
  logout: () => void;
  /** 更新用户信息（编辑资料、更新头像等） */
  setUser: (user: User) => void;
  /** 从 localStorage 恢复状态（应用初始化时调用） */
  hydrate: () => void;
  /** 验证 token 有效性，无效则清除状态 */
  validateToken: () => Promise<void>;
}

export const useAuthStore = create<AuthState>((set, get) => ({
  token: null,
  user: null,
  isAuthenticated: false,
  isValidating: false,

  login: (token, user) => {
    localStorage.setItem('token', token);
    localStorage.setItem('user', JSON.stringify(user));
    set({ token, user, isAuthenticated: true, isValidating: false });
  },

  logout: () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    set({ token: null, user: null, isAuthenticated: false, isValidating: false });
  },

  setUser: (user) => {
    localStorage.setItem('user', JSON.stringify(user));
    set({ user });
  },

  hydrate: () => {
    const token = localStorage.getItem('token');
    const userData = localStorage.getItem('user');
    if (token && userData) {
      try {
        const user = JSON.parse(userData) as User;
        set({ token, user, isAuthenticated: true, isValidating: true });
        // hydrate 后立即验证 token 有效性
        get().validateToken();
      } catch {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        set({ token: null, user: null, isAuthenticated: false, isValidating: false });
      }
    }
  },

  validateToken: async () => {
    const token = get().token;
    if (!token) {
      set({ isAuthenticated: false, isValidating: false });
      return;
    }

    try {
      // 动态导入避免循环依赖
      const { apiClient } = await import('../services/api');
      const res = await apiClient.get<any, { success: boolean; data?: User }>('/auth/me');
      if (res.success && res.data) {
        localStorage.setItem('user', JSON.stringify(res.data));
        set({ user: res.data, isAuthenticated: true, isValidating: false });
      } else {
        // 响应成功但数据异常，清除状态并跳转
        get().logout();
        window.location.href = '/login';
      }
    } catch {
      // token 无效或过期（401），拦截器已处理 logout 和跳转，这里只需更新验证状态
      set({ isAuthenticated: false, isValidating: false });
    }
  },
}));