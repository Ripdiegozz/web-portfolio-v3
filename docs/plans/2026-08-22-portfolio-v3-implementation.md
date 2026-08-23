# Portfolio v3 Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Full-stack rewrite of dagadev.tech as a single Cloudflare Worker: prerendered Astro 7 portfolio + Keystatic-managed blog + Hono API (contact email via Resend, GitHub activity grid), replacing the static v2 on Vercel.

**Architecture:** Bun-workspace monorepo (`apps/web`, `packages/ui`, `packages/email`, `packages/config`) driven by Turborepo. `apps/web` builds with `output: 'static'` + `@astrojs/cloudflare`; every public route is prerendered HTML at the edge; only `/api/*` and `/admin/*` set `prerender = false` and run SSR in the Worker. Hono mounts through one catch-all API route; Keystatic (GitHub storage) commits posts to `src/content/posts/` which the Astro Content Layer mirrors with a Zod schema.

**Tech Stack:** bun 1.4.0 · turbo@latest (v2) · astro@latest (7.x) · @astrojs/cloudflare@latest · react@latest (19) + @astrojs/react · hono@latest (4) · tailwindcss@latest (4, CSS-first `@theme`) · motion@latest (13) · three@latest (0.185+) + @react-three/fiber · @keystatic/core@latest (0.x — spike-gated) · resend + @react-email/components · zod@latest (v4 API) · vitest · Playwright (smoke only). TypeScript strict; never hardcode patch versions in code — install with `bun add pkg@latest` and let the lockfile pin.

**Source of truth:** `docs/plans/2026-08-22-portfolio-v3-design.md`. Do not add features beyond it.

---

## Conventions for the executor

- **Package manager:** `bun` everywhere (`bun install`, `bun test`, `bun run`, `bunx`). Never npm/pnpm/yarn.
- **Commits:** Conventional Commits, granular per task, no AI attribution, no Co-Authored-By.
- **TDD:** Every behavior task follows RED → verify RED → GREEN → verify GREEN → commit. Configuration/scaffold tasks are TDD-exempt (per test-driven-development skill exceptions) but MUST include their verification step.
- **⚠️ MANUAL** marks steps only Diego can do in dashboards/consoles. Do them or note them as blocked; never fake their outcome.
- Run all commands from repo root unless a task says otherwise.
- Dev server URL is `http://localhost:4321`.

---

## Milestone 0 — Monorepo scaffold + Keystatic smoke spike

### Task 1: Scaffold monorepo (turbo + bun workspaces)

**Files:**
- Create: `.bun-version`
- Create: `.gitignore`
- Create: `package.json`
- Create: `turbo.json`
- Create: `.prettierrc`
- Create: `packages/config/package.json`
- Create: `packages/config/tsconfig.base.json`
- Create: `packages/ui/package.json`
- Create: `packages/ui/src/index.ts`
- Create: `packages/email/package.json`
- Create: `packages/email/src/index.ts`

TDD-exempt (configuration). Steps:

**Step 1: Write root files**

`.bun-version`:
```
1.4.0
```

`.gitignore`:
```
node_modules/
dist/
.astro/
.turbo/
.wrangler/
.env
.env.*
!.env.example
```

`package.json`:
```json
{
  "name": "web-portfolio-v3",
  "private": true,
  "workspaces": ["apps/*", "packages/*"],
  "scripts": {
    "dev": "turbo dev",
    "build": "turbo build",
    "lint": "turbo lint",
    "typecheck": "turbo typecheck",
    "test": "turbo test"
  },
  "devDependencies": {
    "prettier": "latest",
    "turbo": "latest",
    "typescript": "latest"
  }
}
```

`turbo.json`:
```json
{
  "$schema": "https://turborepo.com/schema.json",
  "tasks": {
    "build": { "dependsOn": ["^build"], "outputs": ["dist/**", ".astro/**"] },
    "lint": {},
    "typecheck": { "dependsOn": ["^build"] },
    "test": { "dependsOn": ["^build"] },
    "dev": { "cache": false, "persistent": true }
  }
}
```

`.prettierrc`:
```json
{ "singleQuote": true, "printWidth": 100 }
```

**Step 2: Write packages**

`packages/config/package.json`:
```json
{
  "name": "@portfolio/config",
  "version": "0.0.0",
  "private": true,
  "files": ["tsconfig.base.json"]
}
```

`packages/config/tsconfig.base.json`:
```json
{
  "compilerOptions": {
    "target": "ES2022",
    "module": "ESNext",
    "moduleResolution": "bundler",
    "lib": ["ES2022", "DOM", "DOM.Iterable"],
    "jsx": "react-jsx",
    "strict": true,
    "skipLibCheck": true,
    "isolatedModules": true,
    "resolveJsonModule": true,
    "noEmit": true,
    "forceConsistentCasingInFileNames": true
  }
}
```

`packages/ui/package.json` (empty-but-wired):
```json
{
  "name": "@portfolio/ui",
  "version": "0.0.0",
  "private": true,
  "type": "module",
  "main": "./src/index.ts",
  "types": "./src/index.ts",
  "scripts": {
    "lint": "eslint .",
    "typecheck": "tsc --noEmit"
  },
  "peerDependencies": {
    "react": "^19.0.0"
  }
}
```

`packages/ui/src/index.ts`:
```ts
export const UI_PACKAGE_NAME = '@portfolio/ui';
```

`packages/email/package.json` (empty-but-wired):
```json
{
  "name": "@portfolio/email",
  "version": "0.0.0",
  "private": true,
  "type": "module",
  "main": "./src/index.ts",
  "types": "./src/index.ts",
  "scripts": {
    "lint": "eslint .",
    "typecheck": "tsc --noEmit"
  },
  "peerDependencies": {
    "react": "^19.0.0"
  }
}
```

`packages/email/src/index.ts`:
```ts
export const EMAIL_PACKAGE_NAME = '@portfolio/email';
```

**Step 3: Install and verify**

Run: `bun install`
Expected: creates `bun.lock`, installs turbo/typescript/prettier, exits 0.

Run: `bunx turbo lint typecheck`
Expected: 0 tasks fail (ui/email scripts reference eslint/tsc that are not yet installed — if turbo errors on missing binaries, temporarily remove those two scripts from ui/email package.json and re-run; they are re-added in Task 6).

Run: `git init -q 2>$null; git add -A; git commit -m "chore: scaffold bun+turbo monorepo with empty wired workspaces"`

---

### Task 2: Bootstrap Astro app with Cloudflare adapter + Tailwind 4

**Files:**
- Create: `apps/web/package.json`
- Create: `apps/web/astro.config.mjs`
- Create: `apps/web/wrangler.jsonc`
- Create: `apps/web/tsconfig.json`
- Create: `apps/web/public/favicon.svg`
- Create: `apps/web/src/styles/global.css`
- Create: `apps/web/src/layouts/BaseLayout.astro`
- Create: `apps/web/src/pages/index.astro`
- Create: `.env.example`

TDD-exempt (configuration). Steps:

**Step 1: Write `apps/web/package.json`**

```json
{
  "name": "@portfolio/web",
  "version": "0.0.0",
  "private": true,
  "type": "module",
  "scripts": {
    "dev": "astro dev",
    "build": "astro build",
    "preview": "wrangler dev",
    "lint": "eslint .",
    "typecheck": "astro check"
  },
  "dependencies": {
    "@astrojs/cloudflare": "latest",
    "@astrojs/react": "latest",
    "@portfolio/config": "workspace:*",
    "@portfolio/email": "workspace:*",
    "@portfolio/ui": "workspace:*",
    "@tailwindcss/vite": "latest",
    "astro": "latest",
    "react": "latest",
    "react-dom": "latest",
    "tailwindcss": "latest"
  },
  "devDependencies": {
    "@types/react": "latest",
    "@types/react-dom": "latest",
    "wrangler": "latest"
  }
}
```

**Step 2: Write config files**

`apps/web/astro.config.mjs`:
```js
// @ts-check
import { defineConfig } from 'astro/config';
import cloudflare from '@astrojs/cloudflare';
import react from '@astrojs/react';
import tailwindcss from '@tailwindcss/vite';

export default defineConfig({
  site: 'https://dagadev.tech',
  // 'static' = prerender everything by default; /api and /admin opt out per-route
  output: 'static',
  adapter: cloudflare(),
  integrations: [react()],
  vite: {
    plugins: [tailwindcss()],
  },
});
```

`apps/web/wrangler.jsonc`:
```jsonc
{
  "$schema": "node_modules/wrangler/config-schema.json",
  "name": "web-portfolio-v3",
  "main": "@astrojs/cloudflare/entrypoints/server",
  "compatibility_date": "2026-08-01",
  "compatibility_flags": ["nodejs_compat"],
  "assets": {
    "binding": "ASSETS",
    "directory": "./dist"
  },
  "observability": { "enabled": true }
}
// RATE_LIMIT_KV namespace added in Task 15 after creation.
```

`apps/web/tsconfig.json`:
```json
{
  "extends": "astro/tsconfigs/strictest",
  "compilerOptions": {
    "baseUrl": ".",
    "paths": {
      "@/*": ["src/*"]
    }
  },
  "include": [".astro/types.d.ts", "**/*"],
  "exclude": ["dist", "tests/e2e"]
}
```

**Step 3: Write minimal shell page + Tailwind entry**

`apps/web/src/styles/global.css`:
```css
@import 'tailwindcss';
```

`apps/web/src/layouts/BaseLayout.astro`:
```astro
---
interface Props {
  title: string;
  description?: string;
}
const { title, description = "Diego — Full-Stack Engineer" } = Astro.props;
---
<!doctype html>
<html lang="en">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <meta name="description" content={description} />
    <title>{title}</title>
  </head>
  <body class="min-h-screen bg-white text-neutral-900 antialiased">
    <slot />
  </body>
</html>
```

`apps/web/src/pages/index.astro`:
```astro
---
import BaseLayout from '../layouts/BaseLayout.astro';
import '../styles/global.css';
---
<BaseLayout title="Diego — Full-Stack Engineer">
  <main class="flex min-h-screen items-center justify-center">
    <h1 class="text-4xl font-bold">Portfolio v3</h1>
  </main>
</BaseLayout>
```

Create `apps/web/public/favicon.svg`: any simple SVG (e.g., a blue `<circle>`).

Root `.env.example` (create at repo root):
```
# Server secrets — NEVER commit real values. Production: wrangler secret put / GH Environment.
RESEND_API_KEY=
TURNSTILE_SECRET_KEY=
GITHUB_TOKEN=
KEYSTATIC_GITHUB_CLIENT_ID=
KEYSTATIC_GITHUB_CLIENT_SECRET=
KEYSTATIC_SECRET=
RATE_LIMIT_KV_ID=

# Public (safe for client bundle)
PUBLIC_TURNSTILE_SITE_KEY=
PUBLIC_KEYSTATIC_GITHUB_APP_SLUG=
```

**Step 4: Install and verify boot**

Run: `bun install`
Expected: lockfile updated, exit 0.

