import React, { useState, useEffect, useRef } from 'react';
import { Layout, Menu, Avatar, Dropdown, message } from 'antd';
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

// eslint-disable-next-line @typescript-eslint/no-unused-vars
const { Header, Sider, Content } = Layout;

const AppLayout: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const [collapsed, setCollapsed] = useState(false);
  const [user, setUser] = useState<User | null>(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const hasInitializedRef = useRef(false);

  // 加载用户信息的函数
  const loadUser = () => {
    const userData = localStorage.getItem('user');
    if (userData) {
      try {
        const parsedUser = JSON.parse(userData);
        setUser(parsedUser);
        setIsAuthenticated(true);
      } catch (e) {
        console.error('解析用户数据失败:', e);
      }
    } else {
      setIsAuthenticated(false);
    }
  };

  // 初始化和监听用户信息变化
  useEffect(() => {
    // 只执行一次初始化检查
    if (hasInitializedRef.current) {
      return;
    }
    hasInitializedRef.current = true;

    loadUser();
    console.log('🔐 初始化检查登录状态');
  }, []);

  // 监听 storage 事件（其他标签页修改 localStorage 时触发）
  useEffect(() => {
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === 'user') {
        console.log('📡 AppLayout 检测到 localStorage 变化');
        loadUser();
      }
    };

    window.addEventListener('storage', handleStorageChange);

    return () => {
      window.removeEventListener('storage', handleStorageChange);
    };
  }, []);

  // 监听自定义事件（同一标签页内修改后触发）
  useEffect(() => {
    const handleUserUpdate = () => {
      console.log('📢 AppLayout 收到 user-updated 事件');
      loadUser();
    };

    window.addEventListener('user-updated', handleUserUpdate);

    return () => {
      window.removeEventListener('user-updated', handleUserUpdate);
    };
  }, []);

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
    {
      key: '/profile',
      icon: <UserOutlined />,
      label: '个人资料',
    },
  ];

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
          {children}
        </Content>
      </Layout>
    </Layout>
  );
};

export default AppLayout;