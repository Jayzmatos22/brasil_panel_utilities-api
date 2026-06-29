/**
 * IndicesSummaryPanel — painel que mostra N índices lado a lado,
 * SEM somar (diferente do AggregatedTotalPanel).
 *
 * Cada item mostra: nome, valor mais recente, variação M/M e YoY.
 * Útil para séries heterogêneas (índices adimensionais + valores).
 */

import { memo } from 'react';
import { motion } from 'motion/react';
import { BarChart3 } from 'lucide-react';
import { itemVariants } from '../../../constants/indicators/Motion';
import { fmtPctSigned } from '../../../constants/indicators/Formatters';
import type { LatestSummary } from '../../../types/utilities/Economy';

export interface IndexSummaryItem {
  key: string;
  label: string;
  accent: string;
  latest: LatestSummary | null;
  /** Formatador do valor (índice → sem unidade, valor → US$). */
  valueFormatter: (v: number) => string;
}

export interface IndicesSummaryPanelProps {
  id?: string;
  title: string;
  subtitle: string;
  items: IndexSummaryItem[];
}

export const IndicesSummaryPanel = memo(function IndicesSummaryPanel({
  id, title, subtitle, items,
}: IndicesSummaryPanelProps) {
  return (
    <motion.div
      id={id}
      variants={itemVariants}
      className="relative overflow-hidden rounded-2xl border border-white/10
                 bg-linear-to-br from-slate-950/60 to-slate-900/40
                 backdrop-blur-md p-6 shadow-[0_8px_40px_-15px_rgba(0,0,0,0.5)] scroll-mt-24"
    >
      <div className="mb-5 flex items-center gap-3">
        <span className="flex h-10 w-10 items-center justify-center rounded-xl border border-white/10 bg-violet-500/10 text-violet-300">
          <BarChart3 size={18} aria-hidden />
        </span>
        <div>
          <h4 className="text-base font-semibold tracking-tight text-slate-100">{title}</h4>
          <p className="text-[11px] uppercase tracking-[0.18em] text-slate-500">{subtitle}</p>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6">
        {items.map((item) => (
          <div
            key={item.key}
            className="flex flex-col gap-1 rounded-lg border border-white/5 bg-white/2 px-3 py-2.5"
          >
            <span className="text-[10px] uppercase tracking-wider text-slate-500 truncate">
              {item.label}
            </span>
            {item.latest ? (
              <>
                <span
                  className="font-mono text-base font-bold"
                  style={{ color: item.accent }}
                >
                  {item.valueFormatter(item.latest.value)}
                </span>
                <div className="flex items-center gap-2 text-[10px] font-mono">
                  {item.latest.variationMM !== null && (
                    <span className={item.latest.variationMM >= 0 ? 'text-emerald-300' : 'text-red-300'}>
                      M/M {fmtPctSigned(item.latest.variationMM)}
                    </span>
                  )}
                  {item.latest.variationYoY !== null && (
                    <span className={item.latest.variationYoY >= 0 ? 'text-emerald-300' : 'text-red-300'}>
                      YoY {fmtPctSigned(item.latest.variationYoY)}
                    </span>
                  )}
                </div>
              </>
            ) : (
              <span className="font-mono text-sm text-slate-600">—</span>
            )}
          </div>
        ))}
      </div>
    </motion.div>
  );
});