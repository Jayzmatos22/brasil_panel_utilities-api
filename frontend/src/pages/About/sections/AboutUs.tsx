// Quem somos — dois parágrafos e um destaque lateral.
//
// No mobile o destaque vem DEPOIS do texto (ordem do DOM = ordem de leitura);
// no desktop ele ocupa a coluna da direita e gruda com sticky enquanto os
// parágrafos rolam. Nada de `order-*`: a ordem visual e a ordem de leitura
// coincidem nos dois casos.
import { useRef } from 'react';
import { motion, useReducedMotion, useScroll, useTransform } from 'motion/react';
import { Reveal } from '../components/Reveal';
import { Section } from '../components/Section';
import { SectionHeading } from '../components/SectionHeading';
import { SURFACE } from '../components/styles';
import { ABOUT_US } from '../data/content';
import { findAboutImage } from '../data/images';

const aboutUsImage = findAboutImage('sobre01');

/**
 * Deslocamento do parallax, em % da altura da própria imagem.
 *
 * Anda de par com o sobredimensionamento no JSX: a imagem é 20% mais alta que
 * o quadro e sobra 10% para cada lado, então qualquer valor abaixo de 10%
 * mantém o quadro sempre preenchido. 6% deixa folga.
 */
const PARALLAX = 6;

const HEADING_ID = 'quem-somos-title';

export function AboutUs() {
  const quadroRef = useRef<HTMLDivElement>(null);

  // offset 'start end' → 'end start': o progresso vai de 0 a 1 durante toda a
  // travessia do quadro pelo viewport, e não só enquanto ele está centrado.
  const { scrollYProgress } = useScroll({
    target: quadroRef,
    offset: ['start end', 'end start'],
  });

  // useTransform mapeia scroll para posição — não é uma animação, então o
  // MotionConfig reducedMotion="user" da raiz NÃO o desliga sozinho. O gate
  // precisa ser explícito, senão quem pede menos movimento continua vendo a
  // imagem deslizar.
  const prefersReduced = useReducedMotion();
  const y = useTransform(
    scrollYProgress,
    [0, 1],
    prefersReduced ? ['0%', '0%'] : [`-${PARALLAX}%`, `${PARALLAX}%`],
  );

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
              {/* Retrato (3:4), e não 4:3: a bandeira é uma foto vertical
                  (1200×1800). Num quadro paisagem o object-cover descartaria
                  o mastro e boa parte do céu, que é o que dá o enquadramento.

                  A imagem é 20% mais alta que o quadro e recuada 10% para
                  cada lado — é essa sobra que o parallax consome sem nunca
                  revelar borda vazia. */}
              {aboutUsImage !== undefined && (
                <div
                  ref={quadroRef}
                  className="relative aspect-[3/4] w-full overflow-hidden"
                >
                  <motion.img
                    style={{ y }}
                    src={aboutUsImage}
                    alt={ABOUT_US.imageAlt}
                    loading="lazy"
                    decoding="async"
                    className="absolute -inset-y-[10%] h-[120%] w-full object-cover opacity-80"
                  />
                </div>
              )}

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