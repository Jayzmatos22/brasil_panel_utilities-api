import { apiClient } from '../client/Client';
import type { SelicData, IpcaData, DollarPtax,
    CdiData, MinimumWage, SelicHistoryItem }
    from '../../types/BcbType';


export const bcbService = {
    getSelic: () =>
        apiClient.get<SelicData>('/bcb/selic').then((res) => res.data),

    getSelicHistory: () =>
        apiClient.get<SelicHistoryItem[]>('/bcb/selic/history').then((res) => res.data),

    getIpca: () =>
        apiClient.get<IpcaData>('/bcb/ipca').then((res) => res.data),

    getDollarPtax: () =>
        apiClient.get<DollarPtax>('/bcb/dollar/ptax').then((res) => res.data),

    getCdi: () =>
        apiClient.get<CdiData>('/bcb/cdi').then((res) => res.data),

    getMinimumWage: () =>
        apiClient.get<MinimumWage[]>('/bcb/minimum-wage').then((res) => res.data),

    getMinimumWageAll: () =>
        apiClient.get<MinimumWage[]>('/bcb/minimum-wage/history').then((res) => res.data),
};
