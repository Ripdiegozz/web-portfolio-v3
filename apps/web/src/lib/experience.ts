import type { Locale } from '../i18n/types';

/** Career start date: August 1, 2023 (SuperGIROS software engineering internship) */
export const CAREER_START_DATE = new Date('2023-08-01T00:00:00Z');

/**
 * Calculates completed full years of professional experience from the career start date.
 */
export function getYearsOfExperience(referenceDate: Date = new Date()): number {
  let years = referenceDate.getUTCFullYear() - CAREER_START_DATE.getUTCFullYear();
  const monthDiff = referenceDate.getUTCMonth() - CAREER_START_DATE.getUTCMonth();
  const dayDiff = referenceDate.getUTCDate() - CAREER_START_DATE.getUTCDate();

  if (monthDiff < 0 || (monthDiff === 0 && dayDiff < 0)) {
    years -= 1;
  }
  return Math.max(1, years);
}

/**
 * Formats the experience snippet for sentences:
 * - 'en': '3+ years'
 * - 'es': 'más de 3 años'
 */
export function formatYearsOfExperience(
  locale: Locale,
  referenceDate: Date = new Date()
): string {
  const years = getYearsOfExperience(referenceDate);
  if (locale === 'es') {
    return `más de ${years} años`;
  }
  return `${years}+ years`;
}

/**
 * Formats the kicker pill text for the Hero section:
 * - 'en': 'Full-Stack Engineer · 3+ years in production'
 * - 'es': 'Ingeniero Full-Stack · Más de 3 años en producción'
 */
export function formatHeroKicker(
  locale: Locale,
  referenceDate: Date = new Date()
): string {
  const years = getYearsOfExperience(referenceDate);
  if (locale === 'es') {
    return `Ingeniero Full-Stack · Más de ${years} años en producción`;
  }
  return `Full-Stack Engineer · ${years}+ years in production`;
}
