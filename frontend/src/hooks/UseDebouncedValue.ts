import { useEffect, useState } from 'react';

/**
 * Atrasa a propagação de um valor até ele parar de mudar por `delay` ms.
 *
 * Usado na busca de CEP por logradouro: sem isto cada tecla digitada dispararia
 * uma requisição ao ViaCEP.
 */
export function useDebouncedValue<T>(value: T, delay = 400): T {
  const [debounced, setDebounced] = useState(value);

  useEffect(() => {
    const timer = setTimeout(() => setDebounced(value), delay);
    return () => clearTimeout(timer);
  }, [value, delay]);

  return debounced;
}