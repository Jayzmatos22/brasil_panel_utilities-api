import { useQuery } from '@tanstack/react-query';
import { brasilApiService } from '../api/services/BrasilAPI';
import { STATIC } from '../constants/queryTimes';

export function useAllBanks() {
  return useQuery({
    queryKey: ['banks'],
    queryFn: brasilApiService.getAllBanks,
    ...STATIC,
  });
}

export function useBankByCode(code: number) {
  return useQuery({
    queryKey: ['banks', code],
    queryFn: () => brasilApiService.getBankByCode(code),
    enabled: code > 0,
    ...STATIC,
  });
}
