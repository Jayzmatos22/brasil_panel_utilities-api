import { apiClient } from '../client/Client';
import type { FrankfurterHistory, FrankfurterRate } from '../../types/FrankfurterType';

export const FrankfurterService = {
  returnRateByCoins: (base: string, to: string, amount: number) =>
    apiClient.get<FrankfurterRate>(`/frankfurter?from=${base}&to=${to}&amount=${amount}`).then((res) => res.data),


  getHistory: (base: string, to: string, startDate: string, endDate: string) =>
    apiClient.get<FrankfurterHistory>(`/frankfurter/history?from=${base}&to=${to}&startDate=${startDate}&endDate=${endDate}`).then((res) => res.data),


  getLast30Days: (from: string, to: string) =>
    apiClient.get<FrankfurterHistory>(`/frankfurter/last-30-days?from=${from}&to=${to}`).then((res) => res.data),
};

