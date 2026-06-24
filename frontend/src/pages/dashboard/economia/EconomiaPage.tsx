// API: Banco Central do Brasil (BCB) & IPEA (Ibovespa)
import { memo, useMemo, useState, useEffect } from 'react';
import { motion } from 'motion/react';
import {
  DollarSign, TrendingUp, BarChart3, Percent, AlertCircle, RefreshCw, Activity,
  GraduationCap, Calendar, Sparkles, AlertTriangle, TrendingDown, Minus, Filter,
} from 'lucide-react';
import { useDollarPtax, useSelic, useCdiRate, useIpca } from '../../../hooks/UseEconomy';
import { useIbovespa } from '../../../hooks/UseIpea';
import { LineChartEcharts, type LinePoint } from '../../../components/charts/LineChartEcharts';
import type { IndicatorCardProps, NavItem, ClosingRow, ChartPanelProps, PeriodStats, IbovespaMetrics } from '../../../types/utilities/Economy'
import type { IpeaSerie, IpeaItem } from '../../../types/IpeaType';


// ─── Image Management ───────────────────────────────────────────────────────
const IMAGES = import.meta.glob(
  '../../../assets/indicadores/*.{jpeg,jpg,png,webp,avif}',
  { eager: true, import: 'default' },
) as Record<string, string>;

function findImage(key: string): string | undefined {
  const match = Object.entries(IMAGES).find(([path]) =>
    path.toLowerCase().includes(`${key}-img`),
  );
  return match?.[1];
}

// ─── Motion Variants (Stagger Orchestration) ────────────────────────────────
const containerVariants = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: {
      staggerChildren: 0.15,
    },
  },
};

const itemVariants = {
  hidden: { opacity: 0, y: 30 },
  show: {
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.6,
      ease: [0.25, 0.46, 0.45, 0.94]
    }
  },
};

// ─── Helpers ────────────────────────────────────────────────────────────────
const pct = (v: number) => `${v.toFixed(2)}%`;
const brl = (v: number) =>
  v.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
const formatPts = (v: number) =>
  v.toLocaleString('pt-BR', { maximumFractionDigits: 0 });

// ─── Sub-Components (Memoized) ──────────────────────────────────────────────
const Skeleton = memo(({ className }: { className?: string }) => (
  <div className={`animate-pulse bg-slate-700/40 rounded-md ${className}`} aria-hidden="true" />
));

const DataRow = memo(({ label, value, valueClass = "text-slate-200" }: { label: string; value: string; valueClass?: string }) => (
  <div className="flex justify-between items-center text-sm py-2 border-b border-white/5 last:border-0">
    <span className="text-slate-400">{label}</span>
    <span className={`font-mono font-medium ${valueClass}`}>{value}</span>
  </div>
));

const ErrorState = memo(({ error, refetch }: { error: Error | null; refetch?: () => void }) => (
  <div className="flex flex-col items-center justify-center gap-3 py-6 text-center" role="alert">
    <AlertCircle size={24} className="text-red-400/80" aria-hidden="true" />
    <div>
      <p className="text-red-300 text-sm font-medium">Falha ao carregar dados</p>
      <p className="text-slate-500 text-xs mt-1">{error?.message || 'Erro de conexão'}</p>
    </div>
    {refetch && (
      <button
        onClick={refetch}
        className="mt-2 flex items-center gap-2 px-4 py-1.5 text-xs font-semibold uppercase tracking-wider
                   bg-white/5 border border-white/10 rounded-lg text-slate-300 hover:bg-white/10
                   hover:text-white transition-colors focus:outline-none focus:ring-2 focus:ring-red-500/50"
        aria-label="Tentar carregar os dados novamente"
      >
        <RefreshCw size={12} aria-hidden="true" />
        Tentar novamente
      </button>
    )}
  </div>
));

const IndicatorCard = memo(({
  imageKey, gradient, icon, title, badge, description, isLoading, error, refetch, children, id
}: IndicatorCardProps) => {
  const img = findImage(imageKey);

  return (
    <motion.article
      id={id}
      variants={itemVariants}
      className="group relative flex flex-col lg:flex-row overflow-hidden bg-white/[0.02]
                 backdrop-blur-md border border-white/10 rounded-2xl shadow-[0_8px_40px_-15px_rgba(0,0,0,0.5)]
                 scroll-mt-24"
    >
      {/* ── Visual Panel (Image + Gradient Emerging Effect) ── */}
      <div className="relative lg:w-2/5 aspect-video lg:aspect-auto shrink-0 overflow-hidden">
        <div className={`absolute inset-0 bg-gradient-to-br ${gradient}`} />

        {img && (
          <img
            src={img}
            alt=""
            role="presentation"
            loading="lazy"
            className="absolute inset-0 w-full h-full object-cover transition-transform duration-700 ease-out group-hover:scale-105"
            style={{
              WebkitMaskImage: 'radial-gradient(ellipse 80% 80% at 50% 50%, black 20%, transparent 70%)',
              maskImage: 'radial-gradient(ellipse 80% 80% at 50% 50%, black 20%, transparent 70%)'
            }}
            onError={(e) => { e.currentTarget.style.display = 'none'; }}
          />
        )}

        <div className="absolute inset-0 bg-gradient-to-t from-[#020617] via-[#020617]/60 to-transparent" />

        <div className="absolute bottom-0 left-0 p-6 flex flex-col gap-2 z-10">
          <div className="flex items-center gap-3">
            <span className="w-9 h-9 rounded-xl bg-amber-500/90 text-slate-950 flex items-center justify-center shrink-0 shadow-lg shadow-amber-500/20 backdrop-blur-sm" aria-hidden="true">
              {icon}
            </span>
            <span className="text-white font-bold text-xl drop-shadow-[0_2px_8px_rgba(0,0,0,0.8)]">{title}</span>
          </div>
          <span className="text-slate-300 text-[10px] uppercase tracking-[0.2em] font-semibold drop-shadow-md">{badge}</span>
        </div>
      </div>

      {/* ── Content (Data + Description) ── */}
      <div className="flex-1 flex flex-col p-6 lg:p-8 gap-5">
        <div
          className="min-h-[130px] flex flex-col justify-center"
          role="status"
          aria-live="polite"
          aria-busy={isLoading}
        >
          {isLoading ? (
            <div className="flex flex-col gap-3 w-full" aria-hidden="true">
              <Skeleton className="h-12 w-3/4 mb-2" />
              <Skeleton className="h-4 w-1/2" />
              <Skeleton className="h-4 w-2/3" />
              <Skeleton className="h-4 w-1/3" />
            </div>
          ) : error ? (
            <ErrorState error={error} refetch={refetch} />
          ) : (
            children
          )}
        </div>
        <p className="text-slate-400 text-sm leading-relaxed border-t border-white/5 pt-5">
          {description}
        </p>
      </div>
    </motion.article>
  );
});

