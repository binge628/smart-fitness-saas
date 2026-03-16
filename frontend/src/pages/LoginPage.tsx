import React, { useState } from 'react';
import { Form, Input, Button, message } from 'antd';
import { UserOutlined, LockOutlined } from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import { authService } from '../services/api';

const LoginPage: React.FC = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);

  const onFinish = async (values: { username: string; password: string }) => {
    setLoading(true);
    try {
      const response = await authService.login(values);
      if (response.success && response.data) {
        // 保存 token 和用户信息
        localStorage.setItem('token', response.data.token);
        localStorage.setItem('user', JSON.stringify(response.data.user));
        message.success('登录成功！');
        navigate('/');
      } else {
        message.error(response.error || '登录失败，请重试');
      }
    } catch (error: any) {
      message.error(error?.error || '登录失败，请重试');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Form
      name="login"
      onFinish={onFinish}
      autoComplete="off"
      layout="vertical"
      size="large"
    >
      <Form.Item
        name="username"
        rules={[{ required: true, message: '请输入用户名或邮箱' }]}
      >
        <Input
          prefix={<UserOutlined />}
          placeholder="用户名/邮箱"
          allowClear
        />
      </Form.Item>

      <Form.Item
        name="password"
        rules={[{ required: true, message: '请输入密码' }]}
      >
        <Input.Password
          prefix={<LockOutlined />}
          placeholder="密码"
        />
      </Form.Item>

      <Form.Item>
        <Button type="primary" htmlType="submit" loading={loading} block>
          登录
        </Button>
      </Form.Item>

      <div style={{ textAlign: 'center' }}>
        <span style={{ color: '#8c8c8c' }}>还没有账号？</span>
        <Button
          type="link"
          onClick={() => navigate('/register')}
          style={{ padding: 0 }}
        >
          立即注册
        </Button>
      </div>
    </Form>
  );
};

export default LoginPage;