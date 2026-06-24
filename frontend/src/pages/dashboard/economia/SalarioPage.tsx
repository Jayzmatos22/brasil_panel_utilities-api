// APIs: Banco Central do Brasil (BCB) + IPEA
import { useMemo, useState, memo, type ReactNode } from "react";
import { motion } from "motion/react";
import { LoaderCircle, TrendingUp, TrendingDown, Minus, AlertCircle, RefreshCw } from "lucide-react";
import {
  useMinimumWage,
  useMinimumWageHistory,
} from "../../../hooks/UseEconomy";
import { useRenda } from "../../../hooks/UseIpea";
import {
  LineChartEcharts,
  type LinePoint,
} from "../../../components/charts/LineChartEcharts";
import { AnimatedNumber } from "../../../components/AnimatedNumber";
import { container, item } from "../../../lib/motion/presets";

// ─── Image Management ───────────────────────────────────────────────────────
const PAGE_IMAGES = import.meta.glob(
  "../../../assets/salario/*.{jpeg,jpg,png,webp,avif}",
  { eager: true, import: "default" },
) as Record<string, string>;
const bannerImage = Object.values(PAGE_IMAGES)[0];

// ─── Types & Constants ──────────────────────────────────────────────────────
const SOURCES = [
  { key: "bcb", label: "Nominal (BCB)", unit: "BRL", code: undefined },
  { key: "real", label: "Mínimo real (IPEA)", unit: "BRL", code: "GAC12_SALMINRE12" },
  { key: "ppc", label: "Mínimo PPC em USD (IPEA)", unit: "USD", code: "GAC12_SALMINDOL12" },
  { key: "renda", label: "Renda média per capita (IPEA)", unit: "BRL", code: "PNADS_RENDAMEDIA" },
] as const;

type SourceKey = (typeof SOURCES)[number]["key"];
import type { StatCardProps } from '../../../types/utilities/Economy'


// ─── Helpers ────────────────────────────────────────────────────────────────
function computeStats(points: LinePoint[]) {
  if (points.length < 2) return null;
  const first = points[0].value;
  const last = points[points.length - 1].value;
  const change = last - first;
  const pct = first !== 0 ? (change / first) * 100 : 0;
  const values = points.map((p) => p.value);
  return { change, pct, min: Math.min(...values), max: Math.max(...values) };
}

const money = (unit: "BRL" | "USD") => (v: number) =>
  v.toLocaleString("pt-BR", { style: "currency", currency: unit });

// ─── Sub-Components (Memoized) ──────────────────────────────────────────────
const StatCard = memo(({ title, value, icon, trendClass, floatDelay }: StatCardProps) => (
  <div 
    className={`relative bg-slate-900/60 backdrop-blur-sm border border-white/5 rounded-xl p-4 flex flex-col gap-2 overflow-hidden animate-float hover:-translate-y-1 transition-all duration-300 ${floatDelay ?? ''}`}
  >
    {/* Brazil-themed color rail at the top of each card */}
    <div className={`absolute top-0 left-0 right-0 h-[2px] ${trendClass}`} />
    <span className="text-slate-400 text-xs font-medium uppercase tracking-wider">{title}</span>
    <span className="flex items-center gap-2 font-mono font-bold text-white text-lg">
      {icon}
      {value}
    </span>
  </div>
));

const LoadingState = () => (
  <div className="flex items-center gap-2 text-slate-400 text-sm py-4" role="status">
    <LoaderCircle size={16} className="animate-spin" aria-hidden="true" />
    <span>Carregando dados...</span>
  </div>
);

const ErrorState = ({ message }: { message: string }) => (
  <div className="flex items-center gap-3 text-red-300 bg-red-950/30 border border-red-500/20 rounded-lg px-4 py-3 text-sm" role="alert">
    <AlertCircle size={16} className="shrink-0" aria-hidden="true" />
    <span>{message}</span>
  </div>
);


