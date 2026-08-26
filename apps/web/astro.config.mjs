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
  adapter: cloudflare({
    prerenderEnvironment: 'node',
    remoteBindings: false,
  }),
  integrations: [
    react(),
    sitemap({
      filter: (page) => !page.includes('/keystatic') && !page.includes('/api'),
      i18n: {
        defaultLocale: 'en',
        locales: {
          en: 'en-US',
          es: 'es-ES',
        },
      },
    }),
  ],
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
    ssr: {
      // hono and zod (used by the /api/contact route) are otherwise only
      // discovered on the first request that hits that route, forcing a dev
      // server reload mid-request that can crash with a missing-chunk error.
      optimizeDeps: {
        include: ['hono', 'zod'],
      },
    },
  },
});
