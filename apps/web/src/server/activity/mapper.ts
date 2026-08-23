import type { ActivityGrid } from '../app';

export function levelForCount(count: number): 0 | 1 | 2 | 3 | 4 {
  if (count <= 0) return 0;
  if (count <= 3) return 1;
  if (count <= 7) return 2;
  if (count <= 12) return 3;
  return 4;
}

interface GraphQLResponse {
  data?: {
    viewer?: {
      contributionsCollection?: {
        totalContributions?: number;
        contributionCalendar?: {
          weeks?: Array<{
            contributionDays?: Array<{ date: string; contributionCount: number }>;
          }>;
        };
      };
    };
  };
}

export function mapContributionsResponse(payload: unknown): ActivityGrid {
  const p = payload as GraphQLResponse;
  const cal = p.data?.viewer?.contributionsCollection?.contributionCalendar;
  // GraphQL returns 200 with { data: null, errors } on errors. Throw so the
  // fallback chain serves a stale grid instead of caching an empty one.
  if (!cal?.weeks) {
    throw new Error('github_activity_invalid_response');
  }
  return {
    totalContributions: p.data?.viewer?.contributionsCollection?.totalContributions ?? 0,
    weeks: (cal?.weeks ?? []).map((week) => ({
      days: (week.contributionDays ?? []).map((day) => ({
        date: day.date,
        count: day.contributionCount,
        level: levelForCount(day.contributionCount),
      })),
    })),
  };
}

export function emptyGrid(): ActivityGrid {
  return { totalContributions: 0, weeks: [] };
}
