import { apiClient } from '../client/Client';
import type { Estado } from '../../types/BrazilianStatesType';
import type { Municipio } from '../../types/MunicipioIbgeType';

export const ibgeService = {
  getStates: () =>
    apiClient.get<Estado[]>('/ibge').then((res) => res.data),

  getCitiesByState: (stateAbbreviation: string, filtro?: string) =>
    apiClient
      .get<Municipio[]>(`/ibge/states/${stateAbbreviation}/cities`, { params: { filtro } })
      .then((res) => res.data),
};