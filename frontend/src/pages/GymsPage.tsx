import React, { useState, useEffect } from 'react';
import {
  Card,
  Button,
  Table,
  Tag,
  Space,
  Modal,
  Form,
  Input,
  Select,
  message,
  Typography,
  Row,
  Col,
  Descriptions,
  Tabs,
} from 'antd';
import {
  PlusOutlined,
  EditOutlined,
  DeleteOutlined,
  EyeOutlined,
  TeamOutlined,
} from '@ant-design/icons';
import type { Gym, GymMember } from '../types';
import { gymService } from '../services/api';

const { Title, Text } = Typography;
const { TextArea } = Input;
const { TabPane } = Tabs;

const STATUS_COLORS: Record<string, string> = {
  active: 'green',
  inactive: 'red',
};

const STATUS_LABELS: Record<string, string> = {
  active: '营业中',
  inactive: '已停业',
};

const MEMBERSHIP_TYPE_COLORS: Record<string, string> = {
  basic: 'default',
  premium: 'blue',
  vip: 'gold',
};

const MEMBERSHIP_TYPE_LABELS: Record<string, string> = {
  basic: '普通会员',
  premium: '高级会员',
  vip: 'VIP会员',
};

const MEMBERSHIP_STATUS_COLORS: Record<string, string> = {
  active: 'green',
  expired: 'red',
  suspended: 'orange',
};

const MEMBERSHIP_STATUS_LABELS: Record<string, string> = {
  active: '有效',
  expired: '已过期',
  suspended: '已暂停',
};

