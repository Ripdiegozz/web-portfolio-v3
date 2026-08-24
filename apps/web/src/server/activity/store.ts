import { emptyGrid, mapContributionsResponse } from './mapper';
import type { ActivityGrid } from '../app';

export interface ActivityStoreHooks {
  fetchFresh(): Promise<unknown>; // raw GraphQL payload
  readCache(): Promise<ActivityGrid | undefined>;
  writeCache(grid: ActivityGrid): Promise<void>;
}

export type ActivitySource = 'cached' | 'fresh' | 'fallback';

/**
 * Cache-first: a fresh edge-cache hit is served without touching GitHub
 * (expiry is managed by the Cache API via our max-age=3600 header); on a miss
 * we fetch fresh and re-cache; on upstream failure (and no usable cache)
 * we fall back to an empty grid and never throw.
 */
export async function getActivityWithFallback(
  hooks: ActivityStoreHooks
): Promise<{ grid: ActivityGrid; source: ActivitySource }> {
  const cached = await hooks.readCache().catch(() => undefined);
  if (cached && (cached.totalContributions > 0 || cached.weeks.length > 0)) {
    return { grid: cached, source: 'cached' };
  }
  try {
    const grid = mapContributionsResponse(await hooks.fetchFresh());
    if (grid.totalContributions > 0 || grid.weeks.length > 0) {
      await hooks.writeCache(grid).catch(() => {}); // cache write is best-effort
    }
    return { grid, source: 'fresh' };
  } catch {
    const stale = await hooks.readCache().catch(() => undefined);
    if (stale && (stale.totalContributions > 0 || stale.weeks.length > 0)) {
      return { grid: stale, source: 'fallback' };
    }
    return { grid: emptyGrid(), source: 'fallback' };
  }
}

const QUERY = /* GraphQL */ `
  query {
    user(login: "Ripdiegozz") {
      contributionsCollection {
        contributionCalendar {
          totalContributions
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
  const token = githubToken.trim();
  const res = await fetchImpl('https://api.github.com/graphql', {
    method: 'POST',
    headers: {
      authorization: `Bearer ${token}`,
      'content-type': 'application/json',
      'user-agent': 'dagadev-portfolio',
    },
    body: JSON.stringify({ query: QUERY }),
  });
  if (!res.ok) {
    const text = await res.text().catch(() => '');
    console.error(`[github-graphql] failed (${res.status}): ${text}`);
    throw new Error(`github_graphql_${res.status}`);
  }
  return res.json();
}
