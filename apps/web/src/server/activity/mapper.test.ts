import { describe, expect, it } from 'vitest';
import { emptyGrid, levelForCount, mapContributionsResponse } from './mapper';

const sample = {
  data: {
    viewer: {
      contributionsCollection: {
        totalContributions: 42,
        contributionCalendar: {
          weeks: [
            { contributionDays: [{ date: '2026-08-20', contributionCount: 9 }] },
            { contributionDays: [{ date: '2026-08-21', contributionCount: 0 }, { date: '2026-08-22', contributionCount: 14 }] },
          ],
        },
      },
    },
  },
};

describe('activity mapper', () => {
  it('maps calendar to grid with levels', () => {
    const grid = mapContributionsResponse(sample);
    expect(grid.totalContributions).toBe(42);
    expect(grid.weeks[0]!.days[0]!).toEqual({ date: '2026-08-20', count: 9, level: 3 });
    expect(grid.weeks[1]!.days[0]!.level).toBe(0);
    expect(grid.weeks[1]!.days[1]!.level).toBe(4);
  });
  it('buckets counts correctly', () => {
    expect(levelForCount(0)).toBe(0);
    expect(levelForCount(3)).toBe(1);
    expect(levelForCount(5)).toBe(2);
    expect(levelForCount(11)).toBe(3);
    expect(levelForCount(20)).toBe(4);
  });
  it('emptyGrid is safe to render', () => {
    expect(emptyGrid()).toEqual({ totalContributions: 0, weeks: [] });
  });
});
