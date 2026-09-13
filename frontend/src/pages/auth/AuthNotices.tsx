// Rodapé compartilhado por Registro e Login.
//
// Vive aqui, e não em cada página, porque o texto precisa ser o MESMO nas duas
// telas: é a mesma promessa ao visitante, e duas cópias divergiriam na primeira
// vez que alguém editasse só uma.
//
// Não entra no AuthBrandPanel apesar de ser "institucional": aquele painel é
// `hidden lg:flex`, e quem mais precisa deste link é justamente quem abre o
// site no celular.
//
// Havia aqui um segundo aviso, "Site em testes", que explicava a espera de até
// dois minutos no primeiro acesso. Saiu junto com a causa: o Render passou a
// plano pago e a instância não hiberna mais, então não há espera a justificar
// — e avisar de uma lentidão que não existe é pior que não avisar nada.
import { Link } from 'react-router-dom';

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
