import { en } from './locales/en';
import { es } from './locales/es';
import type { Locale, TranslationDictionary } from './types';

export * from './types';

export const LOCALES: readonly Locale[] = ['en', 'es'] as const;
export const DEFAULT_LOCALE: Locale = 'en';

const dictionaries: Record<Locale, TranslationDictionary> = {
  en,
  es,
};

export function getTranslations(locale?: string): TranslationDictionary {
  if (locale === 'es') return dictionaries.es;
  return dictionaries.en;
}

export function isValidLocale(locale: string): locale is Locale {
  return (LOCALES as readonly string[]).includes(locale);
}

export function getAlternateLocale(currentLocale: Locale): Locale {
  return currentLocale === 'en' ? 'es' : 'en';
}

export function getLocalizedPath(hashOrPath: string, locale: Locale): string {
  const base = locale === 'es' ? '/es' : '';
  if (hashOrPath.startsWith('#')) {
    return `${base}/${hashOrPath}`;
  }
  if (hashOrPath === '/' || hashOrPath === '') {
    return locale === 'es' ? '/es' : '/';
  }
  return hashOrPath;
}

/**
 * Returns the alternate route for switching between locales while preserving paths and hashes.
 * If path is on /blog/*, blog remains unlocalized (/blog/...).
 */
export function getAlternatePath(currentPath: string, targetLocale: Locale): string {
  // If blog route, keep as is
  if (currentPath.startsWith('/blog')) {
    return currentPath;
  }

  // Parse path and hash
  const [pathPart = '', hashPart = ''] = currentPath.split('#');
  const hashSuffix = hashPart ? `#${hashPart}` : '';

  // Clean path
  let cleanPath = pathPart.replace(/^\/es(?:\/|$)/, '/');
  if (!cleanPath.startsWith('/')) {
    cleanPath = `/${cleanPath}`;
  }

  if (targetLocale === 'es') {
    if (cleanPath === '/' || cleanPath === '') {
      return `/es${hashSuffix}`;
    }
    return `/es${cleanPath.replace(/\/$/, '')}${hashSuffix}`;
  }

  // Target locale is 'en'
  if (cleanPath === '/' || cleanPath === '') {
    return `/${hashSuffix}`;
  }
  return `${cleanPath}${hashSuffix}`;
}
