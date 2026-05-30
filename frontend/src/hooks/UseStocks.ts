import { useQuery } from '@tanstack/react-query';
import { alphaVantageService } from '../api/services/AlphaVantage';
import { FINANCIAL } from '../constants/queryTimes';

export function useStockQuote(symbol: string) {
  return useQuery({
    queryKey: ['stocks', symbol],
    queryFn: () => alphaVantageService.getStockQuote(symbol),
    enabled: symbol.trim().length > 0,
    ...FINANCIAL,
  });
}