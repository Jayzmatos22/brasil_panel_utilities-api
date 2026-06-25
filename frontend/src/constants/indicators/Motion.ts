/**
 * motion.ts — variantes de animação compartilhadas entre páginas.
 *
 * Centralizar aqui (em vez de duplicar em cada página) garante que o ritmo
 * visual de entrada (stagger + fade-up) seja consistente em toda a app.
 */
import type { Variants } from 'motion/react';

/** Orquestra o stagger dos filhos — quanto maior staggerChildren, mais lento. */
export const containerVariants: Variants = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: { staggerChildren: 0.15 },
  },
};

/** Cada item sobe 30px com fade — curva de ease-out suave. */
export const itemVariants: Variants = {
  hidden: { opacity: 0, y: 30 },
  show: {
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.6,
      // Curva personalizada para entrada "suave mas decidida".
      ease: [0.25, 0.46, 0.45, 0.94],
    },
  },
};
