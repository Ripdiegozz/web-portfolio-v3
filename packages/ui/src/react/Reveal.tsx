import type { ReactNode } from 'react';
import { motion } from 'motion/react';

export interface RevealProps {
  children: ReactNode;
  delay?: number;
  className?: string;
}

/**
 * Pure decision extracted so reduced-motion behavior stays unit-testable.
 * When motion is allowed we animate; otherwise render children statically.
 */
export function revealPropsFor(reducedMotion: boolean) {
  if (reducedMotion) {
    return {};
  }
  return {
    initial: { opacity: 0, y: 16 },
    whileInView: { opacity: 1, y: 0 },
    viewport: { once: true, margin: '-80px' },
    transition: { duration: 0.5, ease: 'easeOut' as const },
  };
}

export function Reveal({ children, delay = 0, className }: RevealProps) {
  const reduced = typeof window !== 'undefined'
    ? window.matchMedia('(prefers-reduced-motion: reduce)').matches
    : true;
  const props = revealPropsFor(reduced);
  if (!('initial' in props)) {
    return <div className={className}>{children}</div>;
  }
  return (
    <motion.div className={className} {...props} transition={{ ...(props.transition as object), delay }}>
      {children}
    </motion.div>
  );
}
