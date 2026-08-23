import { describe, expect, it, vi } from 'vitest';
import { getActivityWithFallback, fetchGitHubActivity } from './store';

describe('getActivityWithFallback', () => {
  // fetchFresh returns the RAW GraphQL payload (see ActivityStoreHooks);
  // the expected grid is what mapContributionsResponse produces from it.
  const freshPayload = {
    data: {
      viewer: {
        contributionsCollection: {
          contributionCalendar: {
            totalContributions: 5,
            weeks: [],
          },
        },
      },
    },
  };
  const fresh = { totalContributions: 5, weeks: [] };
  const stale = { totalContributions: 99, weeks: [] };

  it('serves a cache hit without touching upstream', async () => {
    const fetchFresh = vi.fn();
    const result = await getActivityWithFallback({
      fetchFresh,
      readCache: async () => stale,
      writeCache: async () => {},
    });
    expect(result.grid).toEqual(stale);
    expect(result.source).toBe('cached');
    expect(fetchFresh).not.toHaveBeenCalled();
  });
  it('on cache miss fetches fresh and refreshes the cache', async () => {
    let cached: object | undefined;
    const result = await getActivityWithFallback({
      fetchFresh: async () => freshPayload,
      readCache: async () => undefined,
      writeCache: async (g) => { cached = g; },
    });
    expect(result.grid).toEqual(fresh);
    expect(result.source).toBe('fresh');
    expect(cached).toEqual(fresh);
  });
  it('when both fail serves empty grid, never throws', async () => {
    const result = await getActivityWithFallback({
      fetchFresh: async () => { throw new Error('down'); },
      readCache: async () => undefined,
      writeCache: async () => {},
    });
    expect(result.grid).toEqual({ totalContributions: 0, weeks: [] });
    expect(result.source).toBe('fallback');
  });
  it('rejects empty calendars from error-shaped responses instead of caching them', async () => {
    const writeCache = vi.fn();
    const result = await getActivityWithFallback({
      fetchFresh: async () => ({ data: null, errors: [{ message: 'boom' }] }),
      readCache: async () => undefined,
      writeCache,
    });
    expect(result.grid).toEqual({ totalContributions: 0, weeks: [] });
    expect(result.source).toBe('fallback');
    expect(writeCache).not.toHaveBeenCalled();
  });
});

describe('fetchGitHubActivity', () => {
  it('POSTs the query to the GraphQL API with a bearer token', async () => {
    const fetchImpl = vi.fn(async () => new Response('{"data":null}', { status: 200 }));
    await fetchGitHubActivity('secret-token', fetchImpl);
    const [input, init] = (fetchImpl as ReturnType<typeof vi.fn>).mock.calls[0] as [string, RequestInit];
    expect(input).toBe('https://api.github.com/graphql');
    expect(init.method).toBe('POST');
    expect((init.headers as Record<string, string>).authorization).toBe('Bearer secret-token');
    expect((init.headers as Record<string, string>)['content-type']).toBe('application/json');
    const body = JSON.parse(init.body as string) as { query: string };
    expect(body.query).toContain('contributionCalendar');
  });
  it('throws with the status when upstream responds with an error', async () => {
    const fetchImpl = vi.fn(async () => new Response('boom', { status: 401 }));
    await expect(fetchGitHubActivity('bad', fetchImpl)).rejects.toThrow('github_graphql_401');
  });
});
