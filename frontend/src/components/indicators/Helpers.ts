/**
 * helpers.ts — funções puras de processamento de séries IPEA.
 *
 * Sem React, sem JSX, sem side-effects. Operam sobre IpeaSerie[] e
 * devolvem estruturas tipadas. Podem ser usadas em componentes, testes
 * unitários, web workers ou server-side sem ajuste.
 */

import type { LinePoint } from '../charts/LineChartEcharts';
import type { IpeaItem, IpeaSerie } from '../../types/IpeaType';
import type {
  AggregatedTotal,
  ClosingRow,
  LatestSummary,
  SeriesMetrics,
} from '../../types/utilities/Economy';
import { MS_5Y, MS_6M } from '../../constants/indicators/TimeWindows';

// ─── Filtros e ordenação ────────────────────────────────────────────────────

/** Descarta entradas nulas/NaN — IPEA às vezes envia buracos em feriados. */
export const filterValid = (items: IpeaItem[]): IpeaItem[] =>
  items.filter(
    (i) => i.valor !== null && i.valor !== undefined && !Number.isNaN(i.valor),
  );

/** Ordena asc por data string (ISO é lexicograficamente ordenável). */
export const sortAsc = (items: IpeaItem[]): IpeaItem[] =>
  [...items].sort((a, b) => a.data.localeCompare(b.data));

/** Converte IpeaItem[] → LinePoint[] (formato consumido pelos gráficos). */
export const toLinePoints = (items: IpeaItem[]): LinePoint[] =>
  items.map((i) => ({ date: i.data.substring(0, 10), value: i.valor as number }));

/** Mantém apenas pontos dentro de `ms` antes do último ponto da série. */
export const filterByRecentWindow = (items: IpeaItem[], ms: number): IpeaItem[] => {
  if (items.length === 0) return [];
  const lastTs = new Date(items[items.length - 1].data).getTime();
  const cutoff = lastTs - ms;
  return items.filter((i) => new Date(i.data).getTime() >= cutoff);
};

// ─── Variações ──────────────────────────────────────────────────────────────

/** Para cada ponto, calcula a variação % frente ao ponto anterior. */
export const computeClosingsWithVariation = (items: IpeaItem[]): ClosingRow[] => {
  const sorted = sortAsc(filterValid(items));
  return sorted.map((item, idx) => {
    if (idx === 0) {
      return { date: item.data, value: item.valor as number, variation: null };
    }
    const prev = sorted[idx - 1];
    const prevVal = prev.valor as number;
    return {
      date: item.data,
      value: item.valor as number,
      variation: ((item.valor! - prevVal) / prevVal) * 100,
    };
  });
};

/**
 * Resumo do último ponto de uma série.
 *
 * Calcula 3 variações simultaneamente (todas em %):
 *  - variationDD1: ponto vs ponto imediatamente anterior
 *  - variationMM : mês atual vs mês anterior (último ponto cujo mês difere)
 *  - variationYoY: mês atual vs mesmo mês do ano anterior
 */
export const computeLatestSummary = (
  data: IpeaSerie[] | undefined,
): LatestSummary | null => {
  if (!data || data.length === 0) return null;
  const raw = data[0]?.dados;
  if (!raw || raw.length === 0) return null;
  const valid = sortAsc(filterValid(raw));
  if (valid.length === 0) return null;

  const last = valid[valid.length - 1];
  const value = last.valor as number;
  const date = last.data.substring(0, 10);

  const variationDD1 = (() => {
    if (valid.length < 2) return null;
    const prev = valid[valid.length - 2].valor as number;
    return prev ? ((value - prev) / prev) * 100 : null;
  })();

  const variationMM = (() => {
    const lastMonth = last.data.substring(0, 7); // yyyy-mm
    for (let i = valid.length - 2; i >= 0; i--) {
      if (valid[i].data.substring(0, 7) !== lastMonth) {
        const prev = valid[i].valor as number;
        return prev ? ((value - prev) / prev) * 100 : null;
      }
    }
    return null;
  })();

  const variationYoY = (() => {
    const lastYear = parseInt(last.data.substring(0, 4), 10);
    const lastMonth = last.data.substring(5, 7);
    const yoy = valid.find(
      (i) =>
        i.data.substring(0, 4) === String(lastYear - 1) &&
        i.data.substring(5, 7) === lastMonth,
    );
    if (!yoy || !yoy.valor) return null;
    return ((value - yoy.valor) / yoy.valor) * 100;
  })();

  return { value, date, variationDD1, variationMM, variationYoY };
};

// ─── Métricas de janela ─────────────────────────────────────────────────────

