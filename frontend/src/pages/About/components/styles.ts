// Constantes de classe compartilhadas entre os primitivos da landing.
//
// Existem para que a repetição fique em UM lugar sem recorrer a @apply: o
// projeto usa Tailwind v4 sem camada de componentes CSS, e espalhar @apply
// pelo index.css criaria uma segunda fonte de verdade de estilo, longe do
// componente que a usa.

/** Container das seções. max-w-6xl = 72rem. */
export const CONTAINER = 'mx-auto w-full max-w-6xl px-5 sm:px-8';

/** Superfície elevada padrão: borda fininha, sem sombra pesada. */
export const SURFACE = 'rounded-panel border border-white/5 bg-elevated';

/**
 * Anel de foco único da página. Fica visível em qualquer superfície porque o
 * offset usa o fundo da página, não o do elemento.
 */
export const FOCUS_RING =
  'outline-none focus-visible:ring-2 focus-visible:ring-accent/70 focus-visible:ring-offset-2 focus-visible:ring-offset-ink';

/** Rótulo miúdo em caixa alta que abre cada seção. */
export const EYEBROW =
  'text-eyebrow font-medium uppercase tracking-[0.18em] text-accent';

/** Botão primário — o único preenchido com o accent na página inteira. */
export const BUTTON_PRIMARY = [
  'inline-flex items-center justify-center gap-2 rounded-control',
  'bg-accent px-6 py-3 text-sm font-semibold text-ink',
  'transition-colors duration-200 hover:bg-accent/85',
  'coarse:min-h-11',
  FOCUS_RING,
].join(' ');

/** Botão fantasma — mesma massa do primário, só contorno. */
export const BUTTON_GHOST = [
  'inline-flex items-center justify-center gap-2 rounded-control',
  'border border-white/10 px-6 py-3 text-sm font-semibold text-fg',
  'transition-colors duration-200 hover:border-white/25 hover:bg-white/5',
  'coarse:min-h-11',
  FOCUS_RING,
].join(' ');