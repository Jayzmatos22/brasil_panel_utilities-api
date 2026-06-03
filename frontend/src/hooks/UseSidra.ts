import { useQuery } from '@tanstack/react-query';
import { sidraService } from '../api/services/Sidra';
import { HISTORICAL } from '../constants/queryTimes';

export function usePibPorEstado() {
  return useQuery({
    queryKey: ['sidra', 'pib-estados'],
    queryFn: sidraService.getPibPorEstado,
    ...HISTORICAL,
  });
}