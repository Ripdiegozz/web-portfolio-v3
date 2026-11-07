import { describe, expect, it } from 'vitest';
import {
  CAREER_START_DATE,
  formatHeroKicker,
  formatYearsOfExperience,
  getYearsOfExperience,
} from './experience';
import { en } from '../i18n/locales/en';
import { es } from '../i18n/locales/es';

describe('Career history in locales', () => {
  const summarize = (items: typeof en.experience.items) =>
    items.map(({ company, role, period }) => ({ company, role, period }));

  it('matches the CV roles and periods in English', () => {
    expect(summarize(en.experience.items)).toEqual([
      { company: 'Wazuh', role: 'Full Stack Engineer', period: 'Jan 2026 – Present' },
      { company: 'Tres Pi Medios', role: 'Back End Developer', period: 'Jul 2024 – Jan 2026' },
      { company: 'SuperGIROS', role: 'Full Stack Developer - Trainee', period: 'Jan 2024 – Jul 2024' },
    ]);
  });

  it('matches the CV roles and periods in Spanish', () => {
    expect(summarize(es.experience.items)).toEqual([
      { company: 'Wazuh', role: 'Full Stack Engineer', period: 'Ene 2026 – Actualidad' },
      { company: 'Tres Pi Medios', role: 'Back End Developer', period: 'Jul 2024 – Ene 2026' },
      { company: 'SuperGIROS', role: 'Full Stack Developer - Trainee', period: 'Ene 2024 – Jul 2024' },
    ]);
  });

  it('shows the merged PR count in both languages', () => {
    expect(en.experience.items[0]?.kpis?.map((kpi) => kpi.value)).toContain('180+ merged PRs');
    expect(es.experience.items[0]?.kpis?.map((kpi) => kpi.value)).toContain('180+ PR fusionados');
  });
});

describe('Experience Calculation Utilities', () => {
  it('has valid career start date on January 1, 2024', () => {
    expect(CAREER_START_DATE.getUTCFullYear()).toBe(2024);
    expect(CAREER_START_DATE.getUTCMonth()).toBe(0); // 0-indexed month 0 is January
    expect(CAREER_START_DATE.getUTCDate()).toBe(1);
  });

  it('calculates completed years of experience accurately across milestones', () => {
    // Before career start date or epoch:
    expect(getYearsOfExperience(new Date('1970-01-01T00:00:00Z'))).toBe(0);
    expect(getYearsOfExperience(new Date('2023-12-31T23:59:59Z'))).toBe(0);

    // Before completing 1 full year:
    expect(getYearsOfExperience(new Date('2024-05-01T00:00:00Z'))).toBe(1);

    // After 1 full year:
    expect(getYearsOfExperience(new Date('2025-01-01T00:00:00Z'))).toBe(1);

    // Right before 2 full years:
    expect(getYearsOfExperience(new Date('2025-12-31T23:59:59Z'))).toBe(1);

    // After 2 full years:
    expect(getYearsOfExperience(new Date('2026-01-01T00:00:00Z'))).toBe(2);

    // Right before 3 full years:
    expect(getYearsOfExperience(new Date('2026-12-31T23:59:59Z'))).toBe(2);

    // At 3 full years:
    expect(getYearsOfExperience(new Date('2027-01-01T00:00:00Z'))).toBe(3);

    // In 2028 milestone:
    expect(getYearsOfExperience(new Date('2028-01-01T00:00:00Z'))).toBe(4);
  });

  it('formats sentence experience snippets in English and Spanish', () => {
    const fixed2026 = new Date('2026-10-14T00:00:00Z');
    expect(formatYearsOfExperience('en', fixed2026)).toBe('2+ years');
    expect(formatYearsOfExperience('es', fixed2026)).toBe('más de 2 años');

    const lastDayOf2026 = new Date('2026-12-31T23:59:59Z');
    expect(formatYearsOfExperience('en', lastDayOf2026)).toBe('2+ years');
    expect(formatYearsOfExperience('es', lastDayOf2026)).toBe('más de 2 años');

    const january2027 = new Date('2027-01-01T00:00:00Z');
    expect(formatYearsOfExperience('en', january2027)).toBe('3+ years');
    expect(formatYearsOfExperience('es', january2027)).toBe('más de 3 años');

    const fixed2028 = new Date('2028-09-01T00:00:00Z');
    expect(formatYearsOfExperience('en', fixed2028)).toBe('4+ years');
    expect(formatYearsOfExperience('es', fixed2028)).toBe('más de 4 años');
  });

  it('formats Hero kicker pills in English and Spanish', () => {
    const fixed2026 = new Date('2026-10-14T00:00:00Z');
    expect(formatHeroKicker('en', fixed2026)).toBe('Full-Stack Engineer · 2+ years in production');
    expect(formatHeroKicker('es', fixed2026)).toBe('Ingeniero Full-Stack · Más de 2 años en producción');

    const fixed2029 = new Date('2029-08-01T00:00:00Z');
    expect(formatHeroKicker('en', fixed2029)).toBe('Full-Stack Engineer · 5+ years in production');
    expect(formatHeroKicker('es', fixed2029)).toBe('Ingeniero Full-Stack · Más de 5 años en producción');
  });
});
