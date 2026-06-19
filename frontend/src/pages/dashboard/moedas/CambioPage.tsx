import { useMemo, useState, type ChangeEvent } from 'react';
import { motion } from 'motion/react';
import { TrendingUp, TrendingDown, Minus, LoaderCircle } from 'lucide-react';
import { useRateByCoins, useLast30DaysExchange, useGetHistoryByCoins, useCurrencies } from '../../../hooks/UseExchange';
import { CURRENCIES as CURRENCY_META } from '../../../constants/currencies';
import { LineChartEcharts } from '../../../components/charts/LineChartEcharts';
import { AnimatedNumber } from '../../../components/AnimatedNumber';
import { container, item } from '../../../lib/motion/presets';
import type { FrankfurterHistoryItem } from '../../../types/FrankfurterType';

// ============================================================================
// 1. IMPORTAÇÃO DINÂMICA DE IMAGENS (Padrão Vite)
// ============================================================================
const CAMBIO_IMAGES = import.meta.glob('../../../assets/cambio/*.{jpeg,jpg,png,webp,avif}', { 
  eager: true, 
  import: 'default' 
}) as Record<string, string>;

function findCambioImage(term: string): string | undefined {
  const match = Object.entries(CAMBIO_IMAGES).find(([path]) => path.toLowerCase().includes(term));
  return match?.[1];
}

const META_BY_CODE = new Map<string, (typeof CURRENCY_META)[number]>(
  CURRENCY_META.map((c) => [c.code, c]),
);