Run: `cd apps/web; bun run dev` → wait for `Local http://localhost:4321/`, then from another shell: `(Invoke-WebRequest http://localhost:4321/).StatusCode`
Expected: `200`. Stop the server (`Ctrl+C`).

Run: `cd apps/web; bunx astro build`
Expected: `Complete!` — `dist/` generated. If the cloudflare adapter warns about missing KV bindings, ignore until Task 15.

**Step 5: Commit**

```bash
git add -A
git commit -m "feat(web): bootstrap astro 7 app with cloudflare adapter, tailwind 4, react integration"
```

---

### Task 3: ⚠️ GATING SPIKE — Keystatic × Astro 7 smoke test

Keystatic is 0.x. NOTHING in Milestone 3 may start before this task passes. If Step 4 fails irrecoverably, STOP and report: fallback is dropping Keystatic for plain markdown + git, which changes Milestone 3's design.

**Files:**
- Create: `apps/web/keystatic.config.ts`
- Create: `apps/web/src/pages/admin/[...params].astro`
- Create: `apps/web/src/pages/api/keystatic/[...params].ts`

**Step 1: Install Keystatic**

Run: `cd apps/web; bun add @keystatic/core@latest`
Expected: installs 0.x version, exit 0. Note printed version in commit message body.

**Step 2: Write config + routes**

`apps/web/keystatic.config.ts`:
```ts
import { config, collection, fields } from '@keystatic/core';

// Local dev writes straight to the working copy; production commits to GitHub.
const storage =
  process.env.KEYSTATIC_DEV_LOCAL === '1'
    ? ({ kind: 'local' as const })
    : ({
        kind: 'github' as const,
        repo: { owner: 'Ripdiegozz', name: 'web-portfolio-v3' }, // TODO(Diego): adjust if repo differs
      });

export default config({
  storage,
  collections: {
    posts: collection({
      label: 'Posts',
      slugField: 'slug',
      path: 'src/content/posts/*',
      format: { contentField: 'content' },
      schema: {
        title: fields.text({ label: 'Title', validation: { isRequired: true } }),
        slug: fields.slug({ name: { label: 'Slug' }, label: 'Slug' }),
        description: fields.text({ label: 'Description', multiline: true }),
        pubDate: fields.date({ label: 'Published date', validation: { isRequired: true } }),
        updatedDate: fields.date({ label: 'Updated date' }),
        draft: fields.checkbox({ label: 'Draft', defaultValue: false }),
        heroImage: fields.image({
          label: 'Hero image',
          directory: 'public/images/posts',
          publicPath: '/images/posts/',
        }),
        tags: fields.array(fields.text({ label: 'Tag' }), {
          label: 'Tags',
          itemLabel: (props) => props.value || 'New tag',
        }),
        content: fields.document({ label: 'Content' }),
      },
    }),
  },
});
```

`apps/web/src/pages/admin/[...params].astro`:
```astro
---
export const prerender = false;
import { Admin } from '@keystatic/core/ui';
import config from '../../keystatic.config';
---
<Admin config={config} client:load />
```

`apps/web/src/pages/api/keystatic/[...params].ts` — resolves env defensively: newer adapters expose bindings via `cloudflare:workers` instead of `locals.runtime`; we support both and pass credentials explicitly so we don't depend on Keystatic's internal lookup order:
```ts
export const prerender = false;
import type { APIRoute } from 'astro';
import { makeGenericAPIRouteHandler } from '@keystatic/core/api/generic';
import type { KeystaticApiEnv } from '../../../server/env';

async function resolveEnv(locals: unknown): Promise<KeystaticApiEnv> {
  const runtimeEnv = (locals as { runtime?: { env?: KeystaticApiEnv } })?.runtime?.env;
  if (runtimeEnv) return runtimeEnv;
  const mod = await import('cloudflare:workers');
  return mod.env as unknown as KeystaticApiEnv;
}

export const GET: APIRoute = async ({ request, locals }) => {
  const env = await resolveEnv(locals);
  const handler = makeGenericAPIRouteHandler(
    {
      config: (await import('../../keystatic.config')).default,
      clientId: env.KEYSTATIC_GITHUB_CLIENT_ID,
      clientSecret: env.KEYSTATIC_GITHUB_CLIENT_SECRET,
      secret: env.KEYSTATIC_SECRET,
    },
    { slugEnvName: 'PUBLIC_KEYSTATIC_GITHUB_APP_SLUG' }
  );
  const keystatic = await handler({
    method: request.method,
    headers: Object.fromEntries(request.headers),
    url: request.url,
    body: await request.text(),
  });
  return new Response(keystatic.body, {
    status: keystatic.status,
    headers: keystatic.headers,
  });
};

export const POST = GET;
```

Create placeholder `apps/web/src/server/env.ts` (full Bindings map lands in Task 14):
```ts
/**
 * Minimal shape of the Worker environment needed by Keystatic routes.
 * Values arrive as runtime bindings in production and .env vars in dev.
 */
export interface KeystaticApiEnv {
  KEYSTATIC_GITHUB_CLIENT_ID?: string;
  KEYSTATIC_GITHUB_CLIENT_SECRET?: string;
  KEYSTATIC_SECRET?: string;
  [key: string]: unknown;
}
```

Also create `apps/web/src/env.d.ts` so `cloudflare:workers` types resolve during dev/build:
```ts
declare module 'cloudflare:workers' {
  export const env: Record<string, unknown>;
}
```

**Step 3: Verify admin boots locally (no GitHub OAuth needed in local mode)**

Run: `cd apps/web; $env:KEYSTATIC_DEV_LOCAL='1'; bun run dev`
Then browse `http://localhost:4321/admin`.
Expected: Keystatic dashboard renders ("Posts" collection visible, no console errors).

Browse/create post: click "Posts" → "Create" → fill Title "Spike Post", slug auto-fills, write one line in Content → Save.
Expected: file `apps/web/src/content/posts/spike-post.mdx` (or `.md`) exists on disk with frontmatter `title: Spike Post`.

Verify the API handler is mounted: `(Invoke-WebRequest -MaximumRedirection 0 http://localhost:4321/api/keystatic/login -SkipHttpErrorCheck).StatusCode`
Expected: any structured HTTP response (typically `302`/`400`), NOT `404` — proves the route resolved.

Delete the spike post file. Stop the server.

**Step 4: Commit**

```bash
git add -A
git commit -m "feat(web): mount keystatic admin+api routes behind env-flag local storage (smoke-tested)"
```

---

## Milestone 1 — Design system tokens & fonts

### Task 4: Theme tokens (Tailwind 4 @theme) + FOUC-free theme toggle

**Files:**
- Modify: `apps/web/src/styles/global.css`
- Create: `apps/web/src/lib/theme.ts`
- Test: `apps/web/src/lib/theme.test.ts`
- Create: `apps/web/vitest.config.ts`
- Modify: `apps/web/package.json` (add `vitest`, `"test": "vitest run"` script)

**Step 1: Add Vitest harness**

`apps/web/devDependencies`: run `cd apps/web; bun add -d vitest@latest`. Add script `"test": "vitest run"`.

`apps/web/vitest.config.ts`:
```ts
import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    environment: 'node',
    include: ['src/**/*.test.ts'],
    exclude: ['tests/**', 'node_modules/**', 'dist/**'],
  },
});
```

**Step 2: Write the failing test** — `apps/web/src/lib/theme.test.ts`:
```ts
import { describe, expect, it } from 'vitest';
import { resolveInitialTheme } from './theme';

describe('resolveInitialTheme', () => {
  it('uses stored dark override over system preference', () => {
    expect(resolveInitialTheme(false, 'dark')).toBe('dark');
  });
  it('uses stored light override even when system prefers dark', () => {
    expect(resolveInitialTheme(true, 'light')).toBe('light');
  });
  it('falls back to system preference when nothing stored', () => {
    expect(resolveInitialTheme(true, null)).toBe('dark');
    expect(resolveInitialTheme(false, null)).toBe('light');
  });
  it('ignores invalid stored values', () => {
    expect(resolveInitialTheme(true, 'banana')).toBe('dark');
  });
});
```

**Step 3: Verify RED**

Run: `cd apps/web; bun test src/lib/theme.test.ts` (i.e. `bunx vitest run src/lib/theme.test.ts`)
Expected: FAIL — `Cannot find module './theme'` / `resolveInitialTheme is not exported`.

**Step 4: Minimal implementation** — `apps/web/src/lib/theme.ts`:
```ts
export type ThemeChoice = 'light' | 'dark';

/** Single source of truth for theme resolution. Mirrored by the inline pre-hydration script in BaseLayout.astro. */
export function resolveInitialTheme(systemPrefersDark: boolean, stored: string | null): ThemeChoice {
  if (stored === 'light' || stored === 'dark') return stored;
  return systemPrefersDark ? 'dark' : 'light';
}
```

**Step 5: Verify GREEN**

Run: `cd apps/web; bunx vitest run src/lib/theme.test.ts`
Expected: PASS (5 tests).

**Step 6: Wire tokens into CSS**

Replace `apps/web/src/styles/global.css`:
```css
@import 'tailwindcss';

@theme {
  --font-display: 'Space Grotesk Variable', ui-sans-serif, system-ui, sans-serif;
  --font-serif-accent: 'Instrument Serif', 'Times New Roman', Times, serif;
  --font-mono-code: 'JetBrains Mono Variable', ui-monospace, SFMono-Regular, monospace;
  --color-accent: #2563eb; /* electric blue — single saturated accent, grim-style grid uses this too */
  --color-accent-strong: #1d4ed8;

  /* semantic tokens mapped to per-theme variables (see :root/.dark below) */
  --color-bg: var(--tk-bg);
  --color-bg-raised: var(--tk-bg-raised);
  --color-text-primary: var(--tk-text-primary);
  --color-text-muted: var(--tk-text-muted);
  --color-border-subtle: var(--tk-border-subtle);
}

:root {
  --tk-bg: #ffffff;
  --tk-bg-raised: #f4f4f5;
  --tk-text-primary: #101014;
  --tk-text-muted: #52525b;
  --tk-border-subtle: #e4e4e7;
  color-scheme: light;
}

html.dark {
  --tk-bg: #09090d;
  --tk-bg-raised: #14141c;
  --tk-text-primary: #f4f4f5;
  --tk-text-muted: #a1a1aa;
  --tk-border-subtle: #26262e;
  color-scheme: dark;
}

body {
  background-color: var(--color-bg);
  color: var(--color-text-primary);
}
```

Update `BaseLayout.astro` `<head>` to prevent FOUC (inline, pre-hydration) and use tokens:
```astro
<script is:inline>
  (() => {
    try {
      const stored = localStorage.getItem('theme');
      const dark = stored === 'dark' || ((stored !== 'light') && matchMedia('(prefers-color-scheme: dark)').matches);
      document.documentElement.classList.toggle('dark', dark);
    } catch {}
  })();
</script>
```
and `<body>` classes become: `class="min-h-screen bg-bg text-text-primary antialiased"`.

