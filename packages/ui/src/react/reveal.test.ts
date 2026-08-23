import { describe, expect, it } from 'vitest';
import { revealPropsFor } from './Reveal';

describe('revealPropsFor', () => {
  it('returns animated props when motion allowed', () => {
    const props = revealPropsFor(false);
    expect(props.initial).toEqual({ opacity: 0, y: 16 });
    expect(props.whileInView).toEqual({ opacity: 1, y: 0 });
  });
  it('returns static props under prefers-reduced-motion', () => {
    const props = revealPropsFor(true);
    expect(props.initial).toBeUndefined();
    expect(props.whileInView).toBeUndefined();
  });
});
