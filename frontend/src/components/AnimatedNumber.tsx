import { useEffect } from 'react';
import { motion, useSpring, useTransform } from 'motion/react';

interface AnimatedNumberProps {
  value: number;
  format: (v: number) => string;
  className?: string;
}

// Número que "conta" suavemente do valor anterior até o novo (spring do motion).
export function AnimatedNumber({ value, format, className }: AnimatedNumberProps) {
  const spring = useSpring(value, { stiffness: 90, damping: 18 });
  const text = useTransform(spring, (v) => format(v));
  useEffect(() => { spring.set(value); }, [value, spring]);
  return <motion.span className={className}>{text}</motion.span>;
}