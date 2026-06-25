/**
 * formatters.ts — formatadores de exibição pt-BR.
 *
 * Funções puras, sem dependência de React, separadas para reuso em
 * qualquer contexto (componentes, helpers, testes, e-mail templates).
 */

export const fmtPct = (v: number): string => `${v.toFixed(2)}%`;

/** Sempre com sinal explícito (+/-) — para variações. */
export const fmtPctSigned = (v: number): string =>
  `${v > 0 ? '+' : ''}${v.toFixed(2)}%`;

export const fmtBRL = (v: number): string =>
  v.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });

/** R$ em notação compacta: 1,23 bi / 4,56 mi / 7,89 mil. */
export const fmtBRLCompact = (v: number): string => {
  const abs = Math.abs(v);
  if (abs >= 1e9) return `R$ ${(v / 1e9).toFixed(2)} bi`;
  if (abs >= 1e6) return `R$ ${(v / 1e6).toFixed(2)} mi`;
  if (abs >= 1e3) return `R$ ${(v / 1e3).toFixed(1)} mil`;
  return v.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
};

/** Número inteiro com separador de milhar — para "pontos" do Ibovespa. */
export const fmtPts = (v: number): string =>
  v.toLocaleString('pt-BR', { maximumFractionDigits: 0 });

/** Numérico compacto puro: 1.2B / 3.4M / 5k. */
export const fmtCompact = (v: number): string => {
  const abs = Math.abs(v);
  if (abs >= 1e9) return `${(v / 1e9).toFixed(2)}B`;
  if (abs >= 1e6) return `${(v / 1e6).toFixed(2)}M`;
  if (abs >= 1e3) return `${(v / 1e3).toFixed(1)}k`;
  return v.toLocaleString('pt-BR', { maximumFractionDigits: 2 });
};

/** ISO (yyyy-mm-dd...) → DD/MM/YYYY — para exibição ao usuário final. */
export const fmtBRDate = (iso: string): string => {
  const [y, m, d] = iso.substring(0, 10).split('-');
  return `${d}/${m}/${y}`;
};
