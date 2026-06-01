/**
 * BrandLogo — três variantes:
 *   "icon"    → só o ícone de barras (32×32)  — favicon, avatar
 *   "sidebar" → ícone + texto médio (170×36)  — header do dashboard
 *   "full"    → ícone + texto grande (237×52) — painel de auth
 */

type Variant = 'icon' | 'sidebar' | 'full';

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

  // variant === 'full'
  return (
    <svg
      width="237.2" height="52" viewBox="0 0 237.2 52"
      fill="none" xmlns="http://www.w3.org/2000/svg"
      className={className}
      aria-label="Brasil Panel"
    >
      <rect x="6.24"  y="29.162" width="10.747" height="16.598" rx="3.761" fill="#10b981" />
      <rect x="20.627" y="19.677" width="10.747" height="26.083" rx="3.761" fill="#3b82f6" />
      <rect x="35.013" y="6.24"   width="10.747" height="39.52"  rx="3.761" fill="#f59e0b" />
      <text x="66"   y="37.44" fontFamily={FONT} fontSize="28" fontWeight="700" fill="#ffffff" letterSpacing="-0.5">Brasil</text>
      <text x="157.8" y="37.44" fontFamily={FONT} fontSize="28" fontWeight="700" fill="#f59e0b" letterSpacing="-0.5">Panel</text>
    </svg>
  );
}
