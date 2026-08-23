import { useEffect, useState, type ReactNode } from 'react';
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
  // Gate animation behind mount so SSR output (static div) matches the first
  // client render — reading matchMedia during render would cause a hydration
  // mismatch. After mount, respect prefers-reduced-motion.
  const [canAnimate, setCanAnimate] = useState(false);
  useEffect(() => {
    if (!window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      setCanAnimate(true);
    }
  }, []);

  if (!canAnimate) {
    return <div className={className}>{children}</div>;
  }
  const props = revealPropsFor(false);
  return (
    <motion.div className={className} {...props} transition={{ ...(props.transition as object), delay }}>
      {children}
    </motion.div>
  );
}
