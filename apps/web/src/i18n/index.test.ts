import { describe, expect, it } from 'vitest';
import {
  DEFAULT_LOCALE,
  LOCALES,
  getAlternateLocale,
  getAlternatePath,
  getLocalizedPath,
  getTranslations,
  isValidLocale,
} from './index';
import { en } from './locales/en';
import { es } from './locales/es';

describe('i18n core utilities', () => {
  it('defines default locale as en', () => {
    expect(DEFAULT_LOCALE).toBe('en');
    expect(LOCALES).toEqual(['en', 'es']);
  });

  it('validates locales with isValidLocale', () => {
    expect(isValidLocale('en')).toBe(true);
    expect(isValidLocale('es')).toBe(true);
    expect(isValidLocale('fr')).toBe(false);
    expect(isValidLocale('')).toBe(false);
  });

  it('retrieves correct translation dictionary', () => {
    expect(getTranslations('en')).toBe(en);
    expect(getTranslations('es')).toBe(es);
    expect(getTranslations()).toBe(en);
    expect(getTranslations('unknown')).toBe(en);
  });

  it('toggles alternate locale', () => {
    expect(getAlternateLocale('en')).toBe('es');
    expect(getAlternateLocale('es')).toBe('en');
  });

  it('computes localized path', () => {
    expect(getLocalizedPath('/', 'en')).toBe('/');
    expect(getLocalizedPath('/', 'es')).toBe('/es');
    expect(getLocalizedPath('#about', 'en')).toBe('/#about');
    expect(getLocalizedPath('#about', 'es')).toBe('/es/#about');
    expect(getLocalizedPath('/blog/', 'en')).toBe('/blog/');
  });

  it('computes alternate path for navigation and toggle', () => {
    expect(getAlternatePath('/', 'es')).toBe('/es');
    expect(getAlternatePath('/es', 'en')).toBe('/');
    expect(getAlternatePath('/es#experience', 'en')).toBe('/#experience');
    expect(getAlternatePath('/#experience', 'es')).toBe('/es#experience');
    expect(getAlternatePath('/blog/', 'es')).toBe('/blog/');
  });

  it('maintains 100% key parity and structural equality between en and es dictionaries', () => {
    function compareObjectKeys(obj1: Record<string, unknown>, obj2: Record<string, unknown>, path = ''): void {
      const keys1 = Object.keys(obj1).sort();
      const keys2 = Object.keys(obj2).sort();
      expect(keys2, `Key mismatch at ${path}`).toEqual(keys1);

      for (const key of keys1) {
        const val1 = obj1[key];
        const val2 = obj2[key];
        const currentPath = path ? `${path}.${key}` : key;

        expect(typeof val2, `Type mismatch at ${currentPath}`).toBe(typeof val1);

        if (Array.isArray(val1)) {
          expect(Array.isArray(val2), `Array mismatch at ${currentPath}`).toBe(true);
          expect((val2 as unknown[]).length, `Array length mismatch at ${currentPath}`).toBe((val1 as unknown[]).length);
          for (let i = 0; i < (val1 as unknown[]).length; i++) {
            if (typeof (val1 as unknown[])[i] === 'object' && (val1 as unknown[])[i] !== null) {
              compareObjectKeys((val1 as unknown[])[i] as Record<string, unknown>, (val2 as unknown[])[i] as Record<string, unknown>, `${currentPath}[${i}]`);
            }
          }
        } else if (typeof val1 === 'object' && val1 !== null) {
          compareObjectKeys(val1 as Record<string, unknown>, val2 as Record<string, unknown>, currentPath);
        }
      }
    }

    compareObjectKeys(en, es);
  });
});
