import { apiClient } from '../client/Client';
import type { EnderecoCep } from '../../types/CepType';

export const viaCepService = {
  /** CEP → endereço. O backend responde 404 quando o CEP não existe. */
  getAddressByCep: (cep: string) =>
    apiClient.get<EnderecoCep>(`/viacep/${cep}`).then((res) => res.data),

  /**
   * Busca reversa: UF + município + trecho da rua → até 50 endereços com CEP.
   * Município e logradouro exigem no mínimo 3 caracteres.
   */
  searchAddresses: (uf: string, cidade: string, logradouro: string) =>
    apiClient
      .get<EnderecoCep[]>('/viacep/busca', { params: { uf, cidade, logradouro } })
      .then((res) => res.data),
};