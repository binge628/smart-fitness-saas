import React, { useState, useEffect } from 'react';
import {
  Card,
  Button,
  Table,
  Space,
  Modal,
  Form,
  InputNumber,
  message,
  Typography,
  Row,
  Col,
  DatePicker,
  Statistic,
  Tag,
  Descriptions,
} from 'antd';
import {
  PlusOutlined,
  EditOutlined,
  DeleteOutlined,
  RiseOutlined,
  FallOutlined,
  EyeOutlined,
  FileTextOutlined,
} from '@ant-design/icons';
import type { HealthData } from '../types';
import { healthService } from '../services/api';
import dayjs from 'dayjs';
import HealthDataChart from '../components/HealthDataChart';

const { Title, Text } = Typography;
const { RangePicker } = DatePicker;

const HealthDataPage: React.FC = () => {
  const [healthData, setHealthData] = useState<HealthData[]>([]);
  const [stats, setStats] = useState<any>({});
  const [loading, setLoading] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [detailVisible, setDetailVisible] = useState(false);
  const [editingData, setEditingData] = useState<HealthData | null>(null);
  const [viewingData, setViewingData] = useState<HealthData | null>(null);
  const [dateRange, setDateRange] = useState<[dayjs.Dayjs | null, dayjs.Dayjs | null] | null>(null);
  const [form] = Form.useForm();

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      const params: any = { limit: 100 };
      if (dateRange) {
        params.start_date = dateRange[0]?.format('YYYY-MM-DD');
        params.end_date = dateRange[1]?.format('YYYY-MM-DD');
      }
      const [dataRes, statsRes] = await Promise.all([
        healthService.getHealthData(params),
        healthService.getStats(params),
      ]);
      setHealthData(dataRes.data || []);
      setStats(statsRes.data || {});
    } catch (error) {
      message.error('加载数据失败');
    } finally {
      setLoading(false);
    }
  };

  // 计算BMI
  const calculateBMI = (weight?: number, height?: number) => {
    if (weight && height) {
      const heightInMeters = height / 100;
      return (weight / (heightInMeters * heightInMeters)).toFixed(1);
    }
    return '-';
  };

  // 获取BMI状态
  const getBMIStatus = (bmi: string) => {
    const bmiNum = parseFloat(bmi);
    if (bmiNum < 18.5) return { text: '偏瘦', color: 'orange' };
    if (bmiNum < 24) return { text: '正常', color: 'green' };
    if (bmiNum < 28) return { text: '超重', color: 'orange' };
    return { text: '肥胖', color: 'red' };
  };

  // 比较与前一次记录的变化
  const getChangeIndicator = (current?: number, previous?: number) => {
    if (current === undefined || previous === undefined) return null;
    if (current > previous) return <ChangeIcon type="up" value={current - previous} />;
    if (current < previous) return <ChangeIcon type="down" value={previous - current} />;
    return <span style={{ color: '#999' }}>持平</span>;
  };

  const handleCreate = () => {
    setEditingData(null);
    form.resetFields();
    form.setFieldsValue({
      record_date: dayjs(),
    });
    setModalVisible(true);
  };

  const handleEdit = (record: HealthData) => {
    setEditingData(record);
    form.setFieldsValue({
      ...record,
      record_date: dayjs(record.record_date),
    });
    setModalVisible(true);
  };

  const handleView = (record: HealthData) => {
    setViewingData(record);
    setDetailVisible(true);
  };

  const handleDelete = async (id: string) => {
    Modal.confirm({
      title: '确认删除',
      content: '确定要删除这条健康数据吗？',
      onOk: async () => {
        try {
          await healthService.deleteHealthData(id);
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
        record_date: values.record_date.format('YYYY-MM-DD'),
      };

      if (editingData) {
        await healthService.updateHealthData(editingData.id, submitData);
        message.success('更新成功');
      } else {
        await healthService.createHealthData(submitData);
        message.success('记录成功');
      }
      setModalVisible(false);
      loadData();
    } catch (error) {
      message.error('操作失败');
    }
  };

  const ChangeIcon = ({ type, value }: { type: 'up' | 'down'; value: number }) => {
    const isWeightLow = (field: string) => {
      if (field === 'weight') return type === 'down';
      if (field === 'height') return false;
      if (field === 'body_fat_percentage') return type === 'down';
      return type === 'up';
    };

    const color = isWeightLow('weight') ? '#00C853' : '#E91E63';
    const icon = type === 'up' ? <RiseOutlined /> : <FallOutlined />;
    return (
      <span style={{ color }}>
        {icon} {value.toFixed(1)}
      </span>
    );
  };

  const columns = [
    {
      title: '记录日期',
      dataIndex: 'record_date',
      key: 'record_date',
      render: (date: string) => new Date(date).toLocaleDateString('zh-CN'),
    },
    {
      title: '体重 (kg)',
      dataIndex: 'weight',
      key: 'weight',
      width: 90,
      render: (weight: number, _: any, index: number) => {
        const prevWeight = healthData[index + 1]?.weight;
        return (
          <span>
            {weight} {getChangeIndicator(weight, prevWeight)}
          </span>
        );
      },
    },
    {
      title: '身高 (cm)',
      dataIndex: 'height',
      key: 'height',
      width: 90,
    },
    {
      title: 'BMI',
      key: 'bmi',
      width: 80,
      render: (_: any, record: HealthData) => {
        const bmi = calculateBMI(record.weight, record.height);
        if (bmi === '-') return '-';
        const status = getBMIStatus(bmi);
        return (
          <Tag color={status.color}>
            {bmi} ({status.text})
          </Tag>
        );
      },
    },
    {
      title: '体脂率 (%)',
      dataIndex: 'body_fat_percentage',
      key: 'body_fat_percentage',
      width: 90,
    },
    {
      title: '肌肉量 (kg)',
      dataIndex: 'muscle_mass',
      key: 'muscle_mass',
      width: 100,
    },
    {
      title: '静息心率',
      dataIndex: 'heart_rate_resting',
      key: 'heart_rate_resting',
      width: 100,
      render: (hr: number) => hr || '-',
    },
    {
      title: '血压',
      key: 'blood_pressure',
      width: 100,
      render: (_: any, record: HealthData) => {
        if (record.blood_pressure_systolic && record.blood_pressure_diastolic) {
          return `${record.blood_pressure_systolic}/${record.blood_pressure_diastolic}`;
        }
        return '-';
      },
    },
    {
      title: '操作',
      key: 'action',
      render: (_: any, record: HealthData) => (
        <Space size="small">
          <Button
            type="link"
            size="small"
            icon={<EyeOutlined />}
            onClick={() => handleView(record)}
          >
            查看
          </Button>
          <Button
            type="link"
            size="small"
            icon={<EditOutlined />}
            onClick={() => handleEdit(record)}
          >
            编辑
          </Button>
          <Button
            type="link"
            size="small"
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
            💚 健康数据
          </Title>
        </Col>
        <Col>
          <Button type="primary" icon={<PlusOutlined />} onClick={handleCreate}>
            记录数据
          </Button>
        </Col>
      </Row>

      {/* 统计卡片 */}
      <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
        <Col xs={24} sm={12} lg={6}>
          <Card>
            <Statistic
              title="最新体重"
              value={healthData[0]?.weight || 0}
              suffix="kg"
              precision={1}
              styles={{ content: { color: '#00B8D9' } }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card>
            <Statistic
              title="最新BMI"
              value={calculateBMI(healthData[0]?.weight, healthData[0]?.height)}
              styles={{ content: { color: '#00C853' } }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card>
            <Statistic
              title="平均体脂率"
              value={stats.avg_body_fat || 0}
              suffix="%"
              precision={1}
              styles={{ content: { color: '#FF9800' } }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card>
            <Statistic
              title="记录次数"
              value={healthData.length}
              styles={{ content: { color: '#E91E63' } }}
            />
          </Card>
        </Col>
      </Row>

      {/* 趋势图表 */}
      <Row style={{ marginBottom: 24 }}>
        <Col span={24}>
          <HealthDataChart data={healthData} />
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
          dataSource={healthData}
          loading={loading}
          scroll={{ x: 1500 }}
          pagination={{
            showSizeChanger: true,
            showTotal: (total) => `共 ${total} 条记录`,
          }}
        />
      </Card>

      {/* 创建/编辑弹窗 */}
      <Modal
        title={editingData ? '编辑健康数据' : '记录健康数据'}
        open={modalVisible}
        onOk={handleSubmit}
        onCancel={() => setModalVisible(false)}
        width={700}
        destroyOnHidden
      >
        <Form form={form} layout="vertical">
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                label="记录日期"
                name="record_date"
                rules={[{ required: true, message: '请选择日期' }]}
              >
                <DatePicker style={{ width: '100%' }} format="YYYY-MM-DD" />
              </Form.Item>
            </Col>
          </Row>

          <Row gutter={16}>
            <Col span={12}>
              <Form.Item label="体重 (kg)" name="weight">
                <InputNumber min={20} max={300} step={0.1} style={{ width: '100%' }} placeholder="0.0" />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item label="身高 (cm)" name="height">
                <InputNumber min={100} max={250} style={{ width: '100%' }} placeholder="0" />
              </Form.Item>
            </Col>
          </Row>

          <Row gutter={16}>
            <Col span={12}>
              <Form.Item label="体脂率 (%)" name="body_fat_percentage">
                <InputNumber min={3} max={50} step={0.1} style={{ width: '100%' }} placeholder="0.0" />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item label="肌肉量 (kg)" name="muscle_mass">
                <InputNumber min={20} max={150} step={0.1} style={{ width: '100%' }} placeholder="0.0" />
              </Form.Item>
            </Col>
          </Row>

          <Row gutter={16}>
            <Col span={12}>
              <Form.Item label="静息心率 (bpm)" name="heart_rate_resting">
                <InputNumber min={40} max={120} style={{ width: '100%' }} placeholder="0" />
              </Form.Item>
            </Col>
          </Row>

          <Row gutter={16}>
            <Col span={12}>
              <Form.Item label="收缩压 (mmHg)" name="blood_pressure_systolic">
                <InputNumber min={60} max={250} style={{ width: '100%' }} placeholder="0" />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item label="舒张压 (mmHg)" name="blood_pressure_diastolic">
                <InputNumber min={40} max={150} style={{ width: '100%' }} placeholder="0" />
              </Form.Item>
            </Col>
          </Row>
        </Form>
      </Modal>

      {/* 详情弹窗 */}
      <Modal
        title={
          <Space>
            <FileTextOutlined />
            <span>健康数据详情</span>
          </Space>
        }
        open={detailVisible}
        onCancel={() => setDetailVisible(false)}
        footer={[
          <Button key="close" onClick={() => setDetailVisible(false)}>
            关闭
          </Button>,
        ]}
        width={700}
      >
        {viewingData && (
          <Descriptions column={2} bordered>
            <Descriptions.Item label="记录日期" span={2}>
              {new Date(viewingData.record_date).toLocaleDateString('zh-CN')}
            </Descriptions.Item>
            <Descriptions.Item label="体重">
              {viewingData.weight ? `${viewingData.weight} kg` : '-'}
            </Descriptions.Item>
            <Descriptions.Item label="身高">
              {viewingData.height ? `${viewingData.height} cm` : '-'}
            </Descriptions.Item>
            <Descriptions.Item label="BMI" span={2}>
              {viewingData.weight && viewingData.height ? (
                (() => {
                  const bmi = calculateBMI(viewingData.weight, viewingData.height);
                  const status = getBMIStatus(bmi);
                  return (
                    <Tag color={status.color}>
                      {bmi} ({status.text})
                    </Tag>
                  );
                })()
              ) : '-'}
            </Descriptions.Item>
            <Descriptions.Item label="体脂率">
              {viewingData.body_fat_percentage ? `${viewingData.body_fat_percentage}%` : '-'}
            </Descriptions.Item>
            <Descriptions.Item label="肌肉量">
              {viewingData.muscle_mass ? `${viewingData.muscle_mass} kg` : '-'}
            </Descriptions.Item>
            <Descriptions.Item label="静息心率">
              {viewingData.heart_rate_resting ? `${viewingData.heart_rate_resting} bpm` : '-'}
            </Descriptions.Item>
            <Descriptions.Item label="血压">
              {viewingData.blood_pressure_systolic && viewingData.blood_pressure_diastolic
                ? `${viewingData.blood_pressure_systolic}/${viewingData.blood_pressure_diastolic} mmHg`
                : '-'}
            </Descriptions.Item>
            <Descriptions.Item label="记录时间" span={2}>
              {new Date(viewingData.created_at).toLocaleString('zh-CN')}
            </Descriptions.Item>
          </Descriptions>
        )}
      </Modal>
    </div>
  );
};

export default HealthDataPage;