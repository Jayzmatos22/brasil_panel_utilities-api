// Card de objetivo: ícone em linha, título e uma ou duas linhas de texto.
//
// O ícone chega como componente (LucideIcon), não como nome — o mesmo
// contrato usado em constants/taxes/TaxIcons.tsx. `strokeWidth={1.5}` é o
// que mantém o traço fino o bastante para não competir com o título.
import type { LucideIcon } from 'lucide-react';
import { SURFACE } from './styles';

interface FeatureCardProps {
  icon: LucideIcon;
  title: string;
  description: string;
}

export function FeatureCard({ icon: Icon, title, description }: FeatureCardProps) {
  return (
    <article
      className={`${SURFACE} h-full p-card transition-colors duration-200 hover:border-white/10`}
    >
      <Icon
        aria-hidden="true"
        strokeWidth={1.5}
        className="h-6 w-6 text-accent"
      />

      <h3 className="mt-5 text-lg font-semibold tracking-tight text-fg">
        {title}
      </h3>

      <p className="mt-3 text-sm leading-relaxed text-fg-muted">
        {description}
      </p>
    </article>
  );
}