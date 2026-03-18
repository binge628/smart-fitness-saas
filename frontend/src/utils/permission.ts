/**
 * 权限配置常量
 */

// 定义系统角色
export const ROLES = {
  USER: 'user' as const,
  ADMIN: 'admin' as const,
  COACH: 'coach' as const,
  GYM_ADMIN: 'gym_admin' as const,
} as const;

// 定义角色名称映射（中文）
export const ROLE_NAMES: Record<string, string> = {
  [ROLES.USER]: '普通用户',
  [ROLES.ADMIN]: '管理员',
  [ROLES.COACH]: '教练',
  [ROLES.GYM_ADMIN]: '健身房管理员',
};

// 定义所有角色
export const ALL_ROLES = Object.values(ROLES);

/**
 * 权限检查函数
 */

/**
 * 获取当前用户角色
 */
export const getCurrentRole = (): string | null => {
  const userData = localStorage.getItem('user');
  if (!userData) return null;

  try {
    const user = JSON.parse(userData);
    return user.role;
  } catch {
    return null;
  }
};

/**
 * 获取当前用户信息
 */
export const getCurrentUser = () => {
  const userData = localStorage.getItem('user');
  if (!userData) return null;

  try {
    return JSON.parse(userData);
  } catch {
    return null;
  }
};

/**
 * 检查当前用户是否有指定角色
 */
export const hasRole = (role: string | string[]): boolean => {
  const currentRole = getCurrentRole();
  if (!currentRole) return false;

  if (Array.isArray(role)) {
    return role.includes(currentRole);
  }
  return currentRole === role;
};

/**
 * 检查当前用户是否有任意一个指定角色
 */
export const hasAnyRole = (roles: string[]): boolean => {
  return roles.some(role => hasRole(role));
};

/**
 * 检查当前用户是否有所有指定角色
 */
export const hasAllRoles = (roles: string[]): boolean => {
  if (roles.length === 0) return true;
  return roles.every(role => hasRole(role));
};

/**
 * 检查是否为管理员
 */
export const isAdmin = (): boolean => {
  return hasRole(ROLES.ADMIN);
};

/**
 * 检查是否为教练
 */
export const isCoach = (): boolean => {
  return hasRole(ROLES.COACH);
};

/**
 * 检查是否为健身房管理员
 */
export const isGymAdmin = (): boolean => {
  return hasRole(ROLES.GYM_ADMIN);
};

/**
 * 检查是否为普通用户
 */
export const isRegularUser = (): boolean => {
  return hasRole(ROLES.USER);
};

/**
 * 检查用户是否已登录
 */
export const isAuthenticated = (): boolean => {
  const token = localStorage.getItem('token');
  const user = localStorage.getItem('user');
  return !!(token && user);
};