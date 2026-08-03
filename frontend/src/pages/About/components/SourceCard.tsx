// Card de fonte oficial. O cartão inteiro é o link.
//
// `rel="noreferrer"` acompanha `noopener` porque os dois resolvem coisas
// diferentes: noopener corta o acesso a window.opener, noreferrer também
// suprime o cabeçalho Referer. Sai daqui um link externo por vez, todos para
// portais oficiais declarados em data/content.ts.
import { ArrowUpRight } from 'lucide-react';
import { FOCUS_RING, SURFACE } from './styles';

interface SourceCardProps {
  acronym: string;
  name: string;
  description: string;
  href: string;
}

export function SourceCard({
  acronym,
  name,
  description,
  href,
}: SourceCardProps) {
  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      className={`${SURFACE} ${FOCUS_RING} group flex h-full flex-col p-card transition-colors duration-200 hover:border-white/10`}
    >
      <div className="flex items-start justify-between gap-4">
        <h3 className="text-base font-semibold tracking-tight text-fg">
          {acronym}
        </h3>

        <ArrowUpRight
          aria-hidden="true"
          strokeWidth={1.5}
          className="h-4 w-4 shrink-0 text-fg-muted transition-colors duration-200 group-hover:text-accent"
        />
      </div>

      {/* Nome por extenso: o leitor de tela lê a sigla e logo o significado. */}
      <p className="mt-2 text-micro leading-snug text-fg-muted">{name}</p>

      <p className="mt-4 text-sm leading-relaxed text-fg-muted">
        {description}
      </p>
    </a>
  );
}