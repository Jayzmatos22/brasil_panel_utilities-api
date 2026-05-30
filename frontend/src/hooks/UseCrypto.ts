import { useQuery } from '@tanstack/react-query';
import { coinGeckoService } from '../api/services/CoinGecko';
import { REALTIME } from '../constants/queryTimes';


export function useCryptoMarket() {
    return useQuery({
        queryKey: ['crypto', 'market'],
        queryFn: coinGeckoService.getAll100Cryptos,
        ...REALTIME,
    });
}


export function useCryptoByName(name: string) {
    return useQuery({
        queryKey: ['crypto', 'name', name],
        queryFn: () => coinGeckoService.getCryptoByName(name),
        enabled: name.length > 0,
        ...REALTIME,
    });
}