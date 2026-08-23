import { describe, expect, it } from 'vitest';
import { captionFor, formatRange, isEmptyGrid, weekPadding } from './ContributionGrid';

describe('isEmptyGrid', () => {
  it('treats absence of data as empty', () => {
    expect(isEmptyGrid(null)).toBe(true);
  });

  it('treats the zero-total, zero-week fallback as empty', () => {
    expect(isEmptyGrid({ totalContributions: 0, weeks: [] })).toBe(true);
  });

  it('keeps a grid that has weeks even when the total is zero', () => {
    const grid = {
      totalContributions: 0,
      weeks: [{ days: [{ date: '2026-08-23', count: 0, level: 0 }] }],
    };
    expect(isEmptyGrid(grid)).toBe(false);
  });
});

describe('formatRange', () => {
  it('renders a year-spanning range', () => {
    expect(formatRange('2025-08-01', '2026-08-23')).toBe('Aug 2025 - Aug 2026');
  });

  it('collapses a same-month range to a single label', () => {
    expect(formatRange('2026-08-01', '2026-08-23')).toBe('Aug 2026');
  });

  it('rejects malformed dates', () => {
    expect(formatRange('not-a-date', '2026-08-23')).toBeNull();
  });
});

describe('captionFor', () => {
  it('states the total and appends the range when one is available', () => {
    expect(captionFor(98, 'Aug 2025 - Aug 2026')).toBe(
      '98 contributions in the last year · Aug 2025 - Aug 2026',
    );
  });

  it('singularizes a single contribution', () => {
    expect(captionFor(1, null)).toBe('1 contribution');
  });

  it('omits the range suffix when absent', () => {
    expect(captionFor(0, null)).toBe('0 contributions');
  });
});

describe('weekPadding', () => {
  function days(count: number, startDay = '2026-08-23'): Array<{ date: string; count: number; level: number }> {
    return Array.from({ length: count }, (_, i) => {
      const d = new Date(`${startDay}T00:00:00Z`);
      d.setUTCDate(d.getUTCDate() + i);
      return { date: d.toISOString().slice(0, 10), count: 0, level: 0 };
    });
  }

  it('pads nothing for a full Sunday-started week', () => {
    expect(weekPadding(days(7))).toEqual({ before: 0, after: 0 });
  });

  it('pads leading cells for a week starting mid-week', () => {
    // 2026-08-23 is a Sunday; 2026-08-26 is a Wednesday (index 3).
    expect(weekPadding(days(4, '2026-08-26'))).toEqual({ before: 3, after: 0 });
  });

  it('pads trailing cells for a week ending mid-week', () => {
    expect(weekPadding(days(3))).toEqual({ before: 0, after: 4 });
  });

  it('is a no-op for an empty week', () => {
    expect(weekPadding([])).toEqual({ before: 0, after: 0 });
  });
});
