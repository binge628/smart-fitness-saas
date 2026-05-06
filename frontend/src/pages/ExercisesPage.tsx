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
  InputNumber,
} from 'antd';
import {
  PlusOutlined,
  SearchOutlined,
} from '@ant-design/icons';
import type { Exercise } from '../types';
import { exerciseService } from '../services/api';

const { Title, Text } = Typography;
const { TextArea } = Input;
const { Option } = Select;

const MUSCLE_GROUP_LABELS: Record<string, string> = {
  chest: '胸部',
  back: '背部',
  shoulder: '肩部',
  leg: '腿部',
  arm: '手臂',
  core: '核心',
  full_body: '全身',
  cardio: '有氧',
};

const MUSCLE_GROUP_COLORS: Record<string, string> = {
  chest: 'red',
  back: 'blue',
  shoulder: 'orange',
  leg: 'green',
  arm: 'purple',
  core: 'cyan',
  full_body: 'geekblue',
  cardio: 'magenta',
};

const CATEGORY_LABELS: Record<string, string> = {
  compound: '复合动作',
  isolation: '孤立动作',
  cardio: '有氧',
};

const ExercisesPage: React.FC = () => {
  const [exercises, setExercises] = useState<Exercise[]>([]);
  const [loading, setLoading] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [muscleFilter, setMuscleFilter] = useState<string | undefined>();
  const [searchText, setSearchText] = useState('');
  const [form] = Form.useForm();

  useEffect(() => {
    loadExercises();
  }, [muscleFilter]);

  const loadExercises = async () => {
    setLoading(true);
    try {
      const res = await exerciseService.getExercises({
        muscle_group: muscleFilter,
        search: searchText || undefined,
        limit: 100,
      });
      setExercises(res.data || []);
    } catch (error) {
      message.error('加载动作库失败');
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = () => {
    loadExercises();
  };

  const handleCreate = () => {
    form.resetFields();
    setModalVisible(true);
  };

  const handleSubmit = async () => {
    try {
      const values = await form.validateFields();
      await exerciseService.createExercise(values);
      message.success('动作创建成功');
      setModalVisible(false);
      loadExercises();
    } catch (error: any) {
      message.error(error?.error || '创建失败');
    }
  };

  const columns = [
    {
      title: '动作名称',
      dataIndex: 'name',
      key: 'name',
      render: (name: string, record: Exercise) => (
        <span>
          <Text strong>{name}</Text>
          {record.is_preset && (
            <Tag color="gold" style={{ marginLeft: 8, fontSize: 10 }}>预置</Tag>
          )}
        </span>
      ),
    },
    {
      title: '肌群',
      dataIndex: 'muscle_group',
      key: 'muscle_group',
      render: (group: string) => (
        <Tag color={MUSCLE_GROUP_COLORS[group]}>
          {MUSCLE_GROUP_LABELS[group] || group}
        </Tag>
      ),
    },
    {
      title: '类别',
      dataIndex: 'category',
      key: 'category',
      render: (category: string) => CATEGORY_LABELS[category] || category,
    },
    {
      title: '说明',
      dataIndex: 'description',
      key: 'description',
      width: 250,
      render: (desc: string) => desc || '-',
    },
  ];

  return (
    <div>
      <Row justify="space-between" align="middle" style={{ marginBottom: 16 }}>
        <Col>
          <Title level={2} style={{ margin: 0 }}>
            动作库
          </Title>
        </Col>
        <Col>
          <Button type="primary" icon={<PlusOutlined />} onClick={handleCreate}>
            自定义动作
          </Button>
        </Col>
      </Row>

      <Card variant="outlined" style={{ marginBottom: 16 }}>
        <Row gutter={16} align="middle">
          <Col xs={24} sm={12} lg={6}>
            <Input.Search
              placeholder="搜索动作名称..."
              value={searchText}
              onChange={e => setSearchText(e.target.value)}
              onSearch={handleSearch}
              enterButton={<SearchOutlined />}
              allowClear
            />
          </Col>
          <Col xs={24} sm={12} lg={6}>
            <Select
              placeholder="按肌群筛选"
              value={muscleFilter}
              onChange={setMuscleFilter}
              allowClear
              style={{ width: '100%' }}
            >
              {Object.entries(MUSCLE_GROUP_LABELS).map(([key, label]) => (
                <Option key={key} value={key}>{label}</Option>
              ))}
            </Select>
          </Col>
        </Row>
      </Card>

      <Card variant="outlined">
        <Table
          rowKey="id"
          columns={columns}
          dataSource={exercises}
          loading={loading}
          pagination={{
            showSizeChanger: true,
            showTotal: (total) => `共 ${total} 个动作`,
          }}
        />
      </Card>

      <Modal
        title="创建自定义动作"
        open={modalVisible}
        onOk={handleSubmit}
        onCancel={() => setModalVisible(false)}
        destroyOnHidden
      >
        <Form form={form} layout="vertical">
          <Form.Item
            label="动作名称"
            name="name"
            rules={[{ required: true, message: '请输入动作名称' }]}
          >
            <Input placeholder="如：哑铃侧平举" />
          </Form.Item>
          <Form.Item
            label="肌群"
            name="muscle_group"
            rules={[{ required: true, message: '请选择肌群' }]}
          >
            <Select placeholder="选择目标肌群">
              {Object.entries(MUSCLE_GROUP_LABELS).map(([key, label]) => (
                <Option key={key} value={key}>{label}</Option>
              ))}
            </Select>
          </Form.Item>
          <Form.Item
            label="类别"
            name="category"
            rules={[{ required: true, message: '请选择类别' }]}
          >
            <Select placeholder="选择动作类别">
              <Option value="compound">复合动作</Option>
              <Option value="isolation">孤立动作</Option>
              <Option value="cardio">有氧</Option>
            </Select>
          </Form.Item>
          <Form.Item label="说明" name="description">
            <TextArea rows={3} placeholder="简要描述动作要领" />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
};

export default ExercisesPage;