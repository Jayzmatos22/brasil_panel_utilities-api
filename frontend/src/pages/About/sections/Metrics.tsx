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
    <Section
      id="metricas"
      labelledBy={HEADING_ID}
      hasDivider={false}
      className="relative isolate"
    >
      {/* Continuação da base amarela do hero. A cor entra nesta seção no mesmo
          valor em que sai da anterior, então a transição atravessa o limite
          entre as duas em vez de o amarelo encontrar o preto de uma vez.

          `isolate` na seção prende o -z-10 aqui dentro: sem o contexto de
          empilhamento próprio, a camada afundaria atrás do fundo da página e
          sumiria. O gradiente em si mora em App.css (.hero-edge-carry), ao
          lado do par dele — os dois valores precisam ser lidos juntos. */}
      <div
        aria-hidden="true"
        className="hero-edge-carry pointer-events-none absolute inset-x-0 top-0 -z-10 h-48"
      />
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
              suffix={metric.suffix}
              label={metric.label}
              description={metric.description}
            />
          </Reveal>
        ))}
      </div>
    </Section>
  );
}