/**
 * Métricas agregadas de uma série nas janelas 5a/6m.
 *
 * Inclui `validAsc` (série completa válida) para que o PeriodExplorer
 * possa filtrar sem precisar reprocessar a série original.
 */
export const computeMetrics = (data: IpeaSerie[] | undefined): SeriesMetrics | null => {
  if (!data || data.length === 0) return null;
  const raw = data[0]?.dados;
  if (!raw || raw.length === 0) return null;

  const validAsc = sortAsc(filterValid(raw));
  if (validAsc.length === 0) return null;

  const fiveYearItems = filterByRecentWindow(validAsc, MS_5Y);
  const sixMonthItems = filterByRecentWindow(validAsc, MS_6M);
  const fiveYearPoints = toLinePoints(fiveYearItems);
  const sixMonthPoints = toLinePoints(sixMonthItems);
  const closings = computeClosingsWithVariation(raw);

  // Retorno 5 anos + máxima/mínima no período
  let fiveYearReturn: number | null = null;
  let fiveYearHigh: SeriesMetrics['fiveYearHigh'] = null;
  let fiveYearLow: SeriesMetrics['fiveYearLow'] = null;
  if (fiveYearPoints.length >= 2) {
    const first = fiveYearPoints[0].value;
    const last = fiveYearPoints[fiveYearPoints.length - 1].value;
    fiveYearReturn = ((last - first) / first) * 100;
    let hi = fiveYearPoints[0];
    let lo = fiveYearPoints[0];
    for (const p of fiveYearPoints) {
      if (p.value > hi.value) hi = p;
      if (p.value < lo.value) lo = p;
    }
    fiveYearHigh = { date: hi.date, value: hi.value };
    fiveYearLow = { date: lo.date, value: lo.value };
  }

  // Retorno 6 meses
  let sixMonthReturn: number | null = null;
  if (sixMonthPoints.length >= 2) {
    const first = sixMonthPoints[0].value;
    const last = sixMonthPoints[sixMonthPoints.length - 1].value;
    sixMonthReturn = ((last - first) / first) * 100;
  }

  // Volatilidade diária média (absoluta) + contagem de dias positivos/negativos
  let avgDailyAbsVar6m: number | null = null;
  let positiveDays6m = 0;
  let negativeDays6m = 0;
  const sixMonthClosings = closings.slice(-Math.max(sixMonthPoints.length, 1));
  const variations = sixMonthClosings
    .map((c) => c.variation)
    .filter((v): v is number => v !== null);
  if (variations.length > 0) {
    avgDailyAbsVar6m = variations.reduce((s, v) => s + Math.abs(v), 0) / variations.length;
    positiveDays6m = variations.filter((v) => v > 0).length;
    negativeDays6m = variations.filter((v) => v < 0).length;
  }

  // Tendência dos últimos 5 pontos
  let last5Trend: SeriesMetrics['last5Trend'] = null;
  let last5NetPct: number | null = null;
  const last5vals = closings.slice(-5).map((c) => c.value);
  if (last5vals.length >= 2) {
    const diff = last5vals[last5vals.length - 1] - last5vals[0];
    last5NetPct = (diff / last5vals[0]) * 100;
    // Considera lateral se a variação for < 0.1% do valor inicial.
    last5Trend =
      Math.abs(diff) < last5vals[0] * 0.001 ? 'flat' : diff > 0 ? 'up' : 'down';
  }

  return {
    fiveYearPoints,
    sixMonthPoints,
    closings,
    validAsc,
    fiveYearReturn,
    sixMonthReturn,
    fiveYearHigh,
    fiveYearLow,
    avgDailyAbsVar6m,
    positiveDays6m,
    negativeDays6m,
    last5Trend,
    last5NetPct,
  };
};

// ─── Agregação multi-série ──────────────────────────────────────────────────

/**
 * Soma N séries num único total, alinhado pelo mês de referência mais recente.
 *
 * Estratégia:
 *  - Mês de referência = mês do último ponto da série mais "atual"
 *  - Para cada série, pega o valor do mês de referência (ou último disponível)
 *  - Comparativos M/M e YoY somados ponto-a-ponto por série
 *  - Shares % calculados por participação no total corrente
 */
