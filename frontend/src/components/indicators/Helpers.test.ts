import { describe, expect, it } from 'vitest';
import type { IpeaItem } from '../../types/IpeaType';
import {
  computeClosingsWithVariation,
  filterByRecentWindow,
  filterValid,
  sortAsc,
  toLinePoints,
} from './Helpers';

const item = (data: string, valor: number | null): IpeaItem => ({ data, valor });

describe('processamento de séries do IPEA', () => {
  describe('filterValid', () => {
    it('descarta buracos da série', () => {
      // O IPEA envia null em feriados; deixar passar quebraria os cálculos.
      const entrada = [
        item('2026-01-01', 10),
        item('2026-01-02', null),
        item('2026-01-03', 12),
      ];

      expect(filterValid(entrada)).toHaveLength(2);
    });

    it('descarta NaN', () => {
      const entrada = [item('2026-01-01', NaN), item('2026-01-02', 5)];

      expect(filterValid(entrada)).toEqual([item('2026-01-02', 5)]);
    });

    it('preserva o zero, que é valor legítimo', () => {
      const entrada = [item('2026-01-01', 0)];

      expect(filterValid(entrada)).toHaveLength(1);
    });
  });

  describe('sortAsc', () => {
    it('ordena por data crescente', () => {
      const entrada = [
        item('2026-03-01', 3),
        item('2026-01-01', 1),
        item('2026-02-01', 2),
      ];

      expect(sortAsc(entrada).map((i) => i.valor)).toEqual([1, 2, 3]);
    });

    it('não muta o array recebido', () => {
      const entrada = [item('2026-03-01', 3), item('2026-01-01', 1)];
      sortAsc(entrada);

      // Mutação silenciosa aqui reordenaria dados de outros componentes.
      expect(entrada[0].data).toBe('2026-03-01');
    });
  });

  describe('toLinePoints', () => {
    it('corta a data em YYYY-MM-DD', () => {
      const pontos = toLinePoints([item('2026-07-24T00:00:00-03:00', 42)]);

      expect(pontos).toEqual([{ date: '2026-07-24', value: 42 }]);
    });
  });

  describe('filterByRecentWindow', () => {
    const UM_DIA = 86_400_000;

    it('mantém apenas o que está dentro da janela', () => {
      const entrada = [
        item('2026-01-01', 1),
        item('2026-01-05', 2),
        item('2026-01-10', 3),
      ];

      // Janela de 5 dias contados a partir do ÚLTIMO ponto (10/01).
      const resultado = filterByRecentWindow(entrada, 5 * UM_DIA);

      expect(resultado.map((i) => i.valor)).toEqual([2, 3]);
    });

    it('devolve vazio para entrada vazia', () => {
      expect(filterByRecentWindow([], UM_DIA)).toEqual([]);
    });
  });

  describe('computeClosingsWithVariation', () => {
    it('deixa o primeiro ponto sem variação', () => {
      const linhas = computeClosingsWithVariation([item('2026-01-01', 100)]);

      // Não há ponto anterior: exibir 0% sugeriria estabilidade que não se mediu.
      expect(linhas[0].variation).toBeNull();
    });

    it('calcula a variação percentual frente ao ponto anterior', () => {
      const linhas = computeClosingsWithVariation([
        item('2026-01-01', 100),
        item('2026-01-02', 110),
      ]);

      expect(linhas[1].variation).toBeCloseTo(10, 5);
    });

    it('calcula queda como variação negativa', () => {
      const linhas = computeClosingsWithVariation([
        item('2026-01-01', 200),
        item('2026-01-02', 150),
      ]);

      expect(linhas[1].variation).toBeCloseTo(-25, 5);
    });

    it('ordena antes de calcular, mesmo com entrada fora de ordem', () => {
      const linhas = computeClosingsWithVariation([
        item('2026-01-02', 110),
        item('2026-01-01', 100),
      ]);

      expect(linhas[0].value).toBe(100);
      expect(linhas[1].variation).toBeCloseTo(10, 5);
    });

    it('ignora buracos da série no cálculo', () => {
      const linhas = computeClosingsWithVariation([
        item('2026-01-01', 100),
        item('2026-01-02', null),
        item('2026-01-03', 110),
      ]);

      expect(linhas).toHaveLength(2);
      expect(linhas[1].variation).toBeCloseTo(10, 5);
    });
  });
});