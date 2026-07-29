// CoinGecko — GET /api/coingecko (top 100 por market cap)
export interface CryptoMarket {
  id: string;
  symbol: string;
  name: string;
  currentPrice: number;
  marketCap: number;
  priceChange24h: number;
  imageUrl: string;
}

// CoinGecko — GET /api/coingecko/{name}
export interface CryptoByName {
  id: string;
  priceBrl: number;
}

// ─────────────────────────────────────────────────────────────────────────────
// CoinMarketCap — fonte paralela, exposta explicitamente no painel.
// Traz variacao de 1h/7d e dominancia, que o CoinGecko nao fornece.
// ─────────────────────────────────────────────────────────────────────────────

// GET /api/coinmarketcap
export interface CmcMarket {
  id: number;
  symbol: string;
  name: string;
  slug: string;
  rank: number;
  currentPrice: number;
  marketCap: number;
  volume24h: number;
  percentChange1h: number;
  percentChange24h: number;
  percentChange7d: number;
  marketCapDominance: number;
  imageUrl: string;
  /** Quando o backend buscou esse snapshot — usado para mostrar o frescor do dado */
  fetchedAt: string;
}

// GET /api/coinmarketcap/global
export interface CmcGlobal {
  totalMarketCap: number;
  btcDominance: number;
  /** Soma do volume das moedas acompanhadas — nao e o volume global do mercado */
  top100Volume24h: number;
  coinsTracked: number;
  fetchedAt: string;
}

/** Fonte de dados ativa na pagina de criptomoedas */
export type CryptoSource = 'coingecko' | 'coinmarketcap';

/** Linha normalizada da tabela — comum as duas fontes, com extras opcionais da CMC */
export interface CryptoRow {
  key: string;
  symbol: string;
  name: string;
  imageUrl: string;
  currentPrice: number;
  marketCap: number;
  priceChange24h: number;
  percentChange1h?: number;
  percentChange7d?: number;
}
