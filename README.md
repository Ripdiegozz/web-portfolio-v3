# web-portfolio-v3

> Modern, full-stack personal portfolio and blog for [Diego García (dagadev.net)](https://dagadev.net). Built with Astro, Cloudflare Workers, Hono, React 19, Tailwind CSS v4, and Keystatic CMS.

---

## ✨ Features

- ⚡ **Hybrid Rendering**: Static-first edge delivery with Astro 7 + `@astrojs/cloudflare`, backed by SSR Cloudflare Workers routes for dynamic APIs.
- 🌐 **Full Internationalization (i18n)**: Seamless English (`/`) and Spanish (`/es/`) switching with hash preservation across sections and articles.
- 🎨 **Adaptive Design & Theming**: Dark/Light mode with FOUC-safe pre-hydration, Tailwind CSS v4 design tokens, and smooth circular ripple View Transitions.
- ✍️ **Integrated Blog & Keystatic CMS**: Markdown content layer powered by Keystatic (GitHub mode), syntax highlighting with Shiki, reading time estimates, table of contents, and RSS/Sitemap generation.
- 📬 **Server-side Contact API**: Powered by Hono with Zod schema validation, Cloudflare Turnstile bot verification, IP rate limiting, and Resend email delivery via React Email templates.
- 📊 **Dynamic GitHub Contribution Grid**: Fetches and renders live GitHub activity with KV caching and fallback resilience.
- 🌌 **Interactive Ambient Background**: Lightweight Three.js / R3F shader background with `prefers-reduced-motion` compliance.

---

## 🏗️ Monorepo Structure

Managed with [Turborepo](https://turbo.build/) and [Bun Workspaces](https://bun.sh/docs/install/workspaces):

```text
web-portfolio-v3/
├── apps/
│   └── web/                   # Main Astro + Hono web application
│       ├── src/
│       │   ├── components/    # Astro & React UI components / islands
│       │   ├── content/       # Keystatic markdown posts & content schemas
│       │   ├── i18n/          # Locales (EN/ES), dictionary types, and helpers
│       │   ├── layouts/       # BaseLayout, SEO, JSON-LD, Navigation & Header
│       │   ├── pages/         # Prerendered routes + /api & /admin endpoints
│       │   ├── server/        # Hono router, contact handler, and activity services
│       │   └── styles/        # Global CSS & Tailwind v4 theme configuration
│       └── wrangler.jsonc     # Cloudflare Worker configuration & KV bindings
├── packages/
│   ├── config/                # Shared TypeScript & ESLint configurations
│   ├── email/                 # React Email templates & email notification types
│   └── ui/                    # Shared UI tokens, motion hooks, & Three.js background
├── docs/                      # Architecture plans & implementation specs
└── package.json               # Root workspace scripts & dependencies
```

---

## 🛠️ Tech Stack

| Layer | Technology |
|---|---|
| **Runtime & Monorepo** | [Bun](https://bun.sh/) (1.4+) & [Turborepo](https://turbo.build/) |
| **Framework** | [Astro 7](https://astro.build/) |
| **Deployment / Edge** | [Cloudflare Workers](https://workers.cloudflare.com/) (`@astrojs/cloudflare`) |
| **API Layer** | [Hono](https://hono.dev/) |
| **UI & Islands** | [React 19](https://react.dev/) |
| **Styling** | [Tailwind CSS v4](https://tailwindcss.com/) (CSS-first `@theme`) |
| **Animation & WebGL** | [Motion](https://motion.dev/) & [Three.js](https://threejs.org/) / `@react-three/fiber` |
| **Content Management** | [Keystatic](https://keystatic.com/) (`@keystatic/core`, GitHub mode) |
| **Email System** | [Resend](https://resend.com/) & [React Email](https://react.email/) |
| **Testing** | [Vitest](https://vitest.dev/) & [Playwright](https://playwright.dev/) |

---

## 🚀 Getting Started

### Prerequisites

- [Bun](https://bun.sh/) (`>= 1.4.0`)
- [Node.js](https://nodejs.org/) (`>= 22.0.0`)
- Cloudflare account with Workers & KV access (for deployments)

### 1. Clone & Install Dependencies

```bash
git clone https://github.com/Ripdiegozz/web-portfolio-v3.git
cd web-portfolio-v3
bun install
```

### 2. Environment Variables

Create `.dev.vars` inside `apps/web/` (for Wrangler / Cloudflare Worker local secrets):

```env
# Contact Form & Resend
RESEND_API_KEY=re_xxxxxxxxx
CONTACT_EMAIL_TO=your-email@domain.com
CONTACT_EMAIL_FROM="Portfolio <onboarding@resend.dev>"

# Cloudflare Turnstile
TURNSTILE_SECRET_KEY=0x4AAAAAAxxxxxxxxxxxxxxxxxxxxxx

# GitHub Activity
GITHUB_TOKEN=ghp_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxx

# Keystatic GitHub Storage Mode (Optional for local testing)
KEYSTATIC_GITHUB_CLIENT_ID=
KEYSTATIC_GITHUB_CLIENT_SECRET=
KEYSTATIC_SECRET=
```

---

## 📜 Available Scripts

Run these scripts from the repository root:

| Command | Description |
|---|---|
| `bun run dev` | Starts the Astro development server via Turborepo |
| `bun run build` | Builds the static pages and Cloudflare Worker bundle |
| `bun run test` | Runs the Vitest test suite across all workspace packages |
| `bun run typecheck` | Runs TypeScript checks (`tsc --noEmit`) and `astro check` |
| `bun run lint` | Lints the codebase with ESLint |
| `bun run preview` | Runs Cloudflare Worker preview with Wrangler (`wrangler dev`) |

---

## 🧪 Testing & Quality

- **Unit & Integration**: Vitest tests covering i18n routing, contact validation/rate-limiting/turnstile, blog utilities, and contribution grid components.
- **Strict Typing**: TypeScript `strict: true` across all packages and Astro components.
- **Linting**: ESLint with unified flat config.

```bash
# Run all verification checks
bun run lint
bun run typecheck
bun run test
```

---

## 📄 License

MIT © [Diego García](https://dagadev.net)
