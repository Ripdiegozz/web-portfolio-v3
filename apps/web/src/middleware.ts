import { defineMiddleware } from 'astro:middleware';
import {
  isMarkdownRequested,
  generateMarkdownForPath,
  createMarkdownResponse,
} from './lib/markdown-negotiation';

export const AGENT_LINK_HEADERS = [
  '</.well-known/api-catalog>; rel="api-catalog"',
  '</llms.txt>; rel="describedby"',
  '</sitemap-index.xml>; rel="service-doc"',
].join(', ');

export const onRequest = defineMiddleware(async (context, next) => {
  const { request, url } = context;

  // 1. Check if an AI agent requested Markdown content negotiation
  if (isMarkdownRequested(request)) {
    // Avoid intercepting API routes or Keystatic CMS
    if (!url.pathname.startsWith('/api') && !url.pathname.startsWith('/keystatic')) {
      const markdown = await generateMarkdownForPath(url.pathname);
      if (markdown) {
        const response = createMarkdownResponse(markdown);
        response.headers.set('Link', AGENT_LINK_HEADERS);
        return response;
      }
    }
  }

  // 2. Otherwise, continue serving standard HTML to browsers
  const response = await next();

  // Attach RFC 8288 / RFC 9727 agent discovery Link headers on HTML responses
  response.headers.set('Link', AGENT_LINK_HEADERS);

  return response;
});
