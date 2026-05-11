import React, { useState, useEffect } from 'react';
import {
  Card,
  Row,
  Col,
  Statistic,
  Typography,
  Tag,
  Empty,
  Spin,
  message,
  Progress,
  Button,
} from 'antd';
import {
  TrophyOutlined,
  FireOutlined,
  ThunderboltOutlined,
  LockOutlined,
  SyncOutlined,
  ClockCircleOutlined,
  AimOutlined,
} from '@ant-design/icons';
import { achievementService } from '../services/api';

const { Title, Text } = Typography;

interface Achievement {
  id: string;
  code: string;
  name: string;
  description: string;
  icon: string;
  category: string;
  requirement_type: string;
  requirement_value: number;
  unlocked: boolean;
  unlocked_at?: string;
  current_progress: number;
  progress_percentage: number;
}

interface UserStats {
  totalWorkouts: number;
  totalDuration: number;
  totalCalories: number;
  currentStreak: number;
}

const CATEGORY_CONFIG: Record<string, { label: string; color: string; icon: React.ReactNode }> = {
  milestone: { label: '里程碑', color: 'gold', icon: <TrophyOutlined /> },
  streak: { label: '连续打卡', color: 'red', icon: <FireOutlined /> },
  cumulative: { label: '累计成就', color: 'blue', icon: <ThunderboltOutlined /> },
};

const REQUIREMENT_LABELS: Record<string, { unit: string; icon: React.ReactNode }> = {
  workouts: { unit: '次训练', icon: <AimOutlined /> },
  days: { unit: '天连续', icon: <FireOutlined /> },
  duration: { unit: '小时', icon: <ClockCircleOutlined /> },
  calories: { unit: '卡', icon: <ThunderboltOutlined /> },
};

