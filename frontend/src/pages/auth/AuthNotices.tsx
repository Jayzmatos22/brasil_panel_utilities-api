// Dois avisos compartilhados por Registro e Login.
//
// Vivem aqui, e não em cada página, porque o texto precisa ser o MESMO nas duas
// telas: são a mesma promessa ao visitante, e duas cópias divergiriam na
// primeira vez que alguém editasse só uma.
//
// Não entram no AuthBrandPanel apesar de serem "institucionais": aquele painel
// é `hidden lg:flex`, e quem mais precisa destes dois avisos é justamente quem
// abre o site no celular.
import { Link } from 'react-router-dom';
import { FlaskConical } from 'lucide-react';

/**
 * Aviso de que o site está em testes e por que a primeira resposta demora.
 *
 * O número não é retórico. O backend roda no plano gratuito do Render, que
 * hiberna após ~15 min sem requisição, e o boot completo leva ~150s — é por isso
 * que `VITE_API_TIMEOUT_MS` vale 180000 em produção (ver .env.example). Sem este
 * aviso, quem chega depois de um período parado clica em "Entrar", espera dois
 * minutos olhando para um botão girando e conclui que o site está quebrado.
 *
 * Fica ANTES do formulário de propósito. Depois do botão ele só explicaria uma
 * espera que já teria começado; antes, ele a torna esperada.
 */
export function AuthTestingNotice() {
  return (
    <div className="flex gap-3 rounded-card border border-hairline-strong bg-surface-2 p-3">
      {/* O ícone é o único elemento colorido, e é âmbar de propósito contido:
          âmbar nesta tela é a cor do botão de submit, o único alvo da página.
          Um bloco inteiro em âmbar disputaria atenção com ele — um ícone de
          15px sinaliza sem competir. */}
      <FlaskConical
        size={15}
        className="mt-0.5 shrink-0 text-amber-400"
        aria-hidden="true"
      />
      <p className="text-micro leading-relaxed text-slate-300">
        <span className="font-semibold text-white">Site em testes.</span>{' '}
        O servidor hiberna quando fica sem uso, então o primeiro acesso pode
        levar até cerca de dois minutos para responder. Depois disso a navegação
        é normal.
      </p>
    </div>
  );
}

/**
 * Link para a página institucional.
 *
 * `Link` e não o `useNavigate` que as duas telas usam nos botões de alternância:
 * ali o alvo é uma troca de contexto dentro do mesmo fluxo, aqui é uma página
 * de verdade. Como <a>, ela abre em nova aba pelo clique do meio, aparece na
 * lista de links do leitor de tela e o navegador mostra o destino na barra de
 * status — nada disso um <button> entrega.
 */
export function AuthAboutLink() {
  return (
    <Link
      to="/sobre"
      className="text-micro text-slate-400 underline decoration-slate-700 underline-offset-4
                 transition-colors hover:text-slate-200 hover:decoration-slate-500
                 rounded-control px-2 py-1 coarse:min-h-11 coarse:inline-flex coarse:items-center
                 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-400/60"
    >
      Conheça o projeto e as fontes dos dados
    </Link>
  );
}
