import { describe, expect, it } from 'vitest';
import {
  CHART_INK,
  axisLabel,
  formatCompact,
  formatNumber,
  formatSignedPercent,
  grid,
  hexToRgb,
} from './chartTheme';

/**
 * Estes testes existem por causa de dois defeitos reais que a camada
 * compartilhada veio corrigir: rótulo de eixo em cor quase invisível sobre o
 * fundo escuro, e número formatado no padrão errado ("+2.00%" com ponto, numa
 * interface em pt-BR). Ambos passaram despercebidos porque estavam duplicados
 * em três arquivos e ninguém comparava um com o outro.
 */
describe('chartTheme', () => {
  describe('formatação pt-BR', () => {
    it('usa vírgula decimal e ponto de milhar', () => {
      expect(formatNumber(1234.5)).toBe('1.234,5');
    });

    it('compacta com sufixo em português', () => {
      // A escada manual anterior devolvia "3.4B" — sufixo inglês e separador
      // errado.
      expect(formatCompact(3.44e12)).toContain('tri');
      expect(formatCompact(1.2e6)).toContain('mi');
    });

    it('marca o sinal só nos positivos', () => {
      expect(formatSignedPercent(4.2)).toBe('+4,2%');
      expect(formatSignedPercent(-4.2)).toBe('-4,2%');
    });

    it('limita a uma casa decimal', () => {
      // Duas casas alongavam o rótulo o bastante para os ticks colidirem
      // em 368px.
      expect(formatSignedPercent(2)).toBe('+2%');
      expect(formatSignedPercent(2.06)).toBe('+2,1%');
    });
  });

  describe('rótulo de eixo', () => {
    it('sempre pede hideOverlap', () => {
      // É o que faz o gráfico descartar rótulos que colidiriam em vez de
      // empilhá-los. Faltava no gráfico de barras.
      expect(axisLabel().hideOverlap).toBe(true);
      expect(axisLabel('compact').hideOverlap).toBe(true);
    });

    it('usa cor legível sobre fundo escuro nas duas densidades', () => {
      // O valor antigo do gráfico de barras era #334155 — slate-700, escuro
      // demais para o fundo slate-950 do painel.
      expect(axisLabel().color).toBe(CHART_INK.label);
      expect(axisLabel('compact').color).toBe(CHART_INK.labelDim);
      expect(axisLabel().color).not.toBe(CHART_INK.axis);
    });

    it('só define formatter quando recebe um', () => {
      expect(axisLabel()).not.toHaveProperty('formatter');
      expect(axisLabel('normal', formatNumber)).toHaveProperty('formatter');
    });
  });

  describe('grid', () => {
    it('sempre contém os rótulos', () => {
      // Sem containLabel o ECharts corta o texto do eixo em vez de reservar
      // espaço para ele.
      expect(grid().containLabel).toBe(true);
      expect(grid('compact').containLabel).toBe(true);
    });

    it('deixa margens menores no compacto', () => {
      expect(grid('compact').left).toBeLessThan(grid().left);
    });
  });

  it('converte hex em rgb', () => {
    expect(hexToRgb('#eab308')).toBe('234,179,8');
    expect(hexToRgb('eab308')).toBe('234,179,8');
  });
});
