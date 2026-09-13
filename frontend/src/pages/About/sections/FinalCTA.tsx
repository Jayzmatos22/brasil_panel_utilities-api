// Fechamento: chamada final + navegação enxuta.
//
// A navegação vive dentro de um <nav aria-label> próprio para não se
// confundir com a navegação principal do app quando alguém lista as regiões
// da página. Os destinos do dashboard são protegidos por PrivateRoute — quem
// não estiver autenticado cai no login, que é o comportamento desejado.
import { Link } from 'react-router-dom';
import { Reveal } from '../components/Reveal';
import { Section } from '../components/Section';
import { BUTTON_GHOST, BUTTON_PRIMARY, FOCUS_RING } from '../components/styles';
import { isAuthenticated } from '../../../lib/auth/jwt';
import { CONTACT, DASHBOARD_CTA, FINAL_CTA, SITE_NAME } from '../data/content';

const HEADING_ID = 'final-title';

const NAV_LINK = `${FOCUS_RING} rounded-control text-sm text-fg-muted transition-colors duration-200 hover:text-accent`;

// Mesma família visual do NAV_LINK, com espaço para o ícone. `group` existe
// para o ícone acompanhar a cor no hover do link inteiro, e não só quando o
// ponteiro cai exatamente sobre ele.
const CONTACT_LINK = `${FOCUS_RING} group flex items-center gap-2.5 rounded-control text-sm text-fg-muted transition-colors duration-200 hover:text-accent`;

export function FinalCTA() {
  const LegalIcon = FINAL_CTA.legalIcon;

  // Mesma razão do Hero: quem já tem sessão não deve ver "Criar conta" nem
  // "Já tenho conta". Para essa pessoa sobra um único botão, o do painel.
  const isLoggedIn = isAuthenticated();
  const primaryCta = isLoggedIn ? DASHBOARD_CTA : FINAL_CTA.primaryCta;

  const navLinks = FINAL_CTA.navLinks.filter(
    (link) => link.visibility === undefined || link.visibility === (isLoggedIn ? 'auth' : 'guest'),
  );

  return (
    <Section id="comecar" labelledBy={HEADING_ID}>
      <div className="grid gap-14 lg:grid-cols-12 lg:gap-16">
        <Reveal className="lg:col-span-7">
          <h2
            id={HEADING_ID}
            className="text-3xl font-semibold tracking-tight text-fg md:text-4xl"
          >
            {FINAL_CTA.title}
          </h2>

          <p className="mt-5 max-w-xl text-base leading-relaxed text-fg-muted">
            {FINAL_CTA.description}
          </p>

          <div className="mt-9 flex flex-col gap-3 sm:flex-row sm:items-center">
            <Link to={primaryCta.href} className={BUTTON_PRIMARY}>
              {primaryCta.label}
            </Link>

            {!isLoggedIn && (
              <Link to={FINAL_CTA.secondaryCta.href} className={BUTTON_GHOST}>
                {FINAL_CTA.secondaryCta.label}
              </Link>
            )}
          </div>
        </Reveal>

        <Reveal className="lg:col-span-5" delayMs={120}>
          <nav aria-label={FINAL_CTA.navTitle}>
            <h3 className="text-eyebrow font-medium uppercase tracking-[0.18em] text-fg-muted">
              {FINAL_CTA.navTitle}
            </h3>

            <ul className="mt-6 grid list-none grid-cols-2 gap-x-6 gap-y-4">
              {navLinks.map((link) => (
                <li key={link.href}>
                  {/* Âncora interna não troca de rota: <a> puro. Usar <Link>
                      faria o router tratar "#fontes" como caminho. */}
                  {link.href.startsWith('#') ? (
                    <a href={link.href} className={NAV_LINK}>
                      {link.label}
                    </a>
                  ) : (
                    <Link to={link.href} className={NAV_LINK}>
                      {link.label}
                    </Link>
                  )}
                </li>
              ))}
            </ul>
          </nav>

          <div className="mt-10">
            <h3 className="text-eyebrow font-medium uppercase tracking-[0.18em] text-fg-muted">
              {CONTACT.title}
            </h3>

            <p className="mt-4 text-sm leading-relaxed text-fg-muted">
              {CONTACT.description}
            </p>

            <ul className="mt-5 grid list-none gap-3">
              {CONTACT.links.map((link) => {
                const Icon = link.icon;
                // mailto: abre o cliente de e-mail na própria aba, como se
                // espera; os dois links externos vão para nova aba, para não
                // tirar o visitante da página no meio da leitura.
                const externo = !link.href.startsWith('mailto:');

                return (
                  <li key={link.href}>
                    <a
                      href={link.href}
                      className={CONTACT_LINK}
                      {...(externo
                        ? { target: '_blank', rel: 'noopener noreferrer' }
                        : {})}
                    >
                      <Icon
                        aria-hidden="true"
                        strokeWidth={1.5}
                        className="h-4 w-4 shrink-0 text-fg-muted transition-colors duration-200 group-hover:text-accent"
                      />
                      {link.label}
                    </a>
                  </li>
                );
              })}
            </ul>
          </div>
        </Reveal>
      </div>

      <Reveal>
        <div className="mt-20 flex flex-col gap-4 border-t border-white/5 pt-8 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-micro uppercase tracking-[0.18em] text-fg">
            {SITE_NAME}
          </p>

          <p className="flex items-center gap-2 text-micro text-fg-muted">
            <LegalIcon
              aria-hidden="true"
              strokeWidth={1.5}
              className="h-3.5 w-3.5"
            />
            {FINAL_CTA.legal}
          </p>
        </div>
      </Reveal>
    </Section>
  );
}