import type { SeasonalityInsight } from '../../types/utilities/Economy';

export const BALANCA_SEASONALITY: Record<string, SeasonalityInsight[]> = {
  // Balança Comercial: safra de soja (Q2) + café (Q3)
  'comercial': [
    { monthIdx: 4,  reason: 'pico em maio, refletindo a colheita e embarque da safra de soja' },
    { monthIdx: 8,  reason: 'elevação em setembro, associada à colheita do café' },
  ],
  // Transações Correntes: herda safra da balança comercial
  'transacoes-correntes': [
    { monthIdx: 4,  reason: 'pico em maio, com o superávit comercial da safra de soja' },
  ],
  // Investimento Direto Ingressos: Q4 (fechamento de M&A)
  'investimento-direto-ingressos': [
    { monthIdx: 11, reason: 'elevação em dezembro, com fechamento de fusões e aquisições no fim do exercício' },
  ],
};

export const BALANCA_CORRELATION_LABEL: Record<string, string> = {
  'ativos-reservas': 'acúmulo de reservas internacionais pelo BACEN e intervenções cambiais',
  'transacoes-correntes': 'comércio exterior, serviços e renda primária com o exterior',
  'comercial': 'safra agrícola e ciclo de commodities',
  'servicos': 'viagens internacionais, fretes e seguros',
  'renda-primaria': 'remessa de juros, lucros e dividendos',
  'investimento-direto': 'captação de capital produtivo estrangeiro',
  'conta-capital': 'transferências de capital excepcionais',
  'conta-financeira': 'movimento de capitais entre residentes e não residentes',
  'investimento-carteira': 'ciclo de juros e apetite por risco externo',
  'servicos-despesas': 'viagens de brasileiros ao exterior e fretes pagos',
  'investimento-direto-ingressos': 'atração de investimentos produtivos estrangeiros',
  'transacoes-correntes-pib': 'necessidade de financiamento externo do país',
};