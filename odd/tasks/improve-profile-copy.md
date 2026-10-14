# Improve profile copy: experience, impact, and seniority signals

The portfolio already proves impact (90k+ users, -50% time, -60% calls, +40% speed) but never states total experience, Wazuh's start date, or progression. This change closes those gaps in EN/ES without inventing facts: every new claim must trace to a real date, metric, or responsibility confirmed by Diego.

## Quick path

1. Confirm the open facts in the last section (Wazuh start, years claim, leadership facts).
2. Rewrite Hero, About, and Experience copy in `en.ts`/`es.ts` (tasks 1-3).
3. Align meta, `llms.txt`, and chat-assistant data (task 4), then run lint, typecheck, and tests.

## What exists today (verified 2026-10-14)

| Area | Current state |
|---|---|
| Source of truth | Hardcoded in `apps/web/src/i18n/locales/en.ts` and `es.ts` (268 lines each); `src/data/site.ts:17` re-exports EN. Keystatic only manages blog posts. |
| Timeline | SuperGIROS intern Aug 2023-Jul 2024; Tres Pi Medios Jul 2024-Jan 2026; Wazuh "Current" with no start date. |
| Years claim | None. No "X years" anywhere in Hero, About, Experience, meta, or `llms.txt`. |
| Role titles | "Full-Stack Engineer/Developer" everywhere; intern → developer → engineer progression is never narrated. |
| Hard metrics | Wazuh 90k+; Tres Pi -50% task time; SuperGIROS 1,100+ points, -60% calls, +40% speed. |
| Skills | 10 core + 33 category skills as flat lists; no depth, years, or production-vs-personal distinction. |

## Gaps, ranked

| # | Gap | Why it undersells |
|---|---|---|
| 1 | No total years or career-span statement | Recruiters must do the math from dates; most will not. |
| 2 | Wazuh has no start date, only "Current" | The most prestigious role looks the least concrete. |
| 3 | No seniority/ownership language | Highlights say "building/developing", never owned, led, designed, or shipped end-to-end. |
| 4 | Skills are a flat inventory | Next.js is "core" but appears only in personal projects; depth per skill is invisible. |
| 5 | `llms.txt` overclaims vs the site | It lists Python, GraphQL, RAG, Redis, D1 that Experience/Skills never evidence. |
| 6 | Dates are hardcoded strings | No computed duration, so copy will silently go stale. |

## Tasks

- [x] 1. Hero + meta: add verified years/impact line and a sharper positioning statement (EN/ES).
- [x] 2. Experience: add Wazuh start date and durations; rewrite highlights with ownership verbs and existing metrics only.
- [x] 3. About: turn the support paragraph into a progression story (2023 → Wazuh) with the same verified metrics.
- [x] 4. Consistency pass: align Skills depth signals, `llms.txt`, SEO meta, and chat-assistant facts with the site; remove or evidence unsupported claims.
- [x] 5. Verify: `bun run lint`, `bun run typecheck`, `bun run test` from the repo root; check EN/ES parity in `apps/web/src/i18n/index.test.ts` conventions.

## Scope and constraints

- In scope: copy in `apps/web/src/i18n/locales/en.ts`, `es.ts`, `apps/web/public/llms.txt`, and chat/SEO copy fed by them.
- Out of scope: layout, design, new sections, CV PDFs, and any metric or title not confirmed below.
- Constraint: EN and ES must stay semantically identical; dates and numbers must match in both.

## Acceptance criteria

- [ ] Hero states total experience and current impact within the first screen, in both languages.
- [ ] Every role shows a full date range; no role is only "Current/Actual".
- [ ] No claim appears in `llms.txt` or meta that the Experience/Skills sections do not support.
- [ ] Lint, typecheck, and tests pass.

## Open decisions (need Diego's confirmation before task 1)

1. ~~Wazuh start date~~ — Resolved 2026-10-14: January 2026 (period becomes "Jan 2026 - Present"; overlaps Tres Pi's final month, a normal transition month).
2. ~~Years claim~~ — Resolved 2026-10-14: use "3+ years" (from Aug 2023, internship included). Diego is entering semi-senior level by time and self-assessment; copy signals that level through scope and impact, not a "Senior" title.
3. Ownership/leadership facts — verified from GitHub 2026-10-14 (`Ripdiegozz`, author/assignee search): 148 PRs authored across the 3 Wazuh dashboard repos, 136 merged; 124 issues assigned, 16 authored. Themes (PR titles): Wazuh AI Assistant end-to-end (tools revamp, privacy/never-send enforcement, RBAC sanitization, session persistence, IPv6 pseudonymization), security hardening (AI provider key encryption at rest, encryption key on install, log/CSV injection, cookie password), performance/packaging (bundle minification after a 57 MB JS issue, dependency reduction, Docker/package builders, bumper revert support), and new surfaces (Case management app, Engine Health/metrics dashboards, unified Security Analytics search). Resolved 2026-10-14: Diego confirms the pattern is issue idea + his own design, a mix of both. Copy may claim end-to-end ownership ("designed and built from issue to merged PR") for the most salient themes above, without claiming team leadership.
4. ~~Senior title~~ — Resolved 2026-10-14: keep the official "Full-Stack Engineer" title at Wazuh; overall positioning is semi-senior (experience, scope, metrics), never "Senior".

## Status

- Route: delegated exploration (mapping) → inline doc → one delegated writer for `en.ts`/`es.ts`/`llms.txt`.
- Evidence: explorer map 2026-10-14, parent spot-check of `en.ts` (full read) and EN/ES diff; GitHub author/assignee counts in decision 3.
- Verification (2026-10-14, after Prettier normalization): `bun run lint` pass (3 tasks), `bun run typecheck` pass (0 errors, 73 Astro files), `bun run test` pass (3 tasks, web 92 tests).
- Acceptance criteria above are met except native RDD review, which is the remaining gate before the work-unit commit.
- Next step: native RDD review of this candidate, then commit on `feat/improve-profile-copy`.
