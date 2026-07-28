import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { ErrorBoundary } from './ErrorBoundary';

/** Componente que quebra no render, para acionar o boundary. */
function Explode(): React.ReactElement {
  throw new Error('falha proposital de render');
}

describe('ErrorBoundary', () => {
  let consoleError: ReturnType<typeof vi.spyOn>;

  beforeEach(() => {
    // O React sempre imprime o erro capturado; silenciar mantém a saída legível
    // e permite afirmar que o boundary também registrou o seu próprio log.
    consoleError = vi.spyOn(console, 'error').mockImplementation(() => {});
  });

  afterEach(() => {
    consoleError.mockRestore();
  });

  it('renderiza os filhos quando nada falha', () => {
    render(
      <ErrorBoundary>
        <p>conteúdo normal</p>
      </ErrorBoundary>,
    );

    expect(screen.getByText('conteúdo normal')).toBeInTheDocument();
  });

  it('mostra a tela de recuperação quando um filho quebra', () => {
    render(
      <ErrorBoundary>
        <Explode />
      </ErrorBoundary>,
    );

    // Sem o boundary, isto seria uma página em branco.
    expect(screen.getByText(/não foi possível carregar esta página/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /recarregar/i })).toBeInTheDocument();
  });

  it('registra o erro para diagnóstico', () => {
    render(
      <ErrorBoundary>
        <Explode />
      </ErrorBoundary>,
    );

    // É o único lugar onde este erro fica visível.
    expect(consoleError).toHaveBeenCalled();
  });

  it('o botão recarrega a página', async () => {
    const reload = vi.fn();
    Object.defineProperty(window, 'location', {
      configurable: true,
      value: { reload },
    });

    render(
      <ErrorBoundary>
        <Explode />
      </ErrorBoundary>,
    );
    await userEvent.click(screen.getByRole('button', { name: /recarregar/i }));

    // Recarregar é o que resolve o caso de chunk lazy ausente após um deploy.
    expect(reload).toHaveBeenCalledOnce();
  });

  it('não mostra a tela de erro quando o conteúdo funciona', () => {
    render(
      <ErrorBoundary>
        <p>irmão saudável</p>
      </ErrorBoundary>,
    );

    expect(screen.getByText('irmão saudável')).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /recarregar/i })).not.toBeInTheDocument();
  });
});