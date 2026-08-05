// Card de fonte oficial. O cartão inteiro é o link.
//
// A superfície é preta em todas as fontes; o que muda entre elas é só a cor
// ATRÁS — a sombra projetada e o halo no topo interno. Assim a página mantém
// accent único em texto e bordas, e ainda assim cada API ganha identidade no
// relance.
//
// `rel="noreferrer"` acompanha `noopener` porque resolvem coisas diferentes:
// noopener corta o acesso a window.opener, noreferrer também suprime o
// cabeçalho Referer.
import { ArrowUpRight } from 'lucide-react';
import type { CSSProperties } from 'react';
import { FOCUS_RING } from './styles';

interface SourceCardProps {
  acronym: string;
  name: string;
  provides: string;
  description: string;
  href: string;
  color: string;
}

export function SourceCard({
  acronym,
  name,
  provides,
  description,
  href,
  color,
}: SourceCardProps) {
  // A cor entra por custom property, e não por classe: são doze valores
  // distintos vindos de dados, e o Tailwind não gera utilitárias para valores
  // que só existem em tempo de execução.
  const corDaFonte = { '--fonte-cor': color } as CSSProperties;

  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      style={corDaFonte}
      className={`${FOCUS_RING} fonte-card group relative isolate flex h-full flex-col overflow-hidden rounded-panel border border-white/5 p-card`}
    >
      <div className="relative flex items-start justify-between gap-4">
        <h3 className="text-base font-semibold tracking-tight text-fg">
          {acronym}
        </h3>

        <ArrowUpRight
          aria-hidden="true"
          strokeWidth={1.5}
          className="h-4 w-4 shrink-0 text-fg-muted transition-colors duration-200 group-hover:text-fg"
        />
      </div>

      {/* Nome por extenso: o leitor de tela lê a sigla e logo o significado. */}
      <p className="relative mt-2 text-micro leading-snug text-fg-muted">
        {name}
      </p>

      {/* Único texto que recebe a cor da fonte — e mesmo assim clareado até
          passar no contraste sobre o preto. A cor crua de algumas fontes (o
          cinza do Metals.dev, o índigo da CoinMarketCap) reprovaria. */}
      <p
        className="relative mt-5 text-eyebrow font-medium uppercase tracking-[0.18em]"
        style={{ color: 'color-mix(in srgb, var(--fonte-cor) 60%, white)' }}
      >
        {provides}
      </p>

      <p className="relative mt-3 text-sm leading-relaxed text-fg-muted">
        {description}
      </p>
    </a>
  );
}
