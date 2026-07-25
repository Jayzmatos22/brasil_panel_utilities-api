import { Component, type ErrorInfo, type ReactNode } from 'react';
import { AlertTriangle, RefreshCw } from 'lucide-react';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
}

/**
 * Captura erros de renderização na subárvore e mostra uma tela de recuperação.
 *
 * Sem isso, qualquer exceção durante o render desmonta a árvore inteira e o
 * usuário fica olhando uma página em branco, sem pista do que aconteceu nem como
 * sair dali.
 *
 * Cobre também falhas de carregamento dos chunks das páginas lazy — uma aba
 * aberta durante um deploy novo pede um arquivo que já não existe. Nesse caso
 * recarregar resolve, que é o que o botão faz.
 *
 * Precisa ser class component: o React não oferece equivalente em hooks.
 */
export class ErrorBoundary extends Component<Props, State> {
  state: State = { hasError: false };

  static getDerivedStateFromError(): State {
    return { hasError: true };
  }

  componentDidCatch(error: Error, info: ErrorInfo): void {
    // Único lugar onde este erro fica visível — sem log, ele some silenciosamente.
    console.error('Erro não tratado na árvore React:', error, info.componentStack);
  }

  render(): ReactNode {
    if (!this.state.hasError) {
      return this.props.children;
    }

    return (
      <div className="flex flex-col items-center justify-center gap-4 py-24 text-center">
        <AlertTriangle className="text-amber-400" size={40} />

        <div className="flex flex-col gap-1">
          <h2 className="text-lg font-semibold text-white">
            Não foi possível carregar esta página
          </h2>
          <p className="text-sm text-slate-500 max-w-md">
            Algo falhou ao montar a tela. Recarregar costuma resolver — se o
            problema persistir, tente novamente em alguns minutos.
          </p>
        </div>

        <button
          type="button"
          onClick={() => window.location.reload()}
          className="flex items-center gap-2 rounded-lg bg-amber-400 px-4 py-2 text-sm
                     font-medium text-slate-950 transition-colors hover:bg-amber-300
                     cursor-pointer"
        >
          <RefreshCw size={16} />
          Recarregar
        </button>
      </div>
    );
  }
}