Add a temporary toggle button in `index.astro` to prove persistence works:
```html
<button
  id="theme-toggle"
  class="rounded border border-border-subtle px-3 py-1 text-sm"
>Toggle theme</button>
<script>
  document.getElementById('theme-toggle')?.addEventListener('click', () => {
    const next = document.documentElement.classList.toggle('dark') ? 'dark' : 'light';
    localStorage.setItem('theme', next);
  });
</script>
```
Manual check: `bun run dev` → toggle flips colors instantly on reload, no flash of wrong theme.

**Step 7: Commit**

```bash
git add -A
git commit -m "feat(web): tailwind 4 design tokens with dual-theme variables and fouc-safe toggle"
```

---

### Task 5: Self-hosted fonts (Fontsource)

**Files:**
- Modify: `apps/web/package.json`
- Modify: `apps/web/src/layouts/BaseLayout.astro`

TDD-exempt (asset wiring). Steps:

**Step 1: Install fonts**

Run: `cd apps/web; bun add @fontsource-variable/space-grotesk@latest @fontsource/instrument-serif@latest @fontsource-variable/jetbrains-mono@latest`
Expected: exit 0.

**Step 2: Import in BaseLayout frontmatter** (before global.css import):
```astro
---
import '@fontsource-variable/space-grotesk';
import '@fontsource/instrument-serif';
import '@fontsource-variable/jetbrains-mono';
import '../styles/global.css';
// ...existing Props/interface code unchanged
---
```

**Step 3: Visual verification**

Run: `cd apps/web; bun run dev`
Expected: headings render Space Grotesk; no network requests to fonts.googleapis.com (DevTools → Network → filter `fonts.g`). Italic serif accent will be exercised in Task 8 hero.

**Step 4: Commit**

```bash
git add -A
git commit -m "feat(web): self-host display/serif-accent/mono fonts via fontsource, drop external font cdns"
```

---

### Task 6: Shared UI primitives (Reveal motion wrapper, Button) in packages/ui

**Files:**
- Modify: `packages/ui/package.json`
- Create: `packages/ui/tsconfig.json`
- Create: `packages/ui/src/react/Reveal.tsx`
- Create: `packages/ui/src/react/Button.tsx`
- Modify: `packages/ui/src/index.ts`

Component rendering itself is verified visually (design doc scopes Vitest to schemas/templates/mappers/limiter); the motion-reduction branch is a pure decision worth a unit test.

**Step 1: Install deps**

Run: `cd packages/ui; bun add motion@latest; bun add -d react@latest @types/react@latest eslint@latest typescript-eslint@latest @eslint/js@latest typescript@latest`
Expected: exit 0.

Create root `eslint.config.js` (flat config, shared):
```js
import js from '@eslint/js';
import tseslint from 'typescript-eslint';

export default tseslint.config(
  { ignores: ['**/dist/**', '**/.astro/**', '**/node_modules/**'] },
  js.configs.recommended,
  ...tseslint.configs.recommended
);
```
(The `lint` scripts in ui/email/web all run this same root config.)

**Step 2: Failing test** — `packages/ui/src/react/reveal.test.ts`:
```ts
import { describe, expect, it } from 'vitest';
import { revealPropsFor } from './Reveal';

describe('revealPropsFor', () => {
  it('returns animated props when motion allowed', () => {
    const props = revealPropsFor(false);
    expect(props.initial).toEqual({ opacity: 0, y: 16 });
    expect(props.whileInView).toEqual({ opacity: 1, y: 0 });
  });
  it('returns static props under prefers-reduced-motion', () => {
    const props = revealPropsFor(true);
    expect(props.initial).toBeUndefined();
    expect(props.whileInView).toBeUndefined();
  });
});
```
Add `"test": "vitest run"` + `-d vitest@latest` to packages/ui first.

**Step 3: Verify RED**

Run: `cd packages/ui; bunx vitest run`
Expected: FAIL — module `./Reveal` has no export `revealPropsFor`.

**Step 4: Implement** — `packages/ui/src/react/Reveal.tsx`:
```tsx
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
```

`packages/ui/src/react/Button.tsx`:
```tsx
import type { ButtonHTMLAttributes } from 'react';

type Variant = 'primary' | 'ghost';

const base =
  'inline-flex items-center justify-center rounded-md px-4 py-2 text-sm font-medium transition-colors disabled:pointer-events-none disabled:opacity-50';
const variants: Record<Variant, string> = {
  primary: 'bg-accent text-white hover:bg-accent-strong',
  ghost: 'border border-border-subtle hover:bg-bg-raised',
};

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
}

export function Button({ variant = 'primary', className = '', ...rest }: ButtonProps) {
  return <button className={`${base} ${variants[variant]} ${className}`} {...rest} />;
}
```

`packages/ui/src/index.ts`:
```ts
export { Reveal, revealPropsFor, type RevealProps } from './react/Reveal';
export { Button, type ButtonProps } from './react/Button';
export { UI_PACKAGE_NAME } from './meta';
```
Move the old constant into `packages/ui/src/meta.ts`:
```ts
export const UI_PACKAGE_NAME = '@portfolio/ui';
```

`packages/ui/tsconfig.json`:
```json
{
  "extends": "../config/tsconfig.base.json",
  "compilerOptions": { "types": [] },
  "include": ["src"]
}
```

**Step 5: Verify GREEN**

Run: `cd packages/ui; bunx vitest run; cd ../..; bunx turbo typecheck lint`
Expected: tests PASS; typecheck/lint clean across workspace.

**Step 6: Commit**

```bash
git add -A
git commit -m "feat(ui): add motion reveal wrapper with reduced-motion guard and button primitive"
```

---

## Milestone 2 — Static UI sections & pages

### Task 7: Home one-pager sections with placeholder data

**Files:**
- Create: `apps/web/src/components/sections/Hero.astro`
- Create: `apps/web/src/components/sections/About.astro`
- Create: `apps/web/src/components/sections/Experience.astro`
- Create: `apps/web/src/components/sections/Projects.astro`
- Create: `apps/web/src/components/sections/Skills.astro`
- Create: `apps/web/src/components/sections/ContactSection.astro`
- Create: `apps/web/src/components/Footer.astro`
- Create: `apps/web/src/data/site.ts`
- Modify: `apps/web/src/pages/index.astro`
- Modify: `apps/web/src/layouts/BaseLayout.astro` (semantic tokens on html/body, skip-link)

Data comes from `apps/web/src/data/site.ts` (typed placeholders now; real values migrate in Task 21):
```ts
export interface ExperienceItem {
  company: string;
  role: string;
  period: string;
  highlights: string[];
}
export interface ProjectItem {
  name: string;
  description: string;
  stack: string[];
  repoUrl?: string;
  liveUrl?: string;
}
export interface SkillGroup {
  category: string;
  items: string[];
}
export interface SocialLink {
  label: string;
  href: string;
}

export const experience: ExperienceItem[] = [
  {
    company: 'Wazuh',
    role: 'Full-Stack Engineer',
    period: 'Current',
    highlights: ['Building the Wazuh AI Assistant'],
  },
];
export const projects: ProjectItem[] = [
  { name: 'NatGPT', description: 'Placeholder — migrated from v2.', stack: [] },
  { name: 'Notewave', description: 'Placeholder — migrated from v2.', stack: [] },
];
export const skills: SkillGroup[] = [];
export const socials: SocialLink[] = [
  { label: 'GitHub', href: 'https://github.com/Ripdiegozz' },
  { label: 'LinkedIn', href: 'https://www.linkedin.com/in/dagadev' },
];
export const aboutText =
  'Full-Stack Engineer at Wazuh building the Wazuh AI Assistant.';
```

Each section is an `.astro` component consuming these exports; sections wrap content in `Reveal` via a tiny client island where motion matters (Hero headline + section wrappers use `client:visible`). Serif italic accent spans use `font-serif-accent italic` (e.g., highlighted words in Hero). ContactSection hosts a placeholder `<div id="contact-form-root">` — the real island lands in Task 13.

Verification (manual, visual): `bun run dev` → all six sections render in order, both themes legible, no hydration errors in console.

Commit:
```bash
git add -A
git commit -m "feat(web): home one-pager sections with typed site data modules"
```

---

### Task 8: Ambient WebGL hero background (R3F island, guarded)

**Files:**
- Create: `packages/ui/src/three/AmbientBackground.tsx`
- Create: `apps/web/src/components/islands/HeroBackground.tsx`
- Modify: `apps/web/src/components/sections/Hero.astro`

**Step 1: Install**

Run: `cd packages/ui; bun add three@latest @react-three/fiber@latest; bun add -d @types/three@latest`
Expected: three >= 0.185, fiber 9.x, exit 0.

**Step 2: Implement guarded ambient layer** — `packages/ui/src/three/AmbientBackground.tsx`:
```tsx
import { useEffect, useState } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import * as THREE from 'three';

function WavePlane() {
  const ref = useRef<THREE.Mesh>(null!); // import { useRef } from 'react'
  useFrame(({ clock }) => {
    if (document.visibilityState === 'hidden') return; // pause when tab hidden
    const mat = ref.current.material as THREE.ShaderMaterial;
    mat.uniforms.uTime.value = clock.elapsedTime;
  });
  return (
    <mesh ref={ref}>
      <planeGeometry args={[30, 30, 64, 64]} />
      <shaderMaterial
        transparent
        uniforms={{ uTime: { value: 0 }, uColor: { value: new THREE.Color('#2563eb') } }}
        vertexShader={VERT}
        fragmentShader={FRAG}
      />
    </mesh>
  );
}

const VERT = /* glsl */ `
  uniform float uTime;
  varying vec3 vPos;
  void main() {
    vec3 p = position;
    p.z += sin(p.x * 0.6 + uTime) * cos(p.y * 0.6 + uTime * 0.8) * 0.9;
    vPos = p;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(p, 1.0);
  }
`;
const FRAG = /* glsl */ `
  uniform vec3 uColor;
  varying vec3 vPos;
  void main() {
    float glow = smoothstep(-1.0, 2.0, vPos.z);
    gl_FragColor = vec4(uColor, glow * 0.18);
  }
`;

/** Ambient-only WebGL layer. Disabled entirely under prefers-reduced-motion. */
export function AmbientBackground() {
  const [allowed, setAllowed] = useState<boolean | null>(null);
  useEffect(() => {
    setAllowed(!window.matchMedia('(prefers-reduced-motion: reduce)').matches);
  }, []);
  if (allowed === null || !allowed) return null;
  return (
    <Canvas
      className="pointer-events-none absolute inset-0 -z-10"
      camera={{ position: [0, 0, 5], fov: 60 }}
      dpr={[1, 1.5]}
      gl={{ antialias: false, alpha: true }}
    >
      <WavePlane />
    </Canvas>
  );
}
```
(Add `useRef` to the React import line.)

Export from `packages/ui/src/index.ts`: `export { AmbientBackground } from './three/AmbientBackground';`

`apps/web/src/components/islands/HeroBackground.tsx`:
```tsx
import { AmbientBackground } from '@portfolio/ui';
// Lazy: island mounts only when visible (client:visible) — keeps WebGL out of critical path.
export default function HeroBackground() {
  return <AmbientBackground />;
}
```

In `Hero.astro`:
```astro
<HeroBackground client:visible />
```

