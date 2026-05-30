import { apiClient } from '../client/Client';
import { type MetalsData } from '../../types/MetalsType';

export const metalsDevService = {
  getMetals: () =>
    apiClient.get<MetalsData>('/metals').then((res) => res.data),
};

