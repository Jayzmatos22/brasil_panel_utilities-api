// Fonte única de conteúdo da landing institucional.
//
// Nenhuma seção declara copy: elas recebem daqui. O motivo é prático — a
// revisão de texto desta página é feita por quem não mexe em JSX, e um
// arquivo só de dados tipados permite trocar uma palavra sem abrir um
// componente.
//
// Ícone entra como referência de componente (`LucideIcon`), não como string,
// seguindo o que constants/taxes/TaxIcons.tsx e constants/cambio/CambioIcons.tsx
// já fazem: assim o TypeScript recusa um ícone inexistente e não sobra mapa
// string→componente para manter em sincronia.
import {
  Landmark,
  LineChart,
  ShieldCheck,
  Unlock,
  Database,
  SlidersHorizontal,
  MonitorCheck,
} from 'lucide-react';
import type { LucideIcon } from 'lucide-react';

// ─── Tipos ──────────────────────────────────────────────────────────────────

export interface CtaLink {
  label: string;
  /** Rota interna (react-router) ou âncora começando com `#`. */
  href: string;
}

export interface HeroContent {
  eyebrow: string;
  title: string;
  highlight: string;
  subtitle: string;
  primaryCta: CtaLink;
  secondaryCta: CtaLink;
  backgroundAlt: string;
}

export interface Metric {
  id: string;
  /**
   * Numérico, e não string formatada: o count-up precisa interpolar até ele.
   * O valor é editorial — não vem de API.
   */
  value: number;
  /** Sufixo colado ao número: '+', 'h'. Fica fora da contagem. */
  suffix?: string;
  label: string;
  description: string;
}

export interface AboutUsContent {
  eyebrow: string;
  title: string;
  paragraphs: readonly string[];
  aside: {
    quote: string;
    author: string;
    role: string;
  };
  imageAlt: string;
}

export interface Objective {
  id: string;
  icon: LucideIcon;
  title: string;
  description: string;
}

export interface MethodologyStep {
  id: string;
  icon: LucideIcon;
  title: string;
  description: string;
}

export interface Source {
  id: string;
  acronym: string;
  name: string;
  /** O que o painel consome desta fonte, em uma linha. */
  provides: string;
  description: string;
  href: string;
  /**
   * Cor da fonte, usada exclusivamente no brilho ATRÁS do card — a superfície
   * em si permanece preta. Diferencia as fontes no relance sem quebrar a
   * regra de accent único da página, já que a cor nunca toca texto nem borda.
   */
  color: string;
}

export interface SectionIntro {
  eyebrow: string;
  title: string;
  description: string;
}

export interface NavLink {
  label: string;
  href: string;
  /**
   * Quem enxerga o link. Ausente = todos.
   * As âncoras da página valem sempre; "Entrar" e "Criar conta" só para quem
   * não tem sessão, e o atalho do painel só para quem tem.
   */
  visibility?: 'guest' | 'auth';
}

export interface TopBarContent {
  homeHref: string;
  homeLabel: string;
  navLabel: string;
  loginCta: CtaLink;
  registerCta: CtaLink;
  /** Mostrado no lugar do par acima quando já existe sessão. */
  dashboardCta: CtaLink;
}

export interface DisclaimerContent {
  title: string;
  body: string;
}

export interface FinalCtaContent {
  title: string;
  description: string;
  primaryCta: CtaLink;
  secondaryCta: CtaLink;
  navTitle: string;
  navLinks: readonly NavLink[];
  legalIcon: LucideIcon;
  legal: string;
}

// ─── Identidade ─────────────────────────────────────────────────────────────

export const SITE_NAME = 'Brasil Panel';

export const PAGE_TITLE = `${SITE_NAME} — Panorama econômico brasileiro`;

// ─── 0. Barra superior ──────────────────────────────────────────────────────

/**
 * Destino de quem já tem sessão. Fonte única: a página é pública e pode ser
 * aberta por usuário logado (via /sobre ou link da sidebar), e todo CTA que
 * levaria a uma tela de autenticação precisa virar este atalho.
 */
export const DASHBOARD_CTA: CtaLink = {
  label: 'Ir para o painel',
  href: '/dashboard/economia',
};

export const TOP_BAR: TopBarContent = {
  homeHref: '/',
  homeLabel: `${SITE_NAME} — início`,
  navLabel: 'Acesso',
  loginCta: { label: 'Entrar', href: '/login-usuario' },
  registerCta: { label: 'Criar conta', href: '/registro-usuario' },
  dashboardCta: DASHBOARD_CTA,
};

// ─── 1. Hero ────────────────────────────────────────────────────────────────

