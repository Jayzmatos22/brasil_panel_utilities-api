/**
 * Economy.ts — tipos utilitários derivados para páginas de indicadores.
 *
 * Esta pasta (`types/utilities/`) guarda tipos que NÃO espelham diretamente o
 * contrato da API (esses vivem em `types/IpeaType.ts`), mas sim estruturas
 * derivadas que facilitam o processamento e a exibição de séries temporais.
 *
 * Regra mental: se um tipo é genérico o suficiente para ser reusado por
 * qualquer página que consuma séries IPEA (economia, impostos, fx, etc.),
 * ele mora aqui. Se é específico de um domínio (ex.: TaxSpec), mora junto
 * dos dados desse domínio (ex.: constants/taxes/TaxSpecs.ts).
 */

import type { IpeaItem, IpeaSerie } from '../IpeaType';
import type { ReactNode } from 'react';

// ─── Pontos de gráfico ─────────────────────────────────────────────────────
/** Ponto normalizado consumido pelos wrappers de ECharts (LineChartEcharts e Compact). */
export interface LinePoint {
  date: string;
  value: number;
}

// ─── Fechamento com variação D/D-1 ─────────────────────────────────────────
export interface ClosingRow {
  date: string;
  value: number;
  /** Variação % frente ao ponto anterior. Null no primeiro ponto da série. */
  variation: number | null;
}

// ─── Resumo do último período de uma série ─────────────────────────────────
export interface LatestSummary {
  /** Último valor válido. */
  value: number;
  /** Data ISO (yyyy-mm-dd) do último valor. */
  date: string;
  /** Variação D/D-1 em %. Null quando não há ponto anterior. */
  variationDD1: number | null;
  /** Variação mês/mês anterior em %. Null quando não há mês anterior. */
  variationMM: number | null;
  /** Variação ano/ano (mesmo mês do ano anterior) em %. Null quando indisponível. */
  variationYoY: number | null;
}

// ─── Métricas agregadas de uma série (janelas 5a / 6m) ─────────────────────
export interface SeriesMetrics {
  fiveYearPoints: LinePoint[];
  sixMonthPoints: LinePoint[];
  closings: ClosingRow[];
  /** Série completa válida asc — usada pelo Explorador por Período. */
  validAsc: IpeaItem[];

  fiveYearReturn: number | null;
  sixMonthReturn: number | null;
  fiveYearHigh: { date: string; value: number } | null;
  fiveYearLow: { date: string; value: number } | null;
  avgDailyAbsVar6m: number | null;
  positiveDays6m: number;
  negativeDays6m: number;
  last5Trend: 'up' | 'down' | 'flat' | null;
  last5NetPct: number | null;
}

// ─── Resumo agregado (soma de várias séries) ───────────────────────────────
export interface AggregatedTotal {
  /** Soma do último valor disponível em cada série. */
  totalCurrent: number;
  /** Soma do mês imediatamente anterior. */
  totalPrevious: number;
  /** Soma do mesmo mês do ano anterior. */
  totalYoY: number;
  /** Variação M/M em %. */
  variationMM: number | null;
  /** Variação YoY em %. */
  variationYoY: number | null;
  /** Mês de referência (yyyy-mm). */
  referenceMonth: string;
  /** Participação percentual de cada série no total atual, ordenado desc. */
  shares: { key: string; label: string; value: number; pct: number }[];
}

// ─── Participação de cada parte NUM TOTAL conhecido ────────────────────────
/**
 * Diferente de AggregatedTotal, e a diferença é o ponto.
 *
 * Em AggregatedTotal o todo é a SOMA das séries: cada fatia é medida contra as
 * irmãs, e por isso as séries precisam particionar o todo sem sobreposição.
 *
 * Aqui o todo é uma SÉRIE PRÓPRIA, e cada parte é medida contra ela. As partes
 * podem se sobrepor à vontade — é o caso das exportações, onde `basic-products`
 * é eixo de fator agregado e `fuels` é grupo de produto, e um barril de petróleo
 * pertence aos dois. Somadas dariam mais que 100%; medidas contra o total, cada
 * uma continua verdadeira.
 *
 * Consequência para quem for desenhar: as partes NÃO cabem numa barra empilhada.
 * Cada uma precisa da própria barra.
 */
export interface SharesOfTotal {
  /** Mês de referência (yyyy-mm) — o do último ponto válido da série total. */
  referenceMonth: string;
  /** Valor da série total no mês de referência. */
  totalValue: number;
  /** Partes com valor NO MESMO mês, ordenadas por participação desc. */
  parts: { key: string; label: string; value: number; pct: number }[];
  /** Partes descartadas por não terem ponto no mês de referência. */
  omitted: string[];
}

// ─── Decomposição em cascata de um saldo ───────────────────────────────────
/**
 * Terceiro modo de ler participação, e o único que aceita valor NEGATIVO.
 *
 *   AggregatedTotal   todo = soma das séries      → barra empilhada
 *   SharesOfTotal     todo = uma série própria    → uma barra por parte
 *   WaterfallBreakdown  saldo = soma algébrica    → cascata
 *
 * Existe para a Balança de Pagamentos, onde as séries são SALDOS: a balança
 * comercial costuma ser positiva, transações correntes costuma ser deficitária,
 * e as duas coisas são a informação, não ruído. Porcentagem sobre valores de
 * sinais opostos não significa nada — mas contribuição algébrica significa.
 *
 * Cada passo parte de onde o anterior terminou; o acumulado final é o saldo.
 */
