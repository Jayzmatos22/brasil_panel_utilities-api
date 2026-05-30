// API: IPEA
// Endpoints consumidos:
//   GET /ipea/macro                → useMacro()
//   GET /ipea/emprego              → useEmprego()
//   GET /ipea/renda                → useRenda()
//   GET /ipea/desigualdade-pobreza → useDesigualdade()
//   GET /ipea/precos               → usePrecos()
//   GET /ipea/populacao            → usePopulacao()

import { useState } from 'react';
import { LoaderCircle, ChevronDown, ChevronRight } from 'lucide-react';
import { useMacro, useEmprego, useRenda, useDesigualdade, usePrecos, usePopulacao } from '../../../hooks/UseIpea';
import type { IpeaSerie } from '../../../types/IpeaType';

const TABS = ['Macro', 'Emprego', 'Renda', 'Desigualdade', 'Preços', 'População'] as const;
type Tab = typeof TABS[number];

function SerieCard({ serie }: { serie: IpeaSerie }) {
  const [open, setOpen] = useState(false);
  const latest = serie.dados.filter(d => d.valor !== null).at(-1);

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
                ({latest.data.slice(0, 10)})
              </span>
            </span>
          )}
          {open ? <ChevronDown size={14} className="text-slate-400" /> : <ChevronRight size={14} className="text-slate-400" />}
        </div>
      </button>

      {open && (
        <div className="border-t border-slate-700 max-h-48 overflow-y-auto">
          <table className="w-full text-xs">
            <thead className="sticky top-0 bg-slate-800">
              <tr className="border-b border-slate-700">
                <th className="text-left py-1.5 px-4 text-slate-400 font-medium">Data</th>
                <th className="text-right py-1.5 px-4 text-slate-400 font-medium">Valor</th>
              </tr>
            </thead>
            <tbody>
              {[...serie.dados].reverse().filter(d => d.valor !== null).map((item, i) => (
                <tr key={i} className="border-b border-slate-700/50 hover:bg-slate-700 transition-colors">
                  <td className="py-1.5 px-4 text-slate-300">{item.data.slice(0, 10)}</td>
                  <td className="py-1.5 px-4 text-right font-mono text-white">
                    {item.valor?.toLocaleString('pt-BR', { maximumFractionDigits: 4 })}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

function TabContent({ data, isLoading, error }: { data: IpeaSerie[] | undefined; isLoading: boolean; error: Error | null }) {
  if (isLoading) return (
    <div className="flex items-center gap-2 text-slate-400 text-sm py-4">
      <LoaderCircle size={16} className="animate-spin" /> Carregando séries...
    </div>
  );
  if (error) return <p className="text-red-400 text-sm py-4">Erro ao carregar dados.</p>;
  if (!data) return null;

  return (
    <div className="flex flex-col gap-2">
      {data.map(serie => <SerieCard key={serie.codigo} serie={serie} />)}
    </div>
  );
}

export default function IpeaPage() {
  const [activeTab, setActiveTab] = useState<Tab>('Macro');

  const macro       = useMacro();
  const emprego     = useEmprego();
  const renda       = useRenda();
  const desig       = useDesigualdade();
  const precos      = usePrecos();
  const populacao   = usePopulacao();

  const tabData: Record<Tab, typeof macro> = {
    Macro:        macro,
    Emprego:      emprego,
    Renda:        renda,
    Desigualdade: desig,
    'Preços':     precos,
    'População':  populacao,
  };

  const active = tabData[activeTab];

  return (
    <div className="flex flex-col gap-6">
      <h1 className="text-2xl font-bold text-white">IPEA — Indicadores Socioeconômicos</h1>

      {/* Tabs */}
      <div className="flex gap-1 flex-wrap border-b border-slate-700 pb-0">
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
      </div>

      {/* Conteúdo da tab ativa */}
      <TabContent
        data={active.data}
        isLoading={active.isLoading}
        error={active.error as Error | null}
      />
    </div>
  );
}