import { describe, expect, it } from 'vitest';
import { resolveInitialTheme } from './theme';

describe('resolveInitialTheme', () => {
  it('uses stored dark override over system preference', () => {
    expect(resolveInitialTheme(false, 'dark')).toBe('dark');
  });
  it('uses stored light override even when system prefers dark', () => {
    expect(resolveInitialTheme(true, 'light')).toBe('light');
  });
  it('falls back to system preference when nothing stored', () => {
    expect(resolveInitialTheme(true, null)).toBe('dark');
    expect(resolveInitialTheme(false, null)).toBe('light');
  });
  it('ignores invalid stored values', () => {
    expect(resolveInitialTheme(true, 'banana')).toBe('dark');
  });
});
