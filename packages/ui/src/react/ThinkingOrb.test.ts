import { describe, expect, it } from 'vitest';
import { ThinkingOrb } from './ThinkingOrb';

describe('ThinkingOrb component', () => {
  it('is exported and defined', () => {
    expect(ThinkingOrb).toBeDefined();
    expect(typeof ThinkingOrb).toBe('function');
  });
});
