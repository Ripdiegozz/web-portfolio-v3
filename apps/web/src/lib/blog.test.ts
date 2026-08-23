import { afterEach, describe, expect, it, vi } from 'vitest';
import { isPublished, sortPostsByDateDesc } from './blog';

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
    // Dates parse as UTC; use UTC getters so assertions don't shift on non-UTC runners.
    expect(sorted.map((e) => e.data.pubDate.getUTCFullYear())).toEqual([2026, 2026, 2025]);
  });
});
