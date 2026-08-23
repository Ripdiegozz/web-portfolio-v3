export type ThemeChoice = 'light' | 'dark';

/** Single source of truth for theme resolution. Mirrored by the inline pre-hydration script in BaseLayout.astro. */
export function resolveInitialTheme(systemPrefersDark: boolean, stored: string | null): ThemeChoice {
  if (stored === 'light' || stored === 'dark') return stored;
  return systemPrefersDark ? 'dark' : 'light';
}
