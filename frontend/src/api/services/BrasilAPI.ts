import { apiClient } from '../client/Client';
import type { Bank } from '../../types/BankDataType';

export const brasilApiService = {
  getAllBanks: () =>
    apiClient.get<Bank[]>('/banks').then((res) => res.data),

  getBankByCode: (code: number) =>
    apiClient.get<Bank>(`/banks/${code}`).then((res) => res.data),
};