// Duas fontes de criptomoedas, explicitas e alternaveis pelo usuario:
//   CoinGecko     → GET /api/coingecko           | GET /api/coingecko/{name}
//   CoinMarketCap → GET /api/coinmarketcap       | GET /api/coinmarketcap/{term}
//
// Ambas sao servidas de snapshots do backend, entao trocar de fonte nao dispara
// chamada a API externa. A CoinMarketCap ainda traz variacao de 1h e 7d.

import { useState, useMemo, useEffect, type ChangeEvent } from 'react';
import { motion } from 'motion/react';
import { LoaderCircle, TrendingUp, TrendingDown, Search, BarChart3, Minus } from 'lucide-react';
import { useCryptoMarket, useCryptoByName } from '../../../hooks/UseCrypto';
import { useCmcMarket, useCmcByTerm } from '../../../hooks/UseCmcCrypto';
import type { CryptoSource, CryptoRow } from '../../../types/CriptoType';
import { BarChartEcharts } from '../../../components/charts/BarChartEcharts';
import { formatSignedPercent } from '../../../components/charts/chartTheme';
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
const SOURCE_LABEL: Record<CryptoSource, string> = {
  coingecko: 'CoinGecko',
  coinmarketcap: 'CoinMarketCap',
};

/** "há 4 min" — deixa explicito que o dado vem de um snapshot, nao de chamada ao vivo */
function timeAgo(iso?: string): string | null {
  if (!iso) return null;
  const diffMin = Math.floor((Date.now() - new Date(iso).getTime()) / 60000);
  if (Number.isNaN(diffMin) || diffMin < 0) return null;
  if (diffMin < 1) return 'agora';
  if (diffMin < 60) return `há ${diffMin} min`;
  return `há ${Math.floor(diffMin / 60)} h`;
}

