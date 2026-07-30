import { useEffect, useState } from 'react';

/**
 * Hook reativo à largura da janela.
 *
 * Recomputa o valor quando o usuário redimensiona a janela.
 * Usa requestAnimationFrame para evitar recomputation excessivo
 * durante o arraste da janela.
 *
 * @param compute função que lê window e devolve um valor
 * @returns valor computado (recomputado a cada resize)
 *
 * @example
 *   const cols = useResponsiveValue(() => getResponsiveGridCols(6));
 */
export function useResponsiveValue<T>(compute: () => T): T {
  const [value, setValue] = useState<T>(compute);

  useEffect(() => {
    let frame = 0;
    const handler = () => {
      cancelAnimationFrame(frame);
      frame = requestAnimationFrame(() => setValue(compute()));
    };
    window.addEventListener('resize', handler);
    // Computa uma vez no mount para garantir valor atualizado.
    handler();
    return () => {
      window.removeEventListener('resize', handler);
      cancelAnimationFrame(frame);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return value;
}