import type { BalancaSpec, NavItem } from '../../types/utilities/Economy';


// Especificação de séries da Balança de Pagamentos — usada para gerar cards, QuickNav e Explorador.
export const BALANCA_SPECS: BalancaSpec[] = [
  {
    key: 'ativos-reservas',
    shortName: 'Ativos de Reserva',
    longName: 'Ativos de Reserva',
    badge: 'IPEA · BACEN',
    description:
      'Ativos externos à disposição imediata da autoridade monetária para financiamento ' +
      'de balanço de pagamentos, intervenção no mercado de câmbio e outros fins conexos.',
    imageKey: 'ativos-reservas',
    imageFolder: 'balanca',
    gradient: 'from-amber-900 to-yellow-700',
    accent: '#fbbf24',
    iconKey: 'vault',
    category: 'valor',
  },
  {
    key: 'transacoes-correntes',
    shortName: 'Transações Correntes',
    longName: 'Transações Correntes',
    badge: 'IPEA · BACEN',
    description:
      'Saldo das transações entre residentes e não residentes envolvendo bens, serviços, ' +
      'rendas e transferências correntes. Indicador-chave da posição externa do país.',
    imageKey: 'transacoes-correntes',
    imageFolder: 'balanca',
    gradient: 'from-emerald-900 to-teal-700',
    accent: '#34d399',
    iconKey: 'repeat',
    category: 'valor',
  },
  {
    key: 'comercial',
    shortName: 'Balança Comercial',
    longName: 'Balança Comercial',
    badge: 'IPEA · BACEN',
    description:
      'Diferença entre exportações e importações de bens realizadas pelo país. ' +
      'Saldo positivo indica superávit comercial; negativo, déficit.',
    imageKey: 'comercial',
    imageFolder: 'balanca',
    gradient: 'from-teal-900 to-cyan-700',
    accent: '#14b8a6',
    iconKey: 'ship',
    category: 'valor',
  },
  {
    key: 'servicos',
    shortName: 'Serviços',
    longName: 'Conta de Serviços',
    badge: 'IPEA · BACEN',
    description:
      'Receitas e despesas decorrentes da prestação de serviços entre residentes e não residentes ' +
      '(viagens, transporte, seguros, etc.).',
    imageKey: 'servicos',
    imageFolder: 'balanca',
    gradient: 'from-cyan-900 to-sky-700',
    accent: '#22d3ee',
    iconKey: 'briefcase',
    category: 'valor',
  },
  {
    key: 'renda-primaria',
    shortName: 'Renda Primária',
    longName: 'Renda Primária',
    badge: 'IPEA · BACEN',
    description:
      'Fluxos de remuneração de fatores de produção — juros, lucros, dividendos e salários ' +
      'entre residentes e não residentes.',
    imageKey: 'renda-primaria',
    imageFolder: 'balanca',
    gradient: 'from-violet-900 to-purple-700',
    accent: '#a78bfa',
    iconKey: 'trending-up',
    category: 'valor',
  },
  {
    key: 'investimento-direto',
    shortName: 'Investimento Direto',
    longName: 'Investimento Direto',
    badge: 'IPEA · BACEN',
    description:
      'Fluxos de investimento realizados com o objetivo de estabelecer participação duradoura ' +
      'em empresas residentes. Indica captação de capital produtivo estrangeiro.',
    imageKey: 'investimento-direto',
    imageFolder: 'balanca',
    gradient: 'from-blue-900 to-indigo-700',
    accent: '#3b82f6',
    iconKey: 'building-2',
    category: 'valor',
  },
  {
    key: 'conta-capital',
    shortName: 'Conta Capital',
    longName: 'Conta Capital',
    badge: 'IPEA · BACEN',
    description:
      'Transferências de capital e aquisições ou alienações de ativos não financeiros ' +
      'não produzidos entre residentes e não residentes.',
    imageKey: 'conta-capital',
    imageFolder: 'balanca',
    gradient: 'from-pink-900 to-rose-700',
    accent: '#f472b6',
    iconKey: 'landmark',
    category: 'valor',
  },
  {
    key: 'conta-financeira',
    shortName: 'Conta Financeira',
    longName: 'Conta Financeira',
    badge: 'IPEA · BACEN',
    description:
      'Transações envolvendo ativos e passivos financeiros entre residentes e não residentes — ' +
      'investimentos diretos, em carteira e derivados.',
    imageKey: 'conta-financeira',
    imageFolder: 'balanca',
    gradient: 'from-indigo-900 to-blue-800',
    accent: '#6366f1',
    iconKey: 'banknote',
    category: 'valor',
  },
  {
    key: 'investimento-carteira',
    shortName: 'Investimento em Carteira',
    longName: 'Investimento em Carteira',
    badge: 'IPEA · BACEN',
    description:
      'Investimentos em carteira no balanço de pagamentos, incluindo aplicações em títulos ' +
      'e valores mobiliários. Sensível ao ciclo de juros.',
    imageKey: 'investimento-carteira',
    imageFolder: 'balanca',
    gradient: 'from-purple-900 to-fuchsia-800',
    accent: '#c084fc',
    iconKey: 'wallet',
    category: 'valor',
  },
  {
    key: 'servicos-despesas',
    shortName: 'Serviços — Despesas',
    longName: 'Serviços — Despesas',
    badge: 'IPEA · BACEN',
    description:
      'Despesas da conta de serviços registradas no balanço de pagamentos — ' +
      'viagens internacionais, fretes, seguros pagos ao exterior.',
    imageKey: 'servicos-despesas',
    imageFolder: 'balanca',
    gradient: 'from-sky-900 to-blue-700',
    accent: '#0ea5e9',
    iconKey: 'trending-down',
    category: 'valor',
  },
  {
    key: 'investimento-direto-ingressos',
    shortName: 'ID — Ingressos',
    longName: 'Investimento Direto no País — Ingressos',
    badge: 'IPEA · BACEN',
    description:
      'Ingressos de investimento direto no país registrados no balanço de pagamentos. ' +
      'Reflete a atração de capital produtivo estrangeiro para o Brasil.',
    imageKey: 'ingressos',
    imageFolder: 'balanca',
    gradient: 'from-green-900 to-emerald-700',
    accent: '#4ade80',
    iconKey: 'arrow-down-to-line',
    category: 'valor',
  },
  {
    key: 'transacoes-correntes-pib',
    shortName: 'Transações Correntes (% PIB)',
    longName: 'Transações Correntes — % do PIB',
    badge: 'IPEA · BACEN',
    description:
      'Conta de transações correntes em relação ao PIB. Indicador adimensional da ' +
      'posição externa do país — negativo indica necessidade de financiamento externo.',
    imageKey: 'transacoes-correntes-pib',
    imageFolder: 'balanca',
    gradient: 'from-yellow-900 to-amber-700',
    accent: '#eab308',
    iconKey: 'percent',
    category: 'indice',
  },
];

/** Itens da QuickNav — derivados de BALANCA_SPECS. */
export const NAV_ITEMS_BALANCA: NavItem[] = [
  { id: 'sec-resumo',       label: 'Resumo',       color: '#fbbf24' },
  { id: 'sec-comparativo',  label: 'Comparativo',  color: '#a78bfa' },
  ...BALANCA_SPECS.map((s) => ({ id: `sec-${s.key}`, label: s.shortName, color: s.accent })),
  { id: 'sec-explorador',   label: 'Explorador',   color: '#a78bfa' },
];