/**
 * timeWindows.ts — constantes de tempo usadas para fatiar séries IPEA.
 *
 * Mantidas em ms para comparação direta com Date.getTime(),
 * evitando reconversão em cada chamada.
 */

export const MS_DAY = 86_400_000;
/** 5 anos em ms — arredondado para 365 dias/ano (suficiente para filtros visuais). */
export const MS_5Y = 5 * 365 * MS_DAY;
/** 6 meses em ms — arredondado para 30 dias/mês (suficiente para filtros visuais). */
export const MS_6M = 6 * 30 * MS_DAY;

/**
 * Meses em pt-BR — usado pelos labels de filtro e pela geração de insights
 * sazonais. Mantido em uppercase para consistência visual em pills/badges.
 */
export const MONTHS_PT = [
  'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
  'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro',
] as const;
