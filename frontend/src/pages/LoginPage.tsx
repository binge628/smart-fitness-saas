import React, { useState } from 'react';
import { Form, Input, Button, message, Alert, Tabs } from 'antd';
import { UserOutlined, LockOutlined, ThunderboltOutlined } from '@ant-design/icons';
import { useNavigate, Navigate } from 'react-router-dom';

const LoginPage: React.FC = () => {
  const navigate = useNavigate();
  const [shouldRedirect, setShouldRedirect] = useState(false);
  const [loading, setLoading] = useState(false);
  const [testModeLoading, setTestModeLoading] = useState(false);
  const [form] = Form.useForm();

  // 正常登录 - 调用后端 API
  const handleRealLogin = async (values: { username: string; password: string }) => {
    setLoading(true);
    try {
      const response = await fetch('http://localhost:3001/api/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(values),
      });

      const data = await response.json();

      if (data.success) {
        localStorage.setItem('token', data.data.token);
        localStorage.setItem('user', JSON.stringify(data.data.user));
        message.success('登录成功！');
        setShouldRedirect(true);
      } else {
        message.error(data.error || '登录失败');
      }
    } catch (error) {
      message.error('连接服务器失败，请检查后端是否启动');
      console.error('登录错误:', error);
    } finally {
      setLoading(false);
    }
  };

  // 完全本地测试模式 - 不依赖后端
  const handleTestLogin = async () => {
    setTestModeLoading(true);

    // 直接设置本地用户信息（匹配数据库 admin 用户的 UUID 或使用模拟数据）
    const testUser = {
      id: 'e0ccf308-0ec2-4056-a9c6-05b9ddbdedb8', // 模拟的 UUID，部分 API 可能通过用户名查询
      username: 'admin',
      email: 'admin@smartfitness.com',
      role: 'admin',
      status: 'active',
      created_at: new Date().toISOString(),
    };

    // 存储到 localStorage
    localStorage.setItem('token', 'test-token-local'); // 使用本地 token
    localStorage.setItem('user', JSON.stringify(testUser));

    // 短暂延迟以显示加载效果
    setTimeout(() => {
      message.success('登录成功！（本地测试模式）');
      setShouldRedirect(true);
    }, 500);
  };

  if (shouldRedirect) {
    return <Navigate to="/" replace />;
  }

  return (
    <div style={{ maxWidth: 400, margin: '0 auto', padding: '20px' }}>
      <Alert
        title="首次使用？"
        description={
          <div>
            <p>请先在 Supabase SQL Editor 执行数据初始化脚本：</p>
            <p style={{ color: '#00B8D9', fontWeight: 'bold', marginBottom: 0 }}>
              脚本位置：backend/db/test-data-v2.sql
            </p>
          </div>
        }
        type="info"
        showIcon
        style={{ marginBottom: 24 }}
        closable={false}
      />

      <div
        style={{
          background: '#fff',
          padding: '24px',
          borderRadius: '8px',
          boxShadow: '0 2px 8px rgba(0,0,0,0.08)',
        }}
      >
        <Tabs
          defaultActiveKey="real"
          centered
          items={[
            {
              key: 'real',
              label: <span>📱 正常登录</span>,
              children: (
                <Form form={form} layout="vertical" onFinish={handleRealLogin}>
                  <Form.Item
                    label="用户名"
                    name="username"
                    rules={[{ required: true, message: '请输入用户名' }]}
                  >
                    <Input prefix={<UserOutlined />} placeholder="admin" size="large" />
                  </Form.Item>
                  <Form.Item
                    label="密码"
                    name="password"
                    rules={[{ required: true, message: '请输入密码' }]}
                  >
                    <Input.Password prefix={<LockOutlined />} placeholder="admin123" size="large" />
                  </Form.Item>
                  <Form.Item style={{ marginBottom: 0 }}>
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
                  <div style={{ textAlign: 'center', marginTop: '12px' }}>
                    <span style={{ color: '#595959', fontSize: '13px' }}>
                      测试账号：admin / admin123
                    </span>
                  </div>
                </Form>
              ),
            },
            {
              key: 'test',
              label: <span>⚡ 测试模式</span>,
              children: (
                <div style={{ textAlign: 'center', padding: '20px 0' }}>
                  <p style={{ marginBottom: '24px', color: '#595959' }}>
                    直接使用预置的测试数据和账号登录，无需输入密码
                  </p>
                  <Button
                    type="primary"
                    icon={<ThunderboltOutlined />}
                    size="large"
                    onClick={handleTestLogin}
                    loading={testModeLoading}
                    block
                  >
                    {testModeLoading ? '登录中...' : '测试数据登录'}
                  </Button>
                  <div style={{ marginTop: '16px', padding: '12px', background: '#f5f5f5', borderRadius: '6px', fontSize: '12px' }}>
                    <div style={{ marginBottom: '4px' }}>测试数据包含：</div>
                    <div>• 2 家健身房</div>
                    <div>• 3 个健身计划</div>
                    <div>• 4 条训练日志</div>
                    <div>• 5 条健康记录</div>
                  </div>
                </div>
              ),
            },
          ]}
        />
      </div>
    </div>
  );
};

export default LoginPage;