export default function CriptoPage() {
  const [search, setSearch] = useState('');
  const [debounced, setDebounced] = useState('');
  const [source, setSource] = useState<CryptoSource>('coingecko');

  const isCmc = source === 'coinmarketcap';

  useEffect(() => {
    const t = setTimeout(() => setDebounced(search.trim().toLowerCase()), 400);
    return () => clearTimeout(t);
  }, [search]);

  // Só a fonte ativa fica habilitada — evita manter duas queries girando à toa.
  const { data: geckoMarket, isLoading: loadingGecko } = useCryptoMarket();
  const { data: cmcMarket,   isLoading: loadingCmc   } = useCmcMarket(isCmc);

  const { data: geckoByName, isLoading: loadingGeckoName, isError: geckoNameError } =
    useCryptoByName(isCmc ? '' : debounced);
  const { data: cmcByTerm,   isLoading: loadingCmcName,  isError: cmcNameError } =
    useCmcByTerm(debounced, isCmc);

  const loadingMarket = isCmc ? loadingCmc : loadingGecko;
  const loadingByName = isCmc ? loadingCmcName : loadingGeckoName;
  const byNameError   = isCmc ? cmcNameError : geckoNameError;

  // Preço da busca: a CMC devolve a moeda inteira, o CoinGecko só id + preço.
  const searchResult = isCmc
    ? (cmcByTerm ? { label: cmcByTerm.symbol, price: cmcByTerm.currentPrice } : null)
    : (geckoByName && typeof geckoByName.priceBrl === 'number'
        ? { label: geckoByName.id, price: geckoByName.priceBrl }
        : null);

  // Fonte da verdade da tabela: as duas fontes viram a mesma linha normalizada,
  // com os campos exclusivos da CMC opcionais.
  const rows: CryptoRow[] = useMemo(() => {
    if (isCmc) {
      return (cmcMarket ?? []).map((c) => ({
        key: String(c.id),
        symbol: c.symbol,
        name: c.name,
        imageUrl: c.imageUrl,
        currentPrice: c.currentPrice,
        marketCap: c.marketCap,
        priceChange24h: c.percentChange24h,
        percentChange1h: c.percentChange1h,
        percentChange7d: c.percentChange7d,
      }));
    }
    return (geckoMarket ?? []).map((c) => ({
      key: c.id,
      symbol: c.symbol,
      name: c.name,
      imageUrl: c.imageUrl,
      currentPrice: c.currentPrice,
      marketCap: c.marketCap,
      priceChange24h: c.priceChange24h,
    }));
  }, [isCmc, cmcMarket, geckoMarket]);

  const updatedAt = isCmc ? timeAgo(cmcMarket?.[0]?.fetchedAt) : null;

  // A CoinMarketCap devolve currentPrice e marketCap nulos em moedas que não
  // cota (ex.: BT / Bozkurt Token). Os formatadores aceitam null e devolvem um
  // travessão, em vez de estourar no `.toLocaleString()` de null e derrubar a
  // página inteira para o ErrorBoundary.
  const brl = (v: number | null | undefined) =>
    typeof v === 'number'
      ? v.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL', maximumFractionDigits: 6 })
      : '—';

  const compact = (v: number | null | undefined) =>
    typeof v === 'number'
      ? new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL', notation: 'compact' }).format(v)
      : '—';

  // Delega ao formatador da camada de gráficos. O `toFixed(2)` que existia
  // aqui tinha dois problemas: produzia ponto decimal ("+2.00%") numa interface
  // em pt-BR, e as duas casas alongavam o rótulo o bastante para os ticks do
  // eixo colidirem em 368px. Uma casa decimal basta para variação diária.
  const pct = (v: number) =>
    typeof v === 'number' ? formatSignedPercent(v) : '-';

  const { gainers, losers, topCap } = useMemo(() => {
    if (!rows.length) return { gainers: [], losers: [], topCap: [] };

    const validChanges = rows.filter((c) => typeof c.priceChange24h === 'number');
    const byChange = [...validChanges].sort((a, b) => b.priceChange24h - a.priceChange24h);

    return {
      gainers: byChange.slice(0, 10).map((c) => ({ label: c.symbol.toUpperCase(), value: c.priceChange24h })),
      losers: byChange.slice(-10).map((c) => ({ label: c.symbol.toUpperCase(), value: c.priceChange24h })),
      // Predicado de tipo em vez de filtro booleano: sem ele o TypeScript não
      // estreita e `marketCap` seguiria `number | null` no sort e no map.
      // Moeda sem market cap não pertence a um ranking por market cap.
      topCap: rows
        .filter((c): c is CryptoRow & { marketCap: number } => typeof c.marketCap === 'number')
        .sort((a, b) => b.marketCap - a.marketCap)
        .slice(0, 10)
        .map((c) => ({ label: c.symbol.toUpperCase(), value: c.marketCap })),
    };
  }, [rows]);

  return (
    <motion.div className="@container/page flex flex-col gap-6" variants={container} initial="hidden" animate="show">
      
      {/* HEADER DINÂMICO SPLIT-VIEW (Card colado) */}
      <motion.div 
        variants={item} 
        // Retiramos o p-6 daqui e usamos flex-col/row direto na raiz para as "metades" ocuparem tudo
        className="relative overflow-hidden rounded-card border-3 border-blue-500 flex flex-col @3xl/page:flex-row min-h-50 float-card border-b-3 group"
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
        <div className="relative z-10 min-w-0 flex-1 flex flex-col justify-center p-card">
          <h1 className="text-title font-bold text-white">Criptomoedas</h1>
          <p className="text-slate-300 text-sm mt-1 max-w-xl">
            Cotações e tendências do mercado global em tempo real
          </p>

          {/* Seletor de fonte — as duas convivem, nunca se substituem. Preços
              divergem entre elas por metodologia, então a origem fica sempre visível. */}
          <div className="mt-4 flex flex-wrap items-center gap-3">
            <div
              role="group"
              aria-label="Fonte de dados"
              className="inline-flex rounded-lg border border-slate-600/70 bg-slate-950/70 p-1 backdrop-blur-sm"
            >
              {(Object.keys(SOURCE_LABEL) as CryptoSource[]).map((key) => {
                const active = source === key;
                return (
                  <button
                    key={key}
                    type="button"
                    onClick={() => setSource(key)}
                    aria-pressed={active}
                    className={`px-3 py-1.5 text-xs font-semibold rounded-md transition-all cursor-pointer coarse:min-h-11
                      focus:outline-none focus-visible:ring-2 focus-visible:ring-yellow-400
                      ${active
                        ? 'bg-yellow-400 text-slate-900 shadow-sm'
                        : 'text-slate-300 hover:text-white hover:bg-slate-800/70'}`}
                  >
                    {SOURCE_LABEL[key]}
                  </button>
                );
              })}
            </div>

            {updatedAt && (
              <span className="text-[11px] text-slate-400">
                snapshot atualizado {updatedAt}
              </span>
            )}
          </div>
        </div>

        {/* Metade Direita: Card de Busca (Colado no topo, base e direita) */}
        <div className="relative z-10 w-full @3xl/page:w-80 @5xl/page:w-96 bg-slate-950/60 backdrop-blur-sm border-t @3xl/page:border-t-0 @3xl/page:border-l
                         border-slate-500/30 p-card flex flex-col justify-center gap-3 shrink-0 ">
          <h2 className="text-yellow-400 font-semibold text-xs uppercase tracking-wider">Buscar por Nome</h2>
          <div className="relative">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-900" />
            <input
              value={search}
              onChange={(e: ChangeEvent<HTMLInputElement>) => setSearch(e.target.value)}
              placeholder="Ex: bitcoin, ethereum..."
              className="w-full h-9 coarse:min-h-11 pl-9 pr-3 rounded-md bg-slate-900/80 text-black border border-slate-700
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
          {searchResult && (
            <motion.div
              initial={{ opacity: 0, scale: 0.96 }}
              animate={{ opacity: 1, scale: 1 }}
              className="flex justify-between items-center bg-cyan-950 rounded-md px-3 py-2 border border-slate-500 mt-1"
            >
              <span className="text-white font-medium text-xs uppercase">{searchResult.label}</span>
              <span className="text-green-400 font-mono font-bold text-sm">
                {typeof searchResult.price === 'number' ? (
                  <AnimatedNumber value={searchResult.price} format={brl} />
                ) : (
                  <span className="text-slate-400 font-normal">sem cotação</span>
                )}
              </span>
            </motion.div>
          )}
        </div>
      </motion.div>

      {/* Top 100 */}
      <motion.div variants={item} whileHover={{ y: -4 }} className="bg-slate-900 border border-slate-700 rounded-xl p-5">
        <div className="flex items-center justify-between mb-4 gap-3 flex-wrap">
          <h2 className="text-yellow-500 font-semibold text-sm uppercase tracking-wider">
            Top 100 por Market Cap
          </h2>
          <span className="text-[11px] font-medium text-slate-400 border border-slate-700 rounded-full px-2.5 py-1">
            fonte: {SOURCE_LABEL[source]}
          </span>
        </div>

        {loadingMarket ? (
          <div className="flex items-center gap-2 text-slate-400 text-sm">
            <LoaderCircle size={16} className="animate-spin" /> Carregando mercado...
          </div>
        ) : !rows.length ? (
          <p className="text-slate-400 text-sm">
            {isCmc
              ? 'Fonte CoinMarketCap indisponível — verifique se a chave da API está configurada no backend.'
              : 'Sem dados.'}
          </p>
        ) : (
          // 7 colunas (fonte CoinMarketCap) em 343px davam ~49px cada, e o
          // overflow-x-auto não funcionava por causa do w-full. Agora: largura
          // mínima real + as duas colunas menos essenciais escondidas em
          // container estreito — mesma estratégia de AdminUsersPage e
          // BancosPage, que já faziam isso.
          <div className="overflow-x-auto overscroll-x-contain">
            <table className="w-full min-w-3xl text-sm ">
              <thead>
                <tr className="border-b-2 border-white/20 rounded-lg bg-slate-950">
                  <th className="text-left py-2 px-3 text-slate-500 font-medium">#</th>
                  <th className="text-left py-2 px-3 text-blue-500 font-medium">Moeda</th>
                  <th className="text-right py-2 px-3 text-green-500 font-medium">Preço (BRL)</th>
                  <th className="text-right py-2 px-3 text-red-500 font-medium">Market Cap</th>
                  {isCmc && <th className="hidden @3xl/page:table-cell text-right py-2 px-3 text-blue-400 font-medium">1h</th>}
                  <th className="text-right py-2 px-3 text-blue-500 font-medium">24h</th>
                  {isCmc && <th className="hidden @3xl/page:table-cell text-right py-2 px-3 text-blue-400 font-medium">7d</th>}
                </tr>
              </thead>
              <tbody>
                {rows.map((coin, i) => {
                  const hasPriceChange = typeof coin.priceChange24h === 'number';
                  const up = hasPriceChange && coin.priceChange24h >= 0;

                  return (
                    <tr key={coin.key} className="border-b border-slate-800 hover:bg-slate-800 transition-colors">
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

                      {isCmc && (
                        <td className={`hidden @3xl/page:table-cell py-2 px-3 text-right font-mono ${
                          typeof coin.percentChange1h !== 'number' ? 'text-slate-500'
                            : coin.percentChange1h >= 0 ? 'text-green-400' : 'text-red-400'
                        }`}>
                          {typeof coin.percentChange1h === 'number' ? pct(coin.percentChange1h) : '—'}
                        </td>
                      )}

                      {/* O `flex` estava na <td>, o que quebra o modelo de
                          tabela: a célula deixa de participar da largura da
                          coluna. Vai para um <span> interno. */}
                      <td className={`py-2 px-3 text-right font-mono ${
                        !hasPriceChange ? 'text-slate-500' : up ? 'text-green-400' : 'text-red-400'
                      }`}>
                        <span className="flex items-center justify-end gap-1">
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
                        </span>
                      </td>

                      {isCmc && (
                        <td className={`hidden @3xl/page:table-cell py-2 px-3 text-right font-mono ${
                          typeof coin.percentChange7d !== 'number' ? 'text-slate-500'
                            : coin.percentChange7d >= 0 ? 'text-green-400' : 'text-red-400'
                        }`}>
                          {typeof coin.percentChange7d === 'number' ? pct(coin.percentChange7d) : '—'}
                        </td>
                      )}
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </motion.div>

      {/* Comparativos (24h) */}
      <motion.div variants={item} className="grid-auto-cards gap-4 [--card-min:20rem]">
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