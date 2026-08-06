import { memo, useMemo } from 'react';
import ReactECharts from 'echarts-for-react';
import type { EChartsOption } from 'echarts';
import { useEchartsAutoResize } from '../../hooks/UseEchartsAutoResize';
import {
  areaGradient,
  axisLabel,
  axisLine,
  formatCompact,
  formatNumber,
  grid,
  splitLine,
  tooltip,
} from './chartTheme';

export interface LinePoint {
  date: string;
  value: number;
}

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
    const fmt = valueFormatter ?? formatNumber;

    return {
      backgroundColor: 'transparent',
      grid: grid('compact'),
      tooltip: tooltip(fmt, 'compact'),
      xAxis: {
        type: 'category',
        data: points.map((p) => p.date),
        boundaryGap: false,
        axisLine,
        axisLabel: axisLabel('compact'),
        axisTick: { show: false },
      },
      yAxis: {
        type: 'value',
        scale: true,
        splitLine,
        // Compacto pt-BR ("1,2 mi") no lugar da escada manual que devolvia
        // "1.2M" — sufixo inglês numa interface em português, e divergente do
        // resto do painel. Num eixo de 9px o formato curto não é luxo: é o que
        // permite caber sem colidir.
        axisLabel: axisLabel('compact', formatCompact),
      },
      series: [
        {
          type: 'line',
          smooth: true,
          showSymbol: false,
          data: points.map((p) => p.value),
          lineStyle: { color, width: 1.75 },
          areaStyle: { color: areaGradient(color, 0.22) },
        },
      ],
    } as EChartsOption;
  }, [points, color, valueFormatter]);

  const chartRef = useEchartsAutoResize<ReactECharts>();

  return (
    <ReactECharts
      ref={chartRef}
      option={option}
      style={{ height, width: '100%' }}
      notMerge
    />
  );
});

export default LineChartEchartsCompact;