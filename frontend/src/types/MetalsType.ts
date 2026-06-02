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

// Metals.dev — GET /api/metals/lbma (fixing oficial LBMA, USD/toz)
// Campos podem ser null quando o fixing ainda não foi publicado (ex: PM pela manhã).
export interface LbmaFixing {
  currency: string;
  timestamp: string; // Instant serializado como ISO 8601
  goldAm: number | null;
  goldPm: number | null;
  silver: number | null;
  platinumAm: number | null;
  platinumPm: number | null;
  palladiumAm: number | null;
  palladiumPm: number | null;
}