export const HERO: HeroContent = {
  eyebrow: 'Panorama econômico brasileiro',
  title: 'Os dados que movem o Brasil,',
  highlight: 'em um só painel.',
  subtitle:
    'Indicadores oficiais de economia, câmbio, mercado e comércio exterior — coletados direto na fonte primária, tratados sem intermediários e publicados em um formato que se entende em segundos.',
  // O primário leva ao cadastro, não ao painel: /dashboard/* é protegido por
  // PrivateRoute e o visitante anônimo cairia no login sem que o destino
  // pretendido fosse preservado — beco sem saída. Quem já tem conta usa o
  // "Entrar" da barra superior.
  primaryCta: { label: 'Criar conta', href: '/registro-usuario' },
  secondaryCta: { label: 'Ver metodologia', href: '#metodologia' },
  backgroundAlt:
    'Arara-canindé de peito amarelo e asas azuis, empoleirada, com a mata desfocada ao fundo',
};

// ─── 2. Métricas ────────────────────────────────────────────────────────────

export const METRICS_INTRO: SectionIntro = {
  eyebrow: 'Em números',
  title: 'O tamanho do painel',
  description:
    'Cobertura, origem e ritmo de atualização — os três critérios que definem se um dado serve para decidir alguma coisa.',
};

export const METRICS: readonly Metric[] = [
  {
    id: 'series',
    value: 40,
    suffix: '+',
    label: 'Séries acompanhadas',
    description:
      'Selic, IPCA, CDI, PIB, câmbio, Ibovespa, metais, balança de pagamentos e mais.',
  },
  {
    id: 'fontes',
    value: 12,
    label: 'Integrações ativas',
    description:
      'Nenhum número é estimado internamente. Todo dado tem uma API responsável por trás.',
  },
  {
    id: 'atualizacao',
    value: 24,
    suffix: 'h',
    label: 'Ciclo de atualização',
    description:
      'Cada série é revalidada no ritmo de publicação do órgão de origem — nem antes, nem depois.',
  },
  {
    id: 'historico',
    value: 1994,
    label: 'Série histórica desde',
    description:
      'Cobertura contínua desde o Plano Real, para que a comparação de longo prazo faça sentido.',
  },
];

// ─── 3. Quem somos ──────────────────────────────────────────────────────────

export const ABOUT_US: AboutUsContent = {
  eyebrow: 'Quem somos',
  title: 'Dado público não deveria ser difícil de ler.',
  paragraphs: [
    'O Brasil produz estatística econômica de primeira linha. O IBGE, o Banco Central, o IPEA e o Tesouro publicam, de graça e em detalhe, aquilo que em boa parte do mundo custa assinatura. O problema nunca foi a falta de dado — foi o acesso: portais que não conversam entre si, planilhas em formatos herdados, séries que só abrem em um navegador específico e APIs documentadas para quem já sabe o que procurar.',
    'O Brasil Panel existe para fechar essa distância. Reunimos as séries que realmente importam para entender o país, padronizamos unidade, período e nomenclatura, e apresentamos tudo em um painel único — com o gráfico ao lado do número e a fonte sempre a um clique. Não somos casa de análise e não vendemos opinião: o que oferecemos é o dado oficial, íntegro, legível e rastreável até a origem.',
  ],
  aside: {
    quote:
      'Um número sem contexto é só um número. Nosso trabalho é devolver o contexto.',
    author: SITE_NAME,
    role: 'Princípio editorial',
  },
  imageAlt: 'Bandeira do Brasil hasteada em mastro, tremulando contra o céu',
};

// ─── 4. Objetivos ───────────────────────────────────────────────────────────

export const OBJECTIVES_INTRO: SectionIntro = {
  eyebrow: 'Objetivos',
  title: 'Três compromissos, sem letra miúda',
  description:
    'Tudo o que construímos passa por estes filtros. Quando um deles conflita com uma funcionalidade nova, o compromisso vence.',
};

export const OBJECTIVES: readonly Objective[] = [
  {
    id: 'acesso',
    icon: Unlock,
    title: 'Democratizar o acesso',
    description:
      'Dado público é patrimônio de quem paga por ele. Consulta livre, sem paywall e sem exigir conhecimento prévio de estatística.',
  },
  {
    id: 'contexto',
    icon: LineChart,
    title: 'Traduzir número em contexto',
    description:
      'Cada indicador vem com série histórica, variação e leitura em linguagem clara — porque isolado ele não decide nada.',
  },
  {
    id: 'rastreabilidade',
    icon: ShieldCheck,
    title: 'Garantir rastreabilidade',
    description:
      'Todo valor exibido aponta para o órgão que o publicou. Se você não puder conferir na fonte, não publicamos.',
  },
];

