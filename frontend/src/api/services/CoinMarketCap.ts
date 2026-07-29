import { apiClient } from '../client/Client';
import type { CmcMarket, CmcGlobal } from '../../types/CriptoType';

export const coinMarketCapService = {
    getAllCryptos: () =>
        apiClient.get<CmcMarket[]>('/coinmarketcap').then((res) => res.data),

    getGlobalStats: () =>
        apiClient.get<CmcGlobal>('/coinmarketcap/global').then((res) => res.data),

    getCryptoByTerm: (term: string) =>
        apiClient.get<CmcMarket>(`/coinmarketcap/${encodeURIComponent(term)}`).then((res) => res.data),
};