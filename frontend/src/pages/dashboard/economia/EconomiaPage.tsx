// API: Banco Central do Brasil (BCB)
import { memo, type ReactNode } from 'react';
import { motion } from 'motion/react';
import { DollarSign, TrendingUp, BarChart3, Percent, AlertCircle, RefreshCw } from 'lucide-react';
import { useDollarPtax, useSelic, useCdiRate, useIpca } from '../../../hooks/UseEconomy';

// ─── TypeScript Interfaces ──────────────────────────────────────────────────
interface DollarPtaxData {
  value: number;
  date: string;
}

interface SelicData {
  currentRate: number;
  accumulatedMonth: number;
  accumulatedYear: number;
  last12MonthsCompound: number;
}

interface CdiData {
  annualRate: number;
  dailyRate: number;
  date: string;
}

interface IpcaData {
  currentMonth: number;
  accumulatedYear: number;
  last12MonthsSum: number;
  last12MonthsCompound: number;
}

interface IndicatorCardProps {
  imageKey: string;
  gradient: string;
  icon: ReactNode;
  title: string;
  badge: string;
  description: string;
  isLoading: boolean;
  error: Error | null;
  refetch?: () => void;
  children: ReactNode;
}

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
      staggerChildren: 0.15, // Replaces the manual setTimeout delays
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

// ─── Sub-Components (Memoized) ──────────────────────────────────────────────

const Skeleton = memo(({ className }: { className?: string }) => (
  <div className={`animate-pulse bg-slate-700/40 rounded-md ${className}`} aria-hidden="true" />
));

const DataRow = memo(({ label, value }: { label: string; value: string }) => (
  <div className="flex justify-between items-center text-sm py-2 border-b border-white/5 last:border-0">
    <span className="text-slate-400">{label}</span>
    <span className="text-slate-200 font-mono font-medium">{value}</span>
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
  imageKey, gradient, icon, title, badge, description, isLoading, error, refetch, children
}: IndicatorCardProps) => {
  const img = findImage(imageKey);

  return (
    <motion.article
      variants={itemVariants}
      className="group relative flex flex-col lg:flex-row overflow-hidden bg-white/[0.02] 
                 backdrop-blur-md border border-white/10 rounded-2xl shadow-[0_8px_40px_-15px_rgba(0,0,0,0.5)]"
    >
      {/* ── Visual Panel (Image + Gradient Emerging Effect) ── */}
      <div className="relative lg:w-2/5 aspect-video lg:aspect-auto shrink-0 overflow-hidden">
        {/* Base Gradient Fallback */}
        <div className={`absolute inset-0 bg-gradient-to-br ${gradient}`} />

        {/* Image Overlay with CSS Masking to "emerge" */}
        {img && (
          <img
            src={img}
            alt=""
            role="presentation" // Decorative, title is provided in text below
            loading="lazy"
            className="absolute inset-0 w-full h-full object-cover transition-transform duration-700 ease-out group-hover:scale-105"
            style={{ 
              WebkitMaskImage: 'radial-gradient(ellipse 80% 80% at 50% 50%, black 20%, transparent 70%)',
              maskImage: 'radial-gradient(ellipse 80% 80% at 50% 50%, black 20%, transparent 70%)'
            }}
            onError={(e) => { e.currentTarget.style.display = 'none'; }}
          />
        )}

        {/* Deep Readability Overlay */}
        <div className="absolute inset-0 bg-gradient-to-t from-[#020617] via-[#020617]/60 to-transparent" />

        {/* Title Seal */}
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

// ─── Main Page ──────────────────────────────────────────────────────────────
export default function EconomiaPage() {
  // Data fetching triggers immediately. Framer Motion handles visual stagger.
  const { data: dollar, isLoading: l0, error: e0, refetch: r0 } = useDollarPtax();
  const { data: selic,  isLoading: l1, error: e1, refetch: r1 } = useSelic();
  const { data: cdi,    isLoading: l2, error: e2, refetch: r2 } = useCdiRate();
  const { data: ipca,   isLoading: l3, error: e3, refetch: r3 } = useIpca();

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
          Dados oficiais do Banco Central do Brasil, atualizados diariamente.
        </p>
      </motion.div>

      {/* ── Dólar PTAX ── */}
      <IndicatorCard
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