**Step 3: Manual verification**

`bun run dev` → hero shows slow blue wave glow; OS "reduce motion" ON → canvas absent (DOM has no `canvas`); throttle tab → no GPU churn (Task Manager).

**Step 4: Commit**

```bash
git add -A
git commit -m "feat(ui): ambient r3f wave background lazy-loaded with reduced-motion kill switch"
```

---

## Milestone 3 — Blog (Keystatic collection × Content Layer × RSS/sitemap)

### Task 9: Content Layer schema mirroring keystatic.config + publish filters

**Files:**
- Create: `apps/web/src/content.config.ts`
- Create: `apps/web/src/lib/blog.ts`
- Test: `apps/web/src/lib/blog.test.ts`
- Create: `apps/web/src/content/posts/hello-world.md`

**Step 1: Failing test** — `apps/web/src/lib/blog.test.ts`:
```ts
import { afterEach, describe, expect, it, vi } from 'vitest';
import { isPublished, sortPostsByDateDesc } from './blog';

const makeEntry = (pubDate: string, draft = false) =>
  ({ data: { pubDate: new Date(pubDate), draft } });

afterEach(() => vi.unstubAllEnvs());

describe('isPublished', () => {
  it('keeps non-draft entries in production', () => {
    vi.stubEnv('PROD', true);
    expect(isPublished(makeEntry('2026-01-01'))).toBe(true);
  });
  it('drops drafts in production', () => {
    vi.stubEnv('PROD', true);
    expect(isPublished(makeEntry('2026-01-01', true))).toBe(false);
  });
  it('keeps drafts in development previews', () => {
    vi.stubEnv('PROD', false);
    expect(isPublished(makeEntry('2026-01-01', true))).toBe(true);
  });
});

describe('sortPostsByDateDesc', () => {
  it('sorts newest first', () => {
    const sorted = sortPostsByDateDesc([
      makeEntry('2026-01-01'),
      makeEntry('2026-06-01'),
      makeEntry('2025-12-31'),
    ]);
    expect(sorted.map((e) => e.data.pubDate.getFullYear())).toEqual([2026, 2026, 2025]);
  });
});
```

**Step 2: Verify RED**

Run: `cd apps/web; bunx vitest run src/lib/blog.test.ts`
Expected: FAIL — `isPublished`/`sortPostsByDateDesc` not exported.

**Step 3: Implement** — `apps/web/src/lib/blog.ts`:
```ts
interface EntryLike {
  data: { draft?: boolean; pubDate: Date };
}

/** Drafts stay visible in dev previews, filtered out of PROD builds. */
export function isPublished(entry: EntryLike): boolean {
  return !(import.meta.env.PROD && entry.data.draft === true);
}

export function sortPostsByDateDesc<T extends EntryLike>(entries: T[]): T[] {
  return [...entries].sort(
    (a, b) => b.data.pubDate.getTime() - a.data.pubDate.getTime()
  );
}
```

**Step 4: Verify GREEN**

Run: `cd apps/web; bunx vitest run src/lib/blog.test.ts`
Expected: PASS (5 tests).

**Step 5: Mirror schema in Content Layer** — `apps/web/src/content.config.ts` (field names MUST match `keystatic.config.ts` exactly):
```ts
import { defineCollection } from 'astro:content';
import { glob } from 'astro/loaders';
import { z } from 'astro/zod';

const posts = defineCollection({
  loader: glob({ base: './src/content/posts', pattern: '**/*.{md,mdx}' }),
  schema: z.object({
    title: z.string(),
    description: z.string().default(''),
    pubDate: z.coerce.date(),
    updatedDate: z.coerce.date().optional(),
    draft: z.boolean().default(false),
    heroImage: z.string().optional(),
    tags: z.array(z.string()).default([]),
  }),
});

export const collections = { posts };
```

Seed post — `apps/web/src/content/posts/hello-world.md`:
```markdown
---
title: Hello, world
description: First post on the new portfolio engine.
pubDate: 2026-08-22
tags: [meta]
draft: false
---

This site now publishes through Keystatic.
```

**Step 6: Verify collection sync**

Run: `cd apps/web; bunx astro sync`
Expected: `.astro/types.d.ts` regenerated without schema errors.

**Step 7: Commit**

```bash
git add -A
git commit -m "feat(blog): mirror keystatic posts collection in astro content layer with prod draft filtering"
```

---

### Task 10: Blog index + post pages

**Files:**
- Create: `apps/web/src/pages/blog/index.astro`
- Create: `apps/web/src/pages/blog/[slug].astro`
- Modify: `apps/web/src/pages/index.astro` (nav link `/blog`)
- Modify: `apps/web/src/layouts/BaseLayout.astro` (nav header partial)

`apps/web/src/pages/blog/index.astro`:
```astro
---
import { getCollection } from 'astro:content';
import BaseLayout from '../../layouts/BaseLayout.astro';
import { isPublished, sortPostsByDateDesc } from '../../lib/blog';

const entries = sortPostsByDateDesc((await getCollection('posts')).filter(isPublished));
---
<BaseLayout title="Blog — Diego">
  <ul class="mx-auto max-w-2xl divide-y divide-border-subtle py-16">
    {entries.map((entry) => (
      <li class="py-6">
        <a href={`/blog/${entry.id}/`} class="group block">
          <h2 class="font-display text-xl group-hover:text-accent">{entry.data.title}</h2>
          <p class="text-text-muted">{entry.data.description}</p>
          <time datetime={entry.data.pubDate.toISOString()} class="font-mono-code text-xs">
            {entry.data.pubDate.toDateString()}
          </time>
        </a>
      </li>
    ))}
  </ul>
</BaseLayout>
```

`apps/web/src/pages/blog/[slug].astro`:
```astro
---
import { getCollection, render } from 'astro:content';
import BaseLayout from '../../layouts/BaseLayout.astro';

export async function getStaticPaths() {
  const posts = await getCollection('posts');
  return posts.map((entry) => ({ params: { slug: entry.id }, props: { entry } }));
}

const { entry } = Astro.props;
const { Content } = await render(entry);
---
<BaseLayout title={`${entry.data.title} — Diego`} description={entry.data.description}>
  <article class="prose prose-neutral dark:prose-invert mx-auto py-16">
    {entry.data.heroImage && (
      <img src={entry.data.heroImage} alt="" width="1200" height="630" loading="eager" />
    )}
    <h1>{entry.data.title}</h1>
    <Content />
  </article>
</BaseLayout>
```

Typography styles: run `cd apps/web; bun add @tailwindcss/typography@latest`, then in `global.css` after `@import 'tailwindcss';` add:
```css
@plugin '@tailwindcss/typography';
```

Verify: `bunx astro build` succeeds producing `/blog/index.html` and `/blog/hello-world/index.html`; `bun run dev` shows the seeded post with prose styling.

Commit:
```bash
git add -A
git commit -m "feat(blog): prerendered blog index and post pages with typography styling"
```

---

### Task 11: RSS feed + sitemap

**Files:**
- Create: `apps/web/src/pages/rss.xml.ts`
- Create: `apps/web/public/robots.txt`
- Modify: `apps/web/astro.config.mjs` (sitemap integration)
- Modify: `apps/web/package.json`

**Step 1: Install**

Run: `cd apps/web; bun add @astrojs/rss@latest @astrojs/sitemap@latest`
Add `sitemap()` to integrations in `astro.config.mjs`.

**Step 2: RSS endpoint** — `apps/web/src/pages/rss.xml.ts`:
```ts
import rss from '@astrojs/rss';
import type { APIRoute } from 'astro';
import { getCollection } from 'astro:content';
import { isPublished, sortPostsByDateDesc } from '../lib/blog';

export const GET: APIRoute = async (context) => {
  const posts = sortPostsByDateDesc((await getCollection('posts')).filter(isPublished));
  return rss({
    title: 'Diego — blog',
    description: 'Writing about full-stack engineering.',
    site: context.site!,
    items: posts.map((post) => ({
      title: post.data.title,
      pubDate: post.data.pubDate,
      description: post.data.description,
      link: `/blog/${post.id}/`,
    })),
  });
};
```

`apps/web/public/robots.txt`:
```
User-agent: *
Allow: /

Sitemap: https://dagadev.tech/sitemap-index.xml
```

**Step 3: Verify**

Run: `cd apps/web; bunx astro build; Get-Content dist/rss.xml -TotalCount 8; Get-ChildItem dist`
Expected: `rss.xml` contains the hello-world item; `sitemap-index.xml` + `sitemap-0.xml` exist in `dist/`.

**Step 4: Commit**

```bash
git add -A
git commit -m "feat(blog): rss feed and sitemap generated from published posts"
```

---

## Milestone 4 — Hono API (contact + activity)

### Task 12: Hono app skeleton with centralized error handling

**Files:**
- Create: `apps/web/src/server/app.ts`
- Create: `apps/web/src/server/types.ts`
- Test: `apps/web/src/server/app.test.ts`
- Modify: `apps/web/package.json` (`hono` dep)
- Create: `apps/web/src/pages/api/[[route]].ts`

**Step 1: Install**

Run: `cd apps/web; bun add hono@latest`
Expected: hono 4.x.

**Step 2: Structural types** — `apps/web/src/server/types.ts`:
```ts
/** Structural KV surface we rely on — keeps limiter logic decoupled from workers-types versions. */
export interface KVLike {
  get(key: string): Promise<string | null>;
  put(key: string, value: string, opts?: { expirationTtl?: number }): Promise<void>;
}

/** Workers Cache API surface (caches.default). */
export interface CacheLike {
  match(request: Request): Promise<Response | undefined>;
  put(request: Request, response: Response): Promise<void>;
}

export interface WorkerBindings extends Record<string, unknown> {
  ASSETS?: FetcherLike;
  RATE_LIMIT_KV?: KVLike;
  RESEND_API_KEY?: string;
  TURNSTILE_SECRET_KEY?: string;
  GITHUB_TOKEN?: string;
  KEYSTATIC_GITHUB_CLIENT_ID?: string;
  KEYSTATIC_GITHUB_CLIENT_SECRET?: string;
  KEYSTATIC_SECRET?: string;
}

export interface FetcherLike {
  fetch(input: RequestInfo | URL, init?: RequestInit): Promise<Response>;
}
```

**Step 3: Failing test** — `apps/web/src/server/app.test.ts`:
```ts
import { describe, expect, it } from 'vitest';
import { createApp, type AppDeps } from './app';

function makeDeps(overrides: Partial<AppDeps> = {}): AppDeps {
  return {
    contact: {
      parseBody: async () => { throw new Error('not used in skeleton test'); },
      rateLimit: async () => true,
      verifyTurnstile: async () => true,
      sendEmail: async () => {},
    },
    activity: {
      fetchActivity: async () => ({ totalContributions: 0, weeks: [] }),
      readCache: async () => undefined,
      writeCache: async () => {},
    },
    ...overrides,
  };
}

describe('createApp error handling', () => {
  it('returns structured json for unknown api routes', async () => {
    const res = await createApp(makeDeps()).request('/api/nope');
    expect(res.status).toBe(404);
    expect(await res.json()).toEqual({ ok: false, error: 'not_found' });
  });
  it('never leaks internal error details', async () => {
    const deps = makeDeps({
      activity: {
        ...makeDeps().activity,
        fetchActivity: async () => { throw new Error('super secret upstream url'); },
        readCache: async () => undefined,
        writeCache: async () => {},
      },
    });
    const res = await createApp(deps).request('/api/activity');
    const body = await res.json();
    expect(res.status).toBe(500);
    expect(JSON.stringify(body)).not.toContain('secret');
    expect(body).toMatchObject({ ok: false });
  });
});
```

