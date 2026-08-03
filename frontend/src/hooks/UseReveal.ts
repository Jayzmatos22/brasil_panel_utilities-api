// Reveal on scroll — observa o elemento e marca `isRevealed` na primeira vez
// que ele entra no viewport. Uma via só: depois de revelado, o observer é
// desconectado e o elemento nunca volta a sumir. Reanimar a cada scroll é
// ruído em página institucional, onde o usuário sobe e desce lendo.
//
// Difere do observer de QuickNav.tsx, que é scroll-spy: aquele acompanha qual
// seção está no centro da tela e precisa reagir para sempre; este dispara uma
// vez e se desliga.
import { useEffect, useRef, useState } from 'react';
import type { RefObject } from 'react';

const REDUCED_MOTION_QUERY = '(prefers-reduced-motion: reduce)';

/**
 * Casos em que não há animação nenhuma a fazer — o conteúdo já nasce visível.
 *
 * Fica no inicializador do useState, e não num efeito, por dois motivos: um
 * setState síncrono no corpo do efeito provoca render em cascata (e o
 * react-hooks/set-state-in-effect barra), e o conteúdo apareceria por um
 * frame no estado escondido antes de ser corrigido.
 *
 * Quem pede menos movimento não pode depender de IntersectionObserver para
 * ler a página: se o observer não existir, o texto ficaria invisível para
 * sempre. Por isso a ausência da API também entra aqui.
 */
function shouldSkipReveal(): boolean {
  if (typeof window === 'undefined') return true;
  if (typeof IntersectionObserver === 'undefined') return true;
  return window.matchMedia(REDUCED_MOTION_QUERY).matches;
}

export interface UseRevealOptions {
  /** Fração do elemento visível para disparar. Padrão: 0.15. */
  threshold?: number;
  /** Margem do root. O -10% embaixo evita revelar algo colado na borda. */
  rootMargin?: string;
}

export interface UseRevealResult<T extends HTMLElement> {
  ref: RefObject<T | null>;
  isRevealed: boolean;
}

export function useReveal<T extends HTMLElement = HTMLDivElement>(
  options: UseRevealOptions = {},
): UseRevealResult<T> {
  const { threshold = 0.15, rootMargin = '0px 0px -10% 0px' } = options;

  const ref = useRef<T>(null);
  const [isRevealed, setIsRevealed] = useState(shouldSkipReveal);

  useEffect(() => {
    const element = ref.current;
    // Já revelado: nada a observar. Também cobre o caminho de movimento
    // reduzido, que entra aqui com isRevealed=true desde a montagem.
    if (!element || isRevealed) return;

    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (!entry.isIntersecting) continue;
          setIsRevealed(true);
          observer.disconnect();
        }
      },
      { threshold, rootMargin },
    );

    observer.observe(element);
    return () => observer.disconnect();
  }, [threshold, rootMargin, isRevealed]);

  return { ref, isRevealed };
}