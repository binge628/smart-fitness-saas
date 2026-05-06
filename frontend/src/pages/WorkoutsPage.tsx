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
  Descriptions,
  Divider,
  Calendar,
  Badge,
  Segmented,
} from 'antd';
import {
  PlusOutlined,
  EditOutlined,
  DeleteOutlined,
  FireOutlined,
  AimOutlined,
  CalendarOutlined,
  EyeOutlined,
  ClockCircleOutlined,
  FileTextOutlined,
  MinusCircleOutlined,
  ThunderboltOutlined,
  UnorderedListOutlined,
} from '@ant-design/icons';
import type { WorkoutLog, FitnessPlan, Exercise, WorkoutSet } from '../types';
import { workoutService, planService, exerciseService } from '../services/api';
import dayjs from 'dayjs';
import WorkoutStatsChart from '../components/WorkoutStatsChart';

const { Title, Text } = Typography;
const { TextArea } = Input;
const { Option } = Select;
const { RangePicker } = DatePicker;

const DIFFICULTY_LABELS: Record<string, string> = {
  beginner: '初级',
  intermediate: '中级',
  advanced: '高级',
};

const MUSCLE_GROUP_LABELS: Record<string, string> = {
  chest: '胸', back: '背', shoulder: '肩', leg: '腿',
  arm: '臂', core: '核心', full_body: '全身', cardio: '有氧',
};

