import {
  Ship, ArrowUp, ArrowDown, Layers, Banknote, TrendingUp, TrendingDown,
  type LucideIcon,
} from 'lucide-react';

export const CAMBIO_ICON_BY_KEY: Record<string, LucideIcon> = {
  'ship':          Ship,
  'arrow-up':      ArrowUp,
  'arrow-down':    ArrowDown,
  'imageFolderKey': 'layers',
  'layers':        Layers,
  'banknote':      Banknote,
  'trending-up':   TrendingUp,
  'trending-down': TrendingDown,
};

export function renderCambioIcon(iconKey: string, size: number = 18): React.ReactNode {
  const Icon = CAMBIO_ICON_BY_KEY[iconKey] ?? Ship;
  return <Icon size={size} aria-hidden />;
}