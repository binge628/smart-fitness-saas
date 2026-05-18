import React, { useState } from 'react';
import { Form, Input, Button, message } from 'antd';
import { UserOutlined, LockOutlined } from '@ant-design/icons';
import { useNavigate, Navigate } from 'react-router-dom';
import { authService } from '../services/api';
import { useAuthStore } from '../stores/authStore';

const LoginPage: React.FC = () => {
  const navigate = useNavigate();
  const [shouldRedirect, setShouldRedirect] = useState(false);
  const [loading, setLoading] = useState(false);
  const [form] = Form.useForm();
  const login = useAuthStore((s) => s.login);

  const handleLogin = async (values: { username: string; password: string }) => {
    setLoading(true);
    try {
      const response = await authService.login(values);
      if (response.success && response.data) {
        login(response.data.token, response.data.user);
        message.success('登录成功！');
        setShouldRedirect(true);
      } else {
        message.error(response.error || '登录失败');
      }
    } catch (error: any) {
      message.error(error?.error || '登录失败，请检查用户名和密码');
    } finally {
      setLoading(false);
    }
  };

  if (shouldRedirect) {
    return <Navigate to="/" replace />;
  }

  return (
    <div style={{ maxWidth: 400, margin: '0 auto', padding: '20px' }}>
      <div
        style={{
          background: '#fff',
          padding: '24px',
          borderRadius: '8px',
          boxShadow: '0 2px 8px rgba(0,0,0,0.08)',
        }}
      >
        <div style={{ marginBottom: '24px', textAlign: 'center' }}>
          <h1 style={{ fontSize: '24px', margin: 0, color: '#333' }}>登录</h1>
          <p style={{ margin: '8px 0 0 0', color: '#666', fontSize: '14px' }}>
            欢迎回到智慧健身
          </p>
        </div>

        <Form form={form} layout="vertical" onFinish={handleLogin}>
          <Form.Item
            label="用户名"
            name="username"
            rules={[{ required: true, message: '请输入用户名' }]}
          >
            <Input prefix={<UserOutlined />} placeholder="请输入用户名" size="large" />
          </Form.Item>
          <Form.Item
            label="密码"
            name="password"
            rules={[{ required: true, message: '请输入密码' }]}
          >
            <Input.Password prefix={<LockOutlined />} placeholder="请输入密码" size="large" />
          </Form.Item>
          <Form.Item>
            <Button
              type="primary"
              htmlType="submit"
              block
              size="large"
              loading={loading}
            >
              {loading ? '登录中...' : '登录'}
            </Button>
          </Form.Item>
          <div style={{ textAlign: 'center' }}>
            <span style={{ color: '#666', fontSize: '14px' }}>还没有账号？</span>
            <Button
              type="link"
              onClick={() => navigate('/register')}
              style={{ padding: '0 8px', fontSize: '14px' }}
            >
              立即注册
            </Button>
          </div>
        </Form>
      </div>
    </div>
  );
};

export default LoginPage;