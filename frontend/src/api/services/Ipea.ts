import { apiClient } from '../client/Client';
import type { IpeaSerie } from '../../types/IpeaType';

export const ipeaService = {
  getMacro: () =>
    apiClient.get<IpeaSerie[]>('/ipea/macro').then((res) => res.data),

  getEmprego: () =>
    apiClient.get<IpeaSerie[]>('/ipea/emprego').then((res) => res.data),

  getRenda: () =>
    apiClient.get<IpeaSerie[]>('/ipea/renda').then((res) => res.data),

  getDesigualdadePobreza: () =>
    apiClient.get<IpeaSerie[]>('/ipea/desigualdade').then((res) => res.data),

  getPrecos: () =>
    apiClient.get<IpeaSerie[]>('/ipea/precos').then((res) => res.data),


  getPopulacao: () =>
    apiClient.get<IpeaSerie[]>('/ipea/populacao').then((res) => res.data),

  
};