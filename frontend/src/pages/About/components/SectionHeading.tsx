// Cabeçalho de seção: eyebrow opcional, <h2> e linha de apoio.
//
// O <h2> é fixo — não há prop de nível. A página tem um único <h1> (o hero)
// e toda seção fica um degrau abaixo dele; deixar o nível configurável só
// abriria espaço para quebrar a hierarquia sem ganho nenhum.
import { EYEBROW } from './styles';

interface SectionHeadingProps {
  /** Mesmo valor passado como `labelledBy` da <Section>. */
  id: string;
  title: string;
  eyebrow?: string;
  description?: string;
  className?: string;
}

export function SectionHeading({
  id,
  title,
  eyebrow = '',
  description = '',
  className = '',
}: SectionHeadingProps) {
  return (
    <div className={`max-w-2xl ${className}`}>
      {eyebrow !== '' && <p className={EYEBROW}>{eyebrow}</p>}

      <h2
        id={id}
        className="mt-4 text-3xl font-semibold tracking-tight text-fg md:text-4xl"
      >
        {title}
      </h2>

      {description !== '' && (
        <p className="mt-5 text-base leading-relaxed text-fg-muted">
          {description}
        </p>
      )}
    </div>
  );
}