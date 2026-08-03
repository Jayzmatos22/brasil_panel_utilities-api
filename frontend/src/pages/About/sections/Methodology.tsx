// Metodologia — coleta → tratamento → publicação.
//
// <ol> porque a ordem é o conteúdo: trocar dois passos de lugar muda o
// significado. O número visível é decorativo (aria-hidden) — a semântica de
// ordem já vem da própria lista, e deixá-lo legível faria o leitor de tela
// anunciar "1" duas vezes.
import { Reveal } from '../components/Reveal';
import { Section } from '../components/Section';
import { SectionHeading } from '../components/SectionHeading';
import { METHODOLOGY_INTRO, METHODOLOGY_STEPS } from '../data/content';

const HEADING_ID = 'metodologia-title';
const STAGGER_MS = 100;

export function Methodology() {
  return (
    <Section id="metodologia" labelledBy={HEADING_ID}>
      <Reveal>
        <SectionHeading
          id={HEADING_ID}
          eyebrow={METHODOLOGY_INTRO.eyebrow}
          title={METHODOLOGY_INTRO.title}
          description={METHODOLOGY_INTRO.description}
        />
      </Reveal>

      <ol className="mt-16 list-none">
        {METHODOLOGY_STEPS.map((step, index) => {
          const Icon = step.icon;
          const number = String(index + 1).padStart(2, '0');

          return (
            <li key={step.id}>
              <Reveal delayMs={index * STAGGER_MS}>
                <div className="grid gap-6 border-t border-white/5 py-10 md:grid-cols-12 md:gap-10">
                  {/* Coluna 1 — número + ícone */}
                  <div className="flex items-center gap-4 md:col-span-3">
                    <span
                      aria-hidden="true"
                      className="text-4xl font-semibold tabular-nums tracking-tight text-white/10"
                    >
                      {number}
                    </span>

                    <Icon
                      aria-hidden="true"
                      strokeWidth={1.5}
                      className="h-5 w-5 text-accent"
                    />
                  </div>

                  {/* Coluna 2 — título + descrição */}
                  <div className="md:col-span-9">
                    <h3 className="text-xl font-semibold tracking-tight text-fg">
                      {step.title}
                    </h3>

                    <p className="mt-3 max-w-2xl text-sm leading-relaxed text-fg-muted">
                      {step.description}
                    </p>
                  </div>
                </div>
              </Reveal>
            </li>
          );
        })}
      </ol>
    </Section>
  );
}