const AchievementsPage: React.FC = () => {
  const [achievements, setAchievements] = useState<Achievement[]>([]);
  const [stats, setStats] = useState({ total: 0, unlocked: 0, locked: 0 });
  const [userStats, setUserStats] = useState<UserStats | null>(null);
  const [loading, setLoading] = useState(false);
  const [checking, setChecking] = useState(false);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      const [achievementsRes, statsRes] = await Promise.all([
        achievementService.getAchievements(),
        achievementService.getStats(),
      ]);
      setAchievements(achievementsRes.achievements || achievementsRes.data || []);
      setStats(statsRes.data || { total: 0, unlocked: 0, locked: 0 });
      if (achievementsRes.user_stats) {
        setUserStats(achievementsRes.user_stats);
      }
    } catch (error) {
      message.error('加载成就数据失败');
    } finally {
      setLoading(false);
    }
  };

  const handleCheckAchievements = async () => {
    setChecking(true);
    try {
      const res = await achievementService.checkAchievements();
      if (res.newUnlocks && res.newUnlocks.length > 0) {
        message.success(`解锁了新成就：${res.newUnlocks.join('、')}`, 3);
      } else {
        message.info('暂无新成就，继续加油！');
      }
      await loadData();
    } catch (error) {
      message.error('检查成就失败');
    } finally {
      setChecking(false);
    }
  };

  const unlockedAchievements = achievements.filter(a => a.unlocked);
  const lockedAchievements = achievements.filter(a => !a.unlocked);
  const progress = stats.total > 0 ? Math.round((stats.unlocked / stats.total) * 100) : 0;

  // 按分类分组
  const groupByCategory = (list: Achievement[]) => {
    const groups: Record<string, Achievement[]> = {};
    list.forEach(a => {
      if (!groups[a.category]) groups[a.category] = [];
      groups[a.category].push(a);
    });
    return groups;
  };

  const unlockedGroups = groupByCategory(unlockedAchievements);
  const lockedGroups = groupByCategory(lockedAchievements);

  return (
    <div>
      <Row justify="space-between" align="middle" style={{ marginBottom: 24 }}>
        <Col>
          <Title level={2} style={{ margin: 0 }}>成就勋章</Title>
        </Col>
        <Col>
          <Button
            icon={<SyncOutlined spin={checking} />}
            onClick={handleCheckAchievements}
            loading={checking}
          >
            刷新成就
          </Button>
        </Col>
      </Row>

      <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
        <Col xs={24} sm={6}>
          <Card>
            <Statistic
              title="已解锁"
              value={stats.unlocked}
              prefix={<TrophyOutlined style={{ color: '#FAAD14' }} />}
              valueStyle={{ color: '#FAAD14' }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={6}>
          <Card>
            <Statistic
              title="未解锁"
              value={stats.locked}
              prefix={<LockOutlined style={{ color: '#8c8c8c' }} />}
              valueStyle={{ color: '#8c8c8c' }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={6}>
          <Card>
            <div style={{ textAlign: 'center' }}>
              <Text type="secondary">完成进度</Text>
              <Progress
                type="circle"
                percent={progress}
                size={64}
                strokeColor="#FAAD14"
              />
            </div>
          </Card>
        </Col>
        <Col xs={24} sm={6}>
          <Card>
            {userStats && (
              <div style={{ fontSize: 12, color: '#8c8c8c', lineHeight: 2 }}>
                <div><FireOutlined /> 连续 {userStats.currentStreak} 天</div>
                <div><AimOutlined /> 累计 {userStats.totalWorkouts} 次训练</div>
                <div><ClockCircleOutlined /> 累计 {Math.floor(userStats.totalDuration / 60)} 小时</div>
              </div>
            )}
          </Card>
        </Col>
      </Row>

      <Spin spinning={loading}>
        {achievements.length === 0 ? (
          <Empty description="暂无成就数据" />
        ) : (
          <>
            {unlockedAchievements.length > 0 && (
              <Card
                title={
                  <span>
                    <TrophyOutlined style={{ color: '#FAAD14', marginRight: 8 }} />
                    已解锁成就 ({unlockedAchievements.length})
                  </span>
                }
                style={{ marginBottom: 16 }}
              >
                {Object.entries(unlockedGroups).map(([category, items]) => (
                  <div key={category} style={{ marginBottom: 16 }}>
                    <div style={{ marginBottom: 12 }}>
                      <Tag color={CATEGORY_CONFIG[category]?.color} icon={CATEGORY_CONFIG[category]?.icon}>
                        {CATEGORY_CONFIG[category]?.label || category}
                      </Tag>
                    </div>
                    <Row gutter={[16, 16]}>
                      {items.map(achievement => (
                        <Col xs={24} sm={12} md={8} lg={6} key={achievement.id}>
                          <Card
                            size="small"
                            style={{
                              textAlign: 'center',
                              background: 'linear-gradient(135deg, #FFF7E6 0%, #FFF2D4 100%)',
                              border: '1px solid #FAAD14',
                            }}
                          >
                            <div style={{ fontSize: 36, marginBottom: 8 }}>{achievement.icon}</div>
                            <Text strong style={{ display: 'block', marginBottom: 4 }}>{achievement.name}</Text>
                            <Text type="secondary" style={{ fontSize: 12 }}>{achievement.description}</Text>
                            {achievement.unlocked_at && (
                              <div style={{ marginTop: 8, fontSize: 11, color: '#8c8c8c' }}>
                                {new Date(achievement.unlocked_at).toLocaleDateString('zh-CN')}
                              </div>
                            )}
                          </Card>
                        </Col>
                      ))}
                    </Row>
                  </div>
                ))}
              </Card>
            )}

            {lockedAchievements.length > 0 && (
              <Card
                title={
                  <span>
                    <LockOutlined style={{ color: '#8c8c8c', marginRight: 8 }} />
                    未解锁成就 ({lockedAchievements.length})
                  </span>
                }
              >
                {Object.entries(lockedGroups).map(([category, items]) => (
                  <div key={category} style={{ marginBottom: 16 }}>
                    <div style={{ marginBottom: 12 }}>
                      <Tag icon={CATEGORY_CONFIG[category]?.icon}>
                        {CATEGORY_CONFIG[category]?.label || category}
                      </Tag>
                    </div>
                    <Row gutter={[16, 16]}>
                      {items.map(achievement => (
                        <Col xs={24} sm={12} md={8} lg={6} key={achievement.id}>
                          <Card
                            size="small"
                            style={{
                              textAlign: 'center',
                              background: '#f5f5f5',
                              opacity: 0.85,
                            }}
                          >
                            <div style={{ fontSize: 36, marginBottom: 8, filter: 'grayscale(100%)' }}>
                              {achievement.icon}
                            </div>
                            <Text strong style={{ display: 'block', marginBottom: 4, color: '#595959' }}>
                              {achievement.name}
                            </Text>
                            <Text type="secondary" style={{ fontSize: 12 }}>{achievement.description}</Text>
                            <div style={{ marginTop: 12 }}>
                              <Progress
                                percent={achievement.progress_percentage}
                                size="small"
                                strokeColor="#FAAD14"
                                format={() => `${achievement.current_progress}/${achievement.requirement_value}`}
                              />
                            </div>
                            <Text type="secondary" style={{ display: 'block', marginTop: 4, fontSize: 11 }}>
                              {REQUIREMENT_LABELS[achievement.requirement_type]?.icon}{' '}
                              {getRequirementText(achievement.requirement_type, achievement.requirement_value)}
                            </Text>
                          </Card>
                        </Col>
                      ))}
                    </Row>
                  </div>
                ))}
              </Card>
            )}
          </>
        )}
      </Spin>
    </div>
  );
};

const getRequirementText = (type: string, value: number): string => {
  switch (type) {
    case 'workouts':
      return `累计训练 ${value} 次`;
    case 'days':
      return `连续训练 ${value} 天`;
    case 'duration':
      return `累计训练 ${value} 小时`;
    case 'calories':
      return `累计消耗 ${value.toLocaleString()} 卡`;
    default:
      return '';
  }
};

export default AchievementsPage;