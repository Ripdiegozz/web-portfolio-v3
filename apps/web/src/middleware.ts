import { defineMiddleware } from 'astro:middleware';
import {
  isMarkdownRequested,
  generateMarkdownForPath,
  createMarkdownResponse,
} from './lib/markdown-negotiation';

export const onRequest = defineMiddleware(async (context, next) => {
  const { request, url } = context;

  // 1. Check if an AI agent requested Markdown content negotiation
  if (isMarkdownRequested(request)) {
    // Avoid intercepting API routes or Keystatic CMS
    if (!url.pathname.startsWith('/api') && !url.pathname.startsWith('/keystatic')) {
      const markdown = await generateMarkdownForPath(url.pathname);
      if (markdown) {
        return createMarkdownResponse(markdown);
      }
    }
  }

  // 2. Otherwise, continue serving standard HTML to browsers
  return next();
});
