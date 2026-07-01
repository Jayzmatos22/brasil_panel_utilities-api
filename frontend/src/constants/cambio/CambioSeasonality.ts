import type { SeasonalityInsight } from '../../types/utilities/Economy';

export const CAMBIO_SEASONALITY: Record<string, SeasonalityInsight[]> = {
  'comercial-exportacoes': [
    { monthIdx: 4,  reason: 'pico em maio, refletindo a colheita e embarque da safra de soja' },
    { monthIdx: 8,  reason: 'elevação em setembro, associada à colheita do café' },
  ],
  'comercial-importacoes': [
    { monthIdx: 10, reason: 'leve elevação em novembro, antecipando o consumo de fim de ano' },
    { monthIdx: 11, reason: 'pico em dezembro, associado às festas de fim de ano' },
  ],
};

export const CAMBIO_CORRELATION_LABEL: Record<string, string> = {
  'comercial': 'comércio exterior (importação + exportação de bens)',
  'comercial-exportacoes': 'safra de soja e café, e ingresso de divisas por exportadores',
  'comercial-importacoes': 'demanda interna por produtos estrangeiros',
  'comercial-financeiro': 'movimento total de divisas no mercado cambial brasileiro',
  'financeiro': 'movimento de capitais internacionais (investimentos, remessas, empréstimos)',
  'financeiro-compras': 'captação de recursos externos e ingresso de capitais',
  'financeiro-vendas': 'remessas ao exterior e amortizações',
};