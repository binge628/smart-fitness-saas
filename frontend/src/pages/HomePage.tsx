import React, { useState, useEffect } from 'react';
import { Card, Row, Col, Statistic, Typography, message } from 'antd';
import {
  HeartOutlined,
  AimOutlined,
  CalendarOutlined,
  TrophyOutlined,
} from '@ant-design/icons';
import { workoutService, healthService, planService, gymService } from '../services/api';

const { Title } = Typography;

const HomePage: React.FC = () => {
  const [stats, setStats] = useState({
    totalWorkouts: 0,
    totalPlans: 0,
    totalGyms: 0,
    healthRecords: 0,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    try {
      const [workoutRes, planRes, gymRes, healthRes] = await Promise.all([
        workoutService.getStats(),
        planService.getPlans(),
        gymService.getMyGyms(),
        healthService.getHealthData({ limit: 100 }),
      ]);

      setStats({
        totalWorkouts: workoutRes.data?.total_workouts || 0,
        totalPlans: planRes.count || 0,
        totalGyms: gymRes.count || 0,
        healthRecords: healthRes.count || 0,
      });
    } catch (error) {
      message.error('加载数据失败');
    } finally {
      setLoading(false);
    }
  };

  const statCards = [
    {
      title: '总训练次数',
      value: stats.totalWorkouts,
      prefix: <CalendarOutlined style={{ color: '#00B8D9' }} />,
      color: '#00B8D9',
    },
    {
      title: '我的健身计划',
      value: stats.totalPlans,
      prefix: <AimOutlined style={{ color: '#00C853' }} />,
      color: '#00C853',
    },
    {
      title: '我的健身房',
      value: stats.totalGyms,
      prefix: <TrophyOutlined style={{ color: '#FF9800' }} />,
      color: '#FF9800',
    },
    {
      title: '健康记录',
      value: stats.healthRecords,
      prefix: <HeartOutlined style={{ color: '#E91E63' }} />,
      color: '#E91E63',
    },
  ];

  return (
    <div>
      <Title level={2} style={{ marginBottom: 24 }}>
        🎯 欢迎回来，开始今天的健身！
      </Title>

      <Row gutter={[16, 16]}>
        {statCards.map((card, index) => (
          <Col xs={24} sm={12} lg={6} key={index}>
            <Card
              loading={loading}
              variant="outlined"
              styles={{ body: { padding: '24px' } }}
            >
              <Statistic
                title={card.title}
                value={card.value}
                prefix={card.prefix}
                styles={{ content: { color: card.color } }}
              />
            </Card>
          </Col>
        ))}
      </Row>

      <Card
        title="💪 今日提示"
        variant="outlined"
        style={{ marginTop: 24 }}
      >
        <p style={{ fontSize: '16px', lineHeight: '1.8', marginBottom: 0 }}>
          坚持是最好的习惯。记录今天的训练和健康数据，让数据见证你的每一次进步！
        </p>
      </Card>
    </div>
  );
};

export default HomePage;