import React, { useState, useEffect } from 'react';
import {
  Card,
  Row,
  Col,
  Button,
  Tag,
  Typography,
  Spin,
  message,
  Modal,
  Result,
  Space,
} from 'antd';
import {
  CrownOutlined,
  CheckOutlined,
  ThunderboltOutlined,
  GiftOutlined,
} from '@ant-design/icons';
import { subscriptionService } from '../services/api';

const { Title, Text, Paragraph } = Typography;

interface Plan {
  plan_type: string;
  name: string;
  price: number;
  duration_days: number;
  features: string[];
}

interface CurrentPlan {
  plan_type: string;
  name: string;
  price: number;
  features: string[];
}

interface SubscriptionInfo {
  id: string;
  plan_type: string;
  status: string;
  start_date: string;
  end_date?: string;
  amount?: number;
}

const PLAN_ICONS: Record<string, React.ReactNode> = {
  free: <GiftOutlined style={{ fontSize: 32 }} />,
  monthly: <ThunderboltOutlined style={{ fontSize: 32 }} />,
  yearly: <CrownOutlined style={{ fontSize: 32 }} />,
};

const PLAN_COLORS: Record<string, string> = {
  free: '#8c8c8c',
  monthly: '#00B8D9',
  yearly: '#FAAD14',
};

