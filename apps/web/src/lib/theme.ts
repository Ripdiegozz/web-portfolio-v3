export type ThemeChoice = 'light' | 'dark';

/** Resolves the theme on first paint. Keep the inline script in BaseLayout.astro in sync. */
export function resolveInitialTheme(systemPrefersDark: boolean, stored: string | null): ThemeChoice {
  if (stored === 'light' || stored === 'dark') return stored;
  return systemPrefersDark ? 'dark' : 'light';
}