export const computeAggregatedTotal = (
  series: { key: string; label: string; data: IpeaSerie[] | undefined }[],
): AggregatedTotal | null => {
  const perSeries = series
    .map((s) => ({ ...s, valid: sortAsc(filterValid(s.data?.[0]?.dados ?? [])) }))
    .filter((s) => s.valid.length > 0);
  if (perSeries.length === 0) return null;

  // Mês de referência: máximo entre os últimos meses de cada série.
  let refMonth = perSeries[0].valid[perSeries[0].valid.length - 1].data.substring(0, 7);
  for (const s of perSeries) {
    const m = s.valid[s.valid.length - 1].data.substring(0, 7);
    if (m > refMonth) refMonth = m;
  }

  let totalCurrent = 0;
  let totalPrevious = 0;
  let totalYoY = 0;
  let hasPrevious = true;
  let hasYoY = true;
  const shares: AggregatedTotal['shares'] = [];

  const [refYearStr, refMonthStr] = refMonth.split('-');
  const refYear = parseInt(refYearStr, 10);

  for (const s of perSeries) {
    // Pega último ponto do mês de referência; fallback para último disponível.
    let cur: IpeaItem | null = null;
    for (let i = s.valid.length - 1; i >= 0; i--) {
      if (s.valid[i].data.substring(0, 7) === refMonth) {
        cur = s.valid[i];
        break;
      }
    }
    if (!cur) cur = s.valid[s.valid.length - 1];
    const curVal = cur.valor as number;
    totalCurrent += curVal;
    shares.push({ key: s.key, label: s.label, value: curVal, pct: 0 });

    // Mês imediatamente anterior (na mesma série).
    let prev: IpeaItem | null = null;
    for (let i = s.valid.length - 1; i >= 0; i--) {
      if (s.valid[i].data.substring(0, 7) < refMonth) {
        prev = s.valid[i];
        break;
      }
    }
    if (prev && prev.valor) totalPrevious += prev.valor;
    else hasPrevious = false;

    // Mesmo mês do ano anterior.
    const yoy = s.valid.find(
      (i) =>
        i.data.substring(0, 4) === String(refYear - 1) &&
        i.data.substring(5, 7) === refMonthStr,
    );
    if (yoy && yoy.valor) totalYoY += yoy.valor;
    else hasYoY = false;
  }

  // Calcula shares percentuais
  const sum = shares.reduce((s, x) => s + x.value, 0);
  for (const sh of shares) sh.pct = sum > 0 ? (sh.value / sum) * 100 : 0;
  shares.sort((a, b) => b.value - a.value);

  const variationMM =
    hasPrevious && totalPrevious > 0
      ? ((totalCurrent - totalPrevious) / totalPrevious) * 100
      : null;
  const variationYoY =
    hasYoY && totalYoY > 0 ? ((totalCurrent - totalYoY) / totalYoY) * 100 : null;

  return {
    totalCurrent,
    totalPrevious,
    totalYoY,
    variationMM,
    variationYoY,
    referenceMonth: refMonth,
    shares,
  };
};

// ─── Busca de imagem (Vite glob import) ─────────────────────────────────────

/**
 * Imagens de indicadores econômicos (Ibovespa, Dólar, Selic, CDI, IPCA).
 * Convenção: arquivo deve conter `-img` no nome (ex.: `ibovespa-img.png`).
 */
const INDICATOR_IMAGES = import.meta.glob(
  '../../assets/indicadores/*.{jpeg,jpg,png,webp,avif}',
  { eager: true, import: 'default' },
) as Record<string, string>;

/**
 * Imagens de tributos (Imp. Importação, IRPF, IRPJ, IR Total, IOF, IPI).
 * Convenção: arquivo deve conter `-img` no nome (ex.: `irpf-img.png`).
 */
const TAX_IMAGES = import.meta.glob(
  '../../assets/impostos/*.{jpeg,jpg,png,webp,avif}',
  { eager: true, import: 'default' },
) as Record<string, string>;

/**
 * Resolve `imageKey` para URL real de imagem.
 *
 * Convenção de nomenclatura aceita (qualquer uma funciona):
 *  1. `{key}-img.png`         → "irpf-img.png"
 *  2. `{key}.png`              → "irpf.png"
 *  3. `prefixo-{key}-img.png`  → "exportacoes-total-img.png"
 *  4. `prefixo-{key}.png`      → "exportacoes-bens-consumo.png"
 *
 * @param key    Slug da imagem (ex: 'total', 'irpf', 'bens-consumo-valor')
 * @param folder Qual pasta de assets buscar. Default: 'indicadores'.
 *
 */

const CAMBIO_COMERCIAL_IMAGES = import.meta.glob(
  '../../assets/cambioComercial/*.{jpeg,jpg,png,webp,avif}',
  { eager: true, import: 'default' },
) as Record<string, string>;


