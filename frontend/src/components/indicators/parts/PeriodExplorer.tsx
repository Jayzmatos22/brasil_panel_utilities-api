/**
 * PeriodExplorer.tsx — filtro por ano inteiro OU intervalo entre anos.
 *
 * 2 modos:
 *  - "Ano inteiro"  → seleciona 1 ano, vê todos os meses daquele ano
 *  - "Intervalo"    → seleciona ano-inicial e ano-final, vê todos os meses
 *                     entre os dois (inclusivo em ambas as pontas)
 *
 * Filtro por mês individual foi removido — não faz sentido para séries
 * mensais de impostos onde o usuário quer ver tendência, não detalhe mensal.
 */

import { memo, useMemo, useState } from 'react';
import { motion } from 'motion/react';
import { Filter } from 'lucide-react';
import { LineChartEcharts, type LinePoint } from '../../charts/LineChartEcharts';
import { itemVariants } from '../../../constants/indicators/Motion';
import { fmtPctSigned, fmtPts, fmtBRDate } from '../../../constants/indicators/Formatters';
import { toLinePoints } from '../Helpers';
import type { IpeaItem } from '../../../types/IpeaType';

export interface PeriodExplorerProps {
  id?: string;
  /** Série válida asc — já filtrada e ordenada. */
  validAsc: IpeaItem[];
  accent?: string;
  /** Formatador dos valores na UI (R$ compacto para impostos, pts para Ibovespa). */
  valueFormatter?: (v: number) => string;
}

type Mode = 'single' | 'range';

