import { useState } from 'react';
import { Calendar, MapPin, Sparkles, TechIcon, ArrowUpRight } from '@portfolio/ui';
import type { ExperienceItem, ExperienceDashboardLabels } from '../../i18n/types';

export type { ExperienceDashboardLabels };

export interface ExperienceDashboardProps {
  items: ExperienceItem[];
  labels?: ExperienceDashboardLabels;
}

export default function ExperienceDashboard({ items, labels }: ExperienceDashboardProps) {
  const [selectedIndex, setSelectedIndex] = useState(0);
  const activeJob = items[selectedIndex] ?? items[0];

  const tablistAriaLabel = labels?.tablistAriaLabel ?? 'Work Experience by Company';
  const activeLabel = labels?.active ?? 'Active';
  const atLabel = labels?.at ?? 'at';
  const contributionsHeading = labels?.keyContributions ?? 'Key Contributions & Impact';
  const technologiesHeading = labels?.technologies ?? 'Technologies & Tooling';

  if (!activeJob) return null;

  return (
    <div className="mt-12 space-y-6">
      {/* Top Segmented Tab Navigation Bar */}
      <div
        role="tablist"
        aria-label={tablistAriaLabel}
        className="grid grid-cols-1 sm:grid-cols-3 gap-2 rounded-xl border border-border-subtle/80 bg-bg-raised/40 p-1.5 backdrop-blur-xs"
      >
        {items.map((job, idx) => {
          const isSelected = idx === selectedIndex;
          return (
            <button
              key={job.company}
              role="tab"
              id={`experience-tab-${idx}`}
              aria-selected={isSelected}
              aria-controls={`experience-panel-${idx}`}
              onClick={() => setSelectedIndex(idx)}
              className={`relative flex flex-col items-start justify-center rounded-lg px-4 py-3 text-left transition-all duration-200 ${
                isSelected
                  ? 'bg-bg text-text-primary shadow-xs border border-border-subtle'
                  : 'text-text-muted hover:text-text-primary hover:bg-bg-raised/60 border border-transparent'
              }`}
            >
              <div className="flex w-full items-center justify-between gap-2">
                <span className="font-sans-display text-sm font-semibold truncate">
                  {job.company.split('/')[0]?.trim()}
                </span>
                {job.current && (
                  <span className="inline-flex items-center gap-1 rounded-full bg-accent/15 px-2 py-0.5 text-[10px] font-semibold text-accent-readable">
                    <span className="size-1 animate-pulse rounded-full bg-accent" aria-hidden="true" />
                    {activeLabel}
                  </span>
                )}
              </div>
              <span className="mt-0.5 font-mono-code text-[11px] text-text-muted truncate w-full">
                {job.role}
              </span>
            </button>
          );
        })}
      </div>

      {/* Full Width Detail Panel */}
      <div
        role="tabpanel"
        id={`experience-panel-${selectedIndex}`}
        aria-labelledby={`experience-tab-${selectedIndex}`}
        className="rounded-2xl border border-border-subtle/80 bg-bg-raised/30 p-6 sm:p-8 backdrop-blur-xs transition-all duration-300 animate-in fade-in"
      >
        {/* Header: Role, Company & Period */}
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between border-b border-border-subtle/50 pb-6">
          <div>
            <h3 className="font-sans-display text-2xl font-medium tracking-tight text-text-primary sm:text-3xl">
              {activeJob.role}
            </h3>
            <p className="mt-1 flex flex-wrap items-center gap-2 font-mono-code text-xs text-text-muted">
              <span>{atLabel}</span>
              {activeJob.companyUrl ? (
                <a
                  href={activeJob.companyUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="group/link inline-flex items-center gap-1 font-medium text-text-primary text-sm transition-colors hover:text-accent underline decoration-border-subtle underline-offset-4 hover:decoration-accent"
                >
                  <span>{activeJob.company}</span>
                  <ArrowUpRight className="size-3 text-text-muted transition-transform group-hover/link:translate-x-0.5 group-hover/link:-translate-y-0.5 group-hover/link:text-accent" />
                </a>
              ) : (
                <span className="font-medium text-text-primary text-sm">{activeJob.company}</span>
              )}
              {activeJob.location && (
                <>
                  <span className="text-border-subtle" aria-hidden="true">•</span>
                  <span className="inline-flex items-center gap-1">
                    <MapPin className="size-3 text-text-muted/70" />
                    <span>{activeJob.location}</span>
                  </span>
                </>
              )}
            </p>
          </div>

          <div className="inline-flex w-fit items-center gap-1.5 rounded-full border border-border-subtle/80 bg-bg px-3 py-1 font-mono-code text-xs text-text-muted">
            <Calendar className="size-3 text-text-muted/80" />
            <span>{activeJob.period}</span>
          </div>
        </div>

        {/* Highlight KPI Chips */}
        {activeJob.kpis && activeJob.kpis.length > 0 && (
          <div className="mt-6 grid grid-cols-1 gap-3 sm:grid-cols-3">
            {activeJob.kpis.map((kpi) => (
              <div
                key={kpi.label}
                className="flex flex-col rounded-xl border border-border-subtle/70 bg-bg/80 p-3.5 shadow-2xs backdrop-blur-xs"
              >
                <span className="flex items-center gap-1.5 font-sans-display text-base font-semibold text-text-primary">
                  <Sparkles className="size-3.5 text-accent shrink-0" />
                  <span>{kpi.value}</span>
                </span>
                <span className="mt-1 font-mono-code text-[11px] text-text-muted">
                  {kpi.label}
                </span>
              </div>
            ))}
          </div>
        )}

        {/* Highlights List */}
        {activeJob.highlights.length > 0 && (
          <div className="mt-6">
            <h4 className="font-mono-code text-[11px] uppercase tracking-wider text-text-muted">
              {contributionsHeading}
            </h4>
            <ul className="mt-3.5 space-y-2.5">
              {activeJob.highlights.map((highlight) => (
                <li
                  key={highlight}
                  className="flex items-start gap-2.5 text-sm leading-relaxed text-text-muted"
                >
                  <span className="mt-2 size-1.5 shrink-0 rounded-full bg-accent" aria-hidden="true" />
                  <span>{highlight}</span>
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* Technologies Stack */}
        {activeJob.skills && activeJob.skills.length > 0 && (
          <div className="mt-8 border-t border-border-subtle/50 pt-5">
            <h4 className="font-mono-code text-[11px] uppercase tracking-wider text-text-muted">
              {technologiesHeading}
            </h4>
            <div className="mt-3 flex flex-wrap items-center gap-1.5">
              {activeJob.skills.map((skill) => (
                <span
                  key={skill}
                  className="inline-flex items-center gap-1.5 rounded-md border border-border-subtle/70 bg-bg/80 px-2.5 py-1 font-mono-code text-xs text-text-muted transition-colors hover:border-border-subtle hover:text-text-primary"
                >
                  <TechIcon name={skill} size={13} className="shrink-0 text-text-muted" />
                  <span>{skill}</span>
                </span>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
