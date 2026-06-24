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
  CalendarDays,
} from 'lucide-react';

import { useMonthlyPib } from '../../../hooks/UseIpea';
import { usePibPorEstado } from '../../../hooks/UseSidra';
import { LineChartEcharts } from '../../../components/charts/LineChartEcharts';
import { BarChartEcharts } from '../../../components/charts/BarChartEcharts';
import { AnimatedNumber } from '../../../components/AnimatedNumber';
import { container, item } from '../../../lib/motion/presets';
import type { SectionCardProps } from '../../../types/utilities/Economy'

// ============================================================================
// Brazilian palette tokens
// ============================================================================
//  BR_GREEN  = #009C3B
//  BR_YELLOW = #FFDF00
//  BR_BLUE   = #002776

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
  const [year, setYear] = useState<number>(2024);
  const [compareYear, setCompareYear] = useState<number>(2010);

  const { data: ipeaPibData, isLoading: isPibLoading, error: pibError } = useMonthlyPib();
  const { data: pibEstados, isLoading: isEstadosLoading, error: estadosError } = usePibPorEstado();

  // ── 1. DADOS ANUAIS (cards de Evolução e KPI) ──────────────────────
  const stats = useMemo(() => {
    if (!ipeaPibData || ipeaPibData.length === 0) return null;
    const rawData = ipeaPibData[0].dados;
    if (!rawData || rawData.length === 0) return null;

    const yearlySums: Record<string, { total: number; months: number }> = {};

    rawData.forEach((item) => {
      if (item.valor === null) return;
      const ano = item.data.substring(0, 4);
      if (!yearlySums[ano]) yearlySums[ano] = { total: 0, months: 0 };

      yearlySums[ano].total += (item.valor * 1_000_000);
      yearlySums[ano].months += 1;
    });

    const points = Object.entries(yearlySums)
      .map(([anoStr, data]) => ({
        date: anoStr,
        value: data.total,
        monthsCount: data.months,
      }))
      .filter((p) => p.value > 0 && parseInt(p.date) >= 1995 && p.monthsCount === 12)
      .sort((a, b) => a.date.localeCompare(b.date));

    if (points.length < 2) return null;

    const first = points[0];
    const last = points[points.length - 1];
    const change = last.value - first.value;
    const pct = (change / first.value) * 100;

    return { points, first, last, change, pct };
  }, [ipeaPibData]);

  // ── 2. DADOS MENSAIS DO ANO SELECIONADO ───────────────────────────
  const monthlyDataForYear = useMemo(() => {
    if (!ipeaPibData || ipeaPibData.length === 0) return null;
    const rawData = ipeaPibData[0].dados;

    const filtered = rawData.filter(
      (item) => item.data.startsWith(String(year)) && item.valor !== null
    );

    if (filtered.length === 0) return null;

    const monthNames = ["Jan", "Fev", "Mar", "Abr", "Mai", "Jun", "Jul", "Ago", "Set", "Out", "Nov", "Dez"];

    return filtered.map((item) => {
      const monthIndex = parseInt(item.data.substring(5, 7), 10) - 1;
      return {
        label: monthNames[monthIndex],
        value: item.valor! * 1_000_000,
      };
    });
  }, [ipeaPibData, year]);

  // ── 3. DADOS MENSAIS DO ANO DE COMPARAÇÃO ──────────────────────────
  const monthlyDataForCompareYear = useMemo(() => {
    if (!ipeaPibData || ipeaPibData.length === 0) return null;
    const rawData = ipeaPibData[0].dados;

    const filtered = rawData.filter(
      (item) => item.data.startsWith(String(compareYear)) && item.valor !== null
    );

    if (filtered.length === 0) return null;

    const monthNames = ["Jan", "Fev", "Mar", "Abr", "Mai", "Jun", "Jul", "Ago", "Set", "Out", "Nov", "Dez"];

    return filtered.map((item) => {
      const monthIndex = parseInt(item.data.substring(5, 7), 10) - 1;
      return {
        label: monthNames[monthIndex],
        value: item.valor! * 1_000_000,
      };
    });
  }, [ipeaPibData, compareYear]);

  // ── 4. RESUMO COMPARAÇÃO DIRETA POR ANO (X vs Y) ───────────────────
  const comparisonSummary = useMemo(() => {
    if (!ipeaPibData || ipeaPibData.length === 0) return null;
    const rawData = ipeaPibData[0].dados;

    const sumForYear = (y: number) => {
      return rawData
        .filter(item => item.data.startsWith(String(y)) && item.valor !== null)
        .reduce((sum, item) => sum + (item.valor! * 1_000_000), 0);
    };

    const totalCompare = sumForYear(compareYear);
    const totalPrimary = sumForYear(year);

    if (totalCompare === 0 || totalPrimary === 0) return null;

    const change = totalPrimary - totalCompare;
    const pct = (change / totalCompare) * 100;

    return { totalCompare, totalPrimary, change, pct };
  }, [ipeaPibData, year, compareYear]);

  // ── 5. COMPARAÇÃO MENSAL DETALHADA ─────────────────────────────────
  const monthlyComparisonRows = useMemo(() => {
    if (!monthlyDataForYear || !monthlyDataForCompareYear) return [];
    
    const monthNames = ["Jan", "Fev", "Mar", "Abr", "Mai", "Jun", "Jul", "Ago", "Set", "Out", "Nov", "Dez"];
    const rows = [];
    
    for (let i = 0; i < 12; i++) {
      const primary = monthlyDataForYear.find(m => m.label === monthNames[i]);
      const compare = monthlyDataForCompareYear.find(m => m.label === monthNames[i]);
      
      // Compara apenas se o mês existir em AMBOS os anos.
      if (primary && compare) {
        const diff = primary.value - compare.value;
        const pct = compare.value !== 0 ? (diff / compare.value) * 100 : 0;
        rows.push({
          month: monthNames[i],
          primaryValue: primary.value,
          compareValue: compare.value,
          diff,
          pct
        });
      }
    }
    return rows;
  }, [monthlyDataForYear, monthlyDataForCompareYear]);

  // ── 6. DERIVADOS ───────────────────────────────────────────────────
  const currentPib = useMemo(() => {
    if (!stats) return null;
    return { year: stats.last.date, value: stats.last.value };
  }, [stats]);

  const pibByYear = useMemo(() => {
    if (!stats) return null;
    const found = stats.points.find((p) => p.date === String(year));
    return found ? { year: found.date, value: found.value } : null;
  }, [stats, year]);

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
      { label: `Atual · ${stats.last.date}`, value: compactBrl(stats.last.value), isVar: false },
      {
        label: 'Variação no período',
        value: `${up ? '+' : ''}${stats.pct.toLocaleString('pt-BR', { maximumFractionDigits: 1 })}%`,
        isVar: true, icon: <Icon size={12} className={colorClass} />, colorClass, bgClass,
      },
    ];
  }, [stats]);

  // ── 7. HANDLERS ────────────────────────────────────────────────────
  const handleYearChange = (e: ChangeEvent<HTMLInputElement>) => {
    if (e.target.value === '') return setYear(2024);
    const newYear = parseInt(e.target.value, 10);
    if (!isNaN(newYear)) setYear(newYear);
  };

  const handleCompareYearChange = (e: ChangeEvent<HTMLInputElement>) => {
    if (e.target.value === '') return setCompareYear(2010);
    const newYear = parseInt(e.target.value, 10);
    if (!isNaN(newYear)) setCompareYear(newYear);
  };

  const bannerImage = findPibImage('banner') || Object.values(PIB_IMAGES)[0];

  return (
    <motion.div className="flex flex-col gap-6" variants={container} initial="hidden" animate="show">

      {/* ══════════════════════════════════════════════════════════════════
         HERO
         ═════════════════════════════════════════════════════════════════ */}
      <motion.header
        variants={item}
        className="group relative min-h-[260px] flex items-end bg-[#020617] rounded-2xl overflow-hidden"
        style={{ transform: 'perspective(1200px) rotateX(2deg)', transformOrigin: 'bottom center' }}
      >
        {bannerImage ? (
          <>
            <div 
              className="absolute inset-0 z-0 scale-150 translate-y-10 blur-3xl opacity-50"
              style={{ background: 'radial-gradient(circle at 60% 40%, #009C3B 0%, #FFDF00 25%, #002776 50%, transparent 75%)' }}
            />
            <img
              src={bannerImage}
              alt="Brasil"
              className="absolute inset-0 w-full h-full object-cover object-center scale-125 transition-transform duration-[1400ms] ease-out group-hover:scale-[1.35] z-[1] drop-shadow-[0_25px_50px_rgba(0,0,0,0.8)]"
              style={{ filter: 'brightness(1.05) contrast(1.1) saturate(1.2)' }}
            />
            <div 
              className="absolute inset-0 z-[2]"
              style={{ background: 'radial-gradient(ellipse 65% 60% at 65% 40%, transparent 0%, rgba(2,6,23,0.6) 40%, #020617 75%)' }}
            />
            <div className="absolute bottom-0 left-0 right-0 h-[50%] z-[2] bg-gradient-to-t from-[#020617] via-[#020617]/60 to-transparent" />
          </>
        ) : (
          <div className="absolute inset-0 bg-[#020617]" />
        )}

        <div className="absolute left-0 top-0 bottom-0 w-[3px] z-[3] bg-gradient-to-b from-[#009C3B] via-[#FFDF00] to-[#002776] shadow-[0_0_18px_rgba(255,223,0,0.6)]" />

        <div className="relative z-10 p-6 sm:p-10 w-full">
          <div className="flex flex-wrap items-center gap-2 mb-4">
            <span className="inline-flex items-center gap-1.5 rounded-full border border-emerald-400/30 bg-emerald-500/10 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.18em] text-emerald-300 backdrop-blur-md">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse" />
              IPEA · Live
            </span>
            <span className="inline-flex items-center gap-1.5 rounded-full border border-yellow-400/30 bg-yellow-400/10 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.18em] text-yellow-200 backdrop-blur-md">
              IBGE · SIDRA
            </span>
            <span className="inline-flex items-center gap-1.5 rounded-full border border-white/15 bg-white/5 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.18em] text-slate-200 backdrop-blur-md">
              República Federativa do Brasil
            </span>
          </div>

          <h1 className="text-3xl sm:text-5xl font-semibold tracking-tight text-white drop-shadow-[0_2px_12px_rgba(0,0,0,0.8)]">
            PIB do <span className="text-[#FFDF00]">Brasil</span>
          </h1>
          <p className="mt-3 max-w-2xl text-sm sm:text-base text-slate-200/50 leading-relaxed drop-shadow-[0_2px_4px_rgba(0,0,0,0.8)]">
            Produto Interno Bruto a preços correntes (R$). Série histórica, recorte anual, visão mensal e
            distribuição por unidade federativa.
          </p>
        </div>
      </motion.header>

      {/* ══════════════════════════════════════════════════════════════════
         KPI ROW
         ═════════════════════════════════════════════════════════════════ */}
      <motion.div variants={item} className="grid grid-cols-1 lg:grid-cols-5 gap-4">

        {/* ✦ CARD 1 — "PIB mais recente" */}
        <motion.section
          whileHover={{ y: -2 }}
          transition={{ type: 'spring', stiffness: 220, damping: 22 }}
          className="lg:col-span-3 relative overflow-hidden rounded-2xl border border-slate-800 shadow-[0_30px_60px_-30px_rgba(0,39,118,0.6)]"
          style={{ background: 'linear-gradient(135deg, #050b1f 0%, #0a1430 35%, #001b52 100%)' }}
        >
          <div className="absolute inset-x-0 top-0 h-[2px] bg-gradient-to-r from-[#009C3B] via-[#FFDF00] to-[#002776]" />
          <div className="absolute -top-24 -right-24 w-96 h-96 rounded-full opacity-30 blur-3xl" style={{ background: 'radial-gradient(circle, #009C3B 0%, transparent 70%)' }} />

          <div className="relative p-6 sm:p-8">
            <header className="flex items-start justify-between gap-4 mb-6">
              <div className="flex items-center gap-3">
                <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-white/5 border border-white/10 text-[#FFDF00] backdrop-blur-sm">
                  <Landmark size={18} />
                </span>
                <div>
                  <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-slate-400">Indicador principal</p>
                  <h2 className="text-sm font-medium text-white mt-1">PIB anual (finalizado) mais recente</h2>
                </div>
              </div>
              {currentPib && (
                <span className="inline-flex items-center gap-1.5 rounded-md border border-[#FFDF00]/30 bg-[#FFDF00]/10 px-2.5 py-1 text-[10px] font-mono uppercase tracking-wider text-[#FFDF00]">
                  Ref · {currentPib.year}
                </span>
              )}
            </header>

            {isPibLoading ? (
              <LoadingRow />
            ) : pibError ? (
              <StatePanel tone="error" icon={<AlertTriangle size={16} />} title="Erro ao carregar o PIB atual" description="Não foi possível obter os dados do IPEA." />
            ) : (
              currentPib && (
                <>
                  <p className="text-5xl sm:text-6xl font-semibold tracking-tight text-white tabular-nums leading-none">
                    <AnimatedNumber value={currentPib.value} format={compactBrl} />
                  </p>
                  <div className="mt-4 flex flex-wrap items-center gap-x-4 gap-y-2">
                    <p className="text-sm text-slate-300/80 font-mono tabular-nums">{fullBrl(currentPib.value)}</p>
                    <span className="inline-flex items-center gap-1 text-xs text-emerald-300">
                      <ArrowUpRight size={12} />
                      Produto Interno Bruto · preços correntes
                    </span>
                  </div>
                </>
              )
            )}
          </div>
        </motion.section>

        {/* ✦ CARD 2 — "Consultar por ano" */}
        <motion.section
          whileHover={{ y: -2 }}
          transition={{ type: 'spring', stiffness: 220, damping: 22 }}
          className="lg:col-span-2 relative overflow-hidden rounded-2xl border border-emerald-900/40"
          style={{ background: 'linear-gradient(160deg, #04140c 0%, #061a14 50%, #0a2e1f 100%)' }}
        >
          <div className="absolute inset-x-0 top-0 h-[2px] bg-gradient-to-r from-[#009C3B] via-[#FFDF00]/60 to-transparent" />
          <div className="absolute -bottom-20 -left-20 w-64 h-64 rounded-full opacity-25 blur-3xl" style={{ background: 'radial-gradient(circle, #009C3B 0%, transparent 70%)' }} />

          <div className="relative p-6 sm:p-8 flex flex-col gap-5">
            <header className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-300">
                  <CalendarSearch size={18} />
                </span>
                <div>
                  <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-emerald-300/70">Recorte temporal</p>
                  <h2 className="text-sm font-medium text-white mt-0.5">Consultar por ano</h2>
                </div>
              </div>
            </header>

            {/* ── Ano principal ── */}
            <div>
              <label htmlFor="pib-year" className="block text-[10px] font-semibold uppercase tracking-[0.16em] text-slate-400 mb-1.5">
                Ano principal
              </label>
              <div className="flex items-center gap-2">
                <div className="relative flex-1 max-w-[160px]">
                  <input
                    id="pib-year" type="number" value={year} onChange={handleYearChange} placeholder="ex: 2024"
                    className="w-full h-11 px-3 pr-9 rounded-lg bg-slate-950/70 text-white placeholder:text-slate-600 border border-emerald-900/50 outline-none focus:ring-2 focus:ring-emerald-400/40 focus:border-emerald-400/50 transition-all text-base font-mono tabular-nums"
                  />
                  <CalendarSearch size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 pointer-events-none" />
                </div>
                {isPibLoading && <LoaderCircle size={18} className="animate-spin text-emerald-400" aria-hidden />}
              </div>
            </div>

            {/* ── Separador VS ── */}
            <div className="flex items-center gap-3 py-1">
              <div className="flex-1 h-px bg-emerald-900/30" />
              <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-emerald-500/50">vs</span>
              <div className="flex-1 h-px bg-emerald-900/30" />
            </div>

            {/* ── Ano de comparação ── */}
            <div>
              <label htmlFor="pib-compare-year" className="block text-[10px] font-semibold uppercase tracking-[0.16em] text-slate-400 mb-1.5">
                Ano de comparação
              </label>
              <div className="relative max-w-[160px]">
                <input
                  id="pib-compare-year" type="number" value={compareYear} onChange={handleCompareYearChange} placeholder="ex: 2010"
                  className="w-full h-11 px-3 pr-9 rounded-lg bg-slate-950/70 text-white placeholder:text-slate-600 border border-[#FFDF00]/20 outline-none focus:ring-2 focus:ring-[#FFDF00]/40 focus:border-[#FFDF00]/50 transition-all text-base font-mono tabular-nums"
                />
                <CalendarSearch size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-[#FFDF00]/40 pointer-events-none" />
              </div>
            </div>

            {/* ── Resultado ano principal ── */}
            {pibError ? (
              <StatePanel tone="error" icon={<AlertTriangle size={16} />} title={`Erro ao carregar o PIB para ${year}`} />
            ) : pibByYear ? (
              <div className="pt-2 border-t border-emerald-900/30">
                <p className="text-3xl sm:text-4xl font-semibold tracking-tight text-emerald-300 tabular-nums leading-none">
                  <AnimatedNumber value={pibByYear.value} format={compactBrl} />
                </p>
                <p className="mt-2 text-xs text-slate-400 font-mono tabular-nums">{fullBrl(pibByYear.value)}</p>
              </div>
            ) : (
              !isPibLoading && <StatePanel tone="empty" icon={<Database size={16} />} title={`Sem dados anuais fechados para ${year}`} />
            )}
          </div>
        </motion.section>
      </motion.div>

      {/* ══════════════════════════════════════════════════════════════════
         SÉRIE MENSAL — COMPARATIVO (CARD AMARELO)
         ═════════════════════════════════════════════════════════════════ */}
      <motion.div variants={item}>
        <motion.section
          whileHover={{ y: -2 }}
          transition={{ type: 'spring', stiffness: 220, damping: 22 }}
          className="relative overflow-hidden rounded-2xl border border-yellow-500/15 shadow-[0_30px_60px_-30px_rgba(255,223,0,0.08),0_1px_0_0_rgba(255,255,255,0.04)_inset]"
          style={{
            background:
              'linear-gradient(160deg, #0c0a02 0%, #131008 40%, #1a1606 70%, #1f1a0a 100%)',
          }}
        >
          <div className="absolute inset-x-0 top-0 h-[2px] bg-gradient-to-r from-transparent via-[#FFDF00]/60 to-transparent" />
          <div
            className="absolute -top-32 -left-32 w-[28rem] h-[28rem] rounded-full opacity-[0.12] blur-3xl pointer-events-none"
            style={{ background: 'radial-gradient(circle, #FFDF00 0%, transparent 65%)' }}
          />
          <div
            className="absolute -bottom-20 -right-20 w-72 h-72 rounded-full opacity-[0.06] blur-3xl pointer-events-none"
            style={{ background: 'radial-gradient(circle, #FFDF00 0%, transparent 65%)' }}
          />
          <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-white/[0.06] to-transparent" />

          <div className="relative p-6 sm:p-8 flex flex-col gap-6">
            <header className="flex items-center justify-between flex-wrap gap-3">
              <div className="flex items-center gap-3">
                <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#FFDF00]/[0.07] border border-[#FFDF00]/20 text-[#FFDF00]">
                  <CalendarDays size={18} />
                </span>
                <div>
                  <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-[#FFDF00]/60">
                    Visão Mensal Detalhada
                  </p>
                  <h2 className="text-sm font-medium text-white mt-0.5">
                    {monthlyDataForCompareYear
                      ? <>{year} <span className="text-[#FFDF00]/50 mx-1">vs</span> {compareYear}</>
                      : <>Evolução do PIB em {year}</>
                    }
                  </h2>
                </div>
              </div>
              {monthlyDataForYear && monthlyDataForYear.length > 0 && (
                <div className="flex items-center gap-2">
                  <span className="inline-flex items-center gap-1.5 rounded-md border border-[#FFDF00]/20 bg-[#FFDF00]/[0.06] px-2.5 py-1 text-[10px] font-mono uppercase tracking-wider text-[#FFDF00]/80">
                    {monthlyDataForYear.length} meses
                  </span>
                  {monthlyDataForCompareYear && (
                    <span className="inline-flex items-center gap-1.5 rounded-md border border-slate-700 bg-slate-800/60 px-2.5 py-1 text-[10px] font-mono uppercase tracking-wider text-slate-400">
                      {monthlyDataForCompareYear.length} meses
                    </span>
                  )}
                </div>
              )}
            </header>

            {isPibLoading ? (
              <LoadingRow label={`Buscando meses de ${year}…`} />
            ) : pibError ? (
              <StatePanel tone="error" icon={<AlertTriangle size={16} />} title="Erro ao carregar o detalhamento mensal" />
            ) : monthlyDataForYear && monthlyDataForYear.length > 0 ? (
              <>
                {/* ── BANNER COMPARAÇÃO DIRETA POR ANO ── */}
                {comparisonSummary && (
                  <div className={`flex items-center gap-4 p-4 rounded-xl border ${
                    comparisonSummary.pct > 0 
                      ? 'bg-emerald-500/[0.06] border-emerald-900/50' 
                      : comparisonSummary.pct < 0 
                        ? 'bg-red-500/[0.06] border-red-900/50' 
                        : 'bg-slate-800/40 border-slate-700/50'
                  }`}>
                    {comparisonSummary.pct > 0 ? (
                      <TrendingUp className="text-emerald-400 shrink-0" size={24}/>
                    ) : comparisonSummary.pct < 0 ? (
                      <TrendingDown className="text-red-400 shrink-0" size={24}/>
                    ) : (
                      <Minus className="text-slate-400 shrink-0" size={24}/>
                    )}
                    <div className="flex-1">
                      <p className="text-xs text-slate-400">
                        Comparação direta: <span className="text-white font-medium">{compareYear}</span> → <span className="text-white font-medium">{year}</span>
                      </p>
                      <p className={`text-lg font-semibold tabular-nums mt-1 ${
                        comparisonSummary.pct > 0 ? 'text-emerald-400' : comparisonSummary.pct < 0 ? 'text-red-400' : 'text-slate-300'
                      }`}>
                        {comparisonSummary.pct > 0 ? 'Cresceu ' : comparisonSummary.pct < 0 ? 'Desceu ' : ''}
                        {Math.abs(comparisonSummary.pct).toLocaleString('pt-BR', { maximumFractionDigits: 1 })}%
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-[10px] text-slate-500 uppercase tracking-wider">Variação Absoluta</p>
                      <p className={`text-sm font-medium tabular-nums ${
                        comparisonSummary.change > 0 ? 'text-emerald-400' : comparisonSummary.change < 0 ? 'text-red-400' : 'text-slate-300'
                      }`}>
                        {comparisonSummary.change > 0 ? '+' : ''}{compactBrl(comparisonSummary.change)}
                      </p>
                    </div>
                  </div>
                )}

                {/* ── Legenda ── */}
                {monthlyDataForCompareYear && (
                  <div className="flex items-center gap-5 mb-2">
                    <div className="flex items-center gap-2">
                      <span className="h-2.5 w-2.5 rounded-sm bg-[#FFDF00]" />
                      <span className="text-xs text-slate-300 font-medium">{year}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="h-2.5 w-2.5 rounded-sm bg-slate-500" />
                      <span className="text-xs text-slate-400 font-medium">{compareYear}</span>
                    </div>
                  </div>
                )}

                <div className="relative rounded-xl border border-[#FFDF00]/10 bg-slate-950/50 overflow-hidden">
                  <div
                    className="absolute inset-0 opacity-[0.03] pointer-events-none"
                    style={{ background: 'radial-gradient(ellipse at 50% 0%, #FFDF00 0%, transparent 60%)' }}
                  />
                  <div className="relative p-4">
                    {monthlyDataForCompareYear && monthlyComparisonRows.length > 0 ? (
                      /* ── TABELA COMPARAÇÃO MENSAL ── */
                      <div className="flex flex-col divide-y divide-slate-800/40">
                        {/* Cabeçalho da Tabela */}
                        <div className="grid grid-cols-4 gap-4 pb-3 text-[10px] font-semibold uppercase tracking-wider text-slate-500">
                          <span>Mês</span>
                          <span className="text-right">{compareYear}</span>
                          <span className="text-right">{year}</span>
                          <span className="text-right">Variação</span>
                        </div>
                        
                        {monthlyComparisonRows.map((row) => {
                          const isUp = row.pct > 0;
                          const isDown = row.pct < 0;
                          return (
                            <div key={row.month} className="grid grid-cols-4 gap-4 py-3 items-center">
                              <span className="text-sm font-medium text-slate-300">{row.month}</span>
                              <span className="text-sm text-slate-500 tabular-nums text-right">
                                {compactBrl(row.compareValue)}
                              </span>
                              <span className="text-sm text-[#FFDF00] tabular-nums text-right font-medium">
                                {compactBrl(row.primaryValue)}
                              </span>
                              <span className={`text-sm font-semibold tabular-nums flex items-center justify-end gap-1 ${
                                isUp ? 'text-emerald-400' : isDown ? 'text-red-400' : 'text-slate-400'
                              }`}>
                                {isUp ? <TrendingUp size={12}/> : isDown ? <TrendingDown size={12}/> : <Minus size={12}/>}
                                {Math.abs(row.pct).toLocaleString('pt-BR', { maximumFractionDigits: 1 })}%
                              </span>
                            </div>
                          );
                        })}
                      </div>
                    ) : (
                      /* ── Modo single: gráfico único ── */
                      <BarChartEcharts
                        items={monthlyDataForYear}
                        color="#FFDF00"
                        valueFormatter={compactBrl}
                      />
                    )}
                  </div>
                </div>
              </>
            ) : (
              <StatePanel tone="empty" icon={<Database size={16} />} title={`Sem dados mensais publicados para o ano de ${year}`} />
            )}
          </div>
        </motion.section>
      </motion.div>

      {/* ══════════════════════════════════════════════════════════════════
         SÉRIE HISTÓRICA
         ═════════════════════════════════════════════════════════════════ */}
      <motion.div variants={item}>
        <SectionCard
          title="Evolução histórica" subtitle="Série anual (1995 → atual)" icon={<LineChartIcon size={16} />}
          badge={stats && <span className="hidden sm:inline-flex rounded-md border border-slate-800 bg-slate-900/80 px-2 py-1 text-[10px] font-mono uppercase tracking-wider text-slate-300">{stats.points.length} pontos</span>}
          contentClassName="flex flex-col gap-5"
        >
          {isPibLoading ? (
            <LoadingRow label="Carregando série…" />
          ) : pibError ? (
            <StatePanel tone="error" icon={<AlertTriangle size={16} />} title="Erro ao carregar a série histórica" />
          ) : stats ? (
            <>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                {statBlocks.map((block, idx) => (
                  <div key={idx} className={`rounded-lg border px-4 py-3 ${block.isVar ? block.bgClass : 'bg-slate-900/60 border-slate-800'}`}>
                    <p className="text-[10px] uppercase tracking-[0.14em] text-slate-500 flex items-center gap-1.5">{block.icon} {block.label}</p>
                    <p className={`mt-1.5 text-xl font-semibold tabular-nums ${block.isVar ? block.colorClass : 'text-white'}`}>{block.value}</p>
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
         ═════════════════════════════════════════════════════════════════ */}
      <motion.div variants={item}>
        <SectionCard
          title="PIB por estado" subtitle="Distribuição por unidade federativa · IBGE/SIDRA" icon={<Map size={16} />}
          badge={pibEstados && pibEstados.length > 0 && <span className="rounded-md border border-slate-800 bg-slate-900/80 px-2 py-1 text-[10px] font-mono uppercase tracking-wider text-slate-300">Ref · {pibEstados[0].year}</span>}
          contentClassName="flex flex-col gap-3"
        >
          {isEstadosLoading ? (
            <LoadingRow label="Carregando PIB…" />
          ) : estadosError ? (
            <StatePanel tone="error" icon={<AlertTriangle size={16} />} title="Erro ao carregar o PIB por estado" />
          ) : pibEstados && pibEstados.length > 0 ? (
            <div className="rounded-lg border border-slate-800/70 bg-slate-950/60 p-3">
              <BarChartEcharts items={pibEstados.map((e) => ({ label: e.uf, value: e.value }))} color="#009C3B" valueFormatter={compactBrl} />
            </div>
          ) : (
            <StatePanel tone="empty" icon={<Database size={16} />} title="Sem dados de PIB por estado" />
          )}
        </SectionCard>
      </motion.div>
    </motion.div>
  );
}