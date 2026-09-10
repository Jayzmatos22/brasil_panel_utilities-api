// A cascata existe para aceitar sinal negativo — é o que a barra empilhada não
// consegue fazer. Os testes travam justamente o posicionamento por acumulado,
// que é onde um erro passaria despercebido: as barras continuariam bonitas.
import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { WaterfallPanel } from './WaterfallPanel';
import type { WaterfallBreakdown } from '../../../types/utilities/Economy';

const fmt = (v: number) => `US$ ${Math.abs(v)}`;

/** Cascata: +100 → −60 → resíduo +10, fechando em 50. Escala 0..100. */
const base = (over: Partial<WaterfallBreakdown> = {}): WaterfallBreakdown => ({
  referenceMonth: '2026-07',
  totalValue: 50,
  totalLabel: 'Saldo',
  steps: [
    { key: 'a', label: 'Comercial', value: 100, start: 0, end: 100 },
    { key: 'b', label: 'Serviços', value: -60, start: 100, end: 40 },
    { key: '__residual', label: 'Demais', value: 10, start: 40, end: 50, isResidual: true },
  ],
  min: 0,
  max: 100,
  omitted: [],
  ...over,
});

const barras = (c: HTMLElement) =>
  Array.from(c.querySelectorAll<HTMLElement>('div[role="img"] > div:first-child'));

describe('WaterfallPanel', () => {
  it('posiciona cada barra no trecho entre o antes e o depois', () => {
    const { container } = render(
      <WaterfallPanel title="T" subtitle="S" valueFormatter={fmt} breakdown={base()} />,
    );
    const b = barras(container);
    expect([b[0].style.left, b[0].style.width]).toEqual(['0%', '100%']);
    // Passo negativo: vai de 40 a 100 na escala, ou seja, começa em 40%.
    expect([b[1].style.left, b[1].style.width]).toEqual(['40%', '60%']);
    expect([b[2].style.left, b[2].style.width]).toEqual(['40%', '10%']);
  });

  it('colore por sinal da contribuicao, nao por posicao', () => {
    const { container } = render(
      <WaterfallPanel
        title="T" subtitle="S" valueFormatter={fmt}
        positiveColor="#00ff00" negativeColor="#ff0000"
        breakdown={base()}
      />,
    );
    const cores = barras(container).map((b) => b.style.backgroundColor);
    expect(cores).toEqual(['rgb(0, 255, 0)', 'rgb(255, 0, 0)', 'rgb(0, 255, 0)']);
  });

  it('marca o passo de residuo como calculado por diferenca', () => {
    render(
      <WaterfallPanel title="T" subtitle="S" valueFormatter={fmt} breakdown={base()} />,
    );
    expect(screen.getByText('por diferença')).toBeInTheDocument();
  });

  it('desenha a marca do zero mesmo com escala toda negativa', () => {
    const { container } = render(
      <WaterfallPanel
        title="T" subtitle="S" valueFormatter={fmt}
        breakdown={base({
          totalValue: -80, min: -80, max: 0,
          steps: [{ key: 'a', label: 'A', value: -80, start: 0, end: -80 }],
        })}
      />,
    );
    const zero = container.querySelector<HTMLElement>('div[role="img"] > div:last-child');
    expect(zero?.style.left).toBe('100%'); // zero é o topo da escala aqui
  });

  it('garante largura minima visivel para contribuicao quase nula', () => {
    const { container } = render(
      <WaterfallPanel
        title="T" subtitle="S" valueFormatter={fmt}
        breakdown={base({
          steps: [{ key: 'a', label: 'A', value: 0, start: 50, end: 50 }],
        })}
      />,
    );
    // Sem o piso, um passo de valor zero sumiria da cascata sem explicacao.
    expect(barras(container)[0].style.width).toBe('0.6%');
  });

  it('explica por que a diferenca sumiu quando ha serie faltando', () => {
    render(
      <WaterfallPanel
        title="T" subtitle="S" valueFormatter={fmt}
        breakdown={base({ omitted: ['Renda Primária'] })}
      />,
    );
    expect(screen.getByText(/absorveria estas séries/)).toBeInTheDocument();
    expect(screen.getByText('Renda Primária')).toBeInTheDocument();
  });

  it('sem dados, avisa em vez de desenhar cascata vazia', () => {
    const { container } = render(
      <WaterfallPanel title="T" subtitle="S" valueFormatter={fmt} breakdown={null} />,
    );
    expect(screen.getByText('Sem dados no mês de referência.')).toBeInTheDocument();
    expect(barras(container)).toHaveLength(0);
  });
});
