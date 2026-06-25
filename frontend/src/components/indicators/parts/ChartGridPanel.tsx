/**
 * ChartGridPanel.tsx — wrapper do LineChartEchartsCompact (altura 160px).
 *
 * Projetado para grids densos (2x3, 3x3). Visual mais enxuto: header sem ícone,
 * padding menor, badge compacto.
 */

import { memo } from 'react';
import { LineChartEchartsCompact } from '../../charts/LineChartEchartsCompact';
import type { LinePoint } from '../../charts/LineChartEcharts';

export interface ChartGridPanelProps {
  id?: string;
  title: string;
  subtitle: string;
  accent: string;
  points: LinePoint[];
  emptyHint: string;
  valueFormatter?: (v: number) => string;
}

export const ChartGridPanel = memo(function ChartGridPanel({
  id,
  title,
  subtitle,
  accent,
  points,
  emptyHint,
  valueFormatter,
}: ChartGridPanelProps) {
  return (
    <div
      id={id}
      className="relative overflow-hidden rounded-xl border border-white/10 bg-white/[0.02]
                 backdrop-blur-md p-4 scroll-mt-24"
    >
      <div
        aria-hidden
        className="pointer-events-none absolute -top-12 -right-12 h-32 w-32 rounded-full blur-3xl opacity-20"
        style={{ background: accent }}
      />
      <div className="relative mb-3 flex items-start justify-between gap-2">
        <div>
          <h5 className="text-sm font-semibold tracking-tight text-slate-100">{title}</h5>
          <p className="text-[10px] uppercase tracking-[0.16em] text-slate-500">{subtitle}</p>
        </div>
        <span
          className="rounded-full px-2 py-0.5 text-[9px] font-semibold uppercase tracking-wider"
          style={{ background: `${accent}1a`, color: accent }}
        >
          {points.length} pts
        </span>
      </div>

      {points.length === 0 ? (
        <div className="flex h-[160px] items-center justify-center text-center text-[11px] text-slate-500">
          {emptyHint}
        </div>
      ) : (
        <LineChartEchartsCompact
          points={points}
          color={accent}
          height={160}
          valueFormatter={valueFormatter}
        />
      )}
    </div>
  );
});
