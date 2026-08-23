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

## Stack

- **Astro 5** with the Cloudflare adapter
- **Tailwind v4** with CSS custom properties for theming
- **Keystatic** for content editing
- **Vitest** for unit tests
- **Resend** for the contact form

### Theme toggle

The dark/light switch uses the View Transitions API with a diagonal polygon wipe at 800ms. No JavaScript framework, no library. About 30 lines of vanilla JS in the layout.

### Reading time

Every post shows an estimated reading time. It strips code blocks and markdown syntax before counting words, then divides by 200 wpm. Minimum is 1 minute.

## What's next

- More posts
- RSS feed
- OG images per post
