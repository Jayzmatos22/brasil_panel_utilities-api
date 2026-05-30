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
