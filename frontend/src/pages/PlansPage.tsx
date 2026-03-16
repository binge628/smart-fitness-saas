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
  InputNumber,
  Select,
  message,
  Typography,
  Row,
  Col,
  Descriptions,
} from 'antd';
import {
  PlusOutlined,
  EditOutlined,
  DeleteOutlined,
  EyeOutlined,
} from '@ant-design/icons';
import type { FitnessPlan } from '../types';
import { planService } from '../services/api';

const { Title, Text } = Typography;
const { TextArea } = Input;
const { Option } = Select;

const DIFFICULTY_COLORS: Record<string, string> = {
  beginner: 'green',
  intermediate: 'orange',
  advanced: 'red',
};

const DIFFICULTY_LABELS: Record<string, string> = {
  beginner: '初级',
  intermediate: '中级',
  advanced: '高级',
};

const PlansPage: React.FC = () => {
  const [plans, setPlans] = useState<FitnessPlan[]>([]);
  const [loading, setLoading] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [detailVisible, setDetailVisible] = useState(false);
  const [editingPlan, setEditingPlan] = useState<FitnessPlan | null>(null);
  const [viewingPlan, setViewingPlan] = useState<FitnessPlan | null>(null);
  const [filterMy, setFilterMy] = useState(false);
  const [form] = Form.useForm();

  useEffect(() => {
    loadPlans();
  }, [filterMy]);

  const loadPlans = async () => {
    setLoading(true);
    try {
      const res = filterMy ? await planService.getMyPlans() : await planService.getPlans();
      setPlans(res.data || []);
    } catch (error) {
      message.error('加载健身计划失败');
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = () => {
    setEditingPlan(null);
    form.resetFields();
    setModalVisible(true);
  };

  const handleEdit = (record: FitnessPlan) => {
    setEditingPlan(record);
    form.setFieldsValue(record);
    setModalVisible(true);
  };

  const handleView = (record: FitnessPlan) => {
    setViewingPlan(record);
    setDetailVisible(true);
  };

  const handleDelete = async (id: string) => {
    Modal.confirm({
      title: '确认删除',
      content: '确定要删除这个健身计划吗？',
      onOk: async () => {
        try {
          await planService.deletePlan(id);
          message.success('删除成功');
          loadPlans();
        } catch (error) {
          message.error('删除失败');
        }
      },
    });
  };

  const handleSubmit = async () => {
    try {
      const values = await form.validateFields();
      if (editingPlan) {
        await planService.updatePlan(editingPlan.id, values);
        message.success('更新成功');
      } else {
        await planService.createPlan(values);
        message.success('创建成功');
      }
      setModalVisible(false);
      loadPlans();
    } catch (error) {
      message.error('操作失败');
    }
  };

  const columns = [
    {
      title: '计划名称',
      dataIndex: 'name',
      key: 'name',
      render: (text: string) => <Text strong>{text}</Text>,
    },
    {
      title: '难度',
      dataIndex: 'difficulty',
      key: 'difficulty',
      render: (difficulty: string) => (
        <Tag color={DIFFICULTY_COLORS[difficulty]}>
          {DIFFICULTY_LABELS[difficulty] || difficulty}
        </Tag>
      ),
    },
    {
      title: '持续周数',
      dataIndex: 'duration_weeks',
      key: 'duration_weeks',
      width: 100,
    },
    {
      title: '目标',
      dataIndex: 'target_goal',
      key: 'target_goal',
      render: (goal: string) => goal || '-',
    },
    {
      title: '类型',
      dataIndex: 'is_template',
      key: 'is_template',
      render: (isTemplate: boolean) => (
        <Tag color={isTemplate ? 'blue' : 'default'}>
          {isTemplate ? '模板' : '个人'}
        </Tag>
      ),
    },
    {
      title: '创建者',
      dataIndex: 'creator_name',
      key: 'creator_name',
      render: (name: string) => name || '我',
    },
    {
      title: '操作',
      key: 'action',
      width: 180,
      render: (_: any, record: FitnessPlan) => (
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

  return (
    <div>
      <Row justify="space-between" align="middle" style={{ marginBottom: 16 }}>
        <Col>
          <Title level={2} style={{ margin: 0 }}>
            🎯 健身计划管理
          </Title>
        </Col>
        <Col>
          <Space>
            <Button
              type={filterMy ? 'primary' : 'default'}
              onClick={() => setFilterMy(!filterMy)}
            >
              {filterMy ? '查看全部' : '只看我的'}
            </Button>
            <Button type="primary" icon={<PlusOutlined />} onClick={handleCreate}>
              新建计划
            </Button>
          </Space>
        </Col>
      </Row>

      <Card bordered={false}>
        <Table
          rowKey="id"
          columns={columns}
          dataSource={plans}
          loading={loading}
          pagination={{
            showSizeChanger: true,
            showTotal: (total) => `共 ${total} 条记录`,
          }}
        />
      </Card>

      {/* 创建/编辑弹窗 */}
      <Modal
        title={editingPlan ? '编辑健身计划' : '新建健身计划'}
        open={modalVisible}
        onOk={handleSubmit}
        onCancel={() => setModalVisible(false)}
        width={600}
        destroyOnClose
      >
        <Form form={form} layout="vertical">
          <Form.Item
            label="计划名称"
            name="name"
            rules={[{ required: true, message: '请输入计划名称' }]}
          >
            <Input placeholder="如：力量训练计划" />
          </Form.Item>

          <Form.Item
            label="难度等级"
            name="difficulty"
            rules={[{ required: true, message: '请选择难度等级' }]}
          >
            <Select placeholder="请选择">
              <Option value="beginner">初级</Option>
              <Option value="intermediate">中级</Option>
              <Option value="advanced">高级</Option>
            </Select>
          </Form.Item>

          <Form.Item
            label="持续周数"
            name="duration_weeks"
            rules={[{ required: true, message: '请输入持续周数' }]}
          >
            <InputNumber min={1} max={52} style={{ width: '100%' }} />
          </Form.Item>

          <Form.Item label="健身目标" name="target_goal">
            <Input placeholder="如：增肌、减脂、提升体能" />
          </Form.Item>

          <Form.Item label="计划描述" name="description">
            <TextArea rows={4} placeholder="描述计划的详细内容" />
          </Form.Item>

          <Form.Item label="模板计划" name="is_template" valuePropName="checked">
            <Select>
              <Option value={false}>否</Option>
              <Option value={true}>是</Option>
            </Select>
          </Form.Item>
        </Form>
      </Modal>

      {/* 详情弹窗 */}
      <Modal
        title="健身计划详情"
        open={detailVisible}
        onCancel={() => setDetailVisible(false)}
        footer={[
          <Button key="close" onClick={() => setDetailVisible(false)}>
            关闭
          </Button>,
        ]}
        width={600}
      >
        {viewingPlan && (
          <Descriptions column={1} bordered>
            <Descriptions.Item label="计划名称">
              {viewingPlan.name}
            </Descriptions.Item>
            <Descriptions.Item label="难度">
              <Tag color={DIFFICULTY_COLORS[viewingPlan.difficulty]}>
                {DIFFICULTY_LABELS[viewingPlan.difficulty]}
              </Tag>
            </Descriptions.Item>
            <Descriptions.Item label="持续周数">
              {viewingPlan.duration_weeks} 周
            </Descriptions.Item>
            <Descriptions.Item label="健身目标">
              {viewingPlan.target_goal || '-'}
            </Descriptions.Item>
            <Descriptions.Item label="计划类型">
              <Tag color={viewingPlan.is_template ? 'blue' : 'default'}>
                {viewingPlan.is_template ? '模板计划' : '个人计划'}
              </Tag>
            </Descriptions.Item>
            <Descriptions.Item label="描述">
              {viewingPlan.description || '-'}
            </Descriptions.Item>
            <Descriptions.Item label="创建者">
              {viewingPlan.creator_name || '我'}
            </Descriptions.Item>
            <Descriptions.Item label="创建时间">
              {new Date(viewingPlan.created_at).toLocaleString('zh-CN')}
            </Descriptions.Item>
          </Descriptions>
        )}
      </Modal>
    </div>
  );
};

export default PlansPage;