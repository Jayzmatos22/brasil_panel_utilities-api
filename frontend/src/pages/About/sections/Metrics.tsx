// Faixa de números-chave.
//
// Usa a utility `grid-auto-cards` do index.css em vez da cadeia
// grid-cols-1 sm:grid-cols-2 lg:grid-cols-4: o grid se resolve pelo espaço
// disponível e não transborda em 320px.
import type { CSSProperties } from 'react';
import { MetricItem } from '../components/MetricItem';
import { Reveal } from '../components/Reveal';
import { Section } from '../components/Section';
import { SectionHeading } from '../components/SectionHeading';
import { METRICS, METRICS_INTRO } from '../data/content';

const HEADING_ID = 'metricas-title';

/** Cascata curta: 80ms por item dá sequência sem parecer lento. */
const STAGGER_MS = 80;

/** Alvo de largura do cartão lido pela utility `grid-auto-cards`. */
const GRID_STYLE = { '--card-min': '13rem' } as CSSProperties;

export function Metrics() {
  return (
    <Section id="metricas" labelledBy={HEADING_ID} hasDivider={false}>
      <Reveal>
        <SectionHeading
          id={HEADING_ID}
          eyebrow={METRICS_INTRO.eyebrow}
          title={METRICS_INTRO.title}
          description={METRICS_INTRO.description}
        />
      </Reveal>

      <div className="mt-16 grid-auto-cards gap-x-8 gap-y-12" style={GRID_STYLE}>
        {METRICS.map((metric, index) => (
          <Reveal key={metric.id} delayMs={index * STAGGER_MS}>
            <MetricItem
              value={metric.value}
              label={metric.label}
              description={metric.description}
            />
          </Reveal>
        ))}
      </div>
    </Section>
  );
}