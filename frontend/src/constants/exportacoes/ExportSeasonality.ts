import type { SeasonalityInsight } from '../../types/utilities/Economy';

/**
 * Sazonalidade por safra/calendário comercial.
 * meses: 0=jan, 11=dez
 */
export const EXPORT_SEASONALITY: Record<string, SeasonalityInsight[]> = {
  // Total: leve pico Q2 (soja) + Q4 (natal/commodities)
  'total': [
    { monthIdx: 4,  reason: 'pico em maio, refletindo a colheita da safra de soja (maior item da pauta)' },
    { monthIdx: 11, reason: 'elevação em dezembro, associada ao fechamento de contratos e à safra de cana' },
  ],

  // Produtos básicos: safra de soja (mar-jun) + café (mai-set)
  'basic-products': [
    { monthIdx: 3,  reason: 'início do pico de exportação de soja (abril-junho), principal produto da pauta básica' },
    { monthIdx: 5,  reason: 'pico em junho, refletindo o auge da colheita e embarque da soja' },
    { monthIdx: 8,  reason: 'elevação em setembro, associada à colheita do café' },
  ],

  // Agropecuária quantum: soja Q2 + carnes distribuídas
  'agriculture-quantum': [
    { monthIdx: 4,  reason: 'pico em maio, com a safra de soja e milho' },
    { monthIdx: 5,  reason: 'auge em junho, maior volume físico do ano para o agronegócio' },
  ],

  // Bens de consumo: leve pico Q4 (natal)
  'consumer-goods': [
    { monthIdx: 10, reason: 'leve elevação em novembro, antecipando o consumo de fim de ano' },
    { monthIdx: 11, reason: 'pico em dezembro, associado às festas de fim de ano' },
  ],

  // Combustíveis: distribuído, sensível a preço do petróleo
  // (sem sazonalidade marcante — frase genérica em buildExportObservations)

  // Bens de capital: leve Q4 (fechamento de contratos de investimento)
  'capital-price': [
    { monthIdx: 11, reason: 'leve elevação em dezembro, com fechamento de contratos de investimento' },
  ],
};

/**
 * Retorna o nome da safra/categoria de sazonalidade para uma key.
 * Usado para insights genéricos quando não há pico no mês atual.
 */
export const EXPORT_HARVEST_LABEL: Record<string, string> = {
  'total': 'commodities agrícolas e industriais',
  'basic-products': 'soja, café e minério',
  'agriculture-quantum': 'soja, milho e carnes',
  'consumer-goods': 'consumo de fim de ano',
  'capital-price': 'fechamento de contratos de investimento',
  'fuels': 'preço internacional do petróleo',
  'quantum': 'volume físico das exportações',
  'intermediate-value': 'ciclo industrial global',
  'intermediate-quantum': 'ciclo industrial global',
  'durable-price': 'demanda externa por duráveis',
  'non-durable-price': 'demanda externa por alimentos processados',
};