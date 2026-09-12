import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { CoinIcon } from './CriptoPage';

/**
 * A tabela de criptomoedas mostrava o placeholder de imagem quebrada em todas
 * as linhas: a CSP entrou com `img-src 'self' data:` e o navegador recusava os
 * ícones, que vêm da CoinGecko e da CoinMarketCap. Os hosts foram liberados no
 * vercel.json; este componente cobre o que sobra — a falha pontual, de uma
 * moeda só, que nenhuma CSP resolve.
 */
describe('CoinIcon', () => {
  it('mostra a imagem da fonte quando há URL', () => {
    render(<CoinIcon src="https://s2.coinmarketcap.com/static/img/coins/64x64/1.png" symbol="btc" />);
    const img = document.querySelector('img');
    expect(img).not.toBeNull();
    expect(img?.getAttribute('src')).toContain('coinmarketcap.com');
  });

  it('cai para a inicial do símbolo quando a imagem falha', () => {
    render(<CoinIcon src="https://exemplo.invalido/nao-existe.png" symbol="eth" />);

    fireEvent.error(document.querySelector('img')!);

    expect(document.querySelector('img')).toBeNull();
    expect(screen.getByText('et')).toBeInTheDocument();
  });

  it('não tenta carregar nada quando a fonte não mandou URL', () => {
    render(<CoinIcon symbol="sol" />);
    expect(document.querySelector('img')).toBeNull();
    expect(screen.getByText('so')).toBeInTheDocument();
  });

  // O nome da moeda já aparece em texto na mesma linha da tabela. Repetir no
  // alt faria o leitor de tela anunciar duas vezes, e o fallback é puramente
  // visual — daí o aria-hidden.
  it('não duplica o nome da moeda para o leitor de tela', () => {
    const { rerender } = render(<CoinIcon src="https://exemplo.test/btc.png" symbol="btc" />);
    expect(document.querySelector('img')?.getAttribute('alt')).toBe('');

    rerender(<CoinIcon symbol="btc" />);
    expect(screen.getByText('bt')).toHaveAttribute('aria-hidden', 'true');
  });
});