// ════════════════════════════════════════════════════════════════════════════
// QuickNav — barra de navegação rápida entre seções
// - Cada item sabe o `id` da seção de destino e sua cor temática.
// - Click → scroll suave até o topo da seção (via scrollIntoView).
// - Secão ativa destacada via IntersectionObserver (rastreia qual está visível).
// - Responsivo: horizontal scroll no mobile, wrap centrado no desktop.
// ════════════════════════════════════════════════════════════════════════════


const NAV_ITEMS: NavItem[] = [
  { id: 'sec-ibovespa',  label: 'Ibovespa',    color: '#818cf8' },
  { id: 'sec-hist-5y',   label: '5 Anos',      color: '#c084fc' },
  { id: 'sec-hist-6m',   label: '6 Meses',     color: '#38bdf8' },
  { id: 'sec-explorer',  label: 'Explorador',  color: '#a78bfa' },
  { id: 'sec-closings',  label: 'Fechamentos', color: '#a5b4fc' },
  { id: 'sec-insights',  label: 'Insights',    color: '#c084fc' },
  { id: 'sec-dollar',    label: 'Dólar',       color: '#4ade80' },
  { id: 'sec-selic',     label: 'Selic',       color: '#f87171' },
  { id: 'sec-cdi',       label: 'CDI',         color: '#60a5fa' },
  { id: 'sec-ipca',      label: 'IPCA',        color: '#cbd5e1' },
];

/**
 * Rastreia qual seção está atualmente visível no viewport.
 * Usa IntersectionObserver com rootMargin enxugado ao "centro vertical"
 * para que a seção ativa seja aquela que ocupa a faixa central da tela.
 */
function useActiveSection(ids: string[]): string {
  const [active, setActive] = useState<string>(ids[0] ?? '');

  useEffect(() => {
    const visible = new Map<string, number>();
    const observers: IntersectionObserver[] = [];

    const pick = () => {
      let best: string | null = null;
      let bestRatio = 0;
      for (const [id, ratio] of visible) {
        if (ratio > bestRatio) {
          bestRatio = ratio;
          best = id;
        }
      }
      if (best) setActive(best);
    };

    for (const id of ids) {
      const el = document.getElementById(id);
      if (!el) continue;
      const obs = new IntersectionObserver(
        (entries) => {
          for (const e of entries) {
            visible.set(id, e.isIntersecting ? e.intersectionRatio : 0);
          }
          pick();
        },
        {
          threshold: [0.05, 0.15, 0.3, 0.5, 0.75],
          rootMargin: '-15% 0px -55% 0px',
        },
      );
      obs.observe(el);
      observers.push(obs);
    }

    return () => observers.forEach((o) => o.disconnect());
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ids.join('|')]);

  return active;
}

const QuickNav = memo(({ items }: { items: NavItem[] }) => {
  const ids = useMemo(() => items.map((i) => i.id), [items]);
  const active = useActiveSection(ids);

  const handleClick = (id: string) => (e: React.MouseEvent<HTMLAnchorElement>) => {
    e.preventDefault();
    const el = document.getElementById(id);
    if (el) {
      el.scrollIntoView({ behavior: 'smooth', block: 'start' });
      // Atualiza a URL sem causar jump nativo (mantém histórico limpo).
      history.replaceState(null, '', `#${id}`);
    }
  };

  return (
    <motion.nav
      variants={itemVariants}
      aria-label="Navegação rápida entre indicadores"
      className="sticky top-3 z-30"
    >
      <div
        className="
          flex gap-1.5 overflow-x-auto pb-1
          sm:flex-wrap sm:justify-center sm:overflow-visible sm:pb-0
          rounded-2xl border border-white/10 bg-slate-950/80 p-2 backdrop-blur-md
          shadow-[0_8px_30px_-12px_rgba(0,0,0,0.6)]
        "
      >
        {items.map((item) => {
          const isActive = active === item.id;
          return (
            <a
              key={item.id}
              href={`#${item.id}`}
              onClick={handleClick(item.id)}
              aria-current={isActive ? 'true' : undefined}
              className="
                group flex shrink-0 items-center gap-1.5 whitespace-nowrap
                rounded-lg px-2.5 py-1.5 text-xs font-medium
                transition-all duration-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-white/40
              "
              style={{
                background: isActive ? `${item.color}1f` : 'transparent',
                color: isActive ? item.color : '#94a3b8',
                boxShadow: isActive ? `inset 0 0 0 1px ${item.color}40` : 'none',
              }}
              onMouseEnter={(e) => {
                if (isActive) return;
                e.currentTarget.style.backgroundColor = `${item.color}14`;
                e.currentTarget.style.color = item.color;
              }}
              onMouseLeave={(e) => {
                if (isActive) return;
                e.currentTarget.style.backgroundColor = 'transparent';
                e.currentTarget.style.color = '#94a3b8';
              }}
            >
              <span
                aria-hidden
                className="h-1.5 w-1.5 rounded-full transition-all duration-200"
                style={{
                  background: item.color,
                  opacity: isActive ? 1 : 0.55,
                  boxShadow: isActive ? `0 0 8px ${item.color}` : 'none',
                }}
              />
              <span>{item.label}</span>
            </a>
          );
        })}
      </div>
    </motion.nav>
  );
});

// ════════════════════════════════════════════════════════════════════════════
// Ibovespa Dashboard — containers independentes (fora do IndicatorCard)


const MS_DAY = 86_400_000;
const MS_5Y = 5 * 365 * MS_DAY;
const MS_6M = 6 * 30 * MS_DAY;

const MONTHS_PT = [
  'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
  'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro',
];

const filterValid = (items: IpeaItem[]): IpeaItem[] =>
  items.filter((i) => i.valor !== null && i.valor !== undefined && !Number.isNaN(i.valor));

const sortAsc = (items: IpeaItem[]): IpeaItem[] =>
  [...items].sort((a, b) => a.data.localeCompare(b.data));

