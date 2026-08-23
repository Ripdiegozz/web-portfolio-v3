# Portfolio v3 — Design Document

**Date:** 2026-08-22 · **Status:** Approved by user (blocks 1–3) · **Replaces:** web-portfolio-v2 (dagadev.net, static Astro on Vercel)

## Goals

Full-stack rewrite of Diego's portfolio to:

1. Host a personal blog (Markdown articles written through a CMS UI, no manual image commits).
2. Send contact emails server-side (v2 used client-side EmailJS: public keys in bundle, no rate limiting, burnable quota).
3. Deliver an "alive" visual experience — reactive animated backgrounds, motion micro-interactions — explicitly NOT a generic shadcn-style portfolio.
4. Surface GitHub activity (contribution grid).

Non-goals (v1): comments system (backend stays stateless), light/dark per-page overrides beyond standard toggle, i18n, analytics.

## Stack (latest stable at scaffold time — install with @latest, lockfile pins exact)

| Layer | Choice | Verified version |
| --- | --- | --- |
| Framework | Astro | 7.2.4 |
| SSR adapter | @astrojs/cloudflare | 14.2.3 |
| React islands | react / react-dom + @astrojs/react | 19.2.8 / 6.0.4 |
| API | Hono (mounted inside Astro) | 4.13.3 |
| Styling | Tailwind CSS v4 (CSS-first `@theme`) | 4.3.3 |
| Animation | motion (Framer Motion successor) | 13.1.1 |
| WebGL background | three + @react-three/fiber (+ ThreeUI Community components as reference/parts) | 0.185.1 / 9.7.0 |
| CMS | Keystatic (@keystatic/core, GitHub storage mode) | 0.6.8 |
| Email | Resend + @react-email/components | 6.22.0 / 1.0.12 |
| Monorepo | Turborepo + bun workspaces | turbo 2.10.11, bun 1.4.0 (pinned via .bun-version) |
| Language | TypeScript (strict) | 7.0.2 |

Risk note: Keystatic is still 0.x. Its official Astro integration was verified against current docs (including Cloudflare Workers env bindings via `context.locals.runtime.env`), but an admin smoke test is mandatory in milestone 1 before building on it.

## Architecture

Single Cloudflare Worker. Hybrid rendering:

```
web-portfolio-v3/
├── apps/web/
│   ├── astro.config.mjs          # output: 'static' + cloudflare adapter, site=dagadev.net
│   ├── wrangler.jsonc            # recent compat date, static assets binding
│   └── src/
│       ├── pages/                # public pages prerendered at build
│       │   ├── api/[[route]].ts          # Hono app (prerender = false)
│       │   ├── api/keystatic/[...params].ts
│       │   ├── admin/[...params].astro   # <Admin client:load /> (prerender = false)
│       │   ├── index.astro               # one-pager
│       │   ├── blog/index.astro
│       │   └── blog/[slug].astro
│       └── content/posts/*.md    # Keystatic-managed articles
├── packages/ui/                  # shared React design system + ThreeUI/motion wrappers
├── packages/email/               # React Email templates
└── packages/config/              # shared tsconfig/eslint/prettier
```

- Everything public is prerendered static HTML served from the edge.
- Only `/api/*` and `/admin/*` opt out (`export const prerender = false`) and run SSR in the Worker.
- Hono mounts via a single catch-all route exporting its `fetch` handler. Same-origin only — no CORS surface.
- Type-safe client calls from islands via Hono RPC (`hc`) where useful.

## Design System

### Theming

- **Both themes, system-default**: initial theme from `prefers-color-scheme`; manual toggle persists override in `localStorage`. Inline pre-hydration script prevents FOUC (pattern ported from v2).
- Tokens defined once in `packages/ui` using Tailwind v4 `@theme`, duplicated per theme (light/dark CSS variable sets). No tailwind.config.mjs.

### Typography

Self-hosted via Fontsource (no external font CDNs — fixes v2 smell):

