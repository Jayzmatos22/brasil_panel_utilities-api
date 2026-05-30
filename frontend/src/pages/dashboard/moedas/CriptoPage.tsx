// API: CoinGecko
// Endpoints consumidos:
//   GET /crypto/market      → useCryptoMarket()
//   GET /crypto/name/{name} → useCryptoByName(name)

import { useState, type ChangeEvent } from 'react';
import { LoaderCircle, TrendingUp, TrendingDown, Search } from 'lucide-react';
import { useCryptoMarket, useCryptoByName } from '../../../hooks/UseCrypto';

export default function CriptoPage() {
  const [search, setSearch] = useState('');

  const { data: market,    isLoading: loadingMarket } = useCryptoMarket();
  const { data: byName,    isLoading: loadingByName } = useCryptoByName(search.trim().toLowerCase());

  const usd = (v: number) =>
    v.toLocaleString('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 6 });

  const compact = (v: number) =>
    new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', notation: 'compact' }).format(v);

  return (
    <div className="flex flex-col gap-6">
      <h1 className="text-2xl font-bold text-white">Criptomoedas</h1>

      {/* Busca por nome */}
      <div className="bg-slate-900 border border-slate-700 rounded-xl p-5 max-w-md flex flex-col gap-3">
        <h2 className="text-yellow-500 font-semibold text-sm uppercase tracking-wider">Busca por Nome</h2>
        <div className="relative">
          <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
          <input
            value={search}
            onChange={(e: ChangeEvent<HTMLInputElement>) => setSearch(e.target.value)}
            placeholder="Ex: bitcoin, ethereum..."
            className="w-full h-10 pl-9 pr-3 rounded-md bg-slate-800 text-white border border-slate-600
                       placeholder-slate-500 outline-none focus:ring-2 focus:ring-yellow-500 transition-all text-sm"
          />
        </div>
        {loadingByName && search && (
          <div className="flex items-center gap-2 text-slate-400 text-sm">
            <LoaderCircle size={14} className="animate-spin" /> Buscando...
          </div>
        )}
        {byName && (
          <div className="flex justify-between items-center bg-slate-800 rounded-lg px-4 py-3">
            <span className="text-white font-semibold">{byName.id}</span>
            <span className="text-yellow-400 font-mono font-bold">{usd(byName.priceBrl)}</span>
          </div>
        )}
      </div>

      {/* Top 100 */}
      <div className="bg-slate-900 border border-slate-700 rounded-xl p-5">
        <h2 className="text-yellow-500 font-semibold text-sm uppercase tracking-wider mb-4">
          Top 100 por Market Cap
        </h2>

        {loadingMarket ? (
          <div className="flex items-center gap-2 text-slate-400 text-sm">
            <LoaderCircle size={16} className="animate-spin" /> Carregando mercado...
          </div>
        ) : market ? (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-700">
                  <th className="text-left py-2 px-3 text-slate-400 font-medium">#</th>
                  <th className="text-left py-2 px-3 text-slate-400 font-medium">Moeda</th>
                  <th className="text-right py-2 px-3 text-slate-400 font-medium">Preço (USD)</th>
                  <th className="text-right py-2 px-3 text-slate-400 font-medium">Market Cap</th>
                  <th className="text-right py-2 px-3 text-slate-400 font-medium">24h</th>
                </tr>
              </thead>
              <tbody>
                {market.map((coin, i) => {
                  const up = coin.priceChange24h >= 0;
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
                      <td className="py-2 px-3 text-right font-mono text-white">{usd(coin.currentPrice)}</td>
                      <td className="py-2 px-3 text-right font-mono text-slate-300">{compact(coin.marketCap)}</td>
                      <td className={`py-2 px-3 text-right font-mono flex items-center justify-end gap-1 ${up ? 'text-green-400' : 'text-red-400'}`}>
                        {up ? <TrendingUp size={13} /> : <TrendingDown size={13} />}
                        {up ? '+' : ''}{coin.priceChange24h.toFixed(2)}%
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        ) : null}
      </div>
    </div>
  );
}