// IBGE/SIDRA — GET /api/sidra/pib-estados
export interface PibEstadual {
  year: number;
  ufCode: number;
  uf: string;
  value: number; // reais absolutos
}