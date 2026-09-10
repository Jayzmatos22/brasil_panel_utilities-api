// A barra de participação é o ponto do painel, e é onde um erro passa calado:
// se uma fatia sai com largura errada, nada quebra — o desenho só mente.
import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { AggregatedTotalPanel } from './AggregatedTotalPanel';
import type { AggregatedTotal } from '../../../types/utilities/Economy';

const agregado = (
  shares: AggregatedTotal['shares'],
  extra: Partial<AggregatedTotal> = {},
): AggregatedTotal => ({
  totalCurrent: shares.reduce((s, x) => s + x.value, 0),
  totalPrevious: 0,
  totalYoY: 0,
  variationMM: 10,
  variationYoY: -5,
  referenceMonth: '2026-07',
  shares,
  ...extra,
});

/** As <div> de fatia não têm papel semântico — são lidas pelo title. */
const fatias = (c: HTMLElement) =>
  Array.from(c.querySelectorAll<HTMLElement>('div[title]'));

describe('AggregatedTotalPanel — barra de participação', () => {
  it('desenha uma fatia por série, com a largura da participação', () => {
    const { container } = render(
      <AggregatedTotalPanel
        title="T"
        subtitle="S"
        aggregate={agregado([
          { key: 'a', label: 'Alfa', value: 75, pct: 75 },
          { key: 'b', label: 'Beta', value: 25, pct: 25 },
        ])}
      />,
    );
    const f = fatias(container);
    expect(f.map((e) => e.style.width)).toEqual(['75%', '25%']);
    expect(f[0].title).toBe('Alfa: 75.0%');
  });

  it('usa a cor do mapa por key, e o accent do painel como fallback', () => {
    const { container } = render(
      <AggregatedTotalPanel
        title="T"
        subtitle="S"
        accent="#f59e0b"
        accentsByKey={{ a: '#34d399' }}
        aggregate={agregado([
          { key: 'a', label: 'Alfa', value: 50, pct: 50 },
          { key: 'b', label: 'Beta', value: 50, pct: 50 },
        ])}
      />,
    );
    const cores = fatias(container).map((e) => e.style.backgroundColor);
    expect(cores).toEqual(['rgb(52, 211, 153)', 'rgb(245, 158, 11)']);
  });

  it('trava largura negativa em zero, em vez de emitir CSS inválido', () => {
    // Participação negativa só aparece quando as séries somadas NÃO formam um
    // todo — caso da Balança de Pagamentos, que tem saldos negativos. Sem o
    // clamp o navegador descarta `width: -20%` e a fatia some sem aviso.
    const { container } = render(
      <AggregatedTotalPanel
        title="T"
        subtitle="S"
        aggregate={agregado([
          { key: 'a', label: 'Alfa', value: 120, pct: 120 },
          { key: 'b', label: 'Beta', value: -20, pct: -20 },
        ])}
      />,
    );
    expect(fatias(container).map((e) => e.style.width)).toEqual(['120%', '0%']);
  });

  it('sem agregado, avisa em vez de desenhar barra vazia', () => {
    const { container } = render(
      <AggregatedTotalPanel title="T" subtitle="S" aggregate={null} />,
    );
    expect(screen.getByText('Sem dados para agregar.')).toBeInTheDocument();
    expect(fatias(container)).toHaveLength(0);
  });

  it('o contador do cabeçalho acompanha o número de séries', () => {
    render(
      <AggregatedTotalPanel
        title="T"
        subtitle="S"
        aggregate={agregado([
          { key: 'a', label: 'A', value: 1, pct: 25 },
          { key: 'b', label: 'B', value: 1, pct: 25 },
          { key: 'c', label: 'C', value: 1, pct: 25 },
          { key: 'd', label: 'D', value: 1, pct: 25 },
        ])}
      />,
    );
    expect(screen.getByText('4 séries')).toBeInTheDocument();
  });
});
