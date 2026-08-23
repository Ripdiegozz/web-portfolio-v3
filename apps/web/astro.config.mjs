// @ts-check
import { defineConfig } from 'astro/config';
import cloudflare from '@astrojs/cloudflare';
import react from '@astrojs/react';
import sitemap from '@astrojs/sitemap';
import tailwindcss from '@tailwindcss/vite';

export default defineConfig({
  site: 'https://dagadev.net',
  // 'static' = prerender everything by default; /api and /admin opt out per-route
  output: 'static',
  adapter: cloudflare(),
  integrations: [react(), sitemap()],
  i18n: {
    defaultLocale: 'en',
    locales: ['en', 'es'],
    routing: {
      prefixDefaultLocale: false,
    },
  },
  vite: {
    plugins: [tailwindcss()],
    resolve: {
      // Single React instance across workspace packages and SSR islands:
      // duplicate Reacts break hooks (Invalid hook call in SSR).
      dedupe: ['react', 'react-dom'],
    },
    optimizeDeps: {
      // @portfolio/ui is a linked workspace package, so Vite doesn't scan its
      // deps at startup. Without this, lucide-react is discovered lazily on
      // the first page that mounts an island using it, forcing a full dev
      // server reload mid-session that wipes client-side React state.
      include: ['lucide-react'],
    },
  },
});
