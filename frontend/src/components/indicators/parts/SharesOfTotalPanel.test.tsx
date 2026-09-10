// O ponto deste painel é NÃO empilhar. Cada categoria tem barra própria porque
// as partes podem se sobrepor e passar de 100% somadas — os testes travam
// justamente esse comportamento, que numa barra empilhada seria bug.
import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { SharesOfTotalPanel } from './SharesOfTotalPanel';
import type { SharesOfTotal } from '../../../types/utilities/Economy';

const base = (over: Partial<SharesOfTotal> = {}): SharesOfTotal => ({
  referenceMonth: '2026-07',
  totalValue: 1000,
  parts: [
    { key: 'a', label: 'Produtos Básicos', value: 550, pct: 55 },
    { key: 'b', label: 'Combustíveis', value: 120, pct: 12 },
  ],
  omitted: [],
  ...over,
});

const barras = (c: HTMLElement) =>
  Array.from(c.querySelectorAll<HTMLElement>('div[role="img"] > div'));

const fmt = (v: number) => `US$ ${v}`;

describe('SharesOfTotalPanel', () => {
  it('desenha uma barra por categoria, com largura igual à participação', () => {
    const { container } = render(
      <SharesOfTotalPanel
        title="T" subtitle="S" totalLabel="Total"
        valueFormatter={fmt} shares={base()}
      />,
    );
    expect(barras(container).map((b) => b.style.width)).toEqual(['55%', '12%']);
  });

  it('aceita participações que somam mais de 100%, sem encolher nenhuma', () => {
    // Petróleo é básico E combustível: as duas contam o mesmo dólar, e as duas
    // estão certas. Numa barra empilhada isso teria de ser normalizado.
    const { container } = render(
      <SharesOfTotalPanel
        title="T" subtitle="S" totalLabel="Total" valueFormatter={fmt}
        shares={base({
          parts: [
            { key: 'a', label: 'Básicos', value: 800, pct: 80 },
            { key: 'b', label: 'Combustíveis', value: 600, pct: 60 },
          ],
        })}
      />,
    );
    expect(barras(container).map((b) => b.style.width)).toEqual(['80%', '60%']);
  });

  it('trava o desenho em 100% sem mentir no número ao lado', () => {
    const { container } = render(
      <SharesOfTotalPanel
        title="T" subtitle="S" totalLabel="Total" valueFormatter={fmt}
        shares={base({ parts: [{ key: 'a', label: 'A', value: 1300, pct: 130 }] })}
      />,
    );
    expect(barras(container)[0].style.width).toBe('100%');
    expect(screen.getByText('130.0%')).toBeInTheDocument();
  });

  it('anuncia as séries omitidas, para ausência não parecer zero', () => {
    render(
      <SharesOfTotalPanel
        title="T" subtitle="S" totalLabel="Total" valueFormatter={fmt}
        shares={base({ omitted: ['Bens de Consumo'] })}
      />,
    );
    expect(screen.getByText(/Fora do cálculo/)).toBeInTheDocument();
    expect(screen.getByText('Bens de Consumo')).toBeInTheDocument();
  });

  it('sem omitidas, não mostra a nota de rodapé', () => {
    render(
      <SharesOfTotalPanel
        title="T" subtitle="S" totalLabel="Total"
        valueFormatter={fmt} shares={base()}
      />,
    );
    expect(screen.queryByText(/Fora do cálculo/)).not.toBeInTheDocument();
  });

  it('cada barra se anuncia para leitor de tela', () => {
    render(
      <SharesOfTotalPanel
        title="T" subtitle="S" totalLabel="Total"
        valueFormatter={fmt} shares={base()}
      />,
    );
    expect(
      screen.getByLabelText('Produtos Básicos: 55.0% do total'),
    ).toBeInTheDocument();
  });

  it('sem dados, avisa em vez de desenhar barras vazias', () => {
    const { container } = render(
      <SharesOfTotalPanel
        title="T" subtitle="S" totalLabel="Total"
        valueFormatter={fmt} shares={null}
      />,
    );
    expect(screen.getByText('Sem dados no mês de referência.')).toBeInTheDocument();
    expect(barras(container)).toHaveLength(0);
  });
});