// ─── 5. Metodologia ─────────────────────────────────────────────────────────

export const METHODOLOGY_INTRO: SectionIntro = {
  eyebrow: 'Metodologia',
  title: 'Da fonte oficial até a sua tela',
  description:
    'Três etapas, sem atalho entre elas. O que muda de um indicador para outro é o calendário do órgão — nunca o processo.',
};

export const METHODOLOGY_STEPS: readonly MethodologyStep[] = [
  {
    id: 'coleta',
    icon: Database,
    title: 'Coleta',
    description:
      'Consumimos as APIs e os repositórios oficiais dos próprios órgãos — SGS do Banco Central, SIDRA do IBGE, Ipeadata e afins. Sem raspagem de portal e sem intermediário revendendo dado público.',
  },
  {
    id: 'tratamento',
    icon: SlidersHorizontal,
    title: 'Tratamento',
    description:
      'Padronizamos unidade, periodicidade e fuso; incorporamos as revisões que o órgão publica depois; e descartamos o registro que não fecha com a série. O valor não é recalculado nem suavizado: é o oficial.',
  },
  {
    id: 'publicacao',
    icon: MonitorCheck,
    title: 'Publicação',
    description:
      'A série entra em cache com validade alinhada ao calendário de divulgação da fonte e vai ao painel com a data de referência visível. Indisponibilidade da origem aparece como tal — nunca como número velho disfarçado de atual.',
  },
];

// ─── 6. Fontes ──────────────────────────────────────────────────────────────

export const SOURCES_INTRO: SectionIntro = {
  eyebrow: 'Fontes',
  title: 'De onde vem cada número',
  description:
    'As doze integrações que o painel consome, órgão por órgão e API por API. Os links abrem a documentação de cada uma para conferência direta.',
};

/**
 * As doze integrações que o backend realmente consome, uma por pacote em
 * `service/api` mais as duas usadas pelos seeders (BrasilAPI e IBGE
 * Localidades).
 *
 * A lista anterior citava Tesouro Nacional, FGV e ANBIMA — nenhuma delas
 * existe no código. Era copy escrita antes da conferência, e prometia
 * procedência que o painel não tem. Esta versão saiu de uma varredura das URLs
 * externas em `service/api/**`, então cada card corresponde a uma chamada que
 * de fato acontece.
 *
 * A ordem alterna matizes de propósito: as cores só aparecem como brilho atrás
 * do card, e vizinhas parecidas na esteira anulariam a distinção.
 */