const SubscriptionPage: React.FC = () => {
  const [plans, setPlans] = useState<Plan[]>([]);
  const [currentPlan, setCurrentPlan] = useState<CurrentPlan | null>(null);
  const [subscription, setSubscription] = useState<SubscriptionInfo | null>(null);
  const [loading, setLoading] = useState(false);
  const [subscribing, setSubscribing] = useState<string | null>(null);
  const [confirmVisible, setConfirmVisible] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState<string | null>(null);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      const [plansRes, subRes] = await Promise.all([
        subscriptionService.getPlans(),
        subscriptionService.getMySubscription(),
      ]);
      setPlans(plansRes.data || []);
      setCurrentPlan(subRes.data?.current_plan || null);
      setSubscription(subRes.data?.subscription || null);
    } catch {
      message.error('加载订阅信息失败');
    } finally {
      setLoading(false);
    }
  };

  const handleSubscribe = (planType: string) => {
    setSelectedPlan(planType);
    setConfirmVisible(true);
  };

  const confirmSubscribe = async () => {
    if (!selectedPlan) return;
    setSubscribing(selectedPlan);
    try {
      const res = await subscriptionService.subscribe({
        plan_type: selectedPlan as 'monthly' | 'yearly',
      });
      message.success(res.message || '订阅成功！');
      setConfirmVisible(false);
      await loadData();
    } catch {
      message.error('订阅失败，请稍后重试');
    } finally {
      setSubscribing(null);
    }
  };

  const handleCancel = async () => {
    Modal.confirm({
      title: '确认取消订阅？',
      content: '取消后，当前订阅到期前仍可使用，到期后将不再续费。',
      okText: '确认取消',
      cancelText: '再想想',
      okButtonProps: { danger: true },
      onOk: async () => {
        try {
          await subscriptionService.cancelSubscription();
          message.success('订阅已取消');
          await loadData();
        } catch {
          message.error('取消订阅失败');
        }
      },
    });
  };

  const isActive = subscription?.status === 'active';
  const currentPlanType = currentPlan?.plan_type || 'free';

  return (
    <div>
      <Title level={2} style={{ marginBottom: 24 }}>会员订阅</Title>

      <Spin spinning={loading}>
        {/* 当前订阅状态 */}
        {isActive && subscription && (
          <Card style={{ marginBottom: 24 }}>
            <Space direction="vertical" size={4}>
              <Text type="secondary">当前订阅</Text>
              <Space>
                <Tag color={PLAN_COLORS[subscription.plan_type] || '#00B8D9'}>
                  {currentPlan?.name || subscription.plan_type}
                </Tag>
                {subscription.end_date && (
                  <Text type="secondary">
                    到期时间：{new Date(subscription.end_date).toLocaleDateString('zh-CN')}
                  </Text>
                )}
              </Space>
              <Button danger size="small" onClick={handleCancel} style={{ marginTop: 8 }}>
                取消订阅
              </Button>
            </Space>
          </Card>
        )}

        {/* 套餐对比 */}
        <Row gutter={[16, 16]}>
          {plans.map((plan) => {
            const isCurrent = plan.plan_type === currentPlanType;
            const isPopular = plan.plan_type === 'yearly';
            // 付费用户（月度/年度）的免费功能已包含
            const isFreeIncluded = plan.plan_type === 'free' && isActive && (currentPlanType === 'monthly' || currentPlanType === 'yearly');

            return (
              <Col xs={24} sm={8} key={plan.plan_type}>
                <Card
                  style={{
                    textAlign: 'center',
                    border: isCurrent
                      ? `2px solid ${PLAN_COLORS[plan.plan_type]}`
                      : isFreeIncluded
                        ? '1px dashed #52c41a'
                        : undefined,
                    position: 'relative',
                    overflow: 'hidden',
                    opacity: isFreeIncluded ? 0.85 : 1,
                  }}
                >
                  {/* 已包含标记 */}
                  {isFreeIncluded && (
                    <div
                      style={{
                        position: 'absolute',
                        top: 0,
                        right: 0,
                        background: '#52c41a',
                        color: '#fff',
                        padding: '2px 12px',
                        fontSize: 12,
                        borderRadius: '0 0 0 8px',
                      }}
                    >
                      已包含
                    </div>
                  )}
                  {isPopular && !isFreeIncluded && (
                    <div
                      style={{
                        position: 'absolute',
                        top: 0,
                        right: 0,
                        background: PLAN_COLORS[plan.plan_type],
                        color: '#fff',
                        padding: '2px 12px',
                        fontSize: 12,
                        borderRadius: '0 0 0 8px',
                      }}
                    >
                      推荐
                    </div>
                  )}
                  <div style={{ marginBottom: 16, color: PLAN_COLORS[plan.plan_type] }}>
                    {PLAN_ICONS[plan.plan_type]}
                  </div>
                  <Title level={4} style={{ marginBottom: 8 }}>{plan.name}</Title>
                  <div style={{ marginBottom: 16 }}>
                    {plan.price === 0 ? (
                      <Text style={{ fontSize: 28, fontWeight: 700 }}>免费</Text>
                    ) : (
                      <>
                        <Text style={{ fontSize: 28, fontWeight: 700 }}>¥{plan.price}</Text>
                        <Text type="secondary">
                          /{plan.duration_days >= 365 ? '年' : '月'}
                        </Text>
                      </>
                    )}
                  </div>
                  <div style={{ textAlign: 'left', marginBottom: 24 }}>
                    {plan.features.map((feature, i) => (
                      <div key={i} style={{ marginBottom: 8 }}>
                        <CheckOutlined style={{ color: '#52c41a', marginRight: 8 }} />
                        <Text>{feature}</Text>
                      </div>
                    ))}
                  </div>
                  {/* 按钮状态逻辑优化 */}
                  {isCurrent && isActive ? (
                    /* 当前活跃套餐 */
                    <Button type="primary" block disabled>
                      当前套餐
                    </Button>
                  ) : isFreeIncluded ? (
                    /* 付费用户的免费版显示已包含 */
                    <Button disabled block style={{ color: '#52c41a' }}>
                      已包含
                    </Button>
                  ) : plan.plan_type === 'free' ? (
                    /* 免费用户显示当前套餐 */
                    <Button disabled block>
                      当前套餐
                    </Button>
                  ) : (
                    /* 付费套餐 */
                    <Button
                      type={isPopular ? 'primary' : 'default'}
                      block
                      onClick={() => handleSubscribe(plan.plan_type)}
                      loading={subscribing === plan.plan_type}
                    >
                      {isCurrent ? '续费' : '立即订阅'}
                    </Button>
                  )}
                </Card>
              </Col>
            );
          })}
        </Row>

        {plans.length === 0 && !loading && (
          <Result
            status="info"
            title="暂无订阅套餐"
            subTitle="订阅功能即将上线，敬请期待"
          />
        )}
      </Spin>

      {/* 订阅确认弹窗 */}
      <Modal
        title="确认订阅"
        open={confirmVisible}
        onOk={confirmSubscribe}
        onCancel={() => setConfirmVisible(false)}
        okText="确认订阅"
        cancelText="取消"
        confirmLoading={!!subscribing}
      >
        {selectedPlan && (
          <div>
            {(() => {
              const plan = plans.find(p => p.plan_type === selectedPlan);
              if (!plan) return null;
              return (
                <>
                  <Paragraph>
                    即将订阅 <Text strong>{plan.name}</Text>
                    ，费用为 <Text strong>¥{plan.price}</Text>
                    {plan.duration_days >= 365 ? '/年' : '/月'}
                  </Paragraph>
                  <Paragraph type="secondary">
                    订阅后可立即使用全部会员功能，到期前可随时取消。
                  </Paragraph>
                </>
              );
            })()}
          </div>
        )}
      </Modal>
    </div>
  );
};

export default SubscriptionPage;