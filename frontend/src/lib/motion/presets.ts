import type { Variants } from 'motion/react';

// Entrada em cascata: o container "atrasa" cada filho em 0.08s.
// lib/motion/presets.ts

export const container: Variants = {
  hidden: { opacity: 0, y: 20 },
  show: {
    opacity: 1,
    y: 0,
    transition: {
      staggerChildren: 0.1,
      duration: 0.4
    }
  },
  exit: {
    opacity: 0,
    y: -20,
    transition: {
      duration: 0.5,
      ease: "easeInOut"
    }
  }
};

// ... suas outras variantes (item, etc) ...

export const item: Variants = {
  hidden: { opacity: 0, y: 16 },
  show: { opacity: 1, y: 0, transition: { duration: 0.35, ease: 'easeOut' } },
};