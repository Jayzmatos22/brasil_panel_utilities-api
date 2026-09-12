import { useMemo } from 'react';
import ReactECharts from 'echarts-for-react';
import type { EChartsOption } from 'echarts';
import { useEchartsAutoResize } from '../../hooks/UseEchartsAutoResize';
import {
  areaGradient,
  axisLabel,
  axisLine,
  formatNumber,
  grid,
  splitLine,
  tooltip,
  usaEscalaLog,
} from './chartTheme';

export interface LinePoint {
  date: string;
  value: number;
}

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
    const fmt = valueFormatter ?? formatNumber;
    const log = usaEscalaLog(points);

    return {
      backgroundColor: 'transparent',
      grid: grid(),
      tooltip: tooltip(fmt),
      xAxis: {
        type: 'category',
        data: points.map((p) => p.date),
        boundaryGap: false,
        axisLine,
        axisLabel: axisLabel(),
      },
      yAxis: {
        type: log ? 'log' : 'value',
        // `scale` só existe no eixo linear; no log a base já define o
        // enquadramento e a opção é ignorada.
        scale: true,
        splitLine,
        // Eixo log sem aviso é gráfico que mente: a mesma distância vertical
        // passa a valer multiplicação, não soma. O nome fica no topo do eixo,
        // onde é lido antes da curva.
        name: log ? 'escala log' : undefined,
        nameTextStyle: { color: '#77879d', fontSize: 10, align: 'left' },
        // O eixo de valor formata sempre em número cheio, mesmo quando a série
        // tem formatter próprio: `valueFormatter` costuma trazer unidade (R$,
        // %) que no eixo repetiria a informação a cada tick.
        axisLabel: axisLabel('normal', formatNumber),
      },
      series: [
        {
          type: 'line',
          smooth: true,
          showSymbol: false,
          data: points.map((p) => p.value),
          lineStyle: { color, width: 2 },
          areaStyle: { color: areaGradient(color, 0.25) },
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