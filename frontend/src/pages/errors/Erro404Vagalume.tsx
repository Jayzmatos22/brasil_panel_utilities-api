/**
 * Erro404 — lockup do Brasil Panel.
 *
 * Conceito: os três dígitos são vaga-lumes. Cada um pisca em rajada curta
 * (duas piscadas rápidas, depois longo escuro), com ciclos desalinhados de
 * propósito, e derrama um halo radial que ilumina o cenário ao redor.
 *
 *   4 → verde   #10b981
 *   0 → âmbar   #f59e0b
 *   4 → azul    #3b82f6
 *
 * A palavra "Erro" NÃO é um bloco branco competindo com as três cores: ela é
 * tinta quase invisível (#31363a) em Instrument Serif, e só fica legível
 * quando um dos vaga-lumes acende — cada camada de revelação carrega a
 * temperatura da cor que a acendeu. Quem lê o erro está lendo pela luz deles.
 *
 * Sem dependências além do React. Os keyframes são injetados uma única vez.
 * A família Instrument Serif é carregada no index.html — é a única fonte
 * externa do projeto, e existe por causa deste componente. Sem ela o lockup
 * cai na Georgia e perde o contraste serifa/grotesca que o sustenta.
 *
 * O retorno é `React.JSX.Element`, e não `JSX.Element`: o React 19 deixou de
 * publicar o namespace JSX global, e a forma antiga não compila mais aqui
 * (TS2503: Cannot find namespace 'JSX').
 */

import React, { useEffect } from 'react';

export type Erro404Props = {
  /** Corpo dos dígitos em px. Escala tudo: serif, halo, glow, gaps. */
  size?: number;
  /** Palavra revelada pela luz. */
  label?: string;
  /** Intensidade do halo, 0–1. Acima de ~0.8 começa a competir com o botão âmbar. */
  glow?: number;
  /** Congela num frame aceso (export estático, screenshot, e-mail). */
  still?: boolean;
  className?: string;
  style?: React.CSSProperties;
};

type Firefly = {
  char: string;
  /** Cor do glifo e do halo. */
  color: [number, number, number];
  /** Tom que a luz dessa cor imprime na palavra. */
  litInk: string;
  /** Duração do ciclo, em segundos — valores desalinhados de propósito. */
  cycle: number;
  /** Atraso inicial, em segundos. */
  delay: number;
  /** Duração da deriva vertical (voo pairado), em segundos. */
  drift: number;
  driftDelay: number;
};

const FIREFLIES: readonly Firefly[] = [
  { char: '4', color: [16, 185, 129],  litInk: '#cfe9df', cycle: 3.1, delay: 0,    drift: 7.3, driftDelay: 0 },
  { char: '0', color: [245, 158, 11],  litInk: '#efe0c6', cycle: 4.3, delay: 0.85, drift: 9.1, driftDelay: 0.8 },
  { char: '4', color: [59, 130, 246],  litInk: '#d3ddf0', cycle: 3.7, delay: 1.9,  drift: 8.2, driftDelay: 1.6 },
];

/** Atraso da revelação sobre a piscada — a luz chega à palavra um instante depois. */
const REVEAL_LAG = 0.06;

const KEYFRAMES_ID = 'bp-erro404-keyframes';

const KEYFRAMES = `
@keyframes bpFly {
  0%{opacity:.13} 4%{opacity:.88} 8%{opacity:.26} 13%{opacity:1}
  18%{opacity:.34} 23%{opacity:.60} 29%{opacity:.15} 100%{opacity:.13}
}
@keyframes bpHaloFly {
  0%{opacity:0;transform:scale(.70)}      4%{opacity:.85;transform:scale(.97)}
  8%{opacity:.22;transform:scale(.82)}    13%{opacity:1;transform:scale(1.04)}
  18%{opacity:.30;transform:scale(.88)}   23%{opacity:.58;transform:scale(.96)}
  29%{opacity:.04;transform:scale(.78)}   100%{opacity:0;transform:scale(.70)}
}
@keyframes bpReveal {
  0%{opacity:.04} 5%{opacity:.62} 9%{opacity:.16} 14%{opacity:.86}
  19%{opacity:.24} 24%{opacity:.44} 31%{opacity:.06} 100%{opacity:.04}
}
@keyframes bpDrift { from{transform:translate3d(0,3px,0)} to{transform:translate3d(0,-5px,0)} }

@media (prefers-reduced-motion: reduce) {
  [data-bp="fly"]    { animation:none !important; opacity:.95 !important }
  [data-bp="halo"]   { animation:none !important; opacity:.55 !important; transform:scale(.95) !important }
  [data-bp="reveal"] { animation:none !important; opacity:.38 !important }
  [data-bp="drift"]  { animation:none !important; transform:none !important }
}
`;