export default function CambioPage() {
  const [from,   setFrom]   = useState('USD');
  const [to,     setTo]     = useState('BRL');
  const [amount, setAmount] = useState(1);

  const [startDate, setStartDate] = useState('');
  const [endDate,   setEndDate]   = useState('');

  // Hooks remain EXACTLY as provided.
  const { data: currencies } = useCurrencies();
  const currencyOptions = useMemo(() => {
    const codes = currencies ? Object.keys(currencies) : [];
    return codes
      .map((code) => {
        const meta = META_BY_CODE.get(code);
        return {
          code,
          label: meta ? `${meta.flag} ${code} — ${meta.name}` : `${code} — ${currencies?.[code] ?? ''}`,
        };
      })
      .sort((a, b) => a.code.localeCompare(b.code));
  }, [currencies]);

  const { data: rate,    isLoading: loadingRate    } = useRateByCoins(from, to, amount);
  const { data: last30,  isLoading: loadingLast30  } = useLast30DaysExchange(from, to);
  const { data: history, isLoading: loadingHistory } = useGetHistoryByCoins(from, to, startDate, endDate);

  const stats = useMemo(() => {
    if (!history || history.data.length < 2) return null;
    const sorted = [...history.data].sort((a: FrankfurterHistoryItem, b: FrankfurterHistoryItem) =>
      a.date.localeCompare(b.date),
    );
    const first = sorted[0].rate;
    const last = sorted[sorted.length - 1].rate;
    const change = last - first;
    const pct = first !== 0 ? (change / first) * 100 : 0;
    const rates = sorted.map((p) => p.rate);
    return {
      points: sorted.map((p) => ({ date: p.date, value: p.rate })),
      change,
      pct,
      min: Math.min(...rates),
      max: Math.max(...rates),
    };
  }, [history]);

  const fmt = (v: number) => v.toLocaleString('pt-BR', { minimumFractionDigits: 4 });

  const cambioCardImage = findCambioImage('cambio-img') || Object.values(CAMBIO_IMAGES)[0];

  // Unified Glassmorphic UI Classes (Pure Tailwind)
  const glassInput = "h-12 px-4 rounded-xl bg-white/5 backdrop-blur-md text-white border border-white/10 outline-none focus:ring-2 focus:ring-emerald-500/50 focus:border-emerald-500/50 transition-all text-sm hover:bg-white/10";
  const glassSelect = `${glassInput} appearance-none cursor-pointer`;

  return (
    <motion.div 
      className="flex flex-col gap-8 max-w-6xl mx-auto" 
      variants={container} 
      initial="hidden" 
      animate="show"
      exit="exit"
    >
      {/* ══════════════════════════════════════════════════════════════════
          HERO — Currency Converter (3D Emerging Banner)
         ══════════════════════════════════════════════════════════════════ */}
      <motion.header
        variants={item}
        className="group relative overflow-hidden rounded-2xl bg-slate-950 shadow-2xl shadow-emerald-900/20 min-h-[280px] flex flex-col lg:flex-row"
        style={{ transform: 'perspective(1200px) rotateX(2deg)', transformOrigin: 'bottom center' }}
      >
        {/* Visual Panel */}
        <div className="relative lg:w-2/5 h-56 lg:h-auto shrink-0 overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-br from-blue-900 to-emerald-800" />
          
          {cambioCardImage && (
            <img
              src={cambioCardImage}
              alt=""
              role="presentation"
              className="absolute inset-0 w-full h-full object-cover opacity-70 animate-slow-pan z-[1]"
              style={{ 
                WebkitMaskImage: 'radial-gradient(ellipse 80% 80% at 50% 50%, black 20%, transparent 70%)',
                maskImage: 'radial-gradient(ellipse 80% 80% at 50% 50%, black 20%, transparent 70%)'
              }}
            />
          )}

          <div className="absolute inset-0 z-[2] bg-gradient-to-t from-slate-950 via-slate-950/60 to-transparent lg:bg-gradient-to-r lg:from-transparent lg:via-slate-950/40 lg:to-slate-950" />
          
          {/* Tricolor Rail */}
          <div className="absolute left-0 top-0 bottom-0 w-[3px] z-[3] bg-gradient-to-b from-[#009C3B] via-[#FFDF00] to-[#002776] shadow-[0_0_18px_rgba(255,223,0,0.4)]" />
        </div>

        {/* Content Panel */}
        <div className="relative z-10 flex-1 flex flex-col justify-center p-8 gap-6">
          <div>
            <h2 className="text-white font-semibold text-sm uppercase tracking-wider mb-1 flex items-center gap-2">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse" />
              Conversão Cambial
            </h2>
            <h1 className="text-3xl sm:text-4xl font-semibold tracking-tight text-white drop-shadow-[0_2px_12px_rgba(0,0,0,0.5)]">
              Taxas <span className="text-[#FFDF00]">Frankfurter</span>
            </h1>
          </div>

          <div className="flex flex-col sm:flex-row items-start sm:items-end gap-4">
            <div className="flex flex-col gap-1.5 w-full sm:w-auto">
              <label className="text-slate-400 text-xs font-medium uppercase tracking-wider">Valor</label>
              <input
                type="number"
                min={0}
                value={amount}
                onChange={(e: ChangeEvent<HTMLInputElement>) => setAmount(Number(e.target.value))}
                className={`${glassInput} font-mono w-full sm:w-32`}
              />
            </div>
            
            <div className="flex items-center gap-3 w-full sm:w-auto">
              <div className="flex flex-col gap-1.5 flex-1 sm:flex-none">
                <label className="text-slate-400 text-xs font-medium uppercase tracking-wider">De</label>
                <select value={from} onChange={(e) => setFrom(e.target.value)} className={`${glassSelect} w-full sm:w-48`}>
                  {currencyOptions.map(c => <option key={c.code} value={c.code} className="bg-slate-900">{c.label}</option>)}
                </select>
              </div>

              <span className="text-slate-500 font-bold text-xl mt-5">→</span>

              <div className="flex flex-col gap-1.5 flex-1 sm:flex-none">
                <label className="text-slate-400 text-xs font-medium uppercase tracking-wider">Para</label>
                <select value={to} onChange={(e) => setTo(e.target.value)} className={`${glassSelect} w-full sm:w-48`}>
                  {currencyOptions.map(c => <option key={c.code} value={c.code} className="bg-slate-900">{c.label}</option>)}
                </select>
              </div>
            </div>
          </div>

          {loadingRate ? (
            <div className="flex items-center gap-2 text-slate-400 text-sm h-12">
              <LoaderCircle size={16} className="animate-spin text-emerald-400" /> Calculando...
            </div>
          ) : rate && rate.rates[to] != null ? (
            <div className="mt-2">
              <p className="text-4xl sm:text-5xl font-bold text-emerald-300 tracking-tight drop-shadow-[0_2px_10px_rgba(16,185,129,0.3)]">
                <AnimatedNumber value={rate.rates[to]} format={fmt} /> <span className="text-xl text-emerald-500">{to}</span>
              </p>
              <p className="text-slate-500 text-xs mt-2 font-mono">Referência: {rate.date}</p>
            </div>
          ) : null}
        </div>
      </motion.header>

      {/* ══════════════════════════════════════════════════════════════════
          LAST 30 DAYS TABLE
         ══════════════════════════════════════════════════════════════════ */}
      <motion.section 
        variants={item} 
        className="relative bg-slate-900/50 border border-white/10 backdrop-blur-md rounded-2xl p-6 shadow-xl shadow-black/20 hover:-translate-y-1 transition-all duration-300"
      >
        <h2 className="text-white font-semibold text-sm uppercase tracking-wider mb-6 flex items-center gap-2">
          <span className="h-1.5 w-1.5 rounded-full bg-blue-400 animate-pulse" />
          Últimos 30 dias — {from}/{to}
        </h2>

        {loadingLast30 ? (
          <div className="flex items-center gap-2 text-slate-400 text-sm py-4">
            <LoaderCircle size={16} className="animate-spin text-emerald-400" /> Carregando...
          </div>
        ) : last30 ? (
          <div className="overflow-x-auto max-h-[300px] overflow-y-auto scrollbar-thin">
            <table className="w-full text-sm">
              <thead className="sticky top-0 z-10">
                <tr className="border-b border-white/10 bg-slate-950/90 backdrop-blur-sm">
                  <th className="text-left py-3 px-4 text-slate-400 font-medium w-40">Data</th>
                  <th className="text-right py-3 px-4 text-slate-400 font-medium">Taxa</th>
                </tr>
              </thead>
              <tbody>
                {[...last30.data].reverse().map((item) => (
                  <tr key={item.date} className="border-b border-white/5 hover:bg-white/5 transition-colors cursor-default">
                    <td className="py-2.5 px-4 text-slate-300 font-mono text-xs">{item.date}</td>
                    <td className="py-2.5 px-4 text-right font-mono text-white">
                      {item.rate.toLocaleString('pt-BR', { minimumFractionDigits: 4 })}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : null}
      </motion.section>

      {/* ══════════════════════════════════════════════════════════════════
          HISTORY BY PERIOD
         ══════════════════════════════════════════════════════════════════ */}
      <motion.section 
        variants={item} 
        className="relative bg-slate-900/50 border border-white/10 backdrop-blur-md rounded-2xl p-6 shadow-xl shadow-black/20 hover:-translate-y-1 transition-all duration-300"
      >
        <h2 className="text-white font-semibold text-sm uppercase tracking-wider mb-6 flex items-center gap-2">
          <span className="h-1.5 w-1.5 rounded-full bg-yellow-400 animate-pulse" />
          Histórico por Período
        </h2>

        <div className="flex items-end gap-4 flex-wrap mb-8">
          <div className="flex flex-col gap-1.5">
            <label className="text-slate-400 text-xs font-medium uppercase tracking-wider">Data inicial</label>
            <input 
              type="date" 
              value={startDate} 
              onChange={(e) => setStartDate(e.target.value)} 
              className={`${glassInput} [color-scheme:dark]`} 
            />
          </div>
          <div className="flex flex-col gap-1.5">
            <label className="text-slate-400 text-xs font-medium uppercase tracking-wider">Data final</label>
            <input 
              type="date" 
              value={endDate} 
              onChange={(e) => setEndDate(e.target.value)} 
              className={`${glassInput} [color-scheme:dark]`} 
            />
          </div>
        </div>

        {loadingHistory ? (
          <div className="flex items-center gap-2 text-slate-400 text-sm py-4">
            <LoaderCircle size={16} className="animate-spin text-emerald-400" /> Carregando...
          </div>
        ) : stats ? (
          <div className="flex flex-col gap-6">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              {/* Variation Card */}
              <div className="relative bg-slate-900/60 backdrop-blur-sm border border-white/5 rounded-xl p-4 flex flex-col gap-2 overflow-hidden hover:-translate-y-1 transition-all duration-300">
                <div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-emerald-500 to-green-400" />
                <span className="text-slate-400 text-xs font-medium uppercase tracking-wider">Variação</span>
                <span
                  className={`flex items-center gap-1.5 font-mono font-semibold text-lg ${
                    stats.change > 0 ? 'text-emerald-400' : stats.change < 0 ? 'text-red-400' : 'text-slate-300'
                  }`}
                >
                  {stats.change > 0 ? <TrendingUp size={16} /> : stats.change < 0 ? <TrendingDown size={16} /> : <Minus size={16} />}
                  {stats.change > 0 ? '+' : ''}{fmt(stats.change)} ({stats.pct > 0 ? '+' : ''}{stats.pct.toFixed(2)}%)
                </span>
              </div>

              {/* Minimum Card */}
              <div className="relative bg-slate-900/60 backdrop-blur-sm border border-white/5 rounded-xl p-4 flex flex-col gap-2 overflow-hidden hover:-translate-y-1 transition-all duration-300">
                <div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-blue-500 to-sky-400" />
                <span className="text-slate-400 text-xs font-medium uppercase tracking-wider">Mínima</span>
                <span className="font-mono text-blue-300 font-semibold text-lg">{fmt(stats.min)}</span>
              </div>

              {/* Maximum Card */}
              <div className="relative bg-slate-900/60 backdrop-blur-sm border border-white/5 rounded-xl p-4 flex flex-col gap-2 overflow-hidden hover:-translate-y-1 transition-all duration-300">
                <div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-yellow-500 to-amber-400" />
                <span className="text-slate-400 text-xs font-medium uppercase tracking-wider">Máxima</span>
                <span className="font-mono text-yellow-300 font-semibold text-lg">{fmt(stats.max)}</span>
              </div>
            </div>
            
            <div className="mt-2 rounded-xl overflow-hidden bg-slate-950/40 p-2 border border-white/5 min-h-[300px]">
              <LineChartEcharts points={stats.points} color="#06b6d4" />
            </div>
          </div>
        ) : history ? (
          <p className="text-slate-500 text-sm py-4">Período sem dados suficientes para o gráfico.</p>
        ) : (
          <p className="text-slate-500 text-sm py-4">Selecione um período para consultar.</p>
        )}
      </motion.section>
    </motion.div>
  );
}