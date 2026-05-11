import React, { useState } from 'react';
import { Layout, Menu, Avatar, Dropdown, message } from 'antd';
import { useNavigate, useLocation, Outlet } from 'react-router-dom';
import {
  HomeOutlined,
  AimOutlined,
  EnvironmentOutlined,
  HeartOutlined,
  CalendarOutlined,
  UserOutlined,
  ThunderboltOutlined,
  LogoutOutlined,
  TrophyOutlined,
} from '@ant-design/icons';
import { useAuthStore } from '../stores/authStore';
import { ROLES } from '../utils/permission';
import './AppLayout.css';

// eslint-disable-next-line @typescript-eslint/no-unused-vars
const { Header, Sider, Content } = Layout;

const AppLayout: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [collapsed, setCollapsed] = useState(false);
  const { user, logout } = useAuthStore();

  // 退出登录
  const handleLogout = () => {
    logout();
    message.success('已退出登录');
    navigate('/login');
  };

  // 导航菜单 - 根据权限动态生成
  const baseMenuItems = [
    {
      key: '/',
      icon: <HomeOutlined />,
      label: '首页',
    },
    {
      key: '/plans',
      icon: <AimOutlined />,
      label: '健身计划',
    },
  ];

  // 健身房菜单（所有角色可见）
  const gymMenuItem = {
    key: '/gyms',
    icon: <EnvironmentOutlined />,
    label: '健身房',
  };

  // 健康数据菜单
  const healthMenuItem = {
    key: '/health',
    icon: <HeartOutlined />,
    label: '健康数据',
  };

  // 训练日志菜单
  const workoutMenuItem = {
    key: '/workouts',
    icon: <CalendarOutlined />,
    label: '训练日志',
  };

  // 动作库菜单
  const exerciseMenuItem = {
    key: '/exercises',
    icon: <ThunderboltOutlined />,
    label: '动作库',
  };

  // 成就菜单
  const achievementMenuItem = {
    key: '/achievements',
    icon: <TrophyOutlined />,
    label: '成就',
  };

  // 个人资料菜单（所有角色可见）
  const profileMenuItem = {
    key: '/profile',
    icon: <UserOutlined />,
    label: '个人资料',
  };

  // 动态组装菜单
  let menuItems = [...baseMenuItems];

  menuItems.push(gymMenuItem);

  // 健康数据和训练日志 - 仅普通用户和管理员能看到
  if (user && (user.role === ROLES.USER || user.role === ROLES.ADMIN)) {
    menuItems.push(healthMenuItem, workoutMenuItem, exerciseMenuItem, achievementMenuItem);
  }

  menuItems.push(profileMenuItem);

  // 用户菜单
  const userMenuItems = [
    {
      key: 'profile',
      icon: <UserOutlined />,
      label: '个人资料',
      onClick: () => navigate('/profile'),
    },
    {
      key: 'logout',
      icon: <LogoutOutlined />,
      label: '退出登录',
      onClick: handleLogout,
    },
  ];

  return (
    <Layout style={{ minHeight: '100vh' }}>
      <Sider
        collapsible
        collapsed={collapsed}
        onCollapse={setCollapsed}
        className="app-sider"
        breakpoint="md"
      >
        <div className="app-logo">
          <span className="logo-icon">🏋</span>
          {!collapsed && <span className="logo-text">智慧健身</span>}
        </div>
        <Menu
          theme="light"
          mode="inline"
          selectedKeys={[location.pathname]}
          items={menuItems}
          onClick={({ key }) => navigate(key as string)}
        />
      </Sider>
      <Layout>
        <Header className="app-header">
          <div className="header-left">
            <span className="breadcrumb">
              {menuItems.find(item => item.key === location.pathname)?.label}
            </span>
          </div>
          <div className="header-right">
            <span className="user-name">
              {user?.username || '用户'}
            </span>
            <Dropdown menu={{ items: userMenuItems }} placement="bottomRight">
              <Avatar size={32} src={user?.avatar} icon={<UserOutlined />} />
            </Dropdown>
          </div>
        </Header>
        <Content className="app-content">
          <Outlet />
        </Content>
      </Layout>
    </Layout>
  );
};

export default AppLayout;