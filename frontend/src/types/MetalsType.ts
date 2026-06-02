// Metals.dev — GET /api/metals (cotações em BRL/toz)
export interface MetalsData {
  gold: number;
  silver: number;
  platinum: number;
  palladium: number;
  copper: number;
  aluminum: number;
  nickel: number;
  zinc: number;
  lastUpdated: string; // Instant serializado como ISO 8601
}

export type MetalKey =
  | 'gold' | 'silver' | 'platinum' | 'palladium'
  | 'copper' | 'aluminum' | 'nickel' | 'zinc';

// Metals.dev — GET /api/metals/history (série diária, USD/toz)
export interface MetalHistoryPoint {
  date: string;
  gold: number | null;
  silver: number | null;
  platinum: number | null;
  palladium: number | null;
  copper: number | null;
  aluminum: number | null;
  nickel: number | null;
  zinc: number | null;
}

export interface MetalHistory {
  currency: string;
  unit: string;
  data: MetalHistoryPoint[];
}