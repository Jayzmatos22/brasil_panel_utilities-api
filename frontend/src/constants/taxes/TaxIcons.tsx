import {
  Ship, UserCheck, Building2, Layers, Coins, Factory, Trees,
  type LucideIcon,
} from 'lucide-react';

/**
 * Mapa de chaves de ícone → componente LucideIcon.
 * Separado de taxSpecs.ts porque JSX/ícones não devem viver em .ts puro.
 *
 * Uso típico:
 *   import { TAX_SPECS } from '@/constants/taxes/taxSpecs';
 *   import { TAX_ICON_BY_KEY } from '@/constants/taxes/taxIcons';
 *
 *   const Icon = TAX_ICON_BY_KEY[spec.iconKey] ?? Ship;
 *   <Icon size={18} />
 *
 * Para preservar a assinatura visual dos cards, exportamos também
 * `renderTaxIcon(iconKey, size?)` que já devolve um <Icon size={...} />.
 */
export const TAX_ICON_BY_KEY: Record<string, LucideIcon> = {
  'ship':         Ship,
  'user-check':   UserCheck,
  'building-2':   Building2,
  'layers':       Layers,
  'coins':        Coins,
  'factory':      Factory,
  'trees':        Trees,
};

/** Resolve a chave e devolve o elemento já dimensionado. */
export function renderTaxIcon(iconKey: string, size: number = 18): React.ReactNode {
  const Icon = TAX_ICON_BY_KEY[iconKey] ?? Ship;
  return <Icon size={size} aria-hidden />;
}



