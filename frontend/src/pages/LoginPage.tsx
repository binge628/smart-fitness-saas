import React from 'react';
import { Form, Input, Button, message, Alert } from 'antd';
import { UserOutlined, LockOutlined, BugOutlined } from '@ant-design/icons';
import { useNavigate, Navigate } from 'react-router-dom';

const LoginPage: React.FC = () => {
  const navigate = useNavigate();
  const [shouldRedirect, setShouldRedirect] = React.useState(false);

  const handleLogin = () => {
    console.log('🧪 测试模式登录');

    const testUser = {
      id: 'test-id-123456',
      username: '测试用户',
      email: 'test@example.com',
      role: 'user',
      status: 'active',
      created_at: new Date().toISOString(),
    };

    localStorage.setItem('token', 'test-token-123456789');
    localStorage.setItem('user', JSON.stringify(testUser));

    message.success('登录成功！（测试模式）');
    setShouldRedirect(true);

    setTimeout(() => {
      console.log('🔄 跳转到首页');
      navigate('/');
    }, 300);
  };

  if (shouldRedirect) {
    console.log('✅ 准备重定向');
    return <Navigate to="/" replace />;
  }

  return (
    <div style={{ maxWidth: 400, margin: '0 auto', padding: '20px' }}>
      <Alert
        message="后端服务暂时不可用"
        description="当前使用测试模式登录，直接进入系统体验前端功能。后端连接修复后请刷新页面。"
        type="info"
        icon={<BugOutlined />}
        showIcon
        style={{ marginBottom: 24 }}
        closable={false}
      />

      <Button
        type="primary"
        loading={shouldRedirect}
        block
        size="large"
        onClick={handleLogin}
        disabled={shouldRedirect}
      >
        {shouldRedirect ? '正在跳转...' : '测试模式登录（跳过后端）'}
      </Button>

      <Button
        type="default"
        block
        size="large"
        onClick={() => window.open('http://localhost:3001/health', '_blank')}
        disabled={shouldRedirect}
        style={{ marginTop: 12 }}
      >
        检查后端状态
      </Button>

      <div style={{ textAlign: 'center', marginTop: 24 }}>
        <span style={{ color: '#595959', fontSize: '14px' }}>
          💡 提示：点击"测试模式登录"可直接进入系统
        </span>
      </div>
    </div>
  );
};

export default LoginPage;