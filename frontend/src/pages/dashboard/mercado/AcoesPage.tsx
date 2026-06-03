// API: Alpha Vantage
// Endpoints consumidos:
//   GET /stocks/quote/{symbol} → useStockQuote(symbol)

import { useState, type ChangeEvent, type FormEvent } from 'react';
import { motion } from 'motion/react';
import { LoaderCircle, Search, TrendingUp, TrendingDown } from 'lucide-react';
import { useStockQuote, useStockHistory } from '../../../hooks/UseStocks';
import { LineChartEcharts } from '../../../components/charts/LineChartEcharts';
import { AnimatedNumber } from '../../../components/AnimatedNumber';
import { container, item } from '../../../lib/motion/presets';

export default function AcoesPage() {
  const [input, setInput]   = useState('');
  const [symbol, setSymbol] = useState('');

  const { data: stock, isLoading, error, isFetching } = useStockQuote(symbol);
  const { data: history, isLoading: loadingHistory } = useStockHistory(symbol);

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    if (input.trim()) setSymbol(input.trim().toUpperCase());
  };

  const positive = stock && stock.change >= 0;

  return (
    <motion.div className="flex flex-col gap-6" variants={container} initial="hidden" animate="show">
      <motion.h1 variants={item} className="text-2xl font-bold text-white">Cotação de Ações</motion.h1>

      {/* Busca */}
      <motion.form variants={item} onSubmit={handleSubmit} className="flex gap-2 max-w-sm">
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
      </motion.form>

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
        <motion.div variants={item} whileHover={{ y: -4 }} className="bg-slate-900 border border-slate-700 rounded-xl p-6 max-w-md flex flex-col gap-4">
          <div className="flex items-center justify-between">
            <h2 className="text-white font-bold text-xl">{stock.symbol}</h2>
            <span className={`flex items-center gap-1 text-sm font-semibold ${positive ? 'text-green-400' : 'text-red-400'}`}>
              {positive ? <TrendingUp size={16} /> : <TrendingDown size={16} />}
              {stock.changePercent}
            </span>
          </div>

          <p className="text-4xl font-bold text-white">
            <AnimatedNumber value={stock.price} format={(v) => `$${v.toFixed(2)}`} />
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
        </motion.div>
      )}

      {/* Histórico — fechamento ao longo do tempo */}
      {symbol && !error && (
        <motion.div variants={item} whileHover={{ y: -4 }} className="bg-slate-900 border border-slate-700 rounded-xl p-6">
          <h2 className="text-yellow-500 font-semibold text-sm uppercase tracking-wider mb-4">
            Histórico — {symbol}
          </h2>

          {loadingHistory ? (
            <div className="flex items-center gap-2 text-slate-400 text-sm">
              <LoaderCircle size={16} className="animate-spin" /> Carregando histórico...
            </div>
          ) : history && history.data.length > 0 ? (
            <LineChartEcharts points={history.data.map((p) => ({ date: p.date, value: p.close }))} color="#3b82f6" />
          ) : (
            <p className="text-slate-500 text-sm">Sem histórico disponível para {symbol}.</p>
          )}
        </motion.div>
      )}

      {!symbol && (
        <p className="text-slate-500 text-sm">Digite um símbolo para buscar a cotação.</p>
      )}
    </motion.div>
  );
}