export interface WaterfallStep {
  key: string;
  label: string;
  /** Contribuição do passo. Negativo empurra o acumulado para baixo. */
  value: number;
  /** Acumulado antes e depois deste passo — é o que posiciona a barra. */
  start: number;
  end: number;
  /** Passo calculado por diferença, não medido. Ver `residual` abaixo. */
  isResidual?: boolean;
}

export interface WaterfallBreakdown {
  referenceMonth: string;
  /** Saldo final — o valor da série total no mês de referência. */
  totalValue: number;
  totalLabel: string;
  steps: WaterfallStep[];
  /** Extremos do acumulado (com o zero incluído) — dão a escala do desenho. */
  min: number;
  max: number;
  /**
   * Partes sem ponto no mês de referência.
   *
   * Quando há alguma, o resíduo NÃO é calculado: ele absorveria em silêncio o
   * valor da série faltante e a cascata mentiria com cara de precisão.
   */
  omitted: string[];
}

// ─── Resultado de hook React Query de IPEA ─────────────────────────────────
/**
 * Shape genérico do retorno de hooks como useIbovespa, useImportTax, etc.
 *
 * Usado para construir mapas key → resultado na ImpostosPage, permitindo
 * iterar sobre specs e lookup do resultado correspondente.
 */
export interface TaxHookResult {
  data: IpeaSerie[] | undefined;
  isLoading: boolean;
  error: Error | null;
  refetch: () => void;
}

// ─── Sazonalidade — uma entrada por mês de pico ────────────────────────────
/**
 * Usada para gerar insights dinâmicos por tributo.
 * Ex.: IRPF tem pico em julho (1ª quota) e dezembro (ajuste).
 */
export interface SeasonalityInsight {
  /** Índice do mês (0 = janeiro, 11 = dezembro). */
  monthIdx: number;
  /** Explicação textual do motivo do pico. */
  reason: string;
}

// ─── Props do ComparativoGrid ──────────────────────────────────────────────
/**
 * Estrutura esperada pelo ComparativoGrid (grid 2x3 de mini-gráficos).
 * Cada série traz sua própria identificação visual (accent) e dados.
 */
export interface ComparativoGridProps {
  series: {
    key: string;
    shortName: string;
    longName: string;
    accent: string;
    data: IpeaSerie[] | undefined;
  }[];
}

// ─── Item de navegação rápida (QuickNav) ───────────────────────────────────
export interface NavItem {
  id: string;
  label: string;
  color: string;
}


export interface StatCardProps {
  /** Título exibido no card. */
  title: string;
  /** Valor monetário/numérico já formatado como string. */
  value: string;
  /** Ícone React (lucide-react ou equivalente) já dimensionado. */
  icon: ReactNode;
  /** Classes tailwind para colorir a tendência (ex.: 'text-emerald-400'). */
  trendClass?: string;
  /** Delay de animação flutuante (ex.: '0s', '0.5s', '1s'). */
  floatDelay?: string;
}



/**
 * Props do SectionCard — container genérico usado em PibPage e futuras
 * páginas com layout em "seções" (header + conteúdo).
 */
export interface SectionCardProps {
  /** Título curto, exibido em uppercase tracking. */
  title: string;
  /** Subtítulo explicativo abaixo do título. Opcional. */
  subtitle?: string;
  /** Ícone React (lucide) já dimensionado. */
  icon?: ReactNode;
  /** Badge ReactNode no canto direito do header. Opcional. */
  badge?: ReactNode;
  /** Conteúdo principal do card. */
  children: ReactNode;
  /** Classes adicionais para a raiz do card. Default ''. */
  className?: string;
  /** Classes adicionais para o container de conteúdo. Default ''. */
  contentClassName?: string;
}




// ─── Especificação de séries de exportação ──────────────────────────────────
export type ExportCategory = 'valor' | 'indice';

export interface ExportSpec {
  key: string;
  shortName: string;
  longName: string;
  badge: string;
  description: string;
  imageKey: string;
  imageFolder?: 'indicadores' | 'impostos' | 'exportacoes';
  gradient: string;
  accent: string;
  iconKey: string;
  /** Categoria — determina formatador padrão e agrupamento visual. */
  category: ExportCategory;
}

/** Alias genérico para o resultado de qualquer hook IPEA. */
export type SeriesHookResult = TaxHookResult;




export interface CambioContractedSpec {
  key: string;
  shortName: string;
  longName: string;
  badge: string;
  description: string;
  imageKey: string;
  imageFolder?: 'indicadores' | 'impostos' | 'exportacoes' | 'cambioComercial';
  gradient: string;
  accent: string;
  iconKey: string;
  /** Indica se a série é um Total (soma de outras) — usado para excluir do agregado. */
  isAggregate?: boolean;
}



// ─── Especificação de séries da Balança de Pagamentos ──────────────────────
export interface BalancaSpec {
  key: string;
  shortName: string;
  longName: string;
  badge: string;
  description: string;
  imageKey: string;
  imageFolder?: 'indicadores' | 'impostos' | 'exportacoes' | 'cambioComercial' | 'balanca';
  gradient: string;
  accent: string;
  iconKey: string;
  /** 'valor' = US$ milhões | 'indice' = % do PIB. */
  category: 'valor' | 'indice';
}
