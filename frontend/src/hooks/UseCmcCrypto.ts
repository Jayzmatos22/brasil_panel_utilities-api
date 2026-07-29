import { useQuery } from '@tanstack/react-query';
import { coinMarketCapService } from '../api/services/CoinMarketCap';
import { REALTIME } from '../constants/queryTimes';

/**
 * Mesmo tier REALTIME do CoinGecko: o backend serve de um snapshot proprio,
 * entao refetchar aqui nao consome credito da CoinMarketCap.
 */
export function useCmcMarket(enabled = true) {
    return useQuery({
        queryKey: ['cmc', 'market'],
        queryFn: coinMarketCapService.getAllCryptos,
        enabled,
        ...REALTIME,
    });
}

export function useCmcGlobal(enabled = true) {
    return useQuery({
        queryKey: ['cmc', 'global'],
        queryFn: coinMarketCapService.getGlobalStats,
        enabled,
        ...REALTIME,
    });
}

export function useCmcByTerm(term: string, enabled = true) {
    return useQuery({
        queryKey: ['cmc', 'term', term],
        queryFn: () => coinMarketCapService.getCryptoByTerm(term),
        enabled: enabled && term.length > 0,
        ...REALTIME,
    });
}