const toLinePoints = (items: IpeaItem[]): LinePoint[] =>
  items.map((i) => ({ date: i.data.substring(0, 10), value: i.valor as number }));

const filterByRecentWindow = (items: IpeaItem[], ms: number): IpeaItem[] => {
  if (items.length === 0) return [];
  const lastTs = new Date(items[items.length - 1].data).getTime();
  const cutoff = lastTs - ms;
  return items.filter((i) => new Date(i.data).getTime() >= cutoff);
};

const fmtBRDate = (iso: string): string => {
  const [y, m, d] = iso.substring(0, 10).split('-');
  return `${d}/${m}/${y}`;
};

const fmtPctSigned = (v: number): string => `${v > 0 ? '+' : ''}${v.toFixed(2)}%`;


const computeClosingsWithVariation = (items: IpeaItem[]): ClosingRow[] => {
  const sorted = sortAsc(filterValid(items));
  return sorted.map((item, idx) => {
    if (idx === 0) return { date: item.data, value: item.valor as number, variation: null };
    const prev = sorted[idx - 1];
    const prevVal = prev.valor as number;
    return {
      date: item.data,
      value: item.valor as number,
      variation: ((item.valor! - prevVal) / prevVal) * 100,
    };
  });
};




const computeMetrics = (data: IpeaSerie[] | undefined): IbovespaMetrics | null => {
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

  let fiveYearReturn: number | null = null;
  let fiveYearHigh: IbovespaMetrics['fiveYearHigh'] = null;
  let fiveYearLow: IbovespaMetrics['fiveYearLow'] = null;
  if (fiveYearPoints.length >= 2) {
    const first = fiveYearPoints[0].value;
    const last = fiveYearPoints[fiveYearPoints.length - 1].value;
    fiveYearReturn = ((last - first) / first) * 100;
    let hi = fiveYearPoints[0], lo = fiveYearPoints[0];
    for (const p of fiveYearPoints) {
      if (p.value > hi.value) hi = p;
      if (p.value < lo.value) lo = p;
    }
    fiveYearHigh = { date: hi.date, value: hi.value };
    fiveYearLow = { date: lo.date, value: lo.value };
  }

  let sixMonthReturn: number | null = null;
  if (sixMonthPoints.length >= 2) {
    const first = sixMonthPoints[0].value;
    const last = sixMonthPoints[sixMonthPoints.length - 1].value;
    sixMonthReturn = ((last - first) / first) * 100;
  }

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

  let last5Trend: IbovespaMetrics['last5Trend'] = null;
  let last5NetPct: number | null = null;
  const last5vals = closings.slice(-5).map((c) => c.value);
  if (last5vals.length >= 2) {
    const diff = last5vals[last5vals.length - 1] - last5vals[0];
    last5NetPct = (diff / last5vals[0]) * 100;
    last5Trend = Math.abs(diff) < last5vals[0] * 0.001 ? 'flat' : diff > 0 ? 'up' : 'down';
  }

  return {
    fiveYearPoints, sixMonthPoints, closings,
    fiveYearReturn, sixMonthReturn,
    fiveYearHigh, fiveYearLow,
    avgDailyAbsVar6m, positiveDays6m, negativeDays6m,
    last5Trend, last5NetPct,
    validAsc,
  };
};

// ─── Gerador dinâmico de insights baseado em thresholds ────────────────────
const describeFiveYearReturn = (r: number): string => {
  const abs = Math.abs(r);
  const dir = r >= 0 ? 'valorização nominal' : 'desvalorização nominal';
  if (abs >= 80) return `forte ${dir} de longo prazo, com alta expressiva de ${fmtPctSigned(r)} no recorte de 5 anos`;
  if (abs >= 40) return `${dir} consistente de ${fmtPctSigned(r)} no recorte de 5 anos, indicando tendência estrutural positiva`;
  if (abs >= 15) return `${dir} moderada de ${fmtPctSigned(r)} no recorte de 5 anos, com trajetória ascendente acompanhada de correções`;
  if (abs >= 0.5) return `${dir} leve de ${fmtPctSigned(r)} no recorte de 5 anos, sinalizando mercado lateralizado em longo prazo`;
  return `recorte de 5 anos praticamente estável, com variação líquida de ${fmtPctSigned(r)} entre o primeiro e o último ponto`;
};

const describeSixMonthReturn = (r: number): string => {
  const abs = Math.abs(r);
  if (r >= 15) return `fase de forte alta no curto prazo, acumulando ${fmtPctSigned(r)} nos últimos 6 meses`;
  if (r >= 5) return `fase ascendente consistente, com ${fmtPctSigned(r)} nos últimos 6 meses`;
  if (r >= 0.5) return `leve viés de alta no curto prazo, acumulando ${fmtPctSigned(r)} nos últimos 6 meses`;
  if (r > -0.5) return `mercado lateralizado nos últimos 6 meses, com variação líquida de ${fmtPctSigned(r)}`;
  if (r > -5) return `leve viés de baixa no curto prazo, acumulando ${fmtPctSigned(r)} nos últimos 6 meses`;
  if (r > -15) return `fase descendente consistente, com ${fmtPctSigned(r)} nos últimos 6 meses`;
  return `fase de forte queda no curto prazo, acumulando ${fmtPctSigned(r)} nos últimos 6 meses`;
};

const describeVolatility = (avgAbs: number, pos: number, neg: number): string => {
  let level: string;
  if (avgAbs >= 1.5) level = 'alta volatilidade diária';
  else if (avgAbs >= 0.8) level = 'volatilidade moderada';
  else if (avgAbs >= 0.3) level = 'volatilidade contida';
  else level = 'baixa volatilidade diária';
  const balance =
    pos > neg * 1.5 ? 'com claro predomínio de dias de alta'
    : neg > pos * 1.5 ? 'com claro predomínio de dias de baixa'
    : 'com distribuição equilibrada entre altas e baixas';
  return `A janela de 6 meses apresenta ${level} (variação absoluta média de ${avgAbs.toFixed(2)}% por pregão), ${balance}: ${pos} dias positivos e ${neg} negativos`;
};

const describeLast5Trend = (
  trend: 'up' | 'down' | 'flat',
  netPct: number,
): string => {
  if (trend === 'flat') return `A janela dos últimos 5 pregões está lateralizada, com variação líquida próxima de zero (${fmtPctSigned(netPct)})`;
  if (trend === 'up') return `A janela dos últimos 5 pregões é levemente ascendente, acumulando ${fmtPctSigned(netPct)}`;
  return `A janela dos últimos 5 pregões é levemente descendente, acumulando ${fmtPctSigned(netPct)}`;
};

