// API: World Bank
// Endpoints consumidos:
//   GET /worldbank          → useCurrentPibBrazil()
//   GET /worldbank/{year}   → usePibBrazilByYear(year)
//   GET /worldbank/series   → usePibSeries()

import { useState, useMemo, type ChangeEvent, type ReactNode } from 'react';
import { motion } from 'motion/react';
import {
  LoaderCircle,
  Landmark,
  CalendarSearch,
  LineChart as LineChartIcon,
  TrendingUp,
  TrendingDown,
  Minus,
  Map,
  AlertTriangle,
  Database,
  ArrowUpRight,
} from 'lucide-react';
import { useCurrentPibBrazil, usePibBrazilByYear, usePibSeries } from '../../../hooks/UseWorldBank';
import { usePibPorEstado } from '../../../hooks/UseSidra';
import { LineChartEcharts } from '../../../components/charts/LineChartEcharts';
import { BarChartEcharts } from '../../../components/charts/BarChartEcharts';
import { AnimatedNumber } from '../../../components/AnimatedNumber';
import { container, item } from '../../../lib/motion/presets';

// ============================================================================
// Brazilian palette tokens (kept inline so no design-system file is touched)
// ============================================================================
//  BR_GREEN  = #009C3B (flag green, dialed slightly toward emerald)
//  BR_YELLOW = #FFDF00 (flag yellow, used sparingly as highlight)
//  BR_BLUE   = #002776 (flag blue, used for depth / institutional cues)

// ============================================================================
// 1. IMAGENS
// ============================================================================
const PIB_IMAGES = import.meta.glob('../../../assets/pib/*.{jpeg,jpg,png,webp,avif}', {
  eager: true,
  import: 'default',
}) as Record<string, string>;

function findPibImage(term: string): string | undefined {
  const match = Object.entries(PIB_IMAGES).find(([path]) => path.toLowerCase().includes(term));
  return match?.[1];
}

// ============================================================================
// 2. HELPERS
// ============================================================================
interface SectionCardProps {
  title: string;
  subtitle?: string;
  icon: ReactNode;
  badge?: ReactNode;
  children: ReactNode;
  className?: string;
  contentClassName?: string;
}

function SectionCard({
  title, subtitle, icon, badge, children, className = '', contentClassName = '',
}: SectionCardProps) {
  return (
    <motion.section
      whileHover={{ y: -2 }}
      transition={{ type: 'spring', stiffness: 220, damping: 22 }}
      className={`group relative overflow-hidden rounded-2xl border border-slate-800/80 bg-slate-950/60 backdrop-blur-sm shadow-[0_1px_0_0_rgba(255,255,255,0.04)_inset,0_20px_40px_-24px_rgba(0,0,0,0.6)] ${className}`}
    >
      <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-emerald-400/30 to-transparent" />
      <header className="flex items-start justify-between gap-4 px-6 pt-5 pb-3">
        <div className="flex items-center gap-3 min-w-0">
          <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-slate-900 border border-slate-800 text-emerald-400 shrink-0">
            {icon}
          </span>
          <div className="min-w-0">
            <h2 className="text-[11px] font-semibold uppercase tracking-[0.14em] text-slate-400">{title}</h2>
            {subtitle && <p className="mt-0.5 text-xs text-slate-500 truncate">{subtitle}</p>}
          </div>
        </div>
        {badge}
      </header>
      <div className={`px-6 pb-6 ${contentClassName}`}>{children}</div>
    </motion.section>
  );
}

function LoadingRow({ label = 'Carregando…' }: { label?: string }) {
  return (
    <div role="status" aria-live="polite" className="flex items-center gap-2 text-sm text-slate-400">
      <LoaderCircle size={15} className="animate-spin text-emerald-400" />
      <span>{label}</span>
    </div>
  );
}

function StatePanel({ tone, icon, title, description }: {
  tone: 'error' | 'empty'; icon: ReactNode; title: string; description?: string;
}) {
  const toneClass = tone === 'error'
    ? 'border-red-900/50 bg-red-950/20 text-red-300'
    : 'border-slate-800 bg-slate-900/40 text-slate-400';
  return (
    <div role={tone === 'error' ? 'alert' : 'status'} className={`flex items-start gap-3 rounded-lg border px-4 py-3 ${toneClass}`}>
      <span className="mt-0.5 shrink-0 opacity-80">{icon}</span>
      <div className="min-w-0">
        <p className="text-sm font-medium">{title}</p>
        {description && <p className="mt-0.5 text-xs opacity-80">{description}</p>}
      </div>
    </div>
  );
}

