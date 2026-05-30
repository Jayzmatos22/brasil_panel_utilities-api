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