export const findImage = (
  key: string,
  folder: 'indicadores' | 'impostos' | 'exportacoes' | 'cambioComercial' | 'balanca' = 'indicadores',
): string | undefined => {
  const map = folder === 'impostos' ? TAX_IMAGES
            : folder === 'exportacoes' ? EXPORT_IMAGES
            : folder === 'cambioComercial' ? CAMBIO_COMERCIAL_IMAGES
            : folder === 'balanca' ? BALANCA_IMAGES
            : INDICATOR_IMAGES;
  const k = key.toLowerCase();
  const match = Object.entries(map).find(([path]) => {
    const filename = path.toLowerCase().split('/').pop() ?? '';
    const basename = filename.replace(/\.(jpe?g|png|webp|avif)$/, '');
    const cleaned = basename
    .replace(/^(exportacoes|impostos|indicadores|cambioComercial|balanca)-/, '')
    .replace(/^cambio-contratado-/, '')
    .replace(/^balanca-pagamentos-/, '');   // ← NOVA LINHA
return cleaned === k || cleaned === `${k}-img`;
  });
  return match?.[1];
};







// ─── Geradores de texto dinâmico para Insights ──────────────────────────────

/**
 * Cada função `describeX` retorna um fragmento de frase baseado em thresholds.
 * São funções puras — passou valor, recebe texto. Não há estado.
 *
 * Mantidas em helpers (não em components) para permitir uso futuro em
 * exports PDF, e-mails, alertas — qualquer lugar que precise de texto.
 */

export const describeFiveYearReturn = (r: number): string => {
  const abs = Math.abs(r);
  const dir = r >= 0 ? 'valorização nominal' : 'desvalorização nominal';
  if (abs >= 80) return `forte ${dir} de longo prazo, com alta expressiva de ${r > 0 ? '+' : ''}${r.toFixed(2)}% no recorte de 5 anos`;
  if (abs >= 40) return `${dir} consistente de ${r > 0 ? '+' : ''}${r.toFixed(2)}% no recorte de 5 anos, indicando tendência estrutural positiva`;
  if (abs >= 15) return `${dir} moderada de ${r > 0 ? '+' : ''}${r.toFixed(2)}% no recorte de 5 anos, com trajetória ascendente acompanhada de correções`;
  if (abs >= 0.5) return `${dir} leve de ${r > 0 ? '+' : ''}${r.toFixed(2)}% no recorte de 5 anos, sinalizando mercado lateralizado em longo prazo`;
  return `recorte de 5 anos praticamente estável, com variação líquida de ${r > 0 ? '+' : ''}${r.toFixed(2)}% entre o primeiro e o último ponto`;
};

export const describeSixMonthReturn = (r: number): string => {
  const s = `${r > 0 ? '+' : ''}${r.toFixed(2)}%`;
  if (r >= 15) return `fase de forte alta no curto prazo, acumulando ${s} nos últimos 6 meses`;
  if (r >= 5) return `fase ascendente consistente, com ${s} nos últimos 6 meses`;
  if (r >= 0.5) return `leve viés de alta no curto prazo, acumulando ${s} nos últimos 6 meses`;
  if (r > -0.5) return `mercado lateralizado nos últimos 6 meses, com variação líquida de ${s}`;
  if (r > -5) return `leve viés de baixa no curto prazo, acumulando ${s} nos últimos 6 meses`;
  if (r > -15) return `fase descendente consistente, com ${s} nos últimos 6 meses`;
  return `fase de forte queda no curto prazo, acumulando ${s} nos últimos 6 meses`;
};

export const describeVolatility = (
  avgAbs: number,
  pos: number,
  neg: number,
): string => {
  let level: string;
  if (avgAbs >= 1.5) level = 'alta volatilidade diária';
  else if (avgAbs >= 0.8) level = 'volatilidade moderada';
  else if (avgAbs >= 0.3) level = 'volatilidade contida';
  else level = 'baixa volatilidade diária';
  const balance =
    pos > neg * 1.5
      ? 'com claro predomínio de dias de alta'
      : neg > pos * 1.5
        ? 'com claro predomínio de dias de baixa'
        : 'com distribuição equilibrada entre altas e baixas';
  return `A janela de 6 meses apresenta ${level} (variação absoluta média de ${avgAbs.toFixed(2)}% por período), ${balance}: ${pos} períodos positivos e ${neg} negativos`;
};

