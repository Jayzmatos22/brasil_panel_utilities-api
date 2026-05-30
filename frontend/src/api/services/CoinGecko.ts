import { apiClient } from '../client/Client';
import type { CryptoMarket, CryptoByName } from '../../types/CriptoType';

export const coinGeckoService = {
    getAll100Cryptos: () => 
        apiClient.get<CryptoMarket[]>('/coingecko').then((res) => res.data),

    getCryptoByName: (name: string) =>
        apiClient.get<CryptoByName>(`/coingecko/${encodeURIComponent(name)}`).then((res) => res.data),

};