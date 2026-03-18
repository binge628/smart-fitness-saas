import React from 'react';
import * as Permission from '../utils/permission';

export interface PermissionGuardProps {
  /** 权限检查类型：role(角色)、any(任意角色)、all(所有角色) */
  type?: 'role' | 'any' | 'all';
  /** 需要的角色列表 */
  roles: string | string[];
  /** 没有权限时显示的内容，默认 null */
  fallback?: React.ReactNode;
  /** 子元素 */
  children: React.ReactNode;
}

/**
 * 权限守卫组件
 * 根据用户角色控制子元素是否渲染
 *
 * @example
 * // 单个角色
 * <PermissionGuard roles="admin">
 *   <Button>只有管理员可见</Button>
 * </PermissionGuard>
 *
 * @example
 * // 多个角色（满足任意一个）
 * <PermissionGuard roles={['admin', 'gym_admin']}>
 *   <Button>管理员或健身房管理员可见</Button>
 * </PermissionGuard>
 *
 * @example
 * // 满足所有角色
 * <PermissionGuard type="all" roles={['admin', 'coach']}>
 *   <Button>需要同时是管理员和教练</Button>
 * </PermissionGuard>
 */
export const PermissionGuard: React.FC<PermissionGuardProps> = ({
  type = 'role',
  roles,
  fallback = null,
  children,
}) => {
  let hasPermission = false;

  switch (type) {
    case 'role':
      hasPermission = Permission.hasRole(roles);
      break;
    case 'any':
      hasPermission = Array.isArray(roles)
        ? Permission.hasAnyRole(roles)
        : Permission.hasRole(roles);
      break;
    case 'all':
      hasPermission = Array.isArray(roles)
        ? Permission.hasAllRoles(roles)
        : Permission.hasRole(roles);
      break;
  }

  return hasPermission ? <>{children}</> : <>{fallback}</>;
};

/**
 * 管理员权限组件
 */
export const AdminOnly: React.FC<{ fallback?: React.ReactNode; children: React.ReactNode }> = ({
  fallback = null,
  children,
}) => {
  return <PermissionGuard roles={Permission.ROLES.ADMIN} fallback={fallback}>{children}</PermissionGuard>;
};

/**
 * 教练权限组件
 */
export const CoachOnly: React.FC<{ fallback?: React.ReactNode; children: React.ReactNode }> = ({
  fallback = null,
  children,
}) => {
  return <PermissionGuard roles={Permission.ROLES.COACH} fallback={fallback}>{children}</PermissionGuard>;
};

/**
 * 健身房管理员权限组件
 */
export const GymAdminOnly: React.FC<{ fallback?: React.ReactNode; children: React.ReactNode }> = ({
  fallback = null,
  children,
}) => {
  return <PermissionGuard roles={Permission.ROLES.GYM_ADMIN} fallback={fallback}>{children}</PermissionGuard>;
};

/**
 * 管理员或健身房管理员权限组件
 */
export const AdminOrGymAdmin: React.FC<{ fallback?: React.ReactNode; children: React.ReactNode }> = ({
  fallback = null,
  children,
}) => {
  return <PermissionGuard type="any" roles={[Permission.ROLES.ADMIN, Permission.ROLES.GYM_ADMIN]} fallback={fallback}>
    {children}
  </PermissionGuard>;
};