import { AmbientBackground } from '@portfolio/ui';

// client:visible keeps WebGL out of the critical path entirely.
export default function HeroBackground() {
  return <AmbientBackground />;
}
