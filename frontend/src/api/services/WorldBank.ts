import { apiClient } from '../client/Client';

import type { PibBrasil } from '../../types/WorldBankType';

export const worldBankService = {
  getCurrentPibBrasil: () =>
    apiClient.get<PibBrasil>('/worldbank').then((res) => res.data),


  getPibBrazilByYear: (year: number) =>
    apiClient.get<PibBrasil>(`/worldbank/${year}`).then((res) => res.data),
};
