// Fontes em esteira + nota de licença.
//
// A nota fecha a seção porque é ressalva, não introdução: quem chega aqui
// primeiro quer ver de onde vem o dado; a condição de uso vem depois.
import type { CSSProperties } from 'react';
import { useReducedMotion } from 'motion/react';
import { Reveal } from '../components/Reveal';
import { Section } from '../components/Section';
import { SectionHeading } from '../components/SectionHeading';
import { SourceCard } from '../components/SourceCard';
import { SOURCES, SOURCES_INTRO, SOURCES_NOTE } from '../data/content';

const HEADING_ID = 'fontes-title';

/** Largura fixa do card na esteira: o trilho precisa de medida estável. */
const CARD = 'w-[19rem] shrink-0';

/** Alvo de largura do cartão na grade estática (movimento reduzido). */
const GRID_STYLE = { '--card-min': '17rem' } as CSSProperties;

/** Uma passada pela lista. A esteira renderiza duas; a grade, uma. */
function listaDeCards(sufixo: string) {
  return SOURCES.map((source) => (
    <div key={`${source.id}${sufixo}`} className={CARD}>
      <SourceCard
        acronym={source.acronym}
        name={source.name}
        provides={source.provides}
        description={source.description}
        href={source.href}
        color={source.color}
      />
    </div>
  ));
}

export function Sources() {
  // A esteira em si é CSS puro. O hook serve para decidir ENTRE dois layouts,
  // e essa decisão precisa acontecer no React porque muda o que vai para o
  // DOM: com movimento reduzido não faz sentido duplicar doze cards que
  // ninguém verá passar.
  const prefersReduced = useReducedMotion();

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

      {prefersReduced ? (
        // Grade estática: mesma informação, nada se movendo.
        <ul className="mt-14 grid-auto-cards list-none gap-4" style={GRID_STYLE}>
          {SOURCES.map((source) => (
            <li key={source.id}>
              <SourceCard
                acronym={source.acronym}
                name={source.name}
                provides={source.provides}
                description={source.description}
                href={source.href}
                color={source.color}
              />
            </li>
          ))}
        </ul>
      ) : (
        // overflow-hidden, e não auto: o movimento é do trilho, e uma barra de
        // rolagem competindo com a animação daria dois controles para a mesma
        // coisa. O foco por teclado ainda rola o container sozinho, e o
        // focus-within do App.css pausa a esteira enquanto isso acontece.
        <div className="esteira relative mt-14 overflow-hidden">
          <div className="esteira-trilho flex w-max gap-4">
            {listaDeCards('')}

            {/* Segunda cópia: é ela que faz o laço fechar em -50% sem salto.
                aria-hidden porque é a MESMA lista — sem isso o leitor de tela
                anunciaria as doze fontes duas vezes. */}
            <div aria-hidden="true" className="flex gap-4">
              {listaDeCards('-eco')}
            </div>
          </div>
        </div>
      )}

      <Reveal>
        <p className="mt-10 max-w-3xl border-l-2 border-white/10 pl-5 text-micro leading-relaxed text-fg-muted">
          {SOURCES_NOTE}
        </p>
      </Reveal>
    </Section>
  );
}
