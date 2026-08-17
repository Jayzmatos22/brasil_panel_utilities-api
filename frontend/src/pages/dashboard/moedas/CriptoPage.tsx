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
import { ScrollHint } from '../../../components/ScrollHint';
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

  // As duas fontes sao servidas de snapshot do backend, entao as duas precisam
  // mostrar a data. Antes so a CMC mostrava, e o CoinGecko — que e a fonte padrao
  // e cuja leitura nao vence nunca no banco — aparecia sem data nenhuma.
  const updatedAt = isCmc
    ? timeAgo(cmcMarket?.[0]?.fetchedAt)
    : timeAgo(geckoMarket?.[0]?.fetchedAt);

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
        className="relative overflow-hidden rounded-panel border border-white/10 flex flex-col @3xl/page:flex-row min-h-50 float-card group"
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
          <div className="absolute inset-0 z-0 bg-surface-3 pointer-events-none" />
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
              className="inline-flex rounded-control border border-white/10 bg-inset p-1 backdrop-blur-sm"
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
                        : 'text-slate-300 hover:text-white hover:bg-white/10'}`}
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
        <div className="relative z-10 w-full @3xl/page:w-80 @5xl/page:w-96 bg-inset backdrop-blur-sm border-t @3xl/page:border-t-0 @3xl/page:border-l
                         border-white/10 p-card flex flex-col justify-center gap-3 shrink-0 ">
          <h2 className="text-yellow-400 font-semibold text-xs uppercase tracking-wider">Buscar por Nome</h2>
          <div className="relative">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              value={search}
              onChange={(e: ChangeEvent<HTMLInputElement>) => setSearch(e.target.value)}
              placeholder="Ex: bitcoin, ethereum..."
              /* Era o único input claro do painel — `bg-white text-black` sobre o
                 card escuro, resquício de quando esta página tinha superfícies
                 claras. Agora usa o input de vidro das outras telas. */
              className="w-full h-9 coarse:min-h-11 pl-9 pr-3 rounded-md bg-white/5 backdrop-blur-md text-white border border-white/10
                         placeholder-slate-500 outline-none focus:ring-2 focus:ring-yellow-500 focus:border-yellow-500/50 transition-all text-sm"
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
              className="flex justify-between items-center bg-surface-2 rounded-md px-3 py-2 border border-white/10 mt-1"
            >
              <span className="text-white font-medium text-xs uppercase tracking-wider">{searchResult.label}</span>
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
      <motion.div variants={item} whileHover={{ y: -4 }} className="bg-surface-3 border border-white/10 backdrop-blur-md rounded-panel p-card shadow-panel">
        <div className="flex items-center justify-between mb-4 gap-3 flex-wrap">
          <h2 className="text-yellow-500 font-semibold text-sm uppercase tracking-wider">
            Top 100 por Market Cap
          </h2>
          <span className="text-[11px] font-medium text-slate-400 border border-white/10 rounded-full px-2.5 py-1">
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
          <ScrollHint label="Arraste para o lado para ver todas as colunas">
            <table className="w-full min-w-3xl text-sm ">
              <thead>
                <tr className="border-b border-white/10 bg-inset">
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
                    <tr key={coin.key} className="border-b border-white/5 hover:bg-white/5 transition-colors">
                      <td className="py-2 px-3 text-slate-500">{i + 1}</td>
                      <td className="py-2 px-3">
                        <div className="flex items-center gap-2">
                          <img src={coin.imageUrl} alt={coin.name} className="w-5 h-5 rounded-full" />
                          <span className="text-white font-medium">{coin.name}</span>
                          <span className="text-slate-500 uppercase tracking-wider">{coin.symbol}</span>
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
          </ScrollHint>
        )}
      </motion.div>

      {/* Comparativos (24h)

          Estes três cards eram claros — `bg-white/85` e `bg-white` com borda
          slate-200 — únicos do painel inteiro. Sobre o fundo abyss liam como
          recorte de outra aplicação, e as cores de série vinham na faixa 600/700
          (#16a34a, #dc2626, #2563eb), calibradas para fundo claro: sobre
          superfície escura elas escurecem em vez de destacar. Agora usam a mesma
          pilha das outras seções e a faixa 400, como o resto do dashboard. */}
      <motion.div variants={item} className="grid-auto-cards gap-4 [--card-min:20rem]">
        {/* Card: Maiores Altas */}
        <motion.div whileHover={{ y: -4 }} className="bg-surface-3 border border-white/10 backdrop-blur-md shadow-panel rounded-panel p-card flex flex-col gap-4">
          <div className="flex items-center gap-2">
            <span className="text-emerald-400"><TrendingUp size={15} /></span>
            <h2 className="text-emerald-400 font-semibold text-sm uppercase tracking-wider">Maiores altas (24h)</h2>
          </div>
          {loadingMarket ? (
            <div className="flex items-center gap-2 text-slate-400 text-sm">
              <LoaderCircle size={16} className="animate-spin" /> Carregando...
            </div>
          ) : gainers.length ? (
            <BarChartEcharts items={gainers} color="#34d399" valueFormatter={pct} />
          ) : (
            <p className="text-slate-400 text-sm">Sem dados.</p>
          )}
        </motion.div>

        {/* Card: Maiores Quedas */}
        <motion.div whileHover={{ y: -4 }} className="bg-surface-3 border border-white/10 backdrop-blur-md shadow-panel rounded-panel p-card flex flex-col gap-4">
          <div className="flex items-center gap-2">
            <span className="text-rose-400"><TrendingDown size={15} /></span>
            <h2 className="text-rose-400 font-semibold text-sm uppercase tracking-wider">Maiores quedas (24h)</h2>
          </div>
          {loadingMarket ? (
            <div className="flex items-center gap-2 text-slate-400 text-sm">
              <LoaderCircle size={16} className="animate-spin" /> Carregando...
            </div>
          ) : losers.length ? (
            <BarChartEcharts items={losers} color="#fb7185" valueFormatter={pct} />
          ) : (
            <p className="text-slate-400 text-sm">Sem dados.</p>
          )}
        </motion.div>
      </motion.div>

      {/* Card: Top 10 por market cap */}
      <motion.div variants={item} whileHover={{ y: -4 }} className="bg-surface-3 border border-white/10 backdrop-blur-md shadow-panel rounded-panel p-card flex flex-col gap-4 mt-2">
        <div className="flex items-center gap-2">
          <span className="text-blue-400"><BarChart3 size={15} /></span>
          <h2 className="text-blue-400 font-semibold text-sm uppercase tracking-wider">Top 10 por market cap</h2>
        </div>
        {loadingMarket ? (
          <div className="flex items-center gap-2 text-slate-400 text-sm">
            <LoaderCircle size={16} className="animate-spin" /> Carregando...
          </div>
        ) : topCap.length ? (
          <BarChartEcharts items={topCap} color="#60a5fa" valueFormatter={compact} />
        ) : (
          <p className="text-slate-400 text-sm">Sem dados.</p>
        )}
      </motion.div>
    </motion.div>
  );
}