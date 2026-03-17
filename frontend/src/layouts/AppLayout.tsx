import React, { useState, useEffect, useRef } from 'react';
import { Layout, Menu, Avatar, Dropdown, Typography, message } from 'antd';
import { useNavigate, useLocation } from 'react-router-dom';
import {
  HomeOutlined,
  AimOutlined,
  EnvironmentOutlined,
  HeartOutlined,
  CalendarOutlined,
  UserOutlined,
  LogoutOutlined,
} from '@ant-design/icons';
import type { User } from '../types';
import './AppLayout.css';

const { Header, Sider, Content } = Layout;
const { Title, Text } = Typography;

const AppLayout: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const [collapsed, setCollapsed] = useState(false);
  const [user, setUser] = useState<User | null>(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const hasInitializedRef = useRef(false);

  useEffect(() => {
    // 只执行一次初始化检查
    if (hasInitializedRef.current) {
      return;
    }
    hasInitializedRef.current = true;

    const token = localStorage.getItem('token');
    const userData = localStorage.getItem('user');
    console.log('🔐 初始化检查登录状态:', { hasToken: !!token, hasUser: !!userData });

    if (token && userData) {
      try {
        const parsedUser = JSON.parse(userData);
        setUser(parsedUser);
        setIsAuthenticated(true);
      } catch (e) {
        console.error('解析用户数据失败:', e);
        localStorage.clear();
        setIsAuthenticated(false);
      }
    } else {
      console.log('❌ 用户未登录，保持未认证状态');
      setIsAuthenticated(false);
    }
  }, []); // 空依赖数组，只执行一次

  // 退出登录
  const handleLogout = () => {
    localStorage.clear();
    setIsAuthenticated(false);
    setUser(null);
    hasInitializedRef.current = false; // 重置初始化标记，使下次登录能重新检查
    message.success('已退出登录');
    navigate('/login');
  };

  // 导航菜单
  const menuItems = [
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
    {
      key: '/gyms',
      icon: <EnvironmentOutlined />,
      label: '健身房',
    },
    {
      key: '/health',
      icon: <HeartOutlined />,
      label: '健康数据',
    },
    {
      key: '/workouts',
      icon: <CalendarOutlined />,
      label: '训练日志',
    },
  ];

  // 用户菜单
  const userMenuItems = [
    {
      key: 'profile',
      icon: <UserOutlined />,
      label: '个人资料',
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
          {children}
        </Content>
      </Layout>
    </Layout>
  );
};

export default AppLayout;