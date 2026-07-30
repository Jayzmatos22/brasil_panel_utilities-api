import { useMemo } from 'react';
import ReactECharts from 'echarts-for-react';
import type { EChartsOption } from 'echarts';
import { useEchartsAutoResize } from '../../hooks/UseEchartsAutoResize';

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

export interface LineChartEchartsProps {
  points: LinePoint[];
  color?: string;
  valueFormatter?: (v: number) => string;
  /** Override do estilo inline (height/width). */
  style?: React.CSSProperties;
}

export function LineChartEcharts({
  points,
  color = '#eab308',
  valueFormatter,
  style,
}: LineChartEchartsProps) {
  const option = useMemo<EChartsOption>(() => {
    const rgb = hexToRgb(color);
    const fmt = valueFormatter ?? ((v: number) =>
      v.toLocaleString('pt-BR', { maximumFractionDigits: 2 }));

    return {
      backgroundColor: 'transparent',
      // `containLabel` faz o ECharts reservar só o que os rótulos realmente
      // precisam, em vez dos 64px fixos de antes — que em 375px consumiam 32%
      // de um container de ~247px. Mesmo padrão já usado no BarChartEcharts.
      grid: { left: 8, right: 12, top: 24, bottom: 8, containLabel: true },
      tooltip: {
        trigger: 'axis',
        backgroundColor: '#0f172a',
        borderColor: '#334155',
        textStyle: { color: '#e2e8f0' },
        valueFormatter: (v: unknown) =>
          typeof v === 'number' ? fmt(v) : String(v),
      },
      xAxis: {
        type: 'category',
        data: points.map((p) => p.date),
        boundaryGap: false,
        axisLine: { lineStyle: { color: '#334155' } },
        // hideOverlap deixa o ECharts descartar rótulos que colidiriam em vez
        // de sobrepô-los — é o que degrada com elegância em telas estreitas.
        axisLabel: { color: '#94a3b8', fontSize: 11, hideOverlap: true },
      },
      yAxis: {
        type: 'value',
        scale: true,
        splitLine: { lineStyle: { color: '#334155', type: 'dashed' } },
        axisLabel: {
          color: '#94a3b8',
          fontSize: 11,
          hideOverlap: true,
          formatter: (v: number) => v.toLocaleString('pt-BR', { maximumFractionDigits: 2 }),
        },
      },
      series: [
        {
          type: 'line',
          smooth: true,
          showSymbol: false,
          data: points.map((p) => p.value),
          lineStyle: { color, width: 2 },
          areaStyle: {
            color: {
              type: 'linear', x: 0, y: 0, x2: 0, y2: 1,
              colorStops: [
                { offset: 0, color: `rgba(${rgb},0.25)` },
                { offset: 1, color: `rgba(${rgb},0)` },
              ],
            },
          },
        },
      ],
    } as EChartsOption;
  }, [points, color, valueFormatter]);

  const chartRef = useEchartsAutoResize<ReactECharts>();

  return (
    <ReactECharts
      ref={chartRef}
      option={option}
      // Altura fluida: 208px em telas estreitas → 300px (o valor anterior) a
      // partir de ~750px. O fallback do var() repete o clamp de propósito, para
      // o componente não depender de o token estar sendo emitido.
      style={{
        height: 'var(--spacing-chart, clamp(13rem, 40vw, 18.75rem))',
        width: '100%',
        ...style,
      }}
      notMerge
    />
  );
}