export const SOURCES: readonly Source[] = [
  {
    id: 'bcb',
    acronym: 'BCB',
    name: 'Banco Central do Brasil — SGS',
    provides: 'Selic, IPCA, CDI e câmbio',
    description:
      'Sistema Gerenciador de Séries Temporais. É a origem dos indicadores que abrem o painel.',
    href: 'https://api.bcb.gov.br',
    color: '#2563eb',
  },
  {
    id: 'sidra',
    acronym: 'SIDRA',
    name: 'IBGE — Banco de Tabelas Estatísticas',
    provides: 'PIB por unidade da federação',
    description:
      'Tabela 5938, variável 37: PIB a preços correntes. Uma requisição por ano de referência.',
    href: 'https://apisidra.ibge.gov.br',
    color: '#16a34a',
  },
  {
    id: 'ipea',
    acronym: 'IPEA',
    name: 'Ipeadata — API OData',
    provides: 'Séries macroeconômicas',
    description:
      'Catálogo histórico do Instituto de Pesquisa Econômica Aplicada, consultado por metadados.',
    href: 'http://ipeadata.gov.br',
    color: '#dc2626',
  },
  {
    id: 'worldbank',
    acronym: 'World Bank',
    name: 'Banco Mundial — Indicators API',
    provides: 'PIB do Brasil em moeda local',
    description:
      'Indicador NY.GDP.MKTP.CN, usado como série longa de comparação internacional.',
    href: 'https://api.worldbank.org',
    color: '#0891b2',
  },
  {
    id: 'alphavantage',
    acronym: 'Alpha Vantage',
    name: 'Alpha Vantage — Time Series',
    provides: 'Cotações de ações',
    description:
      'Séries de mercado acionário, com limite de requisições por minuto no plano gratuito.',
    href: 'https://www.alphavantage.co',
    color: '#7c3aed',
  },
  {
    id: 'coingecko',
    acronym: 'CoinGecko',
    name: 'CoinGecko — Public API',
    provides: 'Top 100 criptomoedas',
    description:
      'Preços e capitalização de mercado. Não exige chave, e serve de alternativa à CoinMarketCap.',
    href: 'https://api.coingecko.com',
    color: '#84cc16',
  },
  {
    id: 'coinmarketcap',
    acronym: 'CoinMarketCap',
    name: 'CoinMarketCap — Pro API',
    provides: 'Listagem de criptomoedas',
    description:
      'Única fonte paga do painel. O consumo é contabilizado e travado em 80% da cota mensal.',
    href: 'https://coinmarketcap.com/api',
    color: '#6366f1',
  },
  {
    id: 'frankfurter',
    acronym: 'Frankfurter',
    name: 'Frankfurter — Exchange Rates',
    provides: 'Câmbio de referência',
    description:
      'Taxas publicadas pelo Banco Central Europeu. Define quais moedas o seletor pode oferecer.',
    href: 'https://frankfurter.dev',
    color: '#f59e0b',
  },
  {
    id: 'metalsdev',
    acronym: 'Metals.dev',
    name: 'Metals.dev — Spot & LBMA',
    provides: 'Ouro, prata e demais metais',
    description:
      'Preços à vista e o fixing oficial da London Bullion Market Association.',
    href: 'https://metals.dev',
    color: '#a8a29e',
  },
  {
    id: 'brasilapi',
    acronym: 'BrasilAPI',
    name: 'BrasilAPI — Bancos',
    provides: 'Instituições financeiras',
    description:
      'Registro de bancos com código COMPE e ISPB, carregado uma vez na inicialização.',
    href: 'https://brasilapi.com.br',
    color: '#ec4899',
  },
  {
    id: 'ibge-localidades',
    acronym: 'IBGE',
    name: 'IBGE — Localidades',
    provides: 'Estados e municípios',
    description:
      'Malha político-administrativa oficial, base para os recortes territoriais do painel.',
    href: 'https://servicodados.ibge.gov.br',
    color: '#65a30d',
  },
  {
    id: 'viacep',
    acronym: 'ViaCEP',
    name: 'ViaCEP — Consulta de endereços',
    provides: 'Endereço por CEP',
    description:
      'Usada apenas no cadastro, para preencher endereço sem digitação manual.',
    href: 'https://viacep.com.br',
    color: '#14b8a6',
  },
];

export const SOURCES_NOTE =
  'Os dados são de domínio público e permanecem sob a licença de uso definida por cada instituição. O Brasil Panel não altera valores: apenas padroniza formato e apresentação. Divergência entre o painel e o portal de origem deve ser resolvida sempre a favor da fonte oficial.';

// ─── 7. Aviso ───────────────────────────────────────────────────────────────

export const DISCLAIMER: DisclaimerContent = {
  title: 'Aviso importante',
  body: 'O conteúdo do Brasil Panel tem finalidade exclusivamente informativa e educacional. Não constitui recomendação de investimento, consultoria financeira, oferta de compra ou venda de ativos, nem análise de valores mobiliários. Rentabilidade passada não garante resultado futuro. Decisões financeiras são de responsabilidade de quem as toma — consulte um profissional certificado antes de investir.',
};

// ─── 8. Fechamento ──────────────────────────────────────────────────────────

export const FINAL_CTA: FinalCtaContent = {
  title: 'Comece pelo indicador que trouxe você até aqui.',
  description:
    'O painel está aberto. Escolha uma série, compare com o histórico e tire sua própria conclusão.',
  primaryCta: { label: 'Criar conta', href: '/registro-usuario' },
  secondaryCta: { label: 'Já tenho conta', href: '/login-usuario' },
  navTitle: 'Navegação',
  // Âncoras da própria página, não rotas do painel: os destinos de
  // /dashboard/* são privados e mandariam o visitante anônimo para o login.
  // Quem ainda não converteu navega o argumento; quem converteu usa a
  // sidebar. Href começando com '#' é renderizado como <a>, não como <Link>.
  navLinks: [
    { label: 'Quem somos', href: '#quem-somos' },
    { label: 'Objetivos', href: '#objetivos' },
    { label: 'Metodologia', href: '#metodologia' },
    { label: 'Fontes', href: '#fontes' },
    { label: 'Entrar', href: '/login-usuario', visibility: 'guest' },
    { label: 'Criar conta', href: '/registro-usuario', visibility: 'guest' },
    { label: 'Painel', href: DASHBOARD_CTA.href, visibility: 'auth' },
  ],
  legalIcon: Landmark,
  legal: 'Dados de fontes públicas oficiais brasileiras.',
};