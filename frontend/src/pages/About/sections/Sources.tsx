// Fontes oficiais + nota de licença.
//
// A nota fecha a seção porque é ressalva, não introdução: quem chega aqui
// primeiro quer ver de onde vem o dado; a condição de uso vem depois.
import type { CSSProperties } from 'react';
import { Reveal } from '../components/Reveal';
import { Section } from '../components/Section';
import { SectionHeading } from '../components/SectionHeading';
import { SourceCard } from '../components/SourceCard';
import { SOURCES, SOURCES_INTRO, SOURCES_NOTE } from '../data/content';

const HEADING_ID = 'fontes-title';
const STAGGER_MS = 60;

/** Alvo de largura do cartão lido pela utility `grid-auto-cards`. */
const GRID_STYLE = { '--card-min': '15rem' } as CSSProperties;

export function Sources() {
  return (
    <Section id="fontes" labelledBy={HEADING_ID}>
      <Reveal>
        <SectionHeading
          id={HEADING_ID}
          eyebrow={SOURCES_INTRO.eyebrow}
          title={SOURCES_INTRO.title}
          description={SOURCES_INTRO.description}
        />
      </Reveal>

      <ul className="mt-14 grid-auto-cards list-none gap-4" style={GRID_STYLE}>
        {SOURCES.map((source, index) => (
          <li key={source.id}>
            <Reveal delayMs={index * STAGGER_MS} className="h-full">
              <SourceCard
                acronym={source.acronym}
                name={source.name}
                description={source.description}
                href={source.href}
              />
            </Reveal>
          </li>
        ))}
      </ul>

      <Reveal>
        <p className="mt-10 max-w-3xl border-l-2 border-white/10 pl-5 text-micro leading-relaxed text-fg-muted">
          {SOURCES_NOTE}
        </p>
      </Reveal>
    </Section>
  );
}