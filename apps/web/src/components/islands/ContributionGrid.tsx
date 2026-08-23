import { useEffect, useState } from 'react';

export interface ActivityDay {
  date: string;
  count: number;
  level: number;
}

export interface ContributionGridData {
  totalContributions: number;
  weeks: Array<{ days: ActivityDay[] }>;
}

const MONTHS = [
  'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
  'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec',
] as const;

const ISO_DATE = /^\d{4}-\d{2}-\d{2}$/;

const CELL_CLASS = 'h-2.5 w-2.5 rounded-[3px]';
const COLUMN_GAP = 'gap-[3px]';

/** Level ramp drives the grim-style grid: raised slate for zero, accent at 25% steps. */
const LEVEL_CLASS: Record<number, string> = {
  0: 'bg-bg-raised ring-1 ring-inset ring-border-subtle',
  1: 'bg-accent/20',
  2: 'bg-accent/40',
  3: 'bg-accent/70',
  4: 'bg-accent',
};

/**
 * True when there is nothing chartable: no data at all, or the API fallback
 * payload (zero total, zero weeks). A grid with weeks renders even at zero.
 */
export function isEmptyGrid(grid: ContributionGridData | null): boolean {
  return grid === null || (grid.totalContributions === 0 && grid.weeks.length === 0);
}

/** "Aug 2025" label from an ISO date's parts; null when either part is missing. */
function monthYear(month: number | undefined, year: number | undefined): string | null {
  if (month === undefined || year === undefined) return null;
  const label = MONTHS[month - 1];
  return label ? `${label} ${year}` : null;
}

/** "Aug 2025 - Aug 2026" for the caption; null when either date is malformed. */
export function formatRange(firstIso: string, lastIso: string): string | null {
  if (!ISO_DATE.test(firstIso) || !ISO_DATE.test(lastIso)) return null;
  const [firstYear, firstMonth] = firstIso.split('-').map(Number);
  const [lastYear, lastMonth] = lastIso.split('-').map(Number);
  const firstLabel = monthYear(firstMonth, firstYear);
  const lastLabel = monthYear(lastMonth, lastYear);
  if (!firstLabel || !lastLabel) return null;
  return firstLabel === lastLabel ? firstLabel : `${firstLabel} - ${lastLabel}`;
}

/** Caption beneath the grid, e.g. "98 contributions in the last year · Aug 2025 - Aug 2026". */
export function captionFor(total: number, range: string | null): string {
  const count = `${total} ${total === 1 ? 'contribution' : 'contributions'}`;
  return range ? `${count} in the last year · ${range}` : count;
}

/**
 * GitHub-style columns are fixed at 7 rows: a partial week pads its leading
 * cells (days before the week's first day) and, after the days, the trailing
 * cells. before = weekday of the first day (0 = Sunday).
 */
export function weekPadding(days: ActivityDay[]): { before: number; after: number } {
  const first = days[0];
  if (!first) return { before: 0, after: 0 };
  const before = new Date(`${first.date}T00:00:00Z`).getUTCDay();
  return { before, after: Math.max(0, 7 - before - days.length) };
}

export default function ContributionGrid() {
  const [grid, setGrid] = useState<ContributionGridData | null>(null);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    let active = true;
    fetch('/api/activity')
      .then((r) => r.json())
      .then((body: { ok?: boolean; data?: ContributionGridData }) => {
        if (!active) return;
        if (body?.ok && body.data) setGrid(body.data);
        else setFailed(true);
      })
      .catch(() => {
        if (active) setFailed(true);
      });
    return () => {
      active = false;
    };
  }, []);

  if (failed || (grid !== null && isEmptyGrid(grid))) {
    // min-h matches the skeleton footprint so the empty/fallback path causes
    // no layout shift of the content below (Skills, contact, footer).
    return (
      <div className="mt-10 min-h-[156px]">
        <p className="text-sm text-text-muted">Nothing to chart yet</p>
        <p className="mt-2 font-mono-code text-xs text-text-muted">{captionFor(0, null)}</p>
      </div>
    );
  }

  if (grid === null) {
    // Skeleton mirrors the real footprint (7 rows) so hydration causes no shift.
    // One pulse layer only; cells stay static muted.
    return (
      <div className="mt-10 animate-pulse" aria-hidden="true">
        <div className="flex gap-[3px]">
          {Array.from({ length: 8 }, (_, column) => (
            <div key={column} className={`flex flex-col ${COLUMN_GAP}`}>
              {Array.from({ length: 7 }, (_, row) => (
                <div key={row} className={`${CELL_CLASS} bg-bg-raised`} />
              ))}
            </div>
          ))}
        </div>
        <div className="mt-3 h-4 w-48 rounded-sm bg-bg-raised" />
      </div>
    );
  }

  const firstDay = grid.weeks[0]?.days[0]?.date;
  const lastWeek = grid.weeks[grid.weeks.length - 1];
  const lastDay = lastWeek?.days[lastWeek.days.length - 1]?.date;
  const range = firstDay && lastDay ? formatRange(firstDay, lastDay) : null;
  const label = captionFor(grid.totalContributions, range);

  return (
    <div className="mt-10">
      <div role="img" aria-label={label} className={`flex ${COLUMN_GAP} overflow-x-auto`}>
        {grid.weeks.map((week, weekIndex) => {
          if (week.days.length === 0) return null;
          const { before, after } = weekPadding(week.days);
          return (
            <div key={weekIndex} className={`flex flex-col ${COLUMN_GAP}`}>
              {Array.from({ length: before }, (_, padIndex) => (
                <div key={`lead-${padIndex}`} className={CELL_CLASS} aria-hidden="true" />
              ))}
              {week.days.map((day, dayIndex) => (
                <div
                  key={dayIndex}
                  title={`${day.count} on ${day.date}`}
                  className={`${CELL_CLASS} ${LEVEL_CLASS[day.level] ?? 'bg-bg-raised'}`}
                />
              ))}
              {Array.from({ length: after }, (_, padIndex) => (
                <div key={`trail-${padIndex}`} className={CELL_CLASS} aria-hidden="true" />
              ))}
            </div>
          );
        })}
      </div>
      <p className="mt-3 font-mono-code text-xs text-text-muted">{label}</p>
    </div>
  );
}
