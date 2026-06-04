import { useQuery } from '@tanstack/react-query';
import { alphaVantageService } from '../api/services/AlphaVantage';
import { FINANCIAL } from '../constants/queryTimes';
import { ApiError } from '../lib/errors/ErrorsHttp';

// Não repete em erros do cliente (4xx): limite diário (429) e símbolo inválido
// (404) não mudam com retry — só desperdiçam quota. Repete só em rede/5xx.
const retryNon4xx = (failureCount: number, error: unknown): boolean => {
  if (error instanceof ApiError && error.status >= 400 && error.status < 500) {
    return false;
  }
  return failureCount < 2;
};

export function useStockQuote(symbol: string) {
  return useQuery({
    queryKey: ['stocks', symbol],
    queryFn: () => alphaVantageService.getStockQuote(symbol),
    enabled: symbol.trim().length > 0,
    ...FINANCIAL,
    retry: retryNon4xx,
  });
}

export function useStockHistory(symbol: string) {
  return useQuery({
    queryKey: ['stocks', 'history', symbol],
    queryFn: () => alphaVantageService.getStockHistory(symbol),
    enabled: symbol.trim().length > 0,
    ...FINANCIAL,
    retry: retryNon4xx,
  });
}