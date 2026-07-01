import {
  ShieldCheck, Repeat, Ship, Briefcase, TrendingUp, Building2,
  Landmark, Banknote, Wallet, TrendingDown, ArrowDownToLine, Percent,
  type LucideIcon,
} from 'lucide-react';
import type { ReactNode } from 'react';

export const BALANCA_ICON_BY_KEY: Record<string, LucideIcon> = {
  'vault':              ShieldCheck,
  'repeat':             Repeat,
  'ship':               Ship,
  'briefcase':          Briefcase,
  'trending-up':        TrendingUp,
  'building-2':         Building2,
  'landmark':           Landmark,
  'banknote':           Banknote,
  'wallet':             Wallet,
  'trending-down':      TrendingDown,
  'arrow-down-to-line': ArrowDownToLine,
  'percent':            Percent,
};

export function renderBalancaIcon(iconKey: string, size: number = 18): ReactNode {
  const Icon = BALANCA_ICON_BY_KEY[iconKey] ?? ShieldCheck;
  return <Icon size={size} aria-hidden />;
}