const describeAmplitude = (
  hi: { date: string; value: number },
  lo: { date: string; value: number },
): string => {
  const amplitude = ((hi.value - lo.value) / lo.value) * 100;
  let intensity: string;
  if (amplitude >= 100) intensity = 'amplitude muito ampla';
  else if (amplitude >= 60) intensity = 'amplitude ampla';
  else if (amplitude >= 30) intensity = 'amplitude moderada';
  else intensity = 'amplitude contida';
  return `Há ${intensity} entre a mínima de ${formatPts(lo.value)} pts (${fmtBRDate(lo.date)}) e a máxima de ${formatPts(hi.value)} pts (${fmtBRDate(hi.date)}) no período de 5 anos, com variação de ${amplitude.toFixed(1)}%`;
};

const describeSelicCorrelation = (
  sixMonthReturn: number | null,
  fiveYearReturn: number | null,
): string => {
  const shortTerm = sixMonthReturn === null ? null : sixMonthReturn >= 0 ? 'alta' : 'queda';
  const longTerm = fiveYearReturn === null ? null : fiveYearReturn >= 0 ? 'valorização' : 'desvalorização';
  if (shortTerm === 'queda' && longTerm === 'valorização') {
    return 'A correção observada no curto prazo, em um contexto de valorização de longo prazo, é tipicamente associada a ciclos de aperto monetário (alta da Selic), que eleva o custo de oportunidade da renda variável — correlação macroeconômica observável historicamente, mas não determinística ponto a ponto';
  }
  if (shortTerm === 'alta' && longTerm === 'valorização') {
    return 'A fase atual de alta no curto prazo, combinada com valorização de longo prazo, costuma ocorrer em ciclos de afrouxamento monetário (queda da Selic), que reduz o atrativo relativo da renda fixa — correlação macroeconômica observável historicamente, mas não determinística ponto a ponto';
  }
  if (shortTerm === 'queda' && longTerm === 'desvalorização') {
    return 'A combinação de queda no curto prazo e desvalorização no longo prazo costuma refletir ciclos prolongados de Selic elevada pressionando a valuation das ações — correlação macroeconômica observável historicamente, mas não determinística ponto a ponto';
  }
  if (shortTerm === 'alta' && longTerm === 'desvalorização') {
    return 'A alta no curto prazo em meio a desvalorização de longo prazo costuma indicar recuperação técnica após ciclo de aperto monetário, possivelmente associada a expectativa de queda da Selic — correlação macroeconômica observável historicamente, mas não determinística ponto a ponto';
  }
  return 'Historicamente, períodos de alta da taxa Selic tendem a comprimir a valuation das ações por elevar o custo de oportunidade da renda fixa; o movimento inverso costuma ocorrer em ciclos de queda da Selic — correlação macroeconômica observável, mas não determinística ponto a ponto';
};



const ChartPanel = memo(({ title, subtitle, icon, accent, points, emptyHint, id }: ChartPanelProps) => (
  <motion.div
    id={id}
    variants={itemVariants}
    className="group relative overflow-hidden rounded-2xl border border-white/10 bg-white/[0.02]
               backdrop-blur-md p-6 shadow-[0_8px_40px_-15px_rgba(0,0,0,0.5)] scroll-mt-24"
  >
    <div
      aria-hidden
      className="pointer-events-none absolute -top-20 -right-20 h-48 w-48 rounded-full blur-3xl opacity-25 transition-opacity group-hover:opacity-40"
      style={{ background: accent }}
    />
    <div className="relative mb-5 flex items-start justify-between gap-3">
      <div className="flex items-center gap-3">
        <span
          className="flex h-10 w-10 items-center justify-center rounded-xl border border-white/10"
          style={{ background: `${accent}1a`, color: accent }}
          aria-hidden
        >
          {icon}
        </span>
        <div>
          <h4 className="text-base font-semibold tracking-tight text-slate-100">{title}</h4>
          <p className="text-[11px] uppercase tracking-[0.18em] text-slate-500">{subtitle}</p>
        </div>
      </div>
      <span
        className="rounded-full px-2.5 py-0.5 text-[10px] font-semibold uppercase tracking-wider"
        style={{ background: `${accent}1a`, color: accent }}
      >
        {points.length} pts
      </span>
    </div>

    {points.length === 0 ? (
      <div className="flex h-[300px] items-center justify-center text-center text-xs text-slate-500">
        {emptyHint}
      </div>
    ) : (
      <LineChartEcharts points={points} color={accent} />
    )}
  </motion.div>
));

// ════════════════════════════════════════════════════════════════════════════
// Explorador por Período — filtro de Ano (obrigatório) + Mês (opcional)
// ════════════════════════════════════════════════════════════════════════════



