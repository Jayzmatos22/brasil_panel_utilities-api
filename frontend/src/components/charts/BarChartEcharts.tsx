// Gráfico de barras horizontais via Apache ECharts (import enxuto — só
// bar/grid/tooltip + canvas).
//
// Toda a configuração visual vem de chartTheme. Antes de consumir a camada,
// este arquivo carregava a própria paleta e tinha ficado para trás da passada
// responsiva feita nos gráficos de linha: os rótulos eram #334155 (slate-700,
// quase invisível sobre o fundo do painel), o rótulo da barra era #204155 — um
// hex que não existe em nenhum outro lugar do projeto — e faltava
// `hideOverlap`, o que empilhava os rótulos do eixo de valor em telas
// estreitas.
import { useMemo } from 'react';
import * as echarts from 'echarts/core';
import { BarChart } from 'echarts/charts';
import { GridComponent, TooltipComponent } from 'echarts/components';
import { CanvasRenderer } from 'echarts/renderers';
import type { EChartsCoreOption } from 'echarts/core';
import ReactEChartsCore from 'echarts-for-react/esm/core';
import { useEchartsAutoResize } from '../../hooks/UseEchartsAutoResize';
import {
  CHART_INK,
  axisLabel,
  axisLine,
  formatNumber,
  grid,
  splitLine,
  tooltip,
} from './chartTheme';

echarts.use([BarChart, GridComponent, TooltipComponent, CanvasRenderer]);

export interface BarItem {
  label: string;
  value: number;
}

interface BarChartProps {
  items: BarItem[];
  color?: string;
  valueFormatter?: (v: number) => string;
  /**
   * Largura máxima do rótulo de categoria, em px. Nomes longos (estados,
   * criptomoedas) roubariam a largura do desenho num container de 300px.
   */
  labelWidth?: number;
}

export function BarChartEcharts({
  items,
  color = '#eab308',
  valueFormatter,
  labelWidth = 92,
}: BarChartProps) {
  const option = useMemo<EChartsCoreOption>(() => {
    const fmt = valueFormatter ?? formatNumber;
    // Maior valor no topo: a categoria do eixo Y é desenhada de baixo p/ cima.
    const ordered = [...items].sort((a, b) => a.value - b.value);

    // ~6,5px por caractere a 11px, mais uma folga de 14px para o afastamento
    // da barra. O teto de 96px impede que um valor atípico coma a área do
    // desenho em telas estreitas.
    const maiorRotulo = ordered.reduce(
      (max, i) => Math.max(max, fmt(i.value).length),
      0,
    );
    const espacoDoRotulo = Math.min(96, Math.round(maiorRotulo * 6.5) + 14);

    return {
      backgroundColor: 'transparent',
      // grid() traz containLabel, que reserva espaço para os rótulos de EIXO.
      // O rótulo da SÉRIE — o valor à direita de cada barra — fica de fora
      // dessa conta, e é por isso que precisa de margem explícita: sem ela o
      // "R$ 3,44 tri" da maior barra era cortado na borda direita.
      //
      // A margem sai do texto mais longo em vez de um número fixo. O código
      // original usava 72px chapado, que sobrava para "12%" e faltava para
      // valores em trilhões.
      grid: { ...grid(), right: espacoDoRotulo },
      tooltip: {
        ...tooltip(fmt),
        axisPointer: { type: 'shadow' },
      },
      xAxis: {
        type: 'value',
        axisLine,
        // O eixo de valor é o que quebrava: sem hideOverlap, "+2,00%" repetido
        // a cada tick vira uma tira ilegível quando a largura cai.
        axisLabel: axisLabel('normal', fmt),
        splitLine,
      },
      yAxis: {
        type: 'category',
        data: ordered.map((i) => i.label),
        axisLine,
        axisLabel: {
          ...axisLabel(),
          width: labelWidth,
          overflow: 'truncate',
        },
      },
      series: [
        {
          type: 'bar',
          data: ordered.map((i) => i.value),
          itemStyle: { color, borderRadius: [0, 4, 4, 0] },
          label: {
            show: true,
            position: 'right',
            color: CHART_INK.label,
            fontSize: 11,
            formatter: (p: { value: number }) => fmt(p.value),
          },
          // Sem isto, o rótulo da barra mais longa colide com o do vizinho
          // quando a largura cai — o mesmo problema do eixo, um nível acima.
          labelLayout: { hideOverlap: true },
        },
      ],
    };
  }, [items, color, valueFormatter, labelWidth]);

  // Altura proporcional ao nº de barras para os rótulos não ficarem espremidos.
  const height = Math.max(240, items.length * 22 + 32);
  const chartRef = useEchartsAutoResize<ReactEChartsCore>();

  return (
    <ReactEChartsCore
      ref={chartRef}
      echarts={echarts}
      option={option}
      style={{ height, width: '100%' }}
      notMerge
    />
  );
}
