// Envelope de reveal on scroll. Isola o useReveal para que nenhuma seção
// precise lidar com ref, observer ou classe de transição.
//
// `motion-reduce:transition-none` é cinto e suspensório: o hook já entrega
// isRevealed=true de cara quando há preferência por menos movimento, mas se
// a preferência mudar depois da montagem a variante do Tailwind corta a
// transição na hora, sem depender de re-render.
import type { ReactNode } from 'react';
import { useReveal } from '../../../hooks/UseReveal';

const BASE =
  'transition-[opacity,transform] duration-700 ease-out motion-reduce:transition-none';
const HIDDEN = 'opacity-0 translate-y-4';
const SHOWN = 'opacity-100 translate-y-0';

interface RevealProps {
  children: ReactNode;
  className?: string;
  /** Atraso em cascata para itens irmãos de uma grade. */
  delayMs?: number;
}

export function Reveal({ children, className = '', delayMs = 0 }: RevealProps) {
  const { ref, isRevealed } = useReveal<HTMLDivElement>();

  return (
    <div
      ref={ref}
      style={{ transitionDelay: `${delayMs}ms` }}
      className={`${BASE} ${isRevealed ? SHOWN : HIDDEN} ${className}`}
    >
      {children}
    </div>
  );
}