/**
 * formatters.ts — formatadores de exibição pt-BR.
 *
 * Funções puras, sem dependência de React, separadas para reuso em
 * qualquer contexto (componentes, helpers, testes, e-mail templates).
 */

/**
 * Decimal no padrão pt-BR (vírgula), com casas fixas.
 *
 * Existe porque `toFixed` sempre usa ponto: misturá-lo com `toLocaleString`
 * fazia a mesma tela exibir "R$ 1.234,56" ao lado de "4.50%".
 */
const dec = (v: number, casas = 2): string =>
  v.toLocaleString('pt-BR', {
    minimumFractionDigits: casas,
    maximumFractionDigits: casas,
  });

export const fmtPct = (v: number): string => `${dec(v)}%`;

/** Sempre com sinal explícito (+/-) — para variações. */
export const fmtPctSigned = (v: number): string =>
  `${v > 0 ? '+' : ''}${dec(v)}%`;

export const fmtBRL = (v: number): string =>
  v.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });



/** Número inteiro com separador de milhar — para "pontos" do Ibovespa. */
export const fmtPts = (v: number): string =>
  v.toLocaleString('pt-BR', { maximumFractionDigits: 0 });

/** Numérico compacto puro: 1.2B / 3.4M / 5k. */
export const fmtCompact = (v: number): string => {
  const abs = Math.abs(v);
  if (abs >= 1e9) return `${dec(v / 1e9)}B`;
  if (abs >= 1e6) return `${dec(v / 1e6)}M`;
  if (abs >= 1e3) return `${dec(v / 1e3, 1)}k`;
  return v.toLocaleString('pt-BR', { maximumFractionDigits: 2 });
};

/** ISO (yyyy-mm-dd...) → DD/MM/YYYY — para exibição ao usuário final. */
export const fmtBRDate = (iso: string): string => {
  const [y, m, d] = iso.substring(0, 10).split('-');
  return `${d}/${m}/${y}`;
};



/**
 * Formata valores da API IPEA de impostos.
 *
 * Pressuposto: o número de entrada JÁ ESTÁ em milhões de reais.
 * (Séries do IPEA de arrecadação tributária geralmente vêm nessa unidade.)
 *
 * Sempre exibe a unidade explicitamente (mi / bi) para evitar ambiguidade
 * com "mil" — que pode ser confundido com "mil reais" em vez de "milhões".
 *
 * Exemplos:
 *   8.7      → "R$ 8,70 mi"
 *   87.5     → "R$ 87,50 mi"
 *   1234.5   → "R$ 1,23 bi"
 *   0.5      → "R$ 500 mil"
 *
 * Até esta correção o código usava `toFixed`, então produzia "R$ 8.70 mi" —
 * com ponto, contrariando os exemplos acima e o resto do painel.
 */
export const fmtBRLTax = (v: number): string => {
  const abs = Math.abs(v);
  if (abs >= 1000) return `R$ ${dec(v / 1000)} bi`;
  if (abs >= 1)    return `R$ ${dec(v)} mi`;
  if (abs >= 0.001) return `R$ ${dec(v * 1000, 0)} mil`;
  return `R$ ${dec(v, 4)}`;
};



/**
 * Decide o número de colunas de um grid de N cards conforme a largura da tela.
 *
 * Regras:
 *  - Mobile  (< 640px / sm breakpoint)  → sempre 1 coluna
 *  - Tablet  (640–1023px)               → 2 colunas
 *  - Desktop (1024–1279px)              → 3 colunas se N ≥ 6, senão 2
 *  - Wide    (≥ 1280px)                 → 3 colunas (ou 4 se N ≥ 8)
 *
 * Uso típico: comparativo de impostos (6 cards) ou qualquer outro grid
 * que precise escalar responsivamente em telas maiores que mobile.
 *
 * @returns número de colunas (1, 2, 3 ou 4)
 */
export const getResponsiveGridCols = (itemCount: number): number => {
  if (typeof window === 'undefined') return 1; // SSR-safe
  const w = window.innerWidth;
  if (w < 640) return 1;            // mobile
  if (w < 1024) return 2;           // tablet
  if (w < 1280) return itemCount >= 6 ? 3 : 2;  // desktop
  return itemCount >= 8 ? 4 : 3;    // wide
};

// Opções grid
export const GRID_COLS_CLASS: Record<number, string> = {
  1: 'grid grid-cols-1',
  2: 'grid grid-cols-1 sm:grid-cols-2',
  3: 'grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3',
  4: 'grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4',
};




/** Para valores em milhões de USD (séries FOB de exportação). */
export const fmtUSDCompact = (v: number): string => {
  const abs = Math.abs(v);
  if (abs >= 1000)    return `US$ ${dec(v / 1000)} bi`;
  if (abs >= 1)       return `US$ ${dec(v)} mi`;
  if (abs >= 0.001)   return `US$ ${dec(v * 1000, 0)} mil`;
  return `US$ ${dec(v, 4)}`;
};

/** Para índices adimensionais (base 100). */
export const fmtIndex = (v: number): string =>
  `${v.toLocaleString('pt-BR', { maximumFractionDigits: 2 })} pts`;