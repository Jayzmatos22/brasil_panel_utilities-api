import { useQuery } from '@tanstack/react-query';
import { ibgeService } from '../api/services/Ibge';
import { STATIC } from '../constants/queryTimes';


export function useStates() {
  return useQuery({
    queryKey: ['ibge', 'states'],
    queryFn: ibgeService.getStates,
    ...STATIC,
  });
}


export function useCitiesByState(state: string, filtro?: string) {
  return useQuery({
    queryKey: ['ibge', 'cities', state, filtro],
    queryFn: () => ibgeService.getCitiesByState(state, filtro),
    enabled: state.length > 0,
    ...STATIC,
  });
}
