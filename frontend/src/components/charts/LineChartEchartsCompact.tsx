import { memo, useMemo } from 'react';
import ReactECharts from 'echarts-for-react';
import type { EChartsOption } from 'echarts';

export interface LinePoint {
  date: string;
  value: number;
}

const hexToRgb = (hex: string) => {
  const h = hex.replace('#', '');
  const r = parseInt(h.slice(0, 2), 16);
  const g = parseInt(h.slice(2, 4), 16);
  const b = parseInt(h.slice(4, 6), 16);
  return `${r},${g},${b}`;
};

export interface LineChartEchartsCompactProps {
  points: LinePoint[];
  color?: string;
  height?: number;
  valueFormatter?: (v: number) => string;
}

export const LineChartEchartsCompact = memo(function LineChartEchartsCompact({
  points,
  color = '#eab308',
  height = 160,
  valueFormatter,
}: LineChartEchartsCompactProps) {
  const option = useMemo<EChartsOption>(() => {
    const rgb = hexToRgb(color);
    const fmt = valueFormatter ?? ((v: number) =>
      v.toLocaleString('pt-BR', { maximumFractionDigits: 2 }));

    return {
      backgroundColor: 'transparent',
      grid: { left: 48, right: 8, top: 12, bottom: 24 },
      tooltip: {
        trigger: 'axis',
        backgroundColor: '#0f172a',
        borderColor: '#334155',
        textStyle: { color: '#e2e8f0', fontSize: 11 },
        valueFormatter: (v: unknown) =>
          typeof v === 'number' ? fmt(v) : String(v),
      },
      xAxis: {
        type: 'category',
        data: points.map((p) => p.date),
        boundaryGap: false,
        axisLine: { lineStyle: { color: '#334155' } },
        axisLabel: { color: '#64748b', fontSize: 9, hideOverlap: true },
        axisTick: { show: false },
      },
      yAxis: {
        type: 'value',
        scale: true,
        splitLine: { lineStyle: { color: '#1e293b', type: 'dashed' } },
        axisLabel: {
          color: '#64748b',
          fontSize: 9,
          formatter: (v: number) => {
            if (Math.abs(v) >= 1e9) return `${(v / 1e9).toFixed(1)}B`;
            if (Math.abs(v) >= 1e6) return `${(v / 1e6).toFixed(1)}M`;
            if (Math.abs(v) >= 1e3) return `${(v / 1e3).toFixed(1)}k`;
            return String(v);
          },
        },
      },
      series: [
        {
          type: 'line',
          smooth: true,
          showSymbol: false,
          data: points.map((p) => p.value),
          lineStyle: { color, width: 1.75 },
          areaStyle: {
            color: {
              type: 'linear', x: 0, y: 0, x2: 0, y2: 1,
              colorStops: [
                { offset: 0, color: `rgba(${rgb},0.22)` },
                { offset: 1, color: `rgba(${rgb},0)` },
              ],
            },
          },
        },
      ],
    } as EChartsOption;
  }, [points, color, valueFormatter]);

  return (
    <ReactECharts
      option={option}
      style={{ height, width: '100%' }}
      notMerge
    />
  );
});

export default LineChartEchartsCompact;