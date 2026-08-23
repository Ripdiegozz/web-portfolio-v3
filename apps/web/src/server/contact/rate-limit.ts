import type { KVLike } from '../types';

export interface RateLimiter {
  allow(clientKey: string): Promise<boolean>;
}

function kvCounterLimiter(kv: KVLike, ttlSeconds: number, max: number): RateLimiter {
  return {
    async allow(clientKey) {
      const key = `rl:${clientKey}`;
      const current = parseInt((await kv.get(key)) ?? '0', 10);
      if (current >= max) return false;
      const next = current + 1;
      // Fixed window: TTL anchored on first increment of the window.
      await kv.put(key, String(next), current === 0 ? { expirationTtl: ttlSeconds } : undefined);
      return next <= max;
    },
  };
}

/** Same algorithm against an in-memory store — used by tests and E2E mocks. */
export function memoryRateLimiter(max: number): RateLimiter & { counts: Map<string, number> } {
  const counts = new Map<string, number>();
  return {
    counts,
    async allow(clientKey) {
      const next = (counts.get(clientKey) ?? 0) + 1;
      counts.set(clientKey, next);
      return next <= max;
    },
  };
}

export const kvRateLimiter = (kv: KVLike, ttlSeconds: number, max = 2): RateLimiter =>
  kvCounterLimiter(kv, ttlSeconds, max);
