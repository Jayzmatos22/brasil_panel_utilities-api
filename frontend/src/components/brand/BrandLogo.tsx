interface Props {
  textSize?: string;
  iconSize?: number;
}

/**
 * Logo reutilizável — três barras ascendentes (verde/âmbar) + "Brasil Panel"
 * textSize aceita qualquer classe Tailwind de tamanho de fonte.
 */
export function BrandLogo({ textSize = 'text-sm', iconSize = 22 }: Props) {
  return (
    <div className="flex items-center gap-2.5 select-none">
      {/* Ícone: gráfico de barras ascendentes */}
      <svg
        width={iconSize}
        height={iconSize}
        viewBox="0 0 24 24"
        fill="none"
        aria-hidden="true"
      >
        <rect x="2"  y="13" width="5" height="9"  rx="1.5" fill="#10b981" />
        <rect x="9"  y="7"  width="5" height="15" rx="1.5" fill="#10b981" opacity="0.65" />
        <rect x="16" y="2"  width="6" height="20" rx="1.5" fill="#f59e0b" />
      </svg>

      {/* Texto */}
      <span className={`font-bold tracking-wide leading-none ${textSize}`}>
        <span className="text-white">Brasil</span>
        <span className="text-amber-400"> Panel</span>
      </span>
    </div>
  );
}