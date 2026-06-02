// AlphaVantage — GET /api/quote/{symbol}
export interface StockQuote {
  symbol: string;
  open: number;
  high: number;
  low: number;
  price: number;
  volume: number;
  latestTradingDay: string;
  previousClose: number;
  change: number;
  changePercent: string; // ex: "1.23%"
}

// AlphaVantage — GET /api/quote/{symbol}/history
export interface StockHistoryPoint {
  date: string; // yyyy-MM-dd
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
}

export interface StockHistory {
  symbol: string;
  data: StockHistoryPoint[]; // ordem crescente de data
}