import { afterEach, describe, expect, it, vi } from 'vitest';
import { formatBlogDate, getReadingTime, isPublished, sortPostsByDateDesc } from './blog';

const makeEntry = (pubDate: string, draft = false) =>
  ({ data: { pubDate: new Date(pubDate), draft } });

afterEach(() => vi.unstubAllEnvs());

describe('isPublished', () => {
  it('keeps non-draft entries in production', () => {
    vi.stubEnv('PROD', true);
    expect(isPublished(makeEntry('2026-01-01'))).toBe(true);
  });
  it('drops drafts in production', () => {
    vi.stubEnv('PROD', true);
    expect(isPublished(makeEntry('2026-01-01', true))).toBe(false);
  });
  it('keeps drafts in development previews', () => {
    vi.stubEnv('PROD', false);
    expect(isPublished(makeEntry('2026-01-01', true))).toBe(true);
  });
});

describe('sortPostsByDateDesc', () => {
  it('sorts newest first', () => {
    const sorted = sortPostsByDateDesc([
      makeEntry('2026-01-01'),
      makeEntry('2026-06-01'),
      makeEntry('2025-12-31'),
    ]);
    expect(sorted.map((e) => e.data.pubDate.getUTCFullYear())).toEqual([2026, 2026, 2025]);
  });
});

describe('getReadingTime', () => {
  it('returns minimum 1 min for empty or short text', () => {
    expect(getReadingTime('')).toBe(1);
    expect(getReadingTime('Short note.')).toBe(1);
  });

  it('calculates ~200 WPM accurately and strips code/markdown markers', () => {
    const sampleWords = new Array(450).fill('architecture').join(' ');
    const markdown = `# Architecture Deep Dive\n\`\`\`ts\nconst x = 1;\n\`\`\`\n\n${sampleWords}`;
    expect(getReadingTime(markdown)).toBe(3); // (1 title word + 450 words) / 200 = 2.255 -> ceil 3
  });
});

describe('formatBlogDate', () => {
  it('formats dates in English locale', () => {
    const d = new Date('2026-08-22T00:00:00Z');
    const formatted = formatBlogDate(d, 'en');
    expect(formatted).toContain('2026');
    expect(formatted).toContain('Aug');
  });

  it('formats dates in Spanish locale', () => {
    const d = new Date('2026-08-22T00:00:00Z');
    const formatted = formatBlogDate(d, 'es');
    expect(formatted).toContain('2026');
    expect(formatted.toLowerCase()).toContain('ago');
  });
});