| Role | Family |
| --- | --- |
| Display / headings | Distinctive grotesque |
| Highlighted words | `"Instrument Serif", "Times New Roman", Times, serif` (italic accent style) |
| Technical details / code | Monospace |

### Motion policy (the "alive" layer, with guardrails)

- `motion` for micro-interactions, scroll reveals, page transitions.
- Shader/reactive background (ThreeUI/R3F) ONLY as ambient hero layer:
  - lazy-loaded, outside critical path;
  - paused when not visible;
  - fully disabled under `prefers-reduced-motion`.
- GitHub contribution grid component styled after the user's grim-style reference (dark surfaces, single saturated electric-blue accent).

## Blog (Keystatic)

- Storage: `kind: 'github'` → posts commit as `.md` into `content/posts/`; images upload through the admin UI and are committed automatically by Keystatic via GitHub API.
- Auth: GitHub OAuth App — only Diego. Secrets read natively from Workers bindings.
- Collection `posts`: title, slug (auto), description, pubDate, updatedDate, draft flag, heroImage (`image` field), tags.
- Zod schema mirrored between `keystatic.config.ts` and Astro Content Layer collection; drafts filtered out of production builds.
- Publishing flow: write in admin → Keystatic pushes to `main` → CI deploys → live in ~2 min.
- RSS feed + sitemap included from day one.
- Default static OG image for v1 (per-post generated OG images deferred).

## API (Hono)

### POST /api/contact

1. Zod body validation (name, email, message + honeypot field).
2. Cloudflare Turnstile server-side verification.
3. Rate limit: KV counter per IP (e.g., 5/day).
4. Send via Resend using template from `packages/email`; `replyTo` = sender.
5. Response always structured JSON; client shows honest success/error states (v2 bug — toast shown even on failure due to unreturned promise — must die here).

### GET /api/activity

1. GitHub GraphQL `contributionsCollection` with `GITHUB_TOKEN`.
2. Edge cache ~1h (Workers Cache API).
3. On upstream failure: serve stale cache; else empty-grid fallback. Never breaks the page.

### Errors

Centralized `app.onError` → structured JSON, no internal detail leaks.

## Secrets

Via `wrangler secret put` / GH Environments:

- Server-only: `RESEND_API_KEY`, `TURNSTILE_SECRET_KEY`, `GITHUB_TOKEN`, `KEYSTATIC_GITHUB_CLIENT_ID`, `KEYSTATIC_GITHUB_CLIENT_SECRET`, `KEYSTATIC_SECRET`
- Public: `TURNSTILE_SITE_KEY`, `PUBLIC_KEYSTATIC_GITHUB_APP_SLUG`

## CI/CD (GitHub Actions)

- PRs: `bun install --frozen-lockfile` → `turbo lint typecheck test build`.
- Push to `main`: same checks → `wrangler deploy` (cloudflare/wrangler-action), secrets from GH Environments.
- Keystatic commits to `main` trigger the same pipeline automatically.

## Testing

Strict TDD mode active for implementation. Vitest unit coverage: validation schemas, email template rendering, activity mapper/fallback logic, rate limiter. Minimal Playwright smoke E2E: contact form happy path (Turnstile/Resend mocked) + blog post renders.

## Migration Plan

1. Scaffold monorepo + CI skeleton.
2. Port content: experience data model from v2 `seedData.ts` (well-shaped, keep), projects NatGPT/Notewave, refreshed skills/about (v2 said "one year of experience" — stale; current: Wazuh Full-Stack Engineer building Wazuh AI Assistant), socials (GH Ripdiegozz, LinkedIn dagadev, CV PDF).
3. Build UI sections, blog, API.
4. Validate on CF Workers preview URL.
5. DNS cutover `dagadev.net`: Vercel → Cloudflare LAST; v2 stays live until v3 validated.

## Known v2 debts consciously fixed here

Client-side email keys · success-toast-on-failure bug · unpinned CDN scripts (ScrollReveal) · Google Fonts CDN dependency · dead duplicate sendEmail module · stale about text/meta keywords · signed og:image URL leaked in source · typo'd font-family.
