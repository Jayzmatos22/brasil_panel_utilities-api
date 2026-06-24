import { type ReactNode } from 'react';
import { type LinePoint } from '../../components/charts/LineChartEcharts';
import type { IpeaItem } from '../../types/IpeaType';


// =========================================== //
        //    EconomiaPage      //
// =========================================== //

// Interface da página Economia.
export interface IndicatorCardProps {
  imageKey: string;
  gradient: string;
  icon: ReactNode;
  title: string;
  badge: string;
  description: string;
  isLoading: boolean;
  error: Error | null;
  refetch?: () => void;
  children: ReactNode;
  id?: string;
}


// Navgegação entre os temas Economia.
export interface NavItem {
  id: string;
  label: string;
  color: string;
}

// Fechamento Ibovespa.
export interface ClosingRow {
  date: string;
  value: number;
  variation: number | null;
}



export interface ChartPanelProps {
  title: string;
  subtitle: string;
  icon: ReactNode;
  accent: string; // hex ex. "#c084fc"
  points: LinePoint[];
  emptyHint: string;
  id?: string;
}

export interface PeriodStats {
  count: number;
  ret: number;
  hi: { date: string; value: number };
  lo: { date: string; value: number };
  first: number;
  last: number;
}


export interface IbovespaMetrics {
  fiveYearPoints: LinePoint[];
  sixMonthPoints: LinePoint[];
  closings: ClosingRow[];
  fiveYearReturn: number | null;
  sixMonthReturn: number | null;
  fiveYearHigh: { date: string; value: number } | null;
  fiveYearLow: { date: string; value: number } | null;
  avgDailyAbsVar6m: number | null;
  positiveDays6m: number;
  negativeDays6m: number;
  last5Trend: 'up' | 'down' | 'flat' | null;
  last5NetPct: number | null;
  // Série completa válida asc — reutilizada pelo Explorador por Período
  validAsc: IpeaItem[];
}



// =========================================== //
        //    PibPage      //
// =========================================== //
export interface SectionCardProps {
  title: string;
  subtitle?: string;
  icon: ReactNode;
  badge?: ReactNode;
  children: ReactNode;
  className?: string;
  contentClassName?: string;
}


// =========================================== //
        //    SalarioPage      //
// =========================================== //

export interface StatCardProps {
  title: string;
  value: string;
  icon: ReactNode;
  trendClass: string;
  floatDelay?: string;
}