const WorkoutsPage: React.FC = () => {
  const [workouts, setWorkouts] = useState<WorkoutLog[]>([]);
  const [plans, setPlans] = useState<FitnessPlan[]>([]);
  const [exercises, setExercises] = useState<Exercise[]>([]);
  const [stats, setStats] = useState<any>({});
  const [loading, setLoading] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [detailVisible, setDetailVisible] = useState(false);
  const [editingWorkout, setEditingWorkout] = useState<WorkoutLog | null>(null);
  const [viewingWorkout, setViewingWorkout] = useState<WorkoutLog | null>(null);
  const [dateRange, setDateRange] = useState<[dayjs.Dayjs | null, dayjs.Dayjs | null] | null>(null);
  const [viewMode, setViewMode] = useState<'table' | 'calendar'>('table');
  // 组数临时状态
  const [workoutSets, setWorkoutSets] = useState<Array<{
    exercise_id: string;
    set_order: number;
    weight?: number;
    reps?: number;
    rest_seconds?: number;
  }>>([]);
  const [form] = Form.useForm();

  useEffect(() => {
    loadData();
    loadPlans();
    loadExercises();
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
      // 同时获取我的计划和预设模板
      const [myPlansRes, templatesRes] = await Promise.all([
        planService.getMyPlans(),
        planService.getPlans({ is_template: true }),
      ]);
      const myPlans = myPlansRes.data || [];
      const templates = templatesRes.data || [];
      // 预设模板在前，我的计划在后
      setPlans([...templates, ...myPlans]);
    } catch (error) { /* silent */ }
  };

  const loadExercises = async () => {
    try {
      const res = await exerciseService.getExercises({ limit: 100 });
      setExercises(res.data || []);
    } catch (error) { /* silent */ }
  };

  const handleCreate = () => {
    setEditingWorkout(null);
    form.resetFields();
    form.setFieldsValue({ workout_date: dayjs(), duration_minutes: 60 });
    setWorkoutSets([]);
    setModalVisible(true);
  };

  const handleEdit = (record: WorkoutLog) => {
    setEditingWorkout(record);
    form.setFieldsValue({
      ...record,
      workout_date: dayjs(record.workout_date),
    });
    setWorkoutSets(
      (record.sets || []).map(s => ({
        exercise_id: s.exercise_id,
        set_order: s.set_order,
        weight: s.weight || undefined,
        reps: s.reps || undefined,
        rest_seconds: s.rest_seconds || undefined,
      }))
    );
    setModalVisible(true);
  };

  const handleView = (record: WorkoutLog) => {
    setViewingWorkout(record);
    setDetailVisible(true);
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

  // 组数操作
  const addSet = () => {
    setWorkoutSets([...workoutSets, { exercise_id: '', set_order: workoutSets.length + 1 }]);
  };

  const removeSet = (index: number) => {
    const updated = workoutSets.filter((_, i) => i !== index).map((s, i) => ({ ...s, set_order: i + 1 }));
    setWorkoutSets(updated);
  };

  const updateSet = (index: number, field: string, value: any) => {
    const updated = [...workoutSets];
    updated[index] = { ...updated[index], [field]: value };
    setWorkoutSets(updated);
  };

  const handleSubmit = async () => {
    try {
      const values = await form.validateFields();
      // 过滤掉空的 sets，并确保类型正确
      const filteredSets = workoutSets
        .filter(s => s.exercise_id)
        .map(s => ({
          exercise_id: s.exercise_id,
          set_order: s.set_order,
          weight: s.weight == null || s.weight === '' ? null : Number(s.weight),
          reps: s.reps == null || s.reps === '' ? null : Number(s.reps),
          rest_seconds: s.rest_seconds == null || s.rest_seconds === '' ? null : Number(s.rest_seconds),
        }));

      const submitData: any = {
        ...values,
        workout_date: values.workout_date.format('YYYY-MM-DD'),
        calories_burned: values.calories_burned == null || values.calories_burned === '' ? null : Number(values.calories_burned),
        notes: values.notes == null || values.notes === '' ? null : values.notes,
        sets: filteredSets,
      };

      console.log('[Workout Submit]', JSON.stringify(submitData));

      if (editingWorkout) {
        await workoutService.updateWorkout(editingWorkout.id, submitData);
        message.success('更新成功');
      } else {
        await workoutService.createWorkout(submitData);
        message.success('记录成功');
      }
      setModalVisible(false);
      loadData();
    } catch (error: any) {
      console.error('[Workout Error]', error);
      message.error(error?.error || '操作失败');
    }
  };

  const getIntensityColor = (duration: number, calories?: number) => {
    const intensity = calories ? calories / duration : 0;
    if (intensity > 10) return 'red';
    if (intensity > 7) return 'orange';
    if (intensity > 5) return 'gold';
    return 'green';
  };

  const getIntensityLabel = (duration: number, calories?: number) => {
    const intensity = calories ? calories / duration : 0;
    if (intensity > 10) return '高强度';
    if (intensity > 7) return '中高强度';
    if (intensity > 5) return '中等强度';
    return '低强度';
  };

  // 获取动作名
  const getExerciseName = (id: string) => exercises.find(e => e.id === id)?.name || '未知动作';

  // 按日期分组训练记录
  const getWorkoutsByDate = () => {
    const map: Record<string, WorkoutLog[]> = {};
    workouts.forEach(w => {
      const dateKey = w.workout_date;
      if (!map[dateKey]) map[dateKey] = [];
      map[dateKey].push(w);
    });
    return map;
  };
  const workoutsByDate = getWorkoutsByDate();

  // 获取某天的训练记录
  const getWorkoutsForDate = (date: dayjs.Dayjs): WorkoutLog[] => {
    const dateKey = date.format('YYYY-MM-DD');
    return workoutsByDate[dateKey] || [];
  };

  // 日历单元格渲染
  const dateCellRender = (date: dayjs.Dayjs) => {
    const dayWorkouts = getWorkoutsForDate(date);
    if (dayWorkouts.length === 0) return null;

    const totalDuration = dayWorkouts.reduce((sum, w) => sum + w.duration_minutes, 0);
    const totalCalories = dayWorkouts.reduce((sum, w) => sum + (w.calories_burned || 0), 0);

    // 根据强度显示不同颜色
    const intensity = totalCalories / totalDuration;
    let statusColor = 'success';
    if (intensity > 10) statusColor = 'error';
    else if (intensity > 7) statusColor = 'warning';

    return (
      <div style={{ textAlign: 'center' }}>
        <Badge status={statusColor as any} />
        <div style={{ fontSize: 10, color: '#666' }}>
          {dayWorkouts.length}次 · {totalDuration}分钟
        </div>
      </div>
    );
  };

  // 点击日期处理
  const handleDateClick = (date: dayjs.Dayjs) => {
    const dayWorkouts = getWorkoutsForDate(date);
    if (dayWorkouts.length > 0) {
      setViewingWorkout(dayWorkouts[0]);
      setDetailVisible(true);
    } else {
      // 无训练的日期，点击快速创建
      setEditingWorkout(null);
      form.resetFields();
      form.setFieldsValue({ workout_date: date, duration_minutes: 60 });
      setWorkoutSets([]);
      setModalVisible(true);
    }
  };

  const columns = [
    {
      title: '训练日期',
      dataIndex: 'workout_date',
      key: 'workout_date',
      render: (date: string) => (
        <Space><CalendarOutlined /><Text>{new Date(date).toLocaleDateString('zh-CN')}</Text></Space>
      ),
    },
    {
      title: '训练计划',
      dataIndex: 'plan_name',
      key: 'plan_name',
      render: (planName: string) => planName ? <Tag icon={<AimOutlined />} color="blue">{planName}</Tag> : <Text type="secondary">自由训练</Text>,
    },
    {
      title: '动作数',
      key: 'exercise_count',
      width: 80,
      render: (_: any, record: WorkoutLog) => {
        const count = record.sets?.length ? new Set(record.sets.map(s => s.exercise_id)).size : 0;
        return count > 0 ? <Tag color="blue">{count} 个</Tag> : '-';
      },
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
      render: (calories: number) => calories ? <Space><FireOutlined style={{ color: '#E91E63' }} /><Text>{calories} kcal</Text></Space> : '-',
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
      width: 120,
      render: (notes: string) => notes ? <Text ellipsis style={{ maxWidth: 120 }}>{notes}</Text> : '-',
    },
    {
      title: '操作',
      key: 'action',
      render: (_: any, record: WorkoutLog) => (
        <Space size="small">
          <Button type="link" size="small" icon={<EyeOutlined />} onClick={() => handleView(record)}>查看</Button>
          <Button type="link" size="small" icon={<EditOutlined />} onClick={() => handleEdit(record)}>编辑</Button>
          <Button type="link" size="small" danger icon={<DeleteOutlined />} onClick={() => handleDelete(record.id)}>删除</Button>
        </Space>
      ),
    },
  ];

  return (
    <div>
      <Row justify="space-between" align="middle" style={{ marginBottom: 16 }}>
        <Col><Title level={2} style={{ margin: 0 }}>训练日志</Title></Col>
        <Col><Button type="primary" icon={<PlusOutlined />} onClick={handleCreate}>记录训练</Button></Col>
      </Row>

      <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
        <Col xs={24} sm={12} lg={6}><Card><Statistic title="总训练次数" value={stats.total_workouts || 0} prefix={<CalendarOutlined />} styles={{ content: { color: '#00B8D9' } }} /></Card></Col>
        <Col xs={24} sm={12} lg={6}><Card><Statistic title="总训练时长" value={stats.total_duration || 0} suffix="分钟" prefix={<AimOutlined />} styles={{ content: { color: '#00C853' } }} /></Card></Col>
        <Col xs={24} sm={12} lg={6}><Card><Statistic title="总消耗热量" value={stats.total_calories || 0} suffix="kcal" prefix={<FireOutlined />} precision={0} styles={{ content: { color: '#E91E63' } }} /></Card></Col>
        <Col xs={24} sm={12} lg={6}><Card><Statistic title="平均时长" value={stats.avg_duration || 0} suffix="分钟" precision={0} styles={{ content: { color: '#FF9800' } }} /></Card></Col>
      </Row>

      <WorkoutStatsChart data={workouts} />

      <Card variant="outlined" style={{ marginTop: 16 }}>
        <Row justify="space-between" align="middle" style={{ marginBottom: 16 }}>
          <Col>
            <Space>
              <Text>时间范围：</Text>
              <RangePicker value={dateRange} onChange={(dates) => setDateRange(dates as any)} format="YYYY-MM-DD" />
              <Button onClick={() => { setDateRange(null); loadData(); }}>重置</Button>
            </Space>
          </Col>
          <Col>
            <Space>
              <Segmented
                options={[
                  { label: <span><UnorderedListOutlined /> 列表</span>, value: 'table' },
                  { label: <span><CalendarOutlined /> 日历</span>, value: 'calendar' },
                ]}
                value={viewMode}
                onChange={(v) => setViewMode(v as 'table' | 'calendar')}
              />
              <Button type="default" onClick={loadData}>刷新</Button>
            </Space>
          </Col>
        </Row>

        {viewMode === 'table' ? (
          <Table rowKey="id" columns={columns} dataSource={workouts} loading={loading} scroll={{ x: 1400 }}
            pagination={{ showSizeChanger: true, showTotal: (total) => `共 ${total} 条记录` }} />
        ) : (
          <Calendar
            fullscreen={true}
            cellRender={(current, info) => {
              if (info.type === 'date') return dateCellRender(current);
              return info.originNode;
            }}
            onSelect={(date) => handleDateClick(date)}
          />
        )}
      </Card>

      {/* 创建/编辑弹窗 */}
      <Modal
        title={editingWorkout ? '编辑训练记录' : '记录训练'}
        open={modalVisible}
        onOk={handleSubmit}
        onCancel={() => setModalVisible(false)}
        width={700}
        destroyOnHidden
      >
        <Form form={form} layout="vertical">
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item label="训练日期" name="workout_date" rules={[{ required: true, message: '请选择日期' }]}>
                <DatePicker style={{ width: '100%' }} format="YYYY-MM-DD" />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item label="时长（分钟）" name="duration_minutes" rules={[{ required: true, message: '请输入训练时长' }]}>
                <InputNumber min={1} max={480} style={{ width: '100%' }} placeholder="60" />
              </Form.Item>
            </Col>
          </Row>
          <Form.Item label="训练计划" name="plan_id">
            <Select placeholder="选择训练计划（可选）" allowClear>
              {plans.map(plan => (<Option key={plan.id} value={plan.id}>{plan.name} ({DIFFICULTY_LABELS[plan.difficulty]})</Option>))}
            </Select>
          </Form.Item>
          <Form.Item label="消耗热量（kcal）" name="calories_burned">
            <InputNumber min={10} max={5000} style={{ width: '100%' }} placeholder="200" />
          </Form.Item>
        </Form>

        <Divider>训练动作 & 组数</Divider>

        {workoutSets.map((set, index) => (
          <Row gutter={8} key={index} style={{ marginBottom: 8 }} align="middle">
            <Col span={1}><Text type="secondary">{index + 1}</Text></Col>
            <Col span={7}>
              <Select
                placeholder="选择动作"
                value={set.exercise_id || undefined}
                onChange={(v) => updateSet(index, 'exercise_id', v)}
                style={{ width: '100%' }}
                showSearch
                optionFilterProp="children"
              >
                {exercises.map(ex => (
                  <Option key={ex.id} value={ex.id}>{ex.name}</Option>
                ))}
              </Select>
            </Col>
            <Col span={4}>
              <InputNumber
                placeholder="重量kg"
                min={0} max={500} step={0.5}
                value={set.weight}
                onChange={(v) => updateSet(index, 'weight', v || undefined)}
                style={{ width: '100%' }}
              />
            </Col>
            <Col span={3}>
              <InputNumber
                placeholder="次数"
                min={1} max={100}
                value={set.reps}
                onChange={(v) => updateSet(index, 'reps', v || undefined)}
                style={{ width: '100%' }}
              />
            </Col>
            <Col span={4}>
              <InputNumber
                placeholder="休息秒"
                min={0} max={600}
                value={set.rest_seconds}
                onChange={(v) => updateSet(index, 'rest_seconds', v || undefined)}
                style={{ width: '100%' }}
              />
            </Col>
            <Col span={1}>
              <Button type="text" danger icon={<MinusCircleOutlined />} onClick={() => removeSet(index)} />
            </Col>
          </Row>
        ))}
        <Button type="dashed" onClick={addSet} block icon={<PlusOutlined />} style={{ marginBottom: 16 }}>
          添加一组
        </Button>

        <Form form={form} layout="vertical">
          <Form.Item label="备注" name="notes">
            <TextArea rows={3} placeholder="记录训练感受、突破等..." />
          </Form.Item>
        </Form>
      </Modal>

      {/* 详情弹窗 */}
      <Modal
        title={<Space><FileTextOutlined /><span>训练详情</span></Space>}
        open={detailVisible}
        onCancel={() => setDetailVisible(false)}
        footer={[<Button key="close" onClick={() => setDetailVisible(false)}>关闭</Button>]}
        width={700}
      >
        {viewingWorkout && (
          <>
            <Descriptions column={2} bordered size="small">
              <Descriptions.Item label="训练日期" span={2}>
                <Space><CalendarOutlined />{new Date(viewingWorkout.workout_date).toLocaleDateString('zh-CN')}</Space>
              </Descriptions.Item>
              <Descriptions.Item label="训练计划" span={2}>
                {viewingWorkout.plan_name ? <Tag color="blue">{viewingWorkout.plan_name}</Tag> : <Text type="secondary">自由训练</Text>}
              </Descriptions.Item>
              <Descriptions.Item label="训练时长"><Space><ClockCircleOutlined />{viewingWorkout.duration_minutes} 分钟</Space></Descriptions.Item>
              <Descriptions.Item label="消耗热量">
                {viewingWorkout.calories_burned ? <Space><FireOutlined style={{ color: '#E91E63' }} />{viewingWorkout.calories_burned} kcal</Space> : '-'}
              </Descriptions.Item>
              <Descriptions.Item label="训练强度" span={2}>
                <Tag color={getIntensityColor(viewingWorkout.duration_minutes, viewingWorkout.calories_burned)}>
                  {getIntensityLabel(viewingWorkout.duration_minutes, viewingWorkout.calories_burned)}
                </Tag>
              </Descriptions.Item>
            </Descriptions>

            {viewingWorkout.sets && viewingWorkout.sets.length > 0 && (
              <>
                <Divider orientation="left" style={{ fontSize: 14 }}>训练组数</Divider>
                <Table
                  size="small"
                  pagination={false}
                  dataSource={viewingWorkout.sets}
                  rowKey="id"
                  columns={[
                    { title: '#', dataIndex: 'set_order', width: 40 },
                    { title: '动作', dataIndex: 'exercise_name', render: (name: string, record: WorkoutSet) => (
                      <Space>
                        <ThunderboltOutlined />
                        <Text strong>{name}</Text>
                        <Tag style={{ fontSize: 10 }}>{MUSCLE_GROUP_LABELS[record.muscle_group || ''] || ''}</Tag>
                      </Space>
                    )},
                    { title: '重量', dataIndex: 'weight', width: 80, render: (v: number) => v ? `${v} kg` : '-' },
                    { title: '次数', dataIndex: 'reps', width: 60, render: (v: number) => v || '-' },
                    { title: '休息', dataIndex: 'rest_seconds', width: 70, render: (v: number) => v ? `${v}s` : '-' },
                  ]}
                />
              </>
            )}

            {viewingWorkout.notes && (
              <div style={{ marginTop: 16 }}>
                <Text type="secondary">备注：</Text>
                <Text>{viewingWorkout.notes}</Text>
              </div>
            )}
          </>
        )}
      </Modal>
    </div>
  );
};

export default WorkoutsPage;