**Step 4: Verify RED**

Run: `cd apps/web; bunx vitest run src/server/app.test.ts`
Expected: FAIL — `createApp` not found.

**Step 5: Minimal implementation** — `apps/web/src/server/app.ts`:
```ts
import { Hono } from 'hono';

export interface ContactDeps {
  parseBody(request: Request): Promise<{ name: string; email: string; message: string; bot: boolean }>;
  verifyTurnstile(token: string | undefined, ip: string | null): Promise<boolean>;
  rateLimit(ip: string | null): Promise<boolean>;
  sendEmail(input: { name: string; email: string; message: string }): Promise<void>;
}

export interface ActivityGrid {
  totalContributions: number;
  weeks: Array<{
    days: Array<{ date: string; count: number; level: number }>;
  }>;
}

export interface ActivityDeps {
  fetchActivity(): Promise<ActivityGrid>;
  readCache(): Promise<ActivityGrid | undefined>;
  writeCache(grid: ActivityGrid): Promise<void>;
}

export interface AppDeps {
  contact: ContactDeps;
  activity: ActivityDeps;
}

export type ApiApp = ReturnType<typeof createApp>;

export function createApp(deps: AppDeps) {
  const app = new Hono();

  app.onError(() => Response.json({ ok: false, error: 'internal_error' }, { status: 500 }));
  app.notFound((c) => c.json({ ok: false, error: 'not_found' }, 404));

  app.post('/api/contact', async (c) => {
    // Implemented in Task 15.
    return c.json({ ok: false, error: 'not_implemented' }, 501);
  });

  app.get('/api/activity', async (c) => {
    // Implemented in Task 17.
    return c.json({ ok: false, error: 'not_implemented' }, 501);
  });

  return app;
}
```

Route mount — `apps/web/src/pages/api/[[route]].ts`:
```ts
export const prerender = false;
import type { APIRoute } from 'astro';
import { createApp } from '../../server/app';
import type { WorkerBindings } from '../../server/types';

function resolveBindings(locals: unknown): WorkerBindings {
  const runtimeEnv = (locals as { runtime?: { env?: WorkerBindings } })?.runtime?.env;
  return runtimeEnv ?? {};
}

export const ALL: APIRoute = async (ctx) => {
  const app = createApp(buildDeps(resolveBindings(ctx.locals)));
  return app.fetch(ctx.request);
};

import { buildDeps } from '../../server/deps';
```
(`buildDeps` arrives in Task 15/17 — for now export a stub `apps/web/src/server/deps.ts` returning the same dummy deps used by tests.)

**Step 6: Verify GREEN**

Run: `cd apps/web; bunx vitest run src/server`
Expected: PASS.

**Step 7: Commit**

```bash
git add -A
git commit -m "feat(api): hono app factory with dependency injection and centralized structured errors"
```

---

### Task 13: Contact validation schema + honeypot (zod v4)

**Files:**
- Create: `apps/web/src/server/contact/schema.ts`
- Test: `apps/web/src/server/contact/schema.test.ts`

**Step 1: Install**

Run: `cd apps/web; bun add zod@latest`
Expected: zod 4.x (use `z.email()` top-level API — NOT deprecated `z.string().email()`).

**Step 2: Failing test** — `schema.test.ts`:
```ts
import { describe, expect, it } from 'vitest';
import { classifyContactAttempt, contactSchema } from './schema';

const valid = {
  name: 'Jane Doe',
  email: 'jane@example.com',
  message: 'Hello, I would like to talk about a project.',
  company: '',
  turnstileToken: 'tok',
};

describe('contactSchema', () => {
  it('accepts a valid submission', () => {
    expect(contactSchema.safeParse(valid).success).toBe(true);
  });
  it('rejects empty message', () => {
    expect(contactSchema.safeParse({ ...valid, message: '' }).success).toBe(false);
  });
  it('rejects invalid email', () => {
    expect(contactSchema.safeParse({ ...valid, email: 'nope' }).success).toBe(false);
  });
  it('rejects missing turnstile token', () => {
    expect(contactSchema.safeParse({ ...valid, turnstileToken: '' }).success).toBe(false);
  });
});

describe('classifyContactAttempt', () => {
  it('flags honeypot hits as silent-bot regardless of other validity', () => {
    const result = contactSchema.safeParse({ ...valid, company: 'SpamCorp Inc' });
    expect(classifyContactAttempt(result)).toEqual({ kind: 'silent_bot' });
  });
  it('classifies invalid payloads as rejected', () => {
    expect(classifyContactAttempt(contactSchema.safeParse({ ...valid, email: 'x' })))
      .toEqual({ kind: 'rejected' });
  });
  it('classifies valid human payloads as accepted with data', () => {
    const result = classifyContactAttempt(contactSchema.safeParse(valid));
    expect(result.kind).toBe('accepted');
    if (result.kind === 'accepted') {
      expect(result.data.name).toBe('Jane Doe');
    }
  });
});
```

**Step 3: Verify RED**

Run: `cd apps/web; bunx vitest run src/server/contact`
Expected: FAIL — module missing.

**Step 4: Implement** — `schema.ts`:
```ts
import { z } from 'zod';

export const contactSchema = z.object({
  name: z.string().trim().min(1, 'Name required').max(100),
  email: z.email().max(200),
  message: z.string().trim().min(10, 'Message too short').max(5000),
  /** Honeypot: hidden field, must remain empty. Bots fill it. */
  company: z.literal('').optional(),
  turnstileToken: z.string().min(1),
});

export type ContactInput = z.infer<typeof contactSchema>;

export type ClassifiedContact =
  | { kind: 'accepted'; data: Omit<ContactInput, 'company' | 'turnstileToken'> }
  | { kind: 'rejected' }
  | { kind: 'silent_bot' };

export function classifyContactAttempt(result: z.SafeParseReturnType<unknown, ContactInput>): ClassifiedContact {
  if (!result.success) return { kind: 'rejected' };
  const { company, turnstileToken: _drop, ...data } = result.data;
  if (company) return { kind: 'silent_bot' };
  return { kind: 'accepted', data };
}
```

**Step 5: Verify GREEN**

Run: `cd apps/web; bunx vitest run src/server/contact`
Expected: PASS (8 tests).

**Step 6: Commit**

```bash
git add -A
git commit -m "feat(api): zod contact schema with honeypot classification"
```

---

### Task 14: Rate limiter (KV counter) + Turnstile verifier

**Files:**
- Create: `apps/web/src/server/contact/rate-limit.ts`
- Test: `apps/web/src/server/contact/rate-limit.test.ts`
- Create: `apps/web/src/server/contact/turnstile.ts`
- Test: `apps/web/src/server/contact/turnstile.test.ts`

**Step 1: Failing tests**

`rate-limit.test.ts`:
```ts
import { describe, expect, it } from 'vitest';
import { memoryRateLimiter } from './rate-limit';

describe('rate limiter', () => {
  it('allows requests up to the daily max then blocks', async () => {
    const limiter = memoryRateLimiter(2);
    expect(await limiter.allow('ip-a')).toBe(true);
    expect(await limiter.allow('ip-a')).toBe(true);
    expect(await limiter.allow('ip-a')).toBe(false);
  });
  it('tracks clients independently', async () => {
    const limiter = memoryRateLimiter(1);
    expect(await limiter.allow('ip-a')).toBe(true);
    expect(await limiter.allow('ip-b')).toBe(true);
  });
  it('kv-backed limiter counts and persists window', async () => {
    const store = new Map<string, string>();
    const kv = {
      get: async (k: string) => store.get(k) ?? null,
      put: async (k: string, v: string) => { store.set(k, v); },
    };
    const limiter = kvRateLimiter(kv, 86_400);
    expect(await limiter.allow('ip-x')).toBe(true);
    expect(store.get('rl:ip-x')).toBe('1');
    expect(await limiter.allow('ip-x')).toBe(true);
    expect(await limiter.allow('ip-x')).toBe(false);
  });
});
```

`turnstile.test.ts`:
```ts
import { describe, expect, it, vi } from 'vitest';
import { verifyTurnstile } from './turnstile';

const okResponse = () => new Response(JSON.stringify({ success: true }), { status: 200 });

describe('verifyTurnstile', () => {
  it('posts secret+token to siteverify and accepts success', async () => {
    const fetchImpl = vi.fn().mockResolvedValue(okResponse());
    expect(await verifyTurnstile('tok', '1.2.3.4', 'sec', fetchImpl)).toBe(true);
    const [url, init] = fetchImpl.mock.calls[0];
    expect(url).toContain('challenges.cloudflare.com/turnstile/v0/siteverify');
    expect(JSON.parse(init.body)).toMatchObject({ secret: 'sec', response: 'tok', remoteip: '1.2.3.4' });
  });
  it('rejects when cloudflare says failure', async () => {
    const fetchImpl = vi.fn().mockResolvedValue(new Response(JSON.stringify({ success: false }), { status: 200 }));
    expect(await verifyTurnstile('tok', null, 'sec', fetchImpl)).toBe(false);
  });
  it('fails closed on network errors', async () => {
    const fetchImpl = vi.fn().mockRejectedValue(new Error('offline'));
    expect(await verifyTurnstile('tok', null, 'sec', fetchImpl)).toBe(false);
  });
});
```

**Step 2: Verify RED**

Run: `cd apps/web; bunx vitest run src/server/contact/rate-limit src/server/contact/turnstile`
Expected: FAIL — modules missing.

**Step 3: Implement**

`rate-limit.ts`:
```ts
import type { KVLike } from '../types';

export interface RateLimiter {
  allow(clientKey: string): Promise<boolean>;
}

function kvCounterLimiter(kv: KVLike, ttlSeconds: number, max: number): RateLimiter {
  return {
    async allow(clientKey) {
      const key = `rl:${clientKey}`;
      const current = parseInt((await kv.get(key)) ?? '0', 10);
      if (current >= max) return false;
      const next = current + 1;
      // Fixed window: TTL anchored on first increment of the window.
      await kv.put(key, String(next), current === 0 ? { expirationTtl: ttlSeconds } : undefined);
      return next <= max;
    },
  };
}

/** Same algorithm against an in-memory store — used by tests and E2E mocks. */
export function memoryRateLimiter(max: number): RateLimiter & { counts: Map<string, number> } {
  const counts = new Map<string, number>();
  return {
    counts,
    async allow(clientKey) {
      const next = (counts.get(clientKey) ?? 0) + 1;
      counts.set(clientKey, next);
      return next <= max;
    },
  };
}

export const kvRateLimiter = kvCounterLimiter;
```
(Note: best-effort counter; races under burst are acceptable for a personal-site quota — documented tradeoff from design.)

