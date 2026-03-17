import React, { useState, useEffect } from 'react';
import {
  Card,
  Button,
  Table,
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
  Statistic,
  DatePicker,
  Tag,
} from 'antd';
import {
  PlusOutlined,
  EditOutlined,
  DeleteOutlined,
  FireOutlined,
  AimOutlined,
  CalendarOutlined,
} from '@ant-design/icons';
import type { WorkoutLog, FitnessPlan } from '../types';
import { workoutService, planService } from '../services/api';
import dayjs from 'dayjs';

const { Title, Text } = Typography;
const { TextArea } = Input;
const { Option } = Select;
const { RangePicker } = DatePicker;

const DIFFICULTY_LABELS: Record<string, string> = {
  beginner: '初级',
  intermediate: '中级',
  advanced: '高级',
};

const WorkoutsPage: React.FC = () => {
  const [workouts, setWorkouts] = useState<WorkoutLog[]>([]);
  const [plans, setPlans] = useState<FitnessPlan[]>([]);
  const [stats, setStats] = useState<any>({});
  const [loading, setLoading] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [editingWorkout, setEditingWorkout] = useState<WorkoutLog | null>(null);
  const [dateRange, setDateRange] = useState<[dayjs.Dayjs | null, dayjs.Dayjs | null] | null>(null);
  const [form] = Form.useForm();

  useEffect(() => {
    loadData();
    loadPlans();
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      const params: any = { limit: 100 };
      if (dateRange) {
        params.start_date = dateRange[0]?.format('YYYY-MM-DD');
        params.end_date = dateRange[1]?.format('YYYY-MM-DD');
      }
      const [workoutRes, statsRes] = await Promise.all([
        workoutService.getWorkouts(params),
        workoutService.getStats(params),
      ]);
      setWorkouts(workoutRes.data || []);
      setStats(statsRes.data || {});
    } catch (error) {
      message.error('加载训练数据失败');
    } finally {
      setLoading(false);
    }
  };

  const loadPlans = async () => {
    try {
      const res = await planService.getMyPlans();
      setPlans(res.data || []);
    } catch (error) {
      // 静默失败
    }
  };

  const handleCreate = () => {
    setEditingWorkout(null);
    form.resetFields();
    form.setFieldsValue({
      workout_date: dayjs(),
      duration_minutes: 60,
    });
    setModalVisible(true);
  };

  const handleEdit = (record: WorkoutLog) => {
    setEditingWorkout(record);
    form.setFieldsValue({
      ...record,
      workout_date: dayjs(record.workout_date),
    });
    setModalVisible(true);
  };

  const handleDelete = async (id: string) => {
    Modal.confirm({
      title: '确认删除',
      content: '确定要删除这条训练记录吗？',
      onOk: async () => {
        try {
          await workoutService.deleteWorkout(id);
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
      const submitData = {
        ...values,
        workout_date: values.workout_date.format('YYYY-MM-DD'),
      };

      if (editingWorkout) {
        await workoutService.updateWorkout(editingWorkout.id, submitData);
        message.success('更新成功');
      } else {
        await workoutService.createWorkout(submitData);
        message.success('记录成功');
      }
      setModalVisible(false);
      loadData();
    } catch (error) {
      message.error('操作失败');
    }
  };

  const getIntensityColor = (duration: number, calories?: number) => {
    // 简单的强度计算逻辑
    const intensity = calories ? calories / duration : 0;
    if (intensity > 10) return 'red'; // 高强度
    if (intensity > 7) return 'orange'; // 中高强度
    if (intensity > 5) return 'gold'; // 中等强度
    return 'green'; // 低强度
  };

  const getIntensityLabel = (duration: number, calories?: number) => {
    const intensity = calories ? calories / duration : 0;
    if (intensity > 10) return '高强度';
    if (intensity > 7) return '中高强度';
    if (intensity > 5) return '中等强度';
    return '低强度';
  };

  const columns = [
    {
      title: '训练日期',
      dataIndex: 'workout_date',
      key: 'workout_date',
      render: (date: string) => (
        <Space>
          <CalendarOutlined />
          <Text>{new Date(date).toLocaleDateString('zh-CN')}</Text>
        </Space>
      ),
    },
    {
      title: '训练计划',
      dataIndex: 'plan_name',
      key: 'plan_name',
      render: (planName: string) => (
        planName ? (
          <Tag icon={<AimOutlined />} color="blue">
            {planName}
          </Tag>
        ) : (
          <Text type="secondary">自由训练</Text>
        )
      ),
    },
    {
      title: '时长',
      dataIndex: 'duration_minutes',
      key: 'duration_minutes',
      width: 100,
      render: (duration: number) => `${duration} 分钟`,
    },
    {
      title: '消耗',
      dataIndex: 'calories_burned',
      key: 'calories_burned',
      width: 100,
      render: (calories: number) => (
        calories ? (
          <Space>
            <FireOutlined style={{ color: '#E91E63' }} />
            <Text>{calories} kcal</Text>
          </Space>
        ) : '-'
      ),
    },
    {
      title: '强度',
      key: 'intensity',
      width: 100,
      render: (_: any, record: WorkoutLog) => (
        <Tag color={getIntensityColor(record.duration_minutes, record.calories_burned)}>
          {getIntensityLabel(record.duration_minutes, record.calories_burned)}
        </Tag>
      ),
    },
    {
      title: '备注',
      dataIndex: 'notes',
      key: 'notes',
      width: 150,
      render: (notes: string) => {
        if (!notes) return '-';
        return (
          <Text ellipsis style={{ maxWidth: 150 }}>
            {notes}
          </Text>
        );
      },
    },
    {
      title: '操作',
      key: 'action',
      width: 150,
      render: (_: any, record: WorkoutLog) => (
        <Space>
          <Button type="link" icon={<EditOutlined />} onClick={() => handleEdit(record)}>
            编辑
          </Button>
          <Button type="link" danger icon={<DeleteOutlined />} onClick={() => handleDelete(record.id)}>
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
            📅 训练日志
          </Title>
        </Col>
        <Col>
          <Button type="primary" icon={<PlusOutlined />} onClick={handleCreate}>
            记录训练
          </Button>
        </Col>
      </Row>

      {/* 统计卡片 */}
      <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
        <Col xs={24} sm={12} lg={6}>
          <Card>
            <Statistic
              title="总训练次数"
              value={stats.total_workouts || 0}
              prefix={<CalendarOutlined />}
              styles={{ content: { color: '#00B8D9' } }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card>
            <Statistic
              title="总训练时长"
              value={stats.total_duration || 0}
              suffix="分钟"
              prefix={<AimOutlined />}
              styles={{ content: { color: '#00C853' } }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card>
            <Statistic
              title="总消耗热量"
              value={stats.total_calories || 0}
              suffix="kcal"
              prefix={<FireOutlined />}
              precision={0}
              styles={{ content: { color: '#E91E63' } }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card>
            <Statistic
              title="平均时长"
              value={stats.avg_duration || 0}
              suffix="分钟"
              precision={0}
              styles={{ content: { color: '#FF9800' } }}
            />
          </Card>
        </Col>
      </Row>

      <Card variant="outlined">
        <Row justify="space-between" align="middle" style={{ marginBottom: 16 }}>
          <Col>
            <Space>
              <Text>时间范围：</Text>
              <RangePicker
                value={dateRange}
                onChange={(dates) => setDateRange(dates as any)}
                format="YYYY-MM-DD"
              />
              <Button onClick={() => { setDateRange(null); loadData(); }}>
                重置
              </Button>
            </Space>
          </Col>
          <Col>
            <Button type="default" onClick={loadData}>
              刷新
            </Button>
          </Col>
        </Row>

        <Table
          rowKey="id"
          columns={columns}
          dataSource={workouts}
          loading={loading}
          pagination={{
            showSizeChanger: true,
            showTotal: (total) => `共 ${total} 条记录`,
          }}
        />
      </Card>

      {/* 创建/编辑弹窗 */}
      <Modal
        title={editingWorkout ? '编辑训练记录' : '记录训练'}
        open={modalVisible}
        onOk={handleSubmit}
        onCancel={() => setModalVisible(false)}
        width={600}
        destroyOnHidden
      >
        <Form form={form} layout="vertical">
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                label="训练日期"
                name="workout_date"
                rules={[{ required: true, message: '请选择日期' }]}
              >
                <DatePicker style={{ width: '100%' }} format="YYYY-MM-DD" />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                label="时长（分钟）"
                name="duration_minutes"
                rules={[{ required: true, message: '请输入训练时长' }]}
              >
                <InputNumber min={1} max={480} style={{ width: '100%' }} placeholder="60" />
              </Form.Item>
            </Col>
          </Row>

          <Form.Item label="训练计划" name="plan_id">
            <Select placeholder="选择训练计划（可选）" allowClear>
              {plans.map(plan => (
                <Option key={plan.id} value={plan.id}>
                  {plan.name} ({DIFFICULTY_LABELS[plan.difficulty]})
                </Option>
              ))}
            </Select>
          </Form.Item>

          <Form.Item label="消耗热量（kcal）" name="calories_burned">
            <InputNumber min={10} max={5000} style={{ width: '100%' }} placeholder="200" />
          </Form.Item>

          <Form.Item label="备注" name="notes">
            <TextArea rows={4} placeholder="记录训练感受、突破等..." />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
};

export default WorkoutsPage;