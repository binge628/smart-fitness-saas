import React, { useState, useEffect } from 'react';
import {
  Card,
  Form,
  Input,
  Button,
  message,
  Typography,
  Row,
  Col,
  Divider,
  Avatar,
  Modal,
} from 'antd';
import {
  UserOutlined,
  MailOutlined,
  PhoneOutlined,
  LockOutlined,
} from '@ant-design/icons';
import { authService } from '../services/api';
import type { User } from '../types';

const { Title, Text } = Typography;

const ProfilePage: React.FC = () => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(false);
  const [profileForm] = Form.useForm();
  const [passwordForm] = Form.useForm();
  const [profileModalVisible, setProfileModalVisible] = useState(false);
  const [passwordModalVisible, setPasswordModalVisible] = useState(false);

  useEffect(() => {
    loadUserProfile();
  }, []);

  const loadUserProfile = async () => {
    try {
      const res = await authService.getMe();
      setUser(res.data);
      profileForm.setFieldsValue({
        username: res.data.username,
        email: res.data.email,
        phone: res.data.phone,
      });
    } catch (error) {
      message.error('加载用户信息失败');
    }
  };

  const handleUpdateProfile = async () => {
    try {
      const values = await profileForm.validateFields();
      setLoading(true);
      const res = await authService.updateMe(values);
      setUser(res.data);
      message.success('用户信息更新成功');
      setProfileModalVisible(false);
      // 更新本地存储的用户信息
      localStorage.setItem('user', JSON.stringify(res.data));
    } catch (error: any) {
      message.error(error?.error || '更新用户信息失败');
    } finally {
      setLoading(false);
    }
  };

  const handleChangePassword = async () => {
    try {
      const values = await passwordForm.validateFields();
      setLoading(true);
      await authService.changePassword(values);
      message.success('密码修改成功，请重新登录');
      passwordForm.resetFields();
      setPasswordModalVisible(false);
      // 清除本地存储，强制重新登录
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      window.location.href = '/login';
    } catch (error: any) {
      message.error(error?.error || '修改密码失败');
    } finally {
      setLoading(false);
    }
  };

  const getRoleText = (role: string) => {
    const roleMap: Record<string, string> = {
      admin: '管理员',
      coach: '教练',
      gym_admin: '健身房管理员',
      user: '普通用户',
    };
    return roleMap[role] || '未知';
  };

  const getStatusText = (status: string) => {
    const statusMap: Record<string, string> = {
      active: '正常',
      inactive: '未激活',
      banned: '已禁用',
    };
    return statusMap[status] || '未知';
  };

  const getStatusColor = (status: string) => {
    if (status === 'active') return 'green';
    if (status === 'inactive') return 'orange';
    return 'red';
  };

  if (!user) {
    return (
      <div style={{ padding: '24px', textAlign: 'center' }}>
        加载中...
      </div>
    );
  }

  return (
    <div>
      <Title level={2} style={{ marginBottom: 24 }}>
        👤 个人资料
      </Title>

      <Row gutter={[24, 24]}>
        <Col xs={24} md={8} style={{ marginBottom: 24 }}>
          <Card style={{ textAlign: 'center' }}>
            <Avatar
              size={120}
              src={user.avatar}
              icon={<UserOutlined />}
              style={{ marginBottom: 16 }}
            />
            <Title level={4} style={{ marginBottom: 8 }}>
              {user.username}
            </Title>
            <Text type="secondary">{user.email}</Text>
            <Divider style={{ my: 16 }} />
            <div style={{ textAlign: 'left' }}>
              <div style={{ marginBottom: 12 }}>
                <Text type="secondary" style={{ marginRight: 8 }}>角色：{getRoleText(user.role)}</Text>
              </div>
              <div style={{ marginBottom: 12 }}>
                <Text type="secondary">账号状态：</Text>
                <Text style={{ color: getStatusColor(user.status), fontWeight: 500, marginLeft: 8 }}>
                  {getStatusText(user.status)}
                </Text>
              </div>
              <div>
                <Text type="secondary">注册时间：</Text>
                <Text style={{ marginLeft: 8 }}>
                  {new Date(user.created_at).toLocaleDateString('zh-CN')}
                </Text>
              </div>
            </div>
            <Button
              type="primary"
              style={{ width: '100%', marginTop: 16 }}
              onClick={() => setProfileModalVisible(true)}
            >
              编辑资料
            </Button>
          </Card>
        </Col>

        <Col xs={24} md={16}>
          <Card
            title={`用户资料：${user.email}`}
            style={{ marginBottom: 24 }}
          >
            <Row gutter={[16, 16]}>
              <Col xs={24} sm={12}>
                <div style={{ marginBottom: 16 }}>
                  <Text type="secondary" style={{ fontSize: '12px' }}>用户名</Text>
                  <div style={{ fontSize: '16px', fontWeight: 500, marginTop: 4 }}>
                    {user.username}
                  </div>
                </div>
              </Col>
              <Col xs={24} sm={12}>
                <div style={{ marginBottom: 16 }}>
                  <Text type="secondary" style={{ fontSize: '12px' }}>邮箱</Text>
                  <div style={{ fontSize: '16px', fontWeight: 500, marginTop: 4 }}>
                    {user.email}
                  </div>
                </div>
              </Col>
              <Col xs={24} sm={12}>
                <div style={{ marginBottom: 16 }}>
                  <Text type="secondary" style={{ fontSize: '12px' }}>手机号</Text>
                  <div style={{ fontSize: '16px', fontWeight: 500, marginTop: 4 }}>
                    {user.phone || '-'}
                  </div>
                </div>
              </Col>
              <Col xs={24} sm={12}>
                <div style={{ marginBottom: 16 }}>
                  <Text type="secondary" style={{ fontSize: '12px' }}>角色</Text>
                  <div style={{ fontSize: '16px', fontWeight: 500, marginTop: 4 }}>
                    {getRoleText(user.role)}
                  </div>
                </div>
              </Col>
            </Row>
          </Card>

          <Card title="安全设置">
            <div style={{ padding: '12px 0' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
                <div>
                  <div style={{ fontSize: '16px', fontWeight: 500 }}>登录密码</div>
                  <Text type="secondary" style={{ fontSize: '12px' }}>
                    定期修改密码可以保护账户安全
                  </Text>
                </div>
                <Button
                  icon={<LockOutlined />}
                  onClick={() => setPasswordModalVisible(true)}
                >
                  修改密码
                </Button>
              </div>
            </div>
          </Card>
        </Col>
      </Row>

      {/* 编辑资料弹窗 */}
      <Modal
        title="编辑个人资料"
        open={profileModalVisible}
        onOk={handleUpdateProfile}
        onCancel={() => setProfileModalVisible(false)}
        confirmLoading={loading}
        destroyOnHidden
      >
        <Form form={profileForm} layout="vertical">
          <Form.Item
            label="用户名"
            name="username"
            rules={[
              { required: true, message: '请输入用户名' },
              { min: 3, message: '用户名至少3个字符' },
              { max: 20, message: '用户名最多20个字符' },
            ]}
          >
            <Input prefix={<UserOutlined />} placeholder="请输入用户名" />
          </Form.Item>
          <Form.Item
            label="邮箱"
            name="email"
            rules={[
              { required: true, message: '请输入邮箱' },
              { type: 'email', message: '邮箱格式不正确' },
            ]}
          >
            <Input prefix={<MailOutlined />} placeholder="请输入邮箱" />
          </Form.Item>
          <Form.Item label="手机号" name="phone">
            <Input prefix={<PhoneOutlined />} placeholder="请输入手机号" />
          </Form.Item>
          <Form.Item label="头像 URL" name="avatar">
            <Input placeholder="请输入头像 URL" />
          </Form.Item>
        </Form>
      </Modal>

      {/* 修改密码弹窗 */}
      <Modal
        title="修改密码"
        open={passwordModalVisible}
        onOk={handleChangePassword}
        onCancel={() => setPasswordModalVisible(false)}
        confirmLoading={loading}
        destroyOnHidden
      >
        <Form form={passwordForm} layout="vertical">
          <Form.Item
            label="当前密码"
            name="oldPassword"
            rules={[{ required: true, message: '请输入当前密码' }]}
          >
            <Input.Password prefix={<LockOutlined />} placeholder="请输入当前密码" />
          </Form.Item>
          <Form.Item
            label="新密码"
            name="newPassword"
            rules={[
              { required: true, message: '请输入新密码' },
              { min: 6, message: '新密码至少6个字符' },
            ]}
          >
            <Input.Password prefix={<LockOutlined />} placeholder="请输入新密码" />
          </Form.Item>
          <Form.Item
            label="确认新密码"
            name="confirmPassword"
            dependencies={['newPassword']}
            rules={[
              { required: true, message: '请确认新密码' },
              ({ getFieldValue }) => ({
                validator(_, value) {
                  if (!value || getFieldValue('newPassword') === value) {
                    return Promise.resolve();
                  }
                  return Promise.reject(new Error('两次输入的密码不一致'));
                },
              }),
            ]}
          >
            <Input.Password prefix={<LockOutlined />} placeholder="请再次输入新密码" />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
};

export default ProfilePage;