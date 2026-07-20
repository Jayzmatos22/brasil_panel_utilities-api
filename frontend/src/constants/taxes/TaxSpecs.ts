

// Re-export do tipo LucideIcon para conveniência em taxIcons.tsx.
export type { LucideIcon };


import type { LucideIcon } from 'lucide-react';


export interface TaxSpec {
  key: string;
  shortName: string;
  longName: string;
  badge: string;
  description: string;
  imageKey: string;
  gradient: string;
  accent: string;
  /** Chave do ícone — resolvida no mapa em taxIcons.tsx. */
  iconKey: string;
}

export const TAX_SPECS: TaxSpec[] = [
  {
    key: 'importacao',
    shortName: 'Imp. Importação',
    longName: 'Imposto de Importação',
    badge: 'IPEA · Receita Federal',
    description:
      'Tributo federal incidente sobre mercadorias ingressadas no Brasil do exterior. ' +
      'Sua arrecadação reflete o dinamismo do comércio exterior, a política cambial e os ciclos de demanda interna.',
    imageKey: 'importacao',
    gradient: 'from-cyan-900 to-blue-800',
    accent: '#22d3ee',
    iconKey: 'ship',
  },
  {
    key: 'irpf',
    shortName: 'IRPF',
    longName: 'Imposto de Renda Pessoa Física',
    badge: 'IPEA · Receita Federal',
    description:
      'Tributo federal sobre a renda de pessoas físicas. Apresenta forte sazonalidade: ' +
      'picos característicos em julho (1ª quota) e dezembro (ajuste final da declaração).',
    imageKey: 'irpf',
    gradient: 'from-violet-900 to-fuchsia-800',
    accent: '#c084fc',
    iconKey: 'user-check',
  },
  {
    key: 'irpj',
    shortName: 'IRPJ',
    longName: 'Imposto de Renda Pessoa Jurídica',
    badge: 'IPEA · Receita Federal',
    description:
      'Tributo federal sobre o lucro das empresas. Sazonalidade marcante em março ' +
      '(1ª quota do balanço) e dezembro (ajuste e balço), espelhando o calendário de apuração corporativa.',
    imageKey: 'irpj',
    gradient: 'from-indigo-900 to-violet-800',
    accent: '#818cf8',
    iconKey: 'building-2',
  },
  {
    key: 'ir-total',
    shortName: 'IR Total',
    longName: 'Imposto de Renda Total',
    badge: 'IPEA · Receita Federal',
    description:
      'Soma da arrecadação de IRPF e IRPJ. Funciona como termômetro consolidado da ' +
      'arrecadação tributária sobre renda no país, capturando tanto o desempenho do mercado de trabalho quanto o das empresas.',
    imageKey: 'ir-total',
    gradient: 'from-fuchsia-900 to-pink-800',
    accent: '#e879f9',
    iconKey: 'layers',
  },
  {
    key: 'iof',
    shortName: 'IOF',
    longName: 'Imposto sobre Operações Financeiras',
    badge: 'IPEA · Receita Federal',
    description:
      'Tributo federal sobre operações de crédito, câmbio, seguros e títulos. ' +
      'Sua arrecadação está diretamente atrelada ao volume de operações financeiras e à dinâmica do crédito e do câmbio.',
    imageKey: 'iof',
    gradient: 'from-amber-900 to-yellow-700',
    accent: '#fbbf24',
    iconKey: 'coins',
  },
  {
    key: 'ipi',
    shortName: 'IPI',
    longName: 'Imposto sobre Produtos Industrializados',
    badge: 'IPEA · Receita Federal',
    description:
      'Tributo federal sobre produtos industrializados. Sensível ao ciclo da indústria ' +
      'de transformação — recua em cenários de contração industrial e se recupera junto com a produção física.',
    imageKey: 'ipi',
    gradient: 'from-emerald-900 to-teal-700',
    accent: '#34d399',
    iconKey: 'factory',
  },
  {
  key: 'itr',
  shortName: 'ITR',
  longName: 'Imposto sobre a Propriedade Territorial Rural',
  badge: 'IPEA · Receita Federal',
  description:
    'Tributo federal sobre a propriedade de imóveis rurais. ' +
    'Tem vencimento anual e arrecadação concentrada no segundo semestre, ' +
    'refletindo o calendário de apuração da Receita Federal.',
  imageKey: 'itr',
  gradient: 'from-lime-900 to-green-700',
  accent: '#84cc16',
  iconKey: 'trees',
  },
];

/** Mapa derivado: key do tributo → cor de destaque. */
export const ACCENTS_BY_KEY: Record<string, string> = Object.fromEntries(
  TAX_SPECS.map((t) => [t.key, t.accent]),
);

/** Itens da QuickNav — derivados de TAX_SPECS. */
export const NAV_ITEMS_TAXES = [
  { id: 'sec-agregado',    label: 'Total',        color: '#818cf8' },
  { id: 'sec-comparativo', label: 'Comparativo',  color: '#a78bfa' },
  ...TAX_SPECS.map((t) => ({ id: `sec-${t.key}`, label: t.shortName, color: t.accent })),
  { id: 'sec-explorador',  label: 'Explorador',   color: '#a78bfa' },
];




