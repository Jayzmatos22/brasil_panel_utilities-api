import type { ExportSpec } from '../../types/utilities/Economy';
import type { NavItem } from '../../types/utilities/Economy';

export const EXPORT_SPECS: ExportSpec[] = [
  // ─── Categoria VALOR (FOB em milhões de USD) ─────────────────────────
  {
    key: 'total',
    shortName: 'Total',
    longName: 'Exportações Totais (FOB)',
    badge: 'IPEA · Comex',
    description:
      'Valor total das exportações brasileiras em FOB (Free On Board). ' +
      'Consolida todos os produtos exportados pelo país, refletindo o dinamismo ' +
      'do comércio exterior e a competitividade da indústria nacional.',
    imageKey: 'total',
    imageFolder: 'exportacoes',
    gradient: 'from-emerald-900 to-teal-700',
    accent: '#34d399',
    iconKey: 'ship',
    category: 'valor',
  },
  {
    key: 'basic-products',
    shortName: 'Produtos Básicos',
    longName: 'Exportações de Produtos Básicos',
    badge: 'IPEA · Comex',
    description:
      'Exportações de produtos Básicos (soja, minério, petróleo, café, carnes). ' +
      'Representam a maior fatia da pauta exportadora brasileira e são sensíveis ' +
      'ao ciclo de commodities e ao câmbio.',
    imageKey: 'basic-products',
    imageFolder: 'exportacoes',
    gradient: 'from-green-900 to-lime-700',
    accent: '#84cc16',
    iconKey: 'wheat',
    category: 'valor',
  },
  {
    key: 'consumer-goods',
    shortName: 'Bens de Consumo',
    longName: 'Exportações de Bens de Consumo',
    badge: 'IPEA · Comex',
    description:
      'Exportações de Bens de Consumo (duráveis e não duráveis). ' +
      'Sensíveis à demanda externa e à renda dos países compradores.',
    imageKey: 'consumer-goods',
    imageFolder: 'exportacoes',
    gradient: 'from-cyan-900 to-blue-700',
    accent: '#22d3ee',
    iconKey: 'shopping-cart',
    category: 'valor',
  },
  {
    key: 'intermediate-value',
    shortName: 'Bens Intermediários (Valor)',
    longName: 'Exportações de Bens Intermediários (FOB)',
    badge: 'IPEA · Comex',
    description:
      'Valor FOB das exportações de Bens Intermediários (insumos industriais). ' +
      'Reflete a integração do Brasil às cadeias globais de valor.',
    imageKey: 'intermediate-value',
    imageFolder: 'exportacoes',
    gradient: 'from-indigo-900 to-blue-800',
    accent: '#818cf8',
    iconKey: 'factory',
    category: 'valor',
  },
  {
    key: 'fuels',
    shortName: 'Combustíveis',
    longName: 'Exportações de Combustíveis (FOB)',
    badge: 'IPEA · Comex',
    description:
      'Valor FOB das exportações de combustíveis (petróleo, etanol, biodiesel). ' +
      'Fortemente influenciado pelo preço internacional do barril e pela produção ' +
      'da pré-sal.',
    imageKey: 'fuels',
    imageFolder: 'exportacoes',
    gradient: 'from-amber-900 to-orange-700',
    accent: '#fbbf24',
    iconKey: 'fuel',
    category: 'valor',
  },

  // ─── Categoria ÍNDICE (adimensional, base 100) ───────────────────────
  {
    key: 'quantum',
    shortName: 'Índice Quantum',
    longName: 'Índice de Quantum das Exportações',
    badge: 'IPEA · Comex',
    description:
      'Índice de volume físico exportado (base 100). Mede a quantidade exportada ' +
      'descontando efeitos de preço — útil para isolar a tendência de volume.',
    imageKey: 'quantum',
    imageFolder: 'exportacoes',
    gradient: 'from-violet-900 to-fuchsia-800',
    accent: '#c084fc',
    iconKey: 'activity',
    category: 'indice',
  },
  {
    key: 'agriculture-quantum',
    shortName: 'Agropecuária (Quantum)',
    longName: 'Índice Quantum — Agropecuária',
    badge: 'IPEA · Comex',
    description:
      'Índice de volume físico das exportações do agronegócio (soja, carnes, café). ' +
      'Sazonalidade forte ligada ao calendário de colheitas.',
    imageKey: 'agriculture-quantum',
    imageFolder: 'exportacoes',
    gradient: 'from-lime-900 to-green-700',
    accent: '#a3e635',
    iconKey: 'tractor',
    category: 'indice',
  },
  {
    key: 'capital-price',
    shortName: 'Bens de Capital (Preço)',
    longName: 'Índice de Preço — Bens de Capital',
    badge: 'IPEA · Comex',
    description:
      'Índice de preço das exportações de bens de capital (máquinas, equipamentos). ' +
      'Reflete a inflação exportada e o posicionamento competitivo da indústria nacional.',
    imageKey: 'capital-price',
    imageFolder: 'exportacoes',
    gradient: 'from-slate-800 to-slate-600',
    accent: '#cbd5e1',
    iconKey: 'cog',
    category: 'indice',
  },
  {
    key: 'durable-price',
    shortName: 'Bens Duráveis (Preço)',
    longName: 'Índice de Preço — Bens de Consumo Duráveis',
    badge: 'IPEA · Comex',
    description:
      'Índice de preço das exportações de bens de consumo duráveis (eletrodomésticos, veículos).',
    imageKey: 'durable-price',
    imageFolder: 'exportacoes',
    gradient: 'from-pink-900 to-rose-800',
    accent: '#f472b6',
    iconKey: 'car',
    category: 'indice',
  },
  {
    key: 'non-durable-price',
    shortName: 'Bens Não Duráveis (Preço)',
    longName: 'Índice de Preço — Bens de Consumo Não Duráveis',
    badge: 'IPEA · Comex',
    description:
      'Índice de preço das exportações de bens de consumo não duráveis (alimentos processados, bebidas).',
    imageKey: 'non-durable-price',
    imageFolder: 'exportacoes',
    gradient: 'from-orange-900 to-amber-700',
    accent: '#fb923c',
    iconKey: 'package',
    category: 'indice',
  },
  {
    key: 'intermediate-quantum',
    shortName: 'Bens Intermediários (Quantum)',
    longName: 'Índice Quantum — Bens Intermediários',
    badge: 'IPEA · Comex',
    description:
      'Índice de volume físico das exportações de bens intermediários (insumos). ' +
      'Sensível ao ciclo industrial global.',
    imageKey: 'intermediate-quantum',
    imageFolder: 'exportacoes',
    gradient: 'from-blue-900 to-indigo-800',
    accent: '#60a5fa',
    iconKey: 'boxes',
    category: 'indice',
  },
];

/** Mapa derivado: key do spec → cor de destaque. */
export const ACCENTS_BY_KEY: Record<string, string> = Object.fromEntries(
  EXPORT_SPECS.map((s) => [s.key, s.accent]),
);

/** Itens da QuickNav — derivados de EXPORT_SPECS. */
export const NAV_ITEMS_EXPORTS: NavItem[] = [
  { id: 'sec-comparativo', label: 'Comparativo', color: '#a78bfa' },
  ...EXPORT_SPECS.map((s) => ({ id: `sec-${s.key}`, label: s.shortName, color: s.accent })),
  { id: 'sec-explorador', label: 'Explorador', color: '#a78bfa' },
];