// ============================================================================
// FORMATAÇÃO
// ============================================================================
const compactBrl = (v: number) => {
  const abs = Math.abs(v);
  if (abs >= 1e12) return `R$ ${(v / 1e12).toLocaleString('pt-BR', { maximumFractionDigits: 2 })} tri`;
  if (abs >= 1e9)  return `R$ ${(v / 1e9 ).toLocaleString('pt-BR', { maximumFractionDigits: 2 })} bi`;
  if (abs >= 1e6)  return `R$ ${(v / 1e6 ).toLocaleString('pt-BR', { maximumFractionDigits: 2 })} mi`;
  return v.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL', maximumFractionDigits: 0 });
};
const fullBrl = (v: number) =>
  v.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL', maximumFractionDigits: 0 });

// ============================================================================
// PÁGINA
// ============================================================================
export default function PibPage() {
  const [year, setYear] = useState<number>(2020);
  const { data: currentPib, isLoading: isCurrentPibLoading, error: currentPibError } = useCurrentPibBrazil();
  const { data: pibByYear,  isLoading: isPibByYearLoading,  error: pibByYearError  } = usePibBrazilByYear(year);
  const { data: series,     isLoading: isSeriesLoading,     error: seriesError     } = usePibSeries();
  const { data: pibEstados, isLoading: isEstadosLoading,    error: estadosError    } = usePibPorEstado();

  const stats = useMemo(() => {
    if (!series || series.length < 2) return null;
    const points = [...series]
      .map((p) => ({ date: String(p.year), value: Number(p.value) }))
      .filter((p) => p.value > 0 && parseInt(p.date) >= 1995)
      .sort((a, b) => a.date.localeCompare(b.date));
    if (points.length < 2) return null;
    const first = points[0];
    const last  = points[points.length - 1];
    const change = last.value - first.value;
    const pct = (change / first.value) * 100;
    return { points, first, last, change, pct };
  }, [series]);

  const statBlocks = useMemo(() => {
    if (!stats) return [];
    const up = stats.pct > 0;
    const down = stats.pct < 0;
    const Icon = up ? TrendingUp : down ? TrendingDown : Minus;
    const colorClass = up ? 'text-emerald-400' : down ? 'text-red-400' : 'text-slate-400';
    const bgClass = up
      ? 'bg-emerald-500/[0.06] border-emerald-900/50'
      : down ? 'bg-red-500/[0.06] border-red-900/50'
      : 'bg-slate-900/60 border-slate-800';
    return [
      { label: `Início · ${stats.first.date}`, value: compactBrl(stats.first.value), isVar: false },
      { label: `Atual · ${stats.last.date}`,   value: compactBrl(stats.last.value),  isVar: false },
      {
        label: 'Variação no período',
        value: `${up ? '+' : ''}${stats.pct.toLocaleString('pt-BR', { maximumFractionDigits: 1 })}%`,
        isVar: true, icon: <Icon size={12} className={colorClass} />, colorClass, bgClass,
      },
    ];
  }, [stats]);

  const handleYearChange = (e: ChangeEvent<HTMLInputElement>) => {
    if (e.target.value === '') return setYear(2020);
    const newYear = parseInt(e.target.value, 10);
    if (!isNaN(newYear)) setYear(newYear);
  };

  const bannerImage = findPibImage('banner') || Object.values(PIB_IMAGES)[0];

  return (
    <motion.div className="flex flex-col gap-6" variants={container} initial="hidden" animate="show">

      {/* ══════════════════════════════════════════════════════════════════
          HERO — image-forward, BR identity, FT/Bloomberg masthead feel
         ══════════════════════════════════════════════════════════════════ */}
      <motion.header
        variants={item}
        className="relative overflow-hidden rounded-2xl border border-slate-800 min-h-[260px] flex items-end"
      >
        {bannerImage ? (
          <>
            <img
              src={bannerImage}
              alt="Brasil — referência visual institucional"
              className="absolute inset-0 w-full h-full object-cover object-center scale-105 transition-transform duration-[1400ms] ease-out group-hover:scale-110"
              style={{ filter: 'brightness(0.92) contrast(1.05) saturate(1.05)' }}
            />
            {/* refined overlays — image stays vivid, copy stays readable */}
            <div className="absolute inset-0 bg-gradient-to-r from-slate-950/90 via-slate-950/55 to-transparent" />
            <div className="absolute inset-0 bg-gradient-to-t from-slate-950/85 via-slate-950/10 to-transparent" />
            {/* soft BR-blue color wash for cohesion */}
            <div
              className="absolute inset-0 mix-blend-multiply opacity-40"
              style={{ background: 'radial-gradient(120% 80% at 0% 100%, #002776 0%, transparent 55%)' }}
            />
            {/* fine grid texture for institutional feel */}
            <div
              className="absolute inset-0 opacity-[0.06] pointer-events-none"
              style={{
                backgroundImage:
                  'linear-gradient(to right, #ffffff 1px, transparent 1px), linear-gradient(to bottom, #ffffff 1px, transparent 1px)',
                backgroundSize: '40px 40px',
              }}
            />
          </>
        ) : (
          <div className="absolute inset-0 bg-slate-950" />
        )}

        {/* tricolor rail — green / yellow / blue */}
        <div className="absolute left-0 top-0 bottom-0 w-[3px] bg-gradient-to-b from-[#009C3B] via-[#FFDF00] to-[#002776]" />

        <div className="relative z-10 p-6 sm:p-10 w-full">
          <div className="flex flex-wrap items-center gap-2 mb-4">
            <span className="inline-flex items-center gap-1.5 rounded-full border border-emerald-400/30 bg-emerald-500/10 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.18em] text-emerald-300 backdrop-blur-sm">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse" />
              World Bank · Live
            </span>
            <span className="inline-flex items-center gap-1.5 rounded-full border border-yellow-400/30 bg-yellow-400/10 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.18em] text-yellow-200 backdrop-blur-sm">
              IBGE · SIDRA
            </span>
            <span className="inline-flex items-center gap-1.5 rounded-full border border-white/15 bg-white/5 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.18em] text-slate-200 backdrop-blur-sm">
              República Federativa do Brasil
            </span>
          </div>

          <h1 className="text-3xl sm:text-5xl font-semibold tracking-tight text-white drop-shadow-[0_2px_12px_rgba(0,0,0,0.5)]">
            PIB do <span className="text-[#FFDF00]">Brasil</span>
          </h1>
          <p className="mt-3 max-w-2xl text-sm sm:text-base text-slate-200/90 leading-relaxed">
            Produto Interno Bruto a preços correntes (R$). Série histórica, recorte anual e
            distribuição por unidade federativa — inteligência econômica em tempo real.
          </p>
        </div>
      </motion.header>

      {/* ══════════════════════════════════════════════════════════════════
          KPI ROW
         ══════════════════════════════════════════════════════════════════ */}
      <motion.div variants={item} className="grid grid-cols-1 lg:grid-cols-5 gap-4">

        {/* ─────────────────────────────────────────────────────────────
            ✦ CARD 1 — "PIB mais recente"
            PROPOSAL A (default): hero KPI · BR-blue depth · gold accent
            ───────────────────────────────────────────────────────────── */}
        <motion.section
          whileHover={{ y: -2 }}
          transition={{ type: 'spring', stiffness: 220, damping: 22 }}
          className="lg:col-span-3 relative overflow-hidden rounded-2xl border border-slate-800 shadow-[0_30px_60px_-30px_rgba(0,39,118,0.6)]"
          style={{
            background:
              'linear-gradient(135deg, #050b1f 0%, #0a1430 35%, #001b52 100%)',
          }}
        >
          {/* tricolor top rail */}
          <div className="absolute inset-x-0 top-0 h-[2px] bg-gradient-to-r from-[#009C3B] via-[#FFDF00] to-[#002776]" />
          {/* ambient glow */}
          <div
            className="absolute -top-24 -right-24 w-96 h-96 rounded-full opacity-30 blur-3xl"
            style={{ background: 'radial-gradient(circle, #009C3B 0%, transparent 70%)' }}
          />
          {/* faint grid */}
          <div
            className="absolute inset-0 opacity-[0.05] pointer-events-none"
            style={{
              backgroundImage:
                'linear-gradient(to right, #ffffff 1px, transparent 1px), linear-gradient(to bottom, #ffffff 1px, transparent 1px)',
              backgroundSize: '32px 32px',
            }}
          />

          <div className="relative p-6 sm:p-8">
            <header className="flex items-start justify-between gap-4 mb-6">
              <div className="flex items-center gap-3">
                <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-white/5 border border-white/10 text-[#FFDF00] backdrop-blur-sm">
                  <Landmark size={18} />
                </span>
                <div>
                  <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-slate-400">
                    Indicador principal
                  </p>
                  <h2 className="text-sm font-medium text-white mt-0.5">PIB mais recente</h2>
                </div>
              </div>
              {currentPib && (
                <span className="inline-flex items-center gap-1.5 rounded-md border border-[#FFDF00]/30 bg-[#FFDF00]/10 px-2.5 py-1 text-[10px] font-mono uppercase tracking-wider text-[#FFDF00]">
                  Ref · {currentPib.year}
                </span>
              )}
            </header>

            {isCurrentPibLoading ? (
              <LoadingRow />
            ) : currentPibError ? (
              <StatePanel
                tone="error"
                icon={<AlertTriangle size={16} />}
                title="Erro ao carregar o PIB atual"
                description="Não foi possível obter o último valor consolidado."
              />
            ) : (
              currentPib && (
                <>
                  <p className="text-5xl sm:text-6xl font-semibold tracking-tight text-white tabular-nums leading-none">
                    <AnimatedNumber value={currentPib.value} format={compactBrl} />
                  </p>
                  <div className="mt-4 flex flex-wrap items-center gap-x-4 gap-y-2">
                    <p className="text-sm text-slate-300/80 font-mono tabular-nums">
                      {fullBrl(currentPib.value)}
                    </p>
                    <span className="inline-flex items-center gap-1 text-xs text-emerald-300">
                      <ArrowUpRight size={12} />
                      Produto Interno Bruto · preços correntes
                    </span>
                  </div>
                  {/* mini tricolor footer accent */}
                  <div className="mt-6 flex items-center gap-1">
                    <span className="h-0.5 w-8 rounded-full bg-[#009C3B]" />
                    <span className="h-0.5 w-4 rounded-full bg-[#FFDF00]" />
                    <span className="h-0.5 w-2 rounded-full bg-[#002776]" />
                    <span className="ml-2 text-[10px] uppercase tracking-[0.2em] text-slate-500">
                      Fonte · World Bank
                    </span>
                  </div>
                </>
              )
            )}
          </div>
        </motion.section>

        {/* ─────────────────────────────────────────────────────────────
            ✦ CARD 2 — "Consultar por ano"
            PROPOSAL A (default): emerald-tinted institutional console
            ───────────────────────────────────────────────────────────── */}
        <motion.section
          whileHover={{ y: -2 }}
          transition={{ type: 'spring', stiffness: 220, damping: 22 }}
          className="lg:col-span-2 relative overflow-hidden rounded-2xl border border-emerald-900/40"
          style={{
            background:
              'linear-gradient(160deg, #04140c 0%, #061a14 50%, #0a2e1f 100%)',
          }}
        >
          <div className="absolute inset-x-0 top-0 h-[2px] bg-gradient-to-r from-[#009C3B] via-[#FFDF00]/60 to-transparent" />
          <div
            className="absolute -bottom-20 -left-20 w-64 h-64 rounded-full opacity-25 blur-3xl"
            style={{ background: 'radial-gradient(circle, #009C3B 0%, transparent 70%)' }}
          />

          <div className="relative p-6 sm:p-8 flex flex-col gap-5">
            <header className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-300">
                  <CalendarSearch size={18} />
                </span>
                <div>
                  <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-emerald-300/70">
                    Recorte temporal
                  </p>
                  <h2 className="text-sm font-medium text-white mt-0.5">Consultar por ano</h2>
                </div>
              </div>
              {pibByYear && (
                <span className="rounded-md border border-emerald-500/30 bg-emerald-500/10 px-2 py-1 text-[10px] font-mono uppercase tracking-wider text-emerald-200">
                  {pibByYear.year}
                </span>
              )}
            </header>

            <div>
              <label htmlFor="pib-year" className="block text-[10px] font-semibold uppercase tracking-[0.16em] text-slate-400 mb-1.5">
                Ano de referência
              </label>
              <div className="flex items-center gap-2">
                <div className="relative flex-1 max-w-[160px]">
                  <input
                    id="pib-year"
                    type="number"
                    value={year}
                    onChange={handleYearChange}
                    placeholder="ex: 2020"
                    className="w-full h-11 px-3 pr-9 rounded-lg bg-slate-950/70 text-white placeholder:text-slate-600 border border-emerald-900/50 outline-none focus:ring-2 focus:ring-[#FFDF00]/40 focus:border-[#FFDF00]/50 transition-all text-base font-mono tabular-nums"
                  />
                  <CalendarSearch size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 pointer-events-none" />
                </div>
                {isPibByYearLoading && (
                  <LoaderCircle size={18} className="animate-spin text-emerald-400" aria-hidden />
                )}
              </div>
            </div>

            {pibByYearError ? (
              <StatePanel tone="error" icon={<AlertTriangle size={16} />} title={`Erro ao carregar o PIB para ${year}`} />
            ) : pibByYear ? (
              <div className="pt-2 border-t border-emerald-900/30">
                <p className="text-3xl sm:text-4xl font-semibold tracking-tight text-emerald-300 tabular-nums leading-none">
                  <AnimatedNumber value={pibByYear.value} format={compactBrl} />
                </p>
                <p className="mt-2 text-xs text-slate-400 font-mono tabular-nums">
                  {fullBrl(pibByYear.value)}
                </p>
              </div>
            ) : (
              !isPibByYearLoading && (
                <StatePanel tone="empty" icon={<Database size={16} />} title={`Sem dados para o ano ${year}`} />
              )
            )}
          </div>
        </motion.section>
      </motion.div>

      {/* ══════════════════════════════════════════════════════════════════
          SÉRIE HISTÓRICA
         ══════════════════════════════════════════════════════════════════ */}
      <motion.div variants={item}>
        <SectionCard
          title="Evolução histórica"
          subtitle="Série anual (1995 → atual)"
          icon={<LineChartIcon size={16} />}
          badge={stats && (
            <span className="hidden sm:inline-flex rounded-md border border-slate-800 bg-slate-900/80 px-2 py-1 text-[10px] font-mono uppercase tracking-wider text-slate-300">
              {stats.points.length} pontos
            </span>
          )}
          contentClassName="flex flex-col gap-5"
        >
          {isSeriesLoading ? (
            <LoadingRow label="Carregando série…" />
          ) : seriesError ? (
            <StatePanel tone="error" icon={<AlertTriangle size={16} />} title="Erro ao carregar a série histórica" />
          ) : stats ? (
            <>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                {statBlocks.map((block, idx) => (
                  <div
                    key={idx}
                    className={`rounded-lg border px-4 py-3 ${block.isVar ? block.bgClass : 'bg-slate-900/60 border-slate-800'}`}
                  >
                    <p className="text-[10px] uppercase tracking-[0.14em] text-slate-500 flex items-center gap-1.5">
                      {block.icon} {block.label}
                    </p>
                    <p className={`mt-1.5 text-xl font-semibold tabular-nums ${block.isVar ? block.colorClass : 'text-white'}`}>
                      {block.value}
                    </p>
                  </div>
                ))}
              </div>
              <div className="rounded-lg border border-slate-800/70 bg-slate-950/60 p-3">
                <LineChartEcharts points={stats.points} color="#009C3B" />
              </div>
            </>
          ) : (
            <StatePanel tone="empty" icon={<Database size={16} />} title="Série sem pontos suficientes para o gráfico" />
          )}
        </SectionCard>
      </motion.div>

      {/* ══════════════════════════════════════════════════════════════════
          PIB POR ESTADO
         ══════════════════════════════════════════════════════════════════ */}
      <motion.div variants={item}>
        <SectionCard
          title="PIB por estado"
          subtitle="Distribuição por unidade federativa · IBGE/SIDRA"
          icon={<Map size={16} />}
          badge={pibEstados && pibEstados.length > 0 && (
            <span className="rounded-md border border-slate-800 bg-slate-900/80 px-2 py-1 text-[10px] font-mono uppercase tracking-wider text-slate-300">
              Ref · {pibEstados[0].year}
            </span>
          )}
          contentClassName="flex flex-col gap-3"
        >
          {isEstadosLoading ? (
            <LoadingRow label="Carregando PIB…" />
          ) : estadosError ? (
            <StatePanel tone="error" icon={<AlertTriangle size={16} />} title="Erro ao carregar o PIB por estado" />
          ) : pibEstados && pibEstados.length > 0 ? (
            <div className="rounded-lg border border-slate-800/70 bg-slate-950/60 p-3">
              <BarChartEcharts
                items={pibEstados.map((e) => ({ label: e.uf, value: e.value }))}
                color="#009C3B"
                valueFormatter={compactBrl}
              />
            </div>
          ) : (
            <StatePanel tone="empty" icon={<Database size={16} />} title="Sem dados de PIB por estado" />
          )}
        </SectionCard>
      </motion.div>
    </motion.div>
  );
}
