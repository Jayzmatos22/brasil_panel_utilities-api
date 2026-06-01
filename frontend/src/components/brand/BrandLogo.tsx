/**
 * BrandLogo — quatro variantes:
 *   "icon"    → só o ícone de barras (32×32)   — favicon, avatar
 *   "sidebar" → ícone + texto médio (170×36)   — header do dashboard
 *   "full"    → ícone + texto grande (237×52)  — painel de auth sem frame
 *   "framed"  → logo grande dentro do frame tricolor glow (320×80)
 */

type Variant = 'icon' | 'sidebar' | 'full' | 'framed';

interface BrandLogoProps {
  variant?: Variant;
  className?: string;
}

const FONT = "'Inter', 'SF Pro Display', -apple-system, sans-serif";

export function BrandLogo({ variant = 'sidebar', className = '' }: BrandLogoProps) {
  if (variant === 'icon') {
    return (
      <svg
        width="32" height="32" viewBox="0 0 32 32"
        fill="none" xmlns="http://www.w3.org/2000/svg"
        className={className}
        aria-label="Brasil Panel"
      >
        <rect x="3.84"   y="17.946" width="6.613" height="10.214" rx="2.315" fill="#10b981" />
        <rect x="12.693" y="12.109" width="6.613" height="16.051" rx="2.315" fill="#3b82f6" />
        <rect x="21.547" y="3.84"   width="6.613" height="24.32"  rx="2.315" fill="#f59e0b" />
      </svg>
    );
  }

  if (variant === 'sidebar') {
    return (
      <svg
        width="170" height="36" viewBox="0 0 170 36"
        fill="none" xmlns="http://www.w3.org/2000/svg"
        className={className}
        aria-label="Brasil Panel"
      >
        <rect x="4.32"  y="20.189" width="7.44" height="11.491" rx="2.604" fill="#10b981" />
        <rect x="14.28" y="13.622" width="7.44" height="18.058" rx="2.604" fill="#3b82f6" />
        <rect x="24.24" y="4.32"   width="7.44" height="27.36"  rx="2.604" fill="#f59e0b" />
        <text x="46"  y="25.92" fontFamily={FONT} fontSize="20" fontWeight="700" fill="#ffffff" letterSpacing="-0.5">Brasil</text>
        <text x="113" y="25.92" fontFamily={FONT} fontSize="20" fontWeight="700" fill="#f59e0b" letterSpacing="-0.5">Panel</text>
      </svg>
    );
  }

  if (variant === 'full') {
    return (
      <svg
        width="237.2" height="52" viewBox="0 0 237.2 52"
        fill="none" xmlns="http://www.w3.org/2000/svg"
        className={className}
        aria-label="Brasil Panel"
      >
        <rect x="6.24"   y="29.162" width="10.747" height="16.598" rx="3.761" fill="#10b981" />
        <rect x="20.627" y="19.677" width="10.747" height="26.083" rx="3.761" fill="#3b82f6" />
        <rect x="35.013" y="6.24"   width="10.747" height="39.52"  rx="3.761" fill="#f59e0b" />
        <text x="66"    y="37.44" fontFamily={FONT} fontSize="28" fontWeight="700" fill="#ffffff" letterSpacing="-0.5">Brasil</text>
        <text x="157.8" y="37.44" fontFamily={FONT} fontSize="28" fontWeight="700" fill="#f59e0b" letterSpacing="-0.5">Panel</text>
      </svg>
    );
  }

  // variant === 'framed' — logo grande centralizada dentro do frame tricolor glow
  // Frame: 320×80  |  Logo (237.2×52) centrada em x=41.4, y=14
  return (
    <svg
      width="320" height="80" viewBox="0 0 320 80"
      fill="none" xmlns="http://www.w3.org/2000/svg"
      className={className}
      aria-label="Brasil Panel"
    >
      <defs>
        <filter id="bp-gG" x="-60%" y="-120%" width="220%" height="340%">
          <feGaussianBlur stdDeviation="4" result="blur"/>
          <feMerge><feMergeNode in="blur"/><feMergeNode in="SourceGraphic"/></feMerge>
        </filter>
        <filter id="bp-gB" x="-60%" y="-120%" width="220%" height="340%">
          <feGaussianBlur stdDeviation="4" result="blur"/>
          <feMerge><feMergeNode in="blur"/><feMergeNode in="SourceGraphic"/></feMerge>
        </filter>
        <filter id="bp-gA" x="-60%" y="-120%" width="220%" height="340%">
          <feGaussianBlur stdDeviation="4" result="blur"/>
          <feMerge><feMergeNode in="blur"/><feMergeNode in="SourceGraphic"/></feMerge>
        </filter>
      </defs>

      {/* sem fundo — transparente para fundir com o bg do painel */}

      {/* Frame tricolor glow */}
      {/* verde: arco esquerdo + segmentos */}
      <path d="M 38 1.25 H 105.6"                    stroke="#10b981" strokeWidth="3.5" strokeLinecap="round" filter="url(#bp-gG)"/>
      <path d="M 1.25 38 A 38 38 0 0 1 38 1.25"      stroke="#10b981" strokeWidth="3.5" strokeLinecap="round" filter="url(#bp-gG)"/>
      <path d="M 1.25 42 A 38 38 0 0 0 38 78.75"     stroke="#10b981" strokeWidth="3.5" strokeLinecap="round" filter="url(#bp-gG)"/>
      <path d="M 38 78.75 H 105.6"                   stroke="#10b981" strokeWidth="3.5" strokeLinecap="round" filter="url(#bp-gG)"/>
      {/* azul: segmentos do meio */}
      <path d="M 105.6 1.25 H 211.2"                 stroke="#3b82f6" strokeWidth="3.5" filter="url(#bp-gB)"/>
      <path d="M 105.6 78.75 H 211.2"                stroke="#3b82f6" strokeWidth="3.5" filter="url(#bp-gB)"/>
      {/* âmbar: arco direito + segmentos */}
      <path d="M 211.2 1.25 H 282"                   stroke="#f59e0b" strokeWidth="3.5" strokeLinecap="round" filter="url(#bp-gA)"/>
      <path d="M 318.75 38 A 38 38 0 0 1 282 1.25"   stroke="#f59e0b" strokeWidth="3.5" strokeLinecap="round" filter="url(#bp-gA)"/>
      <path d="M 318.75 42 A 38 38 0 0 0 282 78.75"  stroke="#f59e0b" strokeWidth="3.5" strokeLinecap="round" filter="url(#bp-gA)"/>
      <path d="M 211.2 78.75 H 282"                  stroke="#f59e0b" strokeWidth="3.5" strokeLinecap="round" filter="url(#bp-gA)"/>

      {/* Logo centrada (237.2×52) → translate(41.4, 14) */}
      <g transform="translate(41.4, 14)">
        <rect x="6.24"   y="29.162" width="10.747" height="16.598" rx="3.761" fill="#10b981" />
        <rect x="20.627" y="19.677" width="10.747" height="26.083" rx="3.761" fill="#3b82f6" />
        <rect x="35.013" y="6.24"   width="10.747" height="39.52"  rx="3.761" fill="#f59e0b" />
        <text x="66"    y="37.44" fontFamily={FONT} fontSize="28" fontWeight="700" fill="#ffffff" letterSpacing="-0.5">Brasil</text>
        <text x="157.8" y="37.44" fontFamily={FONT} fontSize="28" fontWeight="700" fill="#f59e0b" letterSpacing="-0.5">Panel</text>
      </g>
    </svg>
  );
}
