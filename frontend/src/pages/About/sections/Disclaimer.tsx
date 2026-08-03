// Aviso legal. Discreto de propósito: sem accent, sem card elevado, sem
// ícone de alerta. É ressalva obrigatória, não chamada de atenção — tratá-la
// como banner de erro daria a ela um peso visual que ela não tem na página.
//
// Ainda assim é uma <section> nomeada: precisa ser encontrável por quem
// navega por regiões, e não pode virar rodapé perdido.
import { Reveal } from '../components/Reveal';
import { Section } from '../components/Section';
import { DISCLAIMER } from '../data/content';

const HEADING_ID = 'aviso-title';

export function Disclaimer() {
  return (
    <Section id="aviso" labelledBy={HEADING_ID}>
      <Reveal>
        <div className="max-w-3xl">
          <h2
            id={HEADING_ID}
            className="text-micro font-medium uppercase tracking-[0.18em] text-fg-muted"
          >
            {DISCLAIMER.title}
          </h2>

          <p className="mt-5 text-sm leading-relaxed text-fg-muted">
            {DISCLAIMER.body}
          </p>
        </div>
      </Reveal>
    </Section>
  );
}