const GymsPage: React.FC = () => {
  const [gyms, setGyms] = useState<Gym[]>([]);
  const [members, setMembers] = useState<GymMember[]>([]);
  const [myMemberships, setMyMemberships] = useState<GymMember[]>([]);
  const [loading, setLoading] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [detailVisible, setDetailVisible] = useState(false);
  const [editingGym, setEditingGym] = useState<Gym | null>(null);
  const [viewingGym, setViewingGym] = useState<Gym | null>(null);
  const [activeTab, setActiveTab] = useState('gyms');
  const [form] = Form.useForm();

  useEffect(() => {
    loadData();
  }, [activeTab]);

  const loadData = async () => {
    setLoading(true);
    try {
      if (activeTab === 'gyms') {
        const res = await gymService.getMyGyms();
        setGyms(res.data || []);
      } else if (activeTab === 'myMemberships') {
        const res = await gymService.getMyMemberships();
        setMyMemberships(res.data || []);
      }
    } catch (error) {
      message.error('加载数据失败');
    } finally {
      setLoading(false);
    }
  };

  const loadMembers = async (gymId: string) => {
    try {
      const res = await gymService.getGymMembers(gymId);
      setMembers(res.data || []);
    } catch (error) {
      message.error('加载会员列表失败');
    }
  };

  const handleCreate = () => {
    setEditingGym(null);
    form.resetFields();
    setModalVisible(true);
  };

  const handleEdit = (record: Gym) => {
    setEditingGym(record);
    form.setFieldsValue(record);
    setModalVisible(true);
  };

  const handleView = (record: Gym) => {
    setViewingGym(record);
    setDetailVisible(true);
    loadMembers(record.id);
  };

  const handleDelete = async (id: string) => {
    Modal.confirm({
      title: '确认删除',
      content: '确定要删除这个健身房吗？此操作不可恢复。',
      onOk: async () => {
        try {
          await gymService.deleteGym(id);
          message.success('删除成功');
          loadData();
        } catch (error) {
          message.error('删除失败');
        }
      },
    });
  };

  const handleSubmit = async () => {
    try {
      const values = await form.validateFields();
      if (editingGym) {
        await gymService.updateGym(editingGym.id, values);
        message.success('更新成功');
      } else {
        await gymService.createGym(values);
        message.success('创建成功');
      }
      setModalVisible(false);
      loadData();
    } catch (error) {
      message.error('操作失败');
    }
  };

  const gymColumns = [
    {
      title: '健身房名称',
      dataIndex: 'name',
      key: 'name',
      render: (text: string) => <Text strong>{text}</Text>,
    },
    {
      title: '地址',
      dataIndex: 'address',
      key: 'address',
      render: (address: string) => address || '-',
    },
    {
      title: '电话',
      dataIndex: 'phone',
      key: 'phone',
      width: 120,
      render: (phone: string) => phone || '-',
    },
    {
      title: '状态',
      dataIndex: 'status',
      key: 'status',
      width: 100,
      render: (status: string) => (
        <Tag color={STATUS_COLORS[status]}>
          {STATUS_LABELS[status] || status}
        </Tag>
      ),
    },
    {
      title: '会员数',
      dataIndex: 'member_count',
      key: 'member_count',
      width: 100,
      render: (count: number) => count || 0,
    },
    {
      title: '操作',
      key: 'action',
      width: 180,
      render: (_: any, record: Gym) => (
        <Space>
          <Button
            type="link"
            icon={<EyeOutlined />}
            onClick={() => handleView(record)}
          >
            查看
          </Button>
          <Button
            type="link"
            icon={<EditOutlined />}
            onClick={() => handleEdit(record)}
          >
            编辑
          </Button>
          <Button
            type="link"
            danger
            icon={<DeleteOutlined />}
            onClick={() => handleDelete(record.id)}
          >
            删除
          </Button>
        </Space>
      ),
    },
  ];

  const memberColumns = [
    {
      title: '会员姓名',
      dataIndex: 'username',
      key: 'username',
      render: (text: string) => <Text strong>{text}</Text>,
    },
    {
      title: '邮箱',
      dataIndex: 'email',
      key: 'email',
      render: (email: string) => email || '-',
    },
    {
      title: '会员类型',
      dataIndex: 'membership_type',
      key: 'membership_type',
      width: 120,
      render: (type: string) => (
        <Tag color={MEMBERSHIP_TYPE_COLORS[type]}>
          {MEMBERSHIP_TYPE_LABELS[type] || type}
        </Tag>
      ),
    },
    {
      title: '状态',
      dataIndex: 'membership_status',
      key: 'membership_status',
      width: 100,
      render: (status: string) => (
        <Tag color={MEMBERSHIP_STATUS_COLORS[status]}>
          {MEMBERSHIP_STATUS_LABELS[status] || status}
        </Tag>
      ),
    },
    {
      title: '开始日期',
      dataIndex: 'start_date',
      key: 'start_date',
      width: 120,
      render: (date: string) => new Date(date).toLocaleDateString('zh-CN'),
    },
    {
      title: '结束日期',
      dataIndex: 'end_date',
      key: 'end_date',
      width: 120,
      render: (date: string) => (date ? new Date(date).toLocaleDateString('zh-CN') : '永久'),
    },
  ];

  const membershipColumns = [
    {
      title: '健身房名称',
      dataIndex: 'gym_name',
      key: 'gym_name',
      render: (text: string) => <Text strong>{text}</Text>,
    },
    {
      title: '会员类型',
      dataIndex: 'membership_type',
      key: 'membership_type',
      width: 120,
      render: (type: string) => (
        <Tag color={MEMBERSHIP_TYPE_COLORS[type]}>
          {MEMBERSHIP_TYPE_LABELS[type] || type}
        </Tag>
      ),
    },
    {
      title: '状态',
      dataIndex: 'membership_status',
      key: 'membership_status',
      width: 100,
      render: (status: string) => (
        <Tag color={MEMBERSHIP_STATUS_COLORS[status]}>
          {MEMBERSHIP_STATUS_LABELS[status] || status}
        </Tag>
      ),
    },
    {
      title: '开始日期',
      dataIndex: 'start_date',
      key: 'start_date',
      width: 120,
      render: (date: string) => new Date(date).toLocaleDateString('zh-CN'),
    },
    {
      title: '结束日期',
      dataIndex: 'end_date',
      key: 'end_date',
      width: 120,
      render: (date: string) => (date ? new Date(date).toLocaleDateString('zh-CN') : '永久'),
    },
  ];

  return (
    <div>
      <Row justify="space-between" align="middle" style={{ marginBottom: 16 }}>
        <Col>
          <Title level={2} style={{ margin: 0 }}>
            🏢 健身房管理
          </Title>
        </Col>
        <Col>
          <Button type="primary" icon={<PlusOutlined />} onClick={handleCreate}>
            新建健身房
          </Button>
        </Col>
      </Row>

      <Card bordered={false}>
        <Tabs activeKey={activeTab} onChange={setActiveTab}>
          <TabPane tab="我的健身房" key="gyms">
            <Table
              rowKey="id"
              columns={gymColumns}
              dataSource={gyms}
              loading={loading}
              pagination={{
                showSizeChanger: true,
                showTotal: (total) => `共 ${total} 条记录`,
              }}
            />
          </TabPane>
          <TabPane tab="我的会员资格" key="myMemberships">
            <Table
              rowKey="id"
              columns={membershipColumns}
              dataSource={myMemberships}
              loading={loading}
              pagination={{
                showSizeChanger: true,
                showTotal: (total) => `共 ${total} 条记录`,
              }}
            />
          </TabPane>
        </Tabs>
      </Card>

      {/* 创建/编辑弹窗 */}
      <Modal
        title={editingGym ? '编辑健身房' : '新建健身房'}
        open={modalVisible}
        onOk={handleSubmit}
        onCancel={() => setModalVisible(false)}
        width={600}
        destroyOnClose
      >
        <Form form={form} layout="vertical">
          <Form.Item
            label="健身房名称"
            name="name"
            rules={[{ required: true, message: '请输入健身房名称' }]}
          >
            <Input placeholder="如：健身中心一号店" />
          </Form.Item>

          <Form.Item label="地址" name="address">
            <Input placeholder="健身房的详细地址" />
          </Form.Item>

          <Form.Item label="联系电话" name="phone">
            <Input placeholder="联系号码" />
          </Form.Item>

          <Form.Item label="简介" name="description">
            <TextArea rows={4} placeholder="描述健身房的特色、设施等" />
          </Form.Item>

          <Form.Item
            label="状态"
            name="status"
            initialValue="active"
          >
            <Select>
              <Option value="active">营业中</Option>
              <Option value="inactive">已停业</Option>
            </Select>
          </Form.Item>
        </Form>
      </Modal>

      {/* 详情弹窗 */}
      <Modal
        title={
          <Space>
            <TeamOutlined />
            <span>{viewingGym?.name} - 会员列表</span>
          </Space>
        }
        open={detailVisible}
        onCancel={() => setDetailVisible(false)}
        footer={[
          <Button key="close" onClick={() => setDetailVisible(false)}>
            关闭
          </Button>,
        ]}
        width={800}
      >
        {viewingGym && (
          <>
            <Descriptions column={2} bordered style={{ marginBottom: 16 }}>
              <Descriptions.Item label="健身房名称" span={2}>
                {viewingGym.name}
              </Descriptions.Item>
              <Descriptions.Item label="地址" span={2}>
                {viewingGym.address || '-'}
              </Descriptions.Item>
              <Descriptions.Item label="电话">
                {viewingGym.phone || '-'}
              </Descriptions.Item>
              <Descriptions.Item label="状态">
                <Tag color={STATUS_COLORS[viewingGym.status]}>
                  {STATUS_LABELS[viewingGym.status]}
                </Tag>
              </Descriptions.Item>
              <Descriptions.Item label="会员数">
                {viewingGym.member_count || 0}
              </Descriptions.Item>
              <Descriptions.Item label="创建时间">
                {new Date(viewingGym.created_at).toLocaleDateString('zh-CN')}
              </Descriptions.Item>
            </Descriptions>

            <Table
              rowKey="id"
              columns={memberColumns}
              dataSource={members}
              pagination={false}
              size="small"
            />
          </>
        )}
      </Modal>
    </div>
  );
};

export default GymsPage;