// ─── Main Page ──────────────────────────────────────────────────────────────
export default function SalarioPage() {
  const {
    data: current,
    isLoading: loadingCurrent,
    error: errCurrent,
    refetch: refetchCurrent,
  } = useMinimumWage();
  
  const {
    data: history,
    isLoading: loadingHistory,
    error: errHistory,
    refetch: refetchHistory,
  } = useMinimumWageHistory();
  
  const { 
    data: renda, 
    isLoading: loadingRenda, 
    error: errRenda,
    refetch: refetchRenda 
  } = useRenda();

  const [source, setSource] = useState<SourceKey>("bcb");

  const latest = current?.[current.length - 1];
  const meta = SOURCES.find((s) => s.key === source)!;
  const brl = money("BRL");
  const fmt = money(meta.unit);

  const points = useMemo<LinePoint[]>(() => {
    if (source === "bcb") {
      return (history ?? []).map((p) => ({ date: p.data, value: p.valor }));
    }
    const serie = renda?.find((s) => s.codigo === meta.code);
    if (!serie) return [];
    return serie.dados
      .filter((p) => p.valor != null)
      .map((p) => ({ date: p.data.slice(0, 10), value: p.valor as number }))
      .sort((a, b) => a.date.localeCompare(b.date));
  }, [source, meta.code, history, renda]);

  const stats = useMemo(() => computeStats(points), [points]);
  const loadingChart = source === "bcb" ? loadingHistory : loadingRenda;
  const errChart = source === "bcb" ? errHistory : errRenda;

  return (
    <motion.div
      className="flex flex-col gap-8 max-w-6xl mx-auto"
      variants={container}
      initial="hidden"
      animate="show"
    >
      {/* ══════════════════════════════════════════════════════════════════
          HERO — Emerging "Brazil" Theme Banner
         ══════════════════════════════════════════════════════════════════ */}
      <motion.header
        variants={item}
        className="group relative flex flex-col lg:flex-row overflow-hidden rounded-2xl bg-slate-950 shadow-2xl shadow-emerald-900/20"
        style={{ transform: 'perspective(1200px) rotateX(1deg)', transformOrigin: 'bottom center' }}
      >
        {/* Visual Panel */}
        <div className="relative lg:w-2/5 h-56 lg:h-auto shrink-0 overflow-hidden">
          <div className="absolute inset-0 bg-linear-to-br from-emerald-900 to-green-800" />
          
          {bannerImage && (
            <img
              src={bannerImage}
              alt=""
              role="presentation"
              loading="lazy"
              className="absolute inset-0 w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
              style={{ 
                WebkitMaskImage: 'radial-gradient(ellipse 80% 80% at 50% 50%, black 20%, transparent 70%)',
                maskImage: 'radial-gradient(ellipse 80% 80% at 50% 50%, black 20%, transparent 70%)'
              }}
              onError={(e) => { e.currentTarget.style.display = "none"; }}
            />
          )}
          
          {/* Deep overlay for text pop */}
          <div className="absolute inset-0 bg-linear-to-t from-slate-950 via-slate-950/60 to-transparent lg:bg-gradient-to-r lg:from-transparent lg:via-slate-950/40 lg:to-slate-950" />
        </div>

        {/* Content Panel */}
        <div className="relative z-10 flex-1 flex flex-col justify-center p-8 gap-4">
          <div className="flex items-center gap-2 mb-2">
            <span className="inline-flex items-center gap-1.5 rounded-full border border-emerald-400/30 bg-emerald-500/10 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.18em] text-emerald-300 backdrop-blur-sm">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse" />
              BCB · Live
            </span>
          </div>
          
          <h1 className="text-3xl sm:text-4xl font-semibold tracking-tight text-white drop-shadow-[0_2px_12px_rgba(0,0,0,0.5)]">
            Salário <span className="text-[#FFDF00]">Mínimo</span>
          </h1>
          <p className="text-slate-400 text-sm max-w-md">
            Valor nominal, real e comparativos de renda — BCB e IPEA.
          </p>

          {/* Current Value Display */}
          {loadingCurrent ? (
            <LoadingState />
          ) : errCurrent ? (
            <ErrorState message="Erro ao carregar o valor atual." />
          ) : latest ? (
            <div className="mt-2 flex items-baseline gap-4">
              <div className="bg-emerald-500/10 border border-emerald-500/20 rounded-xl px-5 py-3 shadow-[0_0_30px_rgba(16,185,129,0.1)]">
                <p className="text-3xl sm:text-4xl font-bold text-emerald-300 tracking-tight">
                  <AnimatedNumber value={latest.valor} format={brl} />
                </p>
              </div>
              <span className="text-slate-500 text-xs font-mono">
                Vigência {latest.data}
              </span>
            </div>
          ) : null}
        </div>
      </motion.header>

      {/* ══════════════════════════════════════════════════════════════════
          HISTORY — Chart & Analytics
         ══════════════════════════════════════════════════════════════════ */}
      <motion.section
        variants={item}
        className="relative bg-slate-900/50 border border-white/10 backdrop-blur-md rounded-2xl p-6 lg:p-8 shadow-xl shadow-black/20"
      >
        <div className="flex items-center justify-between flex-wrap gap-4 mb-6">
          <h2 className="text-white font-semibold text-sm uppercase tracking-wider flex items-center gap-2">
            <span className="h-1.5 w-1.5 rounded-full bg-blue-400 animate-pulse" />
            Histórico
          </h2>
          
          <div className="flex items-center gap-3">
            <select
              value={source}
              onChange={(e) => setSource(e.target.value as SourceKey)}
              aria-label="Selecionar fonte de dados"
              className="h-10 px-4 rounded-xl bg-white/5 text-white border border-white/10 outline-none focus:ring-2 focus:ring-emerald-500/50 transition-all text-sm cursor-pointer appearance-none hover:bg-white/10"
            >
              {SOURCES.map((s) => (
                <option key={s.key} value={s.key} className="bg-slate-900 text-white">
                  {s.label}
                </option>
              ))}
            </select>
            <span className="text-emerald-400 text-xs font-mono font-semibold bg-emerald-500/10 px-2 py-1 rounded-md border border-emerald-500/20">
              {meta.unit}
            </span>
          </div>
        </div>

        {loadingChart ? (
          <LoadingState />
        ) : errChart ? (
          <div className="flex flex-col items-center gap-4 py-8">
            <ErrorState message="Falha ao carregar histórico." />
            <button 
              onClick={() => source === "bcb" ? refetchHistory() : refetchRenda()}
              className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-white/5 border border-white/10 rounded-lg hover:bg-white/10 transition-colors focus:outline-none focus:ring-2 focus:ring-emerald-500/50"
            >
              <RefreshCw size={14} aria-hidden="true" />
              Tentar novamente
            </button>
          </div>
        ) : stats ? (
          <>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6 ">
              <StatCard
                title="Variação no período"
                value={`${stats.pct > 0 ? "+" : ""}${stats.pct.toFixed(2)}%`}
                icon={
                  stats.change > 0 ? <TrendingUp size={16} className="text-emerald-400" /> :
                  stats.change < 0 ? <TrendingDown size={16} className="text-red-400" /> :
                  <Minus size={16} className="text-slate-400" />
                }
                trendClass="bg-gradient-to-r from-emerald-500 to-green-400"
                floatDelay=""
              />
              <StatCard
                title="Mínima"
                value={fmt(stats.min)}
                icon={<TrendingDown size={16} className="text-blue-400" />}
                trendClass="bg-gradient-to-r from-blue-500 to-sky-400"
                floatDelay="animation-delay-200"
              />
              <StatCard
                title="Máxima"
                value={fmt(stats.max)}
                icon={<TrendingUp size={16} className="text-yellow-400" />}
                trendClass="bg-gradient-to-r from-yellow-500 to-amber-400"
                floatDelay="animation-delay-400"
              />
            </div>
            
            <div className="mt-4 rounded-xl overflow-hidden bg-slate-950/40 p-2 border border-white/5">
              <LineChartEcharts points={points} color="#10b981" />
            </div>
          </>
        ) : (
          <p className="text-slate-500 text-sm text-center py-8">
            Sem dados suficientes para o gráfico.
          </p>
        )}
      </motion.section>
    </motion.div>
  );
}