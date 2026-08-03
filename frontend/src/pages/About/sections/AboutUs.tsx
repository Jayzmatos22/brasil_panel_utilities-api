// Quem somos — dois parágrafos e um destaque lateral.
//
// No mobile o destaque vem DEPOIS do texto (ordem do DOM = ordem de leitura);
// no desktop ele ocupa a coluna da direita e gruda com sticky enquanto os
// parágrafos rolam. Nada de `order-*`: a ordem visual e a ordem de leitura
// coincidem nos dois casos.
import { Reveal } from '../components/Reveal';
import { Section } from '../components/Section';
import { SectionHeading } from '../components/SectionHeading';
import { SURFACE } from '../components/styles';
import { ABOUT_US } from '../data/content';

// TODO(imagem): apoio visual da seção "Quem somos" — mesa de trabalho com o
// painel na tela, ou detalhe gráfico de série histórica. Proporção 4:3,
// ~1600×1200. Substituir o placeholder 1×1 por este arquivo.
import aboutUsImage from '../../../assets/about/about-us.webp';

const HEADING_ID = 'quem-somos-title';

export function AboutUs() {
  return (
    <Section id="quem-somos" labelledBy={HEADING_ID}>
      <Reveal>
        <SectionHeading
          id={HEADING_ID}
          eyebrow={ABOUT_US.eyebrow}
          title={ABOUT_US.title}
        />
      </Reveal>

      <div className="mt-14 grid gap-12 lg:grid-cols-12 lg:gap-16">
        <Reveal className="lg:col-span-7">
          <div className="space-y-6">
            {ABOUT_US.paragraphs.map((paragraph) => (
              <p
                key={paragraph.slice(0, 40)}
                className="text-base leading-relaxed text-fg-muted"
              >
                {paragraph}
              </p>
            ))}
          </div>
        </Reveal>

        <Reveal className="lg:col-span-5" delayMs={120}>
          <div className="lg:sticky lg:top-16">
            <figure className={`${SURFACE} overflow-hidden`}>
              <img
                src={aboutUsImage}
                alt={ABOUT_US.imageAlt}
                loading="lazy"
                decoding="async"
                className="aspect-[4/3] w-full object-cover opacity-80"
              />

              <figcaption className="border-t border-white/5 p-card">
                <blockquote className="text-lg font-medium leading-snug tracking-tight text-fg">
                  {ABOUT_US.aside.quote}
                </blockquote>

                <p className="mt-4 text-micro uppercase tracking-[0.18em] text-accent">
                  {ABOUT_US.aside.author}
                </p>
                <p className="mt-1 text-micro text-fg-muted">
                  {ABOUT_US.aside.role}
                </p>
              </figcaption>
            </figure>
          </div>
        </Reveal>
      </div>
    </Section>
  );
}