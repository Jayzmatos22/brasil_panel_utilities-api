// World Bank — GET /api/worldbank (PIB atual) e /api/worldbank/{year}
export interface PibBrasil {
  year: string;
  value: number;
  currency: string; // "BRL"
}