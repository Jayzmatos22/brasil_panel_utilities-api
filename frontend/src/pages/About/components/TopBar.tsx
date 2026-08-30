// Barra superior da landing.
//
// Não reaproveita o HeaderApp: aquele é slate-900 e pertence ao onboarding.
// Esta segue a identidade institucional da página (quase-preto, um accent).
//
// O conjunto de ações muda conforme a sessão. Em /sobre um usuário logado
// veria "Entrar / Criar conta", o que é absurdo — para ele o atalho útil é
// voltar ao painel.
import { Link } from 'react-router-dom';
import { isAuthenticated } from '../../../lib/auth/jwt';
import { BrandLogo } from '../../../components/brand/BrandLogo';
import { CONTAINER, FOCUS_RING } from './styles';
import { TOP_BAR } from '../data/content';

const GHOST_LINK = `${FOCUS_RING} inline-flex items-center rounded-control px-3 py-2 text-sm font-medium text-fg-muted transition-colors duration-200 hover:text-fg coarse:min-h-11`;

const SOLID_LINK = `${FOCUS_RING} inline-flex items-center rounded-control bg-accent px-4 py-2 text-sm font-semibold text-ink transition-colors duration-200 hover:bg-accent/85 coarse:min-h-11`;

export function TopBar() {
  const isLoggedIn = isAuthenticated();

  return (
    <header className="sticky top-0 z-50 border-b border-white/5 bg-ink/80 max-lg:bg-ink backdrop-blur-md">
      <div
        className={`${CONTAINER} flex h-16 items-center justify-between gap-4`}
      >
        <Link
          to={TOP_BAR.homeHref}
          className={`${FOCUS_RING} rounded-control`}
          aria-label={TOP_BAR.homeLabel}
        >
          <BrandLogo variant="sidebar" className="h-7 w-auto" />
        </Link>

        <nav
          aria-label={TOP_BAR.navLabel}
          className="flex items-center gap-1 sm:gap-2"
        >
          {isLoggedIn ? (
            <Link to={TOP_BAR.dashboardCta.href} className={SOLID_LINK}>
              {TOP_BAR.dashboardCta.label}
            </Link>
          ) : (
            <>
              <Link to={TOP_BAR.loginCta.href} className={GHOST_LINK}>
                {TOP_BAR.loginCta.label}
              </Link>

              <Link to={TOP_BAR.registerCta.href} className={SOLID_LINK}>
                {TOP_BAR.registerCta.label}
              </Link>
            </>
          )}
        </nav>
      </div>
    </header>
  );
}