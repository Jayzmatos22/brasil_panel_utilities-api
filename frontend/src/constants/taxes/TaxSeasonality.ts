import type { SeasonalityInsight } from '../../types/utilities/Economy';



export const SEASONALITY: Record<string, SeasonalityInsight[]> = {
  irpf: [
    { monthIdx: 6,  reason: 'pico característico em julho, refletindo o vencimento da 1ª quota do IRPF (declaração anual)' },
    { monthIdx: 11, reason: 'elevação esperada em dezembro, associada ao ajuste final e ao pagamento de quotas remanescentes' },
  ],
  irpj: [
    { monthIdx: 2,  reason: 'pico esperado em março, refletindo o vencimento da 1ª quota do IRPJ sobre o lucro do exercício anterior' },
    { monthIdx: 11, reason: 'elevação em dezembro, associada ao ajuste anual e ao balço consolidado das empresas' },
  ],
  'ir-total': [
    { monthIdx: 2,  reason: 'sazonalidade herdada do IRPJ em março (1ª quota corporativa)' },
    { monthIdx: 6,  reason: 'sazonalidade herdada do IRPF em julho (1ª quota pessoa física)' },
    { monthIdx: 11, reason: 'elevação combinada em dezembro, com ajustes de ambas as pontas (PF e PJ)' },
  ],
  iof: [],         // sem sazonalidade marcante — frase genérica
  importacao: [],  // sensível a câmbio + ciclo externo
  ipi: [],         // sensível ao ciclo industrial — frase via média móvel 3M
};


// Meses
export const MONTHS_PT = [
  'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
  'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro',
];

