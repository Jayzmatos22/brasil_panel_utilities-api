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
import { isAuthenticated } from '../../../lib/auth/jwt';
import { DASHBOARD_CTA, HERO, SITE_NAME } from '../data/content';

// Imagens da landing — mesmo padrão Vite já usado em BancosPage, IbgePage e
// Helpers.ts: o glob eager resolve as URLs em tempo de build. Trocar a arte é
// soltar um arquivo em assets/app/ com o prefixo esperado; nenhum import muda.
//
// Diferente do import estático anterior, o glob NÃO garante resultado: se o
// arquivo sumir, o find devolve undefined em vez de quebrar o build. Por isso
// a <img> é renderizada condicionalmente — sem arte o hero perde a textura,
// mas não exibe ícone de imagem quebrada.
const ABOUT_IMAGES = import.meta.glob(
  '../../../assets/app/sobre*.{jpeg,jpg,png,webp,avif}',
  { eager: true, import: 'default' },
) as Record<string, string>;

/** Resolve pelo prefixo do arquivo: 'sobre01' → sobre01-panel-img.jpg. */
const findAboutImage = (prefix: string): string | undefined =>
  Object.entries(ABOUT_IMAGES).find(([path]) =>
    (path.toLowerCase().split('/').pop() ?? '').startsWith(prefix.toLowerCase()),
  )?.[1];

const heroBg = findAboutImage('sobre01');

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
      {/* Camada 1 — imagem. `object-top` porque a arte é retrato (2:3) num
          hero panorâmico: ancorar no topo mantém a bandeira em quadro em vez
          de cortar no mastro. */}
      {heroBg !== undefined && (
        <img
          src={heroBg}
          alt={HERO.backgroundAlt}
          // Sem loading="lazy": está acima da dobra e é o LCP.
          fetchPriority="high"
          className="absolute inset-0 -z-20 h-full w-full object-cover object-top opacity-60"
        />
      )}

      {/* Camada 2 — véu em dois eixos, e não um só.
          O texto ocupa a metade esquerda; a bandeira, o centro-direita. Um véu
          uniforme forte o bastante para o texto apagaria a foto inteira (era o
          caso antes: com from-ink/80 via-ink/90 a imagem sumia). O gradiente
          horizontal concentra o escurecimento onde há texto e libera a direita
          para a arte aparecer; o vertical apenas costura o hero com o fundo da
          próxima seção. */}
      <div
        aria-hidden="true"
        className="absolute inset-0 -z-10 bg-gradient-to-r from-ink via-ink/85 to-ink/30"
      />
      <div
        aria-hidden="true"
        className="absolute inset-0 -z-10 bg-gradient-to-b from-ink/50 via-transparent to-ink"
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