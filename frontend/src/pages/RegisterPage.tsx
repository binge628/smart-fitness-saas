import React, { useState } from 'react';
import { Form, Input, Button, message } from 'antd';
import { UserOutlined, LockOutlined, PhoneOutlined,MailOutlined } from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import { authService } from '../services/api';

const RegisterPage: React.FC = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);

  const onFinish = async (values: { username: string; email: string; password: string; phone?: string }) => {
    setLoading(true);
    try {
      const response = await authService.register(values);
      if (response.success && response.data) {
        // 保存 token 和用户信息
        localStorage.setItem('token', response.data.token);
        localStorage.setItem('user', JSON.stringify(response.data.user));
        message.success('注册成功！');
        navigate('/');
      } else {
        message.error(response.error || '注册失败，请重试');
      }
    } catch (error: any) {
      message.error(error?.error || '注册失败，请重试');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Form
      name="register"
      onFinish={onFinish}
      autoComplete="off"
      layout="vertical"
      size="large"
    >
      <Form.Item
        name="username"
        rules={[
          { required: true, message: '请输入用户名' },
          { min: 3, message: '用户名至少3个字符' },
          { max: 20, message: '用户名最多20个字符' },
        ]}
      >
        <Input
          prefix={<UserOutlined />}
          placeholder="用户名"
          allowClear
        />
      </Form.Item>

      <Form.Item
        name="email"
        rules={[
          { required: true, message: '请输入邮箱' },
          { type: 'email', message: '请输入有效的邮箱地址' },
        ]}
      >
        <Input
          prefix={<MailOutlined />}
          placeholder="邮箱"
          allowClear
        />
      </Form.Item>

      <Form.Item
        name="password"
        rules={[
          { required: true, message: '请输入密码' },
          { min: 6, message: '密码至少6个字符' },
        ]}
      >
        <Input.Password
          prefix={<LockOutlined />}
          placeholder="密码"
        />
      </Form.Item>

      <Form.Item
        name="phone"
        rules={[
          { pattern: /^1[3-9]\d{9}$/, message: '请输入有效的手机号' },
        ]}
      >
        <Input
          prefix={<PhoneOutlined />}
          placeholder="手机号（可选）"
          allowClear
        />
      </Form.Item>

      <Form.Item>
        <Button type="primary" htmlType="submit" loading={loading} block>
          注册
        </Button>
      </Form.Item>

      <div style={{ textAlign: 'center' }}>
        <span style={{ color: '#8c8c8c' }}>已有账号？</span>
        <Button
          type="link"
          onClick={() => navigate('/login')}
          style={{ padding: 0 }}
        >
          立即登录
        </Button>
      </div>
    </Form>
  );
};

export default RegisterPage;