// Objetivos — três cards de borda fina.
//
// <ul>/<li> em vez de <div>: são três itens equivalentes de uma lista, e o
// leitor de tela anuncia "lista de 3 itens" antes de ler o primeiro.
import type { CSSProperties } from 'react';
import { FeatureCard } from '../components/FeatureCard';
import { Reveal } from '../components/Reveal';
import { Section } from '../components/Section';
import { SectionHeading } from '../components/SectionHeading';
import { OBJECTIVES, OBJECTIVES_INTRO } from '../data/content';

const HEADING_ID = 'objetivos-title';
const STAGGER_MS = 80;

/** Alvo de largura do cartão lido pela utility `grid-auto-cards`. */
const GRID_STYLE = { '--card-min': '17rem' } as CSSProperties;

export function Objectives() {
  return (
    <Section id="objetivos" labelledBy={HEADING_ID}>
      <Reveal>
        <SectionHeading
          id={HEADING_ID}
          eyebrow={OBJECTIVES_INTRO.eyebrow}
          title={OBJECTIVES_INTRO.title}
          description={OBJECTIVES_INTRO.description}
        />
      </Reveal>

      <ul className="mt-14 grid-auto-cards list-none gap-4" style={GRID_STYLE}>
        {OBJECTIVES.map((objective, index) => (
          <li key={objective.id}>
            <Reveal delayMs={index * STAGGER_MS} className="h-full">
              <FeatureCard
                icon={objective.icon}
                title={objective.title}
                description={objective.description}
              />
            </Reveal>
          </li>
        ))}
      </ul>
    </Section>
  );
}