import { getCollection } from 'astro:content';
import { en } from '../i18n/locales/en';
import { es } from '../i18n/locales/es';
import { isPublished, sortPostsByDateDesc, formatBlogDate } from './blog';

export function isMarkdownRequested(request: Request): boolean {
  const accept = request.headers.get('accept') || '';
  return accept.includes('text/markdown') || accept.includes('text/x-markdown');
}

export function estimateTokens(text: string): number {
  if (!text) return 0;
  // Standard approximation: ~4 characters per token
  return Math.max(1, Math.ceil(text.length / 4));
}

export async function generateMarkdownForPath(pathname: string): Promise<string | null> {
  const cleanPath = pathname.replace(/\/+$/, '') || '/';

  // 1. Home routes: / and /es
  if (cleanPath === '/' || cleanPath === '/es') {
    const isEs = cleanPath === '/es';
    const dict = isEs ? es : en;
    const allPosts = sortPostsByDateDesc((await getCollection('posts')).filter(isPublished));

    const lines: string[] = [
      `# ${dict.meta.title}`,
      ``,
      `> ${dict.meta.description}`,
      ``,
      `## Overview`,
      `- **Name:** Diego Alonso García Guerrero (dagadev)`,
      `- **Role:** Full-Stack Software Engineer at Wazuh`,
      `- **Location:** Colombia`,
      `- **Website:** https://dagadev.net${isEs ? '/es' : ''}`,
      `- **GitHub:** https://github.com/Ripdiegozz`,
      `- **LinkedIn:** https://www.linkedin.com/in/dagadev`,
      ``,
      `## About`,
      dict.about.lead,
      ``,
      dict.about.support,
      ``,
      `## Experience`,
    ];

    for (const item of dict.experience.items) {
      lines.push(`### ${item.role} @ ${item.company} (${item.period})`);
      lines.push(`- **Location:** ${item.location}`);
      if (item.client) lines.push(`- **Client:** ${item.client}`);
      if (item.highlights && item.highlights.length > 0) {
        lines.push(`- **Key Contributions:**`);
        for (const h of item.highlights) {
          lines.push(`  - ${h}`);
        }
      }
      if (item.skills && item.skills.length > 0) {
        lines.push(`- **Technologies:** ${item.skills.join(', ')}`);
      }
      lines.push(``);
    }

    lines.push(`## Core Skills & Stack`);
    for (const group of dict.skills.categories) {
      lines.push(`### ${group.title}`);
      lines.push(`- ${group.skills.join(', ')}`);
      lines.push(``);
    }

    lines.push(`## Selected Projects`);
    for (const proj of dict.projects.items) {
      lines.push(`### ${proj.name}`);
      lines.push(`${proj.description}`);
      if (proj.stack && proj.stack.length > 0) {
        lines.push(`- **Stack:** ${proj.stack.join(', ')}`);
      }
      if (proj.liveUrl) lines.push(`- **Live URL:** ${proj.liveUrl}`);
      if (proj.repoUrl) lines.push(`- **Repository:** ${proj.repoUrl}`);
      lines.push(``);
    }

    if (allPosts.length > 0) {
      lines.push(`## Recent Articles`);
      for (const post of allPosts.slice(0, 5)) {
        const postUrl = isEs ? `https://dagadev.net/es/blog/${post.id}/` : `https://dagadev.net/blog/${post.id}/`;
        lines.push(`- [${post.data.title}](${postUrl}) — ${post.data.description}`);
      }
      lines.push(``);
    }

    lines.push(`## Contact`);
    lines.push(`- Website: https://dagadev.net/#contact`);
    lines.push(`- Email / Form: Available directly on portfolio website.`);

    return lines.join('\n');
  }

  // 2. Blog index: /blog and /es/blog
  if (cleanPath === '/blog' || cleanPath === '/es/blog') {
    const isEs = cleanPath.startsWith('/es');
    const allPosts = sortPostsByDateDesc((await getCollection('posts')).filter(isPublished));

    const lines: string[] = [
      `# Diego Alonso García — Blog`,
      ``,
      `> Articles and engineering notes on full-stack architecture, AI tooling, and distributed systems.`,
      ``,
    ];

    for (const post of allPosts) {
      const date = formatBlogDate(post.data.pubDate, isEs ? 'es' : 'en');
      const postUrl = isEs ? `https://dagadev.net/es/blog/${post.id}/` : `https://dagadev.net/blog/${post.id}/`;
      lines.push(`## [${post.data.title}](${postUrl})`);
      lines.push(`- **Published:** ${date}`);
      lines.push(`- **Tags:** ${post.data.tags.join(', ')}`);
      lines.push(`- **Summary:** ${post.data.description}`);
      lines.push(``);
    }

    return lines.join('\n');
  }

  // 3. Individual Blog Post: /blog/:slug or /es/blog/:slug
  const blogMatch = cleanPath.match(/^(?:\/es)?\/blog\/([^/]+)$/);
  if (blogMatch) {
    const slug = blogMatch[1];
    const posts = await getCollection('posts');
    const post = posts.find((p) => p.id === slug && isPublished(p));

    if (post) {
      const isEs = cleanPath.startsWith('/es');
      const date = formatBlogDate(post.data.pubDate, isEs ? 'es' : 'en');

      const lines: string[] = [
        `# ${post.data.title}`,
        ``,
        `> ${post.data.description}`,
        ``,
        `- **Author:** Diego Alonso García Guerrero`,
        `- **Date:** ${date}`,
        `- **Tags:** ${post.data.tags.join(', ')}`,
        `- **Canonical URL:** https://dagadev.net${cleanPath}/`,
        ``,
        `---`,
        ``,
        post.body ?? '',
      ];

      return lines.join('\n');
    }
  }

  return null;
}

export function createMarkdownResponse(markdown: string): Response {
  const tokens = estimateTokens(markdown);

  return new Response(markdown, {
    status: 200,
    headers: {
      'Content-Type': 'text/markdown; charset=utf-8',
      'Vary': 'Accept',
      'x-markdown-tokens': String(tokens),
      'Cache-Control': 'public, max-age=3600, s-maxage=86400',
    },
  });
}
