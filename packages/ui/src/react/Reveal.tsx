import { useEffect, useState, type ReactNode } from 'react';
import { motion, useReducedMotion } from 'motion/react';

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
  // Gate animation behind mount so SSR output matches the first client render
  // (reading media queries during render causes hydration mismatches).
  // useReducedMotion tracks live OS preference changes; mounted alone gates SSR.
  const [mounted, setMounted] = useState(false);
  const prefersReducedMotion = useReducedMotion();
  useEffect(() => setMounted(true), []);

  // Element-type swap remounts children post-hydration: avoid stateful
  // children (inputs, media players) inside Reveal.
  if (!mounted || prefersReducedMotion) {
    return <div className={className}>{children}</div>;
  }
  const props = revealPropsFor(false);
  return (
    <motion.div className={className} {...props} transition={{ ...(props.transition as object), delay }}>
      {children}
    </motion.div>
  );
}
