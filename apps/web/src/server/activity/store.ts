import { emptyGrid, mapContributionsResponse } from './mapper';
import type { ActivityGrid } from '../app';

export interface ActivityStoreHooks {
  fetchFresh(): Promise<unknown>; // raw GraphQL payload
  readCache(): Promise<ActivityGrid | undefined>;
  writeCache(grid: ActivityGrid): Promise<void>;
}

export type ActivitySource = 'fresh' | 'stale' | 'fallback';

export async function getActivityWithFallback(
  hooks: ActivityStoreHooks
): Promise<{ grid: ActivityGrid; source: ActivitySource }> {
  try {
    const grid = mapContributionsResponse(await hooks.fetchFresh());
    await hooks.writeCache(grid).catch(() => {}); // cache write is best-effort
    return { grid, source: 'fresh' };
  } catch {
    const stale = await hooks.readCache().catch(() => undefined);
    if (stale) return { grid: stale, source: 'stale' };
    return { grid: emptyGrid(), source: 'fallback' };
  }
}

const QUERY = /* GraphQL */ `
  query {
    viewer {
      contributionsCollection {
        totalContributions
        contributionCalendar {
          weeks {
            contributionDays {
              date
              contributionCount
            }
          }
        }
      }
    }
  }
`;

export async function fetchGitHubActivity(githubToken: string, fetchImpl: typeof fetch = fetch) {
  const res = await fetchImpl('https://api.github.com/graphql', {
    method: 'POST',
    headers: {
      authorization: `Bearer ${githubToken}`,
      'content-type': 'application/json',
    },
    body: JSON.stringify({ query: QUERY }),
  });
  if (!res.ok) throw new Error(`github_graphql_${res.status}`);
  return res.json();
}
