/**
 * atoms.tsx — componentes visuais pequenos, sem lógica de domínio.
 *
 * Convenção "atomic design": atoms são peças reutilizáveis que não sabem
 * que "impostos" ou "ibovespa" existem. Podem ser usados em qualquer página
 * sem acoplamento semântico.
 */

import { memo } from 'react';
import { AlertCircle, RefreshCw, TrendingUp, TrendingDown, Minus } from 'lucide-react';
import { fmtPctSigned } from '../../../constants/indicators/Formatters';

// ─── Skeleton — placeholder de carregamento ─────────────────────────────────
export const Skeleton = memo(({ className }: { className?: string }) => (
  <div
    className={`animate-pulse bg-slate-700/40 rounded-md ${className ?? ''}`}
    aria-hidden="true"
  />
));

// ─── DataRow — par label/valor monoespaçado ────────────────────────────────
export interface DataRowProps {
  label: string;
  value: string;
  valueClass?: string;
}

export const DataRow = memo(({ label, value, valueClass = 'text-slate-200' }: DataRowProps) => (
  <div className="flex justify-between items-center text-sm py-2 border-b border-white/5 last:border-0">
    <span className="text-slate-400">{label}</span>
    <span className={`font-mono font-medium ${valueClass}`}>{value}</span>
  </div>
));

// ─── ErrorState — fallback de erro com retry ───────────────────────────────
export interface ErrorStateProps {
  error: Error | null;
  refetch?: () => void;
}

export const ErrorState = memo(({ error, refetch }: ErrorStateProps) => (
  <div
    className="flex flex-col items-center justify-center gap-3 py-6 text-center"
    role="alert"
  >
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

// ─── VariationPill — badge colorido para variação % ─────────────────────────
export const VariationPill = memo(({ variation }: { variation: number | null }) => {
  // null = primeiro ponto da série (sem base de comparação)
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