function useKeyframes(): void {
  useEffect(() => {
    if (document.getElementById(KEYFRAMES_ID)) return;
    const el = document.createElement('style');
    el.id = KEYFRAMES_ID;
    el.textContent = KEYFRAMES;
    document.head.appendChild(el);
  }, []);
}

const rgba = (c: readonly [number, number, number], a: number): string =>
  `rgba(${c[0]},${c[1]},${c[2]},${a})`;

export default function Erro404({
  size = 96,
  label = 'Erro',
  glow = 0.65,
  still = false,
  className,
  style,
}: Erro404Props): React.JSX.Element {
  useKeyframes();

  const g = Math.max(0, Math.min(1, glow));
  const halo = size * 3.4;
  const anim = (name: string, cycle: number, delay: number): string | undefined =>
    still ? undefined : `${name} ${cycle}s ease-in-out ${delay}s infinite`;

  const revealLayer: React.CSSProperties = { position: 'absolute', left: 0, top: 0, opacity: 0.04 };

  return (
    <div
      className={className}
      role="img"
      aria-label={`${label} 404`}
      style={{
        display: 'flex',
        alignItems: 'baseline',
        gap: `${size * 0.26}px`,
        lineHeight: 1,
        ...style,
      }}
    >
      {/* palavra em tinta escura + três revelações, uma por cor de luz */}
      <span
        style={{
          position: 'relative',
          display: 'inline-block',
          fontFamily: "'Instrument Serif', Georgia, serif",
          fontWeight: 400,
          fontSize: `${size * 1.12}px`,
          letterSpacing: '-0.012em',
          color: '#31363a',
        }}
      >
        {label}
        {FIREFLIES.map((f, i) => (
          <span
            key={i}
            data-bp="reveal"
            aria-hidden="true"
            style={{
              ...revealLayer,
              color: f.litInk,
              animation: anim('bpReveal', f.cycle, f.delay + REVEAL_LAG),
              ...(still && i === 0 ? { opacity: 0.86 } : null),
            }}
          >
            {label}
          </span>
        ))}
      </span>

      {/* os vaga-lumes */}
      <span
        style={{
          display: 'flex',
          gap: `${size * 0.04}px`,
          fontFamily: "'IBM Plex Sans', Helvetica, sans-serif",
          fontWeight: 600,
          fontSize: `${size}px`,
          letterSpacing: '-0.022em',
        }}
      >
        {FIREFLIES.map((f, i) => (
          <span
            key={i}
            data-bp="drift"
            style={{
              display: 'inline-block',
              animation: still ? undefined : `bpDrift ${f.drift}s ease-in-out ${f.driftDelay}s infinite alternate`,
            }}
          >
            <span style={{ position: 'relative', display: 'inline-flex', justifyContent: 'center', isolation: 'isolate' }}>
              {/* halo — a luz que o vaga-lume joga no cenário */}
              <span
                data-bp="halo"
                aria-hidden="true"
                style={{
                  position: 'absolute',
                  left: '50%',
                  top: '46%',
                  width: `${halo}px`,
                  height: `${halo}px`,
                  marginLeft: `${-halo / 2}px`,
                  marginTop: `${-halo / 2}px`,
                  borderRadius: '50%',
                  background: `radial-gradient(closest-side, ${rgba(f.color, 0.33 * g)} 0%, ${rgba(f.color, 0.12 * g)} 34%, transparent 72%)`,
                  filter: `blur(${size * 0.16}px)`,
                  pointerEvents: 'none',
                  zIndex: -1,
                  opacity: still ? 0.55 : 0,
                  animation: anim('bpHaloFly', f.cycle, f.delay),
                }}
              />
              <span
                data-bp="fly"
                style={{
                  color: `rgb(${f.color[0]},${f.color[1]},${f.color[2]})`,
                  textShadow: `0 0 ${size * 0.3}px ${rgba(f.color, 0.6 * g)}, 0 0 ${size * 0.9}px ${rgba(f.color, 0.3 * g)}`,
                  opacity: still ? 0.95 : 0.13,
                  animation: anim('bpFly', f.cycle, f.delay),
                }}
              >
                {f.char}
              </span>
            </span>
          </span>
        ))}
      </span>
    </div>
  );
}
