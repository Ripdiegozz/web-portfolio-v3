import type { Locale } from '../i18n/types';

/** Career start date: January 1, 2024 (SuperGIROS, Full Stack Developer - Trainee) */
export const CAREER_START_DATE = new Date('2024-01-01T00:00:00Z');

/**
 * Calculates completed full years of professional experience from the career start date.
 */
export function getYearsOfExperience(referenceDate: Date = new Date()): number {
  if (referenceDate < CAREER_START_DATE) {
    return 0;
  }
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
 * - 'en': '2+ years'
 * - 'es': 'más de 2 años'
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
 * - 'en': 'Full-Stack Engineer · 2+ years in production'
 * - 'es': 'Ingeniero Full-Stack · Más de 2 años en producción'
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
