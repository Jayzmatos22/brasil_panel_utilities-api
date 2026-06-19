// API: Metals.dev
// Endpoints consumidos:
//   GET /metals         → useMetals()
//   GET /metals/history → useMetalHistory()
//   GET /metals/lbma    → useLbmaFixing()

import { useMemo, useState } from 'react';
import { motion } from 'motion/react';
import {
  LoaderCircle,
  TrendingUp,
  TrendingDown,
  Minus,
  AlertTriangle,
  LineChart as LineChartIcon,
  Clock,
} from 'lucide-react';
import { useMetals, useMetalHistory, useLbmaFixing } from '../../../hooks/UseMetals';
import { LineChartEcharts } from '../../../components/charts/LineChartEcharts';
import { AnimatedNumber } from '../../../components/AnimatedNumber';
import { container, item } from '../../../lib/motion/presets';
import type { MetalKey } from '../../../types/MetalsType';

// Imagens dos metais (assets/metais/*-img.*). Nome do arquivo deve conter o termo
// PT do metal — ex: metais-ouro-img.jpeg, metais-prata-img.png.
const METAL_IMAGES = import.meta.glob(
  '../../../assets/metais/*.{jpeg,jpg,png,webp,avif}',
  { eager: true, import: 'default' },
) as Record<string, string>;

function findMetalImage(term: string): string | undefined {
  const match = Object.entries(METAL_IMAGES).find(([path]) =>
    path.toLowerCase().includes(`-${term}-img`),
  );
  return match?.[1];
}

// Metais com variação destacada nos 30 dias
const VARIATION_METALS = [
  { key: 'gold',      label: 'Ouro',     emoji: '🥇' },
  { key: 'silver',    label: 'Prata',    emoji: '🥈' },
  { key: 'platinum',  label: 'Platina',  emoji: '⚪' },
  { key: 'palladium', label: 'Paládio',  emoji: '🔘' },
] as const;

// img = termo PT usado no nome do arquivo da imagem
const METALS = [
  { key: 'gold',      label: 'Ouro',      emoji: '🥇', img: 'ouro'     },
  { key: 'silver',    label: 'Prata',     emoji: '🥈', img: 'prata'    },
  { key: 'platinum',  label: 'Platina',   emoji: '⚪', img: 'platina'  },
  { key: 'palladium', label: 'Paládio',   emoji: '🔘', img: 'paladio'  },
  { key: 'copper',    label: 'Cobre',     emoji: '🟤', img: 'cobre'    },
  { key: 'aluminum',  label: 'Alumínio',  emoji: '🔩', img: 'aluminio' },
  { key: 'nickel',    label: 'Níquel',    emoji: '⚙️', img: 'niquel'   },
  { key: 'zinc',      label: 'Zinco',     emoji: '🔳', img: 'zinco'    },
] as const;

const LBMA_FIXINGS = [
  { label: 'Ouro',     emoji: '🥇', am: 'goldAm',      pm: 'goldPm' },
  { label: 'Platina',  emoji: '⚪', am: 'platinumAm',  pm: 'platinumPm' },
  { label: 'Paládio',  emoji: '🔘', am: 'palladiumAm', pm: 'palladiumPm' },
] as const;

/* ─────────────────────────────────────────────────────────────────────────────
 * Presentational helpers (no business logic).
 * ───────────────────────────────────────────────────────────────────────────── */

function SectionCard({ children }: { children: React.ReactNode }) {
  return (
    <section
      className="rounded-2xl border border-slate-800/80 bg-gradient-to-b from-slate-900/60 to-slate-950/80
                 shadow-[0_1px_0_0_rgba(255,255,255,0.03)_inset,0_20px_40px_-20px_rgba(0,0,0,0.5)]
                 overflow-hidden"
    >
      {children}
    </section>
  );
}

