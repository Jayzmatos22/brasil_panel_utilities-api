/**
 * RecentClosingsTable.tsx — tabela dos últimos 5 pontos de uma série.
 *
 * Cada linha mostra data, valor (formatável) e a variação D/D-1
 * encapsulada num VariationPill colorido.
 */

import { memo, useMemo } from 'react';
import { motion } from 'motion/react';
import { Calendar } from 'lucide-react';
import { itemVariants } from '../../../constants/indicators/Motion';
import { fmtBRDate, fmtPts } from '../../../constants/indicators/Formatters';
import type { ClosingRow } from '../../../types/utilities/Economy';
import { VariationPill } from './Atoms';

export interface RecentClosingsTableProps {
  id?: string;
  rows: ClosingRow[];
  title?: string;
  subtitle?: string;
  /** Formatador da coluna "Valor". Default fmtPts (inteiros com milhar). */
  valueFormatter?: (v: number) => string;
}

export const RecentClosingsTable = memo(function RecentClosingsTable({
  id,
  rows,
  title = 'Últimos Fechamentos',
  subtitle = '5 pregões · variação D/D-1',
  valueFormatter = fmtPts,
}: RecentClosingsTableProps) {
  // Pega os últimos 5 e inverte para exibir do mais recente → mais antigo.
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
          <h4 className="text-base font-semibold tracking-tight text-slate-100">{title}</h4>
          <p className="text-[11px] uppercase tracking-[0.18em] text-slate-500">{subtitle}</p>
        </div>
      </div>

      <div className="overflow-x-auto px-2 pb-2">
        <table className="w-full border-collapse text-sm">
          <thead>
            <tr className="text-left text-[11px] uppercase tracking-wider text-slate-500">
              <th className="px-4 py-2 font-medium">Data</th>
              <th className="px-4 py-2 text-right font-medium">Valor</th>
              <th className="px-4 py-2 text-right font-medium">Variação</th>
            </tr>
          </thead>
          <tbody>
            {last5.length === 0 ? (
              <tr>
                <td colSpan={3} className="px-4 py-6 text-center text-xs text-slate-500">
                  Sem dados disponíveis.
                </td>
              </tr>
            ) : (
              last5.map((row) => (
                <tr
                  key={row.date}
                  className="border-t border-white/5 transition-colors hover:bg-white/[0.03]"
                >
                  <td className="px-4 py-2.5 font-mono text-slate-300">{fmtBRDate(row.date)}</td>
                  <td className="px-4 py-2.5 text-right font-mono font-medium text-slate-100">
                    {valueFormatter(row.value)}
                  </td>
                  <td className="px-4 py-2.5 text-right">
                    <VariationPill variation={row.variation} />
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </motion.div>
  );
});
