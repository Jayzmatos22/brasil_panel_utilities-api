// API: Frankfurter
// Endpoints consumidos:
//   GET /frankfurter/rate         → useRateByCoins(from, to, amount)
//   GET /frankfurter/last-30-days → useLast30DaysExchange(from, to)
//   GET /frankfurter/history      → useGetHistoryByCoins(from, to, startDate, endDate)

import { useState, type ChangeEvent } from 'react';
import { LoaderCircle } from 'lucide-react';
import { useRateByCoins, useLast30DaysExchange, useGetHistoryByCoins } from '../../../hooks/UseExchange';

const CURRENCIES = ['BRL', 'USD', 'EUR', 'GBP', 'JPY', 'ARS', 'CLP', 'CAD', 'AUD', 'CHF'];

export default function CambioPage() {
  const [from,   setFrom]   = useState('USD');
  const [to,     setTo]     = useState('BRL');
  const [amount, setAmount] = useState(1);

  const [startDate, setStartDate] = useState('');
  const [endDate,   setEndDate]   = useState('');

  const { data: rate,    isLoading: loadingRate    } = useRateByCoins(from, to, amount);
  const { data: last30,  isLoading: loadingLast30  } = useLast30DaysExchange(from, to);
  const { data: history, isLoading: loadingHistory } = useGetHistoryByCoins(from, to, startDate, endDate);

  const selectClass =
    'h-10 px-3 rounded-md bg-slate-800 text-white border border-slate-600 outline-none focus:ring-2 focus:ring-yellow-500 transition-all text-sm';
  const inputClass =
    'h-10 px-3 rounded-md bg-slate-800 text-white border border-slate-600 outline-none focus:ring-2 focus:ring-yellow-500 transition-all text-sm';

  return (
    <div className="flex flex-col gap-8">
      <h1 className="text-2xl font-bold text-white">Câmbio</h1>

      {/* ── Conversor ── */}
      <div className="bg-slate-900 border border-slate-700 rounded-xl p-6 max-w-lg flex flex-col gap-4">
        <h2 className="text-yellow-500 font-semibold text-sm uppercase tracking-wider">Conversão</h2>

        <div className="flex items-center gap-2 flex-wrap">
          <input
            type="number"
            min={0}
            value={amount}
            onChange={(e: ChangeEvent<HTMLInputElement>) => setAmount(Number(e.target.value))}
            className={`${inputClass} w-24`}
          />
          <select value={from} onChange={(e) => setFrom(e.target.value)} className={selectClass}>
            {CURRENCIES.map(c => <option key={c} value={c}>{c}</option>)}
          </select>
          <span className="text-slate-400">→</span>
          <select value={to} onChange={(e) => setTo(e.target.value)} className={selectClass}>
            {CURRENCIES.map(c => <option key={c} value={c}>{c}</option>)}
          </select>
        </div>

        {loadingRate ? (
          <div className="flex items-center gap-2 text-slate-400 text-sm">
            <LoaderCircle size={16} className="animate-spin" /> Calculando...
          </div>
        ) : rate ? (
          <div>
            <p className="text-3xl font-bold text-white font-mono">
              {rate.rates[to]?.toLocaleString('pt-BR', { minimumFractionDigits: 4 })} {to}
            </p>
            <p className="text-slate-500 text-xs mt-1">Referência: {rate.date}</p>
          </div>
        ) : null}
      </div>

      {/* ── Últimos 30 dias ── */}
      <div className="bg-slate-900 border border-slate-700 rounded-xl p-6">
        <h2 className="text-yellow-500 font-semibold text-sm uppercase tracking-wider mb-4">
          Últimos 30 dias — {from}/{to}
        </h2>

        {loadingLast30 ? (
          <div className="flex items-center gap-2 text-slate-400 text-sm">
            <LoaderCircle size={16} className="animate-spin" /> Carregando...
          </div>
        ) : last30 ? (
          <div className="overflow-x-auto max-h-60 overflow-y-auto">
            <table className="w-full text-sm">
              <thead className="sticky top-0 bg-slate-900">
                <tr className="border-b border-slate-700">
                  <th className="text-left py-2 px-3 text-slate-400 font-medium">Data</th>
                  <th className="text-right py-2 px-3 text-slate-400 font-medium">Taxa</th>
                </tr>
              </thead>
              <tbody>
                {[...last30.data].reverse().map((item) => (
                  <tr key={item.date} className="border-b border-slate-800 hover:bg-slate-800 transition-colors">
                    <td className="py-2 px-3 text-slate-300">{item.date}</td>
                    <td className="py-2 px-3 text-right font-mono text-white">
                      {item.rate.toLocaleString('pt-BR', { minimumFractionDigits: 4 })}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : null}
      </div>

      {/* ── Histórico por período ── */}
      <div className="bg-slate-900 border border-slate-700 rounded-xl p-6">
        <h2 className="text-yellow-500 font-semibold text-sm uppercase tracking-wider mb-4">
          Histórico por Período
        </h2>

        <div className="flex items-center gap-3 flex-wrap mb-4">
          <div className="flex flex-col gap-1">
            <label className="text-slate-400 text-xs">Data inicial</label>
            <input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} className={inputClass} />
          </div>
          <div className="flex flex-col gap-1">
            <label className="text-slate-400 text-xs">Data final</label>
            <input type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} className={inputClass} />
          </div>
        </div>

        {loadingHistory ? (
          <div className="flex items-center gap-2 text-slate-400 text-sm">
            <LoaderCircle size={16} className="animate-spin" /> Carregando...
          </div>
        ) : history ? (
          <div className="overflow-x-auto max-h-60 overflow-y-auto">
            <table className="w-full text-sm">
              <thead className="sticky top-0 bg-slate-900">
                <tr className="border-b border-slate-700">
                  <th className="text-left py-2 px-3 text-slate-400 font-medium">Data</th>
                  <th className="text-right py-2 px-3 text-slate-400 font-medium">Taxa</th>
                </tr>
              </thead>
              <tbody>
                {[...history.data].reverse().map((item) => (
                  <tr key={item.date} className="border-b border-slate-800 hover:bg-slate-800 transition-colors">
                    <td className="py-2 px-3 text-slate-300">{item.date}</td>
                    <td className="py-2 px-3 text-right font-mono text-white">
                      {item.rate.toLocaleString('pt-BR', { minimumFractionDigits: 4 })}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <p className="text-slate-500 text-sm">Selecione um período para consultar.</p>
        )}
      </div>
    </div>
  );
}
