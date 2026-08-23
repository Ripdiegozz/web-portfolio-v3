---
title: Hello, world
description: First post on the new portfolio engine.
pubDate: 2026-08-22
tags: [meta, astro, engineering]
draft: false
---

This site runs on Astro 5 and deploys to Cloudflare Pages. Content lives in plain markdown under `src/content/posts/` and gets edited through [Keystatic](https://keystatic.com), a local CMS that runs at `/keystatic` during dev. No database, no third-party service.

## Why Keystatic?

I wanted a CMS that committed to git and stayed out of the way. Keystatic does that. You write markdown, you commit, done.

The alternative was a headless CMS with a separate account, a webhook, and something that could go down. Not worth it for a personal site.

The schema lives in `keystatic.config.ts` alongside the app code. Content types are defined once, validated at the edge, and the CMS UI is just a route — no separate deployment.

One thing worth noting: Keystatic does not manage assets. Images go into `public/` and you reference them by path. Fine for a blog, would be a problem for something with lots of media.

## Stack

- **Astro 5** with the Cloudflare adapter
- **Tailwind v4** with CSS custom properties for theming
- **Keystatic** for content editing
- **Vitest** for unit tests
- **Resend** for the contact form

Everything deploys from a single `git push`. Cloudflare picks up the branch, runs `astro build`, and serves from the edge.

### Theme toggle

The dark/light switch uses the View Transitions API with a diagonal polygon wipe at 800ms. No JavaScript framework, no library. About 30 lines of vanilla JS in the layout.

The trick is always animating `::view-transition-new(root)` expanding outward on top (`z-index: 9999`), regardless of which direction the theme is going. When the animation ends, the rendered pseudo-element matches the live DOM exactly, so there is no flicker.

Duration is 800ms with `cubic-bezier(0.25, 1, 0.5, 1)`. Slower than most examples but it reads as intentional rather than broken.

### Reading time

Every post shows an estimated reading time. It strips code blocks and markdown syntax before counting words, then divides by 200 wpm. Minimum is 1 minute.

The function runs at build time — no client-side JavaScript needed. For a 500-word post the estimate is 3 minutes. That is probably fast but the goal is a rough signal, not precision.

### Table of contents

Posts with more than one section get a sticky ToC sidebar on desktop. On mobile it collapses into a `<details>` element above the article. No library, no framework. Headings come from Astro's `render()` return value, which already extracts `{ depth, slug, text }` for every heading in the document.

The active heading highlights as you scroll using a passive scroll listener that compares `window.scrollY` against each heading's `offsetTop`.

## Deployment

The site deploys to Cloudflare Pages. The build output is static HTML with a small number of edge functions for the contact form and the GitHub activity API.

Edge functions run in the Cloudflare Workers runtime. Cold starts are in the low milliseconds. The contact form uses Resend for email delivery and a Cloudflare Turnstile token for spam protection.

No analytics yet. That will come once I decide what I want to measure.

## What's next

- More posts
- RSS feed
- OG images per post
- Search
