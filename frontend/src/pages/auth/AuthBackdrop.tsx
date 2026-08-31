// Arte de fundo das telas de Registro e Login.
//
// Uma camada só, `position: fixed`, compartilhada pelas duas telas — e não uma
// por tela, nem uma por breakpoint. O que muda entre mobile e desktop é o
// enquadramento e a máscara, e isso é papel do CSS (App.css, seção "Arte das
// telas de autenticação"), não de duas <img> alternadas por classe: duas
// <img> fariam o navegador baixar a mesma foto duas vezes e a que estivesse
// escondida ainda contaria para o LCP.
//
// Fica FORA do AuthBrandPanel de propósito, mesmo o desktop desenhando a arte
// dentro dele. O painel é `hidden lg:flex` — se a imagem morasse lá dentro, ela
// simplesmente não existiria no mobile, que é justamente onde o pedido era que
// ela virasse o fundo da página.
import { findAuthImage } from './images';

// Resolvido no módulo, não no render: o glob é estático e o valor nunca muda
// entre renders. Ler no corpo do componente só repetiria o trabalho a cada
// digitação do formulário.
const authBg = findAuthImage('registro-login0');

/**
 * Camada de arte das telas de autenticação.
 *
 * Renderiza `null` quando não há arquivo em `assets/app/` — as telas ficam com
 * o `.bg-smoke-abyss` puro, sem ícone de imagem quebrada. É o contrato que
 * `findAuthImage()` documenta.
 */
export function AuthBackdrop() {
  if (authBg === undefined) return null;

  return (
    // aria-hidden e não um alt descritivo: a imagem é atmosfera, não conteúdo.
    // Nada nela é informação que o formulário ao lado já não dê, e anunciá-la
    // só atrasaria quem usa leitor de tela para chegar aos campos.
    <div className="auth-backdrop" aria-hidden="true">
      <img
        src={authBg}
        alt=""
        // Sem loading="lazy": está acima da dobra e é o LCP destas telas.
        fetchPriority="high"
        decoding="async"
      />
    </div>
  );
}
