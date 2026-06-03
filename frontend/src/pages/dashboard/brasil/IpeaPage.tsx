// API: IPEA
// Endpoints consumidos:
//   GET /ipea/macro                → useMacro()
//   GET /ipea/emprego              → useEmprego()
//   GET /ipea/renda                → useRenda()
//   GET /ipea/desigualdade-pobreza → useDesigualdade()
//   GET /ipea/precos               → usePrecos()
//   GET /ipea/populacao            → usePopulacao()

import { useMemo, useState } from 'react';
import { motion } from 'motion/react';
import { LoaderCircle, ChevronDown, ChevronRight } from 'lucide-react';
import { useMacro, useEmprego, useRenda, useDesigualdade, usePrecos, usePopulacao } from '../../../hooks/UseIpea';
import type { IpeaSerie } from '../../../types/IpeaType';
import { LineChartEcharts, type LinePoint } from '../../../components/charts/LineChartEcharts';
import { container, item } from '../../../lib/motion/presets';

// ─── Tipos ───────────────────────────────────────────────────────────────────

type Tab = 'Macro' | 'Emprego' | 'Renda' | 'Desigualdade' | 'Preços' | 'População';

const TABS: Tab[] = ['Macro', 'Emprego', 'Renda', 'Desigualdade', 'Preços', 'População'];

// ─── SerieCard ────────────────────────────────────────────────────────────────

function SerieCard({ serie }: { serie: IpeaSerie }) {
  const [open, setOpen] = useState(false);

  const dados = serie.dados ?? [];
  const valid = dados.filter(d => d.valor !== null);
  const latest = valid.length > 0 ? valid[valid.length - 1] : null;

  // Pontos em ordem cronológica crescente para o gráfico.
  const points = useMemo<LinePoint[]>(
    () =>
      [...valid]
        .map((d) => ({ date: String(d.data).slice(0, 10), value: d.valor as number }))
        .sort((a, b) => a.date.localeCompare(b.date)),
    [valid],
  );

  return (
    <div className="bg-slate-800 rounded-lg overflow-hidden">
      <button
        onClick={() => setOpen(o => !o)}
        className="w-full flex items-center justify-between px-4 py-3 hover:bg-slate-700 transition-colors"
      >
        <div className="flex flex-col items-start gap-0.5">
          <span className="text-white text-sm font-medium text-left">{serie.nome}</span>
          <span className="text-slate-500 text-xs">{serie.codigo}</span>
        </div>
        <div className="flex items-center gap-3 shrink-0 ml-4">
          {latest && (
            <span className="text-yellow-400 font-mono text-sm">
              {latest.valor?.toLocaleString('pt-BR', { maximumFractionDigits: 2 })}
              <span className="text-slate-500 text-xs ml-1">
                ({String(latest.data).slice(0, 10)})
              </span>
            </span>
          )}
          {open
            ? <ChevronDown  size={14} className="text-slate-400" />
            : <ChevronRight size={14} className="text-slate-400" />
          }
        </div>
      </button>

      {open && (
        <div className="border-t border-slate-700 p-4">
          {points.length >= 2 ? (
            <LineChartEcharts points={points} />
          ) : (
            <p className="text-slate-500 text-xs">Série sem pontos suficientes para o gráfico.</p>
          )}
        </div>
      )}
    </div>
  );
}

// ─── TabContent ───────────────────────────────────────────────────────────────

function TabContent({
  data,
  isLoading,
  error,
}: {
  data:      IpeaSerie[] | undefined;
  isLoading: boolean;
  error:     unknown;
}) {
  if (isLoading) return (
    <div className="flex items-center gap-2 text-slate-400 text-sm py-4">
      <LoaderCircle size={16} className="animate-spin" /> Carregando séries...
    </div>
  );
  if (error)  return <p className="text-red-400 text-sm py-4">Erro ao carregar dados.</p>;
  if (!data)  return null;
  if (data.length === 0) return <p className="text-slate-500 text-sm py-4">Nenhuma série disponível.</p>;

  return (
    <div className="flex flex-col gap-2">
      {data.map(serie => <SerieCard key={serie.codigo} serie={serie} />)}
    </div>
  );
}

// ─── IpeaPage ─────────────────────────────────────────────────────────────────

export default function IpeaPage() {
  const [activeTab, setActiveTab] = useState<Tab>('Macro');

  const macro     = useMacro();
  const emprego   = useEmprego();
  const renda     = useRenda();
  const desig     = useDesigualdade();
  const precos    = usePrecos();
  const populacao = usePopulacao();

  // Switch simples em vez de Record indexado
  const active = (() => {
    switch (activeTab) {
      case 'Macro':        return macro;
      case 'Emprego':      return emprego;
      case 'Renda':        return renda;
      case 'Desigualdade': return desig;
      case 'Preços':       return precos;
      case 'População':    return populacao;
    }
  })();

  return (
    <motion.div className="flex flex-col gap-6" variants={container} initial="hidden" animate="show">
      <motion.h1 variants={item} className="text-2xl font-bold text-white">IPEA — Indicadores Socioeconômicos</motion.h1>

      {/* Tabs */}
      <motion.div variants={item} className="flex gap-1 flex-wrap border-b border-slate-700">
        {TABS.map(tab => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={[
              'px-4 py-2 text-sm font-medium rounded-t-md transition-all',
              activeTab === tab
                ? 'bg-yellow-500/15 text-yellow-400 border border-b-0 border-slate-700'
                : 'text-slate-400 hover:text-white',
            ].join(' ')}
          >
            {tab}
          </button>
        ))}
      </motion.div>

      {/* Conteúdo */}
      <motion.div variants={item}>
        <TabContent
          data={active.data}
          isLoading={active.isLoading}
          error={active.error}
        />
      </motion.div>
    </motion.div>
  );
}
