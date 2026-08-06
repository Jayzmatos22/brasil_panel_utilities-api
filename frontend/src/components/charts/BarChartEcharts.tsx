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
  /**
   * Escala do eixo de valor.
   *
   * `log` existe para séries com outlier de ordem de grandeza — o caso do PIB
   * por estado, onde São Paulo (R$ 3,44 tri) é ~230× o menor estado. Em escala
   * linear as vinte e poucas barras menores renderizam abaixo de 2px e a
   * comparação entre elas some.
   *
   * Não é o padrão de propósito: em escala log o comprimento da barra deixa de
   * ser proporcional ao valor, e quem lê barra lê comprimento. Só vale quando
   * a alternativa é não conseguir ler nada — e exige avisar o leitor, o que
   * fica a cargo de quem usa.
   */
  scale?: 'linear' | 'log';
}

export function BarChartEcharts({
  items,
  color = '#eab308',
  valueFormatter,
  labelWidth = 92,
  scale = 'linear',
}: BarChartProps) {
  const option = useMemo<EChartsCoreOption>(() => {
    const fmt = valueFormatter ?? formatNumber;
    // Maior valor no topo: a categoria do eixo Y é desenhada de baixo p/ cima.
    const ordered = [...items].sort((a, b) => a.value - b.value);

    return {
      backgroundColor: 'transparent',
      // grid() já traz containLabel. As margens fixas de 48px à esquerda e
      // 72px à direita que existiam aqui somavam 120px SOBRE o espaço que o
      // containLabel já reserva — em 368px isso consumia mais de um terço da
      // área útil, e era metade do motivo de o gráfico ficar ilegível.
      grid: grid(),
      tooltip: {
        ...tooltip(fmt),
        axisPointer: { type: 'shadow' },
      },
      xAxis: {
        // O eixo log do ECharts não aceita zero nem negativo. Séries que
        // pedem log (PIB por estado) são estritamente positivas; se alguma
        // deixar de ser, cair para linear é melhor que renderizar vazio.
        type: scale === 'log' && ordered.every((i) => i.value > 0)
          ? 'log'
          : 'value',
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
  }, [items, color, valueFormatter, labelWidth, scale]);

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
