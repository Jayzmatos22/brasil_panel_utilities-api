// ViaCep — GET /api/cep/{cep} (campos retornados pelo backend)
export interface ViaCepAddress {
  cep: string;
  logradouro: string;
  complemento: string;
  bairro: string;
  localidade: string;
  uf: string;
  estado: string;
  ddd: string;
}

// Endereço completo do usuário: ViaCep + número inserido manualmente
export interface UserAddress extends ViaCepAddress {
  numero: string;
}
