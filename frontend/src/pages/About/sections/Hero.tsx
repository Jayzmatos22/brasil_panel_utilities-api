// Hero — a única seção com <h1> e a única com imagem de fundo.
//
// UMA camada, e não cinco. A composição que antes era montada em tempo de
// execução — foto tratada, véu em dois eixos, borda de luz e um SVG de malha
// mais linha de série — hoje vem ASSADA nas próprias artes. O que sobra aqui é
// a <picture> e o texto por cima dela.
//
// A troca não foi por elegância: as cinco camadas custavam quatro elementos
// posicionados e um SVG de 11 vértices compondo a cada quadro, sobre a imagem
// que é o LCP da página. As artes assadas pesam 45 kB (2400x1000) e 32 kB
// (1200x1600) — menos que os 182 kB da foto que substituem.
//
// O QUE SE PERDEU, para quem for reverter: a linha da série era desenhada na
// entrada (hero-line-draw, 1,8s) e os 11 vértices acendiam em cascata atrás
// dela. Em pixels isso é estático. O histórico do git tem o SVG inteiro, com
// os vértices e o pattern da malha, caso valha a pena trazer de volta por
// cima da variante sem grafismo.
//
// O que ainda é CSS: a animação de entrada da imagem (.hero-image-frame) e a
// continuação da borda verde na seção seguinte (.hero-edge-carry, em
// Metrics.tsx) — esta última agora casa com a base da ARTE, não com um
// gradiente irmão. Ver a nota em App.css.
import { Link } from 'react-router-dom';
import {
  BUTTON_GHOST,
  BUTTON_PRIMARY,
  CONTAINER,
  EYEBROW,
} from '../components/styles';
import { isAuthenticated } from '../../../lib/auth/jwt';
import { DASHBOARD_CTA, HERO, SITE_NAME } from '../data/content';
import { findAboutImage } from '../data/images';

// Prefixos COMPLETOS, e não 'sobre02'.
//
// Os dois arquivos começam com sobre02, então o prefixo curto casaria com os
// dois e o resolvedor entregaria um por ordem de glob — sorteio, não escolha.
// A arte antiga (sobre02-panel2-img) saiu justamente por dividir esse prefixo.
const heroWide = findAboutImage('sobre02-hero-arara-desktop');
const heroMobile = findAboutImage('sobre02-hero-arara-mobile');

export function Hero() {
  // A página é alcançável por quem já tem sessão (/sobre não tem guarda).
  // Oferecer "Criar conta" a essa pessoa manda ela para uma tela que o
  // PublicOnly vai rejeitar — o atalho honesto é o painel.
  const primaryCta = isAuthenticated() ? DASHBOARD_CTA : HERO.primaryCta;

  return (
    <section
      id="inicio"
      aria-labelledby="hero-title"
      className="relative isolate overflow-hidden"
    >
      {/* Camada única — a arte.
          Duas artes, uma por formato, porque a composição difere: na de
          desktop (2400x1000) a arara ocupa o terço direito e a metade esquerda
          fica limpa para o texto; na de celular (1200x1600) a ave sobe para o
          terço superior e o texto ocupa a metade de baixo. Recortar a paisagem
          em retrato colocaria a ave atrás do <h1>.

          <picture> e não duas <img> alternadas por CSS: com `display: none` o
          navegador ainda baixa a escondida, e seriam dois downloads para
          mostrar um. O <source media> escolhe ANTES do fetch.

          SEM -scale-x-100, saturate-[.55] ou opacity-70, que a versão anterior
          aplicava. Os três já estão assados na arte — o espelhamento, então,
          seria ativamente errado: a ave já nasce à direita, e espelhar a jogaria
          de volta para debaixo do texto.

          A escala de entrada vive no wrapper, e não na <img>: é o que sobrou de
          animação nesta seção. */}
      {(heroWide !== undefined || heroMobile !== undefined) && (
        <div className="hero-image-frame absolute inset-0 -z-10 overflow-hidden">
          <picture>
            {heroWide !== undefined && (
              <source media="(min-width: 48rem)" srcSet={heroWide} />
            )}
            <img
              src={heroMobile ?? heroWide}
              alt={HERO.backgroundAlt}
              // Sem loading="lazy": está acima da dobra e é o LCP.
              fetchPriority="high"
              className="h-full w-full object-cover"
            />
          </picture>
        </div>
      )}

      <div className={`${CONTAINER} py-28 md:py-40`}>
        <div className="max-w-3xl">
          <p className={EYEBROW}>{HERO.eyebrow}</p>

          <h1
            id="hero-title"
            className="mt-6 text-4xl font-semibold leading-[1.05] tracking-tight text-fg sm:text-5xl md:text-6xl"
          >
            {HERO.title}
            <br />
            <span className="text-accent">{HERO.highlight}</span>
          </h1>

          <p className="mt-7 max-w-2xl text-base leading-relaxed text-fg-muted md:text-lg">
            {HERO.subtitle}
          </p>

          <div className="mt-10 flex flex-col gap-3 sm:flex-row sm:items-center">
            <Link to={primaryCta.href} className={BUTTON_PRIMARY}>
              {primaryCta.label}
            </Link>

            {/* Âncora interna: <a> puro, não <Link> — não troca de rota. */}
            <a href={HERO.secondaryCta.href} className={BUTTON_GHOST}>
              {HERO.secondaryCta.label}
            </a>
          </div>

          <p className="mt-12 text-micro uppercase tracking-[0.18em] text-fg-muted">
            {SITE_NAME}
          </p>
        </div>
      </div>
    </section>
  );
}
