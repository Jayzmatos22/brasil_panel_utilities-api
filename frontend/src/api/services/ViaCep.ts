import { apiClient } from '../client/Client';
import type { ViaCepAddress } from '../../types/AddressUserType';
//import { ApiError } from '../../lib/errors/ErrorsHttp';

// UserAddress  adicionado no input do número.

export const viaCepService = {
  getAddressByCep: (cep: string) =>
    apiClient.get<ViaCepAddress>(`/viacep/${cep}`).then((res) => res.data),
};
