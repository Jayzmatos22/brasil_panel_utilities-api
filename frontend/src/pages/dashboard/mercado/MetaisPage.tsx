// API: Metals.dev
// Endpoints consumidos:
//   GET /metals         → useMetals()
//   GET /metals/history → useMetalHistory()
//   GET /metals/lbma    → useLbmaFixing()

import { useMemo, useState } from 'react';
import { LoaderCircle } from 'lucide-react';
import { useMetals, useMetalHistory, useLbmaFixing } from '../../../hooks/UseMetals';
import { LineChartSvg } from '../../../components/charts/LineChartSvg';
import type { MetalKey } from '../../../types/MetalsType';

const METALS = [
  { key: 'gold',      label: 'Ouro',      emoji: '🥇' },
  { key: 'silver',    label: 'Prata',     emoji: '🥈' },
  { key: 'platinum',  label: 'Platina',   emoji: '⚪' },
  { key: 'palladium', label: 'Paládio',   emoji: '🔘' },
  { key: 'copper',    label: 'Cobre',     emoji: '🟤' },
  { key: 'aluminum',  label: 'Alumínio',  emoji: '🔩' },
  { key: 'nickel',    label: 'Níquel',    emoji: '⚙️'  },
  { key: 'zinc',      label: 'Zinco',     emoji: '🔳' },
] as const;

const LBMA_FIXINGS = [
  { label: 'Ouro',     emoji: '🥇', am: 'goldAm',      pm: 'goldPm' },
  { label: 'Platina',  emoji: '⚪', am: 'platinumAm',  pm: 'platinumPm' },
  { label: 'Paládio',  emoji: '🔘', am: 'palladiumAm', pm: 'palladiumPm' },
] as const;

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
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-white">Metais Preciosos</h1>
        {metals && (
          <span className="text-slate-500 text-xs">
            Atualizado: {new Date(metals.lastUpdated).toLocaleString('pt-BR')}
          </span>
        )}
      </div>

      {isLoading && (
        <div className="flex items-center gap-2 text-slate-400 text-sm">
          <LoaderCircle size={16} className="animate-spin" /> Carregando cotações...
        </div>
      )}

      {error && (
        <span className="text-red-400 text-sm">Erro ao carregar cotações.</span>
      )}

      {metals && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {METALS.map(({ key, label, emoji }) => (
            <div
              key={key}
              className="bg-slate-900 border border-slate-700 rounded-xl p-4 flex flex-col gap-2"
            >
              <div className="flex items-center gap-2">
                <span className="text-lg">{emoji}</span>
                <span className="text-slate-400 text-sm">{label}</span>
              </div>
              <p className="text-white font-bold text-xl font-mono">
                {brl(metals[key])}
              </p>
              <p className="text-slate-600 text-xs">por troy oz</p>
            </div>
          ))}
        </div>
      )}

      {/* Histórico — últimos 30 dias (USD/toz) */}
      <div className="bg-slate-900 border border-slate-700 rounded-xl p-6 flex flex-col gap-4">
        <div className="flex items-center justify-between flex-wrap gap-3">
          <h2 className="text-yellow-500 font-semibold text-sm uppercase tracking-wider">
            Histórico — 30 dias
          </h2>
          <div className="flex items-center gap-2">
            <select
              value={effectiveMetal}
              onChange={(e) => setSelected(e.target.value as MetalKey)}
              disabled={availableMetals.length === 0}
              className="h-9 px-3 rounded-md bg-slate-800 text-white border border-slate-600 outline-none focus:ring-2 focus:ring-yellow-500 transition-all text-sm disabled:opacity-50"
            >
              {availableMetals.map(({ key, label, emoji }) => (
                <option key={key} value={key}>{emoji} {label}</option>
              ))}
            </select>
            <span className="text-slate-500 text-xs">USD / toz</span>
          </div>
        </div>

        {loadingHistory ? (
          <div className="flex items-center gap-2 text-slate-400 text-sm">
            <LoaderCircle size={16} className="animate-spin" /> Carregando histórico...
          </div>
        ) : chartPoints.length > 0 ? (
          <LineChartSvg points={chartPoints} />
        ) : (
          <p className="text-slate-500 text-sm">
            Sem histórico disponível para este metal.
          </p>
        )}
      </div>

      {/* Fixing oficial LBMA (AM/PM) — USD/toz */}
      <div className="bg-slate-900 border border-slate-700 rounded-xl p-6 flex flex-col gap-4">
        <div className="flex items-center justify-between flex-wrap gap-3">
          <h2 className="text-yellow-500 font-semibold text-sm uppercase tracking-wider">
            Preço oficial LBMA (AM/PM)
          </h2>
          <div className="flex items-center gap-3">
            {lbma && (
              <span className="text-slate-500 text-xs">
                {new Date(lbma.timestamp).toLocaleString('pt-BR')}
              </span>
            )}
            <span className="text-slate-500 text-xs">USD / toz</span>
          </div>
        </div>

        {loadingLbma ? (
          <div className="flex items-center gap-2 text-slate-400 text-sm">
            <LoaderCircle size={16} className="animate-spin" /> Carregando fixing...
          </div>
        ) : lbma ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {LBMA_FIXINGS.map(({ label, emoji, am, pm }) => (
              <div
                key={label}
                className="bg-slate-800 border border-slate-700 rounded-lg p-4 flex flex-col gap-2"
              >
                <div className="flex items-center gap-2">
                  <span className="text-lg">{emoji}</span>
                  <span className="text-slate-300 text-sm font-medium">{label}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-slate-500">AM</span>
                  <span className="text-white font-mono">{usd(lbma[am])}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-slate-500">PM</span>
                  <span className="text-white font-mono">{usd(lbma[pm])}</span>
                </div>
              </div>
            ))}
            <div className="bg-slate-800 border border-slate-700 rounded-lg p-4 flex flex-col gap-2">
              <div className="flex items-center gap-2">
                <span className="text-lg">🥈</span>
                <span className="text-slate-300 text-sm font-medium">Prata</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-slate-500">Fixing</span>
                <span className="text-white font-mono">{usd(lbma.silver)}</span>
              </div>
            </div>
          </div>
        ) : (
          <p className="text-slate-500 text-sm">Fixing LBMA indisponível.</p>
        )}
      </div>
    </div>
  );
}