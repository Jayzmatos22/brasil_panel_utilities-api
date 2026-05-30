import { useQuery } from '@tanstack/react-query';
import { ipeaService } from '../api/services/Ipea';

export function useMacro() {
  return useQuery({
    queryKey: ['ipea', 'macro'],
    queryFn: ipeaService.getMacro,
    staleTime: 1000 * 60 * 60,   // 1h — econômico muda pouco
  });
}

export function useEmprego() {
  return useQuery({
    queryKey: ['ipea', 'emprego'],
    queryFn: ipeaService.getEmprego,
    staleTime: 1000 * 60 * 60,
  });
}