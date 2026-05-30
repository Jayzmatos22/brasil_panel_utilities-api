import { apiClient } from '../client/Client';
import type { StockQuote } from '../../types/StocksType';

export const alphaVantageService = {
  getStockQuote: (symbol: string) =>
    apiClient.get<StockQuote>(`/quote/${encodeURIComponent(symbol)}`).then((res) => res.data),
};