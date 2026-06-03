// Gráfico de barras horizontais via Apache ECharts (import enxuto — só bar/grid/tooltip + canvas).
import { useMemo } from 'react';
import * as echarts from 'echarts/core';
import { BarChart } from 'echarts/charts';
import { GridComponent, TooltipComponent } from 'echarts/components';
import { CanvasRenderer } from 'echarts/renderers';
import type { EChartsCoreOption } from 'echarts/core';
import ReactEChartsCore from 'echarts-for-react/esm/core';

echarts.use([BarChart, GridComponent, TooltipComponent, CanvasRenderer]);

export interface BarItem {
  label: string;
  value: number;
}

interface BarChartProps {
  items: BarItem[];
  color?: string;
  valueFormatter?: (v: number) => string;
}

export function BarChartEcharts({ items, color = '#eab308', valueFormatter }: BarChartProps) {
  const option = useMemo<EChartsCoreOption>(() => {
    const fmt = valueFormatter ?? ((v: number) => v.toLocaleString('pt-BR'));
    // Maior valor no topo: categoria do eixo Y é desenhada de baixo p/ cima.
    const ordered = [...items].sort((a, b) => a.value - b.value);
    return {
      backgroundColor: 'transparent',
      grid: { left: 48, right: 72, top: 8, bottom: 8, containLabel: true },
      tooltip: {
        trigger: 'axis',
        axisPointer: { type: 'shadow' },
        backgroundColor: '#0f172a',
        borderColor: '#334155',
        textStyle: { color: '#e2e8f0' },
        valueFormatter: (v: number | string) => (typeof v === 'number' ? fmt(v) : String(v)),
      },
      xAxis: {
        type: 'value',
        axisLine: { lineStyle: { color: '#334155' } },
        axisLabel: { color: '#94a3b8', fontSize: 12, formatter: (v: number) => fmt(v) },
        splitLine: { lineStyle: { color: '#1e293b' } },
      },
      yAxis: {
        type: 'category',
        data: ordered.map((i) => i.label),
        axisLine: { lineStyle: { color: '#334155' } },
        axisLabel: { color: '#94a3b8', fontSize: 12 },
      },
      series: [
        {
          type: 'bar',
          data: ordered.map((i) => i.value),
          itemStyle: { color, borderRadius: [0, 4, 4, 0] },
          label: {
            show: true,
            position: 'right',
            color: '#cbd5e1',
            fontSize: 11,
            formatter: (p: { value: number }) => fmt(p.value),
          },
        },
      ],
    };
  }, [items, color, valueFormatter]);

  // Altura proporcional ao nº de barras para os rótulos não ficarem espremidos.
  const height = Math.max(240, items.length * 22 + 32);
  return <ReactEChartsCore echarts={echarts} option={option} style={{ height, width: '100%' }} notMerge />;
}