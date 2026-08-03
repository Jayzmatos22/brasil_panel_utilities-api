// Hero — a única seção com <h1> e a única com imagem de fundo.
//
// Três camadas empilhadas, da base para o topo:
//   1. imagem (object-cover, sem lazy: é o LCP da página)
//   2. véu escuro + gradiente para o fundo da página
//   3. SVG inline com malha e uma linha de série temporal
// O SVG é inline, e não um arquivo, porque precisa herdar a cor do tema e
// custa menos que uma requisição para ~1 KB de path.
import { Link } from 'react-router-dom';
import {
  BUTTON_GHOST,
  BUTTON_PRIMARY,
  CONTAINER,
  EYEBROW,
} from '../components/styles';
import { HERO, SITE_NAME } from '../data/content';

// TODO(imagem): textura de fundo do hero — algo abstrato e escuro (linhas de
// série temporal, malha, papel granulado). Paisagem, ~2400×1200, já
// escurecida na origem. Substituir o placeholder 1×1 por este arquivo.
import heroBg from '../../../assets/about/hero-bg.webp';

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

      {/* Série temporal: sobe da esquerda para a direita, com recuos. */}
      <path
        d="M0 470 L120 440 L240 460 L360 390 L480 410 L600 330 L720 350 L840 260 L960 285 L1080 190 L1200 215"
        fill="none"
        stroke="var(--color-accent)"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        opacity="0.22"
      />
    </svg>
  );
}

export function Hero() {
  return (
    <section
      id="inicio"
      aria-labelledby="hero-title"
      className="relative isolate overflow-hidden"
    >
      {/* Camada 1 — imagem */}
      <img
        src={heroBg}
        alt={HERO.backgroundAlt}
        // Sem loading="lazy": está acima da dobra e é o LCP.
        fetchPriority="high"
        className="absolute inset-0 -z-20 h-full w-full object-cover opacity-30"
      />

      {/* Camada 2 — véu: garante o contraste AA do texto sobre qualquer foto */}
      <div
        aria-hidden="true"
        className="absolute inset-0 -z-10 bg-gradient-to-b from-ink/80 via-ink/90 to-ink"
      />

      {/* Camada 3 — grafismo */}
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
            <Link to={HERO.primaryCta.href} className={BUTTON_PRIMARY}>
              {HERO.primaryCta.label}
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