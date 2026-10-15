import { describe, expect, it } from 'vitest';
import {
  CAREER_START_DATE,
  formatHeroKicker,
  formatYearsOfExperience,
  getYearsOfExperience,
} from './experience';

describe('Experience Calculation Utilities', () => {
  it('has valid career start date in August 2023', () => {
    expect(CAREER_START_DATE.getUTCFullYear()).toBe(2023);
    expect(CAREER_START_DATE.getUTCMonth()).toBe(7); // 0-indexed month 7 is August
  });

  it('calculates completed years of experience accurately across milestones', () => {
    // Before career start date or epoch:
    expect(getYearsOfExperience(new Date('1970-01-01T00:00:00Z'))).toBe(0);
    expect(getYearsOfExperience(new Date('2023-07-31T00:00:00Z'))).toBe(0);

    // Before completing 1 full year:
    expect(getYearsOfExperience(new Date('2024-05-01T00:00:00Z'))).toBe(1);

    // After 1 full year:
    expect(getYearsOfExperience(new Date('2024-08-01T00:00:00Z'))).toBe(1);

    // After 2 full years:
    expect(getYearsOfExperience(new Date('2025-08-01T00:00:00Z'))).toBe(2);

    // Right before 3 full years:
    expect(getYearsOfExperience(new Date('2026-07-31T00:00:00Z'))).toBe(2);

    // At 3 full years:
    expect(getYearsOfExperience(new Date('2026-08-01T00:00:00Z'))).toBe(3);

    // In 2027 milestone:
    expect(getYearsOfExperience(new Date('2027-08-01T00:00:00Z'))).toBe(4);
  });

  it('formats sentence experience snippets in English and Spanish', () => {
    const fixed2026 = new Date('2026-10-14T00:00:00Z');
    expect(formatYearsOfExperience('en', fixed2026)).toBe('3+ years');
    expect(formatYearsOfExperience('es', fixed2026)).toBe('más de 3 años');

    const fixed2027 = new Date('2027-09-01T00:00:00Z');
    expect(formatYearsOfExperience('en', fixed2027)).toBe('4+ years');
    expect(formatYearsOfExperience('es', fixed2027)).toBe('más de 4 años');
  });

  it('formats Hero kicker pills in English and Spanish', () => {
    const fixed2026 = new Date('2026-10-14T00:00:00Z');
    expect(formatHeroKicker('en', fixed2026)).toBe('Full-Stack Engineer · 3+ years in production');
    expect(formatHeroKicker('es', fixed2026)).toBe('Ingeniero Full-Stack · Más de 3 años en producción');

    const fixed2028 = new Date('2028-08-01T00:00:00Z');
    expect(formatHeroKicker('en', fixed2028)).toBe('Full-Stack Engineer · 5+ years in production');
    expect(formatHeroKicker('es', fixed2028)).toBe('Ingeniero Full-Stack · Más de 5 años en producción');
  });
});