export const PeriodExplorer = memo(function PeriodExplorer({
  id,
  validAsc,
  accent = '#a78bfa',
  valueFormatter,
}: PeriodExplorerProps) {
  // Anos disponíveis — ordenados asc (mais antigo → mais recente).
  // Em modo range, faz mais sentido mostrar na ordem natural do tempo.
  const availableYears = useMemo(() => {
    const years = new Set<string>();
    for (const item of validAsc) years.add(item.data.substring(0, 4));
    return Array.from(years).sort((a, b) => a.localeCompare(b));
  }, [validAsc]);

  // Estado: modo + anos selecionados.
  // Inicialização lazy pega o ano mais recente disponível.
  const latestYear = availableYears[availableYears.length - 1] ?? '';
  const [mode, setMode] = useState<Mode>('single');
  const [selectedYear, setSelectedYear] = useState<string>(latestYear);
  const [startYear, setStartYear] = useState<string>(latestYear);
  const [endYear, setEndYear] = useState<string>(latestYear);

  // Troca de modo: ao entrar em "range", sincroniza start/end com o ano atual
  // para o usuário não começar com um intervalo inválido.
  // Padrão React: ajustar state durante o render comparando com prev.
  const [prevMode, setPrevMode] = useState<Mode>(mode);
  if (mode !== prevMode) {
    setPrevMode(mode);
    if (mode === 'range') {
      setStartYear(selectedYear);
      setEndYear(selectedYear);
    }
  }

  // Garante start ≤ end (se usuário inverter, trocamos automaticamente).
  const [start, end] = useMemo(() => {
    if (mode !== 'range') return [selectedYear, selectedYear];
    return startYear <= endYear ? [startYear, endYear] : [endYear, startYear];
  }, [mode, selectedYear, startYear, endYear]);

  // Aplica o filtro sobre a série conforme o modo.
  const filteredPoints = useMemo<LinePoint[]>(() => {
    if (availableYears.length === 0) return [];
    const filtered = validAsc.filter((item) => {
      const y = item.data.substring(0, 4);
      return y >= start && y <= end;
    });
    return toLinePoints(filtered);
  }, [validAsc, start, end, availableYears.length]);

  // Estatísticas do recorte filtrado (só se ≥ 2 pontos).
  const periodStats = useMemo(() => {
    if (filteredPoints.length < 2) return null;
    const first = filteredPoints[0].value;
    const last = filteredPoints[filteredPoints.length - 1].value;
    const ret = ((last - first) / first) * 100;
    let hi = filteredPoints[0];
    let lo = filteredPoints[0];
    for (const p of filteredPoints) {
      if (p.value > hi.value) hi = p;
      if (p.value < lo.value) lo = p;
    }
    return { count: filteredPoints.length, ret, hi, lo, first, last };
  }, [filteredPoints]);

  const periodLabel = mode === 'single'
    ? `Ano ${selectedYear}`
    : start === end
      ? `Ano ${start}`
      : `Intervalo ${start} – ${end}`;

  // Opções dos selects de ano (mesma lista, usada 3x).
  const yearOptions = availableYears;

  return (
    <motion.div
      id={id}
      variants={itemVariants}
      className="group relative overflow-hidden rounded-2xl border border-white/10 bg-white/[0.02]
                 backdrop-blur-md p-6 shadow-[0_8px_40px_-15px_rgba(0,0,0,0.5)] scroll-mt-24"
    >
      <div
        aria-hidden
        className="pointer-events-none absolute -top-20 -right-20 h-48 w-48 rounded-full blur-3xl opacity-25 transition-opacity group-hover:opacity-40"
        style={{ background: accent }}
      />

      {/* Cabeçalho + filtros */}
      <div className="relative mb-5 flex flex-wrap items-start justify-between gap-4">
        <div className="flex items-center gap-3">
          <span
            className="flex h-10 w-10 items-center justify-center rounded-xl border border-white/10"
            style={{ background: `${accent}1a`, color: accent }}
            aria-hidden
          >
            <Filter size={18} />
          </span>
          <div>
            <h4 className="text-base font-semibold tracking-tight text-slate-100">Explorador por Período</h4>
            <p className="text-[11px] uppercase tracking-[0.18em] text-slate-500">Ano inteiro ou intervalo entre anos</p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {/* Toggle de modo */}
          <div className="inline-flex rounded-lg border border-white/10 bg-slate-900/70 p-0.5">
            <button
              type="button"
              onClick={() => setMode('single')}
              className={`rounded-md px-3 py-1.5 text-xs font-semibold transition-colors ${
                mode === 'single'
                  ? 'bg-violet-500/20 text-violet-200'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
              aria-pressed={mode === 'single'}
            >
              Ano inteiro
            </button>
            <button
              type="button"
              onClick={() => setMode('range')}
              className={`rounded-md px-3 py-1.5 text-xs font-semibold transition-colors ${
                mode === 'range'
                  ? 'bg-violet-500/20 text-violet-200'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
              aria-pressed={mode === 'range'}
            >
              Intervalo
            </button>
          </div>

          {/* Select(s) de ano conforme o modo */}
          {mode === 'single' ? (
            <label className="flex items-center gap-1.5 text-[10px] uppercase tracking-wider text-slate-500">
              <span>Ano</span>
              <select
                value={selectedYear}
                onChange={(e) => setSelectedYear(e.target.value)}
                className="rounded-lg border border-white/10 bg-slate-900/70 px-3 py-1.5 text-xs font-medium text-slate-200 focus:outline-none focus:ring-2 focus:ring-violet-500/50 hover:border-white/20 transition-colors"
                aria-label="Selecionar ano"
              >
                {yearOptions.map((y) => (
                  <option key={y} value={y}>{y}</option>
                ))}
              </select>
            </label>
          ) : (
            <>
              <label className="flex items-center gap-1.5 text-[10px] uppercase tracking-wider text-slate-500">
                <span>De</span>
                <select
                  value={startYear}
                  onChange={(e) => setStartYear(e.target.value)}
                  className="rounded-lg border border-white/10 bg-slate-900/70 px-3 py-1.5 text-xs font-medium text-slate-200 focus:outline-none focus:ring-2 focus:ring-violet-500/50 hover:border-white/20 transition-colors"
                  aria-label="Ano inicial"
                >
                  {yearOptions.map((y) => (
                    <option key={y} value={y}>{y}</option>
                  ))}
                </select>
              </label>
              <label className="flex items-center gap-1.5 text-[10px] uppercase tracking-wider text-slate-500">
                <span>Até</span>
                <select
                  value={endYear}
                  onChange={(e) => setEndYear(e.target.value)}
                  className="rounded-lg border border-white/10 bg-slate-900/70 px-3 py-1.5 text-xs font-medium text-slate-200 focus:outline-none focus:ring-2 focus:ring-violet-500/50 hover:border-white/20 transition-colors"
                  aria-label="Ano final"
                >
                  {yearOptions.map((y) => (
                    <option key={y} value={y}>{y}</option>
                  ))}
                </select>
              </label>
            </>
          )}
        </div>
      </div>

      {/* Stats do período filtrado */}
      <div className="relative mb-4 flex flex-wrap items-center gap-2 text-xs">
        <span className="inline-flex items-center gap-1.5 rounded-md border border-white/5 bg-white/[0.03] px-2.5 py-1 font-mono">
          <span className="text-slate-500">Período:</span>
          <span className="text-slate-100">{periodLabel}</span>
        </span>
        {periodStats ? (
          <>
            <span className="inline-flex items-center gap-1.5 rounded-md border border-white/5 bg-white/[0.03] px-2.5 py-1 font-mono">
              <span className="text-slate-500">Pts:</span>
              <span className="text-slate-100">{periodStats.count}</span>
            </span>
            <span className="inline-flex items-center gap-1.5 rounded-md border border-white/5 bg-white/[0.03] px-2.5 py-1 font-mono">
              <span className="text-slate-500">Var:</span>
              <span className={periodStats.ret >= 0 ? 'text-emerald-300' : 'text-red-300'}>
                {fmtPctSigned(periodStats.ret)}
              </span>
            </span>
            <span className="inline-flex items-center gap-1.5 rounded-md border border-white/5 bg-white/[0.03] px-2.5 py-1 font-mono">
              <span className="text-slate-500">Máx:</span>
              <span className="text-slate-100">
                {valueFormatter ? valueFormatter(periodStats.hi.value) : fmtPts(periodStats.hi.value)}
              </span>
              <span className="text-slate-600">·</span>
              <span className="text-slate-500">{fmtBRDate(periodStats.hi.date)}</span>
            </span>
            <span className="inline-flex items-center gap-1.5 rounded-md border border-white/5 bg-white/[0.03] px-2.5 py-1 font-mono">
              <span className="text-slate-500">Mín:</span>
              <span className="text-slate-100">
                {valueFormatter ? valueFormatter(periodStats.lo.value) : fmtPts(periodStats.lo.value)}
              </span>
              <span className="text-slate-600">·</span>
              <span className="text-slate-500">{fmtBRDate(periodStats.lo.date)}</span>
            </span>
          </>
        ) : (
          <span className="rounded-md border border-white/5 bg-white/[0.03] px-2.5 py-1 font-mono text-slate-500">
            {filteredPoints.length === 0
              ? 'Sem dados neste recorte.'
              : `${filteredPoints.length} ponto(s) — insuficiente para métricas.`}
          </span>
        )}
      </div>

      {filteredPoints.length === 0 ? (
        <div className="flex h-[300px] items-center justify-center text-center text-xs text-slate-500">
          Sem dados válidos para o período selecionado.
        </div>
      ) : (
        <LineChartEcharts
          points={filteredPoints}
          color={accent}
          valueFormatter={valueFormatter}
        />
      )}
    </motion.div>
  );
});
