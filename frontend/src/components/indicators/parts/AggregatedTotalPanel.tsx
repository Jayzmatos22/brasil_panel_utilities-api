/**
 * AggregatedTotalPanel.tsx — painel de soma de múltiplas séries.
 *
 * Mostra:
 *  - Valor total corrente (R$ compacto configurável)
 *  - Variações M/M e YoY lado a lado
 *  - Barra de participação colorida (1px por série) — cores vem por prop
 *
 * Não conhece impostos — recebe um mapa `accentsByKey` para colorir a barra.
 * Se não passar o mapa, usa indigo default para todas as fatias.
 */

import { memo } from 'react';
import { motion } from 'motion/react';
import { Activity } from 'lucide-react';
import { itemVariants } from '../../../constants/indicators/Motion';
import { fmtBRLCompact, fmtPctSigned } from '../../../constants/indicators/Formatters';
import type { AggregatedTotal } from '../../../types/utilities/Economy';

export interface AggregatedTotalPanelProps {
  id?: string;
  title: string;
  subtitle: string;
  accent?: string;
  aggregate: AggregatedTotal | null;
  /** Mapa key → cor para colorir a barra de participação. */
  accentsByKey?: Record<string, string>;
  /** Formatador do valor total. Default fmtBRLCompact. */
  valueFormatter?: (v: number) => string;
}

export const AggregatedTotalPanel = memo(function AggregatedTotalPanel({
  id,
  title,
  subtitle,
  accent = '#818cf8',
  aggregate,
  accentsByKey,
  valueFormatter = fmtBRLCompact,
}: AggregatedTotalPanelProps) {
  return (
    <motion.div
      id={id}
      variants={itemVariants}
      className="group relative overflow-hidden rounded-2xl border border-white/10
                 bg-gradient-to-br from-indigo-950/40 via-violet-950/20 to-slate-950/40
                 backdrop-blur-md p-6 shadow-[0_8px_40px_-15px_rgba(0,0,0,0.5)] scroll-mt-24"
    >
      <div
        aria-hidden
        className="pointer-events-none absolute -top-20 -right-20 h-48 w-48 rounded-full blur-3xl opacity-25 transition-opacity group-hover:opacity-40"
        style={{ background: accent }}
      />

      {/* Header */}
      <div className="relative mb-5 flex items-start justify-between gap-3">
        <div className="flex items-center gap-3">
          <span
            className="flex h-10 w-10 items-center justify-center rounded-xl border border-white/10"
            style={{ background: `${accent}1a`, color: accent }}
            aria-hidden
          >
            <Activity size={18} />
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
          {aggregate ? `${aggregate.shares.length} séries` : '—'}
        </span>
      </div>

      {!aggregate ? (
        <div className="flex h-32 items-center justify-center text-sm text-slate-500">
          Sem dados para agregar.
        </div>
      ) : (
        <div className="relative flex flex-col gap-5">
          {/* Valor total + mês de referência */}
          <div className="flex flex-col gap-1">
            <p className="text-4xl font-bold tracking-tight" style={{ color: accent }}>
              {valueFormatter(aggregate.totalCurrent)}
            </p>
            <p className="text-slate-400 text-xs font-mono">
              Referência: {aggregate.referenceMonth.replace('-', '/')}
            </p>
          </div>

          {/* Variações M/M e YoY lado a lado */}
          <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
            <div className="rounded-lg border border-white/5 bg-white/[0.02] px-4 py-3">
              <p className="text-[10px] uppercase tracking-wider text-slate-500">Variação M/M</p>
              <p
                className={`font-mono text-lg font-semibold ${
                  aggregate.variationMM === null
                    ? 'text-slate-400'
                    : aggregate.variationMM >= 0
                      ? 'text-emerald-300'
                      : 'text-red-300'
                }`}
              >
                {aggregate.variationMM === null ? '—' : fmtPctSigned(aggregate.variationMM)}
              </p>
            </div>
            <div className="rounded-lg border border-white/5 bg-white/[0.02] px-4 py-3">
              <p className="text-[10px] uppercase tracking-wider text-slate-500">Variação YoY</p>
              <p
                className={`font-mono text-lg font-semibold ${
                  aggregate.variationYoY === null
                    ? 'text-slate-400'
                    : aggregate.variationYoY >= 0
                      ? 'text-emerald-300'
                      : 'text-red-300'
                }`}
              >
                {aggregate.variationYoY === null ? '—' : fmtPctSigned(aggregate.variationYoY)}
              </p>
            </div>
          </div>

          {/* Barra de participação — 1 fatia por série, cor vem do mapa */}
          <div className="flex flex-col gap-2">
            <p className="text-[10px] uppercase tracking-wider text-slate-500">Participação no total</p>
            <div className="flex h-3 w-full overflow-hidden rounded-full border border-white/10 bg-slate-900/60">
              {aggregate.shares.map((sh) => (
                <div
                  key={sh.key}
                  title={`${sh.label}: ${sh.pct.toFixed(1)}%`}
                  style={{
                    width: `${sh.pct}%`,
                    // Fallback para accent do painel se a key não estiver no mapa.
                    backgroundColor: accentsByKey?.[sh.key] ?? accent,
                  }}
                />
              ))}
            </div>
            <div className="grid grid-cols-2 gap-1.5 text-xs sm:grid-cols-3">
              {aggregate.shares.map((sh) => (
                <div key={sh.key} className="flex items-center gap-1.5">
                  <span
                    aria-hidden
                    className="h-2 w-2 rounded-full"
                    style={{ background: accentsByKey?.[sh.key] ?? accent }}
                  />
                  <span className="text-slate-400">{sh.label}</span>
                  <span className="ml-auto font-mono text-slate-300">{sh.pct.toFixed(1)}%</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </motion.div>
  );
});
