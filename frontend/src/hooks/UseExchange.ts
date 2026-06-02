import { useQuery } from '@tanstack/react-query';
import { MARKET, STATIC } from '../constants/queryTimes';
import { FrankfurterService } from '../api/services/Frankfurter';


export function useCurrencies() {
    return useQuery({
        queryKey: ['exchange', 'currencies'],
        queryFn: () => FrankfurterService.getCurrencies(),
        ...STATIC,
    });
}


export function useLast30DaysExchange(from: string, to: string) {
    return useQuery({
      queryKey: ['exchange', 'last30days', from, to],
      queryFn: () => FrankfurterService.getLast30Days(from, to),
      enabled: from.length > 0 && to.length > 0,
      ...MARKET,
      refetchInterval: false,  // histórico imutável.
    });
}


export function useRateByCoins(from: string, to: string, amount: number) {
    return useQuery({
        queryKey: ['exchange', 'rate', from, to, amount],
        queryFn: () => FrankfurterService.returnRateByCoins(from, to, amount),
        enabled: from.length > 0 && to.length > 0 && amount > 0,
        ...MARKET,
    });
}



export function useGetHistoryByCoins(
    from: string,
    to: string,
    startDate: string,
    endDate: string
  ) {
    const isValid =
      from.length > 0 &&
      to.length > 0 &&
      startDate.length > 0 &&
      endDate.length > 0 &&
      from !== to &&
      new Date(startDate) <= new Date(endDate);

    return useQuery({
      queryKey: ['exchange', 'history', from, to, startDate, endDate],
      queryFn: () => FrankfurterService.getHistory(from, to, startDate, endDate),
      enabled: isValid,
      ...MARKET,
      refetchInterval: false, // histórico não precisa de refetch automático.
    });
  }