export const describeLast5Trend = (
  trend: 'up' | 'down' | 'flat',
  netPct: number,
): string => {
  const s = `${netPct > 0 ? '+' : ''}${netPct.toFixed(2)}%`;
  if (trend === 'flat')
    return `A janela dos últimos 5 pontos está lateralizada, com variação líquida próxima de zero (${s})`;
  if (trend === 'up')
    return `A janela dos últimos 5 pontos é levemente ascendente, acumulando ${s}`;
  return `A janela dos últimos 5 pontos é levemente descendente, acumulando ${s}`;
};

export const describeAmplitude = (
  hi: { date: string; value: number },
  lo: { date: string; value: number },
  valueFormatter: (v: number) => string,
): string => {
  const amplitude = ((hi.value - lo.value) / lo.value) * 100;
  let intensity: string;
  if (amplitude >= 100) intensity = 'amplitude muito ampla';
  else if (amplitude >= 60) intensity = 'amplitude ampla';
  else if (amplitude >= 30) intensity = 'amplitude moderada';
  else intensity = 'amplitude contida';

  // fmtBRDate inlined para evitar import circular com formatters
  const fmtDate = (iso: string) => {
    const [y, m, d] = iso.substring(0, 10).split('-');
    return `${d}/${m}/${y}`;
  };

  return `Há ${intensity} entre a mínima de ${valueFormatter(lo.value)} (${fmtDate(lo.date)}) e a máxima de ${valueFormatter(hi.value)} (${fmtDate(hi.date)}) no período de 5 anos, com variação de ${amplitude.toFixed(1)}%`;
};

export const describeSelicCorrelation = (
  sixMonthReturn: number | null,
  fiveYearReturn: number | null,
): string => {
  const shortTerm = sixMonthReturn === null ? null : sixMonthReturn >= 0 ? 'alta' : 'queda';
  const longTerm =
    fiveYearReturn === null ? null : fiveYearReturn >= 0 ? 'valorização' : 'desvalorização';

  const tail =
    'correlação macroeconômica observável historicamente, mas não determinística ponto a ponto';

  if (shortTerm === 'queda' && longTerm === 'valorização') {
    return `A correção observada no curto prazo, em um contexto de valorização de longo prazo, é tipicamente associada a ciclos de aperto monetário (alta da Selic), que eleva o custo de oportunidade da renda variável — ${tail}`;
  }
  if (shortTerm === 'alta' && longTerm === 'valorização') {
    return `A fase atual de alta no curto prazo, combinada com valorização de longo prazo, costuma ocorrer em ciclos de afrouxamento monetário (queda da Selic), que reduz o atrativo relativo da renda fixa — ${tail}`;
  }
  if (shortTerm === 'queda' && longTerm === 'desvalorização') {
    return `A combinação de queda no curto prazo e desvalorização no longo prazo costuma refletir ciclos prolongados de Selic elevada pressionando a valuation das ações — ${tail}`;
  }
  if (shortTerm === 'alta' && longTerm === 'desvalorização') {
    return `A alta no curto prazo em meio a desvalorização de longo prazo costuma indicar recuperação técnica após ciclo de aperto monetário, possivelmente associada a expectativa de queda da Selic — ${tail}`;
  }
  return `Historicamente, períodos de alta da taxa Selic tendem a comprimir a valuation das ações por elevar o custo de oportunidade da renda fixa; o movimento inverso costuma ocorrer em ciclos de queda da Selic — ${tail}`;
};





/** Imagens de exportações (Total, Quantum, Básicos, Combustíveis, etc.). */
const EXPORT_IMAGES = import.meta.glob(
  '../../assets/exportacoes/*.{jpeg,jpg,png,webp,avif}',
  { eager: true, import: 'default' },
) as Record<string, string>;




// ─── Busca de banner (1 imagem por página) ──────────────────────────────────

const BANNER_IMAGES = import.meta.glob(
  '../../assets/**/banner-*.{jpeg,jpg,png,webp,avif}',
  { eager: true, import: 'default' },
) as Record<string, string>;

/**
 * Resolve a URL do banner de uma página.
 * Convenção: arquivo começa com "banner-" (ex: banner-exportacoes-img.jpg).
 *
 * @param key Slug após o prefixo "banner-" (ex: 'exportacoes', 'impostos').
 */
export const findBannerImage = (key: string): string | undefined => {
  const k = key.toLowerCase();
  const match = Object.entries(BANNER_IMAGES).find(([path]) => {
    const filename = path.toLowerCase().split('/').pop() ?? '';
    return filename.startsWith(`banner-${k}`);
  });
  return match?.[1];
};


const BALANCA_IMAGES = import.meta.glob(
  '../../assets/balanca/*.{jpeg,jpg,png,webp,avif}',
  { eager: true, import: 'default' },
) as Record<string, string>;