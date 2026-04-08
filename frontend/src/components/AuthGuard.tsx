import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuthStore } from '../stores/authStore';

export interface AuthGuardProps {
  /** 子元素 */
  children: React.ReactNode;
  /** 允许的角色列表，为空则只检查登录状态 */
  allowedRoles?: string[];
}

/**
 * 认证守卫组件
 * 用于保护需要登录或特定角色的路由
 */
export const AuthGuard: React.FC<AuthGuardProps> = ({ children, allowedRoles }) => {
  const location = useLocation();
  const { isAuthenticated, user } = useAuthStore();

  // 检查是否已登录
  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  // 检查角色权限
  if (allowedRoles && allowedRoles.length > 0 && user) {
    if (!allowedRoles.includes(user.role)) {
      return <Navigate to="/" replace />;
    }
  }

  return <>{children}</>;
};

/**
 * 公开路由守卫组件
 * 已登录用户访问登录/注册页时重定向到首页
 */
export const PublicAuthGuard: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const location = useLocation();
  const { isAuthenticated } = useAuthStore();

  if (isAuthenticated) {
    const from = (location.state as { from?: string })?.from || '/';
    return <Navigate to={from} replace />;
  }

  return <>{children}</>;
};