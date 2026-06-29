import {
  Ship, Wheat, ShoppingCart, Factory, Fuel, Activity, Tractor, Cog,
  Car, Package, Boxes, type LucideIcon,
} from 'lucide-react';

export const EXPORT_ICON_BY_KEY: Record<string, LucideIcon> = {
  'ship':           Ship,
  'wheat':          Wheat,
  'shopping-cart':  ShoppingCart,
  'factory':        Factory,
  'fuel':           Fuel,
  'activity':       Activity,
  'tractor':        Tractor,
  'cog':            Cog,
  'car':            Car,
  'package':        Package,
  'boxes':          Boxes,
};

export function renderExportIcon(iconKey: string, size: number = 18): React.ReactNode {
  const Icon = EXPORT_ICON_BY_KEY[iconKey] ?? Ship;
  return <Icon size={size} aria-hidden />;
}