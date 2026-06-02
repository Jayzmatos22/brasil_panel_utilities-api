import { apiClient } from '../client/Client';
import type { StockHistory, StockQuote } from '../../types/StocksType';

export const alphaVantageService = {
  getStockQuote: (symbol: string) =>
    apiClient.get<StockQuote>(`/quote/${encodeURIComponent(symbol)}`).then((res) => res.data),

  getStockHistory: (symbol: string) =>
    apiClient.get<StockHistory>(`/quote/${encodeURIComponent(symbol)}/history`).then((res) => res.data),
};