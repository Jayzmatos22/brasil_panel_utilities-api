// API: Banco Central do Brasil (BCB)
// Endpoints consumidos:
//   GET /bcb/minimum-wage         → useMinimumWage()
//   GET /bcb/minimum-wage/history → useMinimumWageHistory()

import { LoaderCircle } from 'lucide-react';
import { useMinimumWage, useMinimumWageHistory } from '../../../hooks/UseEconomy';

export default function SalarioPage() {
  const { data: current,  isLoading: loadingCurrent,  error: errCurrent  } = useMinimumWage();
  const { data: history,  isLoading: loadingHistory,  error: errHistory  } = useMinimumWageHistory();

  const brl = (v: number) => v.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
  const latest = current?.[current.length - 1];

  return (
    <div className="flex flex-col gap-6">
      <h1 className="text-2xl font-bold text-white">Salário Mínimo</h1>

      {/* Salário atual */}
      <div className="bg-slate-900 border border-slate-700 rounded-xl p-6 max-w-sm">
        <h2 className="text-yellow-500 font-semibold text-sm uppercase tracking-wider mb-3">Valor Atual</h2>
        {loadingCurrent ? (
          <div className="flex items-center gap-2 text-slate-400 text-sm">
            <LoaderCircle size={16} className="animate-spin" /> Carregando...
          </div>
        ) : errCurrent ? (
          <span className="text-red-400 text-sm">Erro ao carregar.</span>
        ) : latest ? (
          <>
            <p className="text-4xl font-bold text-white">{brl(latest.valor)}</p>
            <p className="text-slate-500 text-xs mt-2">Vigência: {latest.data}</p>
          </>
        ) : null}
      </div>

      {/* Histórico */}
      <div className="bg-slate-900 border border-slate-700 rounded-xl p-6">
        <h2 className="text-yellow-500 font-semibold text-sm uppercase tracking-wider mb-4">Histórico</h2>
        {loadingHistory ? (
          <div className="flex items-center gap-2 text-slate-400 text-sm">
            <LoaderCircle size={16} className="animate-spin" /> Carregando...
          </div>
        ) : errHistory ? (
          <span className="text-red-400 text-sm">Erro ao carregar histórico.</span>
        ) : history ? (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-700">
                  <th className="text-left py-2 px-3 text-slate-400 font-medium">Vigência</th>
                  <th className="text-right py-2 px-3 text-slate-400 font-medium">Valor</th>
                </tr>
              </thead>
              <tbody>
                {[...history].reverse().map((item, i) => (
                  <tr key={i} className="border-b border-slate-800 hover:bg-slate-800 transition-colors">
                    <td className="py-2 px-3 text-slate-300">{item.data}</td>
                    <td className="py-2 px-3 text-right font-mono text-white">{brl(item.valor)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : null}
      </div>
    </div>
  );
}