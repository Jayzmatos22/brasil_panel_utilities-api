import type { CambioContractedSpec, NavItem } from '../../types/utilities/Economy';

export const CAMBIO_SPECS: CambioContractedSpec[] = [
  // ─── Fluxo Comercial ─────────────────────────────────────────────────
  {
    key: 'comercial',
    shortName: 'Comercial (Total)',
    longName: 'Câmbio Contratado — Comercial',
    badge: 'IPEA · BACEN',
    description:
      'Resultado líquido de contratações de câmbio comercial de exportação e de importação. ' +
      'Consolida o fluxo cambial ligado ao comércio de mercadorias do Brasil com o exterior.',
    imageKey: 'comercial',
    imageFolder: 'cambioComercial',
    gradient: 'from-emerald-900 to-teal-700',
    accent: '#34d399',
    iconKey: 'ship',
    isAggregate: true,
  },
  {
    key: 'comercial-exportacoes',
    shortName: 'Comercial — Exportação',
    longName: 'Câmbio Contratado — Comercial Exportação',
    badge: 'IPEA · BACEN',
    description:
      'Contratações de compra de moeda estrangeira relativas à exportação de bens. ' +
      'Reflete o ingresso de divisas proveniente das vendas brasileiras ao exterior.',
    imageKey: 'comercial-exportacoes',
    imageFolder: 'cambioComercial',
    gradient: 'from-green-900 to-lime-700',
    accent: '#84cc16',
    iconKey: 'arrow-up',
    isAggregate: false,
  },
  {
    key: 'comercial-importacoes',
    shortName: 'Comercial — Importação',
    longName: 'Câmbio Contratado — Comercial Importação',
    badge: 'IPEA · BACEN',
    description:
      'Contratações de venda de moeda relativas às importações de bens. ' +
      'Reflete a saída de divisas para pagamento de produtos estrangeiros adquiridos pelo Brasil.',
    imageKey: 'comercial-importacoes',
    imageFolder: 'cambioComercial',
    gradient: 'from-cyan-900 to-blue-700',
    accent: '#22d3ee',
    iconKey: 'arrow-down',
    isAggregate: false,
  },

  // ─── Fluxo Comercial + Financeiro ────────────────────────────────────
  {
    key: 'comercial-financeiro',
    shortName: 'Comercial + Financeiro (Total)',
    longName: 'Câmbio Contratado — Comercial e Financeiro',
    badge: 'IPEA · BACEN',
    description:
      'Soma dos resultados líquidos de câmbio contratado com clientes no país e com instituições no exterior. ' +
      'Mede o volume total de divisas negociadas no mercado cambial brasileiro.',
    imageKey: 'comercial-financeiro',
    imageFolder: 'cambioComercial',
    gradient: 'from-amber-900 to-orange-700',
    accent: '#f59e0b',
    iconKey: 'layers',
    isAggregate: true,
  },

  // ─── Fluxo Financeiro ────────────────────────────────────────────────
  {
    key: 'financeiro',
    shortName: 'Financeiro (Total)',
    longName: 'Câmbio Contratado — Financeiro',
    badge: 'IPEA · BACEN',
    description:
      'Resultado líquido de contratações de câmbio financeiro de compra e venda. ' +
      'Reflete o movimento de capitais — investimentos, remessas, empréstimos e amortizações.',
    imageKey: 'financeiro',
    imageFolder: 'cambioComercial',
    gradient: 'from-orange-900 to-amber-700',
    accent: '#fb923c',
    iconKey: 'banknote',
    isAggregate: false,
  },
  {
    key: 'financeiro-compras',
    shortName: 'Financeiro — Compras',
    longName: 'Câmbio Contratado — Financeiro Compra',
    badge: 'IPEA · BACEN',
    description:
      'Contratações de compra de moeda estrangeira relativas à exportação de serviços e ingressos de capitais estrangeiros. ' +
      'Indica captação externa pelo Brasil.',
    imageKey: 'financeiro-compras',
    imageFolder: 'cambioComercial',
    gradient: 'from-violet-900 to-purple-700',
    accent: '#a78bfa',
    iconKey: 'trending-up',
    isAggregate: false,
  },
  {
    key: 'financeiro-vendas',
    shortName: 'Financeiro — Vendas',
    longName: 'Câmbio Contratado — Financeiro Venda',
    badge: 'IPEA · BACEN',
    description:
      'Contratações de venda de moeda estrangeira relativas à importação de serviços e saídas de capitais brasileiros. ' +
      'Indica remessas ao exterior e amortizações.',
    imageKey: 'financeiro-vendas',
    imageFolder: 'cambioComercial',
    gradient: 'from-pink-900 to-rose-700',
    accent: '#f472b6',
    iconKey: 'trending-down',
    isAggregate: false,
  },
];

/** Mapa derivado: key do spec → cor de destaque. */
export const ACCENTS_BY_KEY: Record<string, string> = Object.fromEntries(
  CAMBIO_SPECS.map((s) => [s.key, s.accent]),
);

/** Itens da QuickNav — derivados de CAMBIO_SPECS. */
export const NAV_ITEMS_CAMBIO: NavItem[] = [
  { id: 'sec-resumo',       label: 'Resumo',       color: '#f59e0b' },
  { id: 'sec-comparativo',  label: 'Comparativo',  color: '#a78bfa' },
  ...CAMBIO_SPECS.map((s) => ({ id: `sec-${s.key}`, label: s.shortName, color: s.accent })),
  { id: 'sec-explorador',   label: 'Explorador',   color: '#a78bfa' },
];