const PeriodExplorerChart = memo(({ validAsc, id }: { validAsc: IpeaItem[]; id?: string }) => {
  const [selectedYear, setSelectedYear] = useState<string>('');
  const [selectedMonth, setSelectedMonth] = useState<string>(''); // '' = ano inteiro

  // Anos disponíveis (ordenados desc — mais recente primeiro)
  const availableYears = useMemo(() => {
    const years = new Set<string>();
    for (const item of validAsc) years.add(item.data.substring(0, 4));
    return Array.from(years).sort((a, b) => b.localeCompare(a));
  }, [validAsc]);

  // Define ano padrão (mais recente) na primeira carga
  useEffect(() => {
    if (!selectedYear && availableYears.length > 0) {
      setSelectedYear(availableYears[0]);
    }
  }, [availableYears, selectedYear]);

  // Meses disponíveis dentro do ano selecionado
  const availableMonths = useMemo(() => {
    if (!selectedYear) return [] as { value: string; label: string }[];
    const monthsSet = new Set<string>();
    for (const item of validAsc) {
      if (item.data.substring(0, 4) === selectedYear) {
        monthsSet.add(item.data.substring(5, 7));
      }
    }
    return Array.from(monthsSet)
      .sort()
      .map((m) => ({ value: m, label: MONTHS_PT[parseInt(m, 10) - 1] ?? m }));
  }, [validAsc, selectedYear]);

  // Reseta o mês sempre que o ano muda
  useEffect(() => {
    setSelectedMonth('');
  }, [selectedYear]);

  // Pontos filtrados por ano (e opcionalmente por mês)
  const filteredPoints = useMemo<LinePoint[]>(() => {
    if (!selectedYear) return [];
    const filtered = validAsc.filter((item) => {
      if (item.data.substring(0, 4) !== selectedYear) return false;
      if (selectedMonth && item.data.substring(5, 7) !== selectedMonth) return false;
      return true;
    });
    return toLinePoints(filtered);
  }, [validAsc, selectedYear, selectedMonth]);

  // Estatísticas do período filtrado
  const periodStats = useMemo<PeriodStats | null>(() => {
    if (filteredPoints.length < 2) return null;
    const first = filteredPoints[0].value;
    const last = filteredPoints[filteredPoints.length - 1].value;
    const ret = ((last - first) / first) * 100;
    let hi = filteredPoints[0], lo = filteredPoints[0];
    for (const p of filteredPoints) {
      if (p.value > hi.value) hi = p;
      if (p.value < lo.value) lo = p;
    }
    return { count: filteredPoints.length, ret, hi, lo, first, last };
  }, [filteredPoints]);

  const periodLabel = selectedYear
    ? selectedMonth
      ? `${MONTHS_PT[parseInt(selectedMonth, 10) - 1]} ${selectedYear}`
      : `Ano ${selectedYear}`
    : '—';

  const ACCENT = '#a78bfa';

  return (
    <motion.div
      id={id}
      variants={itemVariants}
      className="group relative overflow-hidden rounded-2xl border border-white/10 bg-white/[0.02]
                 backdrop-blur-md p-6 shadow-[0_8px_40px_-15px_rgba(0,0,0,0.5)] scroll-mt-24"
    >
      <div
        aria-hidden
        className="pointer-events-none absolute -top-20 -right-20 h-48 w-48 rounded-full blur-3xl opacity-25 transition-opacity group-hover:opacity-40"
        style={{ background: ACCENT }}
      />

      {/* Cabeçalho + filtros */}
      <div className="relative mb-5 flex flex-wrap items-start justify-between gap-4">
        <div className="flex items-center gap-3">
          <span
            className="flex h-10 w-10 items-center justify-center rounded-xl border border-white/10"
            style={{ background: `${ACCENT}1a`, color: ACCENT }}
            aria-hidden
          >
            <Filter size={18} />
          </span>
          <div>
            <h4 className="text-base font-semibold tracking-tight text-slate-100">Explorador por Período</h4>
            <p className="text-[11px] uppercase tracking-[0.18em] text-slate-500">Filtre por ano e, opcionalmente, por mês</p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {/* Filtro de Ano */}
          <label className="flex items-center gap-1.5 text-[10px] uppercase tracking-wider text-slate-500">
            <span>Ano</span>
            <select
              value={selectedYear}
              onChange={(e) => setSelectedYear(e.target.value)}
              className="rounded-lg border border-white/10 bg-slate-900/70 px-3 py-1.5 text-xs font-medium text-slate-200 focus:outline-none focus:ring-2 focus:ring-violet-500/50 hover:border-white/20 transition-colors"
              aria-label="Filtrar por ano"
            >
              {availableYears.map((y) => (
                <option key={y} value={y}>{y}</option>
              ))}
            </select>
          </label>

          {/* Filtro de Mês */}
          <label className="flex items-center gap-1.5 text-[10px] uppercase tracking-wider text-slate-500">
            <span>Mês</span>
            <select
              value={selectedMonth}
              onChange={(e) => setSelectedMonth(e.target.value)}
              className="rounded-lg border border-white/10 bg-slate-900/70 px-3 py-1.5 text-xs font-medium text-slate-200 focus:outline-none focus:ring-2 focus:ring-violet-500/50 hover:border-white/20 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              aria-label="Filtrar por mês"
              disabled={!selectedYear || availableMonths.length === 0}
            >
              <option value="">Ano inteiro</option>
              {availableMonths.map((m) => (
                <option key={m.value} value={m.value}>{m.label}</option>
              ))}
            </select>
          </label>

          {/* Botão para voltar ao ano inteiro (só aparece quando mês está selecionado) */}
          {selectedMonth && (
            <button
              onClick={() => setSelectedMonth('')}
              className="rounded-lg border border-violet-500/30 bg-violet-500/10 px-3 py-1.5 text-xs font-semibold text-violet-200 hover:bg-violet-500/20 hover:text-white transition-colors focus:outline-none focus:ring-2 focus:ring-violet-500/50"
              aria-label="Voltar a ver o ano inteiro"
            >
              ← Ano inteiro
            </button>
          )}
        </div>
      </div>

      {/* Stats do período filtrado */}
      <div className="relative mb-4 flex flex-wrap items-center gap-2 text-xs">
        <span className="inline-flex items-center gap-1.5 rounded-md border border-white/5 bg-white/[0.03] px-2.5 py-1 font-mono">
          <span className="text-slate-500">Período:</span>
          <span className="text-slate-100">{periodLabel}</span>
        </span>
        {periodStats ? (
          <>
            <span className="inline-flex items-center gap-1.5 rounded-md border border-white/5 bg-white/[0.03] px-2.5 py-1 font-mono">
              <span className="text-slate-500">Pregões:</span>
              <span className="text-slate-100">{periodStats.count}</span>
            </span>
            <span className="inline-flex items-center gap-1.5 rounded-md border border-white/5 bg-white/[0.03] px-2.5 py-1 font-mono">
              <span className="text-slate-500">Variação:</span>
              <span className={periodStats.ret >= 0 ? 'text-emerald-300' : 'text-red-300'}>
                {fmtPctSigned(periodStats.ret)}
              </span>
            </span>
            <span className="inline-flex items-center gap-1.5 rounded-md border border-white/5 bg-white/[0.03] px-2.5 py-1 font-mono">
              <span className="text-slate-500">Máx:</span>
              <span className="text-slate-100">{formatPts(periodStats.hi.value)}</span>
              <span className="text-slate-600">·</span>
              <span className="text-slate-500">{fmtBRDate(periodStats.hi.date)}</span>
            </span>
            <span className="inline-flex items-center gap-1.5 rounded-md border border-white/5 bg-white/[0.03] px-2.5 py-1 font-mono">
              <span className="text-slate-500">Mín:</span>
              <span className="text-slate-100">{formatPts(periodStats.lo.value)}</span>
              <span className="text-slate-600">·</span>
              <span className="text-slate-500">{fmtBRDate(periodStats.lo.date)}</span>
            </span>
          </>
        ) : (
          <span className="rounded-md border border-white/5 bg-white/[0.03] px-2.5 py-1 font-mono text-slate-500">
            {filteredPoints.length === 0
              ? 'Sem dados neste recorte.'
              : `${filteredPoints.length} pregão(s) — insuficiente para métricas.`}
          </span>
        )}
      </div>

      {filteredPoints.length === 0 ? (
        <div className="flex h-[300px] items-center justify-center text-center text-xs text-slate-500">
          Sem dados válidos para o período selecionado.
        </div>
      ) : (
        <LineChartEcharts points={filteredPoints} color={ACCENT} />
      )}
    </motion.div>
  );
});