function SectionHeader({
  eyebrow,
  title,
  description,
  right,
}: {
  eyebrow?: string;
  title: string;
  description?: string;
  right?: React.ReactNode;
}) {
  return (
    <header className="px-5 sm:px-6 pt-5 pb-4 flex items-start justify-between flex-wrap gap-3 border-b border-slate-800/60">
      <div className="min-w-0">
        {eyebrow && (
          <p className="text-[10px] font-semibold text-amber-400/80 uppercase tracking-[0.14em]">
            {eyebrow}
          </p>
        )}
        <h2 className="mt-1 text-sm font-semibold text-slate-100 tracking-tight">{title}</h2>
        {description && (
          <p className="mt-0.5 text-xs text-slate-500">{description}</p>
        )}
      </div>
      {right && <div className="flex items-center gap-2">{right}</div>}
    </header>
  );
}

function StatePanel({
  icon: Icon,
  title,
  description,
  tone = 'muted',
}: {
  icon: React.ComponentType<{ size?: number; className?: string }>;
  title: string;
  description?: string;
  tone?: 'muted' | 'error';
}) {
  const ring = tone === 'error' ? 'ring-rose-400/15 bg-rose-400/5' : 'ring-slate-800/60 bg-slate-900/40';
  const iconTone = tone === 'error' ? 'text-rose-400' : 'text-slate-500';
  const titleTone = tone === 'error' ? 'text-rose-300' : 'text-slate-300';
  return (
    <div className="flex flex-col items-center justify-center gap-3 py-14">
      <div className={`flex items-center justify-center w-11 h-11 rounded-full ring-1 ${ring}`}>
        <Icon size={18} className={iconTone} />
      </div>
      <div className="text-center">
        <p className={`text-sm font-medium ${titleTone}`}>{title}</p>
        {description && <p className="mt-1 text-xs text-slate-500 max-w-xs">{description}</p>}
      </div>
    </div>
  );
}

function LoadingRow({ label }: { label: string }) {
  return (
    <div
      role="status"
      aria-live="polite"
      className="flex items-center justify-center gap-2.5 py-14 text-slate-400 text-sm"
    >
      <LoaderCircle size={15} className="animate-spin text-slate-500" />
      <span>{label}</span>
    </div>
  );
}

/* ─────────────────────────────────────────────────────────────────────────── */

