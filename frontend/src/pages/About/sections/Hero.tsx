// Hero — a única seção com <h1> e a única com imagem de fundo.
//
// Camadas empilhadas, da base para o topo:
//   1. imagem (object-cover, sem lazy: é o LCP da página)
//   2. véu em dois eixos
//   3. SVG inline com malha e a linha de série temporal
// O SVG é inline, e não um arquivo, porque precisa herdar a cor do tema e
// custa menos que uma requisição para ~1 KB de path.
//
// As animações moram em App.css, atrás do gate de prefers-reduced-motion, no
// mesmo padrão que o projeto já usa. O estado final é o padrão do CSS: quem
// pede menos movimento vê a linha desenhada e a imagem visível, sem transição.
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

const heroBg = findAboutImage('sobre02');

/** Vértices da série temporal — a linha e os pontos leem a mesma fonte. */
const SERIE: readonly (readonly [number, number])[] = [
  [0, 470], [120, 440], [240, 460], [360, 390], [480, 410], [600, 330],
  [720, 350], [840, 260], [960, 285], [1080, 190], [1200, 215],
];

const CAMINHO = SERIE.map(([x, y], i) => `${i === 0 ? 'M' : 'L'}${x} ${y}`).join(' ');

/** Malha + linha de série temporal. Decorativo: fora da árvore de a11y. */
function HeroGraphic() {
  return (
    <svg
      aria-hidden="true"
      className="absolute inset-0 h-full w-full text-fg"
      preserveAspectRatio="none"
      viewBox="0 0 1200 600"
    >
      <defs>
        <pattern
          id="hero-grid"
          width="60"
          height="60"
          patternUnits="userSpaceOnUse"
        >
          <path
            d="M60 0H0v60"
            fill="none"
            stroke="currentColor"
            strokeWidth="1"
            opacity="0.06"
          />
        </pattern>
      </defs>

      <rect width="1200" height="600" fill="url(#hero-grid)" />

      {/* pathLength="1" normaliza o comprimento, então o dasharray do
          App.css não precisa saber a medida real do traçado. */}
      <path
        className="hero-line"
        d={CAMINHO}
        pathLength="1"
        fill="none"
        stroke="var(--color-accent)"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        opacity="0.22"
      />

      {/* Pontos nos vértices. O atraso escalonado acompanha o traçado da
          linha, de modo que cada ponto acende quando ela chega nele. */}
      {SERIE.map(([x, y], i) => (
        <circle
          key={x}
          className="hero-vertex"
          cx={x}
          cy={y}
          r="3.5"
          fill="var(--color-accent)"
          opacity="0.3"
          style={{ animationDelay: `${200 + i * 150}ms` }}
        />
      ))}
    </svg>
  );
}

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
      {/* Camada 1 — imagem.
          O espelhamento (-scale-x-100) não é capricho: a arara está composta
          na metade ESQUERDA da foto, exatamente onde fica o texto. object-right
          não resolveria, porque mostraria só a folhagem desfocada da direita.
          Espelhar joga a ave para o lado livre sem recortar nada dela.

          saturate-[.55] contém o azul e o amarelo da plumagem, que competiriam
          com o accent esmeralda — a página tem um accent só, por decisão de
          design. A foto continua reconhecível, só para de disputar atenção.

          A escala de entrada vive no wrapper, e não na <img>, para não brigar
          com o transform do espelhamento. */}
      {heroBg !== undefined && (
        <div className="hero-image-frame absolute inset-0 -z-20 overflow-hidden">
          <img
            src={heroBg}
            alt={HERO.backgroundAlt}
            // Sem loading="lazy": está acima da dobra e é o LCP.
            fetchPriority="high"
            className="h-full w-full object-cover -scale-x-100 saturate-[.55] opacity-70"
          />
        </div>
      )}

      {/* Camada 2 — véu em dois eixos, e não um só.
          O texto ocupa a metade esquerda; a arara, depois de espelhada, a
          direita. Um véu uniforme forte o bastante para proteger o texto
          apagaria a foto inteira. O gradiente horizontal concentra o
          escurecimento onde há texto e libera a direita para a arte; o
          vertical apenas costura o hero com o fundo da próxima seção. */}
      <div
        aria-hidden="true"
        className="absolute inset-0 -z-10 bg-gradient-to-r from-ink via-ink/85 to-ink/30"
      />
      <div
        aria-hidden="true"
        className="absolute inset-0 -z-10 bg-gradient-to-b from-ink/50 via-transparent to-ink"
      />

      {/* Camada 3 — borda de luz.
          Vem DEPOIS dos véus no DOM de propósito: os três estão em -z-10, e
          entre irmãos de mesmo z quem vem depois pinta por cima. Se viesse
          antes, o véu apagaria justamente o realce que ela existe para dar.

          O gradiente e a respiração moram em App.css (.hero-edge-glow), e não
          em utilities, porque envolvem color-mix, mix-blend-mode e keyframes —
          nada disso cabe em classe utilitária sem virar valor arbitrário. */}
      <div aria-hidden="true" className="hero-edge-glow absolute inset-0 -z-10" />

      {/* Camada 4 — grafismo */}
      <div aria-hidden="true" className="absolute inset-0 -z-10">
        <HeroGraphic />
      </div>

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
