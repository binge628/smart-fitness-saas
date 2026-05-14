import React, { useState, useEffect, useRef } from 'react';
import {
  Card,
  Input,
  Button,
  Typography,
  Space,
  Spin,
  Tag,
  Alert,
  Avatar,
} from 'antd';
import {
  RobotOutlined,
  SendOutlined,
  ThunderboltOutlined,
  HeartOutlined,
  AimOutlined,
  UserOutlined,
  CrownOutlined,
} from '@ant-design/icons';
import { aiService, subscriptionService } from '../services/api';
import type { AIMessage } from '../types';

const { Title, Text, Paragraph } = Typography;
const { TextArea } = Input;

const QUICK_ACTIONS = [
  { key: 'training', label: '训练建议', icon: <ThunderboltOutlined />, type: 'training' as const, color: '#00B8D9' },
  { key: 'nutrition', label: '营养建议', icon: <HeartOutlined />, type: 'nutrition' as const, color: '#00C853' },
  { key: 'plan', label: '计划推荐', icon: <AimOutlined />, type: 'plan' as const, color: '#FAAD14' },
];

const AIAssistantPage: React.FC = () => {
  const [messages, setMessages] = useState<AIMessage[]>([]);
  const [inputValue, setInputValue] = useState('');
  const [loading, setLoading] = useState(false);
  const [aiConfigured, setAiConfigured] = useState(false);
  const [isSubscribed, setIsSubscribed] = useState(false);
  const [checkingSub, setCheckingSub] = useState(true);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    checkStatus();
    checkSubscription();
  }, []);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const checkStatus = async () => {
    try {
      const res = await aiService.checkStatus();
      setAiConfigured(res.data?.configured || false);
    } catch {
      setAiConfigured(false);
    }
  };

  const checkSubscription = async () => {
    try {
      const res = await subscriptionService.getMySubscription();
      const planType = res.data?.current_plan?.plan_type;
      setIsSubscribed(planType === 'monthly' || planType === 'yearly');
    } catch {
      setIsSubscribed(false);
    } finally {
      setCheckingSub(false);
    }
  };

  const addMessage = (role: 'user' | 'assistant', content: string, is_fallback = false): AIMessage => {
    const msg: AIMessage = {
      id: Date.now().toString() + Math.random().toString(36).slice(2),
      role,
      content,
      timestamp: Date.now(),
      is_fallback,
    };
    setMessages(prev => [...prev, msg]);
    return msg;
  };

  const sendMessage = async (message: string, type?: 'training' | 'nutrition' | 'plan' | 'general') => {
    if (!message.trim() || loading) return;

    addMessage('user', message);
    setInputValue('');
    setLoading(true);

    try {
      const res = await aiService.chat({ message: message.trim(), type: type || 'general' });
      addMessage('assistant', res.data?.reply || '抱歉，未获取到回复。', res.data?.is_fallback);
    } catch (error: any) {
      addMessage('assistant', error?.error || '请求失败，请稍后重试。');
    } finally {
      setLoading(false);
    }
  };

  const handleQuickAction = async (action: typeof QUICK_ACTIONS[number]) => {
    if (loading) return;

    const userMessage = action.type === 'training'
      ? '请给我训练建议'
      : action.type === 'nutrition'
        ? '请给我营养饮食建议'
        : '请推荐适合我的健身计划';

    addMessage('user', userMessage);
    setLoading(true);

    try {
      let res;
      if (action.type === 'training') {
        res = await aiService.getTrainingAdvice();
      } else if (action.type === 'nutrition') {
        res = await aiService.getNutritionAdvice();
      } else {
        res = await aiService.getPlanSuggestion();
      }
      addMessage('assistant', res.data?.reply || '抱歉，未获取到回复。', res.data?.is_fallback);
    } catch (error: any) {
      addMessage('assistant', error?.error || '请求失败，请稍后重试。');
    } finally {
      setLoading(false);
    }
  };

  const handleSend = () => {
    if (inputValue.trim()) {
      sendMessage(inputValue);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  if (checkingSub) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '60vh' }}>
        <Spin size="large" />
      </div>
    );
  }

  if (!isSubscribed) {
    return (
      <div style={{ maxWidth: 600, margin: '80px auto' }}>
        <Card style={{ textAlign: 'center', borderRadius: 12 }}>
          <RobotOutlined style={{ fontSize: 64, color: '#00B8D9', marginBottom: 24 }} />
          <Title level={3}>AI 健身助手</Title>
          <Paragraph type="secondary" style={{ fontSize: 16 }}>
            升级为会员即可解锁 AI 健身助手功能
          </Paragraph>
          <Paragraph type="secondary">
            AI 助手可根据您的训练数据和健康指标，提供个性化的训练建议、营养指导和计划推荐
          </Paragraph>
          <Button type="primary" size="large" href="/subscription" style={{ marginTop: 16 }}>
            <CrownOutlined /> 升级会员
          </Button>
        </Card>
      </div>
    );
  }

  return (
    <div style={{ height: 'calc(100vh - 120px)', display: 'flex', flexDirection: 'column' }}>
      <div style={{ marginBottom: 16 }}>
        <Title level={4} style={{ margin: 0 }}>
          <RobotOutlined style={{ marginRight: 8, color: '#00B8D9' }} />
          AI 健身助手
        </Title>
        {!aiConfigured && (
          <Alert
            message="AI 服务未配置，当前回复为通用预设建议"
            type="info"
            showIcon
            style={{ marginTop: 8 }}
          />
        )}
      </div>

      <Space style={{ marginBottom: 12 }} wrap>
        {QUICK_ACTIONS.map(action => (
          <Button
            key={action.key}
            icon={action.icon}
            onClick={() => handleQuickAction(action)}
            loading={loading}
            style={{ borderColor: action.color, color: action.color }}
          >
            {action.label}
          </Button>
        ))}
      </Space>

      <Card
        style={{
          flex: 1,
          overflow: 'hidden',
          display: 'flex',
          flexDirection: 'column',
          borderRadius: 12,
        }}
        bodyStyle={{
          flex: 1,
          overflowY: 'auto',
          padding: '16px 20px',
          display: 'flex',
          flexDirection: 'column',
        }}
      >
        {messages.length === 0 && (
          <div style={{ textAlign: 'center', padding: '60px 0', color: '#999' }}>
            <RobotOutlined style={{ fontSize: 48, marginBottom: 16, color: '#d9d9d9' }} />
            <Paragraph type="secondary">
              你好！我是你的 AI 健身助手，可以为你提供训练建议、营养指导和计划推荐。
            </Paragraph>
            <Paragraph type="secondary">
              点击上方快捷按钮或直接输入问题开始对话
            </Paragraph>
          </div>
        )}

        {messages.map(msg => (
          <div
            key={msg.id}
            style={{
              display: 'flex',
              justifyContent: msg.role === 'user' ? 'flex-end' : 'flex-start',
              marginBottom: 12,
            }}
          >
            {msg.role === 'assistant' && (
              <Avatar
                icon={<RobotOutlined />}
                style={{ backgroundColor: '#00B8D9', marginRight: 8, flexShrink: 0 }}
                size={36}
              />
            )}
            <div
              style={{
                maxWidth: '70%',
                padding: '10px 16px',
                borderRadius: msg.role === 'user' ? '12px 12px 2px 12px' : '12px 12px 12px 2px',
                backgroundColor: msg.role === 'user' ? '#00B8D9' : '#f5f5f5',
                color: msg.role === 'user' ? '#fff' : '#333',
                whiteSpace: 'pre-wrap',
                lineHeight: 1.6,
                fontSize: 14,
              }}
            >
              {msg.content}
              {msg.is_fallback && (
                <Tag color="orange" style={{ marginLeft: 8, fontSize: 11 }}>预设建议</Tag>
              )}
            </div>
            {msg.role === 'user' && (
              <Avatar
                icon={<UserOutlined />}
                style={{ backgroundColor: '#1890ff', marginLeft: 8, flexShrink: 0 }}
                size={36}
              />
            )}
          </div>
        ))}

        {loading && (
          <div style={{ display: 'flex', alignItems: 'center', marginBottom: 12 }}>
            <Avatar
              icon={<RobotOutlined />}
              style={{ backgroundColor: '#00B8D9', marginRight: 8, flexShrink: 0 }}
              size={36}
            />
            <div
              style={{
                padding: '10px 16px',
                borderRadius: '12px 12px 12px 2px',
                backgroundColor: '#f5f5f5',
                color: '#999',
              }}
            >
              <Spin size="small" /> 思考中...
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </Card>

      <div style={{ marginTop: 12, display: 'flex', gap: 8 }}>
        <TextArea
          value={inputValue}
          onChange={e => setInputValue(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="输入你的健身问题..."
          autoSize={{ minRows: 1, maxRows: 4 }}
          disabled={loading}
          style={{ flex: 1, borderRadius: 8 }}
        />
        <Button
          type="primary"
          icon={<SendOutlined />}
          onClick={handleSend}
          loading={loading}
          disabled={!inputValue.trim()}
          style={{ borderRadius: 8, height: 40 }}
        >
          发送
        </Button>
      </div>

      <Text type="secondary" style={{ fontSize: 12, marginTop: 4, textAlign: 'center' }}>
        AI 助手基于你的训练数据提供个性化建议，每日对话上限 20 次
      </Text>
    </div>
  );
};

export default AIAssistantPage;