import { useQuery } from '@tanstack/react-query';
import { viaCepService } from '../api/services/ViaCep';
import { useDebouncedValue } from './UseDebouncedValue';
import { STATIC } from '../constants/queryTimes';

/** Município e logradouro exigem 3 caracteres — regra da própria API de origem. */
const MIN_TERM = 3;

export function useViaCep(cep: string) {
  const cleanCep = cep.replace(/\D/g, '');

  return useQuery({
    queryKey: ['viacep', cleanCep],
    queryFn: () => viaCepService.getAddressByCep(cleanCep),
    enabled: cleanCep.length === 8,
    ...STATIC,
    // CEP inexistente agora vem como 404: repetir a chamada não muda a resposta.
    retry: false,
  });
}

/**
 * Busca CEPs por logradouro dentro de um município.
 *
 * O logradouro entra com debounce porque vem de um campo de texto — sem isso
 * cada tecla viraria uma requisição.
 */
export function useCepSearch(uf: string, cidade: string, logradouro: string) {
  const termo = useDebouncedValue(logradouro.trim(), 400);
  const habilitado =
    uf.length === 2 && cidade.trim().length >= MIN_TERM && termo.length >= MIN_TERM;

  return useQuery({
    queryKey: ['viacep-busca', uf, cidade, termo],
    queryFn: () => viaCepService.searchAddresses(uf, cidade, termo),
    enabled: habilitado,
    ...STATIC,
    retry: false,
  });
}