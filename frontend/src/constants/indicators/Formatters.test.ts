import { describe, expect, it } from 'vitest';
import {
  fmtBRDate,
  fmtBRL,
  fmtBRLTax,
  fmtCompact,
  fmtIndex,
  fmtPct,
  fmtPctSigned,
  fmtPts,
  fmtUSDCompact,
} from './Formatters';

/** ICU insere espaço não-quebrável em moeda; normalizar evita teste instável. */
const semNbsp = (s: string) => s.replace(/\u00a0/g, ' ');

describe('formatadores de exibição', () => {
  describe('percentuais', () => {
    it('fmtPct usa duas casas com vírgula decimal', () => {
      expect(fmtPct(4.5)).toBe('4,50%');
      expect(fmtPct(0)).toBe('0,00%');
    });

    it('fmtPctSigned força o sinal em valores positivos', () => {
      expect(fmtPctSigned(2.3)).toBe('+2,30%');
    });

    it('fmtPctSigned mantém o sinal natural em negativos', () => {
      expect(fmtPctSigned(-1.75)).toBe('-1,75%');
    });

    it('fmtPctSigned não põe sinal no zero', () => {
      // Zero não é variação: exibir "+0,00%" sugeriria alta que não houve.
      expect(fmtPctSigned(0)).toBe('0,00%');
    });
  });

  describe('fmtCompact', () => {
    it('abrevia bilhões', () => {
      expect(fmtCompact(1_200_000_000)).toBe('1,20B');
    });

    it('abrevia milhões', () => {
      expect(fmtCompact(3_400_000)).toBe('3,40M');
    });

    it('abrevia milhares com uma casa', () => {
      expect(fmtCompact(5_000)).toBe('5,0k');
    });

    it('não abrevia abaixo de mil', () => {
      expect(semNbsp(fmtCompact(999))).toBe('999');
    });

    it('respeita a magnitude de valores negativos', () => {
      expect(fmtCompact(-2_500_000)).toBe('-2,50M');
    });
  });

  describe('fmtBRDate', () => {
    it('converte ISO para DD/MM/YYYY', () => {
      expect(fmtBRDate('2026-07-24')).toBe('24/07/2026');
    });

    it('descarta a parte de hora', () => {
      // A função corta em 10 caracteres, então não sofre com fuso horário.
      expect(fmtBRDate('2026-01-05T23:45:00-03:00')).toBe('05/01/2026');
    });
  });

  describe('fmtBRLTax — entrada já em milhões', () => {
    it('converte para bilhões acima de mil milhões', () => {
      expect(fmtBRLTax(1234.5)).toBe('R$ 1,23 bi');
    });

    it('mantém milhões entre 1 e 1000', () => {
      // Este é o caso que o Javadoc documentava e o código contrariava.
      expect(fmtBRLTax(87.5)).toBe('R$ 87,50 mi');
    });

    it('converte frações de milhão para mil', () => {
      expect(fmtBRLTax(0.5)).toBe('R$ 500 mil');
    });

    it('cai para quatro casas em valores ínfimos', () => {
      expect(fmtBRLTax(0.0001)).toBe('R$ 0,0001');
    });
  });

  describe('fmtUSDCompact — entrada já em milhões', () => {
    it('converte para bilhões', () => {
      expect(fmtUSDCompact(2500)).toBe('US$ 2,50 bi');
    });

    it('mantém milhões', () => {
      expect(fmtUSDCompact(45.75)).toBe('US$ 45,75 mi');
    });
  });

  describe('formatação pt-BR', () => {
    it('fmtBRL usa separador de milhar e vírgula decimal', () => {
      expect(semNbsp(fmtBRL(1234.56))).toBe('R$ 1.234,56');
    });

    it('fmtPts arredonda para inteiro', () => {
      expect(fmtPts(134567.89)).toBe('134.568');
    });

    it('fmtIndex acrescenta a unidade', () => {
      expect(fmtIndex(103.45)).toBe('103,45 pts');
    });
  });

  // Os 4 testes de `getResponsiveGridCols` foram removidos junto com a função.
  // Ela decidia colunas lendo window.innerWidth; o grid intrínseco
  // (`grid-auto-cards`) resolve isso em CSS pelo espaço real do container, o
  // que não é observável por teste unitário — a cobertura equivalente é
  // visual/E2E, na verificação de larguras da FASE 4.
});