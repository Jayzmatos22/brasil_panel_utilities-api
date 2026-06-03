import { useQuery } from '@tanstack/react-query';
import { worldBankService } from '../api/services/WorldBank';
import { HISTORICAL } from '../constants/queryTimes';

export function useCurrentPibBrazil() {
    return useQuery({
        queryKey: ['worldbank'],
        queryFn: worldBankService.getCurrentPibBrasil,
        ...HISTORICAL,
    });
}


export function usePibBrazilByYear(year: number) {
    return useQuery({
        queryKey: ['worldbank', 'year', year],
        queryFn: () => worldBankService.getPibBrazilByYear(year),
        ...HISTORICAL, enabled: year > 0
    });
}

export function usePibSeries() {
    return useQuery({
        queryKey: ['worldbank', 'series'],
        queryFn: worldBankService.getPibSeries,
        ...HISTORICAL,
    });
}