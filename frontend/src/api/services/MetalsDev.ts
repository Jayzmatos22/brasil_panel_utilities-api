import { apiClient } from '../client/Client';
import { type MetalsData, type MetalHistory } from '../../types/MetalsType';

export const metalsDevService = {
  getMetals: () =>
    apiClient.get<MetalsData>('/metals').then((res) => res.data),

  getMetalHistory: () =>
    apiClient.get<MetalHistory>('/metals/history').then((res) => res.data),
};

