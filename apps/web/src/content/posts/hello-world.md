---
title: Hello, world
description: First post on the new portfolio engine — and a test of reading time, tags, and the table of contents.
pubDate: 2026-08-22
tags: [meta, astro, engineering]
draft: false
---

This site now publishes through [Keystatic](https://keystatic.com) — a local-first CMS that lives in the repo alongside the code. No external database, no extra service, just markdown files with a nice editor UI.

## Why Keystatic?

I wanted content authoring that felt native to the development workflow. Keystatic delivers exactly that: you write in the repo, commit with git, and the CMS UI is just a local dev server route (`/keystatic`).

Some things I appreciate:

- **Zero vendor lock-in** — content is plain markdown in `src/content/posts/`
- **Type-safe schema** via `astro:content` + Zod
- **Draft support** — `draft: true` keeps a post hidden in production, visible in dev

## The New Stack

The portfolio runs on **Astro 5** deployed to **Cloudflare Pages**. The setup gives you:

- Static rendering by default with islands for interactive components
- View Transitions API for the theme toggle (800ms diagonal polygon wipe)
- Edge functions via `@astrojs/cloudflare` for the contact form and activity API

### Content Pipeline

```
src/content/posts/*.md
        ↓  astro:content (glob loader)
  getCollection('posts')
        ↓  isPublished + sortPostsByDateDesc
    Writing section + /blog
```

### Reading Time

Each post shows an estimated reading time calculated from the word count — stripping code blocks, markdown markers, and HTML before counting. Average reading speed: **200 wpm**.

## What's Next

A few things still on the list:

1. More posts (obviously)
2. RSS feed
3. OG image generation per post
4. Search

---

That's all for the first post. If you want to discuss any of the engineering decisions, reach out on [LinkedIn](https://www.linkedin.com/in/dagadev) or via the contact form inside the main page.
