// ViaCEP — GET /api/viacep/{cep} e GET /api/viacep/busca
//
// Espelha o EnderecoCepDTO do backend, que já normaliza a resposta do ViaCEP:
// `localidade` vira `municipio` e o código IBGE vira número.
export interface EnderecoCep {
  cep: string;
  logradouro: string;
  complemento: string;
  /** Unidade dos Correios — preenchido em CEP de caixa postal / grande usuário. */
  unidade: string;
  bairro: string;
  municipio: string;
  /** Código IBGE do município — é o mesmo `id` de `Municipio`. */
  municipioId: number | null;
  uf: string;
  estado: string;
  regiao: string;
  ddd: string;
  siafi: string;
  /** Só municípios de SP. */
  gia: string;
}