`turnstile.ts`:
```ts
export type FetchImpl = typeof fetch;

export async function verifyTurnstile(
  token: string,
  ip: string | null,
  secret: string,
  fetchImpl: FetchImpl = fetch
): Promise<boolean> {
  try {
    const res = await fetchImpl('https://challenges.cloudflare.com/turnstile/v0/siteverify', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ secret, response: token, remoteip: ip ?? undefined }),
    });
    if (!res.ok) return false;
    const data = (await res.json()) as { success?: boolean };
    return data.success === true;
  } catch {
    return false; // fail closed
  }
}
```
Fix the rate-limit test import: add `import { kvRateLimiter, memoryRateLimiter } from './rate-limit';` (replace the single import).

**Step 4: Verify GREEN**

Run: `cd apps/web; bunx vitest run src/server/contact`
Expected: PASS (schema + limiter + turnstile).

**Step 5: Commit**

```bash
git add -A
git commit -m "feat(api): kv-backed fixed-window rate limiter and fail-closed turnstile verifier"
```

---

### Task 15: Email template (@portfolio/email) + Resend sender + wire POST /api/contact

**Files:**
- Modify: `packages/email/package.json`
- Create: `packages/email/src/templates/ContactNotification.tsx`
- Test: `packages/email/src/templates/ContactNotification.test.tsx`
- Create: `apps/web/src/server/contact/email.ts`
- Test: `apps/web/src/server/contact/email.test.ts`
- Modify: `apps/web/src/server/app.ts` (real contact handler)
- Modify: `apps/web/wrangler.jsonc` (KV binding)
- Modify: `apps/web/src/server/deps.ts` (production deps assembly)

**Step 1: Email package setup**

Run: `cd packages/email; bun add @react-email/components@latest resend@latest; bun add -d react@latest @types/react@latest vitest@latest`
Add to `packages/email/package.json`: `"test": "vitest run"`, and `exports` pointing at templates: `"./templates/*": "./src/templates/*.tsx"`.
Vitest JSX: create `packages/email/vitest.config.ts`:
```ts
import { defineConfig } from 'vitest/config';

export default defineConfig({
  esbuild: { jsx: 'automatic' },
  test: { environment: 'node', include: ['src/**/*.test.{ts,tsx}'] },
});
```

**Step 2: Failing template test** — `ContactNotification.test.tsx`:
```tsx
import { describe, expect, it } from 'vitest';
import { render } from '@react-email/components';
import { ContactNotification } from './ContactNotification';

describe('ContactNotification template', () => {
  it('renders sender name, reply address and message body', async () => {
    const html = await render(
      <ContactNotification
        name="Jane"
        email="jane@example.com"
        message="We need a landing page."
        receivedAt="2026-08-22T10:00:00Z"
      />
    );
    expect(html).toContain('Jane');
    expect(html).toContain('We need a landing page.');
    expect(html).toContain('Reply-to: jane@example.com');
  });
});
```

**Step 3: Verify RED**

Run: `cd packages/email; bunx vitest run`
Expected: FAIL — component missing.

**Step 4: Template** — `ContactNotification.tsx`:
```tsx
import { Container, Head, Html, Preview, Section, Text } from '@react-email/components';

export interface ContactNotificationProps {
  name: string;
  email: string;
  message: string;
  receivedAt: string;
}

export function ContactNotification({ name, email, message, receivedAt }: ContactNotificationProps) {
  return (
    <Html lang="en">
      <Head />
      <Preview>New portfolio message from {name}</Preview>
      <Container style={{ fontFamily: 'system-ui, sans-serif', padding: 24 }}>
        <Section style={{ borderRadius: 8, border: '1px solid #e4e4e7', padding: 24 }}>
          <Text style={{ margin: 0, fontSize: 12, color: '#52525b' }}>{receivedAt}</Text>
          <Text style={{ margin: '8px 0 0' }}>
            <strong>{name}</strong> wrote:
          </Text>
          <Text style={{ whiteSpace: 'pre-wrap' }}>{message}</Text>
          <Text style={{ color: '#52525b', fontSize: 12 }}>Reply-to: {email}</Text>
        </Section>
      </Container>
    </Html>
  );
}
```

**Step 5: Verify GREEN (template)**

Run: `cd packages/email; bunx vitest run`
Expected: PASS.

**Step 6: Failing sender test** — `apps/web/src/server/contact/email.test.ts`:
```ts
import { describe, expect, it, vi } from 'vitest';
import { makeSendContactEmail } from './email';

vi.mock('resend', () => ({
  Resend: class {
    constructor(private key: string) {
      // capture key for assertions below via closure on instance
      (makeSendContactEmail as any)._lastKey = key;
    }
    emails = {
      send: vi.fn(async (payload: unknown) => ({ error: null })),
    };
  },
}));
vi.mock('@portfolio/email/templates/ContactNotification', () => ({
  ContactNotification: () => null,
}));
vi.mock('@react-email/components', () => ({ render: async () => '<html>ok</html>' }));

describe('sendContactEmail', () => {
  it('sends via resend with replyTo=sender and returns success flag', async () => {
    const send = makeSendContactEmail('re_test_key');
    const result = await send({ name: 'Jane', email: 'jane@example.com', message: 'Hello there!' });
    expect(result.sent).toBe(true);
  });
});
```
Note: keep the mock shallow; the assertion that matters is the returned `{ sent }` contract and that Resend errors propagate as `{ sent:false }` — extend with one case mocking `send` to return `{ error: { message:'quota' } }` and expecting `{ sent:false }`.

**Step 7: Verify RED → implement → GREEN**

Run: `cd apps/web; bunx vitest run src/server/contact/email.test.ts` → FAIL (module missing).

`apps/web/src/server/contact/email.ts`:
```ts
import { render } from '@react-email/components';
import { Resend } from 'resend';
import { ContactNotification } from '@portfolio/email/templates/ContactNotification';

export interface SendResult {
  sent: boolean;
}

export function makeSendContactEmail(apiKey: string, opts?: { to?: string; from?: string }) {
  const resend = new Resend(apiKey);
  return async function sendContactEmail(input: {
    name: string;
    email: string;
    message: string;
  }): Promise<SendResult> {
    try {
      const html = await render(
        <ContactNotification
          name={input.name}
          email={input.email}
          message={input.message}
          receivedAt={new Date().toISOString()}
        />
      );
      const { error } = await resend.emails.send({
        from: opts?.from ?? 'Portfolio <onboarding@resend.dev>',
        to: opts?.to ?? 'diego@dagadev.tech', // TODO(Diego): confirm inbox; domain must be verified in Resend
        subject: `New portfolio message from ${input.name}`,
        html,
        replyTo: input.email,
      });
      return { sent: !error };
    } catch {
      return { sent: false };
    }
  };
}
```
TSX inside apps/web works because the React integration is configured; ensure `email.ts` is named `email.tsx`? — No: it contains JSX, so rename file to `apps/web/src/server/contact/email.tsx` and update imports/tests accordingly. Keep the test filename `email.test.tsx`.

Run again → PASS.

**Step 8: Real contact endpoint + production deps**

Replace the stub in `app.ts`:
```ts
app.post('/api/contact', async (c) => {
  const ip = c.req.header('cf-connecting-ip') ?? null;
  const raw = await c.req.json().catch(() => null);
  const classified = await deps.contact.parseBody(c.req.raw);

  if (classified.kind === 'rejected') {
    return c.json({ ok: false, error: 'invalid_input' }, 400);
  }
  if (classified.kind === 'silent_bot') {
    return c.json({ ok: true }); // lie to bots, do nothing
  }

  const token = (raw as { turnstileToken?: string } | null)?.turnstileToken;
  if (!(await deps.contact.verifyTurnstile(token, ip))) {
    return c.json({ ok: false, error: 'verification_failed' }, 403);
  }
  if (!(await deps.contact.rateLimit(ip))) {
    return c.json({ ok: false, error: 'rate_limited' }, 429);
  }
  try {
    await deps.contact.sendEmail(classified.data);
  } catch {
    return c.json({ ok: false, error: 'delivery_failed' }, 502);
  }
  return c.json({ ok: true });
});
```
Extend `parseBody` contract: it reads the Request internally (`contactSchema.safeParse(await req.clone().json())` + `classifyContactAttempt`), so adjust the earlier skeleton signature accordingly and update `app.test.ts` deps accordingly (parseBody receives `Request`).

Production assembly — `apps/web/src/server/deps.ts`:
```ts
import type { AppDeps } from './app';
import { kvRateLimiter, memoryRateLimiter } from './contact/rate-limit';
import { verifyTurnstile } from './contact/turnstile';
import { makeSendContactEmail } from './contact/email';
import type { KVLike, WorkerBindings } from './types';

const MAX_PER_DAY = 5;

/** Mock mode for Playwright E2E only — hard-disabled in production builds. */
const e2eMocks = import.meta.env.PUBLIC_E2E_MOCKS === '1' && !import.meta.env.PROD;

export function buildDeps(bindings: WorkerBindings): AppDeps {
  if (e2eMocks) {
    const limiter = memoryRateLimiter(MAX_PER_DAY);
    return {
      contact: {
        parseBody: defaultParseBody,
        verifyTurnstile: async () => true,
        rateLimit: async (ip) => limiter.allow(ip ?? 'anon'),
        sendEmail: async () => {},
      },
      activity: mockActivityDeps(),
    };
  }

  const kv = bindings.RATE_LIMIT_KV;
  const limiter = kv
    ? kvRateLimiter(kv as KVLike, 86_400, MAX_PER_DAY)
    : memoryRateLimiter(MAX_PER_DAY); // degraded-but-working if binding missing
  const apiKey = bindings.RESEND_API_KEY ?? '';
  const secret = bindings.TURNSTILE_SECRET_KEY ?? '';

  return {
    contact: {
      parseBody: defaultParseBody,
      verifyTurnstile: (token, ip) => verifyTurnstile(token ?? '', ip, secret),
      rateLimit: (ip) => limiter.allow(ip ?? 'anon'),
      sendEmail: async (input) => {
        const result = await makeSendContactEmail(apiKey)(input);
        if (!result.sent) throw new Error('email_delivery_failed');
      },
    },
    activity: buildActivityDeps(bindings), // Task 17
  };
}

async function defaultParseBody(request: Request) {
  const parsed = contactSchema.safeParse(await request.json().catch(() => null));
  return classifyContactAttempt(parsed);
}
```
(import `contactSchema`/`classifyContactAttempt` from `./contact/schema`; `mockActivityDeps` defined in Task 17.)

KV binding in `wrangler.jsonc` — ⚠️ MANUAL prerequisite:
```bash
cd apps/web; bunx wrangler kv namespace create RATE_LIMIT_KV
```
Expected output prints an `id`. Paste it here:
```jsonc
"kv_namespaces": [{ "binding": "RATE_LIMIT_KV", "id": "<paste-id>" }]
```

