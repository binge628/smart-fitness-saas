import React from 'react';
import { Card, Row, Col, Radio, Space } from 'antd';
import type { WorkoutLog } from '../types';
import dayjs from 'dayjs';

export interface WorkoutStatsChartProps {
  data: WorkoutLog[];
}

/**
 * 训练统计图表组件
 * 展示训练频率、时长、热量消耗等统计
 */
const WorkoutStatsChart: React.FC<WorkoutStatsChartProps> = ({ data }) => {
  const [chartType, setChartType] = React.useState<'frequency' | 'duration' | 'calories'>('frequency');

  // 按 дней/周/月聚合数据
  const getAggregatedData = () => {
    const grouped: Record<string, { count: number; duration: number; calories: number }> = {};

    data.forEach(workout => {
      const date = dayjs(workout.workout_date);
      let key: string;

      switch (chartType) {
        case 'frequency':
          // 按周聚合（手动计算周数）
          const startOfYear = dayjs(date).startOf('year');
          const dayOfYear = date.diff(startOfYear, 'day') + 1;
          const weekNumber = Math.ceil(dayOfYear / 7);
          key = `${date.year()}-W${weekNumber}`;
          break;
        case 'duration':
        case 'calories':
          // 按月聚合
          key = `${date.year()}-${String(date.month() + 1).padStart(2, '0')}`;
          break;
        default:
          key = date.format('YYYY-MM-DD');
      }

      if (!grouped[key]) {
        grouped[key] = { count: 0, duration: 0, calories: 0 };
      }
      grouped[key].count++;
      grouped[key].duration += workout.duration_minutes;
      grouped[key].calories += workout.calories_burned || 0;
    });

    const sortedKeys = Object.keys(grouped).sort();
    return sortedKeys.map(key => ({
      label: key,
      ...grouped[key],
    }));
  };

  const chartData = getAggregatedData();

  const getValueColor = () => {
    switch (chartType) {
      case 'frequency':
        return '#00B8D9';
      case 'duration':
        return '#00C853';
      case 'calories':
        return '#E91E63';
    }
  };

  // 渲染柱状图
  const renderBarChart = () => {
    if (chartData.length === 0) return null;

    const viewBoxWidth = 800;
    const viewBoxHeight = 280;
    const padding = { top: 20, right: 20, bottom: 60, left: 50 };
    const chartWidth = viewBoxWidth - padding.left - padding.right;
    const chartHeight = viewBoxHeight - padding.top - padding.bottom;

    const getValue = (d: typeof chartData[0]): number => {
      switch (chartType) {
        case 'frequency':
          return d.count;
        case 'duration':
          return d.duration;
        case 'calories':
          return d.calories;
      }
    };

    const maxValue = Math.max(...chartData.map(getValue)) * 1.1 || 10;
    const barWidth = Math.min(40, (chartWidth / chartData.length) * 0.6);
    const xStep = chartWidth / chartData.length;

    const yAxis = Array.from({ length: 5 }, (_, i) => {
      const value = (maxValue * i) / 4;
      const y = padding.top + chartHeight - (value / maxValue) * chartHeight;
      return { value: Math.round(value), y };
    });

    const xLabels = chartData.map((d, i) => ({
      label: d.label,
      x: padding.left + i * xStep + xStep / 2,
      show: chartData.length <= 10 || i % Math.ceil(chartData.length / 10) === 0,
    }));

    return (
      <svg
        viewBox={`0 0 ${viewBoxWidth} ${viewBoxHeight}`}
        preserveAspectRatio="xMidYMid meet"
        style={{ width: '100%', height: 'auto' }}
      >
        {/* Y轴网格线 */}
        {yAxis.map((tick, i) => (
          <g key={i}>
            <line
              x1={padding.left}
              y1={tick.y}
              x2={viewBoxWidth - padding.right}
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
          <text
            key={i}
            x={label.x}
            y={viewBoxHeight - padding.bottom + 20}
            textAnchor="middle"
            fontSize="10"
            fill="#666"
          >
            {label.show ? label.label : ''}
          </text>
        ))}

        {/* 柱子 */}
        {chartData.map((d, i) => {
          const value = getValue(d);
          const barHeight = (value / maxValue) * chartHeight;
          const x = padding.left + i * xStep + (xStep - barWidth) / 2;
          const y = padding.top + chartHeight - barHeight;
          const color = getValueColor();

          return (
            <g key={i}>
              <rect
                x={x}
                y={y}
                width={barWidth}
                height={barHeight}
                fill={color}
                rx={4}
              />
              <text
                x={x + barWidth / 2}
                y={y - 5}
                textAnchor="middle"
                fontSize="11"
                fill="#666"
              >
                {value}
              </text>
            </g>
          );
        })}
      </svg>
    );
  };

  // 渲染环形图（强度分布）
  const renderDoughnutChart = () => {
    const width = 280;
    const height = 280;
    const radius = 70;
    const centerX = width / 2;
    const centerY = height / 2;

    //计算强度分布
    const intensityCounts = { low: 0, medium: 0, high: 0 };
    data.forEach(workout => {
      const intensity = workout.calories_burned
        ? workout.calories_burned / workout.duration_minutes
        : 0;
      if (intensity > 10) intensityCounts.high++;
      else if (intensity > 5) intensityCounts.medium++;
      else intensityCounts.low++;
    });

    const total = intensityCounts.low + intensityCounts.medium + intensityCounts.high;
    if (total === 0) return null;

    const segments = [
      { label: '低强度', count: intensityCounts.low, color: '#00C853' },
      { label: '中等强度', count: intensityCounts.medium, color: '#FF9800' },
      { label: '高强度', count: intensityCounts.high, color: '#E91E63' },
    ].filter(s => s.count > 0);

    const getCoords = (percent: number) => {
      const angle = (percent * 360 - 90) * (Math.PI / 180);
      return {
        x: centerX + radius * Math.cos(angle),
        y: centerY + radius * Math.sin(angle),
      };
    };

    let currentPercent = 0;

    return (
      <svg
        viewBox={`0 0 ${width} ${height}`}
        preserveAspectRatio="xMidYMid meet"
        style={{ width: '100%', height: 'auto' }}
      >
        {segments.map((segment, i) => {
          const percent = segment.count / total;
          const start = currentPercent;
          const end = currentPercent + percent;
          currentPercent = end;

          const startCoords = getCoords(start);
          const endCoords = getCoords(end);
          const largeArc = percent > 0.5 ? 1 : 0;

          return (
            <g key={i} style={{ cursor: 'pointer' }}>
              <path
                d={`
                  M ${centerX} ${centerY}
                  L ${startCoords.x} ${startCoords.y}
                  A ${radius} ${radius} 0 ${largeArc} 1 ${endCoords.x} ${endCoords.y}
                  Z
                `}
                fill={segment.color}
                opacity="0.9"
              />
              {percent > 0.05 && (
                <text
                  x={centerX + (radius * 0.6) * Math.cos(((start + end) / 2 * 360 - 90) * (Math.PI / 180))}
                  y={centerY + (radius * 0.6) * Math.sin(((start + end) / 2 * 360 - 90) * (Math.PI / 180))}
                  textAnchor="middle"
                  dominantBaseline="middle"
                  fontSize="12"
                  fill="#fff"
                  fontWeight="bold"
                >
                  {Math.round(percent * 100)}%
                </text>
              )}
            </g>
          );
        })}

        {/* 图例 */}
        <g transform={`translate(40, ${height - 90})`}>
          {segments.map((segment, i) => {
            const percent = segment.count / total;
            return (
              <g key={i} transform={`translate(0, ${i * 30})`}>
                <rect width="12" height="12" fill={segment.color} rx={2} />
                <text x={18} y={10} fontSize="12" fill="#666">
                  {segment.label} ({Math.round(percent * 100)}%)
                </text>
              </g>
            );
          })}
        </g>
      </svg>
    );
  };

  if (data.length === 0) {
    return (
      <Card>
        <div style={{ textAlign: 'center', padding: '40px 0', color: '#999' }}>
          暂无训练数据，请先记录训练日志
        </div>
      </Card>
    );
  }

  return (
    <Row gutter={[16, 16]}>
      <Col xs={24} sm={24} md={18}>
        <Card
          title={
            <Space>
              <Radio.Group
                value={chartType}
                onChange={(e) => setChartType(e.target.value)}
                size="small"
              >
                <Radio.Button value="frequency">训练次数</Radio.Button>
                <Radio.Button value="duration">训练时长</Radio.Button>
                <Radio.Button value="calories">消耗热量</Radio.Button>
              </Radio.Group>
              <span style={{ fontSize: 14, color: '#666', marginLeft: 8 }}>趋势统计</span>
            </Space>
          }
        >
          {renderBarChart()}
        </Card>
      </Col>

      <Col xs={24} sm={24} md={6}>
        <Card title="训练强度分布">
          {renderDoughnutChart()}
        </Card>
      </Col>
    </Row>
  );
};

export default WorkoutStatsChart;