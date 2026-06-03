import type { Variants } from 'motion/react';

// Entrada em cascata: o container "atrasa" cada filho em 0.08s.
export const container: Variants = {
  hidden: {},
  show: { transition: { staggerChildren: 0.08 } },
};

export const item: Variants = {
  hidden: { opacity: 0, y: 16 },
  show: { opacity: 1, y: 0, transition: { duration: 0.35, ease: 'easeOut' } },
};