Client form island — `apps/web/src/components/islands/ContactForm.tsx` (the v2 unawaited-promise bug dies here: explicit await + honest states):
```tsx
import { useState } from 'react';

type Status = 'idle' | 'sending' | 'sent' | 'error';

export default function ContactForm() {
  const [status, setStatus] = useState<Status>('idle');

  async function handleSubmit(e: SubmitEvent) {
    e.preventDefault();                       // v2 bug fix: actually intercept submit
    const form = e.currentTarget as HTMLFormElement;
    setStatus('sending');
    try {
      const payload = Object.fromEntries(new FormData(form).entries());
      const res = await fetch('/api/contact', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({
          name: payload.name,
          email: payload.email,
          message: payload.message,
          company: payload.company,           // honeypot passthrough
          turnstileToken: import.meta.env.PUBLIC_E2E_MOCKS === '1' ? 'e2e' : (window as any).turnstile?.getResponse?.() ?? payload['cf-turnstile-response'] ?? '',
        }),
      });
      const body = await res.json().catch(() => ({}));
      setStatus(res.ok && body.ok ? 'sent' : 'error');
      if (res.ok && body.ok) form.reset();
    } catch {
      setStatus('error');                     // v2 bug fix: failures are shown, never faked
    }
  }

  return (
    <form onSubmit={handleSubmit}>
      {/* honeypot — visually hidden */}
      <input name="company" tabIndex={-1} autoComplete="off" aria-hidden="true"
             className="absolute -left-[9999px] h-0 w-0 opacity-0" />
      <input name="name" required placeholder="Your name" className="..." />
      <input name="email" type="email" required placeholder="you@example.com" className="..." />
      <textarea name="message" required minLength={10} placeholder="What can I help you with?" className="..." />
      {import.meta.env.PUBLIC_E2E_MOCKS !== '1' && (
        <div className="cf-turnstile" data-sitekey={import.meta.env.PUBLIC_TURNSTILE_SITE_KEY} />
      )}
      <button type="submit" disabled={status === 'sending'}>
        {status === 'sending' ? 'Sending…' : 'Send message'}
      </button>
      {status === 'sent' && <p role="status">Message sent — I will reply soon.</p>}
      {status === 'error' && <p role="alert">Something went wrong. Try again or reach me on LinkedIn.</p>}
    </form>
  );
}
```
Mount in `ContactSection.astro`: `<ContactForm client:visible />` plus the Turnstile script tag (`https://challenges.cloudflare.com/turnstile/v0/api.js` deferred) when not in E2E mock mode.

Verify: `bunx vitest run` (all suites green) + `bun run dev` manual happy path with `PUBLIC_E2E_MOCKS=1` (form shows success).

**Step 9: Commit**

```bash
git add -A
git commit -m "feat(api): complete contact pipeline - validation, honeypot, turnstile, rate limit, resend delivery"
git commit -am "feat(web): honest-state contact form island replacing client-side email approach"
```
(Or a single commit including form + API if done together — keep tests with code either way.)

---

### Task 16: Activity mapper + GraphQL fetch with stale/fallback semantics

**Files:**
- Create: `apps/web/src/server/activity/mapper.ts`
- Test: `apps/web/src/server/activity/mapper.test.ts`
- Create: `apps/web/src/server/activity/store.ts`
- Test: `apps/web/src/server/activity/store.test.ts`

**Step 1: Failing mapper test** — `mapper.test.ts`:
```ts
import { describe, expect, it } from 'vitest';
import { emptyGrid, levelForCount, mapContributionsResponse } from './mapper';

const sample = {
  data: {
    viewer: {
      contributionsCollection: {
        totalContributions: 42,
        contributionCalendar: {
          weeks: [
            { contributionDays: [{ date: '2026-08-20', contributionCount: 9 }] },
            { contributionDays: [{ date: '2026-08-21', contributionCount: 0 }, { date: '2026-08-22', contributionCount: 14 }] },
          ],
        },
      },
    },
  },
};

describe('activity mapper', () => {
  it('maps calendar to grid with levels', () => {
    const grid = mapContributionsResponse(sample);
    expect(grid.totalContributions).toBe(42);
    expect(grid.weeks[0].days[0]).toEqual({ date: '2026-08-20', count: 9, level: 3 });
    expect(grid.weeks[1].days[0].level).toBe(0);
    expect(grid.weeks[1].days[1].level).toBe(4);
  });
  it('buckets counts correctly', () => {
    expect(levelForCount(0)).toBe(0);
    expect(levelForCount(3)).toBe(1);
    expect(levelForCount(5)).toBe(2);
    expect(levelForCount(11)).toBe(3);
    expect(levelForCount(20)).toBe(4);
  });
  it('emptyGrid is safe to render', () => {
    expect(emptyGrid()).toEqual({ totalContributions: 0, weeks: [] });
  });
});
```

**Step 2: Verify RED** → `bunx vitest run src/server/activity/mapper` → FAIL.

**Step 3: Implement** — `mapper.ts`:
```ts
import type { ActivityGrid } from '../app';

export function levelForCount(count: number): 0 | 1 | 2 | 3 | 4 {
  if (count <= 0) return 0;
  if (count <= 3) return 1;
  if (count <= 7) return 2;
  if (count <= 12) return 3;
  return 4;
}

interface GraphQLResponse {
  data?: {
    viewer?: {
      contributionsCollection?: {
        totalContributions?: number;
        contributionCalendar?: {
          weeks?: Array<{
            contributionDays?: Array<{ date: string; contributionCount: number }>;
          }>;
        };
      };
    };
  };
}

export function mapContributionsResponse(payload: unknown): ActivityGrid {
  const p = payload as GraphQLResponse;
  const cal = p.data?.viewer?.contributionsCollection?.contributionCalendar;
  return {
    totalContributions: p.data?.viewer?.contributionsCollection?.totalContributions ?? 0,
    weeks: (cal?.weeks ?? []).map((week) => ({
      days: (week.contributionDays ?? []).map((day) => ({
        date: day.date,
        count: day.contributionCount,
        level: levelForCount(day.contributionCount),
      })),
    })),
  };
}

export function emptyGrid(): ActivityGrid {
  return { totalContributions: 0, weeks: [] };
}
```

**Step 4: Failing store test** — freshness/stale/fallback order:
```ts
import { describe, expect, it } from 'vitest';
import { getActivityWithFallback } from './store';

describe('getActivityWithFallback', () => {
  const fresh = { totalContributions: 5, weeks: [] };
  const stale = { totalContributions: 99, weeks: [] };

  it('prefers fresh upstream and refreshes cache', async () => {
    let cached: object | undefined;
    const result = await getActivityWithFallback({
      fetchFresh: async () => fresh,
      readCache: async () => stale,
      writeCache: async (g) => { cached = g; },
    });
    expect(result.grid).toEqual(fresh);
    expect(result.source).toBe('fresh');
    expect(cached).toEqual(fresh);
  });
  it('on upstream failure serves stale cache', async () => {
    const result = await getActivityWithFallback({
      fetchFresh: async () => { throw new Error('github down'); },
      readCache: async () => stale,
      writeCache: async () => {},
    });
    expect(result.grid).toEqual(stale);
    expect(result.source).toBe('stale');
  });
  it('when both fail serves empty grid, never throws', async () => {
    const result = await getActivityWithFallback({
      fetchFresh: async () => { throw new Error('down'); },
      readCache: async () => undefined,
      writeCache: async () => {},
    });
    expect(result.grid).toEqual({ totalContributions: 0, weeks: [] });
    expect(result.source).toBe('fallback');
  });
});
```

**Step 5: Verify RED → implement → GREEN**

`store.ts`:
```ts
import { emptyGrid, mapContributionsResponse } from './mapper';
import type { ActivityGrid } from '../app';

export interface ActivityStoreHooks {
  fetchFresh(): Promise<unknown>; // raw GraphQL payload
  readCache(): Promise<ActivityGrid | undefined>;
  writeCache(grid: ActivityGrid): Promise<void>;
}

export type ActivitySource = 'fresh' | 'stale' | 'fallback';

export async function getActivityWithFallback(
  hooks: ActivityStoreHooks
): Promise<{ grid: ActivityGrid; source: ActivitySource }> {
  try {
    const grid = mapContributionsResponse(await hooks.fetchFresh());
    await hooks.writeCache(grid).catch(() => {}); // cache write is best-effort
    return { grid, source: 'fresh' };
  } catch {
    const stale = await hooks.readCache().catch(() => undefined);
    if (stale) return { grid: stale, source: 'stale' };
    return { grid: emptyGrid(), source: 'fallback' };
  }
}

const QUERY = /* GraphQL */ `
  query {
    viewer {
      contributionsCollection {
        totalContributions
        contributionCalendar {
          weeks {
            contributionDays {
              date
              contributionCount
            }
          }
        }
      }
    }
  }
`;

export async function fetchGitHubActivity(githubToken: string, fetchImpl: typeof fetch = fetch) {
  const res = await fetchImpl('https://api.github.com/graphql', {
    method: 'POST',
    headers: {
      authorization: `Bearer ${githubToken}`,
      'content-type': 'application/json',
    },
    body: JSON.stringify({ query: QUERY }),
  });
  if (!res.ok) throw new Error(`github_graphql_${res.status}`);
  return res.json();
}
```

Wire `buildActivityDeps(bindings)` in `deps.ts`:
```ts
import { caches } from 'cloudflare:workers'; // adapter shims this outside workerd too

export function buildActivityDeps(bindings: WorkerBindings): ActivityDeps {
  const cache = caches.default;
  const cacheReq = new Request('https://dagadev.tech/__cache/activity-grid.json');
  return {
    async readCache() {
      const hit = await cache.match(cacheReq);
      if (!hit) return undefined;
      return (await hit.json()) as ActivityGrid;
    },
    async writeCache(grid) {
      await cache.put(cacheReq, new Response(JSON.stringify(grid), {
        headers: { 'content-type': 'application/json', 'cache-control': 'public, max-age=3600' },
      }));
    },
    fetchActivity: async () => {
      const token = bindings.GITHUB_TOKEN ?? '';
      if (!token) throw new Error('missing_github_token');
      return fetchGitHubActivity(token);
    },
  };
}
```
And in `app.ts` replace the activity stub:
```ts
app.get('/api/activity', async (c) => {
  const { grid, source } = await deps.activity.run();
  return c.json({ ok: true, cached: source !== 'fresh', data: grid });
});
```
Adjust `ActivityDeps` to expose a composed `run()` built in `deps.ts` from `fetchActivity/readCache/writeCache` via `getActivityWithFallback` — keep the three hooks in `AppDeps` for tests and compose:
```ts
activity: {
  ...hooksDeps,
  run: () => getActivityWithFallback(hooksDeps),
},
```
Update `app.test.ts` to provide `run` (or derive it automatically in `createApp` — prefer deriving inside `createApp` from the three hooks so tests stay hook-based).

Verify: `bunx vitest run` all green; `bun run dev` with a real `GITHUB_TOKEN` in `.env` (⚠️ MANUAL: create a fine-grained token with `user:read`) → `curl http://localhost:4321/api/activity` returns `{ok:true,...}`.

**Step 6: Commit**

