import { apiClient } from '../client/Client';
import { type MetalsData, type MetalHistory, type LbmaFixing } from '../../types/MetalsType';

export const metalsDevService = {
  getMetals: () =>
    apiClient.get<MetalsData>('/metals').then((res) => res.data),

  getMetalHistory: () =>
    apiClient.get<MetalHistory>('/metals/history').then((res) => res.data),

  getLbmaFixing: () =>
    apiClient.get<LbmaFixing>('/metals/lbma').then((res) => res.data),
};