// ─── Tabela de últimos 5 fechamentos (container próprio) ───────────────────
const VariationPill = memo(({ variation }: { variation: number | null }) => {
  if (variation === null) {
    return (
      <span className="inline-flex items-center gap-1 rounded-md bg-slate-700/40 px-2 py-0.5 font-mono text-[11px] text-slate-400">
        <Minus size={10} aria-hidden /> —
      </span>
    );
  }
  const positive = variation >= 0;
  const cls = positive
    ? 'bg-emerald-500/10 text-emerald-300 border-emerald-500/20'
    : 'bg-red-500/10 text-red-300 border-red-500/20';
  const Icon = positive ? TrendingUp : TrendingDown;
  return (
    <span className={`inline-flex items-center gap-1 rounded-md border px-2 py-0.5 font-mono text-[11px] ${cls}`}>
      <Icon size={10} aria-hidden />
      {fmtPctSigned(variation)}
    </span>
  );
});

const RecentClosingsTable = memo(({ rows, id }: { rows: ClosingRow[]; id?: string }) => {
  const last5 = useMemo(() => [...rows].slice(-5).reverse(), [rows]);

  return (
    <motion.div
      id={id}
      variants={itemVariants}
      className="relative overflow-hidden rounded-2xl border border-white/10 bg-white/[0.02]
                 backdrop-blur-md shadow-[0_8px_40px_-15px_rgba(0,0,0,0.5)] scroll-mt-24"
    >
      <div className="flex items-center gap-3 border-b border-white/5 px-6 py-4">
        <span className="flex h-10 w-10 items-center justify-center rounded-xl border border-white/10 bg-indigo-500/10 text-indigo-300">
          <Calendar size={16} aria-hidden />
        </span>
        <div>
          <h4 className="text-base font-semibold tracking-tight text-slate-100">Últimos Fechamentos</h4>
          <p className="text-[11px] uppercase tracking-[0.18em] text-slate-500">5 pregões · variação D/D-1</p>
        </div>
      </div>

      <div className="overflow-x-auto px-2 pb-2">
        <table className="w-full border-collapse text-sm">
          <thead>
            <tr className="text-left text-[11px] uppercase tracking-wider text-slate-500">
              <th className="px-4 py-2 font-medium">Data</th>
              <th className="px-4 py-2 text-right font-medium">Pontos</th>
              <th className="px-4 py-2 text-right font-medium">Variação</th>
            </tr>
          </thead>
          <tbody>
            {last5.length === 0 ? (
              <tr>
                <td colSpan={3} className="px-4 py-6 text-center text-xs text-slate-500">
                  Sem dados de fechamento disponíveis.
                </td>
              </tr>
            ) : last5.map((row) => (
              <tr
                key={row.date}
                className="border-t border-white/5 transition-colors hover:bg-white/[0.03]"
              >
                <td className="px-4 py-2.5 font-mono text-slate-300">{fmtBRDate(row.date)}</td>
                <td className="px-4 py-2.5 text-right font-mono font-medium text-slate-100">
                  {formatPts(row.value)}
                </td>
                <td className="px-4 py-2.5 text-right">
                  <VariationPill variation={row.variation} />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </motion.div>
  );
});

// ─── Painel de Insights Educacionais (100% dinâmico) ───────────────────────
const InsightItem = memo(({ label, value, tone }: { label: string; value: string; tone: 'pos' | 'neg' | 'neutral' }) => {
  const toneCls =
    tone === 'pos' ? 'text-emerald-300'
    : tone === 'neg' ? 'text-red-300'
    : 'text-slate-200';
  return (
    <div className="flex flex-col gap-0.5 rounded-lg border border-white/5 bg-white/[0.02] px-3 py-2">
      <span className="text-[10px] uppercase tracking-wider text-slate-500">{label}</span>
      <span className={`font-mono text-sm font-semibold ${toneCls}`}>{value}</span>
    </div>
  );
});

const EducationalInsightsPanel = memo(({ metrics, id }: { metrics: IbovespaMetrics; id?: string }) => {
  const {
    fiveYearReturn, sixMonthReturn,
    fiveYearHigh, fiveYearLow,
    avgDailyAbsVar6m, positiveDays6m, negativeDays6m,
    last5Trend, last5NetPct,
  } = metrics;

  // Observações geradas dinamicamente por thresholds — nada é escrito à mão.
  const observations: string[] = [];

  if (fiveYearReturn !== null) {
    observations.push(`No recorte de 5 anos, o índice apresenta ${describeFiveYearReturn(fiveYearReturn)}.`);
  }
  if (sixMonthReturn !== null) {
    observations.push(`Nos últimos 6 meses, ${describeSixMonthReturn(sixMonthReturn)}.`);
  }
  if (fiveYearHigh && fiveYearLow) {
    observations.push(`${describeAmplitude(fiveYearHigh, fiveYearLow)}, ilustrando os ciclos clássicos de volatilidade da bolsa brasileira.`);
  }
  if (avgDailyAbsVar6m !== null) {
    observations.push(`${describeVolatility(avgDailyAbsVar6m, positiveDays6m, negativeDays6m)}.`);
  }
  if (last5Trend !== null && last5NetPct !== null) {
    observations.push(`${describeLast5Trend(last5Trend, last5NetPct)}.`);
  }
  observations.push(`${describeSelicCorrelation(sixMonthReturn, fiveYearReturn)}.`);

  return (
    <motion.div
      id={id}
      variants={itemVariants}
      className="relative overflow-hidden rounded-2xl border border-white/10
                 bg-gradient-to-br from-indigo-950/40 via-violet-950/20 to-slate-950/40
                 backdrop-blur-md p-6 shadow-[0_8px_40px_-15px_rgba(0,0,0,0.5)] scroll-mt-24"
    >
      <div className="mb-5 flex items-center gap-3">
        <span className="flex h-10 w-10 items-center justify-center rounded-xl border border-indigo-400/30 bg-indigo-500/10 text-indigo-300">
          <GraduationCap size={16} aria-hidden />
        </span>
        <div>
          <h4 className="text-base font-semibold tracking-tight text-slate-100">Insights Educacionais</h4>
          <p className="text-[11px] uppercase tracking-[0.18em] text-slate-500">Leitura dinâmica dos dados · sem recomendação</p>
        </div>
      </div>

      <div className="mb-5 grid grid-cols-2 gap-2 sm:grid-cols-4">
        <InsightItem
          label="Variação 5 anos"
          value={fiveYearReturn === null ? '—' : fmtPctSigned(fiveYearReturn)}
          tone={fiveYearReturn === null ? 'neutral' : fiveYearReturn >= 0 ? 'pos' : 'neg'}
        />
        <InsightItem
          label="Variação 6 meses"
          value={sixMonthReturn === null ? '—' : fmtPctSigned(sixMonthReturn)}
          tone={sixMonthReturn === null ? 'neutral' : sixMonthReturn >= 0 ? 'pos' : 'neg'}
        />
        <InsightItem
          label="Máxima 5 anos"
          value={fiveYearHigh ? `${formatPts(fiveYearHigh.value)}` : '—'}
          tone="neutral"
        />
        <InsightItem
          label="Mínima 5 anos"
          value={fiveYearLow ? `${formatPts(fiveYearLow.value)}` : '—'}
          tone="neutral"
        />
      </div>

      <ul className="flex flex-col gap-3">
        {observations.map((o, idx) => (
          <li key={idx} className="flex gap-3 text-sm leading-relaxed text-slate-300">
            <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-indigo-400" aria-hidden />
            <span>{o}</span>
          </li>
        ))}
      </ul>

      <div className="mt-5 flex items-start gap-3 rounded-lg border border-amber-500/20 bg-amber-500/5 px-4 py-3">
        <AlertTriangle size={16} className="mt-0.5 shrink-0 text-amber-400" aria-hidden />
        <p className="text-xs leading-relaxed text-amber-200/80">
          <strong className="font-semibold text-amber-200">Aviso educacional:</strong> o conteúdo
          acima é estritamente didático, derivado da leitura visual da série, e
          <strong> não constitui recomendação de investimento</strong>. Não há análise
          fundamentalista, projeção ou orientação de alocação. Decisões financeiras são de
          responsabilidade individual e exigem profissional certificado.
        </p>
      </div>
    </motion.div>
  );
});

// ─── Main Page ──────────────────────────────────────────────────────────────
export default function EconomiaPage() {
  const { data: ibovData, isLoading: lIbov, error: eIbov, refetch: rIbov } = useIbovespa();
  const { data: dollar,   isLoading: l0,    error: e0,    refetch: r0 } = useDollarPtax();
  const { data: selic,    isLoading: l1,    error: e1,    refetch: r1 } = useSelic();
  const { data: cdi,      isLoading: l2,    error: e2,    refetch: r2 } = useCdiRate();
  const { data: ipca,     isLoading: l3,    error: e3,    refetch: r3 } = useIpca();

  // Processamento do Ibovespa para pegar o último fechamento válido (geralmente D-1)
  const ibovespaLatest = useMemo(() => {
    if (!ibovData || ibovData.length === 0) return null;
    const rawData = ibovData[0].dados;
    if (!rawData || rawData.length === 0) return null;

    // Remove valores nulos e ordena da data mais recente para a mais antiga
    const validData = rawData
      .filter((item) => item.valor !== null)
      .sort((a, b) => b.data.localeCompare(a.data));

    if (validData.length === 0) return null;

    const latest = validData[0];
    const previous = validData.length > 1 ? validData[1] : null;

    // Calcula variação diária se houver dado do pregão anterior
    let variation = null;
    if (previous && previous.valor) {
      
      variation = ((latest.valor - previous.valor) / previous.valor) * 100;
    }

    // Formata a data ISO para DD/MM/YYYY
    const dateParts = latest.data.substring(0, 10).split('-');
    const formattedDate = `${dateParts[2]}/${dateParts[1]}/${dateParts[0]}`;

    return {
      value: latest.valor,
      date: formattedDate,
      variation
    };
  }, [ibovData]);

  // Métricas agregadas para os containers do dashboard (gráficos + tabela + insights)
  const ibovMetrics = useMemo(() => computeMetrics(ibovData), [ibovData]);

  return (
    <motion.section
      className="flex flex-col gap-8 max-w-5xl mx-auto py-6"
      variants={containerVariants}
      initial="hidden"
      animate="show"
    >
      <motion.div variants={itemVariants}>
        <h1 className="text-3xl sm:text-4xl font-semibold tracking-tight text-white drop-shadow-[0_2px_12px_rgba(0,0,0,0.5)]">
          Indicadores <span className="text-[#FFDF00]">Econômicos</span>
        </h1>
        <p className="text-slate-400 text-sm mt-2 max-w-xl">
          Dados oficiais do Banco Central do Brasil e da B3, atualizados diariamente.
        </p>
      </motion.div>

      {/* ── Navegação Rápida (sticky, responsiva, com seção ativa) ── */}
      <QuickNav items={NAV_ITEMS} />

      {/* ── Ibovespa (Fechamento D-1) — card original, sem os gráficos dentro ── */}
      <IndicatorCard
        id="sec-ibovespa"
        imageKey="ibovespa"
        gradient="from-indigo-900 to-violet-800"
        icon={<Activity size={18} />}
        title="Ibovespa"
        badge="B3 · IPEA"
        isLoading={lIbov}
        error={eIbov}
        refetch={rIbov}
        description={
          'Principal índice de ações da bolsa de valores brasileira (B3). ' +
          'Reflete o desempenho médio das cotações das empresas mais negociadas e representativas do mercado. ' +
          'Os dados exibidos referem-se ao último fechamento de mercado consolidado.'
        }
      >
        {ibovespaLatest && (
          <div className="flex flex-col gap-2">
            <p className="text-5xl font-bold text-indigo-400 tracking-tight drop-shadow-[0_2px_10px_rgba(129,140,248,0.3)]">
              {formatPts(ibovespaLatest.value)} <span className="text-2xl text-indigo-400/50">pts</span>
            </p>
            <div className="flex flex-col mt-2">
              {ibovespaLatest.variation !== null && (
                <DataRow
                  label="Variação Diária (D/D-1)"
                  value={`${ibovespaLatest.variation > 0 ? '+' : ''}${ibovespaLatest.variation.toFixed(2)}%`}
                  valueClass={ibovespaLatest.variation >= 0 ? "text-emerald-400" : "text-red-400"}
                />
              )}
              <DataRow label="Data do Fechamento" value={ibovespaLatest.date} />
            </div>
          </div>
        )}
      </IndicatorCard>

      {/* ══ Dashboard Ibovespa — containers independentes, fora do card ══ */}
      {ibovMetrics && (
        <>
          <ChartPanel
            id="sec-hist-5y"
            title="Histórico de 5 Anos"
            subtitle="Fechamento Ibovespa · longo prazo"
            icon={<Activity size={18} />}
            accent="#c084fc"
            points={ibovMetrics.fiveYearPoints}
            emptyHint="Sem dados válidos no intervalo de 5 anos."
          />

          <ChartPanel
            id="sec-hist-6m"
            title="Recente — 6 Meses"
            subtitle="Volatilidade e tendência de curto prazo"
            icon={<Sparkles size={18} />}
            accent="#38bdf8"
            points={ibovMetrics.sixMonthPoints}
            emptyHint="Sem dados válidos nos últimos 6 meses."
          />

          {/* Explorador por Período — Ano + Mês (opcional) */}
          <PeriodExplorerChart id="sec-explorer" validAsc={ibovMetrics.validAsc} />

          <RecentClosingsTable id="sec-closings" rows={ibovMetrics.closings} />

          <EducationalInsightsPanel id="sec-insights" metrics={ibovMetrics} />
        </>
      )}

      {/* ── Dólar PTAX ── */}
      <IndicatorCard
        id="sec-dollar"
        imageKey="dollar"
        gradient="from-green-900 to-emerald-700"
        icon={<DollarSign size={18} />}
        title="Dólar PTAX"
        badge="Banco Central"
        isLoading={l0}
        error={e0}
        refetch={r0}
        description={
          'Cotação oficial calculada pelo Banco Central com base nas operações do ' +
          'mercado interbancário ao longo do dia. É a referência para contratos, ' +
          'importações, exportações e o cálculo de IOF em remessas ao exterior.'
        }
      >
        {dollar && (
          <div className="flex flex-col gap-2">
            <p className="text-5xl font-bold text-green-400 tracking-tight drop-shadow-[0_2px_10px_rgba(74,222,128,0.3)]">
              {brl(dollar.value)}
            </p>
            <p className="text-slate-300 text-xs mt-1 font-mono">Referência: {dollar.date}</p>
          </div>
        )}
      </IndicatorCard>

      {/* ── Selic ── */}
      <IndicatorCard
        id="sec-selic"
        imageKey="selic"
        gradient="from-red-900 to-rose-700"
        icon={<TrendingUp size={18} />}
        title="Taxa Selic"
        badge="Banco Central · COPOM"
        isLoading={l1}
        error={e1}
        refetch={r1}
        description={
          'Taxa básica de juros da economia brasileira, definida pelo COPOM a cada 45 ' +
          'dias. Serve de piso para todos os juros do país e influencia diretamente o ' +
          'crédito, os investimentos em renda fixa e o controle da inflação.'
        }
      >
        {selic && (
          <div className="flex flex-col gap-3">
            <p className="text-5xl font-bold text-red-400 tracking-tight drop-shadow-[0_2px_10px_rgba(248,113,113,0.3)]">
              {pct(selic.currentRate)}
            </p>
            <div className="flex flex-col mt-2">
              <DataRow label="Acumulado no mês"  value={pct(selic.accumulatedMonth)} />
              <DataRow label="Acumulado no ano"  value={pct(selic.accumulatedYear)} />
              <DataRow label="Últimos 12 meses"  value={pct(selic.last12MonthsCompound)} />
            </div>
          </div>
        )}
      </IndicatorCard>

      {/* ── CDI ── */}
      <IndicatorCard
        id="sec-cdi"
        imageKey="cdi"
        gradient="from-blue-900 to-sky-700"
        icon={<BarChart3 size={18} />}
        title="CDI"
        badge="Banco Central"
        isLoading={l2}
        error={e2}
        refetch={r2}
        description={
          'Certificado de Depósito Interbancário — taxa média dos empréstimos de ' +
          'curtíssimo prazo entre bancos. É o principal benchmark da renda fixa: CDBs, ' +
          'fundos DI e LCIs costumam render um percentual do CDI.'
        }
      >
        {cdi && (
          <div className="flex flex-col gap-2">
            <p className="text-5xl font-bold text-blue-400 tracking-tight drop-shadow-[0_2px_10px_rgba(96,165,250,0.3)]">
              {pct(cdi.annualRate)}
            </p>
            <div className="flex flex-col mt-2">
              <DataRow label="Taxa diária" value={`${cdi.dailyRate.toFixed(4)}%`} />
              <DataRow label="Referência"  value={cdi.date} />
            </div>
          </div>
        )}
      </IndicatorCard>

      {/* ── IPCA ── */}
      <IndicatorCard
        id="sec-ipca"
        imageKey="ipca"
        gradient="from-slate-800 to-slate-600"
        icon={<Percent size={18} />}
        title="IPCA"
        badge="Banco Central · IBGE"
        isLoading={l3}
        error={e3}
        refetch={r3}
        description={
          'Índice Nacional de Preços ao Consumidor Amplo — o indicador oficial de ' +
          'inflação do Brasil, apurado pelo IBGE. É a meta perseguida pelo Banco ' +
          'Central: quando sobe demais, o COPOM eleva a Selic para conter o consumo.'
        }
      >
        {ipca && (
          <div className="flex flex-col gap-3">
            <p className="text-5xl font-bold text-slate-100 tracking-tight drop-shadow-[0_2px_10px_rgba(241,245,249,0.2)]">
              {pct(ipca.currentMonth)}
            </p>
            <div className="flex flex-col mt-2">
              <DataRow label="Acumulado no ano"     value={pct(ipca.accumulatedYear)} />
              <DataRow label="Soma 12 meses"        value={pct(ipca.last12MonthsSum)} />
              <DataRow label="Composto 12 meses"    value={pct(ipca.last12MonthsCompound)} />
            </div>
          </div>
        )}
      </IndicatorCard>

    </motion.section>
  );
}