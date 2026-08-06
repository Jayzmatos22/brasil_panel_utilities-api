// Container de rolagem horizontal com aviso explícito.
//
// Rolagem lateral é a affordance mais fácil de não descobrir num painel: o
// conteúdo parece simplesmente cortado, e nada indica que há mais coisa à
// direita. Em telas de toque não há sequer barra de rolagem visível.
//
// O aviso só aparece quando há transbordo DE FATO, medido no elemento. Avisar
// "arraste" onde tudo já cabe é pior que não avisar: ensina o usuário a ignorar
// o aviso, e aí ele some justamente onde importa. Some também assim que a
// pessoa rola — cumpriu a função, vira ruído.
//
// Substitui o aviso solto que existia no IpeaPage, que usava um ChevronDown
// rotacionado 90° e cor slate-600 sobre fundo escuro — quase ilegível, e um
// ícone que descreve "expandir", não "arrastar para o lado".
import { useEffect, useRef, useState } from 'react';
import type { ReactNode } from 'react';
import { MoveHorizontal } from 'lucide-react';

interface ScrollHintProps {
  children: ReactNode;
  /** Texto do aviso. */
  label?: string;
  /** Classes extras do container rolável (padding, etc). */
  className?: string;
}

export function ScrollHint({
  children,
  label = 'Arraste para o lado para ver o restante',
  className = '',
}: ScrollHintProps) {
  const ref = useRef<HTMLDivElement>(null);
  const [transborda, setTransborda] = useState(false);
  const [jaRolou, setJaRolou] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    // +1px de tolerância: arredondamento de subpixel faz scrollWidth passar do
    // clientWidth por frações mesmo quando não há nada a rolar.
    const medir = () => setTransborda(el.scrollWidth > el.clientWidth + 1);

    medir();

    // Observa o container E o conteúdo: o transbordo muda tanto quando a
    // janela encolhe quanto quando os dados chegam e a tabela cresce.
    const observer = new ResizeObserver(medir);
    observer.observe(el);
    if (el.firstElementChild) observer.observe(el.firstElementChild);

    const aoRolar = () => {
      if (el.scrollLeft > 8) setJaRolou(true);
    };
    el.addEventListener('scroll', aoRolar, { passive: true });

    return () => {
      observer.disconnect();
      el.removeEventListener('scroll', aoRolar);
    };
  }, []);

  return (
    <>
      {transborda && !jaRolou && (
        <p className="mb-2 flex items-center gap-1.5 text-micro text-slate-400">
          <MoveHorizontal size={13} aria-hidden="true" className="shrink-0" />
          {label}
        </p>
      )}

      <div
        ref={ref}
        className={`overflow-x-auto overscroll-x-contain ${className}`}
      >
        {children}
      </div>
    </>
  );
}
