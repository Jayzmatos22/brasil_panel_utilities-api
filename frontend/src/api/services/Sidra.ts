import { apiClient } from '../client/Client';
import type { PibEstadual } from '../../types/SidraType';

export const sidraService = {
  getPibPorEstado: () =>
    apiClient.get<PibEstadual[]>('/sidra/pib-estados').then((res) => res.data),
};