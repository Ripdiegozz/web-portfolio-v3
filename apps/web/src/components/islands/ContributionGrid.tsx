import { useEffect, useState, useMemo } from 'react';
import { Sparkles, Calendar, ExternalLink } from '@portfolio/ui';
import type { ContributionGridLabels } from '../../i18n/types';

export type { ContributionGridLabels };

export interface ActivityDay {
  date: string;
  count: number;
  level: number;
}

export interface ContributionGridData {
  totalContributions: number;
  weeks: Array<{ days: ActivityDay[] }>;
}

export interface ContributionGridProps {
  labels?: ContributionGridLabels;
  months?: readonly string[];
}

const DEFAULT_MONTHS = [
  'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
  'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec',
] as const;

const ISO_DATE = /^\d{4}-\d{2}-\d{2}$/;

const CELL_CLASS = 'w-full aspect-square rounded-[2px] transition-transform hover:scale-125';
const COLUMN_GAP = 'gap-[2px] sm:gap-[2.5px]';

/** GitHub-inspired green emerald ramp with dark mode balance. */
const LEVEL_CLASS: Record<number, string> = {
  0: 'bg-bg-raised/70 border border-border-subtle/50',
  1: 'bg-emerald-500/25 dark:bg-emerald-500/30 border border-emerald-500/30',
  2: 'bg-emerald-500/50 dark:bg-emerald-500/55 border border-emerald-500/40',
  3: 'bg-emerald-500/75 dark:bg-emerald-500/80 border border-emerald-500/60',
  4: 'bg-emerald-500 dark:bg-emerald-400 border border-emerald-400',
};

/**
 * True when there is nothing chartable: no data at all, or the API fallback
 * payload (zero total, zero weeks). A grid with weeks renders even at zero.
 */
export function isEmptyGrid(grid: ContributionGridData | null): boolean {
  return grid === null || (grid.totalContributions === 0 && grid.weeks.length === 0);
}

/** "Aug 2025" label from an ISO date's parts; null when either part is missing. */
function monthYear(
  month: number | undefined,
  year: number | undefined,
  months: readonly string[] = DEFAULT_MONTHS,
): string | null {
  if (month === undefined || year === undefined) return null;
  const label = months[month - 1];
  return label ? `${label} ${year}` : null;
}

/** "Aug 2025 - Aug 2026" for the caption; null when either date is malformed. */
export function formatRange(
  firstIso: string,
  lastIso: string,
  months: readonly string[] = DEFAULT_MONTHS,
): string | null {
  if (!ISO_DATE.test(firstIso) || !ISO_DATE.test(lastIso)) return null;
  const [firstYear, firstMonth] = firstIso.split('-').map(Number);
  const [lastYear, lastMonth] = lastIso.split('-').map(Number);
  const firstLabel = monthYear(firstMonth, firstYear, months);
  const lastLabel = monthYear(lastMonth, lastYear, months);
  if (!firstLabel || !lastLabel) return null;
  return firstLabel === lastLabel ? firstLabel : `${firstLabel} - ${lastLabel}`;
}

