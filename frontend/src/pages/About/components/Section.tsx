// Casco de seção: âncora, container, respiro vertical e a linha fina que
// separa uma seção da seguinte.
//
// `labelledBy` é obrigatório de propósito. Uma <section> sem nome acessível
// não é anunciada como região por leitor de tela — vira uma <div> cara. Como
// o id do heading precisa existir de qualquer forma, exigir aqui torna o
// erro impossível de esquecer.
import type { ReactNode } from 'react';
import { CONTAINER } from './styles';

interface SectionProps {
  /** Alvo de âncora (#id) usado pelos links internos da página. */
  id: string;
  /** id do heading que dá nome à região. */
  labelledBy: string;
  children: ReactNode;
  className?: string;
  /** Linha fina no topo. A primeira seção depois do hero dispensa. */
  hasDivider?: boolean;
}

export function Section({
  id,
  labelledBy,
  children,
  className = '',
  hasDivider = true,
}: SectionProps) {
  const divider = hasDivider ? 'border-t border-white/5' : '';

  return (
    <section
      id={id}
      aria-labelledby={labelledBy}
      // scroll-mt evita que a âncora pare com o título colado no topo.
      className={`scroll-mt-16 py-24 md:py-32 ${divider} ${className}`}
    >
      <div className={CONTAINER}>{children}</div>
    </section>
  );
}