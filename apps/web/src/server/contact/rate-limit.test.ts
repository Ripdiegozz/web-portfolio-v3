import { describe, expect, it } from 'vitest';
import { kvRateLimiter, memoryRateLimiter } from './rate-limit';

describe('rate limiter', () => {
  it('allows requests up to the daily max then blocks', async () => {
    const limiter = memoryRateLimiter(2);
    expect(await limiter.allow('ip-a')).toBe(true);
    expect(await limiter.allow('ip-a')).toBe(true);
    expect(await limiter.allow('ip-a')).toBe(false);
  });
  it('tracks clients independently', async () => {
    const limiter = memoryRateLimiter(1);
    expect(await limiter.allow('ip-a')).toBe(true);
    expect(await limiter.allow('ip-b')).toBe(true);
  });
  it('kv-backed limiter counts and persists window', async () => {
    const store = new Map<string, string>();
    const kv = {
      get: async (k: string) => store.get(k) ?? null,
      put: async (k: string, v: string) => { store.set(k, v); },
    };
    const limiter = kvRateLimiter(kv, 86_400);
    expect(await limiter.allow('ip-x')).toBe(true);
    expect(store.get('rl:ip-x')).toBe('1');
    expect(await limiter.allow('ip-x')).toBe(true);
    expect(await limiter.allow('ip-x')).toBe(false);
  });
});