/** Caption beneath the grid, e.g. "98 contributions in the last year · Aug 2025 - Aug 2026". */
export function captionFor(
  total: number,
  range: string | null,
  labels?: Partial<ContributionGridLabels>,
): string {
  const singular = labels?.singularContribution ?? 'contribution';
  const plural = labels?.pluralContributions ?? 'contributions';
  const inTheLastYear = labels?.inTheLastYear ?? 'in the last year';

  const count = `${total.toLocaleString()} ${total === 1 ? singular : plural}`;
  return range ? `${count} ${inTheLastYear} · ${range}` : count;
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

/** Calculate streak metrics from the activity days array */
function calculateMetrics(grid: ContributionGridData) {
  const allDays = grid.weeks.flatMap((w) => w.days).filter((d) => Boolean(d.date));

  let longestStreak = 0;
  let tempStreak = 0;
  let activeDays = 0;

  for (const day of allDays) {
    if (day.count > 0) {
      activeDays++;
      tempStreak++;
      if (tempStreak > longestStreak) longestStreak = tempStreak;
    } else {
      tempStreak = 0;
    }
  }

  let currentStreak = 0;
  for (let i = allDays.length - 1; i >= 0; i--) {
    const day = allDays[i];
    if (!day) continue;
    if (day.count > 0) {
      currentStreak++;
    } else {
      // If the very latest day (today) is 0, allow counting streak from yesterday
      if (i === allDays.length - 1) continue;
      break;
    }
  }

  return {
    total: grid.totalContributions,
    longestStreak,
    currentStreak,
    activeDays,
  };
}

export default function ContributionGrid({ labels, months }: ContributionGridProps = {}) {
  const [grid, setGrid] = useState<ContributionGridData | null>(null);
  const [failed, setFailed] = useState(false);

  const totalContributionsLabel = labels?.totalContributions ?? 'Total Contributions';
  const longestStreakLabel = labels?.longestStreak ?? 'Longest Streak';
  const currentStreakLabel = labels?.currentStreak ?? 'Current Streak';
  const activeDaysInYearLabel = labels?.activeDaysInYear ?? 'Active Days in Year';
  const daysUnitLabel = labels?.daysUnit ?? 'days';
  const lessLabel = labels?.less ?? 'Less';
  const moreLabel = labels?.more ?? 'More';
  const syncingTitle = labels?.syncingTitle ?? 'GitHub activity is syncing';
  const syncingDescription =
    labels?.syncingDescription ?? 'Configure your GITHUB_TOKEN to display real-time contribution analytics.';
  const viewOnGithub = labels?.viewOnGithub ?? 'View on GitHub';

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

  const metrics = useMemo(() => (grid ? calculateMetrics(grid) : null), [grid]);

  if (failed || (grid !== null && isEmptyGrid(grid))) {
    return (
      <div className="rounded-2xl border border-border-subtle/80 bg-bg-raised/30 p-5 sm:p-7 backdrop-blur-xs">
        <div className="flex flex-col items-center justify-center py-8 text-center">
          <Calendar className="size-8 text-text-muted/60 mb-2" />
          <p className="text-sm font-medium text-text-primary">{syncingTitle}</p>
          <p className="mt-1 font-mono-code text-xs text-text-muted">{syncingDescription}</p>
          <a
            href="https://github.com/Ripdiegozz"
            target="_blank"
            rel="noopener noreferrer"
            className="mt-4 inline-flex items-center gap-1.5 rounded-md border border-border-subtle bg-bg px-3 py-1.5 font-mono-code text-xs text-text-muted transition-colors hover:border-text-muted hover:text-text-primary"
          >
            <span>{viewOnGithub}</span>
            <ExternalLink className="size-3" />
          </a>
        </div>
      </div>
    );
  }

  if (grid === null || !metrics) {
    // Full-width Skeleton with KPI cards and 52-column grid
    return (
      <div className="rounded-2xl border border-border-subtle/80 bg-bg-raised/30 p-5 sm:p-7 backdrop-blur-xs animate-pulse" aria-hidden="true">
        {/* KPI Skeleton Row */}
        <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-4 mb-6">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="flex flex-col rounded-xl border border-border-subtle/60 bg-bg/60 p-3 h-18">
              <div className="h-5 w-16 rounded bg-bg-raised mb-2" />
              <div className="h-3 w-24 rounded bg-bg-raised/60" />
            </div>
          ))}
        </div>

        {/* Grid Skeleton */}
        <div className="w-full overflow-x-auto pb-1 sm:overflow-x-visible">
          <div className="flex w-full justify-between gap-[2px] sm:gap-[2.5px] min-w-[500px] sm:min-w-0">
            {Array.from({ length: 52 }, (_, column) => (
              <div key={column} className={`flex flex-1 flex-col ${COLUMN_GAP} max-w-[11px]`}>
                {Array.from({ length: 7 }, (_, row) => (
                  <div key={row} className={`${CELL_CLASS} bg-bg-raised/60`} />
                ))}
              </div>
            ))}
          </div>
        </div>

        <div className="mt-4 flex items-center justify-between border-t border-border-subtle/40 pt-3">
          <div className="h-3 w-48 rounded bg-bg-raised/60" />
          <div className="h-3 w-24 rounded bg-bg-raised/60" />
        </div>
      </div>
    );
  }

  const firstDay = grid.weeks[0]?.days[0]?.date;
  const lastWeek = grid.weeks[grid.weeks.length - 1];
  const lastDay = lastWeek?.days[lastWeek.days.length - 1]?.date;
  const range = firstDay && lastDay ? formatRange(firstDay, lastDay, months) : null;
  const label = captionFor(grid.totalContributions, range, labels);

  return (
    <div className="rounded-2xl border border-border-subtle/80 bg-bg-raised/30 p-5 sm:p-7 backdrop-blur-xs">
      {/* Top GitHub Readme KPI Metrics */}
      <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-4 mb-6">
        <div className="flex flex-col rounded-xl border border-border-subtle/70 bg-bg/80 p-3 shadow-2xs">
          <span className="flex items-center gap-1 font-mono-code text-base font-bold text-text-primary">
            <Sparkles className="size-3.5 text-accent shrink-0" />
            <span>{metrics.total.toLocaleString()}</span>
          </span>
          <span className="mt-1 font-mono-code text-[11px] text-text-muted">{totalContributionsLabel}</span>
        </div>

        <div className="flex flex-col rounded-xl border border-border-subtle/70 bg-bg/80 p-3 shadow-2xs">
          <span className="font-mono-code text-base font-bold text-text-primary">
            {metrics.longestStreak} <span className="text-xs font-normal text-text-muted">{daysUnitLabel}</span>
          </span>
          <span className="mt-1 font-mono-code text-[11px] text-text-muted">{longestStreakLabel}</span>
        </div>

        <div className="flex flex-col rounded-xl border border-border-subtle/70 bg-bg/80 p-3 shadow-2xs">
          <span className="font-mono-code text-base font-bold text-text-primary">
            {metrics.currentStreak} <span className="text-xs font-normal text-text-muted">{daysUnitLabel}</span>
          </span>
          <span className="mt-1 font-mono-code text-[11px] text-text-muted">{currentStreakLabel}</span>
        </div>

        <div className="flex flex-col rounded-xl border border-border-subtle/70 bg-bg/80 p-3 shadow-2xs">
          <span className="font-mono-code text-base font-bold text-text-primary">
            {metrics.activeDays} <span className="text-xs font-normal text-text-muted">{daysUnitLabel}</span>
          </span>
          <span className="mt-1 font-mono-code text-[11px] text-text-muted">{activeDaysInYearLabel}</span>
        </div>
      </div>

      {/* Full Width GitHub Activity Heatmap Grid */}
      <div className="w-full overflow-x-auto pb-1 sm:overflow-x-visible">
        <div role="img" aria-label={label} className="flex w-full justify-between gap-[2px] sm:gap-[2.5px] min-w-[500px] sm:min-w-0">
          {grid.weeks.map((week, weekIndex) => {
            if (week.days.length === 0) return null;
            const { before, after } = weekPadding(week.days);
            return (
              <div key={weekIndex} className={`flex flex-1 flex-col ${COLUMN_GAP} max-w-[11px]`}>
                {Array.from({ length: before }, (_, padIndex) => (
                  <div key={`lead-${padIndex}`} className={CELL_CLASS} aria-hidden="true" />
                ))}
                {week.days.map((day, dayIndex) => (
                  <div
                    key={dayIndex}
                    title={`${day.count} contributions on ${day.date}`}
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
      </div>

      {/* Footer Details: Range & Legend */}
      <div className="mt-4 flex flex-wrap items-center justify-between gap-3 border-t border-border-subtle/40 pt-3.5 font-mono-code text-xs text-text-muted">
        <a
          href="https://github.com/Ripdiegozz"
          target="_blank"
          rel="noopener noreferrer"
          className="group inline-flex items-center gap-1 text-text-muted transition-colors hover:text-text-primary"
        >
          <span>{label}</span>
          <ExternalLink className="size-3 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
        </a>

        <div className="flex items-center gap-1.5 text-[11px]">
          <span>{lessLabel}</span>
          <span className="size-2.5 rounded-[2px] bg-bg-raised/70 border border-border-subtle/50" />
          <span className="size-2.5 rounded-[2px] bg-emerald-500/25 dark:bg-emerald-500/30 border border-emerald-500/30" />
          <span className="size-2.5 rounded-[2px] bg-emerald-500/50 dark:bg-emerald-500/55 border border-emerald-500/40" />
          <span className="size-2.5 rounded-[2px] bg-emerald-500/75 dark:bg-emerald-500/80 border border-emerald-500/60" />
          <span className="size-2.5 rounded-[2px] bg-emerald-500 dark:bg-emerald-400 border border-emerald-400" />
          <span>{moreLabel}</span>
        </div>
      </div>
    </div>
  );
}
