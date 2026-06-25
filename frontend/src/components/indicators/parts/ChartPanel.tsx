/**
 * ChartPanel.tsx — wrapper do LineChartEcharts (altura 300px) com header
 * padronizado (ícone + título + subtitle + badge de contagem).
 *
 * Uso típico: gráfico principal de uma seção (5 anos, 6 meses, etc.).
 * Para grids densos, prefira ChartGridPanel (160px).
 */

import { memo, type ReactNode } from 'react';
import { motion } from 'motion/react';
import { LineChartEcharts, type LinePoint } from '../../charts/LineChartEcharts';
import { itemVariants } from '../../../constants/indicators/Motion';

export interface ChartPanelProps {
  id?: string;
  title: string;
  subtitle: string;
  icon: ReactNode;
  /** Cor hexadecimal — repassada para LineChartEcharts. */
  accent: string;
  points: LinePoint[];
  emptyHint: string;
  /** Formatador de valor para tooltip. Default pt-BR 2 casas. */
  valueFormatter?: (v: number) => string;
}

export const ChartPanel = memo(function ChartPanel({
  id,
  title,
  subtitle,
  icon,
  accent,
  points,
  emptyHint,
  valueFormatter,
}: ChartPanelProps) {
  return (
    <motion.div
      id={id}
      variants={itemVariants}
      className="group relative overflow-hidden rounded-2xl border border-white/10 bg-white/[0.02]
                 backdrop-blur-md p-6 shadow-[0_8px_40px_-15px_rgba(0,0,0,0.5)] scroll-mt-24"
    >
      {/* Glow decorativo no canto — intensifica no hover. */}
      <div
        aria-hidden
        className="pointer-events-none absolute -top-20 -right-20 h-48 w-48 rounded-full blur-3xl opacity-25 transition-opacity group-hover:opacity-40"
        style={{ background: accent }}
      />

      <div className="relative mb-5 flex items-start justify-between gap-3">
        <div className="flex items-center gap-3">
          <span
            className="flex h-10 w-10 items-center justify-center rounded-xl border border-white/10"
            style={{ background: `${accent}1a`, color: accent }}
            aria-hidden
          >
            {icon}
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
          {points.length} pts
        </span>
      </div>

      {points.length === 0 ? (
        <div className="flex h-[300px] items-center justify-center text-center text-xs text-slate-500">
          {emptyHint}
        </div>
      ) : (
        <LineChartEcharts
          points={points}
          color={accent}
          valueFormatter={valueFormatter}
        />
      )}
    </motion.div>
  );
});
