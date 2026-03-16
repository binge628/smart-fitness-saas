import React from 'react';
import { Layout } from 'antd';
import { Outlet } from 'react-router-dom';
import './AuthLayout.css';

const { Content } = Layout;

const AuthLayout: React.FC = () => {
  return (
    <Layout className="auth-layout">
      <div className="auth-background">
        <div className="auth-container">
          <div className="auth-logo">
            <h1 className="logo-text">🏋 智慧健身 SaaS</h1>
          </div>
          <div className="auth-content">
            <Outlet />
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default AuthLayout;