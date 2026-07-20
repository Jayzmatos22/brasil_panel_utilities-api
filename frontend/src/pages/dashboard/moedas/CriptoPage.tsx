// API: CoinGecko
// Endpoints consumidos:
//   GET /crypto/market      → useCryptoMarket()
//   GET /crypto/name/{name} → useCryptoByName(name)

import { useState, useMemo, useEffect, type ChangeEvent } from 'react';
import { motion } from 'motion/react';
import { LoaderCircle, TrendingUp, TrendingDown, Search, BarChart3, Minus } from 'lucide-react';
import { useCryptoMarket, useCryptoByName } from '../../../hooks/UseCrypto';
import { BarChartEcharts } from '../../../components/charts/BarChartEcharts';
import { AnimatedNumber } from '../../../components/AnimatedNumber';
import { container, item } from '../../../lib/motion/presets';

// ============================================================================
// 1. IMPORTAÇÃO DINÂMICA DE IMAGENS (Padrão)
// ============================================================================
const CRIPTO_IMAGES = import.meta.glob(
  "../../../assets/criptomoedas/*.{jpeg,jpg,png,webp,avif}", 
  { eager: true, import: 'default' }
) as Record<string, string>;

const bannerImage = Object.values(CRIPTO_IMAGES)[0];

// ============================================================================
// PÁGINA PRINCIPAL
// ============================================================================
export default function CriptoPage() {
  const [search, setSearch] = useState('');
  const [debounced, setDebounced] = useState('');
  
  useEffect(() => {
    const t = setTimeout(() => setDebounced(search.trim().toLowerCase()), 400);
    return () => clearTimeout(t);
  }, [search]);

  const { data: market,    isLoading: loadingMarket } = useCryptoMarket();
  const { data: byName,    isLoading: loadingByName, isError: byNameError } = useCryptoByName(debounced);

  const brl = (v: number) =>
    v.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL', maximumFractionDigits: 6 });

  const compact = (v: number) =>
    new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL', notation: 'compact' }).format(v);

  const pct = (v: number) => 
    typeof v === 'number' ? `${v >= 0 ? '+' : ''}${v.toFixed(2)}%` : '-';

  const { gainers, losers, topCap } = useMemo(() => {
    if (!market) return { gainers: [], losers: [], topCap: [] };
    
    const validChanges = [...market].filter((c) => typeof c.priceChange24h === 'number');
    const byChange = validChanges.sort((a, b) => b.priceChange24h - a.priceChange24h);
    
    return {
      gainers: byChange.slice(0, 10).map((c) => ({ label: c.symbol.toUpperCase(), value: c.priceChange24h })),
      losers: byChange.slice(-10).map((c) => ({ label: c.symbol.toUpperCase(), value: c.priceChange24h })),
      topCap: [...market]
        .sort((a, b) => b.marketCap - a.marketCap)
        .slice(0, 10)
        .map((c) => ({ label: c.symbol.toUpperCase(), value: c.marketCap })),
    };
  }, [market]);

  return (
    <motion.div className="flex flex-col gap-6" variants={container} initial="hidden" animate="show">
      
      {/* HEADER DINÂMICO SPLIT-VIEW (Card colado) */}
      <motion.div 
        variants={item} 
        // Retiramos o p-6 daqui e usamos flex-col/row direto na raiz para as "metades" ocuparem tudo
        className="relative overflow-hidden rounded-xl border-3 border-blue-500 flex flex-col md:flex-row min-h-[200px] float-card border-b-3 group"
      >
        {/* Fundo da imagem global */}
        {bannerImage ? (
          <div className="absolute inset-0 z-0 pointer-events-none">
            <img 
              src={bannerImage} 
              alt="Banner Criptomoedas" 
              className="w-full h-full object-cover opacity-100 transition-transform duration-700 group-hover:scale-105" 
            />
            <div className="absolute inset-0 bg-linear-to-r from-slate-950/95 via-slate-900/80 to-slate-900/30" />
          </div>
        ) : (
          <div className="absolute inset-0 z-0 bg-slate-900 pointer-events-none" />
        )}

        {/* Metade Esquerda: Títulos (com padding interno próprio) */}
        <div className="relative z-10 flex-1 flex flex-col justify-center p-6 md:p-8">
          <h1 className="text-2xl md:text-3xl font-bold text-white">Criptomoedas</h1>
          <p className="text-slate-300 text-sm mt-1 max-w-xl">
            Cotações e tendências do mercado global em tempo real
          </p>
        </div>

        {/* Metade Direita: Card de Busca (Colado no topo, base e direita) */}
        <div className="relative z-10 w-full md:w-80 lg:w-96 bg-slate-950/60 backdrop-blur-sm border-t md:border-t-0 md:border-l
                         border-slate-500/30 p-6 flex flex-col justify-center gap-3 shrink-0 ">
          <h2 className="text-yellow-400 font-semibold text-xs uppercase tracking-wider">Buscar por Nome</h2>
          <div className="relative">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-900" />
            <input
              value={search}
              onChange={(e: ChangeEvent<HTMLInputElement>) => setSearch(e.target.value)}
              placeholder="Ex: bitcoin, ethereum..."
              className="w-full h-9 pl-9 pr-3 rounded-md bg-slate-900/80 text-black border border-slate-700
                         placeholder-slate-500 outline-none focus:ring-2 bg-white focus:ring-yellow-500 transition-all text-sm"
            />
          </div>
          
          {/* Resultados e feedbacks */}
          {loadingByName && debounced && (
            <div className="flex items-center gap-2 text-slate-300 text-xs">
              <LoaderCircle size={12} className="animate-spin" /> Buscando...
            </div>
          )}
          {byNameError && debounced && !loadingByName && (
            <span className="text-red-400 text-xs">Criptomoeda "{debounced}" não encontrada.</span>
          )}
          {byName && typeof byName.priceBrl === 'number' && (
            <motion.div
              initial={{ opacity: 0, scale: 0.96 }}
              animate={{ opacity: 1, scale: 1 }}
              className="flex justify-between items-center bg-cyan-950 rounded-md px-3 py-2 border border-slate-500 mt-1"
            >
              <span className="text-white font-medium text-xs uppercase">{byName.id}</span>
              <span className="text-green-400 font-mono font-bold text-sm">
                <AnimatedNumber value={byName.priceBrl} format={brl} />
              </span>
            </motion.div>
          )}
        </div>
      </motion.div>

      {/* Top 100 */}
      <motion.div variants={item} whileHover={{ y: -4 }} className="bg-slate-900 border border-slate-700 rounded-xl p-5">
        <h2 className="text-yellow-500 font-semibold text-sm uppercase tracking-wider mb-4">
          Top 100 por Market Cap
        </h2>

        {loadingMarket ? (
          <div className="flex items-center gap-2 text-slate-400 text-sm">
            <LoaderCircle size={16} className="animate-spin" /> Carregando mercado...
          </div>
        ) : market ? (
          <div className="overflow-x-auto">
            <table className="w-full text-sm ">
              <thead>
                <tr className="border-b-2 border-white/20 rounded-lg bg-slate-950">
                  <th className="text-left py-2 px-3 text-slate-500 font-medium">#</th>
                  <th className="text-left py-2 px-3 text-blue-500 font-medium">Moeda</th>
                  <th className="text-right py-2 px-3 text-green-500 font-medium">Preço (BRL)</th>
                  <th className="text-right py-2 px-3 text-red-500 font-medium">Market Cap</th>
                  <th className="text-right py-2 px-3 text-blue-500 font-medium">24h</th>
                </tr>
              </thead>
              <tbody>
                {market.map((coin, i) => {
                  const hasPriceChange = typeof coin.priceChange24h === 'number';
                  const up = hasPriceChange && coin.priceChange24h >= 0;

                  return (
                    <tr key={coin.id} className="border-b border-slate-800 hover:bg-slate-800 transition-colors">
                      <td className="py-2 px-3 text-slate-500">{i + 1}</td>
                      <td className="py-2 px-3">
                        <div className="flex items-center gap-2">
                          <img src={coin.imageUrl} alt={coin.name} className="w-5 h-5 rounded-full" />
                          <span className="text-white font-medium">{coin.name}</span>
                          <span className="text-slate-500 uppercase">{coin.symbol}</span>
                        </div>
                      </td>
                      <td className="py-2 px-3 text-right font-mono text-white">{brl(coin.currentPrice)}</td>
                      <td className="py-2 px-3 text-right font-mono text-slate-300">{compact(coin.marketCap)}</td>
                      
                      <td className={`py-2 px-3 text-right font-mono flex items-center justify-end gap-1 ${
                        !hasPriceChange ? 'text-slate-500' : up ? 'text-green-400' : 'text-red-400'
                      }`}>
                        {hasPriceChange ? (
                          <>
                            {up ? <TrendingUp size={13} /> : <TrendingDown size={13} />}
                            {up ? '+' : ''}{coin.priceChange24h.toFixed(2)}%
                          </>
                        ) : (
                          <>
                            <Minus size={13} /> N/A
                          </>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        ) : null}
      </motion.div>

      {/* Comparativos (24h) */}
      <motion.div variants={item} className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Card: Maiores Altas */}
        <motion.div whileHover={{ y: -4 }} className="bg-white/85 border border-slate-200 shadow-sm rounded-xl p-5 flex flex-col gap-4">
          <div className="flex items-center gap-2">
            <span className="text-green-600"><TrendingUp size={15} /></span>
            <h2 className="text-green-600 font-semibold text-sm uppercase tracking-wider">Maiores altas (24h)</h2>
          </div>
          {loadingMarket ? (
            <div className="flex items-center gap-2 text-slate-500 text-sm">
              <LoaderCircle size={16} className="animate-spin" /> Carregando...
            </div>
          ) : gainers.length ? (
            <BarChartEcharts items={gainers} color="#16a34a" valueFormatter={pct} />
          ) : (
            <p className="text-slate-500 text-sm">Sem dados.</p>
          )}
        </motion.div>

        {/* Card: Maiores Quedas */}
        <motion.div whileHover={{ y: -4 }} className="bg-white/85 border border-slate-200 shadow-sm rounded-xl p-5 flex flex-col gap-4">
          <div className="flex items-center gap-2">
            <span className="text-red-600"><TrendingDown size={15} /></span>
            <h2 className="text-red-700 font-semibold text-sm uppercase tracking-wider">Maiores quedas (24h)</h2>
          </div>
          {loadingMarket ? (
            <div className="flex items-center gap-2 text-slate-500 text-sm">
              <LoaderCircle size={16} className="animate-spin" /> Carregando...
            </div>
          ) : losers.length ? (
            <BarChartEcharts items={losers} color="#dc2626" valueFormatter={pct} />
          ) : (
            <p className="text-slate-500 text-sm">Sem dados.</p>
          )}
        </motion.div>
      </motion.div>

      {/* Card: Top 10 por market cap */}
      <motion.div variants={item} whileHover={{ y: -4 }} className="bg-white border border-slate-200 shadow-sm rounded-xl p-5 flex flex-col gap-4 mt-2">
        <div className="flex items-center gap-2">
          <span className="text-blue-600"><BarChart3 size={15} /></span>
          <h2 className="text-blue-700 font-semibold text-sm uppercase tracking-wider">Top 10 por market cap</h2>
        </div>
        {loadingMarket ? (
          <div className="flex items-center gap-2 text-slate-500 text-sm">
            <LoaderCircle size={16} className="animate-spin" /> Carregando...
          </div>
        ) : topCap.length ? (
          <BarChartEcharts items={topCap} color="#2563eb" valueFormatter={compact} />
        ) : (
          <p className="text-slate-500 text-sm">Sem dados.</p>
        )}
      </motion.div>
    </motion.div>
  );
}