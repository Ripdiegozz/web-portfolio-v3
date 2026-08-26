import { describe, expect, it, vi } from 'vitest';
import {
  isMarkdownRequested,
  estimateTokens,
  generateMarkdownForPath,
  createMarkdownResponse,
} from './markdown-negotiation';

vi.mock('astro:content', () => ({
  getCollection: vi.fn().mockResolvedValue([
    {
      id: 'hello-world',
      body: 'This is the test body content in markdown.',
      data: {
        title: 'Hello World Post',
        description: 'A test post description',
        pubDate: new Date('2026-08-22T00:00:00Z'),
        tags: ['tech', 'astro'],
        draft: false,
      },
    },
  ]),
}));

describe('Markdown for Agents content negotiation', () => {
  it('detects markdown request header', () => {
    const markdownReq = new Request('https://dagadev.net/', {
      headers: { accept: 'text/markdown, text/html' },
    });
    expect(isMarkdownRequested(markdownReq)).toBe(true);

    const xMarkdownReq = new Request('https://dagadev.net/', {
      headers: { accept: 'text/x-markdown' },
    });
    expect(isMarkdownRequested(xMarkdownReq)).toBe(true);

    const htmlReq = new Request('https://dagadev.net/', {
      headers: { accept: 'text/html,application/xhtml+xml' },
    });
    expect(isMarkdownRequested(htmlReq)).toBe(false);

    const emptyReq = new Request('https://dagadev.net/');
    expect(isMarkdownRequested(emptyReq)).toBe(false);
  });

  it('estimates token counts accurately', () => {
    expect(estimateTokens('')).toBe(0);
    expect(estimateTokens('Hello world')).toBe(3);
    expect(estimateTokens('a'.repeat(400))).toBe(100);
  });

  it('generates English markdown profile for root path', async () => {
    const md = await generateMarkdownForPath('/');
    expect(md).toBeDefined();
    expect(md).toContain('Diego Alonso García Guerrero');
    expect(md).toContain('Full-Stack Software Engineer at Wazuh');
    expect(md).toContain('## Experience');
    expect(md).toContain('## Core Skills');
  });

  it('generates Spanish markdown profile for /es path', async () => {
    const md = await generateMarkdownForPath('/es');
    expect(md).toBeDefined();
    expect(md).toContain('Diego Alonso García Guerrero');
    expect(md).toContain('https://dagadev.net/es');
  });

  it('generates blog list markdown for /blog', async () => {
    const md = await generateMarkdownForPath('/blog');
    expect(md).toBeDefined();
    expect(md).toContain('Hello World Post');
    expect(md).toContain('A test post description');
  });

  it('generates single article markdown for /blog/:slug', async () => {
    const md = await generateMarkdownForPath('/blog/hello-world');
    expect(md).toBeDefined();
    expect(md).toContain('# Hello World Post');
    expect(md).toContain('This is the test body content in markdown.');
    expect(md).toContain('Diego Alonso García Guerrero');
  });

  it('creates proper HTTP Response with markdown headers', () => {
    const markdown = '# Test Content\n\nSome text';
    const response = createMarkdownResponse(markdown);

    expect(response.status).toBe(200);
    expect(response.headers.get('Content-Type')).toBe('text/markdown; charset=utf-8');
    expect(response.headers.get('Vary')).toBe('Accept');
    expect(response.headers.get('x-markdown-tokens')).toBeDefined();
  });
});
