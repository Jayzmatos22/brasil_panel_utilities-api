// API: Alpha Vantage
// Endpoints consumidos:
//   GET /stocks/quote/{symbol}   → useStockQuote(symbol)
//   GET /stocks/history/{symbol} → useStockHistory(symbol)

import { useState, type ChangeEvent, type FormEvent } from 'react';
import { motion } from 'motion/react';
import { LoaderCircle, Search, TrendingUp, TrendingDown, Ban, AlertCircle } from 'lucide-react';
import { useStockQuote, useStockHistory } from '../../../hooks/UseStocks';
import { LineChartEcharts } from '../../../components/charts/LineChartEcharts';
import { AnimatedNumber } from '../../../components/AnimatedNumber';
import { container, item } from '../../../lib/motion/presets';
import { ApiError } from '../../../lib/errors/ErrorsHttp';

const isRateLimit = (err: unknown): boolean =>
  err instanceof ApiError && err.status === 429;

const ACOES_IMAGES = import.meta.glob(
  '../../../assets/acoes/*.{jpeg,jpg,png,webp,avif}',
  { eager: true, import: 'default' },
) as Record<string, string>;
const acoesImage = Object.values(ACOES_IMAGES)[0];

export default function AcoesPage() {
  const [input, setInput]   = useState('');
  const [symbol, setSymbol] = useState('');

  const { data: stock, isLoading, error, isFetching } = useStockQuote(symbol);
  const { data: history, isLoading: loadingHistory }  = useStockHistory(symbol);

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    if (input.trim()) setSymbol(input.trim().toUpperCase());
  };

  const positive = stock && stock.change >= 0;

  return (
    <motion.div className="flex flex-col gap-6" variants={container} initial="hidden" animate="show">

      <motion.h1 variants={item} className="text-2xl font-bold text-white">
        Cotação de Ações
      </motion.h1>

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
          className="h-10 px-4 bg-yellow-500 hover:bg-yellow-600 cursor-pointer text-white rounded-md
                     flex items-center gap-2 font-semibold text-sm transition-all active:scale-95 hover:scale-105"
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
        isRateLimit(error) ? (
          <div className="flex items-start gap-3 bg-amber-500/10 border border-amber-500/30 rounded-lg p-4 max-w-md">
            <Ban size={18} className="text-amber-400 shrink-0 mt-0.5" />
            <div className="flex flex-col gap-1">
              <span className="text-amber-400 font-semibold text-sm">Busca esgotada por hoje</span>
              <span className="text-slate-400 text-xs leading-relaxed">
                O limite diário de consultas de ações foi atingido. As cotações já
                buscadas continuam disponíveis pelo cache. Tente novos símbolos em 24h.
              </span>
            </div>
          </div>
        ) : (
          <div className="flex items-start gap-3 bg-red-500/10 border border-red-500/30 rounded-lg p-4 max-w-md">
            <AlertCircle size={18} className="text-red-400 shrink-0 mt-0.5" />
            <div className="flex flex-col gap-1">
              <span className="text-red-400 font-semibold text-sm">Símbolo não encontrado</span>
              <span className="text-slate-400 text-xs leading-relaxed">
                Não foi possível encontrar "{symbol}". Verifique o código — ex: AAPL,
                MSFT, PETR4.SAO.
              </span>
            </div>
          </div>
        )
      )}

      {/* Card de cotação */}
      {stock && !isLoading && (
        <motion.div
        variants={item}
        className="flex flex-col lg:flex-row overflow-hidden acoes-card-resultado-busca border border-slate-700 rounded-xl max-w-2xl group transition-all duration-200 hover:border-slate-500"
      >
          {/* Painel da imagem */}
          <div className="relative lg:w-2/5 h-48 lg:h-auto shrink-0 overflow-hidden">
            <div className="absolute inset-0 bg-linear-to-br from-slate-900 to-blue-900" />
            {acoesImage && (
              <img
                src={acoesImage}
                alt="Ações"
                className="absolute inset-0 w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                onError={(e) => { e.currentTarget.style.display = 'none'; }}
              />
            )}
            <div className="absolute inset-0 bg-linear-to-t from-slate-950/70 to-transparent lg:bg-linear-to-r lg:from-transparent lg:to-slate-900/80" />
          </div>

          {/* Conteúdo */}
          <div className="flex-1 p-6 flex flex-col gap-4">
            <div className="flex items-center justify-between">
              <h2 className="text-white font-bold text-xl">{stock.symbol}</h2>
              <span className={`flex items-center gap-1 text-sm font-semibold ${positive ? 'text-green-400' : 'text-red-800/90'}`}>
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
                <div key={label} className="flex justify-between bg-white rounded px-3 py-2">
                  <span className="text-slate-500">{label}</span>
                  <span className="text-slate-700 font-mono">{value}</span>
                </div>
              ))}
            </div>

            <p className="w-fit text-white text-xs px-2 bg-green-950 rounded ring-1 ring-white">Último pregão: {stock.latestTradingDay}</p>
          </div>
        </motion.div>
      )}

      {/* Histórico */}
      {symbol && !error && (
        <motion.div variants={item} whileHover={{ y: -4 }} className="acoes-historico-ticker border border-slate-700 rounded-xl p-6">
          <h2 className="text-yellow-500 font-semibold text-sm uppercase tracking-wider mb-4">
            Histórico — {symbol}
          </h2>

          {loadingHistory ? (
            <div className="flex items-center gap-2 text-slate-400 text-sm">
              <LoaderCircle size={16} className="animate-spin" /> Carregando histórico...
            </div>
          ) : history && history.data.length > 0 ? (
            <LineChartEcharts
              points={history.data.map((p) => ({ date: p.date, value: p.close }))}
              color="#3b82f6"
            />
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