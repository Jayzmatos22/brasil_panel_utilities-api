// API: Alpha Vantage
// Endpoints consumidos:
//   GET /stocks/quote/{symbol} → useStockQuote(symbol)

import { useState, type ChangeEvent, type FormEvent } from 'react';
import { LoaderCircle, Search, TrendingUp, TrendingDown } from 'lucide-react';
import { useStockQuote } from '../../../hooks/UseStocks';

export default function AcoesPage() {
  const [input, setInput]   = useState('');
  const [symbol, setSymbol] = useState('');

  const { data: stock, isLoading, error, isFetching } = useStockQuote(symbol);

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    if (input.trim()) setSymbol(input.trim().toUpperCase());
  };

  const positive = stock && stock.change >= 0;

  return (
    <div className="flex flex-col gap-6">
      <h1 className="text-2xl font-bold text-white">Cotação de Ações</h1>

      {/* Busca */}
      <form onSubmit={handleSubmit} className="flex gap-2 max-w-sm">
        <input
          value={input}
          onChange={(e: ChangeEvent<HTMLInputElement>) => setInput(e.target.value)}
          placeholder="Ex: AAPL, PETR4.SAO"
          className="flex-1 h-10 px-3 rounded-md bg-slate-800 text-white border border-slate-600
                     placeholder-slate-500 outline-none focus:ring-2 focus:ring-yellow-500 transition-all text-sm"
        />
        <button
          type="submit"
          className="h-10 px-4 bg-yellow-500 hover:bg-yellow-600 text-white rounded-md
                     flex items-center gap-2 font-semibold text-sm transition-all active:scale-95"
        >
          <Search size={15} />
          Buscar
        </button>
      </form>

      {/* Loading */}
      {(isLoading || isFetching) && symbol && (
        <div className="flex items-center gap-2 text-slate-400 text-sm">
          <LoaderCircle size={16} className="animate-spin" />
          Buscando {symbol}...
        </div>
      )}

      {/* Erro */}
      {error && (
        <div className="text-red-400 text-sm">Erro ao buscar {symbol}. Verifique o símbolo.</div>
      )}

      {/* Card de cotação */}
      {stock && !isLoading && (
        <div className="bg-slate-900 border border-slate-700 rounded-xl p-6 max-w-md flex flex-col gap-4">
          <div className="flex items-center justify-between">
            <h2 className="text-white font-bold text-xl">{stock.symbol}</h2>
            <span className={`flex items-center gap-1 text-sm font-semibold ${positive ? 'text-green-400' : 'text-red-400'}`}>
              {positive ? <TrendingUp size={16} /> : <TrendingDown size={16} />}
              {stock.changePercent}
            </span>
          </div>

          <p className="text-4xl font-bold text-white">
            ${stock.price.toFixed(2)}
          </p>

          <div className="grid grid-cols-2 gap-2 text-sm">
            {[
              ['Abertura',       `$${stock.open.toFixed(2)}`],
              ['Fechamento ant', `$${stock.previousClose.toFixed(2)}`],
              ['Máxima',         `$${stock.high.toFixed(2)}`],
              ['Mínima',         `$${stock.low.toFixed(2)}`],
              ['Variação',       `${stock.change >= 0 ? '+' : ''}${stock.change.toFixed(2)}`],
              ['Volume',         stock.volume.toLocaleString('pt-BR')],
            ].map(([label, value]) => (
              <div key={label} className="flex justify-between bg-slate-800 rounded px-3 py-2">
                <span className="text-slate-400">{label}</span>
                <span className="text-white font-mono">{value}</span>
              </div>
            ))}
          </div>

          <p className="text-slate-500 text-xs">Último pregão: {stock.latestTradingDay}</p>
        </div>
      )}

      {!symbol && (
        <p className="text-slate-500 text-sm">Digite um símbolo para buscar a cotação.</p>
      )}
    </div>
  );
}