export default function MetaisPage() {
  const { data: metals, isLoading, error } = useMetals();
  const { data: history, isLoading: loadingHistory } = useMetalHistory();
  const { data: lbma, isLoading: loadingLbma } = useLbmaFixing();

  const [selected, setSelected] = useState<MetalKey>('gold');

  // Só os metais que o timeseries realmente fornece (o industrial costuma não vir).
  const availableMetals = useMemo(
    () => METALS.filter(({ key }) => history?.data.some((p) => p[key] != null)),
    [history],
  );

  // Se o metal selecionado não tem dados, cai no primeiro disponível.
  const effectiveMetal: MetalKey =
    availableMetals.some((m) => m.key === selected)
      ? selected
      : availableMetals[0]?.key ?? selected;

  // Variação de 30 dias: compara o 1º com o último valor disponível de cada metal.
  const variations = useMemo(() => {
    if (!history) return [];
    return VARIATION_METALS.map(({ key, label, emoji }) => {
      const series = history.data
        .filter((p) => p[key] != null)
        .map((p) => ({ date: p.date, value: p[key] as number }));

      if (series.length < 2) return null;

      const first = series[0];
      const last  = series[series.length - 1];
      const diff  = last.value - first.value;
      const pct   = (diff / first.value) * 100;

      return { key, label, emoji, first, last, diff, pct };
    }).filter((v): v is NonNullable<typeof v> => v !== null);
  }, [history]);

  // Pontos do metal selecionado (descarta dias sem valor para aquele metal)
  const chartPoints = useMemo(() => {
    if (!history) return [];
    return history.data
      .filter((p) => p[effectiveMetal] != null)
      .map((p) => ({ date: p.date, value: p[effectiveMetal] as number }));
  }, [history, effectiveMetal]);

  const brl = (v: number) =>
    v.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL', minimumFractionDigits: 2 });

  const usd = (v: number | null) =>
    v == null
      ? '—'
      : v.toLocaleString('pt-BR', { style: 'currency', currency: 'USD', minimumFractionDigits: 2 });

  return (
    <motion.div
      className="flex flex-col gap-7"
      variants={container}
      initial="hidden"
      animate="show"
      aria-busy={isLoading}
    >
      {/* ── Header ── */}
      <motion.header variants={item} className="flex flex-col gap-2">
        <div className="flex items-start justify-between flex-wrap gap-3">
          <div className="flex items-center gap-3 min-w-0">
            <div className="relative flex items-center justify-center w-10 h-10 rounded-xl bg-gradient-to-br from-amber-400/15 to-amber-500/5 ring-1 ring-amber-400/20">
              <TrendingUp size={18} className="text-amber-300" />
              <span className="absolute -inset-px rounded-xl ring-1 ring-inset ring-white/5 pointer-events-none" />
            </div>
            <div className="min-w-0">
              <p className="text-[10px] font-semibold text-amber-400/80 uppercase tracking-[0.16em]">
                Mercado · Commodities
              </p>
              <h1 className="text-[22px] sm:text-2xl font-semibold tracking-tight text-white leading-tight">
                Metais Preciosos
              </h1>
            </div>
          </div>
          {metals && (
            <div className="flex items-center gap-1.5 text-xs text-slate-500 tabular-nums">
              <Clock size={12} className="text-slate-600" />
              <span>Atualizado {new Date(metals.lastUpdated).toLocaleString('pt-BR')}</span>
            </div>
          )}
        </div>
        <p className="text-sm text-slate-400 sm:pl-[52px]">
          Cotações em tempo real, histórico de 30 dias e fixing oficial LBMA.
        </p>
      </motion.header>

      {/* ── Global loading ── */}
      {isLoading && (
        <motion.div variants={item}>
          <SectionCard>
            <LoadingRow label="Carregando cotações…" />
          </SectionCard>
        </motion.div>
      )}

      {/* ── Global error ── */}
      {error && (
        <motion.div
          variants={item}
          role="alert"
          className="rounded-xl border border-rose-400/20 bg-rose-400/5 px-4 py-3 flex items-start gap-3"
        >
          <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-rose-400/10 ring-1 ring-rose-400/20 shrink-0">
            <AlertTriangle size={15} className="text-rose-400" />
          </div>
          <div className="min-w-0">
            <p className="text-sm font-medium text-rose-300">Não foi possível carregar as cotações</p>
            <p className="text-xs text-rose-400/80 mt-0.5">
              Verifique sua conexão ou tente novamente em alguns instantes.
            </p>
          </div>
        </motion.div>
      )}

      {/* ── Price cards grid ── */}
      {metals && (
        <motion.div
          variants={item}
          className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 xl:grid-cols-4 gap-3"
        >
          {METALS.map(({ key, label, emoji, img }) => {
            const image = findMetalImage(img);
            const isActive = key === selected;
            return (
              <motion.button
                type="button"
                key={key}
                whileHover={{ y: -2 }}
                whileTap={{ scale: 0.985 }}
                onClick={() => setSelected(key)}
                aria-pressed={isActive}
                aria-label={`Selecionar ${label}`}
                className={[
                  'metal-card relative overflow-hidden rounded-xl p-4 flex flex-col gap-2 text-left',
                  'group cursor-pointer transition-all duration-200',
                  'focus:outline-none focus-visible:ring-2 focus-visible:ring-amber-400/40 focus-visible:ring-offset-0',
                  isActive
                    ? 'ring-1 ring-amber-400/40 bg-gradient-to-b from-amber-400/[0.06] to-slate-900/80 shadow-[0_0_0_1px_rgba(251,191,36,0.08)_inset]'
                    : 'border border-slate-800/80 bg-slate-950/70 hover:border-slate-700 hover:bg-slate-900/60',
                ].join(' ')}
              >
                {/* Background image layer */}
                {image && (
                  <>
                    <img
                      src={image}
                      alt=""
                      aria-hidden="true"
                      className="absolute inset-0 w-full h-full object-cover opacity-0 group-hover:opacity-25
                                 transition-all duration-700 ease-out group-hover:scale-[1.04] pointer-events-none"
                      onError={(e) => { e.currentTarget.style.display = 'none'; }}
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/75 to-slate-950/30 pointer-events-none" />
                  </>
                )}

                <div className="relative flex items-center justify-between">
                  <div className="flex items-center gap-2 min-w-0">
                    <span className="text-base leading-none" aria-hidden="true">{emoji}</span>
                    <span className="text-slate-200 text-sm font-medium truncate">{label}</span>
                  </div>
                  {isActive && (
                    <span className="flex items-center gap-1 text-[10px] font-semibold uppercase tracking-wide text-amber-300">
                      <span className="w-1.5 h-1.5 rounded-full bg-amber-300 shadow-[0_0_8px_rgba(251,191,36,0.6)]" />
                      Ativo
                    </span>
                  )}
                </div>

                <p className="relative text-white font-semibold text-[19px] sm:text-xl tabular-nums tracking-tight">
                  <AnimatedNumber value={metals[key]} format={brl} />
                </p>
                <p className="relative text-slate-500 text-[10px] uppercase tracking-[0.12em] font-medium">
                  BRL / troy oz
                </p>
              </motion.button>
            );
          })}
        </motion.div>
      )}

      {/* ── Variação 30 dias ── */}
      {variations.length > 0 && (
        <motion.div variants={item}>
          <SectionCard>
            <SectionHeader
              eyebrow="Performance"
              title="Variação nos 30 dias"
              description="Comparativo do início ao fim da série (USD / troy oz)"
            />
            <div className="p-5 sm:p-6 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
              {variations.map(({ key, label, emoji, first, last, diff, pct }) => {
                const up   = pct > 0;
                const flat = pct === 0;
                const tone = flat ? 'text-slate-400' : up ? 'text-emerald-400' : 'text-rose-400';
                const bgTone = flat
                  ? 'bg-slate-800/40'
                  : up
                    ? 'bg-gradient-to-b from-emerald-400/[0.08] to-emerald-400/[0.02]'
                    : 'bg-gradient-to-b from-rose-400/[0.08] to-rose-400/[0.02]';
                const ringTone = flat
                  ? 'ring-slate-700/60'
                  : up
                    ? 'ring-emerald-400/20'
                    : 'ring-rose-400/20';
                const Icon = flat ? Minus : up ? TrendingUp : TrendingDown;
                return (
                  <motion.div
                    key={key}
                    whileHover={{ y: -2 }}
                    transition={{ type: 'spring', stiffness: 320, damping: 24 }}
                    className={`rounded-xl ring-1 ${ringTone} ${bgTone} p-4 flex flex-col gap-3 transition-colors duration-150`}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2 min-w-0">
                        <span className="text-base leading-none" aria-hidden="true">{emoji}</span>
                        <span className="text-slate-200 text-sm font-medium truncate">{label}</span>
                      </div>
                      <span
                        className={`inline-flex items-center gap-1 text-xs font-semibold tabular-nums px-1.5 py-0.5 rounded-md ${tone}`}
                      >
                        <Icon size={13} />
                        {up ? '+' : ''}{pct.toFixed(2)}%
                      </span>
                    </div>

                    <div className="flex flex-col gap-1.5 text-xs">
                      <div className="flex justify-between">
                        <span className="text-slate-500 tabular-nums">{first.date}</span>
                        <span className="text-slate-400 font-mono tabular-nums">{usd(first.value)}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-500 tabular-nums">{last.date}</span>
                        <span className="text-white font-mono font-medium tabular-nums">{usd(last.value)}</span>
                      </div>
                    </div>

                    <div className={`text-xs font-mono border-t border-slate-800/60 pt-2.5 tabular-nums ${tone}`}>
                      {up ? '+' : ''}{usd(diff)} <span className="text-slate-500 font-sans">no período</span>
                    </div>
                  </motion.div>
                );
              })}
            </div>
          </SectionCard>
        </motion.div>
      )}

      {/* ── Histórico — 30 dias ── */}
      <motion.div variants={item}>
        <SectionCard>
          <SectionHeader
            eyebrow="Série temporal"
            title="Histórico — 30 dias"
            description="Cotação diária em USD por troy ounce"
            right={
              <>
                <label htmlFor="metal-select" className="sr-only">Selecionar metal</label>
                <select
                  id="metal-select"
                  value={effectiveMetal}
                  onChange={(e) => setSelected(e.target.value as MetalKey)}
                  disabled={availableMetals.length === 0}
                  className="h-8 px-3 rounded-lg bg-slate-900/80 text-sm text-white border border-slate-800
                             outline-none focus:ring-2 focus:ring-amber-400/40 focus:border-amber-400/40
                             hover:border-slate-700 transition-all duration-150
                             disabled:opacity-40 disabled:cursor-not-allowed appearance-none
                             [background-image:url('data:image/svg+xml;charset=utf-8,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20width%3D%2216%22%20height%3D%2216%22%20fill%3D%22none%22%20stroke%3D%22%2364748b%22%20stroke-width%3D%222%22%3E%3Cpath%20d%3D%22m4%206%204%204%204-4%22%2F%3E%3C%2Fsvg%3E')]
                             [background-position:right_0.5rem_center] [background-repeat:no-repeat] [background-size:1rem]
                             pr-7 cursor-pointer"
                >
                  {availableMetals.map(({ key, label, emoji }) => (
                    <option key={key} value={key}>{emoji} {label}</option>
                  ))}
                </select>
              </>
            }
          />

          <div className="p-5 sm:p-6">
            {loadingHistory ? (
              <LoadingRow label="Carregando histórico…" />
            ) : chartPoints.length > 0 ? (
              <LineChartEcharts points={chartPoints} color="#f59e0b" />
            ) : (
              <StatePanel
                icon={LineChartIcon}
                title="Sem histórico disponível"
                description="Este metal não possui dados na série temporal dos últimos 30 dias."
              />
            )}
          </div>
        </SectionCard>
      </motion.div>

      {/* ── Fixing oficial LBMA (AM/PM) ── */}
      <motion.div variants={item}>
        <SectionCard>
          <SectionHeader
            eyebrow="Benchmark"
            title="Preço oficial LBMA"
            description="Fixing AM/PM em USD por troy ounce"
            right={
              lbma ? (
                <div className="flex items-center gap-1.5 text-xs text-slate-500 tabular-nums">
                  <Clock size={12} className="text-slate-600" />
                  {new Date(lbma.timestamp).toLocaleString('pt-BR')}
                </div>
              ) : null
            }
          />

          <div className="p-5 sm:p-6">
            {loadingLbma ? (
              <LoadingRow label="Carregando fixing…" />
            ) : lbma ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {LBMA_FIXINGS.map(({ label, emoji, am, pm }) => (
                  <div
                    key={label}
                    className="rounded-xl border border-slate-800/80 bg-slate-900/40 p-4 flex flex-col gap-3
                               hover:border-slate-700 transition-colors duration-150"
                  >
                    <div className="flex items-center gap-2">
                      <span className="text-base leading-none" aria-hidden="true">{emoji}</span>
                      <span className="text-slate-200 text-sm font-medium">{label}</span>
                    </div>
                    <div className="flex flex-col gap-2 pt-1">
                      <div className="flex items-center justify-between text-sm border-b border-slate-800/50 pb-2">
                        <span className="text-[10px] font-semibold text-slate-500 uppercase tracking-[0.14em]">AM</span>
                        <span className="text-white font-mono tabular-nums">{usd(lbma[am])}</span>
                      </div>
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-[10px] font-semibold text-slate-500 uppercase tracking-[0.14em]">PM</span>
                        <span className="text-white font-mono tabular-nums">{usd(lbma[pm])}</span>
                      </div>
                    </div>
                  </div>
                ))}
                <div className="rounded-xl border border-slate-800/80 bg-slate-900/40 p-4 flex flex-col gap-3
                                hover:border-slate-700 transition-colors duration-150">
                  <div className="flex items-center gap-2">
                    <span className="text-base leading-none" aria-hidden="true">🥈</span>
                    <span className="text-slate-200 text-sm font-medium">Prata</span>
                  </div>
                  <div className="flex items-center justify-between text-sm pt-1">
                    <span className="text-[10px] font-semibold text-slate-500 uppercase tracking-[0.14em]">Fixing</span>
                    <span className="text-white font-mono tabular-nums">{usd(lbma.silver)}</span>
                  </div>
                </div>
              </div>
            ) : (
              <StatePanel
                icon={AlertTriangle}
                title="Fixing LBMA indisponível"
                description="Não foi possível obter os dados de fixing neste momento. Tente novamente em alguns instantes."
              />
            )}
          </div>
        </SectionCard>
      </motion.div>
    </motion.div>
  );
}