```bash
git add -A
git commit -m "feat(api): github activity endpoint with edge caching and stale/empty fallback chain"
```

---

### Task 17: Contribution grid UI (grim-style) fed by /api/activity

**Files:**
- Create: `apps/web/src/components/islands/ContributionGrid.tsx`
- Modify: `apps/web/src/components/sections/` (new `Activity.astro` section on home)

Island fetches `/api/activity` on mount, renders weeks×days cells colored by `level` using the electric-blue accent ramp (`--color-accent` family), shows graceful empty state on `fallback`. Skeleton while loading; total count caption. Reduced-motion irrelevant (static grid). Visual verification only per design testing scope.

Commit:
```bash
git add -A
git commit -m "feat(web): contribution grid island with level-ramp styling and empty-state fallback"
```

---

## Milestone 5 — CI/CD

### Task 18: PR checks workflow

**Files:**
- Create: `.github/workflows/ci.yml`
- Create: `.nvmrc`? — No: bun-only. Skip.

`.github/workflows/ci.yml`:
```yaml
name: CI

on:
  pull_request:
  push:
    branches: [main]

jobs:
  checks:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: oven-sh/setup-bun@v2
        with:
          bun-version-file: .bun-version
      - run: bun install --frozen-lockfile
      - run: bunx turbo lint typecheck test build
```

⚠️ MANUAL: none (this workflow needs no secrets).

Verify: push branch, open draft PR → workflow runs green. (If `astro check` fails on missing `.astro/types`, run `bunx astro sync` before `turbo` in CI: add `- run: cd apps/web && bunx astro sync` — only if needed.)

Commit:
```bash
git add -A
git commit -m "ci: pr and main checks via turbo pipeline on bun"
```

---

### Task 19: Deploy workflow + secrets checklist

**Files:**
- Create: `.github/workflows/deploy.yml`

`.github/workflows/deploy.yml`:
```yaml
name: Deploy

on:
  push:
    branches: [main]

jobs:
  deploy:
    runs-on: ubuntu-latest
    environment: production   # GH Environment holding the secrets below
    steps:
      - uses: actions/checkout@v4
      - uses: oven-sh/setup-bun@v2
        with:
          bun-version-file: .bun-version
      - run: bun install --frozen-lockfile
      - run: bunx turbo lint typecheck test build
        env:
          PUBLIC_TURNSTILE_SITE_KEY: ${{ vars.PUBLIC_TURNSTILE_SITE_KEY }}
          PUBLIC_KEYSTATIC_GITHUB_APP_SLUG: ${{ vars.PUBLIC_KEYSTATIC_GITHUB_APP_SLUG }}
      - uses: cloudflare/wrangler-action@v3
        with:
          apiToken: ${{ secrets.CLOUDFLARE_API_TOKEN }}
          accountId: ${{ secrets.CLOUDFLARE_ACCOUNT_ID }}
          workingDirectory: apps/web
          command: deploy
          secrets: |
            RESEND_API_KEY
            TURNSTILE_SECRET_KEY
            GITHUB_TOKEN
            KEYSTATIC_GITHUB_CLIENT_ID
            KEYSTATIC_GITHUB_CLIENT_SECRET
            KEYSTATIC_SECRET
```

⚠️ MANUAL checklist (do once, in order):

1. **Cloudflare**: create API token with "Edit Cloudflare Workers" template; note Account ID. Set GH secrets `CLOUDFLARE_API_TOKEN`, `CLOUDFLARE_ACCOUNT_ID`; create GH Environment `production`.
2. **KV**: `cd apps/web; bunx wrangler kv namespace create RATE_LIMIT_KV` → paste id into `wrangler.jsonc` (done in Task 15).
3. **Resend**: create account, verify `dagadev.tech` domain (DKIM records), then `bunx wrangler secret put RESEND_API_KEY` (run from `apps/web`, target the Worker `web-portfolio-v3`). Update sender address in `email.tsx` to a verified domain sender.
4. **Turnstile**: create widget for `dagadev.tech` (+`localhost`) → secret via `wrangler secret put TURNSTILE_SECRET_KEY`; sitekey goes to GH **variable** `PUBLIC_TURNSTILE_SITE_KEY` (it's baked at build time).
5. **GitHub token**: fine-grained PAT with `user:read` (contributions) → `wrangler secret put GITHUB_TOKEN`.
6. **Keystatic OAuth**: create GitHub OAuth App — callback `https://dagadev.tech/api/keystatic/login`, homepage repo URL. Client ID → `wrangler secret put KEYSTATIC_GITHUB_CLIENT_ID`; secret → `KEYSTATIC_GITHUB_CLIENT_SECRET`; session key → `openssl rand -hex 32` → `KEYSTATIC_SECRET`. Optional GitHub **App** slug → variable `PUBLIC_KEYSTATIC_GITHUB_APP_SLUG`.
7. Repeat each `wrangler secret put` also locally in `.env` for dev parity (never committed).

Verify: merge a docs-only PR to main → deploy job green → worker reachable at `web-portfolio-v3.<account>.workers.dev` showing the site.

Commit:
```bash
git add -A
git commit -m "ci: main-branch deploy to cloudflare workers via wrangler-action with gh environment secrets"
```

---

## Milestone 6 — Content migration from v2

### Task 20: Port real content data (experience/projects/skills/socials/about)

**Files:**
- Modify: `apps/web/src/data/site.ts`
- Create: `apps/web/public/cv.pdf` (⚠️ MANUAL asset from Diego)

⚠️ MANUAL prerequisite: clone/access to the v2 repo. Source of record: `web-portfolio-v2/src/data/seedData.ts` (design says this file is well-shaped — port its structure verbatim, then apply the design-doc refreshes).

Steps:
1. Copy prior experience entries (roles before Wazuh) from v2 `seedData.ts` into `experience`, keeping the current Wazuh entry first: *"Wazuh — Full-Stack Engineer — building the Wazuh AI Assistant"*.
2. Replace project placeholders with real NatGPT and Notewave entries (description, stack, URLs from v2).
3. Fill `skills` groups from v2, refreshed to current stack.
4. Refresh `aboutText` — v2 said "one year of experience"; stale. Use the Wazuh AI Assistant framing from the design doc.
5. Socials already correct (GH Ripdiegozz, LinkedIn dagadev) — add CV link `{ label: 'CV', href: '/cv.pdf' }`.
6. Update `BaseLayout` meta description to refreshed about text; add static OG tags (`og:title`, `og:description`, `og:image=/og-default.png`). ⚠️ MANUAL: drop a 1200×630 `apps/web/public/og-default.png`. NO signed/dynamic OG URLs (v2 debt).

Verification: visual pass on `/` in both themes; `bunx astro build` clean.

Commit:
```bash
git add -A
git commit -m "content: migrate v2 experience, projects, skills and socials with refreshed about copy"
```

---

## Milestone 7 — E2E smoke + DNS cutover

### Task 21: Playwright smoke suite (contact happy path + blog render)

**Files:**
- Create: `apps/web/playwright.config.ts`
- Create: `apps/web/tests/e2e/smoke.spec.ts`
- Modify: `apps/web/package.json` (`"test:e2e": "playwright test"`)

**Step 1: Install**

Run: `cd apps/web; bun add -d @playwright/test@latest; bunx playwright install chromium`

**Step 2: Config** — `playwright.config.ts`:
```ts
import { defineConfig } from '@playwright/test';

export default defineConfig({
  testDir: './tests/e2e',
  timeout: 30_000,
  use: { baseURL: 'http://localhost:4321' },
  webServer: {
    command: 'bun run dev',
    url: 'http://localhost:4321',
    reuseExistingServer: !process.env.CI,
    timeout: 120_000,
    env: {
      E2E_MOCKS: '1',
      PUBLIC_E2E_MOCKS: '1',
      KEYSTATIC_DEV_LOCAL: '1',
    },
  },
});
```

**Step 3: Specs** — `tests/e2e/smoke.spec.ts`:
```ts
import { expect, test } from '@playwright/test';

test('blog post renders end to end', async ({ page }) => {
  await page.goto('/blog/');
  await page.getByRole('link').filter({ hasText: 'Hello, world' }).click();
  await expect(page.getByRole('heading', { level: 1 })).toHaveText(/Hello, world/i);
});

test('contact happy path with mocked externals', async ({ page }) => {
  await page.goto('/');
  const form = page.locator('form');
  await form.getByLabel(/name/i).fill('E2E Bot');
  await form.getByLabel(/email/i).fill('e2e@example.com');
  await form.getByLabel(/message|what/i).fill('Hello from the smoke suite.');
  await form.getByRole('button', { name: /send/i }).click();
  await expect(page.getByRole('status')).toContainText(/sent/i);
});
```
(Mock wiring: `PUBLIC_E2E_MOCKS=1` hides the Turnstile widget client-side and sends token `'e2e'`; `E2E_MOCKS=1` makes the server accept it and skip Resend/KV — see Task 15 `deps.ts`. The guard `&& !import.meta.env.PROD` makes it impossible in production builds.)

**Step 4: Run**

Run: `cd apps/web; bunx playwright test`
Expected: 2 passed. Then confirm prod safety: `PUBLIC_E2E_MOCKS=1 bunx astro build` still produces a form WITH the Turnstile widget (guard is dev-only).

**Step 5: Commit**

```bash
git add -A
git commit -m "test(e2e): playwright smoke covering contact happy path and blog rendering"
```

---

### Task 22: ⚠️ MANUAL — DNS cutover dagadev.tech (LAST STEP, Diego only)

Do NOT touch DNS until Milestones 0–6 are validated on the workers.dev preview URL.

Checklist:
1. Validate `https://web-portfolio-v3.<account>.workers.dev`: home, blog, post page, RSS, sitemap, contact form real send (verified Resend domain), admin login + test post publishing to GitHub `main`, activity grid live.
2. In Cloudflare dashboard: add custom domain `dagadev.tech` to the Worker (`Workers & Pages → web-portfolio-v3 → Settings → Domains & Routes`).
3. At the domain's DNS provider: remove Vercel records (`A 76.76.21.21`, `CNAME cname.vercel-dns.com`) and point apex to Cloudflare per the custom-domain prompt (Cloudflare manages it once the zone is on CF).
4. Wait for propagation; verify HTTPS cert issued.
5. Keep v2 (Vercel deployment) intact for rollback until step 6.
6. Final: browse `https://dagadev.tech`, confirm v3; archive/pause the Vercel project.
Rollback: re-add Vercel DNS records — v2 was never deleted.

No code changes; commit nothing. Record completion date in the design doc's Migration Plan section.

---

## Dependency graph (execution order)

```
M0: T1 → T2 → T3(spike, gates M3)
M1: T4 → T5 → T6
M2: T7 → T8
M3: T9 → T10 → T11          (requires T3)
M4: T12 → T13 → T14 → T15 → T16 → T17
M5: T18 → T19               (needs deployable app; can start after T15)
M6: T20                     (needs T7 sections)
M7: T21 → T22(manual last)
```

Parallelizable after M0: (M1,M2,M3) vs (M4 core T12–T14). T17 needs T16 + T7.
