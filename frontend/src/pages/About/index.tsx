// Página institucional (/sobre).
//
// Arquivo fino de composição: a ordem das seções é a única decisão tomada
// aqui. Todo layout mora nas seções; todo texto, em data/content.ts.
//
// Roda fora do DashboardLayout de propósito — é a única tela pública com a
// identidade institucional (quase-preto + um accent), sem sidebar e sem a
// paleta tricolor do painel.
import { useEffect } from 'react';
import { TopBar } from './components/TopBar';
import { FOCUS_RING } from './components/styles';
import { AboutUs } from './sections/AboutUs';
import { Disclaimer } from './sections/Disclaimer';
import { FinalCTA } from './sections/FinalCTA';
import { Hero } from './sections/Hero';
import { Methodology } from './sections/Methodology';
import { Metrics } from './sections/Metrics';
import { Objectives } from './sections/Objectives';
import { Sources } from './sections/Sources';
import { PAGE_TITLE } from './data/content';

export default function AboutPage() {
  // O app é SPA sem framework de meta tags; o título é ajustado na montagem
  // e restaurado na saída para não vazar para a próxima rota.
  useEffect(() => {
    const previousTitle = document.title;
    document.title = PAGE_TITLE;
    return () => {
      document.title = previousTitle;
    };
  }, []);

  return (
    <div className="min-h-screen bg-ink text-fg antialiased">
      {/* Pular navegação: primeiro alvo de Tab, visível só quando focado. */}
      <a
        href="#conteudo"
        className={`${FOCUS_RING} sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-4 focus:z-[60] focus:rounded-control focus:bg-accent focus:px-4 focus:py-2 focus:text-sm focus:font-semibold focus:text-ink`}
      >
        Pular para o conteúdo
      </a>

      <TopBar />

      <main id="conteudo">
        <Hero />
        <Metrics />
        <AboutUs />
        <Objectives />
        <Methodology />
        <Sources />
        <Disclaimer />
        <FinalCTA />
      </main>
    </div>
  );
}