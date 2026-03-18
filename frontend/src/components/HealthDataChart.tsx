import React from 'react';
import { Card, Select, Space } from 'antd';
import type { HealthData } from '../types';
import dayjs from 'dayjs';

const { Option } = Select;

export interface HealthDataChartProps {
  data: HealthData[];
}

/**
 * 健康数据趋势图表组件
 * 展示体重、BMI、体脂率等指标的走势
 */
const HealthDataChart: React.FC<HealthDataChartProps> = ({ data }) => {
  const [selectedMetric, setSelectedMetric] = React.useState<'weight' | 'bmi' | 'body_fat' | 'muscle'>('weight');

  // 转换数据为图表格式
  const getChartData = () => {
    const sortedData = [...data].sort((a, b) =>
      new Date(a.record_date).getTime() - new Date(b.record_date).getTime()
    ).slice(0, 30); // 最多显示30条

    return sortedData.map(d => ({
      date: dayjs(d.record_date).format('MM-DD'),
      fullDate: d.record_date,
      value: getMetricValue(d, selectedMetric),
    }));
  };

  const getMetricValue = (item: HealthData, metric: string): number | null => {
    switch (metric) {
      case 'weight':
        return item.weight || null;
      case 'bmi':
        if (item.weight && item.height) {
          const h = item.height / 100;
          return Number((item.weight / (h * h)).toFixed(1));
        }
        return null;
      case 'body_fat':
        return item.body_fat_percentage || null;
      case 'muscle':
        return item.muscle_mass || null;
      default:
        return null;
    }
  };

  const getMetricColor = () => {
    switch (selectedMetric) {
      case 'weight':
        return '#00B8D9';
      case 'bmi':
        return '#00C853';
      case 'body_fat':
        return '#FF9800';
      case 'muscle':
        return '#E91E63';
      default:
        return '#00B8D9';
    }
  };

  const chartData = getChartData();
  const color = getMetricColor();

  // 绘制 SVG 折线图
  const renderLineChart = () => {
    if (chartData.length === 0) return null;

    const width = 800;
    const height = 250;
    const padding = { top: 20, right: 30, bottom: 40, left: 50 };
    const chartWidth = width - padding.left - padding.right;
    const chartHeight = height - padding.top - padding.bottom;

    const validData = chartData.filter(d => d.value !== null);
    if (validData.length === 0) return null;

    const minVal = Math.min(...validData.map(d => d.value || 0)) * 0.9;
    const maxVal = Math.max(...validData.map(d => d.value || 0)) * 1.1;
    const range = maxVal - minVal || 1;

    const xStep = chartWidth / (validData.length - 1);

    // 生成路径
    const linePath = validData.map((d, i) => {
      const x = padding.left + i * xStep;
      const y = padding.top + chartHeight - ((d.value! - minVal) / range) * chartHeight;
      return `${i === 0 ? 'M' : 'L'} ${x} ${y}`;
    }).join(' ');

    // 生成渐变填充路径
    const areaPath = `${linePath} L ${padding.left + (validData.length - 1) * xStep} ${padding.top + chartHeight} L ${padding.left} ${padding.top + chartHeight} Z`;

    // Y轴刻度
    const yTicks = 5;
    const yAxis = Array.from({ length: yTicks }, (_, i) => {
      const value = minVal + (range * i) / (yTicks - 1);
      const y = padding.top + chartHeight - ((value - minVal) / range) * chartHeight;
      return { value: value.toFixed(1), y };
    });

    // X轴标签
    const xLabels = validData.map((d, i) => {
      const step = Math.max(1, Math.floor(validData.length / 6));
      const x = padding.left + i * xStep;
      return { label: d.date, x, show: i % step === 0 };
    });

    return (
      <svg width={width} height={height} style={{ width: '100%', height: 'auto' }}>
        <defs>
          <linearGradient id="areaGradient" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor={color} stopOpacity="0.3" />
            <stop offset="100%" stopColor={color} stopOpacity="0" />
          </linearGradient>
        </defs>

        {/* Y轴网格线 */}
        {yAxis.map((tick, i) => (
          <g key={i}>
            <line
              x1={padding.left}
              y1={tick.y}
              x2={width - padding.right}
              y2={tick.y}
              stroke="#e8e8e8"
              strokeWidth={1}
            />
            <text
              x={padding.left - 5}
              y={tick.y + 4}
              textAnchor="end"
              fontSize="12"
              fill="#999"
            >
              {tick.value}
            </text>
          </g>
        ))}

        {/* X轴标签 */}
        {xLabels.map((label, i) => (
          <g key={i}>
            {label.show && (
              <text
                x={label.x}
                y={height - padding.bottom + 20}
                textAnchor="middle"
                fontSize="11"
                fill="#999"
              >
                {label.label}
              </text>
            )}
          </g>
        ))}

        {/* 区域填充 */}
        <path d={areaPath} fill="url(#areaGradient)" />

        {/* 折线 */}
        <path d={linePath} fill="none" stroke={color} strokeWidth={2} strokeLinecap="round" />

        {/* 数据点 */}
        {validData.map((d, i) => {
          const x = padding.left + i * xStep;
          const y = padding.top + chartHeight - ((d.value! - minVal) / range) * chartHeight;
          return (
            <circle
              key={i}
              cx={x}
              cy={y}
              r={4}
              fill="#fff"
              stroke={color}
              strokeWidth={2}
            />
          );
        })}
      </svg>
    );
  };

  if (data.length === 0) {
    return (
      <Card>
        <div style={{ textAlign: 'center', padding: '40px 0', color: '#999' }}>
          暂无数据，请先记录健康数据
        </div>
      </Card>
    );
  }

  return (
    <Card
      title={
        <Space>
          <Select
            value={selectedMetric}
            onChange={(value) => setSelectedMetric(value as any)}
            style={{ width: 150 }}
          >
            <Option value="weight">体重</Option>
            <Option value="bmi">BMI</Option>
            <Option value="body_fat">体脂率</Option>
            <Option value="muscle">肌肉量</Option>
          </Select>
          <span style={{ fontSize: 14, color: '#666' }}>趋势图</span>
        </Space>
      }
    >
      {renderLineChart()}
    </Card>
  );
};

export default HealthDataChart;