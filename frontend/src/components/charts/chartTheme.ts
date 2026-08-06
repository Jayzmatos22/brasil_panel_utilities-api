// Base compartilhada dos gráficos ECharts: paleta, formatadores pt-BR e os
// defaults responsivos de grid, eixo e tooltip.
//
// Por que existe: os três componentes de gráfico nasceram copiando um ao
// outro, e a cópia já tinha divergido de forma visível. A cor do rótulo de
// eixo era #94a3b8 no LineChart, #64748b no Compact e #334155 no Bar — este
// último, slate-700, praticamente invisível sobre o fundo escuro do painel.
// A linha de grade oscilava entre #334155 e #1e293b, e `hideOverlap` existia
// só nos gráficos de linha, o que deixava os rótulos do gráfico de barras se
// empilharem em telas estreitas.
//
// Nada aqui é decorativo: cada constante existe porque estava duplicada e
// divergiu. Um gráfico novo deve consumir esta camada, nunca redeclarar hex.

/** Paleta dos elementos estruturais. O fundo do painel é slate-950/900. */
export const CHART_INK = {
  /** Eixo e borda de tooltip. */
  axis: '#334155',
  /** Rótulo de eixo em gráfico de tamanho normal. */
  label: '#94a3b8',
  /** Rótulo em gráfico compacto, onde o texto é menor e compete menos. */
  labelDim: '#64748b',
  /** Linha de grade. Mais escura que o eixo para não competir com os dados. */
  split: '#1e293b',
  tooltipBg: '#0f172a',
  tooltipText: '#e2e8f0',
} as const;

// ─── Formatadores ────────────────────────────────────────────────────────────

/** Número cheio em pt-BR: 1234.5 → "1.234,5". */
export const formatNumber = (v: number): string =>
  v.toLocaleString('pt-BR', { maximumFractionDigits: 2 });

/**
 * Compacto em pt-BR: 3.44e12 → "3,4 tri", 1.2e6 → "1,2 mi".
 *
 * Usa Intl em vez da escada manual de if/else que existia no Compact, que
 * devolvia "B"/"M"/"k" — sufixos ingleses numa interface em português, e
 * incoerentes com o resto do painel.
 */
export const formatCompact = (v: number): string =>
  v.toLocaleString('pt-BR', { notation: 'compact', maximumFractionDigits: 1 });

/** Percentual enxuto: 4.2 → "4,2%". O sinal fica a cargo de quem chama. */
export const formatPercent = (v: number): string =>
  `${v.toLocaleString('pt-BR', { maximumFractionDigits: 1 })}%`;

/** Percentual com sinal explícito, para variações: 4.2 → "+4,2%". */
export const formatSignedPercent = (v: number): string =>
  `${v > 0 ? '+' : ''}${formatPercent(v)}`;

/** "#eab308" → "234,179,8". Usado nos gradientes de área. */
export const hexToRgb = (hex: string): string => {
  const h = hex.replace('#', '');
  return [0, 2, 4].map((i) => parseInt(h.slice(i, i + 2), 16)).join(',');
};

// ─── Blocos de option ────────────────────────────────────────────────────────

/**
 * Densidade do gráfico. Governa tamanho de fonte e cor de rótulo — não é
 * "tamanho da tela": um gráfico compacto dentro de um card é denso mesmo no
 * desktop, e um gráfico principal é normal mesmo no celular.
 */
export type ChartDensity = 'normal' | 'compact';

const FONT_SIZE: Record<ChartDensity, number> = { normal: 11, compact: 9 };

/**
 * Rótulo de eixo com `hideOverlap`.
 *
 * `hideOverlap` é o que faz o gráfico degradar com elegância: em vez de
 * sobrepor rótulos até virar borrão — o defeito que aparecia no gráfico de
 * barras em 368px —, o ECharts descarta os que colidiriam e mantém os
 * legíveis. É a alternativa a fixar `interval`, que exigiria adivinhar a
 * largura do container.
 */
export const axisLabel = (
  density: ChartDensity = 'normal',
  formatter?: (v: number) => string,
) => ({
  color: density === 'compact' ? CHART_INK.labelDim : CHART_INK.label,
  fontSize: FONT_SIZE[density],
  hideOverlap: true,
  ...(formatter ? { formatter } : {}),
});

/**
 * Grid com `containLabel`.
 *
 * As margens são pequenas de propósito: com containLabel o ECharts reserva o
 * que os rótulos de fato ocupam, então margem generosa vira desperdício de
 * largura — crítico em 368px, onde o container útil não chega a 300px.
 */
export const grid = (density: ChartDensity = 'normal') =>
  density === 'compact'
    ? { left: 4, right: 8, top: 12, bottom: 4, containLabel: true }
    : { left: 8, right: 12, top: 24, bottom: 8, containLabel: true };

export const tooltip = (
  fmt: (v: number) => string,
  density: ChartDensity = 'normal',
) => ({
  trigger: 'axis' as const,
  backgroundColor: CHART_INK.tooltipBg,
  borderColor: CHART_INK.axis,
  textStyle: {
    color: CHART_INK.tooltipText,
    ...(density === 'compact' ? { fontSize: 11 } : {}),
  },
  valueFormatter: (v: unknown) => (typeof v === 'number' ? fmt(v) : String(v)),
});

export const axisLine = { lineStyle: { color: CHART_INK.axis } };

export const splitLine = {
  lineStyle: { color: CHART_INK.split, type: 'dashed' as const },
};

/** Gradiente vertical da área sob a linha, da cor da série até transparente. */
export const areaGradient = (color: string, alpha = 0.25) => ({
  type: 'linear' as const,
  x: 0,
  y: 0,
  x2: 0,
  y2: 1,
  colorStops: [
    { offset: 0, color: `rgba(${hexToRgb(color)},${alpha})` },
    { offset: 1, color: `rgba(${hexToRgb(color)},0)` },
  ],
});
