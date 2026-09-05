// Arte de fundo das telas de Registro e Login.
//
// DUAS artes, uma por faixa de viewport, porque a composição que funciona nas
// duas é diferente: no celular a tela é um retrato alto e a arte vira o fundo
// da página inteira; de md para cima ela é paisagem e divide espaço com o
// painel de marca. Uma foto só não serve aos dois — recortar um retrato em
// paisagem sobra fundo e falta assunto.
//
//   registro-login0  → abaixo de md (< 768px)
//   registro-login1  → md e acima
//
// <picture> e não duas <img> alternadas por CSS: com `display: none` o
// navegador ainda baixa a imagem escondida, e seriam dois downloads para
// mostrar um. O <source media> faz a escolha ANTES do fetch, então cada
// aparelho baixa exatamente a arte que vai usar.
//
// Fica FORA do AuthBrandPanel de propósito, mesmo o desktop desenhando a arte
// dentro dele. O painel é `hidden lg:flex` — se a imagem morasse lá dentro, ela
// simplesmente não existiria no mobile, que é justamente onde o pedido era que
// ela virasse o fundo da página.
import { findAuthImage } from './images';

// Resolvidas no módulo, não no render: o glob é estático e o valor nunca muda
// entre renders. Ler no corpo do componente só repetiria o trabalho a cada
// digitação do formulário.
const artMobile = findAuthImage('registro-login0');
const artWide = findAuthImage('registro-login1');

/**
 * Camada de arte das telas de autenticação.
 *
 * Renderiza `null` quando não há nenhuma das duas artes em `assets/app/` — as
 * telas ficam com o `.bg-smoke-abyss` puro, sem ícone de imagem quebrada. É o
 * contrato que `findAuthImage()` documenta.
 *
 * Com apenas UMA das duas presentes, ela serve as duas faixas: um retrato
 * recortado em paisagem é melhor que meia tela vazia. `data-art` publica qual é
 * o caso, para o CSS poder voltar a cortar por faixa sem reabrir este arquivo.
 */
export function AuthBackdrop() {
  if (artMobile === undefined && artWide === undefined) return null;

  const faixa =
    artMobile !== undefined && artWide !== undefined
      ? 'ambas'
      : artWide !== undefined
        ? 'wide'
        : 'mobile';

  return (
    // aria-hidden e não um alt descritivo: a imagem é atmosfera, não conteúdo.
    // Nada nela é informação que o formulário ao lado já não dê, e anunciá-la
    // só atrasaria quem usa leitor de tela para chegar aos campos.
    <div className="auth-backdrop" data-art={faixa} aria-hidden="true">
      <picture>
        {artWide !== undefined && (
          <source media="(min-width: 48rem)" srcSet={artWide} />
        )}
        <img
          src={artMobile ?? artWide}
          alt=""
          // Sem loading="lazy": está acima da dobra e é o LCP destas telas.
          fetchPriority="high"
          decoding="async"
        />
      </picture>
    </div>
  );
}
